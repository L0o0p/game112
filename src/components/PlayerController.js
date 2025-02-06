import * as THREE from 'three';
import { AnimationController } from './AnimationController';

export class PlayerController {
    constructor(player) {
        this.mesh = player.playerMesh;
        this.moveSpeed = 5;
        this.velocity = new THREE.Vector3();
        this.previousPosition = this.mesh.position.clone();
        this.animator = new AnimationController(player.playerMesh,player.playerAnimations);
        console.log(this.animator);
        
    }

    update(deltaTime) {
                // 保存之前的位置
                const previousPosition = this.mesh.position.clone();
        // 获取游戏实例的输入系统
        const input = window.game.input;
        let isMoving = false;
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
           // 根据移动状态播放相应的动画
           if (isMoving) {
            this.animator.play('Jump'); // 或者你的模型中对应的动画名称
        } else {
            this.animator.play('Idle'); // 或者你的模型中对应的动画名称
        }


        // 检查碰撞
        const collision = window.game.collisionSystem.checkCollision(this.mesh);
        if (collision) {
            // 发生碰撞时恢复到之前的位置
            this.mesh.position.copy(previousPosition);
        }
// 更新动画
this.animator.update(deltaTime);
    }
}