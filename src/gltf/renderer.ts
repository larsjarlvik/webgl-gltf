import { mat4 } from 'gl-matrix';
import { DefaultShader } from 'shaders/default-shader';
import { Model, GLBuffer } from './parsedMesh';

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
    Joints = 4,
    Weights = 5,
};

const bindBuffer = (gl: WebGLRenderingContext, position: VaryingPosition, buffer: GLBuffer | null) => {
    if (buffer === null) return;

    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    gl.vertexAttribPointer(position, buffer.size, buffer.type, false, 0, 0);

    return buffer;
};

const applyTexture = (gl: WebGL2RenderingContext, texture: WebGLTexture, textureTarget: number, textureUniform: WebGLUniformLocation, enabledUniform?: WebGLUniformLocation) => {
    if (texture) {
        gl.activeTexture(gl.TEXTURE0 + textureTarget);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniform, textureTarget);
    }

    if (enabledUniform !== undefined) gl.uniform1i(enabledUniform, texture ? 1 : 0);
}

const renderModel = (gl: WebGL2RenderingContext, model: Model, node: number, transform: mat4, uniforms: DefaultShader) => {
    const t = mat4.create();
    mat4.multiply(t, transform, model.nodes[node].localBindTransform);

    if (model.nodes[node].mesh !== undefined) {
        const mesh = model.meshes[model.nodes[node].mesh!];
        const material = model.materials[mesh.material];

        if (material) {
            if (material.baseColorTexture) applyTexture(gl, material.baseColorTexture, 1, uniforms.baseColorTexture, uniforms.hasBaseColorTexture);
            if (material.roughnessTexture) applyTexture(gl, material.roughnessTexture, 2, uniforms.roughnessTexture, uniforms.hasRoughnessTexture);
            if (material.emissiveTexture) applyTexture(gl, material.emissiveTexture, 3, uniforms.emissiveTexture, uniforms.hasEmissiveTexture);
            if (material.normalTexture) applyTexture(gl, material.normalTexture, 4, uniforms.normalTexture, uniforms.hasNormalTexture);
            if (material.occlusionTexture) applyTexture(gl, material.occlusionTexture, 5, uniforms.occlusionTexture, uniforms.hasOcclusionTexture);
            if (material.baseColor) gl.uniform4f(uniforms.baseColor, material.baseColor[0], material.baseColor[1], material.baseColor[2], material.baseColor[3]);
            if (material.roughnessMetallic) gl.uniform2f(uniforms.roughnessMetallic, material.roughnessMetallic[0], material.roughnessMetallic[1]);
        }

        bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
        bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
        bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
        bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);
        bindBuffer(gl, VaryingPosition.Joints, mesh.joints);
        bindBuffer(gl, VaryingPosition.Weights, mesh.weights);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
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
