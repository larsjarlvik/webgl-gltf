import { Model, KeyFrame, Joint } from './gltf';
import { interpolateVec3, interpolateQuat } from 'utils/interpolate';
import { mat4, vec3, quat } from 'gl-matrix';
import { Uniforms } from 'shaders/default-shader';

const getPreviousAndNextKeyFrame = (keyFrames: KeyFrame[], animationTime: number) => {
    let next = keyFrames[0];
    let previous = keyFrames[0];

    for (let i = 1; i < keyFrames.length; i ++) {
        next = keyFrames[i];
        if (next.time > animationTime) {
            break;
        }
        previous = keyFrames[i];
    }

    return { previous, next };
}

const calculateProgression = (previous: KeyFrame, next: KeyFrame, animationTime: number) => {
    const currentTime = animationTime - previous.time;
    return currentTime / (next.time - previous.time);
};

const applyPoseToJoints = (currentPose: { [key: string]: mat4 }, joint: Joint, parentTransform: mat4) => {
    const currentTransform = mat4.create();

    if (currentPose[joint.id] !== undefined) {
        mat4.multiply(currentTransform, parentTransform, currentPose[joint.id]);
    }

    joint.children.forEach(child => {
        applyPoseToJoints(currentPose, child, currentTransform);
    });

    mat4.multiply(currentTransform, joint.inverseBindTransform, currentTransform);
    joint.animatedTransform = currentTransform;
};

const getTransform = (keyFrames: KeyFrame[]) => {
    const animationTime = performance.now() / 1000.0 % keyFrames[keyFrames.length - 1].time;
    const frames = getPreviousAndNextKeyFrame(keyFrames, animationTime);
    const progression = calculateProgression(frames.previous, frames.next, animationTime);

    switch(frames.previous.type) {
        case 'translation':
        case 'scale':
            return interpolateVec3(frames.previous.transform as vec3, frames.next.transform as vec3, progression);
        case 'rotation':
            return interpolateQuat(frames.previous.transform as quat, frames.next.transform as quat, progression);
        default:
            throw new Error('Unknown type!');
    }
};

const update = (model: Model) => {
    const transforms: { [key: string]: mat4 } = {};
    Object.keys(model.channels).forEach(c => {
        const translation = model.channels[c].translation.length > 0 ? getTransform(model.channels[c].translation) : vec3.create();
        const rotation = model.channels[c].rotation.length > 0 ? getTransform(model.channels[c].rotation) : quat.create();
        const scale = model.channels[c].scale.length > 0 ? getTransform(model.channels[c].scale) : vec3.fromValues(1, 1, 1);

        const localTransform = mat4.create();
        const rotTransform = mat4.create();
        mat4.fromQuat(rotTransform, rotation as quat);

        mat4.translate(localTransform, localTransform, translation as vec3);
        mat4.multiply(localTransform, localTransform, rotTransform);
        mat4.scale(localTransform, localTransform, scale as vec3);

        transforms[c] = localTransform;
    });

    applyPoseToJoints(transforms, model.rootJoint, mat4.create());
};

const bindAnimation = (gl: WebGL2RenderingContext, model: Model, uniforms: Uniforms) => {
    const jointMatrices: mat4[] = [];
    addJointsToArray(0, model.rootJoint, jointMatrices);

    jointMatrices.forEach((mat, i) => {
        gl.uniformMatrix4fv(uniforms.jointTransform[i], false, mat);
    });
};

const addJointsToArray = (n: number, joint: Joint, jointMatrices: mat4[]) => {
    if (joint.isJoint) {
        jointMatrices[n] = joint.animatedTransform;
        n ++;
    }
    joint.children.forEach(c => addJointsToArray(n, c, jointMatrices));
};

export {
    update,
    bindAnimation,
};
