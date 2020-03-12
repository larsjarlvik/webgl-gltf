import { mat4 } from 'gl-matrix';
import { Uniforms } from 'shaders/default-shader';
import { Buffer, BufferType, Model } from './parsedMesh';

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
    Joints = 4,
    Weights = 5,
};

const bindBuffer = (gl: WebGLRenderingContext, position: VaryingPosition, gltfBuffer: Buffer | null) => {
    if (gltfBuffer === null) return;

    const type = gltfBuffer.componentType == BufferType.Float ? gl.FLOAT : gl.UNSIGNED_SHORT;

    const buffer = gl.createBuffer();
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gltfBuffer.data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, gltfBuffer.size, type, false, 0, 0);

    return buffer;
};

const applyTexture = (gl: WebGL2RenderingContext, texture: WebGLTexture, textureTarget: number, textureUniform: WebGLUniformLocation, enabledUniform: WebGLUniformLocation) => {
    if (texture) {
        gl.activeTexture(gl.TEXTURE0 + textureTarget);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniform, textureTarget);
        gl.uniform1i(enabledUniform, 1);
    } else {
        gl.uniform1i(enabledUniform, 0);
    }
}

const renderModel = (gl: WebGL2RenderingContext, model: Model, node: number, transform: mat4, uniforms: Uniforms) => {
    const t = mat4.create();
    mat4.multiply(t, transform, model.nodes[node].localBindTransform);

    if (model.nodes[node].mesh !== undefined) {
        const mesh = model.meshes[model.nodes[node].mesh!];
        const material = model.materials[mesh.material];

        if (material) {
            if (material.baseColorTexture) applyTexture(gl, material.baseColorTexture, 0, uniforms.baseColorTexture, uniforms.hasBaseColorTexture);
            if (material.roughnessTexture) applyTexture(gl, material.roughnessTexture, 1, uniforms.roughnessTexture, uniforms.hasRoughnessTexture);
            if (material.baseColor) gl.uniform4f(uniforms.baseColor, material.baseColor[0], material.baseColor[1], material.baseColor[2], material.baseColor[3]);
            if (material.roughness) gl.uniform1f(uniforms.roughness, material.roughness);
        }

        bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
        bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
        bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
        bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);
        bindBuffer(gl, VaryingPosition.Joints, mesh.joints);
        bindBuffer(gl, VaryingPosition.Weights, mesh.weights);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
        gl.uniformMatrix4fv(uniforms.mMatrix, false, transform);

        gl.drawElements(gl.TRIANGLES, model.meshes[0].elements, gl.UNSIGNED_SHORT, 0);
    }

    model.nodes[node].children.forEach(c => {
        renderModel(gl, model, c, transform, uniforms);
    });
};

export {
    renderModel,
};
