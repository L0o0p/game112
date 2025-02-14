import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ResourceManager {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.resources = new Map();
        this.loadingPromises = new Map();
    }

    async loadGLTF(url) {
        if (this.resources.has(url)) {
            return this.resources.get(url);
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const loadPromise = new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    this.resources.set(url, gltf);
                    this.loadingPromises.delete(url);
                    resolve(gltf);
                },
                (progress) => {
                    console.log(`Loading model: ${(progress.loaded / progress.total * 100)}%`);
                },
                reject
            );
        });

        this.loadingPromises.set(url, loadPromise);
        return loadPromise;
    }
    async getModelInstance(url) {
        const baseModel = await this.loadGLTF(url);
        return {
            scene: baseModel.scene.clone(true),
            animations: baseModel.animations
        };
    }
}