// src/lib/three-extensions/ShaderPass.ts
import * as THREE from 'three';
import { Pass } from './Pass';
import { CopyShader } from './CopyShader';

export class ShaderPass extends Pass {
    textureID: string;
    uniforms: { [uniform: string]: THREE.IUniform };
    material: THREE.ShaderMaterial;
    camera: THREE.OrthographicCamera;
    scene: THREE.Scene;
    quad: THREE.Mesh;

    constructor(shader: THREE.ShaderMaterial | { uniforms: { [uniform: string]: THREE.IUniform }; vertexShader: string; fragmentShader: string; defines?: { [key: string]: any } }, textureID?: string) {
        super();

        this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

        if (shader instanceof THREE.ShaderMaterial) {
            this.uniforms = shader.uniforms;
            this.material = shader;
        } else if (shader) {
            this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            this.material = new THREE.ShaderMaterial({
                defines: Object.assign({}, shader.defines),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
        } else {
            // Fallback if no shader is provided, though it should always be.
            this.uniforms = THREE.UniformsUtils.clone(CopyShader.uniforms);
            this.material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: CopyShader.vertexShader,
                fragmentShader: CopyShader.fragmentShader
            });
        }

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new THREE.Scene();

        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null as any); // Cast to any to satisfy type checking for null material
        this.quad.frustumCulled = false;
        this.scene.add(this.quad);
    }

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, delta: number, maskActive: boolean) {
        if (this.uniforms[this.textureID]) {
            this.uniforms[this.textureID].value = readBuffer.texture;
        }

        this.quad.material = this.material;

        if (this.renderToScreen) {
            renderer.render(this.scene, this.camera);
        } else {
            renderer.render(this.scene, this.camera, writeBuffer, this.clear);
        }
    }
}