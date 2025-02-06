import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.colliders = new Set();
    }

    addCollider(object) {
        const bbox = new THREE.Box3().setFromObject(object);
        object.bbox = bbox;
        this.colliders.add(object);

        if (this.debug) {
            // 创建碰撞体的可视化边界框
            const helper = new THREE.Box3Helper(bbox, 0xff0000);
            this.scene.add(helper);
            object.debugHelper = helper;
        }
    }

    update() {
        // 更新所有碰撞体的边界框
        for (const collider of this.colliders) {
            collider.bbox.setFromObject(collider);
            if (this.debug && collider.debugHelper) {
                collider.debugHelper.updateMatrixWorld(true);
            }
        }
    }

    removeCollider(object) {
        this.colliders.delete(object);
    }

    checkCollision(object) {
        const objectBox = object.bbox.clone();
        objectBox.setFromObject(object);

        for (const other of this.colliders) {
            if (other === object) continue;

            const otherBox = other.bbox.clone();
            otherBox.setFromObject(other);

            if (objectBox.intersectsBox(otherBox)) {
                return other;
            }
        }
        return null;
    }
}