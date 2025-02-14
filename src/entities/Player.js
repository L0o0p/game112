import * as THREE from 'three';
import { AnimationController } from '../components/AnimationController';
import { StaggerState } from '../components/StaggerState';
import {Entity} from './Entity'

export class Player extends Entity {
    constructor(playerMesh, playerAnimations) {
        super()
        this.mesh = playerMesh;
        this.moveSpeed = 5;
        this.rotationSpeed = 10;
        this.animator = new AnimationController(playerMesh, playerAnimations);
        this.mesh.userData.isPlayer = true;
        
        // 移动相关
        this.targetRotation = 0;
        this.moveDirection = new THREE.Vector3();
        
        // 战斗相关
        this.health = 100;
        this.attackDamage = 25;
        this.attackRange = 2;
        this.attackCooldown = 0;
        this.attackCooldownTime = 1.0;
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.invulnerableTime = 0.5;
        
        // 击退状态
        this.staggerState = new StaggerState();
        this.staggerState.knockbackResistance = 0.2;
    }

    attack() {
        if (this.isAttacking || this.attackCooldown > 0) return;
        console.log('Starting attack...');
        // 开始攻击
        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownTime;

        // 播放攻击动画
        this.animator.playOneShot('attacking', () => {
            this.isAttacking = false;
            console.log('Attack animation completed');
        });

        // 广播攻击消息
        console.log('About to broadcast attack message');
        this.eventManager.emit('player.attack', {  // 直接使用 eventManager
            attacker: this,
            position: this.mesh.position.clone(),
            rotation: this.mesh.rotation.y,
            damage: this.attackDamage,
            range: 2
        });
        console.log('Attack message broadcasted');
        // // 获取攻击范围内的敌人
        // const hits = window.game.combatSystem.checkHit(
        //     this.mesh.position,
        //     this.mesh.rotation.y,
        //     this.attackRange
        // );

        // // 对命中的敌人造成伤害
        // for (const enemy of hits) {
        //     enemy.takeDamage(this.attackDamage, this.mesh.position);
        // }

        // // 触发攻击事件（如果需要）
        // const attackEvent = new CustomEvent('playerAttack', {
        //     detail: {
        //         attacker: this,
        //         position: this.mesh.position.clone(),
        //         damage: this.attackDamage
        //     }
        // });
        // window.dispatchEvent(attackEvent);
    }

    takeDamage(damage, attackerPosition) {
        if (this.isInvulnerable || !this.health) return;

        this.health -= damage;
        console.log(`Player took ${damage} damage! Current health: ${this.health}`);

        // 计算击退方向
        const knockbackDirection = new THREE.Vector3()
            .subVectors(this.mesh.position, attackerPosition);

        // 开始僵直和击退
        this.staggerState.startStagger(
            0.5, // 僵直时间
            knockbackDirection,
            10 // 击退力度
        );

        // 设置无敌时间
        this.isInvulnerable = true;
        setTimeout(() => {
            this.isInvulnerable = false;
        }, this.invulnerableTime * 1000);

        // 播放受伤动画
        this.animator.playOneShot('hit', () => {
            console.log('Hit animation completed');
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    // die() {
    //     this.health = 0;
    //     this.isAttacking = false;
    //     console.log('Player died!');
        
    //     // 播放死亡动画
    //     this.animator.playOneShot('death', () => {
    //         // 处理死亡后的逻辑
    //         window.game.gameOver();
    //     });
    // }
    die() {
        // 广播死亡消息
        this.emit({
            topic: 'player.died',
            value: {
                position: this.mesh.position.clone()
            }
        });

        console.log('Player died!');
        this.isAlive = false;
    }

    update(deltaTime) {
        // 更新状态
        this.staggerState.update(deltaTime);
        this.animator.update(deltaTime);

        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 如果在僵直状态，应用击退移动
        if (this.staggerState.isStaggered) {
            const knockbackMovement = this.staggerState.getKnockbackMovement(deltaTime);
            this.mesh.position.add(knockbackMovement);
            return; // 在僵直状态下不执行其他移动
        }

        const input = window.game.input;
        let isMoving = false;

        // 保存当前位置用于碰撞检测
        const previousPosition = this.mesh.position.clone();

        // 只有在不攻击时才能移动
        if (!this.isAttacking) {
            // 重置移动方向
            this.moveDirection.set(0, 0, 0);

            if (input.isKeyPressed('KeyW')) {
                this.moveDirection.z -= 1;
                isMoving = true;
            }
            if (input.isKeyPressed('KeyS')) {
                this.moveDirection.z += 1;
                isMoving = true;
            }
            if (input.isKeyPressed('KeyA')) {
                this.moveDirection.x -= 1;
                isMoving = true;
            }
            if (input.isKeyPressed('KeyD')) {
                this.moveDirection.x += 1;
                isMoving = true;
            }

            if (isMoving) {
                // 标准化移动方向
                this.moveDirection.normalize();

                // 计算目标旋转
                this.targetRotation = Math.atan2(this.moveDirection.x, -this.moveDirection.z);

                // 平滑旋转
                let rotationDiff = this.targetRotation - this.mesh.rotation.y;
                while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
                this.mesh.rotation.y += rotationDiff * this.rotationSpeed * deltaTime;

                // 应用移动
                this.mesh.position.x += this.moveDirection.x * this.moveSpeed * deltaTime;
                this.mesh.position.z += this.moveDirection.z * this.moveSpeed * deltaTime;
            }
        }

        // 攻击输入检测
        if (input.isKeyPressed('KeyJ') && !this.isAttacking && this.attackCooldown <= 0) {
            this.attack();
        }

        // 检查碰撞
        const collision = window.game.collisionSystem.checkCollision(this.mesh);
        if (collision) {
            this.mesh.position.copy(previousPosition);
        }

        // 更新动画状态
        if (!this.isAttacking && !this.staggerState.isStaggered) {
            if (isMoving) {
                this.animator.play('walking');
            } else {
                this.animator.play('idle');
            }
        }
    }
}