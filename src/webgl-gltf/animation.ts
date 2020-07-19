interface ActiveAnimation {
    key: string;
    elapsed: number;
}

interface Animations {
    [model: string]: ActiveAnimation[][];
}

const activeAnimations: Animations = {};

const getAnimationFromLast = (track: string, key: string, offset = 0) => {
    if (activeAnimations[track] === undefined || activeAnimations[track][key] === undefined || activeAnimations[track][key].length - offset - 1 < 0) {
        return null;
    }

    return activeAnimations[track][key][activeAnimations[track][key].length - offset - 1];
}

/**
 * Sets the active animation
 * @param track Animation track
 * @param key Animation set key
 * @param model GLTF Model
 * @param animation Animation key
 */
const pushAnimation = (track: string, key: string, model: string, animation: string) => {
    const k = `${key}_${model}`;
    if (!activeAnimations[track]) activeAnimations[track] = [];
    if (!activeAnimations[track][k]) activeAnimations[track][k] = [];
    if (getAnimationFromLast(track, k)?.key === animation) return;

    activeAnimations[track][k].push({
        key: animation,
        elapsed: 0,
    });

    activeAnimations[track][k].slice(activeAnimations[track][k].length - 2);
};

/**
 * Gets the current and previous animation
 * @param key Animation set key
 * @param model GLTF Model
 */
const getActiveAnimations = (key: string, model: string) => {
    const k = `${key}_${model}`;
    const aa = {};

    if (Object.keys(activeAnimations).length === 0) return null;

    Object.keys(activeAnimations).forEach(c => {
        if (!activeAnimations[c][k]) return;
        aa[c] = activeAnimations[c][k].slice(activeAnimations[c][k].length - 2);
    });

    return aa;
};

/**
 * Advances the animation
 * @param elapsed Time elasped since last update
 * @param key Animation set key
 */
const advanceAnimation = (elapsed: number, key?: string) => {
    Object.keys(activeAnimations).forEach(c => {
        Object.keys(activeAnimations[c]).forEach(m => {
            if (key && m.indexOf(key) !== 0) return;

            const current = getAnimationFromLast(c, m);
            const previous = getAnimationFromLast(c, m, 1);

            if (current) current.elapsed += elapsed;
            if (previous) previous.elapsed += elapsed;
        });
    });
};

export {
    pushAnimation,
    getActiveAnimations,
    advanceAnimation,
    ActiveAnimation,
}
