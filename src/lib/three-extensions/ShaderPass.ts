// src/lib/three-extensions/ShaderPass.ts
import { 
  ShaderMaterial, 
  IUniform, 
  UniformsUtils, 
  OrthographicCamera, 
  Scene, 
  Mesh, 
  PlaneGeometry, 
  WebGLRenderer, 
  WebGLRenderTarget 
} from 'three';
import { Pass } from './Pass';
import { CopyShader } from './CopyShader';

export class ShaderPass extends Pass {
    textureID: string;
    uniforms: { [uniform: string]: IUniform };
    material: ShaderMaterial;
    camera: OrthographicCamera;
    scene: Scene;
    quad: Mesh;

    constructor(shader: ShaderMaterial | { uniforms: { [uniform: string]: IUniform }; vertexShader: string; fragmentShader: string; defines?: { [key: string]: any } }, textureID?: string) {
        super();

        this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

        if (shader instanceof ShaderMaterial) {
            this.uniforms = shader.uniforms;
            this.material = shader;
        } else if (shader) {
            this.uniforms = UniformsUtils.clone(shader.uniforms);
            this.material = new ShaderMaterial({
                defines: Object.assign({}, shader.defines),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
        } else {
            // Fallback if no shader is provided, though it should always be.
            this.uniforms = UniformsUtils.clone(CopyShader.uniforms);
            this.material = new ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: CopyShader.vertexShader,
                fragmentShader: CopyShader.fragmentShader
            });
        }

        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new Scene();

        this.quad = new Mesh(new PlaneGeometry(2, 2), null as any); // Cast to any to satisfy type checking for null material
        this.quad.frustumCulled = false;
        this.scene.add(this.quad);
    }

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, delta: number, maskActive: boolean) {
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