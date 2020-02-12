import { mat4, vec3 } from 'gl-matrix';

interface Camera {
    pMatrix: mat4;
    mvMatrix: mat4;
}

const initializeCamera = (viewportWidth: number, viewportHeight: number): Camera => {
    let pMatrix = mat4.create();
    let mvMatrix = mat4.create();
    mat4.perspective(pMatrix, 45.0, viewportWidth / viewportHeight, 0.1, 100.0);
    mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0.0, 0.0, -10.0));
    mat4.rotate(mvMatrix, mvMatrix, performance.now() / 1000.0, vec3.fromValues(0, 1, 0));

    return { pMatrix, mvMatrix };
}

export {
    initializeCamera,

};
