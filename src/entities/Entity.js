import { EventManager } from '../core/EventManager'

export class Entity {
    constructor() {
        this.components = new Map();
        // 使用getInstance()获取单例
        this.eventManager = EventManager.getInstance();
        // 基础属性
        this.id = crypto.randomUUID(); // 唯一标识符
        this.name = 'Entity';
        this.tags = new Set(); // 用于实体标签化分类

        // Transform数据（可以后续移到TransformComponent中）
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };

        // 渲染相关
        this.mesh = null;
        this.visible = true;
    }

    // Mesh相关方法
    setMesh(mesh) {
        this.mesh = mesh;
        // 更新mesh的位置等属性
        this.updateMeshTransform();
    }

    updateMeshTransform() {
        if (this.mesh) {
            this.mesh.position.set(
                this.position.x,
                this.position.y,
                this.position.z
            );
            // 可以添加rotation和scale的更新
        }
    }
    // 注册事件处理器的方法
    on(topic, callback) {
        console.log(`Registering handler for topic: ${topic}`);
        this.eventManager.on(topic, callback);
    }

    // 广播事件的方法
    emit(topic, data) {
        // console.log(`Emitting message for topic: ${topic}`, data);
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

    hasComponent(componentName) {
        return this.components.has(componentName);
    }

    removeComponent(componentName) {
        const component = this.components.get(componentName);
        if (component) {
            // 调用组件的清理方法
            if (component.onRemove) {
                component.onRemove();
            }
            this.components.delete(componentName);
        }
        return this;
    }


    // 标签系统方法
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }

    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    update(deltaTime) {
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
        // 更新mesh变换
        this.updateMeshTransform();
    }
    // 销毁实体
    destroy() {
        // 清理所有组件
        for (const component of this.components.values()) {
            if (component.onRemove) {
                component.onRemove();
            }
        }
        this.components.clear();

        // 清理mesh
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }

        // 触发销毁事件
        this.emit('entity.destroyed', { entityId: this.id });
    }
}