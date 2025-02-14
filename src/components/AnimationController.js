import * as THREE from 'three';

export class AnimationController {
    constructor(model, animationClips) {
        this.model = model;
        this.mixer = new THREE.AnimationMixer(model);// AnimationClip[]
        this.animations = new Map();
        this.currentAction = null;
        this.previousAction = null; // 用于记住一次性动画之前的动画
        this.isPlayingOneShot = false; // 用于标记是否正在播放一次性动画
        console.log('animationClips', animationClips);
        // 设置动画
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
    // play(name, crossFadeTime = 0.2) {
    //     const action = this.animations.get(name);
    //     if (action && this.currentAction !== action) {
    //         if (this.currentAction) {
    //             this.currentAction.fadeOut(crossFadeTime);
    //         }
    //         action.reset().fadeIn(crossFadeTime).play();
    //         this.currentAction = action;
    //     }
    // }
    play(name, crossFadeTime = 0.2) {
        if (this.isPlayingOneShot) return; // 如果正在播放一次性动画，不要打断它
        // console.log('action-name',name);
        const action = this.animations.get(`${name}`);;
        // console.log('action',action);
        if (action && this.currentAction !== action) {
            // 如果当前有动画在播放，淡出它
            if (this.currentAction) {
                this.currentAction.fadeOut(crossFadeTime);
            }
            // 设置为循环播放
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            // 播放新动画
            action.reset()
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .fadeIn(crossFadeTime)
                .play();

            this.currentAction = action;
            this.currentAction.play()
        }
    }
    // 播放一次性动画（如受击、攻击等）
    playOneShot(name, onComplete) {
        const action = this.animations.get(name);
        if (!action) return;

        this.isPlayingOneShot = true;
        // 保存之前的动画
        this.previousAction = this.currentAction;
        // const previousAnimation = this.currentAction;
        // 如果有当前动画在播放，先停止它
        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
            this.currentAction.setEffectiveWeight(0);
        }

        // 设置为不循环
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(0.2);

        action.play();

        // 监听动画完成
        const onFinished = () => {
            this.isPlayingOneShot = false;
            // 完全停止一次性动画
            const oldAction = this.currentAction;
            const crossFadeTime = .1
            oldAction.fadeOut(crossFadeTime);
            // 确保在淡出后完全停止
            setTimeout(() => {
                //     oldAction.stop();
                oldAction.setEffectiveWeight(0);
            }, crossFadeTime);

            // 恢复之前的动画
            if (this.previousAction) {
                this.previousAction.reset()
                    .fadeIn(0.2)
                    .play();
                this.currentAction = this.previousAction;
            }

            if (onComplete) onComplete();

            // 移除监听器
            this.mixer.removeEventListener('finished', onFinished);
        };

        this.mixer.addEventListener('finished', onFinished);
        this.currentAction = action;
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    // 用于获取当前播放的动画名称（调试用）
    getCurrentAnimationName() {
        if (!this.currentAction) return 'none';
        for (const [name, action] of this.animations.entries()) {
            if (action === this.currentAction) return name;
        }
        return 'unknown';
    }

}