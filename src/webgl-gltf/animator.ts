import { Model, KeyFrame, Skin, Channel } from './types/model';
import { mat4, vec3, quat } from 'gl-matrix';

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

const getTransform = (keyFrames: KeyFrame[], duration: number) => {
    const animationTime = duration / 1000.0 % keyFrames[keyFrames.length - 1].time;
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

interface Transform {
    [key: number]: mat4;
}

const applyTransforms = (appliedTransforms: mat4[], model: Model, transforms: Transform, matrix: mat4, skin: Skin, nodeIndex: number) => {
    const node = model.nodes[nodeIndex];

    if (transforms[node.id] !== undefined) {
        mat4.multiply(matrix, matrix, transforms[node.id]);
    }

    const animatedTransform = mat4.create();
    const transformIndex = skin.joints.indexOf(node.id);
    if (transformIndex >= 0) {
        mat4.multiply(animatedTransform, matrix, skin.inverseBindTransforms[transformIndex]);
        appliedTransforms[transformIndex] = animatedTransform;
    }

    node.children.forEach(childNode => {
        const childTransform = mat4.create();
        mat4.copy(childTransform, matrix);
        applyTransforms(appliedTransforms, model, transforms, childTransform, skin, childNode);
    });
};


/**
 * Blends two animations and returns their transform matrices
 * @param model GLTF Model
 * @param current Current animation
 * @param currentElapsed Elapsed time for current animation
 * @param previous Previous animation
 * @param previouseElapsed Elapsed time for previous animation
 * @param blendTime How long the blend should be in milliseconds
 */
const getAnimationTransforms = (model: Model, current?: Channel, currentElapsed?: number, previous?: Channel, previouseElapsed?: number, blendTime = 0) => {
    if (!current || currentElapsed === undefined) {
        return null;
    }

    const transforms: { [key: number]: mat4 } = {};

    Object.keys(current).forEach(c => {
        const t1 = current[c].translation.length > 0 ? getTransform(current[c].translation, currentElapsed) as vec3 : vec3.create();
        const r1 = current[c].rotation.length > 0 ? getTransform(current[c].rotation, currentElapsed) as quat : quat.create();
        const s1 = current[c].scale.length > 0 ? getTransform(current[c].scale, currentElapsed) as vec3 : vec3.fromValues(1, 1, 1);

        const blend = -((currentElapsed - blendTime) / blendTime);
        if (previous && previouseElapsed !== undefined && blend > 0) {
            const t2 = getTransform(previous[c].translation, previouseElapsed) as vec3;
            const r2 = getTransform(previous[c].rotation, previouseElapsed) as quat;
            const s2 = getTransform(previous[c].scale, previouseElapsed) as vec3;

            if (t2 !== undefined) vec3.lerp(t1, t1, t2, blend);
            if (r2 !== undefined) quat.slerp(r1, r1, r2, blend);
            if (s2 !== undefined) vec3.lerp(s1, s1, s2, blend);
        }

        const localTransform = mat4.create();
        const rotTransform = mat4.create();
        mat4.fromQuat(rotTransform, r1 as quat);

        mat4.translate(localTransform, localTransform, t1 as vec3);
        mat4.multiply(localTransform, localTransform, rotTransform);
        mat4.scale(localTransform, localTransform, s1 as vec3);

        transforms[c] = localTransform;
    });

    const appliedTransforms: mat4[] = [];
    model.skins.forEach(skin => {
        const root = model.rootNode;
        applyTransforms(appliedTransforms, model, transforms, mat4.create(), skin, root);
    });

    return appliedTransforms;
};

export {
    getAnimationTransforms,
};
