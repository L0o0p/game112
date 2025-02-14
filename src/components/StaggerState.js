import * as THREE from 'three';

export class StaggerState {
    constructor() {
        this.isStaggered = false;
        this.staggerTime = 0;
        this.knockbackDirection = new THREE.Vector3();
        this.knockbackForce = 0;
        this.knockbackResistance = 0;
    }

    startStagger(duration, direction, force) {
        this.isStaggered = true;
        this.staggerTime = duration;
        this.knockbackDirection.copy(direction).normalize();
        this.knockbackForce = force * (1 - this.knockbackResistance);
    }

    update(deltaTime) {
        if (this.isStaggered) {
            this.staggerTime -= deltaTime;
            if (this.staggerTime <= 0) {
                this.isStaggered = false;
                this.knockbackForce = 0;
            }
        }
    }

    getKnockbackMovement(deltaTime) {
        if (!this.isStaggered || this.knockbackForce <= 0) {
            return new THREE.Vector3();
        }

        const movement = this.knockbackDirection.clone()
            .multiplyScalar(this.knockbackForce * deltaTime);
        
        // 随时间减弱击退力度
        this.knockbackForce *= 0.9; // 可以调整这个值来改变击退减弱的速度

        return movement;
    }
}