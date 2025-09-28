// src/lib/three-extensions/RenderPass.ts
import { 
  Scene, 
  Camera, 
  Material, 
  Color, 
  WebGLRenderer, 
  WebGLRenderTarget 
} from 'three';
import { Pass } from './Pass';

export class RenderPass extends Pass {
    scene: Scene;
    camera: Camera;
    overrideMaterial: Material | null;
    clearColor: Color | null;
    clearAlpha: number;
    clearDepth: boolean;

    constructor(scene: Scene, camera: Camera, overrideMaterial?: Material, clearColor?: Color, clearAlpha?: number) {
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

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, delta: number, maskActive: boolean) {
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        this.scene.overrideMaterial = this.overrideMaterial;

        let oldClearColor: Color | undefined;
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