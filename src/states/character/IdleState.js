import {State} from'./State'

// states/character/BaseIdleState.js
export class BaseIdleState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.play('idle');
    }
}

// states/character/BaseWalkState.js
export class BaseWalkState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.play('walking');
    }
}

export class EnemyIdleState extends BaseIdleState {
    update(deltaTime) {
        const ai = this.entity.getComponent('AIComponent');
        const target = ai?.getTarget();

        if (!target) return;

        const distance = this.entity.mesh.position.distanceTo(target.position);

        // 检查是否在攻击范围内
        if (distance <= ai.attackRange) {
            const combat = this.entity.getComponent('CombatComponent');
            if (combat?.canAttack()) {
                this.stateMachine.setState('attack');
                return;
            }
        }
        // 检查是否需要追击
        else if (distance <= ai.detectionRange) {
            this.stateMachine.setState('chase');
            return;
        }
    }
}

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