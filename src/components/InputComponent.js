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
        const direction = new THREE.Vector3();

        if (this.isActionPressed('forward')) direction.z -= 1;
        if (this.isActionPressed('backward')) direction.z += 1;
        if (this.isActionPressed('left')) direction.x -= 1;
        if (this.isActionPressed('right')) direction.x += 1;

        if (direction.lengthSq() > 0) {
            direction.normalize();
        }

        return direction;
    }

    onRemove() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
    }
}