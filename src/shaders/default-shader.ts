export interface Uniforms {
    pMatrixLoc: WebGLUniformLocation;
    mvMatrixLoc: WebGLUniformLocation;
    mMatrix: WebGLUniformLocation;
    hasBaseColorTexture: WebGLUniformLocation;
    baseColorTexture: WebGLUniformLocation;
    isAnimated: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation[];
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : Uniforms => {
    const pMatrixLoc = gl.getUniformLocation(program, "pMatrix")!;
    const mvMatrixLoc = gl.getUniformLocation(program, "mvMatrix")!;
    const mMatrix = gl.getUniformLocation(program, "mMatrix")!;
    const hasBaseColorTexture = gl.getUniformLocation(program, "hasBaseColorTexture")!;
    const baseColorTexture = gl.getUniformLocation(program, "baseColorTexture")!;
    const isAnimated = gl.getUniformLocation(program, "isAnimated")!;
    const jointTransform: WebGLUniformLocation[] = [];
    for (let i = 0; i < 50; i ++) {
        jointTransform[i] = gl.getUniformLocation(program, `jointTransform[${i}]`)!
    }

    return {
        pMatrixLoc,
        mvMatrixLoc,
        mMatrix,
        hasBaseColorTexture,
        baseColorTexture,
        isAnimated,
        jointTransform,
    };
};

export {
    getUniformLocations,
};
