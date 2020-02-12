import * as shader from 'shaders/shader-loader';
import * as defaultShader from 'shaders/default-shader';
import * as gltf from 'gltf';
import { initializeCamera } from 'camera';
import { bindBuffers, Mesh } from 'gltf';

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;


const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}


if (!gl) {
    console.error("WebGL 2 not available");
}

const render = (program: WebGLProgram, mesh: Mesh) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const uniforms = defaultShader.getUniformLocations(gl, program);
    const camera = initializeCamera(canvas.width, canvas.height);

    gl.uniformMatrix4fv(uniforms.pMatrixLoc, false, camera.pMatrix);
    gl.uniformMatrix4fv(uniforms.mvMatrixLoc, false, camera.mvMatrix);
    gl.drawElements(gl.TRIANGLES, mesh.elements, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(() => {
        render(program, mesh);
    });
};

const startup = async () => {
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    window.onresize = () => { setSize(); };
    setSize();

    const program = shader.createProgram(gl);
    gl.attachShader(program, await shader.loadShader(gl, 'default.vert', gl.VERTEX_SHADER));
    gl.attachShader(program, await shader.loadShader(gl, 'default.frag', gl.FRAGMENT_SHADER));
    shader.linkProgram(gl, program);

    const model = await gltf.loadModel('suzanne');
    bindBuffers(gl, model[0]);
    render(program, model[0]);
};

startup();
