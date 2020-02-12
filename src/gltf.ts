import { GlTf, Mesh as GlTfMesh } from 'types/gltf';

interface Buffer {
    data: Float32Array;
    size: number;
}

interface Mesh {
    elements: number;
    indices: Int16Array;
    positions: Buffer;
    normals: Buffer | null;
    tangents: Buffer | null;
    texCoord: Buffer | null;
}

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
};

const getBuffer = async (model: string, buffer: string) => {
    const response = await fetch(`/models/${model}/${buffer}`);
    const blob = await response.blob();
    return await (<any>blob).arrayBuffer();
};

const getSize = (type: string) => {
    switch(type) {
        case 'VEC2': return 2;
        case 'VEC3': return 3;
        case 'VEC4': return 4;
    }

    return 0;
}

const readFloat32ArrayFromBuffer = (gltf: GlTf, buffers: any, mesh: GlTfMesh, name: string) => {
    if (!mesh.primitives[0].attributes[name]) {
        return null;
    }

    const positionBuffer = gltf.bufferViews![mesh.primitives[0].attributes[name]];
    const type = gltf.accessors?.filter(a => a.bufferView === mesh.primitives[0].attributes[name])[0].type;
    const data = new Float32Array(buffers[positionBuffer.buffer], positionBuffer.byteOffset || 0, positionBuffer.byteLength / 4);
    return {
        data,
        size: getSize(type!),
    };
};

const loadModel = async (model: string) => {
    const response = await fetch(`/models/${model}/${model}.gltf`);
    const gltf = await response.json() as GlTf;

    const buffers = await Promise.all(
        gltf.buffers!.map(async (b) => await getBuffer(model, b.uri!)
    ));

    const meshes = gltf.meshes!.map(m => {
        const indexBuffer = gltf.bufferViews![m.primitives[0].indices!];
        const indices = new Int16Array(buffers[indexBuffer.buffer], indexBuffer.byteOffset || 0, indexBuffer.byteLength / 2);

        return {
            indices,
            elements: indices.length,
            positions: readFloat32ArrayFromBuffer(gltf, buffers, m, 'POSITION'),
            normals: readFloat32ArrayFromBuffer(gltf, buffers, m, 'NORMAL'),
            tangents: readFloat32ArrayFromBuffer(gltf, buffers, m, 'TANGENT'),
            texCoord: readFloat32ArrayFromBuffer(gltf, buffers, m, 'TEXCOORD_0'),
        } as Mesh;
    });

    return meshes;
};

const bindBuffer = (gl: WebGLRenderingContext, position: VaryingPosition, gltfBuffer: Buffer | null) => {
    if (gltfBuffer === null) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gltfBuffer.data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, gltfBuffer.size, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(position);
    return buffer;
}

const bindBuffers = async(gl: WebGLRenderingContext, mesh: Mesh) => {
    bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
    bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
    bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
    bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
}

export {
    loadModel,
    bindBuffers,
    Mesh,
};
