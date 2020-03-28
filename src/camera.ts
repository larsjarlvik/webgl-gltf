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
    camera.distance * Math.sin(camera.rX) * Math.cos(camera.rY),
    camera.distance * Math.sin(camera.rY),
    camera.distance * Math.cos(camera.rX) * Math.cos(camera.rY),
);

const update = (camera: Camera, viewportWidth: number, viewportHeight: number): CameraMatrix => {
    const pMatrix = mat4.create();
    const vMatrix = mat4.create();
    const position = getPosition(camera);

    mat4.lookAt(vMatrix, position, vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
    mat4.perspective(pMatrix, 45.0, viewportWidth / viewportHeight, 0.1, 100.0);

    return { pMatrix, vMatrix, position };
};

export {
    Camera,
    update,
};
