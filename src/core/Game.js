import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Time } from '../utils/Time';
import { Entity } from './Entity';
import { PlayerController } from '../components/PlayerController';
import { CameraController } from '../components/CameraController';

export class Game {
    constructor() {
        // 让输入系统可以全局访问
        window.game = this;
        // 初始化渲染器
        this.renderer = new THREE.WebGLRenderer();
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
        obstacle.position.set(x, y, z);
        this.scene.add(obstacle);
        this.collisionSystem.addCollider(obstacle);
        return obstacle;
    }

    setupScene() {
                // 添加网格地面作为参考
                const gridHelper = new THREE.GridHelper(20, 20);
                this.scene.add(gridHelper);
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // // 添加一个测试用的立方体
        // const geometry = new THREE.BoxGeometry();
        // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        // this.cube = new THREE.Mesh(geometry, material);
        // this.scene.add(this.cube);

         // 创建玩家实体
         const playerEntity = new Entity();
        
         // 创建玩家的3D模型
         const geometry = new THREE.BoxGeometry();
         const material = new THREE.MeshStandardMaterial({ 
             color: 0x00ff00,
             metalness: 0.5,
             roughness: 0.5
         });
         const playerMesh = new THREE.Mesh(geometry, material);
         this.scene.add(playerMesh);
        // 将玩家添加到碰撞系统
        this.collisionSystem.addCollider(playerMesh);
         // 添加玩家控制器组件
         playerEntity.addComponent(new PlayerController(playerMesh));
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
        this.createObstacle(0, wallHeight/2, -wallSize/2, 
            wallSize, wallHeight, wallThickness);
        // 南墙
        this.createObstacle(0, wallHeight/2, wallSize/2, 
            wallSize, wallHeight, wallThickness);
        // 东墙
        this.createObstacle(wallSize/2, wallHeight/2, 0, 
            wallThickness, wallHeight, wallSize);
        // 西墙
        this.createObstacle(-wallSize/2, wallHeight/2, 0, 
            wallThickness, wallHeight, wallSize);
    }

    update() {
        requestAnimationFrame(this.update);

        // 更新时间
        this.time.update();

        // 更新所有实体
        for (const entity of this.entities.values()) {
            entity.update(this.time.deltaTime);
        }

        // // 旋转测试用的立方体
        // if (this.cube) {
        //     this.cube.rotation.x += 0.01;
        //     this.cube.rotation.y += 0.01;
        // }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}