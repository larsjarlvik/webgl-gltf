export interface Uniforms {
    pMatrixLoc: WebGLUniformLocation;
    mvMatrixLoc: WebGLUniformLocation;
    mMatrix: WebGLUniformLocation;
    hasBaseColorTexture: WebGLUniformLocation;
    baseColorTexture: WebGLUniformLocation;
    hasRoughnessTexture: WebGLUniformLocation;
    roughnessTexture: WebGLUniformLocation;
    baseColor: WebGLUniformLocation;
    roughness: WebGLUniformLocation;
    isAnimated: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation[];
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : Uniforms => {
    const pMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix')!;
    const mvMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix')!;
    const mMatrix = gl.getUniformLocation(program, 'uMeshMatrix')!;
    const isAnimated = gl.getUniformLocation(program, 'uIsAnimated')!;

    const hasBaseColorTexture = gl.getUniformLocation(program, 'uHasBaseColorTexture')!;
    const baseColorTexture = gl.getUniformLocation(program, 'uBaseColorTexture')!;
    const hasRoughnessTexture = gl.getUniformLocation(program, 'uHasRoughnessTexture')!;
    const roughnessTexture = gl.getUniformLocation(program, 'uRoughnessTexture')!;
    const baseColor = gl.getUniformLocation(program, 'uBaseColor')!;
    const roughness = gl.getUniformLocation(program, 'uRoughness')!;

    const jointTransform: WebGLUniformLocation[] = [];
    for (let i = 0; i < 50; i ++) {
        jointTransform[i] = gl.getUniformLocation(program, `uJointTransform[${i}]`)!
    }

    return {
        pMatrixLoc,
        mvMatrixLoc,
        mMatrix,
        hasBaseColorTexture,
        baseColorTexture,
        hasRoughnessTexture,
        roughnessTexture,
        baseColor,
        roughness,
        isAnimated,
        jointTransform,
    };
};

export {
    getUniformLocations,
};
