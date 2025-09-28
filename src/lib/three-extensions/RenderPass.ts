// src/lib/three-extensions/RenderPass.ts
import * as THREE from 'three';
import { Pass } from './Pass';

export class RenderPass extends Pass {
    scene: THREE.Scene;
    camera: THREE.Camera;
    overrideMaterial: THREE.Material | null;
    clearColor: THREE.Color | null;
    clearAlpha: number;
    clearDepth: boolean;

    constructor(scene: THREE.Scene, camera: THREE.Camera, overrideMaterial?: THREE.Material, clearColor?: THREE.Color, clearAlpha?: number) {
        super();

        this.scene = scene;
        this.camera = camera;
        this.overrideMaterial = overrideMaterial || null;
        this.clearColor = clearColor || null;
        this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;
        this.clear = true;
        this.clearDepth = false;
        this.needsSwap = false;
    }

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, delta: number, maskActive: boolean) {
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        this.scene.overrideMaterial = this.overrideMaterial;

        let oldClearColor: THREE.Color | undefined;
        let oldClearAlpha: number | undefined;

        if (this.clearColor) {
            oldClearColor = renderer.getClearColor().clone();
            oldClearAlpha = renderer.getClearAlpha();
            renderer.setClearColor(this.clearColor, this.clearAlpha);
        }

        if (this.clearDepth) {
            renderer.clearDepth();
        }

        renderer.render(this.scene, this.camera, this.renderToScreen ? undefined : readBuffer, this.clear);

        if (this.clearColor) {
            renderer.setClearColor(oldClearColor!, oldClearAlpha!);
        }

        this.scene.overrideMaterial = null;
        renderer.autoClear = oldAutoClear;
    }
}