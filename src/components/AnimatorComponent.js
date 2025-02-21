import { Component } from "./Component";
import * as THREE from 'three'


export class AnimatorComponent extends Component {
    constructor(params = {}) {
        super();
        this.mesh = params.mesh;
        this.animations = new Map();
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.currentAction = null;
        this.defaultAnimation = params.defaultAnimation || 'idle';

        // 初始化动画
        if (params.animations) {
            this.initAnimations(params.animations);
        }
    }

    initAnimations(animationClips) {
        console.log('animationClipsX',animationClips);
        
        animationClips.forEach(clip => {
            // 移除 "_Armature" 后缀，使动画名称更简洁
            const name = clip.name.replace('_Armature', '');
            const action = this.mixer.clipAction(clip);
            console.log('action', clip);
            this.animations.set(name, action);
            console.log(`Loaded animation: ${name}`);
            console.log('Loaded animations:', {
                count: this.animations.size,
                names: Array.from(this.animations.keys())
            });
        });

    }

    play(name, crossFadeTime = 0.2) {
        if (!this.animations.has(name)) return;

        const newAction = this.animations.get(name);
        
        if (this.currentAction === newAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(crossFadeTime);
        }
 
        newAction.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(crossFadeTime)
            .play();

        this.currentAction = newAction;
    }

    playOneShot(name, onComplete) {
        if (!this.animations.has(name)) return;

        const animation = this.animations.get(name);
        // const action = animation.action;
        console.log('animation',animation);

        animation.reset()
            .setLoop(THREE.LoopOnce, 1)
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .play();

        if (onComplete) {
            const mixer = this.mixer;
            const id = mixer.addEventListener('finished', function onFinish(e) {
                if (e.animation === animation) {
                    onComplete();
                    mixer.removeEventListener('finished', onFinish);
                }
            });
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    onRemove() {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mesh);
        }
    }
} 