import { mat4, vec3, quat, vec4, vec2 } from 'gl-matrix';

export interface Buffer {
    data: Float32Array | Int16Array;
    size: number;
    type: string;
    componentType: BufferType;
    glBuffer: WebGLBuffer;
}

export enum BufferType {
    Float = 5126,
    Short = 5123,
}

export interface Node {
    id: number;
    name: string;
    children: number[];
    localBindTransform: mat4;
    skin?: number;
    mesh?: number;
}

export interface Skin {
    joints: number[];
    inverseBindTransforms: mat4[];
    skeleton: number;
}

export interface Model {
    meshes: Mesh[];
    nodes: Node[];
    rootNode: number;
    channels: Channel;
    skins: Skin[];
    materials: Material[];
}

export interface Channel {
    [key: number]: Transform;
}

export interface Transform {
    translation: KeyFrame[];
    rotation: KeyFrame[];
    scale: KeyFrame[];
}

export interface KeyFrame {
    time: number;
    transform: vec3 | quat;
    type: string;
}

export interface GLBuffer {
    buffer: WebGLBuffer;
    type: number;
    size: number;
}

export interface Mesh {
    elements: number;
    indices: WebGLBuffer;
    positions: GLBuffer;
    normals: GLBuffer | null;
    tangents: GLBuffer | null;
    texCoord: GLBuffer | null;
    joints: GLBuffer | null;
    weights: GLBuffer | null;
    material: number;
}

export interface Material {
    baseColorTexture: WebGLTexture | null;
    roughnessTexture: WebGLTexture | null;
    emissiveTexture: WebGLTexture | null;
    baseColor: vec4;
    roughnessMetallic: vec2;
}