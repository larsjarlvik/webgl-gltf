export interface DefaultShader {
    pMatrix: WebGLUniformLocation;
    vMatrix: WebGLUniformLocation;
    mMatrix: WebGLUniformLocation;
    cameraPosition: WebGLUniformLocation;
    hasBaseColorTexture: WebGLUniformLocation;
    baseColorTexture: WebGLUniformLocation;
    hasMetallicRoughnessTexture: WebGLUniformLocation;
    metallicRoughnessTexture: WebGLUniformLocation;
    hasEmissiveTexture: WebGLUniformLocation;
    normalTexture: WebGLUniformLocation;
    hasNormalTexture: WebGLUniformLocation;
    emissiveTexture: WebGLUniformLocation;
    hasOcclusionTexture: WebGLUniformLocation;
    occlusionTexture: WebGLUniformLocation;
    baseColorFactor: WebGLUniformLocation;
    metallicFactor: WebGLUniformLocation;
    roughnessFactor: WebGLUniformLocation;
    emissiveFactor: WebGLUniformLocation;
    isAnimated: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation[];
    brdfLut: WebGLUniformLocation;
    environmentDiffuse: WebGLUniformLocation;
    environmentSpecular: WebGLUniformLocation;

    position: number;
    normal: number;
    tangent: number;
    texCoord: number;
    joints: number;
    weights: number;
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram): DefaultShader => {
    const pMatrix = gl.getUniformLocation(program, 'uProjectionMatrix')!;
    const vMatrix = gl.getUniformLocation(program, 'uViewMatrix')!;
    const mMatrix = gl.getUniformLocation(program, 'uModelMatrix')!;
    const cameraPosition = gl.getUniformLocation(program, 'uCameraPosition')!;

    const isAnimated = gl.getUniformLocation(program, 'uIsAnimated')!;
    const hasBaseColorTexture = gl.getUniformLocation(program, 'uHasBaseColorTexture')!;
    const baseColorTexture = gl.getUniformLocation(program, 'uBaseColorTexture')!;
    const hasMetallicRoughnessTexture = gl.getUniformLocation(program, 'uHasMetallicRoughnessTexture')!;
    const metallicRoughnessTexture = gl.getUniformLocation(program, 'uMetallicRoughnessTexture')!;

    const hasEmissiveTexture = gl.getUniformLocation(program, 'uHasEmissiveTexture')!;
    const emissiveTexture = gl.getUniformLocation(program, 'uEmissiveTexture')!;

    const baseColorFactor = gl.getUniformLocation(program, 'uBaseColorFactor')!;
    const metallicFactor = gl.getUniformLocation(program, 'uMetallicFactor')!;
    const roughnessFactor = gl.getUniformLocation(program, 'uRoughnessFactor')!;
    const emissiveFactor = gl.getUniformLocation(program, 'uEmissiveFactor')!;

    const normalTexture = gl.getUniformLocation(program, 'uNormalTexture')!;
    const hasNormalTexture = gl.getUniformLocation(program, 'uHasNormalTexture')!;

    const occlusionTexture = gl.getUniformLocation(program, 'uOcclusionTexture')!;
    const hasOcclusionTexture = gl.getUniformLocation(program, 'uHasOcclusionTexture')!;

    const brdfLut = gl.getUniformLocation(program, 'uBrdfLut')!;
    const environmentDiffuse = gl.getUniformLocation(program, 'uEnvironmentDiffuse')!;
    const environmentSpecular = gl.getUniformLocation(program, 'uEnvironmentSpecular')!;

    const jointTransform: WebGLUniformLocation[] = [];
    for (let i = 0; i < 25; i ++) {
        jointTransform[i] = gl.getUniformLocation(program, `uJointTransform[${i}]`)!
    }

    const position = gl.getAttribLocation(program, 'vPosition');
    const normal = gl.getAttribLocation(program, 'vNormal');
    const tangent = gl.getAttribLocation(program, 'vTangent');
    const texCoord = gl.getAttribLocation(program, 'vTexCoord');
    const joints = gl.getAttribLocation(program, 'vJoints');
    const weights = gl.getAttribLocation(program, 'vWeights');

    return {
        pMatrix,
        vMatrix,
        mMatrix,
        cameraPosition,
        hasBaseColorTexture,
        baseColorTexture,
        hasMetallicRoughnessTexture,
        metallicRoughnessTexture,
        hasEmissiveTexture,
        normalTexture,
        hasNormalTexture,
        occlusionTexture,
        hasOcclusionTexture,
        emissiveTexture,
        baseColorFactor,
        metallicFactor,
        roughnessFactor,
        emissiveFactor,
        isAnimated,
        jointTransform,
        brdfLut,
        environmentDiffuse,
        environmentSpecular,

        position,
        normal,
        tangent,
        texCoord,
        joints,
        weights,
    };
};

export {
    getUniformLocations,
};
