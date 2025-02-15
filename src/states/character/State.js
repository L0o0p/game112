export class State {
    constructor(entity) {
        this.entity = entity;
        this.stateMachine = entity.stateMachine;
        this.Name = this.constructor.name;
    }

    // 生命周期方法
    enter() {
        // 状态开始时调用
    }

    exit() {
        // 状态结束时调用
    }

    update(deltaTime) {
        // 状态更新时调用
    }

    // 状态转换条件检查
    canEnter() {
        return true;
    }

    canExit() {
        return true;
    }

    // 事件处理
    handleInput(input) {
        // 处理输入
    }

    handleEvent(event) {
        // 处理事件
    }
}

