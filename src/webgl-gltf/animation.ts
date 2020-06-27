interface ActiveAnimation {
    key: string;
    elapsed: number;
}

interface Animations {
    [model: string]: ActiveAnimation[];
}

const activeAnimations: Animations = {};

const getAnimationFromLast = (key: string, offset = 0) => {
    if (activeAnimations[key] === undefined || activeAnimations[key].length - offset - 1 < 0) {
        return null;
    }

    return activeAnimations[key][activeAnimations[key].length - offset - 1];
}

/**
 * Sets the active animation
 * @param key Animation set key
 * @param model GLTF Model
 * @param animation Animation key
 */
const pushAnimation = (key: string, model: string, animation: string) => {
    const k = `${key}_${model}`;
    if (!activeAnimations[k]) activeAnimations[k] = [];
    if (getAnimationFromLast(k)?.key === animation) return;

    activeAnimations[k].push({
        key: animation,
        elapsed: 0,
    });

    activeAnimations[k].slice(activeAnimations[k].length - 2);
};

/**
 * Gets the current and previous animation
 * @param key Animation set key
 * @param model GLTF Model
 */
const getActiveAnimations = (key: string, model: string) => {
    const k = `${key}_${model}`;
    if (!activeAnimations[k]) return null;
    return activeAnimations[k].slice(activeAnimations[k].length - 2);
};

/**
 * Advances the animation
 * @param elapsed Time elasped since last update
 * @param key Animation set key
 */
const advanceAnimation = (elapsed: number, key?: string) => {
    Object.keys(activeAnimations).forEach(m => {
        if (key && m.indexOf(key) !== 0) return;

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
