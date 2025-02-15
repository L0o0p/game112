import * as THREE from 'three'

import { Component } from "./Component";

export class ColliderComponent extends Component {
    constructor(params = {}) {
        super();
        this.radius = params.radius || 0.5;
        this.height = params.height || 2;
        
        // 可以添加更多碰撞参数
        this.offset = new THREE.Vector3(0, this.height / 2, 0);
        
        // 用于调试显示的碰撞体
        if (params.debug) {
            this.createDebugMesh();
        }
    }

    createDebugMesh() {
        const geometry = new THREE.CylinderGeometry(
            this.radius, this.radius, this.height, 8
        );
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });
        this.debugMesh = new THREE.Mesh(geometry, material);
        this.entity.mesh.add(this.debugMesh);
    }

    checkCollisions() {
        // 这里应该与游戏的碰撞系统交互
        // 返回是否发生碰撞
        return false;
    }

    getBoundingBox() {
        const position = this.entity.position.clone().add(this.offset);
        return {
            min: position.clone().sub(new THREE.Vector3(this.radius, this.height/2, this.radius)),
            max: position.clone().add(new THREE.Vector3(this.radius, this.height/2, this.radius))
        };
    }

    onRemove() {
        if (this.debugMesh) {
            this.entity.mesh.remove(this.debugMesh);
        }
    }
}