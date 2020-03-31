import { Model } from 'gltf/parsedMesh';

interface ActiveAnimation {
    key: string;
    duration: number;
}

interface Animations {
    [model: string]: ActiveAnimation[];
}

const blendTime = 300;
const activeAnimations: Animations = {};

const getAnimationFromLast = (model: string, offset = 0) => {
    if (activeAnimations[model] === undefined || activeAnimations[model].length - offset - 1 < 0) {
        return null;
    }

    return activeAnimations[model][activeAnimations[model].length - offset - 1];
}

const pushAnimation = (model: string, animation: string) => {
    if (!activeAnimations[model]) activeAnimations[model] = [];
    if (getAnimationFromLast(model)?.key === animation) return;

    activeAnimations[model].push({
        key: animation,
        duration: 0,
    });

    activeAnimations[model].slice(activeAnimations[model].length - 2);
};

const getActiveAnimations = (model: Model) => {
    const currentAA = getAnimationFromLast(model.name);
    const previousAA = getAnimationFromLast(model.name, 1);

    const current = currentAA ? model.animations[currentAA.key] : undefined;
    const previous = previousAA ? model.animations[previousAA.key] : undefined;

    return {
        current,
        currentDuration: currentAA?.duration,
        previous,
        previousDuration: previousAA?.duration,
    };
};

const update = (elapsed: number) => {
    Object.keys(activeAnimations).forEach(m => {
        const current = getAnimationFromLast(m);
        const previous = getAnimationFromLast(m, 1);

        if (current) current.duration += elapsed;
        if (previous) previous.duration += elapsed;
    });
};

export {
    pushAnimation,
    getActiveAnimations,
    update,
    blendTime,
}