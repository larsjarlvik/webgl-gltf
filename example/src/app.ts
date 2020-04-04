import * as shader from './shaders/shader-loader';
import * as defaultShader from './shaders/default-shader';
import * as camera from './camera';
import * as inputs from './inputs';
import * as cubemap from './cubemap';
import { renderModel } from './renderer';
import { DefaultShader } from './shaders/default-shader';

import * as gltf from 'webgl-gltf';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl') as WebGLRenderingContext;

const blendTime = 300;
let lastFrame = 0;

const cam = {
    rY: 0.0,
    rX: 0.0,
    distance: 3.0,
} as camera.Camera;

const setSize = () => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

if (!gl) {
    alert('WebGL not available')
}

const listAnimations = (models: gltf.Model[]) => {
    models.forEach(model => {
        if (Object.keys(model.animations).length === 0) return;

        gltf.pushAnimation(model.name, Object.keys(model.animations)[0]);

        const ui = document.getElementById('ui') as HTMLElement;
        Object.keys(model.animations).forEach(a => {
            const btn = document.createElement('button');
            btn.innerText = a;
            btn.addEventListener('click', () => gltf.pushAnimation(model.name, a));
            ui.appendChild(btn);
        });
    });
};

const render = (uniforms: DefaultShader, models: gltf.Model[]) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const cameraMatrix = camera.update(cam, canvas.width, canvas.height);
    gl.uniform3f(uniforms.cameraPosition, cameraMatrix.position[0], cameraMatrix.position[1], cameraMatrix.position[2]);
    gl.uniformMatrix4fv(uniforms.pMatrix, false, cameraMatrix.pMatrix);
    gl.uniformMatrix4fv(uniforms.vMatrix, false, cameraMatrix.vMatrix);

    models.forEach(model => {
        const animation = gltf.getActiveAnimations(model);
        const animationTransforms = gltf.getAnimationTransforms(model,
            animation.current, animation.currentDuration,
            animation.previous, animation.previousDuration,
            blendTime
        );

        if (animationTransforms !== null) {
            animationTransforms?.forEach((x, i) => { gl.uniformMatrix4fv(uniforms.jointTransform[i], false, x); });
            gl.uniform1i(uniforms.isAnimated, 1);
        } else {
            gl.uniform1i(uniforms.isAnimated, 0);
        }

        renderModel(gl, model, model.rootNode, model.nodes[model.rootNode].localBindTransform, uniforms);
    });

    gltf.advanceAnimation(performance.now() - lastFrame);

    requestAnimationFrame(() => {
        render(uniforms, models);
        lastFrame = performance.now();
    });
};

const startup = async () => {
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.enable(gl.DEPTH_TEST);

    window.onresize = () => { setSize(); };
    setSize();

    const program = shader.createProgram(gl);
    gl.attachShader(program, await shader.loadShader(gl, 'default.vert', gl.VERTEX_SHADER));
    gl.attachShader(program, await shader.loadShader(gl, 'default.frag', gl.FRAGMENT_SHADER));
    shader.linkProgram(gl, program);

    const uniforms = defaultShader.getUniformLocations(gl, program);

    const environment = await cubemap.load(gl);
    const urlParams = new URLSearchParams(window.location.search);
    const modelNames = urlParams.get('model') || 'robot';
    const models = await Promise.all(modelNames.split(',').map(m => gltf.loadModel(gl, `/models/${m}/${m}.gltf`)));
    listAnimations(models);
    console.log(models);

    cubemap.bind(gl, environment, uniforms.brdfLut, uniforms.environmentDiffuse, uniforms.environmentSpecular);

    document.getElementById('loading')?.remove();

    render(uniforms, models);
};

const rotate = (delta: inputs.Position) => {
    cam.rX += delta.y;
    cam.rY += delta.x;
};

const zoom = (delta: number) => {
    cam.distance *= 1.0 + delta;
    if (cam.distance < 0.0) cam.distance = 0.0;
};

inputs.listen(canvas, rotate, zoom);
startup();
