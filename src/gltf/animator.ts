import { Model, KeyFrame, JointTransform, Joint } from './gltf';
import { interpolateVec3, interpolateQuat } from 'utils/interpolate';
import { mat4 } from 'gl-matrix';
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

const interpolate = (a: JointTransform, b: JointTransform, progression: number) => {
    const position = interpolateVec3(a.position, b.position, progression);
    const rotation = interpolateQuat(a.rotation, b.rotation, progression);
    const scale = interpolateVec3(a.scale, b.scale, progression);

    return {
        position,
        rotation,
        scale,
    } as JointTransform;
};

const calculateProgression = (previous: KeyFrame, next: KeyFrame, animationTime: number) => {
    const currentTime = animationTime - previous.time;
    return currentTime / (next.time - previous.time);
};

const calculateCurrentAnimationPose = (keyFrames: KeyFrame[], animationTime: number) => {
    const frames = getPreviousAndNextKeyFrame(keyFrames, animationTime);
    const progression = calculateProgression(frames.previous, frames.next, animationTime);

    return interpolate(frames.previous.transform, frames.next.transform, progression);
};

const getLocalTransform = (transform: JointTransform) => {
    const localTransform = mat4.create();
    const rotTransform = mat4.create();
    mat4.fromQuat(rotTransform, transform.rotation);

    mat4.scale(localTransform, localTransform, transform.scale);
    mat4.multiply(localTransform, localTransform, rotTransform);
    mat4.translate(localTransform, localTransform, transform.position);

    return localTransform;
};

const applyPoseToJoints = (currentPose: JointTransform, joint: Joint, parentTransform: mat4) => {
    const currentLocalTransform = getLocalTransform(currentPose);
    const currentTransform = mat4.create();
    mat4.multiply(currentTransform, parentTransform, currentLocalTransform);

    joint.children.forEach(child => {
        applyPoseToJoints(currentPose, child, currentTransform);
    });

    mat4.multiply(currentTransform, joint.inverseBindTransform, currentTransform);
    joint.animatedTransform = currentTransform;
};

const update = (model: Model) => {
    const animationTime = performance.now() / 1000.0 % model.keyFrames[model.keyFrames.length - 1].time;
    const currentPose = calculateCurrentAnimationPose(model.keyFrames, animationTime);

    applyPoseToJoints(currentPose, model.rootJoint, mat4.create());
};

const bindAnimation = (gl: WebGL2RenderingContext, model: Model, uniforms: Uniforms) => {
    const jointMatrices: mat4[] = [];
    addJointsToArray(model.rootJoint, jointMatrices);

    jointMatrices.forEach((mat, i) => {
        gl.uniformMatrix4fv(uniforms.jointTransform[i], false, mat);
    });
};

const addJointsToArray = (joint: Joint, jointMatrices: mat4[]) => {
    jointMatrices[joint.id] = joint.animatedTransform;
    joint.children.forEach(c => addJointsToArray(c, jointMatrices));
};


export {
    update,
    bindAnimation,
};
