// entities/Enemy.js
import * as THREE from 'three';
import { Entity } from './Entity';
import { AnimatorComponent } from '../components/AnimatorComponent';
import { HealthComponent } from '../components/HealthComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CombatComponent } from '../components/CombatComponent';
import { AIComponent } from '../components/AIComponent.js';

export class Enemy extends Entity {
    constructor(mesh, animations, position) {
        super();
        
        // 基础设置
        this.mesh = mesh;
        this.mesh.position.copy(position);
        this.mesh.userData.isEnemy = true;
        
        // 添加组件
        this.setupComponents(animations);
        
        // 配置AI参数
        this.configureAI();
    }

    setupComponents(animations) {
        // 动画控制
        this.addComponent(new AnimatorComponent({
            mesh: this.mesh,
            animations: animations,
            defaultAnimation: 'idle'
        }));

        // 生命值管理
        this.addComponent(new HealthComponent({
            maxHealth: 100,
            onDamage: this.onDamage.bind(this),
            onDeath: this.onDeath.bind(this)
        }));

        // 移动控制
        this.addComponent(new MovementComponent({
            speed: 3,
            rotationSpeed: 5
        }));

        // 战斗控制
        this.addComponent(new CombatComponent({
            damage: 10,
            attackRange: 1,
            attackCooldown: 1.45
        }));

        // AI控制
        this.addComponent(new AIComponent({
            detectionRange: 4,
            attackRange: 1,
            behaviors: this.getAIBehaviors()
        }));
    }

    configureAI() {
        const ai = this.getComponent('AIComponent');
        if (!ai) return;

        // 配置AI状态机
        ai.addState('idle', {
            enter: () => this.playAnimation('idle'),
            update: () => this.checkPlayerDistance()
        });

        ai.addState('chase', {
            enter: () => this.playAnimation('walking'),
            update: () => this.updateChase()
        });

        ai.addState('attack', {
            enter: () => this.startAttack(),
            update: () => this.updateAttack()
        });

        // 设置初始状态
        ai.setState('idle');
    }

    getAIBehaviors() {
        return {
            // 检测玩家行为
            detectPlayer: (playerPosition) => {
                if (!playerPosition) return false;
                const distance = this.mesh.position.distanceTo(playerPosition);
                return distance <= this.getComponent('AIComponent').detectionRange;
            },

            // 追击行为
            chase: (playerPosition) => {
                const movement = this.getComponent('MovementComponent');
                if (!movement || !playerPosition) return;

                const direction = new THREE.Vector3()
                    .subVectors(playerPosition, this.mesh.position)
                    .normalize();

                movement.moveInDirection(direction);
                this.mesh.lookAt(playerPosition);
            },

            // 攻击行为
            attack: (playerPosition) => {
                const combat = this.getComponent('CombatComponent');
                if (!combat || !playerPosition) return;

                if (combat.canAttack()) {
                    this.performAttack(playerPosition);
                }
            }
        };
    }

    update(deltaTime, playerPosition) {
        super.update(deltaTime);

        const ai = this.getComponent('AIComponent');
        if (ai) {
            ai.update(deltaTime, playerPosition);
        }
    }

    // 动画控制
    playAnimation(name, onComplete) {
        const animator = this.getComponent('AnimatorComponent');
        if (animator) {
            animator.play(name, onComplete);
        }
    }

    // 战斗相关
    performAttack(targetPosition) {
        const combat = this.getComponent('CombatComponent');
        if (!combat) return;

        this.playAnimation('attacking', () => {
            combat.resetCooldown();
            this.emit('enemy.attack', {
                position: this.mesh.position.clone(),
                target: targetPosition,
                damage: combat.damage
            });
        });
    }

    onDamage(damage, attackerPosition) {
        // 播放受击动画
        this.playAnimation('hit');

        // 击退效果
        const movement = this.getComponent('MovementComponent');
        if (movement && attackerPosition) {
            const knockbackDirection = new THREE.Vector3()
                .subVectors(this.mesh.position, attackerPosition)
                .normalize();
            movement.applyKnockback(knockbackDirection, 8);
        }
    }

    onDeath() {
        this.emit('enemy.died', {
            position: this.mesh.position.clone()
        });

        // 播放死亡动画
        this.playAnimation('death', () => {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        });
    }

    // 辅助方法
    checkPlayerDistance() {
        const ai = this.getComponent('AIComponent');
        if (!ai?.currentTarget) return;

        const distance = this.mesh.position.distanceTo(ai.currentTarget);
        if (distance <= ai.attackRange) {
            ai.setState('attack');
        } else if (distance <= ai.detectionRange) {
            ai.setState('chase');
        }
    }

    updateChase() {
        const ai = this.getComponent('AIComponent');
        if (!ai?.currentTarget) return;

        ai.behaviors.chase(ai.currentTarget);
        this.checkPlayerDistance();
    }

    updateAttack() {
        const ai = this.getComponent('AIComponent');
        const combat = this.getComponent('CombatComponent');
        
        if (!ai?.currentTarget || !combat) return;

        const distance = this.mesh.position.distanceTo(ai.currentTarget);
        if (distance > ai.attackRange) {
            ai.setState('chase');
            return;
        }

        if (combat.canAttack()) {
            ai.behaviors.attack(ai.currentTarget);
        }
    }
}