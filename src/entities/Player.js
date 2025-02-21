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
        // 验证输入参数
        if (!playerMesh) {
            console.error('Player constructor: playerMesh is required');
            throw new Error('playerMesh is required');
        }

        console.log('Player constructor input:', {
            hasMesh: !!playerMesh,
            meshType: playerMesh?.type,
            hasAnimations: !!playerAnimations
        });
        this.name = 'player';
        this.addTag('player');
        // 明确设置mesh
        this.setMesh(playerMesh);
        console.log('Player constructor:', {
            hasMesh: !!this.mesh,
            meshPosition: this.mesh?.position
        });
        // 初始化基础组件
        this.initComponents(playerMesh, playerAnimations);

        // 初始化状态机
        this.initStateMachine();

        // 初始化事件监听
        this.initEventListeners();
    }

    initComponents(playerMesh, playerAnimations) {
        console.log('Initializing components with mesh:', {
            hasMesh: !!playerMesh,
            entityMesh: !!this.mesh
        });

        // 移动组件
        const movementComp = new MovementComponent({
            speed: 5,
            rotationSpeed: 10,
            knockbackResistance: 0.2
        });
        this.addComponent(movementComp);

        // 设置网格
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
            speed: 2,
            rotationSpeed: 10,
            knockbackResistance: 0.2
        }));

        this.addComponent(new ColliderComponent({
            radius: 0.5,
            height: 2
        }));

        // 在构造函数最后调用
        this.validateComponents();
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
        // 确保 deltaTime 在合理范围内
        const clampedDeltaTime = Math.min(deltaTime, 0.1); // 防止过大的deltaTime

        super.update(clampedDeltaTime);

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

            if (moveDirection.lengthSq() > 0) {
                // 记录移动前的位置
                const oldPosition = this.mesh.position.clone();

                const isMoving = movement.move(moveDirection, deltaTime);

                // 验证位置是否真的改变了
                const newPosition = this.mesh.position.clone();
                const moved = !oldPosition.equals(newPosition);

                console.log('Movement check:', {
                    oldPosition: oldPosition.toArray(),
                    newPosition: newPosition.toArray(),
                    moved: moved,
                    isMoving: isMoving
                });

                if (isMoving && moved && this.stateMachine.currentState.Name !== 'walk') {
                    this.stateMachine.setState('walk');
                }
            } else if (this.stateMachine.currentState.Name !== 'idle') {
                this.stateMachine.setState('idle');
            }
        }

        // 检查碰撞
        const collider = this.getComponent('ColliderComponent');
        if (collider && collider.checkCollisions()) {
            movement.resolveCollision();
        }
    }

    // 在 Player 类中添加
    validateComponents() {
        const validation = {
            movement: {
                exists: !!this.getComponent('MovementComponent'),
                hasEntity: !!this.getComponent('MovementComponent')?.entity,
                hasMesh: !!this.getComponent('MovementComponent')?.entity?.mesh
            },
            input: {
                exists: !!this.getComponent('InputComponent'),
                hasEntity: !!this.getComponent('InputComponent')?.entity
            },
            mesh: {
                exists: !!this.mesh,
                position: this.mesh?.position?.toArray()
            },
            animator: {
                exists: !!this.getComponent('AnimatorComponent'),
                hasEntity: !!this.getComponent('AnimatorComponent')?.entity,
                hasMesh: !!this.getComponent('AnimatorComponent')?.entity?.mesh
            }
        };

        console.log('Component validation:', validation);

        if (!validation.mesh.exists) {
            console.error('Validation failed: No mesh found');
        }

        return validation;
    }

}