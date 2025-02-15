// components/MovementComponent.js
import * as THREE from 'three';
import { Component } from './Component';

export class MovementComponent extends Component {
    constructor(params = {}) {
        super();
        this.speed = params.speed || 5;
        this.rotationSpeed = params.rotationSpeed || 10;
        this.knockbackResistance = params.knockbackResistance || 0;

        this.moveDirection = new THREE.Vector3();
        this.targetRotation = 0;
        this.isKnockedBack = false;
        this.knockbackForce = new THREE.Vector3();

        // 移动状态
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
    }

    // 设置移动状态
    setMoveState(direction, value) {
        if (direction in this.moveState) {
            this.moveState[direction] = value;
        }
    }

    // 更新移动方向
    updateMoveDirection() {
        this.moveDirection.set(0, 0, 0);

        if (this.moveState.forward) this.moveDirection.z -= 1;
        if (this.moveState.backward) this.moveDirection.z += 1;
        if (this.moveState.left) this.moveDirection.x -= 1;
        if (this.moveState.right) this.moveDirection.x += 1;

        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
        }
    }

    // components/MovementComponent.js
    move(direction, deltaTime) {
        if (!this.entity?.mesh || this.isKnockedBack) return false;

        // 使用传入的方向而不是内部的moveDirection
        if (direction.lengthSq() > 0) {
            // 计算目标旋转角度
            this.targetRotation = Math.atan2(direction.x, direction.z);

            // 当前旋转角度
            let currentRotation = this.entity.mesh.rotation.y;
            let rotationDiff = this.targetRotation - currentRotation;

            // 确保旋转差值在 -PI 到 PI 之间
            if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

            // 应用旋转
            this.entity.mesh.rotation.y += rotationDiff * this.rotationSpeed * deltaTime;

            // 应用移动
            const moveVector = direction.normalize().multiplyScalar(this.speed * deltaTime);
            this.entity.mesh.position.add(moveVector);

            return true;
        }

        return false;
    }

    applyKnockback(direction, force) {
        if (!this.entity?.mesh) return;

        // 应用击退抗性
        const effectiveForce = force * (1 - this.knockbackResistance);

        // 如果力度太小，不处理击退
        if (effectiveForce < 0.1) return;

        this.isKnockedBack = true;
        this.knockbackTimer = 0;
        this.knockbackDuration = 0.3; // 击退持续时间（秒）

        // 设置击退力度和方向
        this.knockbackForce.copy(direction)
            .normalize()
            .multiplyScalar(effectiveForce);

        // 发出击退事件
        this.entity.emit('knockback.start', {
            direction: direction,
            force: effectiveForce
        });
    }

    resolveCollision() {
        if (!this.entity?.mesh) return;

        // 获取场景中的所有物体
        const scene = this.entity.mesh.parent;
        if (!scene) return;

        const position = this.entity.mesh.position;
        let hasCollision = false;

        // 检查与其他物体的碰撞
        scene.children.forEach(object => {
            // 跳过自身
            if (object === this.entity.mesh) return;

            // 如果物体有碰撞盒
            if (object.userData.collidable) {
                const objectPosition = object.position;
                const distance = position.distanceTo(objectPosition);
                const minDistance = this.collisionRadius + (object.userData.collisionRadius || 0.5);

                // 如果发生碰撞
                if (distance < minDistance) {
                    hasCollision = true;

                    // 计算推开向量
                    const pushDirection = new THREE.Vector3()
                        .subVectors(position, objectPosition)
                        .normalize()
                        .multiplyScalar(minDistance - distance);

                    // 应用推开力
                    position.add(pushDirection);

                    // 发出碰撞事件
                    this.entity.emit('collision', {
                        object: object,
                        pushDirection: pushDirection
                    });
                }
            }
        });

        return hasCollision;
    }

    update(deltaTime) {
        if (!this.entity?.mesh) return;

        // 处理击退状态
        if (this.isKnockedBack) {
            this.knockbackTimer += deltaTime;

            if (this.knockbackTimer >= this.knockbackDuration) {
                // 结束击退状态
                this.isKnockedBack = false;
                this.knockbackForce.set(0, 0, 0);
                this.entity.emit('knockback.end');
            } else {
                // 应用击退力
                const knockbackMovement = this.knockbackForce.clone()
                    .multiplyScalar(deltaTime)
                    .multiplyScalar(1 - (this.knockbackTimer / this.knockbackDuration));

                this.entity.mesh.position.add(knockbackMovement);
            }
        }

        // 解决碰撞
        if (this.resolveCollision()) {
            // 如果发生碰撞，可以在这里添加额外的处理
        }
    }

    // 辅助方法
    setSpeed(speed) {
        this.speed = speed;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    setKnockbackResistance(resistance) {
        this.knockbackResistance = Math.max(0, Math.min(1, resistance));
    }

    isMoving() {
        return this.moveDirection.lengthSq() > 0;
    }

    getPosition() {
        return this.entity?.mesh?.position || new THREE.Vector3();
    }

    getRotation() {
        return this.entity?.mesh?.rotation.y || 0;
    }
}