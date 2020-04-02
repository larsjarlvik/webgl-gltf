import { mat4, vec3 } from 'gl-matrix';

interface CameraMatrix {
    pMatrix: mat4;
    vMatrix: mat4;
    position: vec3;
}

interface Camera {
    rY: number;
    rX: number;
    distance: number;
}


const getPosition = (camera: Camera) => vec3.fromValues(
    camera.distance * Math.sin(-camera.rY) * Math.cos(-camera.rX),
    camera.distance * Math.sin(camera.rX),
    camera.distance * Math.cos(-camera.rY) * Math.cos(-camera.rX),
);

const update = (camera: Camera, viewportWidth: number, viewportHeight: number): CameraMatrix => {
    const pMatrix = mat4.create();
    const vMatrix = mat4.create();
    const position = getPosition(camera);

    mat4.translate(vMatrix, vMatrix, vec3.fromValues(0.0, 0.0, -camera.distance));
    mat4.rotateX(vMatrix, vMatrix, camera.rX);
    mat4.rotateY(vMatrix, vMatrix, camera.rY);

    mat4.perspective(pMatrix, 45.0, viewportWidth / viewportHeight, 0.1, 100.0);

    return { pMatrix, vMatrix, position };
};

export {
    Camera,
    update,
};
