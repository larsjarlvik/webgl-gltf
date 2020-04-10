import { Model, KeyFrame, Skin, Transform } from './types/model';
import { mat4, vec3, quat } from 'gl-matrix';
import { ActiveAnimation } from './animation';

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

interface TransformMatrices {
    [key: number]: mat4;
}

const applyTransforms = (appliedTransforms: mat4[], model: Model, transforms: TransformMatrices, matrix: mat4, skin: Skin, nodeIndex: number) => {
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


const get = (c: Transform, elapsed: number) => {
    const t = c.translation.length > 0 ? getTransform(c.translation, elapsed) as vec3 : vec3.create();
    const r = c.rotation.length > 0 ? getTransform(c.rotation, elapsed) as quat : quat.create();
    const s = c.scale.length > 0 ? getTransform(c.scale, elapsed) as vec3 : vec3.fromValues(1, 1, 1);
    return { t, r, s };
}


/**
 * Blends two animations and returns their transform matrices
 * @param model GLTF Model
 * @param activeAnimations Currently running animations
 * @param blendTime How long the blend should be in milliseconds
 */
const getAnimationTransforms = (model: Model, activeAnimations: ActiveAnimation[], blendTime = 0) => {
    const transforms: { [key: number]: mat4 } = {};

    activeAnimations.forEach(rootAnimation => {
        const blend = -((rootAnimation.elapsed - blendTime) / blendTime);

        Object.keys(model.animations[rootAnimation.key]).forEach(c => {
            const transform = get(model.animations[rootAnimation.key][c], rootAnimation.elapsed);

            activeAnimations.forEach(ac => {
                if (rootAnimation.key == ac.key || blend <= 0) return;

                const cTransform = get(model.animations[ac.key][c], ac.elapsed);
                vec3.lerp(transform.t, transform.t, cTransform.t, blend);
                quat.slerp(transform.r, transform.r, cTransform.r, blend);
                vec3.lerp(transform.s, transform.s, cTransform.s, blend);
            });

            const localTransform = mat4.create();
            const rotTransform = mat4.create();
            mat4.fromQuat(rotTransform, transform.r as quat);

            mat4.translate(localTransform, localTransform, transform.t as vec3);
            mat4.multiply(localTransform, localTransform, rotTransform);
            mat4.scale(localTransform, localTransform, transform.s as vec3);

            transforms[c] = localTransform;
        });
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
