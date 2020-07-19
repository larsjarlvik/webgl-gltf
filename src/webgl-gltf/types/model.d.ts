import { mat4, vec3, quat, vec4 } from 'gl-matrix';

/**
 * Model root
 */
export interface Model {
    name: string;
    meshes: Mesh[];
    nodes: Node[];
    rootNode: number;
    animations: Animation;
    skins: Skin[];
    materials: Material[];
}

/**
 * Model node hiearchy with animation transforms and reference to mesh + skin
 */
export interface Node {
    id: number;
    name: string;
    children: number[];
    localBindTransform: mat4;
    skin?: number;
    mesh?: number;
}

/**
 * Skinning information with the inversed bind transform and affected joints
 */
export interface Skin {
    joints: number[];
    inverseBindTransforms: mat4[];
}

/**
 * Root for each animation
 */
export interface Animation {
    [name: string]: Channel;
}

/**
 * List of keyframes for each animation
 */
export interface Channel {
    [key: number]: Transform;
}

/**
 * Animation keyFrames
 */
export interface Transform {
    translation: KeyFrame[];
    rotation: KeyFrame[];
    scale: KeyFrame[];
}

/**
 * Transform executed at specific time.
 */
export interface KeyFrame {
    time: number;
    transform: vec3 | quat;
    type: 'translation' | 'rotation' | 'scale';
}

/**
 * WebGL buffer information
 */
export interface GLBuffer {
    buffer: WebGLBuffer;
    type: number;
    size: number;
}

/**
 * Mesh buffers and associated material
 */
export interface Mesh {
    elementCount: number;
    indices: WebGLBuffer | null;
    positions: GLBuffer;
    normals: GLBuffer | null;
    tangents: GLBuffer | null;
    texCoord: GLBuffer | null;
    joints: GLBuffer | null;
    weights: GLBuffer | null;
    material: number;
}

/**
 * Textures and material info for PBR.
 */
export interface Material {
    baseColorTexture: WebGLTexture | null;
    baseColorFactor: vec4;
    metallicRoughnessTexture: WebGLTexture | null;
    metallicFactor: number;
    roughnessFactor: number;
    emissiveTexture: WebGLTexture | null;
    emissiveFactor: vec3;
    normalTexture: WebGLTexture | null;
    occlusionTexture: WebGLTexture | null;
}
