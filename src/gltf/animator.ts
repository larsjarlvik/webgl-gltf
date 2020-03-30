import { Model, KeyFrame, Skin, Channel } from './parsedMesh';
import { mat4, vec3, quat } from 'gl-matrix';
import { DefaultShader } from 'shaders/default-shader';

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

interface Transform {
    [key: number]: mat4;
}

const applyTransforms = (target: WebGLUniformLocation[], model: Model, transforms: Transform, matrix: mat4, skin: Skin, nodeIndex: number) => {
    const node = model.nodes[nodeIndex];

    if (transforms[node.id] !== undefined) {
        mat4.multiply(matrix, matrix, transforms[node.id]);
    }

    const animatedTransform = mat4.create();
    const transformIndex = skin.joints.indexOf(node.id);
    if (transformIndex >= 0) {
        mat4.multiply(animatedTransform, matrix, skin.inverseBindTransforms[transformIndex]);
        gl.uniformMatrix4fv(target[transformIndex], false, animatedTransform);
    }


    node.children.forEach(childNode => {
        const childTransform = mat4.create();
        mat4.copy(childTransform, matrix);
        applyTransforms(target, model, transforms, childTransform, skin, childNode);
    });
};




const update = (model: Model, uniforms: DefaultShader, a1?: Channel, a2?: Channel, blend = 0) => {
    if (!a1) {
        gl.uniform1i(uniforms.isAnimated, 0);
        return;
    }

    const transforms: { [key: number]: mat4 } = {};
    Object.keys(a1).forEach(c => {
        const t1 = a1[c].translation.length > 0 ? getTransform(a1[c].translation) as vec3 : vec3.create();
        const r1 = a1[c].rotation.length > 0 ? getTransform(a1[c].rotation) as quat : quat.create();
        const s1 = a1[c].scale.length > 0 ? getTransform(a1[c].scale) as vec3 : vec3.fromValues(1, 1, 1);

        if (a2 !== undefined) {
            const t2 = getTransform(a2[c].translation) as vec3;
            const r2 = getTransform(a2[c].rotation) as quat;
            const s2 = getTransform(a2[c].scale) as vec3;

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

    model.skins.forEach(skin => {
        const root = model.rootNode;
        applyTransforms(uniforms.jointTransform, model, transforms, mat4.create(), skin, root);
    });

    gl.uniform1i(uniforms.isAnimated, 1);
};

export {
    update,
};
