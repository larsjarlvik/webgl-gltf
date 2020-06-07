interface ActiveAnimation {
    key: string;
    elapsed: number;
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
        elapsed: 0,
    });

    activeAnimations[model].slice(activeAnimations[model].length - 2);
};

/**
 * Gets the current and previous animation
 * @param model GLTF Model
 */
const getActiveAnimations = (model: string) => {
    if (!activeAnimations[model]) return null;
    return activeAnimations[model].slice(activeAnimations[model].length - 2);
};

/**
 * Advances the animation
 * @param elapsed Time elasped since last update
 */
const advanceAnimation = (elapsed: number) => {
    Object.keys(activeAnimations).forEach(m => {
        const current = getAnimationFromLast(m);
        const previous = getAnimationFromLast(m, 1);

        if (current) current.elapsed += elapsed;
        if (previous) previous.elapsed += elapsed;
    });
};

export {
    pushAnimation,
    getActiveAnimations,
    advanceAnimation,
    ActiveAnimation,
}
