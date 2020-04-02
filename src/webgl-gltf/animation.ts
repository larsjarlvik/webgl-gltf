import { Model } from './types/model';

interface ActiveAnimation {
    key: string;
    duration: number;
}

interface Animations {
    [model: string]: ActiveAnimation[];
}

const activeAnimations: Animations = {};

const getAnimationFromLast = (model: string, offset = 0) => {
    if (activeAnimations[model] === undefined || activeAnimations[model].length - offset - 1 < 0) {
        return null;
    }

    return activeAnimations[model][activeAnimations[model].length - offset - 1];
}

/**
 * Sets the active animation
 * @param model GLTF Model
 * @param animation Animation key
 */
const pushAnimation = (model: string, animation: string) => {
    if (!activeAnimations[model]) activeAnimations[model] = [];
    if (getAnimationFromLast(model)?.key === animation) return;

    activeAnimations[model].push({
        key: animation,
        duration: 0,
    });

    activeAnimations[model].slice(activeAnimations[model].length - 2);
};

/**
 * Gets the current and previous animation
 * @param model GLTF Model
 */
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

/**
 * Advances the animation
 * @param elapsed Time elasped since last update
 */
const advanceAnimation = (elapsed: number) => {
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
    advanceAnimation,
}
