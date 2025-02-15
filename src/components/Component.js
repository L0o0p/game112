// components/Component.js
import * as THREE from 'three'

export class Component {
    constructor() {
        // 持有实体引用
        this.entity = null;
        
        // 组件启用状态
        this.enabled = true;
        
        // 组件优先级（用于更新顺序）
        this.priority = 0;
        
        // 组件依赖
        this.requires = [];
        
        // 组件类型（用于快速识别）
        this.type = this.constructor.name;
    }

    // 组件生命周期方法

    /**
     * 当组件被添加到实体时调用
     */
    onAdd() {
        // 检查依赖
        this.checkDependencies();
    }

    /**
     * 当组件从实体移除时调用
     */
    onRemove() {
        // 清理资源
    }

    /**
     * 当组件被启用时调用
     */
    onEnable() {
        // 组件启用时的逻辑
    }

    /**
     * 当组件被禁用时调用
     */
    onDisable() {
        // 组件禁用时的逻辑
    }

    /**
     * 每帧更新调用
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 更新逻辑
    }

    /**
     * 每帧最后调用，用于后处理
     * @param {number} deltaTime - 帧间隔时间
     */
    lateUpdate(deltaTime) {
        // 后处理逻辑
    }

    // 工具方法

    /**
     * 检查组件依赖
     */
    checkDependencies() {
        for (const requiredComponent of this.requires) {
            if (!this.entity.hasComponent(requiredComponent)) {
                throw new Error(
                    `Component ${this.type} requires ${requiredComponent}`
                );
            }
        }
    }

    /**
     * 获取当前实体上的其他组件
     * @param {string} componentType - 组件类型名称
     * @returns {Component|null} - 返回找到的组件或null
     */
    getComponent(componentType) {
        return this.entity?.getComponent(componentType) || null;
    }

    /**
     * 启用组件
     */
    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.onEnable();
        }
    }

    /**
     * 禁用组件
     */
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.onDisable();
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        if (this.entity) {
            this.entity.removeComponent(this.type);
        }
    }

    // 序列化相关方法

    /**
     * 将组件数据序列化为JSON
     * @returns {Object} - 序列化后的数据
     */
    toJSON() {
        return {
            type: this.type,
            enabled: this.enabled,
            priority: this.priority,
            // 子类可以扩展这个方法来添加自己的序列化数据
        };
    }

    /**
     * 从JSON数据中恢复组件状态
     * @param {Object} json - 序列化的数据
     */
    fromJSON(json) {
        this.enabled = json.enabled;
        this.priority = json.priority;
        // 子类可以扩展这个方法来处理自己的序列化数据
    }

    // 调试相关方法

    /**
     * 获取组件的调试信息
     * @returns {Object} - 调试信息
     */
    getDebugInfo() {
        return {
            type: this.type,
            enabled: this.enabled,
            entity: this.entity?.name || 'None',
            // 子类可以扩展这个方法来添加更多调试信息
        };
    }

    /**
     * 将组件转换为字符串表示
     * @returns {string} - 字符串表示
     */
    toString() {
        return `${this.type}(enabled=${this.enabled})`;
    }

    // 静态工具方法

    /**
     * 创建组件的工厂方法
     * @param {Object} params - 组件参数
     * @returns {Component} - 新创建的组件实例
     */
    static create(params) {
        return new this(params);
    }

    /**
     * 获取组件的默认参数
     * @returns {Object} - 默认参数
     */
    static getDefaults() {
        return {
            enabled: true,
            priority: 0
        };
    }
}