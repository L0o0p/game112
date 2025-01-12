export class Entity {
    constructor() {
        this.components = new Map();
    }

    addComponent(component) {
        this.components.set(component.constructor.name, component);
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