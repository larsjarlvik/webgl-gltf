import { mat4, vec3 } from 'gl-matrix';

interface Camera {
    pMatrix: mat4;
    vMatrix: mat4;
}

const initializeCamera = (viewportWidth: number, viewportHeight: number): Camera => {
    let pMatrix = mat4.create();
    let vMatrix = mat4.create();
    mat4.perspective(pMatrix, 45.0, viewportWidth / viewportHeight, 0.1, 100.0);
    mat4.translate(vMatrix, vMatrix, vec3.fromValues(0.0, 0.0, -10.0));
    mat4.rotate(vMatrix, vMatrix, performance.now() / 1000.0, vec3.fromValues(0.0, 1.0, 0.0));

    return { pMatrix, vMatrix };
}

export {
    initializeCamera,
};
