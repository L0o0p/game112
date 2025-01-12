import * as THREE from 'three';

export class PlayerController {
    constructor(mesh) {
        this.mesh = mesh;
        this.moveSpeed = 5;
        this.velocity = new THREE.Vector3();
        this.previousPosition = this.mesh.position.clone();
    }

    update(deltaTime) {
                // 保存之前的位置
                this.previousPosition.copy(this.mesh.position);
        // 获取游戏实例的输入系统
        const input = window.game.input;

        // 移动控制
        if (input.isKeyPressed('KeyW')) {
            this.mesh.position.z -= this.moveSpeed * deltaTime;
        }
        if (input.isKeyPressed('KeyS')) {
            this.mesh.position.z += this.moveSpeed * deltaTime;
        }
        if (input.isKeyPressed('KeyA')) {
            this.mesh.position.x -= this.moveSpeed * deltaTime;
        }
        if (input.isKeyPressed('KeyD')) {
            this.mesh.position.x += this.moveSpeed * deltaTime;
        }

        // 旋转控制
        if (input.isKeyPressed('KeyQ')) {
            this.mesh.rotation.y += 2 * deltaTime;
        }
        if (input.isKeyPressed('KeyE')) {
            this.mesh.rotation.y -= 2 * deltaTime;
        }


        // 检查碰撞
        const collision = window.game.collisionSystem.checkCollision(this.mesh);
        if (collision) {
            // 发生碰撞时恢复到之前的位置
            this.mesh.position.copy(this.previousPosition);
        }

    }
}