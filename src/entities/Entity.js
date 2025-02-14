import { EventManager } from '../core/EventManager'

export class Entity {
    constructor() {
        this.components = new Map();
        this._handlers = {};
        // 使用getInstance()获取单例
        this.eventManager = EventManager.getInstance();
        this.mesh = null; // 添加 mesh 属性
    }

    setMesh(mesh) {
        this.mesh = mesh;
    }
    // 注册事件处理器的方法
    on(topic, callback) {
        console.log(`Registering handler for topic: ${topic}`);
        this.eventManager.on(topic, callback);
    }

    // 广播事件的方法
    emit(topic, data) {
        console.log(`Emitting message for topic: ${topic}`, data);
        this.eventManager.emit(topic, data);  // 直接传递 topic 和 data
    }

    addComponent(component) {
        this.components.set(component.constructor.name, component);
        this.mesh = component.mesh 
        component.entity = this;
        if (component.onAdd) {
            component.onAdd();
        }
    }

    getComponent(componentName) {
        return this.components.get(componentName);
    }

    update(deltaTime) {
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
    }
}