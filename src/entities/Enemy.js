import * as THREE from 'three';
import { Entity } from './Entity';
import { StateMachine } from '../states/StateMachine';
import { EnemyIdleState } from '../states/character/IdleState';
import { EnemyWalkState } from '../states/character/WalkState';
import { AttackState } from '../states/character/AttackState';
import { HitState } from '../states/character/HitState';
import { DeathState } from '../states/character/DeathState';
import { AnimatorComponent } from '../components/AnimatorComponent';
import { HealthComponent } from '../components/HealthComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CombatComponent } from '../components/CombatComponent';
import { AIComponent } from '../components/AIComponent';
import { ColliderComponent } from '../components/ColliderComponent';

export class Enemy extends Entity {
    constructor(enemyMesh, animations, position) {
        super();
        
        if (!enemyMesh) {
            throw new Error('enemyMesh is required');
        }

        this.name = 'enemy';
        this.addTag('enemy');

        // 设置网格
        this.setMesh(enemyMesh);
        if (position) {
            this.mesh.position.copy(position);
        }
        this.mesh.userData.isEnemy = true;

        // 初始化组件
        this.initComponents(enemyMesh, animations);

        // 初始化状态机
        this.initStateMachine();

        // 初始化事件监听
        this.initEventListeners();
    }

    initComponents(enemyMesh, animations) {
        // 添加动画组件
        this.addComponent(new AnimatorComponent({
            mesh: enemyMesh,
            animations: animations,
            defaultAnimation: 'idle'
        }));

        // 添加生命值组件
        this.addComponent(new HealthComponent({
            maxHealth: 100,
            invulnerableTime: 0.5
        }));

        // 添加移动组件
        this.addComponent(new MovementComponent({
            speed: 3,
            rotationSpeed: 5,
            knockbackResistance: 0.3
        }));

        // 添加战斗组件
        this.addComponent(new CombatComponent({
            damage: 10,
            attackRange: 1.5,
            attackCooldown: 1.45
        }));

        // 添加AI组件
        this.addComponent(new AIComponent({
            detectionRange: 10,
            attackRange: 1.5,
            updateInterval: 0.1
        }));

        // 添加碰撞组件
        this.addComponent(new ColliderComponent({
            radius: 0.5,
            height: 2
        }));
    }

    initStateMachine() {
        this.stateMachine = new StateMachine(this);

        // 添加状态
        this.stateMachine.addState('idle', EnemyIdleState);
        this.stateMachine.addState('chase', EnemyWalkState);
        this.stateMachine.addState('attack', AttackState);
        this.stateMachine.addState('hit', HitState);
        this.stateMachine.addState('death', DeathState);

        // 设置初始状态
        this.stateMachine.setState('idle');
    }

    initEventListeners() {
        // 受伤事件        
        this.on('damage.taken', (data) => {
            const health = this.getComponent('HealthComponent');
            if (health.canTakeDamage()) {
                console.log('dataX',data);
                
                health.takeDamage(data.amount);
                this.handleDamage(data);
            }
        });

        // 死亡事件
        this.on('health.zero', () => {
            this.die();
        });
    }

    handleDamage(damageData) {        
        const movement = this.getComponent('MovementComponent');
        const ai = this.getComponent('AIComponent');
        console.log('damageData.source',damageData);

        // 应用击退效果
        if (damageData.source && movement) {

            const knockbackDirection = new THREE.Vector3()
                .subVectors(this.mesh.position, damageData.source.position)
                .normalize();

            movement.applyKnockback(knockbackDirection, damageData.force || 10);
        }

        // 更新AI目标
        if (damageData.attacker && ai) {
            ai.setTarget(damageData.attacker);
        }

        // 切换到受击状态
        if (this.stateMachine.currentState.Name !== 'death') {
            this.stateMachine.setState('hit');
        }
    }

    attack(target) {
        const combat = this.getComponent('CombatComponent');
        if (!combat || !target) return;

        if (!combat.canAttack()) return;

        combat.startAttack();
        this.stateMachine.setState('attack');

        // 面向目标
        this.mesh.lookAt(target.position);

        // 发送攻击事件
        this.emit('enemy.attack', {
            attacker: this,
            position: this.mesh.position.clone(),
            direction: new THREE.Vector3().subVectors(target.position, this.mesh.position).normalize(),
            damage: combat.damage,
            range: combat.attackRange,
            type: 'melee'
        });

        // 延迟检测实际伤害（与动画同步）
        setTimeout(() => {
            this.checkAttackHit(target);
        }, 300); // 根据动画时间调整
    }

    checkAttackHit(target) {
        const combat = this.getComponent('CombatComponent');
        if (!combat || !target) return;

        const distance = this.mesh.position.distanceTo(target.position);
        if (distance <= combat.attackRange) {
            target.emit('damage.taken', {
                amount: combat.damage,
                source: this,
                direction: new THREE.Vector3().subVectors(target.position, this.mesh.position).normalize(),
                force: 8,
                type: 'melee'
            });
        }
    }

    die() {
        this.stateMachine.setState('death');
        this.emit('enemy.died', {
            position: this.mesh.position.clone()
        });
    }

    update(deltaTime) {
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // 更新基类
        super.update(clampedDeltaTime);

        // 如果已死亡，不再更新
        if (this.stateMachine.currentState.Name === 'death') {
            return;
        }

        // 更新状态机
        this.stateMachine.update(deltaTime);

        // 更新AI行为
        const ai = this.getComponent('AIComponent');
        const movement = this.getComponent('MovementComponent');
        
        if (ai && movement && !movement.isKnockedBack) {
            const target = ai.getTarget();
            if (target) {
                const distance = this.mesh.position.distanceTo(target.position);
                
                // 根据距离决定行为
                if (distance <= ai.attackRange && 
                    this.stateMachine.currentState.Name !== 'attack' && 
                    this.stateMachine.currentState.Name !== 'hit') {
                    this.attack(target);
                } else if (distance <= ai.detectionRange && 
                    this.stateMachine.currentState.Name !== 'chase' && 
                    this.stateMachine.currentState.Name !== 'attack' && 
                    this.stateMachine.currentState.Name !== 'hit') {
                    this.stateMachine.setState('chase');
                }
            }
        }

        // 检查碰撞
        const collider = this.getComponent('ColliderComponent');
        if (collider && collider.checkCollisions()) {
            movement.resolveCollision();
        }
    }

    setTarget(target) {
        const ai = this.getComponent('AIComponent');
        if (ai) {
            ai.setTarget(target);
        }
    }
}