import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Time } from '../utils/Time';
import { Entity } from '../entities/Entity.js';
import { Player } from '../entities/Player.js';
import { CameraController } from '../components/CameraController';
import { ResourceManager } from './ResourceManager';
import { CombatSystem } from '../systems/CombatSystem.js'
import { Enemy } from '../entities/Enemy.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class Game {
    constructor() {
        // 让输入系统可以全局访问
        window.game = this;
        // 初始化渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        // 调整相机位置以便更好地观察场景
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // 初始化系统
        this.input = new InputSystem();
        // 让输入系统可以全局访问
        window.game = this;
        this.time = new Time();

        // 存储游戏实体
        this.entities = new Map();

        // 绑定更新方法
        this.update = this.update.bind(this);

        // 监听窗口调整大小
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        // 添加碰撞系统
        this.collisionSystem = new CollisionSystem();
        // 添加敌人攻击事件监听
        window.addEventListener('enemyAttack', this.handleEnemyAttack.bind(this));
    }

    start() {
        // 添加一些基础的场景元素
        this.setupScene();

        // 开始游戏循环
        this.update();
    }

    createObstacle(x, y, z, width, height, depth) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.5,
            roughness: 0.5
        });
        const obstacle = new THREE.Mesh(geometry, material);
        obstacle.castShadow = true
        obstacle.receiveShadow = true
        obstacle.position.set(x, y, z);
        this.scene.add(obstacle);
        this.collisionSystem.addCollider(obstacle);
        return obstacle;
    }

    async setupScene() {
        // 添加网格地面作为参考
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.castShadow = true;
        const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
        const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
        directionalLight.position.set(0 + 15, 15, 5);
        // 配置阴影属性
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.bias = -0.001; // 添加这行来减少阴影失真
        this.scene.add(directionalLight);
        this.scene.add(shadowHelper);
        // this.scene.add(helper);

        // // 添加一个测试用的立方体
        // const geometry = new THREE.BoxGeometry();
        // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        // this.cube = new THREE.Mesh(geometry, material);
        // this.scene.add(this.cube);

        // 创建玩家实体
        // const playerEntity = new Entity();
        const resourcesLoader = new ResourceManager()
        const model = await resourcesLoader.loadGLTF('/models/gamelike.glb')
        console.log('model', model);

        console.log('Available animations:', model.animations.map(a => a.name));
        const playerMesh = model.scene.children[0]
            // .rotateY(3.14)
        console.log('playerMesh', playerMesh);
        // 标记这是玩家模型
        playerMesh.userData.isPlayer = true;

        const playerAnimations = model.animations
        console.log('animations', playerAnimations);
        // 设置模型的阴影
        playerMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.scene.add(playerMesh);

        // 将玩家添加到碰撞系统
        this.collisionSystem.addCollider(playerMesh);
        // 直接创建Player实例
        const playerEntity = new Player(playerMesh, model.animations);
        // 创建相机实体
        const cameraEntity = new Entity();

        // 添加相机控制器组件
        cameraEntity.addComponent(new CameraController(this.camera, playerMesh));
        // 存储实体
        this.entities.set('player', playerEntity);
        this.entities.set('camera', cameraEntity);

        // 创建一些障碍物
        this.createObstacle(5, 1, 0, 2, 2, 2);  // 右边的障碍物
        this.createObstacle(-5, 1, 0, 2, 2, 2); // 左边的障碍物
        this.createObstacle(0, 1, 5, 2, 2, 2);  // 前面的障碍物
        this.createObstacle(0, 1, -5, 2, 2, 2); // 后面的障碍物

        // 创建围墙
        const wallSize = 20;
        const wallThickness = 1;
        const wallHeight = 3;

        // 北墙
        this.createObstacle(0, wallHeight / 2, -wallSize / 2,
            wallSize, wallHeight, wallThickness);
        // 南墙
        this.createObstacle(0, wallHeight / 2, wallSize / 2,
            wallSize, wallHeight, wallThickness);
        // 东墙
        this.createObstacle(wallSize / 2, wallHeight / 2, 0,
            wallThickness, wallHeight, wallSize);
        // 西墙
        this.createObstacle(-wallSize / 2, wallHeight / 2, 0,
            wallThickness, wallHeight, wallSize);

        // 创建实际的地面
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 初始化战斗系统
        this.combatSystem = new CombatSystem();
        this.scene.add(this.combatSystem.debugMesh);

        // 加载敌人模型
        const loader = new GLTFLoader();
        const enemyModel = await loader.loadAsync('/models/gamelike.glb');
        const enemyMesh = enemyModel.scene.children[0]
        const enemyAnimations = enemyModel.animations
        const position = new THREE.Vector3(2, 0, -5);
        const enemyEntity = new Enemy(enemyMesh, enemyAnimations, position)
        // enemyEntity.position.set()

        // 将敌人添加到碰撞系统
        this.collisionSystem.addCollider(enemyMesh);
        // 将敌人实体添加到实体系统
        this.entities.set('enemy', enemyEntity);

        // 设置材质和阴影
        enemyMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = child.material.clone();
                child.material.color.setHex(0xff0000);
            }
        });

        // 将敌人添加到场景
        this.scene.add(enemyModel.scene)

        // 创建敌人实例
        this.combatSystem.registerEntity(enemyEntity);
        this.combatSystem.registerEntity(playerEntity);
        console.log('Enemy event manager:', enemyEntity.eventManager);
        console.log('Player event manager:', playerEntity.eventManager);
        // 敌人监听玩家的攻击
        console.log('Registering attack handler for enemy');
        enemyEntity.on('player.attack', (msg) => {
            console.log('Enemy under attack!', msg);
            this.combatSystem.handleAttack(msg);
            // enemyEntity.takeDamage()
        });

        // 玩家监听敌人的攻击（如果需要的话）
        playerEntity.on('enemy.attack', (msg) => {
            console.log('Player under attack!');
            this.combatSystem.handleAttack(msg);
        });

    }

    handleEnemyAttack(event) {
        const { attacker, position, damage } = event.detail;

        // 获取玩家实体
        const playerEntity = this.entities.get('player');
        if (playerEntity) {
            const playerController = playerEntity.getComponent('Player');
            if (playerController) {
                // 检查玩家是否在攻击范围内
                const distanceToPlayer = position.distanceTo(playerController.mesh.position);
                if (distanceToPlayer <= attacker.attackRange) {
                    // 对玩家造成伤害
                    console.log('attacker', attacker.mesh.position);

                    playerController.takeDamage(damage, attacker.mesh.position);
                }
            }
        }
    }

    update() {
        requestAnimationFrame(this.update);

        // 更新时间
        this.time.update();
        const deltaTime = this.time.deltaTime;

        // 获取玩家位置用于更新敌人
        const playerEntity = this.entities.get('player');
        let playerPosition = null;
        if (playerEntity) {
            const playerController = playerEntity.getComponent('Player');
            if (playerController && playerController.mesh) {
                playerPosition = playerController.mesh.position;
            }
        }

        // 更新所有实体
        for (const entity of this.entities.values()) {
            if (entity) {
                // 如果是敌人实体，传入玩家位置
                const enemy = entity.getComponent('Enemy');
                if (enemy && playerPosition) {
                    enemy.update(deltaTime, playerPosition);
                } else {
                    entity.update(deltaTime);
                }
            }
        }

        // 更新战斗系统
        if (this.combatSystem && playerPosition) {
            const playerController = playerEntity.getComponent('Player');
            if (playerController) {
                this.combatSystem.update(
                    playerPosition,
                    playerController.mesh.rotation.y
                );
            }
        }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }



    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}