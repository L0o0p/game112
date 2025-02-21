import * as THREE from 'three'

import { Component } from "./Component";

export class InputComponent extends Component {
    constructor(params = {}) {
        super();
        this.controls = {
            forward: params.controls?.forward || 'KeyW',
            backward: params.controls?.backward || 'KeyS',
            left: params.controls?.left || 'KeyA',
            right: params.controls?.right || 'KeyD',
            attack: params.controls?.attack || 'KeyJ',
            // 可以添加更多控制键
        };

        this.keys = new Set();
        this.moveDirection = new THREE.Vector3();

        // 绑定事件监听
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);

        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
    }

    handleKeyDown(event) {
        this.keys.add(event.code);
    }

    handleKeyUp(event) {
        this.keys.delete(event.code);
    }

    isActionPressed(action) {
        return this.keys.has(this.controls[action]);
    }

    getMoveDirection() {
        this.moveDirection.set(0, 0, 0);
        
        if (this.keys.has(this.controls.forward)) this.moveDirection.z -= 1;
        if (this.keys.has(this.controls.backward)) this.moveDirection.z += 1;
        if (this.keys.has(this.controls.left)) this.moveDirection.x -= 1;
        if (this.keys.has(this.controls.right)) this.moveDirection.x += 1;
        
        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
        }

        // 打印移动方向
        if (this.moveDirection.lengthSq() > 0) {
            console.log('Move direction:', this.moveDirection.toArray());
        }
        
        return this.moveDirection;
    }
}