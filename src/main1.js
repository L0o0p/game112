import * as THREE from 'three'


// 创建一个简单的事件管理器
class EventManager {
    constructor() {
        this._handlers = new Map();
    }

    // 注册事件处理器
    on(topic, callback) {
        if (!this._handlers.has(topic)) {
            this._handlers.set(topic, new Set());
        }
        this._handlers.get(topic).add(callback);
    }

    // 广播事件
    emit(topic, data) {
        const handlers = this._handlers.get(topic);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }
}

// 创建全局事件管理器
const eventManager = new EventManager();

// 创建基础实体类
class Entity {
    constructor(mesh) {
        this.mesh = mesh;
        this.isStaggered = false;
    }

    // 注册事件处理器的方法
    on(topic, callback) {
        eventManager.on(topic, callback);
    }

    // 广播事件的方法
    emit(topic, data) {
        eventManager.emit(topic, data);
    }
}

// 主要代码
function createDemo() {
    // 创建场景、渲染器等Three.js基础设置
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 创建玩家方块
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    scene.add(playerMesh);

    // 创建敌人方块
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemyMesh.position.x = 5;
    scene.add(enemyMesh);

    // 创建玩家实体
    const player = new Entity(playerMesh);
    const enemy = new Entity(enemyMesh);

    // 设置相机位置
    camera.position.z = 10;

    // 记录按键状态
    const keys = {
        ArrowLeft: false,
        ArrowRight: false
    };

    // 监听键盘事件
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });

    // 注册敌人的碰撞处理
    enemy.on('collision', (data) => {
        if (!enemy.isStaggered) {
            console.log('Enemy hit!');
            
            // 被击中后短暂变色
            enemyMesh.material.color.setHex(0xFFFF00);
            enemy.isStaggered = true;

            // 计算击退方向和距离
            const knockbackDirection = new THREE.Vector3()
                .subVectors(enemyMesh.position, data.playerPosition)
                .normalize();
            
            // 击退动画
            let knockbackDistance = 0;
            const knockbackAnimation = () => {
                if (knockbackDistance < 2) { // 击退总距离
                    knockbackDistance += 0.1;
                    enemyMesh.position.add(knockbackDirection.multiplyScalar(0.1));
                    requestAnimationFrame(knockbackAnimation);
                } else {
                    // 恢复原色
                    setTimeout(() => {
                        enemyMesh.material.color.setHex(0xFF0000);
                        enemy.isStaggered = false;
                    }, 500);
                }
            };
            knockbackAnimation();
        }
    });

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);

        // 处理玩家移动
        const moveSpeed = 0.1;
        if (keys.ArrowLeft) {
            playerMesh.position.x -= moveSpeed;
        }
        if (keys.ArrowRight) {
            playerMesh.position.x += moveSpeed;
        }

        // 检测碰撞
        const distance = playerMesh.position.distanceTo(enemyMesh.position);
        if (distance < 1.5) { // 碰撞距离阈值
            // 广播碰撞事件
            eventManager.emit('collision', {
                playerPosition: playerMesh.position.clone()
            });
        }

        renderer.render(scene, camera);
    }

    animate();
}

// 初始化演示
createDemo();