import { GlTf, Mesh as GlTfMesh, Node as GlTfNode, Accessor, Animation } from 'types/gltf';
import { mat4, quat, vec3 } from 'gl-matrix';
import { createMat4FromArray, applyRotationFromQuat } from 'utils/mat';
import { Uniforms } from 'shaders/default-shader';

interface Buffer {
    data: Float32Array | Int16Array;
    size: number;
    type: string;
    componentType: BufferType;
}

interface Node {
    id: number;
    name: string;
    children: number[];
    localBindTransform: mat4;
    skin?: number;
    mesh?: number;
}

interface Skin {
    joints: number[];
    inverseBindTransforms: mat4[];
    skeleton: number;
}

interface Model {
    meshes: Mesh[];
    nodes: Node[];
    rootNode: number;
    channels: Channel;
    skins: Skin[]
}

interface Channel {
    [key: number]: Transform;
}

interface Transform {
    translation: KeyFrame[];
    rotation: KeyFrame[];
    scale: KeyFrame[];
}

interface KeyFrame {
    time: number;
    transform: vec3 | quat;
    type: string;
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

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
    Joints = 4,
    Weights = 5,
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

const getBuffer = async (model: string, buffer: string) => {
    const response = await fetch(`/models/${model}/${buffer}`);
    const blob = await response.blob();
    return await (<any>blob).arrayBuffer() as ArrayBuffer;
};

const getArrayFromName = (gltf: GlTf, buffers: ArrayBuffer[], mesh: GlTfMesh, name: string) => {
    if (mesh.primitives[0].attributes[name] === undefined) {
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

const loadNodes = (index: number, node: GlTfNode): Node => {
    const transform = mat4.create();

    if (node.translation !== undefined) mat4.translate(transform, transform, node.translation);
    if (node.rotation !== undefined) applyRotationFromQuat(transform, node.rotation);
    if (node.scale !== undefined) mat4.scale(transform, transform, node.scale);
    if (node.matrix !== undefined) mat4.copy(transform, createMat4FromArray(node.matrix));

    return {
        id: index,
        name: node.name,
        children: node.children || [],
        localBindTransform: transform,
        animatedTransform: mat4.create(),
        skin: node.skin,
        mesh: node.mesh
    } as Node;
};

const loadAnimation = (animation: Animation, gltf: GlTf, buffers: ArrayBuffer[]) => {
    const channels = animation.channels.map(c => {
        const sampler = animation.samplers[c.sampler];

        const time = readArrayFromBuffer(gltf, buffers, gltf.accessors![sampler.input]);
        const buffer = readArrayFromBuffer(gltf, buffers, gltf.accessors![sampler.output]);

        return {
            node: c.target.node,
            type: c.target.path,
            time,
            buffer,
        };
    });

    const c: Channel = {};
    channels.forEach((channel) => {
        if (c[channel.node!] === undefined) {
            c[channel.node!] = {
                translation: [],
                rotation: [],
                scale: [],
            };
        }

        for (let i = 0; i < channel.time.data.length; i ++) {
            const transform = channel.type === 'rotation'
                ? quat.fromValues(
                    channel.buffer.data[i * channel.buffer.size],
                    channel.buffer.data[i * channel.buffer.size + 1],
                    channel.buffer.data[i * channel.buffer.size + 2],
                    channel.buffer.data[i * channel.buffer.size + 3]
                )
                : vec3.fromValues(
                    channel.buffer.data[i * channel.buffer.size],
                    channel.buffer.data[i * channel.buffer.size + 1],
                    channel.buffer.data[i * channel.buffer.size + 2]
                );

            c[channel.node!][channel.type].push({
                time: channel.time.data[i],
                transform: transform,
                jointId: channel.node,
                type: channel.type,
            } as KeyFrame)
        }
    });

    return c;
};

const loadModel = async (model: string) => {
    const response = await fetch(`/models/${model}/${model}.gltf`);
    const gltf = await response.json() as GlTf;

    if (gltf.accessors === undefined || gltf.accessors.length === 0) {
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


    const scene = gltf.scenes![gltf.scene || 0];
    const rootNode = scene.nodes![0];
    const nodes = gltf.nodes!.map((n, i) => loadNodes(i, n));
    const channels = gltf.animations && gltf.animations.length > 0 ? loadAnimation(gltf.animations![0], gltf, buffers) : null;

    const skins = gltf.skins ? gltf.skins.map(x => {
        const bindTransforms = readArrayFromBuffer(gltf, buffers, gltf.accessors![x.inverseBindMatrices!]);
        const inverseBindTransforms = x.joints.map((_, i) => createMat4FromArray(bindTransforms.data.slice(i * 16, i * 16 + 16)));

        return {
            joints: x.joints,
            inverseBindTransforms,
            skeleton: x.skeleton,
        };
    }) : [] as Skin[];

    return {
        meshes,
        nodes,
        rootNode,
        channels,
        skins,
    } as Model;
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

const bind = (gl: WebGLRenderingContext, model: Model, node: number, transform: mat4, uniforms: Uniforms) => {
    const t = mat4.create();
    mat4.multiply(t, transform, model.nodes[node].localBindTransform);

    if (model.nodes[node].mesh !== undefined) {
        const mesh = model.meshes[model.nodes[node].mesh!];

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
    }

    model.nodes[node].children.forEach(c => {
        bind(gl, model, c, transform, uniforms);
    });
};

export {
    loadModel,
    bind,
    Model,
    KeyFrame,
    Skin,
};
