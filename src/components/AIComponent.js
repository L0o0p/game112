// components/AIComponent.js
import { Component } from './Component';

export class AIComponent extends Component {
    constructor(params = {}) {
        super();
        
        // AI参数
        this.detectionRange = params.detectionRange || 4;
        this.attackRange = params.attackRange || 1;
        
        // 状态机
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        
        // 目标相关
        this.currentTarget = null;
        this.lastKnownTargetPosition = null;
        
        // 行为集合
        this.behaviors = params.behaviors || {};
        
        // 状态计时器
        this.stateTimer = 0;
        
        // 调试标志
        this.debug = params.debug || false;
    }

    // 状态管理
    addState(name, state) {
        this.states.set(name, {
            name,
            enter: state.enter || (() => {}),
            update: state.update || (() => {}),
            exit: state.exit || (() => {})
        });
    }

    setState(name) {
        if (!this.states.has(name)) {
            console.warn(`AI State '${name}' not found`);
            return;
        }

        // 如果已经在此状态，不做改变
        if (this.currentState?.name === name) return;

        // 退出当前状态
        if (this.currentState) {
            if (this.debug) console.log(`Exiting state: ${this.currentState.name}`);
            this.currentState.exit();
            this.previousState = this.currentState;
        }

        // 进入新状态
        this.currentState = this.states.get(name);
        this.stateTimer = 0;
        
        if (this.debug) console.log(`Entering state: ${name}`);
        this.currentState.enter();

        // 触发状态改变事件
        this.entity?.emit('ai.stateChanged', {
            from: this.previousState?.name,
            to: name
        });
    }
    getTarget() {
        return this.target;
    }
    // 目标管理
    setTarget(target) {
        this.currentTarget = target;
        if (target) {
            this.lastKnownTargetPosition = target.clone();
        }
    }

    // 更新方法
    update(deltaTime, playerPosition) {
        // 更新状态计时器
        this.stateTimer += deltaTime;

        // 更新目标位置
        if (playerPosition) {
            this.currentTarget = playerPosition;
            this.lastKnownTargetPosition = playerPosition.clone();
        }

        // 检查目标是否在范围内
        if (this.currentTarget) {
            const distanceToTarget = this.entity.mesh.position.distanceTo(this.currentTarget);
            
            // 调试信息
            if (this.debug) {
                console.log(`Distance to target: ${distanceToTarget}`);
                console.log(`Current state: ${this.currentState?.name}`);
            }

            // 根据距离更新行为
            if (distanceToTarget <= this.attackRange) {
                // 在攻击范围内
                if (this.currentState?.name !== 'attack') {
                    this.setState('attack');
                }
            } else if (distanceToTarget <= this.detectionRange) {
                // 在追击范围内
                if (this.currentState?.name !== 'chase') {
                    this.setState('chase');
                }
            } else {
                // 超出范围，回到空闲状态
                if (this.currentState?.name !== 'idle') {
                    this.setState('idle');
                }
            }
        }

        // 更新当前状态
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }

    // 行为检查方法
    canSeeTarget() {
        if (!this.currentTarget) return false;
        
        // 这里可以添加视线检测逻辑
        // 比如射线检测，判断是否有障碍物遮挡
        return true;
    }

    isTargetInRange(range) {
        if (!this.currentTarget) return false;
        const distance = this.entity.mesh.position.distanceTo(this.currentTarget);
        return distance <= range;
    }

    // 行为执行方法
    executeBehavior(behaviorName, ...args) {
        if (this.behaviors[behaviorName]) {
            return this.behaviors[behaviorName](...args);
        }
        return false;
    }

    // 状态查询方法
    getCurrentState() {
        return this.currentState?.name;
    }

    getStateTime() {
        return this.stateTimer;
    }

    // 调试方法
    enableDebug() {
        this.debug = true;
    }

    disableDebug() {
        this.debug = false;
    }

    // 重置方法
    reset() {
        this.currentState?.exit();
        this.currentState = null;
        this.previousState = null;
        this.currentTarget = null;
        this.lastKnownTargetPosition = null;
        this.stateTimer = 0;
    }

    // 组件生命周期方法
    onAdd() { 
        if (this.debug) {
            console.log('AIComponent added to entity:', this.entity);
        }
    }

    onRemove() {
        this.reset();
    }
}