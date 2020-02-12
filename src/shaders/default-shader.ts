interface Uniforms {
    pMatrixLoc;
    mvMatrixLoc;
}

const getUniformLocations = (gl: WebGLRenderingContext, program: WebGLProgram) : Uniforms => {
    const pMatrixLoc = gl.getUniformLocation(program, "pMatrix");
    const mvMatrixLoc = gl.getUniformLocation(program, "mvMatrix");

    return {
        pMatrixLoc,
        mvMatrixLoc,
    };
};

export {
    getUniformLocations,
};
