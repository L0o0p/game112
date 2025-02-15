import {State} from'./State'

export class IdleState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.play('idle');
    }

    update(deltaTime) {
        const input = this.entity.getComponent('InputComponent');
        const combat = this.entity.getComponent('CombatComponent');

        // 检查移动输入
        if (input.getMoveDirection().lengthSq() > 0) {
            this.stateMachine.setState('walk');
            return;
        }

        // 检查攻击输入
        if (input.isActionPressed('attack') && combat.canAttack()) {
            this.stateMachine.setState('attack');
            return;
        }
    }
}