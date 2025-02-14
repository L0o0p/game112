import * as THREE from 'three';

export class CombatSystem {
    constructor() {
        this.attackRange = 2; // 攻击范围
        this.attackAngle = Math.PI / 2; // 攻击角度范围（90度）
        this.entities = new Set();

        // 调试用的攻击范围可视化
        this.debugMesh = null;
        this.createDebugMesh();
    }

    createDebugMesh() {
        // 创建一个扇形几何体来显示攻击范围
        const geometry = new THREE.BufferGeometry();
        const segments = 32;
        const positions = [];

        // 添加扇形的顶点
        positions.push(0, 0, 0);
        for (let i = 0; i <= segments; i++) {
            const angle = (-this.attackAngle / 2) + (i / segments) * this.attackAngle;
            positions.push(
                Math.sin(angle) * this.attackRange,
                0,
                -Math.cos(angle) * this.attackRange
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const indices = [];
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }
        geometry.setIndex(indices);

        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        this.debugMesh = new THREE.Mesh(geometry, material);
        this.debugMesh.visible = false; // 默认隐藏
    }

    registerEntity(entity) {
        console.log('Registering entity in combat system:', entity);
        this.entities.add(entity);
    }

    unregisterEntity(entity) {
        console.log('Unregistering entity from combat system:', entity);
        this.entities.delete(entity);
    }

    handleAttack(attackData) {
        console.log('Combat system handling attack:', attackData);

        // 1. 变量名需要统一，attackerPosition 在后面用的是 attackPos
        const attackPos = attackData.position;
        const attacker = attackData.attacker;
        const damage = attackData.damage;
        const attackRange = attackData.range;  // 变量名也需要统一

        // 2. 确保 this.entities 存在且是可迭代的
        if (!this.entities) {
            console.error('No entities registered in combat system');
            return;
        }

        this.entities.forEach(entity => {
            if (entity === attacker) return; // 跳过攻击者自身

            // 3. 确保 entity 有 mesh 属性
            if (!entity.mesh) {
                console.warn('Entity has no mesh:', entity);
                return;
            }

            const distance = entity.mesh.position.distanceTo(attackPos);
            if (distance <= attackRange) {
                // 4. 方法名应该是小写的 emit 而不是 Broadcast
                entity.emit('damage.taken', {
                    damage: damage,
                    attacker: attacker
                });
            }
        });
    }
    
    checkHit(attackerPosition, attackerRotation) {
        const hits = [];
        const attackerDirection = new THREE.Vector3(0, 0, -1)
            .applyEuler(new THREE.Euler(0, attackerRotation, 0));

        for (const enemy of this.enemies) {
            const toEnemy = new THREE.Vector3()
                .subVectors(enemy.position, attackerPosition);

            // 检查距离
            const distance = toEnemy.length();
            if (distance > this.attackRange) continue;

            // 检查角度
            toEnemy.normalize();
            const angle = toEnemy.angleTo(attackerDirection);
            if (angle > this.attackAngle / 2) continue;

            hits.push(enemy);
        }

        return hits;
    }

    update(playerPosition, playerRotation) {
        // 更新调试网格的位置和旋转
        if (this.debugMesh) {
            this.debugMesh.position.copy(playerPosition);
            this.debugMesh.rotation.y = playerRotation;
        }
    }
}