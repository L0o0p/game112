import {State} from'./State'

export class DeathState extends State {
    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        const combat = this.entity.getComponent('CombatComponent');
        const movement = this.entity.getComponent('MovementComponent');

        // 禁用相关组件
        combat?.disable();
        movement?.disable();

        // 播放死亡动画
        animator?.playOneShot('death', () => {
            this.entity.emit('player.deathAnimationComplete');
        });
    }

    canExit() {
        // 死亡状态不能退出
        return false;
    }

    update(deltaTime) {
        // 死亡状态下不处理任何更新
    }
}