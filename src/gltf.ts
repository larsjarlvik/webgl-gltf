import { GlTf, Mesh as GlTfMesh, Node as GlTfNode, Accessor, Animation as GlTfAnimation } from 'types/gltf';
import { mat4, vec4, vec3, quat } from 'gl-matrix';
import { Uniforms } from 'shaders/default-shader';

interface Buffer {
    data: Float32Array | Int16Array;
    size: number;
    type: string;
    componentType: BufferType;
}

interface Node {
    name: string;
    children: number[];
    matrix: mat4 | null;
    translation: vec3 | null;
    rotation: vec4 | null;
}

interface Model {
    nodes: Node[];
    meshes: Mesh[];
    animation: KeyFrame[];
}

interface Mesh {
    elements: number;
    indices: Int16Array;
    positions: Buffer;
    normals: Buffer | null;
    tangents: Buffer | null;
    texCoord: Buffer | null;
    joints: Buffer | null;
    weights: Buffer | null;
}

interface KeyFrame {
    type: string;
    time: Buffer;
    buffer: Buffer;
    node: number;
}

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
    Joints = 4,
    Weights = 5,
};

const getBuffer = async (model: string, buffer: string) => {
    const response = await fetch(`/models/${model}/${buffer}`);
    const blob = await response.blob();
    return await (<any>blob).arrayBuffer() as ArrayBuffer;
};

enum BufferType {
    Float = 5126,
    Short = 5123,
};

const accessorSizes = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

const getArrayFromName = (gltf: GlTf, buffers: ArrayBuffer[], mesh: GlTfMesh, name: string) => {
    if (!mesh.primitives[0].attributes[name]) {
        return null;
    }

    const attribute = mesh.primitives[0].attributes[name];
    const accessor = gltf.accessors![attribute];
    return readArrayFromBuffer(gltf, buffers, accessor);
};

const readArrayFromBuffer = (gltf: GlTf, buffers: ArrayBuffer[], accessor: Accessor) => {
    const bufferView = gltf.bufferViews![accessor.bufferView as number];
    const size = accessorSizes[accessor.type];
    const componentType = accessor.componentType as BufferType;
    const type = accessor.type;

    const data = componentType == BufferType.Float
        ? new Float32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size)
        : new Int16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size);

    return {
        size,
        data,
        type,
        componentType,
    } as Buffer;
};

const loadNodes = (nodes: GlTfNode[]) => {
    return nodes.map(n => ({
        name: n.name,
        matrix: n.matrix ? mat4.fromValues.apply(null, n.matrix) : null,
        children: n.children,
        translation: n.translation ?? null,
        rotation: n.rotation ?? null,
    } as Node));
};

const loadAnimation = (animation: GlTfAnimation, gltf: GlTf, buffers: ArrayBuffer[]) => {
    return animation.channels.map(c => {
        const sampler = animation.samplers[c.sampler];

        const time = readArrayFromBuffer(gltf, buffers, gltf.accessors![sampler.input]);
        const buffer = readArrayFromBuffer(gltf, buffers, gltf.accessors![sampler.output]);

        return {
            node: c.target.node,
            type: c.target.path,
            time,
            buffer,
        } as KeyFrame;
    });
};

const loadModel = async (model: string) => {
    const response = await fetch(`/models/${model}/${model}.gltf`);
    const gltf = await response.json() as GlTf;

    if (!gltf.accessors || gltf.accessors.length === 0) {
        throw new Error('GLTF File is missing accessors')
    }

    const buffers = await Promise.all(
        gltf.buffers!.map(async (b) => await getBuffer(model, b.uri!)
    ));

    const meshes = gltf.meshes!.map(m => {
        const indexBuffer = gltf.bufferViews![m.primitives[0].indices!];
        const indices = new Int16Array(buffers[indexBuffer.buffer], indexBuffer.byteOffset || 0, indexBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT);

        return {
            indices,
            elements: indices.length,
            positions: getArrayFromName(gltf, buffers, m, 'POSITION'),
            normals: getArrayFromName(gltf, buffers, m, 'NORMAL'),
            tangents: getArrayFromName(gltf, buffers, m, 'TANGENT'),
            texCoord: getArrayFromName(gltf, buffers, m, 'TEXCOORD_0'),
            joints: getArrayFromName(gltf, buffers, m, 'JOINTS_0'),
            weights: getArrayFromName(gltf, buffers, m, 'WEIGHTS_0'),
        } as Mesh;
    });

    const nodes = gltf.scene !== undefined ? loadNodes(gltf.nodes!) : [];
    const animation = gltf.animations && gltf.animations.length > 0 ? loadAnimation(gltf.animations![0], gltf, buffers) : null;

    return {
        meshes,
        nodes,
        animation,
    } as Model;
};

const bindBuffer = (gl: WebGLRenderingContext, position: VaryingPosition, gltfBuffer: Buffer | null) => {
    if (gltfBuffer === null) return;

    const buffer = gl.createBuffer();
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gltfBuffer.data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, gltfBuffer.size, gl.FLOAT, false, 0, 0);

    return buffer;
}

const bindBuffers = (gl: WebGLRenderingContext, mesh: Mesh) => {
    bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
    bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
    bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
    bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);
    bindBuffer(gl, VaryingPosition.Joints, mesh.joints,);
    bindBuffer(gl, VaryingPosition.Weights, mesh.weights);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
}

const bindAnimation = (gl: WebGLRenderingContext, model: Model, uniforms: Uniforms) => {
    const ms = model.animation[1].time.data[model.animation[1].time.data.length - 1] * 1000;
    const i = Math.floor((performance.now() % ms) / ms * model.animation[1].time.data.length);


    const t = mat4.create();
    const rot = quat.fromValues(
        model.animation[1].buffer.data[i * model.animation[1].buffer.size],
        model.animation[1].buffer.data[i * model.animation[1].buffer.size + 1],
        model.animation[1].buffer.data[i * model.animation[1].buffer.size + 2],
        model.animation[1].buffer.data[i * model.animation[1].buffer.size + 3]);

    const trans = vec3.fromValues(
        model.animation[0].buffer.data[i * model.animation[0].buffer.size],
        model.animation[0].buffer.data[i * model.animation[0].buffer.size + 1],
        model.animation[0].buffer.data[i * model.animation[0].buffer.size + 2],
    );

    mat4.fromQuat(t, rot);
    mat4.translate(t, t, trans);
    gl.uniformMatrix4fv(uniforms.jointTransform, false, t);
};

export {
    loadModel,
    bindBuffers,
    bindAnimation,
    Mesh,
    Model,
};
