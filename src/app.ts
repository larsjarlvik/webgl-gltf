import * as shader from 'shaders/shader-loader';
import * as defaultShader from 'shaders/default-shader';
import * as camera from 'camera';
import * as inputs from 'inputs';

import { Model } from 'gltf/parsedMesh';
import { loadModel } from 'gltf/gltf';
import { update } from 'gltf/animator';
import { renderModel } from 'gltf/renderer';
import { DefaultShader } from 'shaders/default-shader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

const cam = {
    rotationH: 0.0,
    rotationV: 0.0,
    distance: 1.0,
} as camera.Camera;

const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

if (!gl) {
    console.error('WebGL 2 not available')
}

const render = (program: WebGLProgram, uniforms: DefaultShader, model: Model) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const cameraMatrix = camera.update(cam, canvas.width, canvas.height);
    const cameraPosition = camera.getPosition(cam);

    gl.uniform3f(uniforms.cameraPosition, cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    gl.uniformMatrix4fv(uniforms.pMatrix, false, cameraMatrix.pMatrix);
    gl.uniformMatrix4fv(uniforms.vMatrix, false, cameraMatrix.vMatrix);

    update(gl, model, uniforms);
    renderModel(gl, model, model.rootNode, model.nodes[model.rootNode].localBindTransform, uniforms);

    requestAnimationFrame(() => {
        render(program, uniforms, model);
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
    const model = await loadModel(gl, 'waterbottle');
    console.log(model);

    render(program, uniforms, model);
};

const rotate = (delta: inputs.Position) => {
    cam.rotationH += delta.x;
    cam.rotationV += delta.y;
};

const zoom = (delta: number) => {
    cam.distance *= 1.0 + delta;
    if (cam.distance < 0.0) cam.distance = 0.0;
};

inputs.listen(canvas, rotate, zoom);
startup();
