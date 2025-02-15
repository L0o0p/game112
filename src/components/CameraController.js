import { Component } from "./Component";

// src/components/CameraController.js
import * as THREE from 'three'
export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.offset = new THREE.Vector3(0, 5, 10);
        this.smoothness = 0.1;
    }

    update() {
        if (this.target) {
            // 计算目标位置
            const targetPosition = this.target.position.clone().add(this.offset);
            // 平滑移动相机
            this.camera.position.lerp(targetPosition, this.smoothness);
            // 相机始终看向目标
            this.camera.lookAt(this.target.position);
        }
    }
}