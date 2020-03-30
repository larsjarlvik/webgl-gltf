import * as shader from 'shaders/shader-loader';
import * as defaultShader from 'shaders/default-shader';
import * as camera from 'camera';
import * as inputs from 'inputs';
import * as cubemap from 'cubemap';

import { Model } from 'gltf/parsedMesh';
import { loadModel } from 'gltf/gltf';
import { update } from 'gltf/animator';
import { renderModel } from 'gltf/renderer';
import { DefaultShader } from 'shaders/default-shader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
window['gl'] = canvas.getContext('webgl2') as WebGL2RenderingContext;

const activeAnimations: string[] = [];
const animationBlendTime = 300;
let lastAnimation = 0;

const addAnimation = (animation: string) => {
    activeAnimations.push(animation);
    lastAnimation = performance.now();
};

const cam = {
    rY: 0.0,
    rX: 0.0,
    distance: 3.0,
} as camera.Camera;

const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

if (!gl) {
    alert('WebGL 2 not available')
}

const listAnimations = (model: Model) => {
    const ui = document.getElementById('ui') as HTMLElement;
    Object.keys(model.animations).forEach(a => {
        const btn = document.createElement('button');
        btn.innerText = a;
        btn.addEventListener('touchstart', () => addAnimation(a));
        btn.addEventListener('mousedown', () => addAnimation(a));
        ui.appendChild(btn);
    });

    document.addEventListener('keydown', e => {
        const a = Object.keys(model.animations)[parseInt(e.key) - 1];
        if (!a) return;
        addAnimation(a);
    });
};

const render = (shader: DefaultShader, models: Model[]) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const cameraMatrix = camera.update(cam, canvas.width, canvas.height);
    gl.uniform3f(shader.cameraPosition, cameraMatrix.position[0], cameraMatrix.position[1], cameraMatrix.position[2]);
    gl.uniformMatrix4fv(shader.pMatrix, false, cameraMatrix.pMatrix);
    gl.uniformMatrix4fv(shader.vMatrix, false, cameraMatrix.vMatrix);

    models.forEach(model => {
        const blend = performance.now() - lastAnimation;
        const a1 = model.animations[activeAnimations[activeAnimations.length - 1]];
        const a2 = blend <= animationBlendTime ? model.animations[activeAnimations[activeAnimations.length - 2]] : undefined;

        update(model, shader, a1, a2, 1.0 - (blend / animationBlendTime));
        renderModel(model, model.rootNode, model.nodes[model.rootNode].localBindTransform, shader);
    });

    requestAnimationFrame(() => {
        render(shader, models);
    });
};

const startup = async () => {
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.enable(gl.DEPTH_TEST);

    window.onresize = () => { setSize(); };
    setSize();

    const program = shader.createProgram();
    gl.attachShader(program, await shader.loadShader('default.vert', gl.VERTEX_SHADER));
    gl.attachShader(program, await shader.loadShader('default.frag', gl.FRAGMENT_SHADER));
    shader.linkProgram(program);

    const uniforms = defaultShader.getUniformLocations(program);

    const environment = await cubemap.load();
    const urlParams = new URLSearchParams(window.location.search);
    const modelNames = urlParams.get('model') || 'waterbottle';
    const models = await Promise.all(modelNames.split(',').map(m => loadModel(m)));
    listAnimations(models[0]);

    if (Object.keys(models[0].animations).length > 0) activeAnimations.push(Object.keys(models[0].animations)[0]);

    console.log(models);

    cubemap.bind(environment, uniforms.brdfLut, uniforms.environmentDiffuse, uniforms.environmentSpecular)
    render(uniforms, models);
};

const rotate = (delta: inputs.Position) => {
    cam.rX -= delta.x;
    cam.rY -= delta.y;
};

const zoom = (delta: number) => {
    cam.distance *= 1.0 + delta;
    if (cam.distance < 0.0) cam.distance = 0.0;
};

inputs.listen(canvas, rotate, zoom);
startup();
