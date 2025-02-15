export class StateMachine {
    constructor(entity) {
        this.entity = entity;
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
    }

    addState(name, stateClass) {
        this.states.set(name, new stateClass(this.entity));
    }

    setState(name) {
        if (!this.states.has(name)) {
            console.warn(`State ${name} not found`);
            return;
        }

        const newState = this.states.get(name);

        // 检查是否可以退出当前状态和进入新状态
        if (this.currentState?.canExit() === false || 
            newState.canEnter() === false) {
            return;
        }

        // 退出当前状态
        if (this.currentState) {
            this.currentState.exit();
            this.previousState = this.currentState;
        }

        // 进入新状态
        this.currentState = newState;
        this.currentState.enter();

        // 发送状态改变事件
        this.entity.emit('stateChanged', {
            from: this.previousState?.Name,
            to: this.currentState.Name
        });
    }

    update(deltaTime) {
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }

    handleInput(input) {
        if (this.currentState) {
            this.currentState.handleInput(input);
        }
    }

    handleEvent(event) {
        if (this.currentState) {
            this.currentState.handleEvent(event);
        }
    }

    getCurrentState() {
        return this.currentState;
    }

    getPreviousState() {
        return this.previousState;
    }

    reset() {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = null;
        this.previousState = null;
    }
}
