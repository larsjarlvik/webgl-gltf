import { quat, vec3 } from 'gl-matrix';

const interpolateQuat = (a: quat, b: quat, blend: number) => {
    const result = quat.create();
    const dot = a[3] * b[3] + a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const blendI = 1 - blend;

    if (dot < 0) {
        result[3] = blendI * a[3] + blend * -b[3];
        result[0] = blendI * a[0] + blend * -b[0];
        result[1] = blendI * a[1] + blend * -b[1];
        result[2] = blendI * a[2] + blend * -b[2];
    } else {
        result[3] = blendI * a[3] + blend * b[3];
        result[0] = blendI * a[0] + blend * b[0];
        result[1] = blendI * a[1] + blend * b[1];
        result[2] = blendI * a[2] + blend * b[2];
    }

    quat.normalize(result, result);
    return result;
};

const interpolateVec3 = (a: vec3, b: vec3, blend: number) => {
    const x = a[0] + (b[0] - a[0]) * blend;
    const y = a[1] + (b[1] - a[1]) * blend;
    const z = a[2] + (b[2] - a[2]) * blend;

    return vec3.fromValues(x, y, z);
};

export {
    interpolateQuat,
    interpolateVec3,
};
