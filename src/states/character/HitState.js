import {State} from'./State'

export class HitState extends State {
    constructor(entity) {
        super(entity);
        this.hitDuration = 0.5; // 受击状态持续时间
        this.timer = 0;
    }

    enter() {
        const animator = this.entity.getComponent('AnimatorComponent');
        animator?.playOneShot('hit');
        this.timer = this.hitDuration;
    }

    update(deltaTime) {
        this.timer -= deltaTime;
        
        if (this.timer <= 0) {
            this.stateMachine.setState('idle');
        }
    }

    canEnter() {
        const health = this.entity.getComponent('HealthComponent');
        return health && health.currentHealth > 0;
    }
}
