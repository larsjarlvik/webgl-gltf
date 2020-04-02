import { mat4, quat } from 'gl-matrix';

export const createMat4FromArray = (array: Float32Array | Int16Array | number[]) => {
    return mat4.fromValues(
        array[0],  array[1],  array[2],  array[3],
        array[4],  array[5],  array[6],  array[7],
        array[8],  array[9],  array[10], array[11],
        array[12], array[13], array[14], array[15]
    );
};

export const applyRotationFromQuat = (transform: mat4, rotation: number[]) => {
    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, quat.fromValues(rotation[0], rotation[1], rotation[2], rotation[3]));
    mat4.multiply(transform, rotationMatrix, transform);
}