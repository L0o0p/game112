import {State} from'./State'

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