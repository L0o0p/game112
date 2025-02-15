import {State} from'./State'

export class AttackState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        const combat = this.entity.getComponent('CombatComponent');

        combat.startAttack();

        // 播放攻击动画
        animator?.playOneShot('attacking', () => {
            // 动画结束后回到空闲状态
            combat.endAttack();
            this.stateMachine.setState('idle');
        });

        // 发送攻击事件
        this.entity.emit('player.attack', {
            position: this.entity.position.clone(),
            rotation: this.entity.rotation.y,
            damage: combat.damage,
            range: combat.range
        });
    }

    canEnter() {
        const combat = this.entity.getComponent('CombatComponent');
        return combat && combat.canAttack();
    }

    update(deltaTime) {
        // 攻击状态下不处理其他输入
        // 等待动画回调结束
    }
}