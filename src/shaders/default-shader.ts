export interface Uniforms {
    pMatrixLoc: WebGLUniformLocation;
    mvMatrixLoc: WebGLUniformLocation;
    jointTransform: WebGLUniformLocation;
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : Uniforms => {
    const pMatrixLoc = gl.getUniformLocation(program, "pMatrix")!;
    const mvMatrixLoc = gl.getUniformLocation(program, "mvMatrix")!;
    const jointTransform = gl.getUniformLocation(program, `jointTransform`)!;

    return {
        pMatrixLoc,
        mvMatrixLoc,
        jointTransform,
    };
};

export {
    getUniformLocations,
};
