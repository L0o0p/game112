import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.colliders = new Set();
    }

    addCollider(object) {
        // 添加碰撞盒
        const bbox = new THREE.Box3().setFromObject(object);
        object.bbox = bbox;
        this.colliders.add(object);
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