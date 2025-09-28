// src/lib/three-extensions/Pass.ts
import * as THREE from 'three';

export class Pass {
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;
    renderToScreen: boolean;

    constructor() {
        this.enabled = true;
        this.needsSwap = true;
        this.clear = false;
        this.renderToScreen = false;
    }

    setSize(width: number, height: number) {}

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, delta: number, maskActive: boolean) {
        console.error('THREE.Pass: .render() must be implemented in derived pass.');
    }
}