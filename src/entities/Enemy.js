import * as THREE from 'three'
import { AnimationController } from '../components/AnimationController';
import { StaggerState } from '../components/StaggerState';
import { Entity } from './Entity';

export class Enemy extends Entity {
    constructor(mesh, animations, position) {
        super()
        this.mesh = mesh;
        this.animations = animations;
        this.initialPosition = position.clone();

        // 设置初始位置和状态
        this.mesh.position.copy(position);
        this.mesh.userData.isEnemy = true;

        // 移除任何可能存在的控制器
        this.mesh.userData.controller = null;

        this.health = 100;
        this.isAlive = true;
        this.state = 'idle';

        this.moveSpeed = 3;
        this.detectionRange = 4;
        this.attackRange = 1;
        // 实际冷却
        this.attackCooldown = 0;
        // 固定冷却
        this.attackCooldownTime = 1.45; // 攻击冷却时间（秒）

        // 创建独立的动画混合器
        this.animator = new AnimationController(mesh, animations);
        // 添加击退状态管理
        this.staggerState = new StaggerState();
        this.staggerState.knockbackResistance = 0.3; // 敌人的击退抗性
    }

    update(deltaTime, playerPosition) {
        if (!this.isAlive || !playerPosition) return;

        // 更新动画
        this.animator.update(deltaTime);

        // 计算到玩家的距离
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);

        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 根据距离决定行为
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'idle';
            this.animator.play('idle');
            // // 在攻击范围内
            // this.state = 'attacking';
            // this.mesh.lookAt(playerPosition);

            // if (this.attackCooldown <= 0) {
            //     this.attack(playerPosition);
            // }
            // // 如果玩家在检测范围内，开始追击
        } else if (distanceToPlayer < this.detectionRange) {
            // 在追击范围内
            this.state = 'walking';

            // 计算方向向量
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, this.mesh.position)
                .normalize();

            // 移动敌人
            const movement = direction.multiplyScalar(this.moveSpeed * deltaTime);
            this.mesh.position.add(movement);

            // 更新朝向
            this.mesh.lookAt(playerPosition);

            // 播放行走动画
            this.animator.play('walking');
        } else {
            // 超出检测范围，待机状态
            this.state = 'idle';
            this.animator.play('idle');
        }
    }

    // attack(playerPosition) {
    //     // 播放攻击动画
    //     this.animator.play('attacking');

    //     // 设置攻击冷却
    //     this.attackCooldown = this.attackCooldownTime;

    //     // 触发攻击事件或直接调用伤害计算
    //     // 这里需要根据你的游戏系统来实现具体的伤害逻辑
    //     const attackEvent = new CustomEvent('enemyAttack', {
    //         detail: {
    //             attacker: this,
    //             position: this.mesh.position.clone(),
    //             damage: this.attackDamage
    //         }
    //     });
    //     window.dispatchEvent(attackEvent);

    //     // 可以添加攻击音效
    //     // if (this.attackSound) this.attackSound.play();
    // }
    attack(player) {
        if (this.isAttacking) return;

        this.isAttacking = true;

        // 广播攻击消息
        this.emit({
            topic: 'enemy.attack',
            value: {
                attacker: this,
                target: player,
                position: this.mesh.position.clone(),
                damage: this.attackDamage
            }
        });

        // 播放攻击动画
        this.animator.playOneShot('attacking', () => {
            this.isAttacking = false;
        });
    }

    takeDamage(damage) {
        if (!this.isAlive) return;

        this.health -= damage;
        if (this.health <= 0) {
            this.die();
        } else {
            // 计算击退方向
            const knockbackDirection = new THREE.Vector3()
                .subVectors(this.mesh.position, attackerPosition);

            // 开始僵直和击退
            this.staggerState.startStagger(
                0.3, // 僵直时间（秒）
                knockbackDirection,
                8 // 击退力度
            );

            // 播放受伤动画
            this.animator.playOneShot('hit', () => {
                // 受伤动画播放完成的回调
            });

            if (this.health <= 0) {
                this.die();
            }
        }
    }

    // die() {
    //     this.isAlive = false;
    //     // 可以添加死 亡效果
    //     if (this.mesh.parent) {
    //         this.mesh.parent.remove(this.mesh);
    //     }
    // }
    die() {
        // 广播死亡消息
        this.emit({
            topic: 'enemy.died',
            value: {
                position: this.mesh.position.clone()
            }
        });

        this.isAlive = false;
    }

    onAdd() {
        // 当组件被添加到实体时，设置实体的 mesh
        this.entity.setMesh(this.mesh);
    }
}