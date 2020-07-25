import { mat4 } from 'gl-matrix';
import { Model, GLBuffer } from 'webgl-gltf';
import { DefaultShader } from './shaders/default-shader';

const bindBuffer = (gl: WebGLRenderingContext, position: number, buffer: GLBuffer | null) => {
    if (buffer === null) return;

    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    gl.vertexAttribPointer(position, buffer.size, buffer.type, false, 0, 0);

    return buffer;
};

const applyTexture = (gl: WebGLRenderingContext, texture: WebGLTexture | null, textureTarget: number, textureUniform: WebGLUniformLocation, enabledUniform?: WebGLUniformLocation) => {
    if (texture) {
        gl.activeTexture(gl.TEXTURE0 + textureTarget);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniform, textureTarget);
    }

    if (enabledUniform !== undefined) gl.uniform1i(enabledUniform, texture ? 1 : 0);
}

const renderModel = (gl: WebGLRenderingContext, model: Model, node: number, transform: mat4, uniforms: DefaultShader) => {
    if (model.nodes[node].mesh !== undefined) {
        const mesh = model.meshes[model.nodes[node].mesh!];
        const material = model.materials[mesh.material];

        if (material) {
            applyTexture(gl, material.baseColorTexture, 0, uniforms.baseColorTexture, uniforms.hasBaseColorTexture);
            applyTexture(gl, material.metallicRoughnessTexture, 1, uniforms.metallicRoughnessTexture, uniforms.hasMetallicRoughnessTexture);
            applyTexture(gl, material.emissiveTexture, 2, uniforms.emissiveTexture, uniforms.hasEmissiveTexture);
            applyTexture(gl, material.normalTexture, 3, uniforms.normalTexture, uniforms.hasNormalTexture);
            applyTexture(gl, material.occlusionTexture, 4, uniforms.occlusionTexture, uniforms.hasOcclusionTexture);

            gl.uniform4f(uniforms.baseColorFactor, material.baseColorFactor[0], material.baseColorFactor[1], material.baseColorFactor[2], material.baseColorFactor[3]);
            gl.uniform1f(uniforms.metallicFactor, material.metallicFactor);
            gl.uniform1f(uniforms.roughnessFactor, material.roughnessFactor);
            gl.uniform3f(uniforms.emissiveFactor, material.emissiveFactor[0], material.emissiveFactor[1], material.emissiveFactor[2]);
        }

        bindBuffer(gl, uniforms.position, mesh.positions);
        bindBuffer(gl, uniforms.normal, mesh.normals);
        bindBuffer(gl, uniforms.tangent, mesh.tangents);
        bindBuffer(gl, uniforms.texCoord, mesh.texCoord);
        bindBuffer(gl, uniforms.joints, mesh.joints);
        bindBuffer(gl, uniforms.weights, mesh.weights);

        gl.uniformMatrix4fv(uniforms.mMatrix, false, transform);

        if (mesh.indices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
            gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, mesh.elementCount);
        }
    }

    model.nodes[node].children.forEach(c => {
        renderModel(gl, model, c, transform, uniforms);
    });
};

export {
    renderModel,
};
