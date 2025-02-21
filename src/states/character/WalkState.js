import {State} from'./State'

export class BaseWalkState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.play('walking');
    }
}


export class EnemyWalkState extends BaseWalkState {
    update(deltaTime) {
        const ai = this.entity.getComponent('AIComponent');
        const movement = this.entity.getComponent('MovementComponent');
        const target = ai?.getTarget();

        if (!target) {
            this.stateMachine.setState('idle');
            return;
        }

        const distance = this.entity.mesh.position.distanceTo(target.position);

        // 检查是否在攻击范围内
        if (distance <= ai.attackRange) {
            const combat = this.entity.getComponent('CombatComponent');
            if (combat?.canAttack()) {
                this.stateMachine.setState('attack');
                return;
            }
        }
        // 检查是否超出追击范围
        else if (distance > ai.detectionRange) {
            this.stateMachine.setState('idle');
            return;
        }

        // 计算移动方向并执行移动
        const direction = new THREE.Vector3()
            .subVectors(target.position, this.entity.mesh.position)
            .normalize();
        
        movement.move(direction, deltaTime);

        // 使敌人面向目标
        this.entity.mesh.lookAt(target.position);
    }
}

export class WalkState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.play('walking');
    }

    update(deltaTime) {
        const input = this.entity.getComponent('InputComponent');
        const movement = this.entity.getComponent('MovementComponent');
        const combat = this.entity.getComponent('CombatComponent');

        const moveDirection = input.getMoveDirection();

        // 检查是否停止移动
        if (moveDirection.lengthSq() === 0) {
            this.stateMachine.setState('idle');
            return;
        }

        // 检查攻击输入
        if (input.isActionPressed('attack') && combat.canAttack()) {
            this.stateMachine.setState('attack');
            return;
        }

        // 执行移动
        movement.move(moveDirection, deltaTime);
    }
}