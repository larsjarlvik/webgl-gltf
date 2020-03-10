import { Model, KeyFrame } from './gltf';
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

const getTransform = (keyFrames: KeyFrame[]) => {
    const animationTime = performance.now() / 1000.0 % keyFrames[keyFrames.length - 1].time;
    const frames = getPreviousAndNextKeyFrame(keyFrames, animationTime);
    const progression = calculateProgression(frames.previous, frames.next, animationTime);

    switch(frames.previous.type) {
        case 'translation':
        case 'scale': {
            const result = vec3.create();
            vec3.lerp(result, frames.previous.transform as vec3, frames.next.transform as vec3, progression);
            return result;
        }
        case 'rotation': {
            const result = quat.create();
            quat.slerp(result, frames.previous.transform as quat, frames.next.transform as quat, progression);
            return result;
        }
        default:
            throw new Error('Unknown type!');
    }
};

const update = (gl: WebGL2RenderingContext, model: Model, uniforms: Uniforms) => {
    if (!model.channels) return;

    const transforms: { [key: number]: mat4 } = {};
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

    model.skins.forEach(s => {
        const currentTransform = mat4.create();
        s.joints.forEach((j, i) => {
            if (transforms[model.nodes[j].id] !== undefined) {
                mat4.multiply(currentTransform, currentTransform, transforms[model.nodes[j].id]);
            }

            const animatedTransform = mat4.create();
            mat4.multiply(animatedTransform, currentTransform, s.inverseBindTransforms[i]);
            gl.uniformMatrix4fv(uniforms.jointTransform[i], false, animatedTransform);
        });
    });
};

export {
    update,
};
