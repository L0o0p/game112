export class Time {
    constructor() {
        this.current = performance.now();
        this.previous = this.current;
        this.deltaTime = 0;
        this.elapsed = 0;
    }

    update() {
        this.previous = this.current;
        this.current = performance.now();
        this.deltaTime = (this.current - this.previous) / 1000; // 转换为秒
        this.elapsed += this.deltaTime;
    }
}