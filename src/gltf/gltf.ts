import { GlTf, Mesh as GlTfMesh, Node as GlTfNode, Accessor, Animation, Skin } from 'types/gltf';
import { mat4, quat, vec3 } from 'gl-matrix';

interface Buffer {
    data: Float32Array | Int16Array;
    size: number;
    type: string;
    componentType: BufferType;
}

interface Joint {
    id: number;
    name: string;
    children: Joint[];
    localBindTransform: mat4;
    animatedTransform: mat4;
    inverseBindTransform: mat4;
    isJoint: boolean
}

interface Model {
    meshes: Mesh[];
    rootJoint: Joint;
    jointCount: number;
    channels: Node;
}

interface Node {
    [key: string]: Channels;
}

interface Channels {
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

const loadJointHierarchy = (index: number, node: GlTfNode, nodes: GlTfNode[], skins: Skin[]): Joint => {
    const transform = mat4.create();

    if (node.translation !== undefined) mat4.translate(transform, transform, node.translation);
    if (node.rotation !== undefined) {
        const rotation = mat4.create();
        mat4.fromQuat(rotation, quat.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]));
        mat4.multiply(transform, rotation, transform);
    }
    if (node.scale !== undefined) mat4.scale(transform, transform, node.scale);


    const isJoint = skins.filter(s => s.joints.indexOf(index) !== -1).length > 0;

    return {
        id: index,
        name: node.name,
        children: node.children?.map(n => loadJointHierarchy(n, nodes[n], nodes, skins)) || [],
        localBindTransform: transform,
        animatedTransform: mat4.create(),
        inverseBindTransform: mat4.create(),
        isJoint: isJoint,
    } as Joint;
};

const countJoints = (index: number, nodes: GlTfNode[]) => {
    const count = nodes[index].children?.reduce((n, c) => n + countJoints(c, nodes), 0) || 0;
    return count + 1;
}

const calculateInverseBindTransform = (current: Joint, parentBindTransform: mat4) => {
    const bindTransform = mat4.create();
    mat4.multiply(bindTransform, parentBindTransform, current.localBindTransform);
    mat4.invert(bindTransform, bindTransform);
    current.inverseBindTransform = bindTransform;

    current.children.forEach(c => calculateInverseBindTransform(c, bindTransform));
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

    const c: Node = {};

    channels.forEach((channel) => {
        if (!c[channel.node!]) {
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

    const rootJoint = gltf.nodes ? loadJointHierarchy(0, gltf.nodes[0], gltf.nodes, gltf.skins!) : null;
    const channels = gltf.animations && gltf.animations.length > 0 ? loadAnimation(gltf.animations![0], gltf, buffers) : null;
    let jointCount = 0;



    if (rootJoint != null) {
        calculateInverseBindTransform(rootJoint, mat4.create());
        jointCount = countJoints(0, gltf.nodes!);
    }

    return {
        meshes,
        rootJoint,
        jointCount,
        channels,
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

const bindBuffers = (gl: WebGLRenderingContext, mesh: Mesh) => {
    bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
    bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
    bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
    bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);
    bindBuffer(gl, VaryingPosition.Joints, mesh.joints);
    bindBuffer(gl, VaryingPosition.Weights, mesh.weights);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
};

export {
    loadModel,
    bindBuffers,
    Mesh,
    Model,
    KeyFrame,
    Joint,
    Channels,
};
