import { Game } from './core/Game.js';

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});