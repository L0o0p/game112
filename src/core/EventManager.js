export class EventManager {
    constructor() {
        if (EventManager.instance) {
            return EventManager.instance;
        }
        EventManager.instance = this;
        this._handlers = new Map();
        console.log('New EventManager instance created');
    }

    static getInstance() {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    on(topic, callback) {
        console.log(`Registering handler for topic: ${topic}`);
        if (!this._handlers.has(topic)) {
            this._handlers.set(topic, new Set());
        }
        this._handlers.get(topic).add(callback);
        console.log(`Current handlers for ${topic}:`, this._handlers.get(topic).size);
    }

    emit(topic, data) {
        // console.log(`Emitting event: ${topic}`, data);
        const handlers = this._handlers.get(topic);
        if (handlers) {
            console.log(`Found ${handlers.size} handlers for ${topic}`);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        } else {
            // console.log(`No handlers found for topic: ${topic}`);
        }
    }
}