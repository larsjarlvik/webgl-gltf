import { mat4 } from 'gl-matrix';

interface CameraMatrix {
    pMatrix: mat4;
    vMatrix: mat4;
}

interface Camera {
    rotationH: number;
    rotationV: number;
    distance: number;
}

const updateCamera = (camera: Camera, viewportWidth: number, viewportHeight: number): CameraMatrix => {
    let pMatrix = mat4.create();
    let vMatrix = mat4.create();

    mat4.translate(vMatrix, vMatrix, [0.0, 0.0, -camera.distance]);
    mat4.rotateX(vMatrix, vMatrix, camera.rotationV);
    mat4.rotateY(vMatrix, vMatrix, camera.rotationH);

    mat4.perspective(pMatrix, 45.0, viewportWidth / viewportHeight, 0.1, 100.0);

    return { pMatrix, vMatrix };
}

export {
    Camera,
    updateCamera,
};
