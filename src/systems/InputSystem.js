export class InputSystem {
    constructor() {
        this.keys = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
        });

        window.addEventListener('keyup', (event) => {
            this.keys.delete(event.code);
        });

        // 鼠标事件
        window.addEventListener('mousemove', (event) => {
            this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    getMousePosition() {
        return this.mousePosition;
    }
}