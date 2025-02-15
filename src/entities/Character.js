export class Character extends Entity {
    constructor() {
        super();
        
        // 核心状态
        this.lifecycleState = 'ALIVE'; // ALIVE, DEAD
        
        // 行为状态机
        this.behaviorFSM = new StateMachine();
        this.behaviorFSM.addState('idle', IdleState);
        this.behaviorFSM.addState('walk', WalkState);
        this.behaviorFSM.addState('attack', AttackState);
        this.behaviorFSM.addState('death', DeathState);
        
        // 效果管理器
        this.effectManager = new EffectManager(this);
        
        // 注册组件
        this.addComponent(new Transform());
        this.addComponent(new Animator());
        this.addComponent(new Health());
        this.addComponent(new Combat());
        
        // 注册事件监听
        this.on('damage.taken', this.onDamage.bind(this));
        this.on('health.zero', this.onDeath.bind(this));
    }

    onDamage(damageData) {
        if (this.lifecycleState !== 'ALIVE') return;
        
        const health = this.getComponent('Health');
        health.takeDamage(damageData.amount);
        
        // 添加受击效果
        this.effectManager.add('STAGGER', 0.3);
    }

    onDeath() {
        this.lifecycleState = 'DEAD';
        this.behaviorFSM.setState('death');
        this.effectManager.clear();
    }

    update(deltaTime) {
        if (this.lifecycleState === 'DEAD') {
            // 只更新动画
            this.getComponent('Animator').update(deltaTime);
            return;
        }

        // 更新效果
        this.effectManager.update(deltaTime);

        // 如果没有被控制，更新行为
        if (!this.effectManager.isControlled()) {
            this.behaviorFSM.update(deltaTime);
        }

        // 更新组件
        super.update(deltaTime);
    }
}