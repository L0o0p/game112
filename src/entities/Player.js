import * as THREE from 'three';
import { Entity } from './Entity';
import { StateMachine } from '../states/StateMachine';
import { IdleState } from '../states/character/IdleState';
import { WalkState } from '../states/character/WalkState';
import { AttackState } from '../states/character/AttackState';
import { DeathState } from '../states/character/DeathState';
import { HitState } from '../states/character/HitState';
import { InputComponent } from '../components/InputComponent';
import { AnimatorComponent } from '../components/AnimatorComponent';
import { HealthComponent } from '../components/HealthComponent';
import { CombatComponent } from '../components/CombatComponent';
import { MovementComponent } from '../components/MovementComponent';
import { ColliderComponent } from '../components/ColliderComponent';

export class Player extends Entity {
    constructor(playerMesh, playerAnimations) {
        super();
        
        this.name = 'player';
        this.addTag('player');

        // 初始化基础组件
        this.initComponents(playerMesh, playerAnimations);
        
        // 初始化状态机
        this.initStateMachine();
        
        // 初始化事件监听
        this.initEventListeners();
    }

    initComponents(playerMesh, playerAnimations) {
        // 设置网格
        this.setMesh(playerMesh);
        this.mesh.userData.isPlayer = true;

        // 添加组件
        this.addComponent(new InputComponent({
            controls: {
                forward: 'KeyW',
                backward: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
                attack: 'KeyJ'
            }
        }));

        this.addComponent(new AnimatorComponent({
            mesh: playerMesh,
            animations: playerAnimations,
            defaultAnimation: 'idle'
        }));

        this.addComponent(new HealthComponent({
            maxHealth: 100,
            invulnerableTime: 0.5
        }));

        this.addComponent(new CombatComponent({
            damage: 25,
            range: 2,
            cooldown: 1.0
        }));

        this.addComponent(new MovementComponent({
            speed: 5,
            rotationSpeed: 10,
            knockbackResistance: 0.2
        }));

        this.addComponent(new ColliderComponent({
            radius: 0.5,
            height: 2
        }));
    }

    initStateMachine() {
        this.stateMachine = new StateMachine(this);
        
        // 添加状态
        this.stateMachine.addState('idle', IdleState);
        this.stateMachine.addState('walk', WalkState);
        this.stateMachine.addState('attack', AttackState);
        this.stateMachine.addState('hit', HitState);
        this.stateMachine.addState('death', DeathState);

        // 设置初始状态
        this.stateMachine.setState('idle');
    }

    initEventListeners() {
        // 受伤事件
        this.on('damage.taken', (data) => {
            const health = this.getComponent('HealthComponent');
            if (health.canTakeDamage()) {
                health.takeDamage(data.amount);
                this.handleDamage(data);
            }
        });

        // 死亡事件
        this.on('health.zero', () => {
            this.die();
        });

        // 攻击事件
        this.on('combat.attack', () => {
            const combat = this.getComponent('CombatComponent');
            if (combat.canAttack()) {
                this.attack();
            }
        });
    }

    handleDamage(damageData) {
        const movement = this.getComponent('MovementComponent');
        
        // 计算击退
        if (damageData.source) {
            const knockbackDirection = new THREE.Vector3()
                .subVectors(this.position, damageData.source.position)
                .normalize();
            
            movement.applyKnockback(knockbackDirection, damageData.force || 10);
        }

        // 切换到受伤状态
        this.stateMachine.setState('hit');
    }

    attack() {
        const combat = this.getComponent('CombatComponent');
        const animator = this.getComponent('AnimatorComponent');

        combat.startAttack();
        this.stateMachine.setState('attack');

        // 发送攻击事件
        this.emit('player.attack', {
            position: this.position,
            rotation: this.rotation.y,
            damage: combat.damage,
            range: combat.range
        });
    }

    die() {
        this.stateMachine.setState('death');
        this.emit('player.died', {
            position: this.position.clone()
        });
    }

    update(deltaTime) {
        // 先更新基类
        super.update(deltaTime);
    
        // 如果已死亡，不再更新
        if (this.stateMachine.currentState.Name === 'death') {
            return;
        }
    
        // 更新状态机
        this.stateMachine.update(deltaTime);
    
        // 处理输入
        const input = this.getComponent('InputComponent');
        const movement = this.getComponent('MovementComponent');
    
        // 处理攻击输入
        if (input.isActionPressed('attack')) {
            this.emit('combat.attack');
        }
    
        // 更新移动
        if (!movement.isKnockedBack && this.stateMachine.currentState.Name !== 'attack') {
            const moveDirection = input.getMoveDirection();
            
            // 添加调试日志
            console.log('Move Direction:', moveDirection);
            
            if (moveDirection.lengthSq() > 0) {
                const isMoving = movement.move(moveDirection, deltaTime);
                console.log('Is Moving:', isMoving);
                
                if (isMoving && this.stateMachine.currentState.Name !== 'walk') {
                    this.stateMachine.setState('walk');
                }
            } else if (this.stateMachine.currentState.Name !== 'idle') {
                this.stateMachine.setState('idle');
            }
        }
    
        // 检查碰撞
        const collider = this.getComponent('ColliderComponent');
        if (collider.checkCollisions()) {
            movement.resolveCollision();
        }
    }
}