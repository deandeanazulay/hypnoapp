// src/lib/three-extensions/UnrealBloomPass.ts
import * as THREE from 'three';
import { Pass } from './Pass';
import { LuminosityHighPassShader } from './LuminosityHighPassShader';
import { CopyShader } from './CopyShader';

export class UnrealBloomPass extends Pass {
    strength: number;
    radius: number;
    threshold: number;
    resolution: THREE.Vector2;
    clearColor: THREE.Color;
    renderTargetsHorizontal: THREE.WebGLRenderTarget[];
    renderTargetsVertical: THREE.WebGLRenderTarget[];
    nMips: number;
    renderTargetBright: THREE.WebGLRenderTarget;
    highPassUniforms: { [uniform: string]: THREE.IUniform };
    materialHighPassFilter: THREE.ShaderMaterial;
    separableBlurMaterials: THREE.ShaderMaterial[];
    compositeMaterial: THREE.ShaderMaterial;
    bloomTintColors: THREE.Vector3[];
    copyUniforms: { [uniform: string]: THREE.IUniform };
    materialCopy: THREE.ShaderMaterial;
    oldClearColor: THREE.Color;
    oldClearAlpha: number;
    camera: THREE.OrthographicCamera;
    scene: THREE.Scene;
    basic: THREE.MeshBasicMaterial;
    quad: THREE.Mesh;

    static BlurDirectionX = new THREE.Vector2(1.0, 0.0);
    static BlurDirectionY = new THREE.Vector2(0.0, 1.0);

    constructor(resolution: THREE.Vector2, strength: number, radius: number, threshold: number) {
        super();

        this.strength = (strength !== undefined) ? strength : 1;
        this.radius = radius;
        this.threshold = threshold;
        this.resolution = (resolution !== undefined) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);

        this.clearColor = new THREE.Color(0, 0, 0);

        const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType }; // Use FloatType for HDR
        this.renderTargetsHorizontal = [];
        this.renderTargetsVertical = [];
        this.nMips = 5;
        let resx = Math.round(this.resolution.x / 2);
        let resy = Math.round(this.resolution.y / 2);

        this.renderTargetBright = new THREE.WebGLRenderTarget(resx, resy, pars);
        this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
        this.renderTargetBright.texture.generateMipmaps = false;

        for (let i = 0; i < this.nMips; i++) {
            const renderTargetHorizonal = new THREE.WebGLRenderTarget(resx, resy, pars);
            renderTargetHorizonal.texture.name = "UnrealBloomPass.h" + i;
            renderTargetHorizonal.texture.generateMipmaps = false;
            this.renderTargetsHorizontal.push(renderTargetHorizonal);

            const renderTargetVertical = new THREE.WebGLRenderTarget(resx, resy, pars);
            renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
            renderTargetVertical.texture.generateMipmaps = false;
            this.renderTargetsVertical.push(renderTargetVertical);

            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }

        const highPassShader = LuminosityHighPassShader;
        this.highPassUniforms = THREE.UniformsUtils.clone(highPassShader.uniforms);
        this.highPassUniforms["luminosityThreshold"].value = threshold;
        this.highPassUniforms["smoothWidth"].value = 0.01;

        this.materialHighPassFilter = new THREE.ShaderMaterial({
            uniforms: this.highPassUniforms,
            vertexShader: highPassShader.vertexShader,
            fragmentShader: highPassShader.fragmentShader,
            defines: {}
        });

        this.separableBlurMaterials = [];
        const kernelSizeArray = [3, 5, 7, 9, 11];
        resx = Math.round(this.resolution.x / 2);
        resy = Math.round(this.resolution.y / 2);

        for (let i = 0; i < this.nMips; i++) {
            this.separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));
            this.separableBlurMaterials[i].uniforms["texSize"].value = new THREE.Vector2(resx, resy);
            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }

        this.compositeMaterial = this.getCompositeMaterial(this.nMips);
        this.compositeMaterial.uniforms["blurTexture1"].value = this.renderTargetsVertical.texture;
        this.compositeMaterial.uniforms["blurTexture2"].value = this.renderTargetsVertical.texture;
        this.compositeMaterial.uniforms["blurTexture3"].value = this.renderTargetsVertical.texture;
        this.compositeMaterial.uniforms["blurTexture4"].value = this.renderTargetsVertical.texture;
        this.compositeMaterial.uniforms["blurTexture5"].value = this.renderTargetsVertical.texture;
        this.compositeMaterial.uniforms["bloomStrength"].value = strength;
        this.compositeMaterial.uniforms["bloomRadius"].value = 0.1;
        this.compositeMaterial.needsUpdate = true;

        const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
        this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
        this.bloomTintColors = [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1),
                                 new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)];
        this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;

        const copyShader = CopyShader;
        this.copyUniforms = THREE.UniformsUtils.clone(copyShader.uniforms);
        this.copyUniforms["opacity"].value = 1.0;

        this.materialCopy = new THREE.ShaderMaterial({
            uniforms: this.copyUniforms,
            vertexShader: copyShader.vertexShader,
            fragmentShader: copyShader.fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });

        this.enabled = true;
        this.needsSwap = false;

        this.oldClearColor = new THREE.Color();
        this.oldClearAlpha = 1;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new THREE.Scene();

        this.basic = new THREE.MeshBasicMaterial();

        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null as any); // Cast to any
        this.quad.frustumCulled = false;
        this.scene.add(this.quad);
    }

    dispose() {
        for (let i = 0; i < this.renderTargetsHorizontal.length; i++) {
            this.renderTargetsHorizontal[i].dispose();
        }
        for (let i = 0; i < this.renderTargetsVertical.length; i++) {
            this.renderTargetsVertical[i].dispose();
        }
        this.renderTargetBright.dispose();
    }

    setSize(width: number, height: number) {
        let resx = Math.round(width / 2);
        let resy = Math.round(height / 2);

        this.renderTargetBright.setSize(resx, resy);

        for (let i = 0; i < this.nMips; i++) {
            this.renderTargetsHorizontal[i].setSize(resx, resy);
            this.renderTargetsVertical[i].setSize(resx, resy);
            this.separableBlurMaterials[i].uniforms["texSize"].value = new THREE.Vector2(resx, resy);
            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }
    }

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, delta: number, maskActive: boolean) {
        this.oldClearColor.copy(renderer.getClearColor());
        this.oldClearAlpha = renderer.getClearAlpha();
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        renderer.setClearColor(this.clearColor, 0);

        if (maskActive) renderer.context.disable(renderer.context.STENCIL_TEST);

        // Render input to screen (if renderToScreen is true)
        if (this.renderToScreen) {
            this.quad.material = this.basic;
            (this.basic as any).map = readBuffer.texture; // Cast to any to assign map
            renderer.render(this.scene, this.camera, undefined, true);
        }

        // 1. Extract Bright Areas
        this.highPassUniforms["tDiffuse"].value = readBuffer.texture;
        this.highPassUniforms["luminosityThreshold"].value = this.threshold;
        this.quad.material = this.materialHighPassFilter;
        renderer.render(this.scene, this.camera, this.renderTargetBright, true);

        // 2. Blur All the mips progressively
        let inputRenderTarget: THREE.WebGLRenderTarget = this.renderTargetBright;

        for (let i = 0; i < this.nMips; i++) {
            this.quad.material = this.separableBlurMaterials[i];

            this.separableBlurMaterials[i].uniforms["colorTexture"].value = inputRenderTarget.texture;
            this.separableBlurMaterials[i].uniforms["direction"].value = UnrealBloomPass.BlurDirectionX;
            renderer.render(this.scene, this.camera, this.renderTargetsHorizontal[i], true);

            this.separableBlurMaterials[i].uniforms["colorTexture"].value = this.renderTargetsHorizontal[i].texture;
            this.separableBlurMaterials[i].uniforms["direction"].value = UnrealBloomPass.BlurDirectionY;
            renderer.render(this.scene, this.camera, this.renderTargetsVertical[i], true);

            inputRenderTarget = this.renderTargetsVertical[i];
        }

        // Composite All the mips
        this.quad.material = this.compositeMaterial;
        this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
        this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
        this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;

        renderer.render(this.scene, this.camera, this.renderTargetsHorizontal, true);

        // Blend it additively over the input texture
        this.quad.material = this.materialCopy;
        this.copyUniforms["tDiffuse"].value = this.renderTargetsHorizontal.texture;

        if (maskActive) renderer.context.enable(renderer.context.STENCIL_TEST);

        if (this.renderToScreen) {
            renderer.render(this.scene, this.camera, undefined, false);
        } else {
            renderer.render(this.scene, this.camera, readBuffer, false);
        }

        // Restore renderer settings
        renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
        renderer.autoClear = oldAutoClear;
    }

    getSeperableBlurMaterial(kernelRadius: number) {
        return new THREE.ShaderMaterial({
            defines: {
                "KERNEL_RADIUS": kernelRadius,
                "SIGMA": kernelRadius
            },
            uniforms: {
                "colorTexture": { value: null },
                "texSize": { value: new THREE.Vector2(0.5, 0.5) },
                "direction": { value: new THREE.Vector2(0.5, 0.5) }
            },
            vertexShader:
                "varying vec2 vUv;\n\
                void main() {\n\
                    vUv = uv;\n\
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }",
            fragmentShader:
                "#include <common>\
                varying vec2 vUv;\n\
                uniform sampler2D colorTexture;\n\
                uniform vec2 texSize;\
                uniform vec2 direction;\
                \
                float gaussianPdf(in float x, in float sigma) {\
                    return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\
                }\
                void main() {\n\
                    vec2 invSize = 1.0 / texSize;\
                    float fSigma = float(SIGMA);\
                    float weightSum = gaussianPdf(0.0, fSigma);\
                    vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
                    for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
                        float x = float(i);\
                        float w = gaussianPdf(x, fSigma);\
                        vec2 uvOffset = direction * invSize * x;\
                        vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;\
                        vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;\
                        diffuseSum += (sample1 + sample2) * w;\
                        weightSum += 2.0 * w;\
                    }\
                    gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
                }"
        });
    }

    getCompositeMaterial(nMips: number) {
        return new THREE.ShaderMaterial({
            defines: {
                "NUM_MIPS": nMips
            },
            uniforms: {
                "blurTexture1": { value: null },
                "blurTexture2": { value: null },
                "blurTexture3": { value: null },
                "blurTexture4": { value: null },
                "blurTexture5": { value: null },
                "dirtTexture": { value: null },
                "bloomStrength": { value: 1.0 },
                "bloomFactors": { value: null },
                "bloomTintColors": { value: null },
                "bloomRadius": { value: 0.0 }
            },
            vertexShader:
                "varying vec2 vUv;\n\
                void main() {\n\
                    vUv = uv;\n\
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }",
            fragmentShader:
                "varying vec2 vUv;\
                uniform sampler2D blurTexture1;\
                uniform sampler2D blurTexture2;\
                uniform sampler2D blurTexture3;\
                uniform sampler2D blurTexture4;\
                uniform sampler2D blurTexture5;\
                uniform sampler2D dirtTexture;\
                uniform float bloomStrength;\
                uniform float bloomRadius;\
                uniform float bloomFactors[NUM_MIPS];\
                uniform vec3 bloomTintColors[NUM_MIPS];\
                \
                float lerpBloomFactor(const in float factor) { \
                    float mirrorFactor = 1.2 - factor;\
                    return mix(factor, mirrorFactor, bloomRadius);\
                }\
                \
                void main() {\
                    gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors) * vec4(bloomTintColors, 1.0) * texture2D(blurTexture1, vUv) + \
                                                     lerpBloomFactor(bloomFactors) * vec4(bloomTintColors, 1.0) * texture2D(blurTexture2, vUv) + \
                                                     lerpBloomFactor(bloomFactors) * vec4(bloomTintColors, 1.0) * texture2D(blurTexture3, vUv) + \
                                                     lerpBloomFactor(bloomFactors) * vec4(bloomTintColors, 1.0) * texture2D(blurTexture4, vUv) + \
                                                     lerpBloomFactor(bloomFactors) * vec4(bloomTintColors, 1.0) * texture2D(blurTexture5, vUv) );\
                }"
        });
    }
}