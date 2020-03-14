import { mat4, vec3, quat, vec4, vec2 } from 'gl-matrix';

export interface Buffer {
    data: Float32Array | Int16Array;
    size: number;
    type: string;
    componentType: BufferType;
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

export interface Mesh {
    elements: number;
    indices: Int16Array;
    positions: Buffer;
    normals: Buffer | null;
    tangents: Buffer | null;
    texCoord: Buffer | null;
    joints: Buffer | null;
    weights: Buffer | null;
    material: number;
}

export interface Material {
    baseColorTexture: WebGLTexture | null;
    roughnessTexture: WebGLTexture | null;
    baseColor: vec4;
    roughnessMetallic: vec2;
}