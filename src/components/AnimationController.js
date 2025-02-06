import * as THREE from 'three';

export class AnimationController {
    constructor(model,animations) {
        this.model = model;
        this.mixer = new THREE.AnimationMixer(animations);// AnimationClip[]
        this.animations = new Map();
        this.currentAction = null;

        // 设置动画
        animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            console.log('action',clip);
            this.animations.set(clip.name, action);
        });
    }

    play(name, crossFadeTime = 0.2) {
        const action = this.animations.get(name);
        if (action && this.currentAction !== action) {
            if (this.currentAction) {
                this.currentAction.fadeOut(crossFadeTime);
            }
            action.reset().fadeIn(crossFadeTime).play();
            this.currentAction = action;
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}