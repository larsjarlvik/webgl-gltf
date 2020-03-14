export interface DefaultShader {
    pMatrix: WebGLUniformLocation;
    vMatrix: WebGLUniformLocation;
    mMatrix: WebGLUniformLocation;
    cameraPosition: WebGLUniformLocation;
    hasBaseColorTexture: WebGLUniformLocation;
    baseColorTexture: WebGLUniformLocation;
    hasRoughnessTexture: WebGLUniformLocation;
    roughnessTexture: WebGLUniformLocation;
    baseColor: WebGLUniformLocation;
    roughnessMetallic: WebGLUniformLocation;
    isAnimated: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation[];
    brdfLut: WebGLUniformLocation;
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : DefaultShader => {
    const pMatrix = gl.getUniformLocation(program, 'uProjectionMatrix')!;
    const vMatrix = gl.getUniformLocation(program, 'uViewMatrix')!;
    const mMatrix = gl.getUniformLocation(program, 'uModelMatrix')!;
    const cameraPosition = gl.getUniformLocation(program, 'uCameraPosition')!;

    const isAnimated = gl.getUniformLocation(program, 'uIsAnimated')!;
    const hasBaseColorTexture = gl.getUniformLocation(program, 'uHasBaseColorTexture')!;
    const baseColorTexture = gl.getUniformLocation(program, 'uBaseColorTexture')!;
    const hasRoughnessTexture = gl.getUniformLocation(program, 'uHasRoughnessTexture')!;
    const roughnessTexture = gl.getUniformLocation(program, 'uRoughnessTexture')!;
    const baseColor = gl.getUniformLocation(program, 'uBaseColor')!;
    const roughnessMetallic = gl.getUniformLocation(program, 'uRoughnessMetallic')!;
    const brdfLut = gl.getUniformLocation(program, 'uBrdfLut')!;

    const jointTransform: WebGLUniformLocation[] = [];
    for (let i = 0; i < 50; i ++) {
        jointTransform[i] = gl.getUniformLocation(program, `uJointTransform[${i}]`)!
    }

    return {
        pMatrix,
        vMatrix,
        mMatrix,
        cameraPosition,
        hasBaseColorTexture,
        baseColorTexture,
        hasRoughnessTexture,
        roughnessTexture,
        baseColor,
        roughnessMetallic,
        isAnimated,
        jointTransform,
        brdfLut,
    };
};

export {
    getUniformLocations,
};
