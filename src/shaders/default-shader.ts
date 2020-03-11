export interface Uniforms {
    pMatrixLoc: WebGLUniformLocation;
    mvMatrixLoc: WebGLUniformLocation;
    mMatrix: WebGLUniformLocation;
    isAnimated: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation[];
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : Uniforms => {
    const pMatrixLoc = gl.getUniformLocation(program, "pMatrix")!;
    const mvMatrixLoc = gl.getUniformLocation(program, "mvMatrix")!;
    const mMatrix = gl.getUniformLocation(program, "mMatrix")!;
    const isAnimated = gl.getUniformLocation(program, "isAnimated")!;
    const jointTransform: WebGLUniformLocation[] = [];
    for (let i = 0; i < 50; i ++) {
        jointTransform[i] = gl.getUniformLocation(program, `jointTransform[${i}]`)!
    }

    return {
        pMatrixLoc,
        mvMatrixLoc,
        mMatrix,
        isAnimated,
        jointTransform,
    };
};

export {
    getUniformLocations,
};
