import * as gltf from './types/gltf';
import { mat4, quat, vec3, vec4, vec2 } from 'gl-matrix';
import { createMat4FromArray, applyRotationFromQuat } from './mat';
import { Channel, Node, Mesh, Model, KeyFrame, Skin, Material, GLBuffer, Animation } from './types/model';

const accessorSizes = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

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

const getBuffer = async (path: string, buffer: string) => {
    const dir = path.split('/').slice(0,-1).join('/');
    const response = await fetch(`${dir}/${buffer}`);
    const blob = await response.blob();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (blob as any).arrayBuffer();
};

const getTexture = async (gl: WebGL2RenderingContext, uri: string) => {
    return new Promise<WebGLTexture>(resolve => {
        const img = new Image();
        img.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            const ext = gl.getExtension('EXT_texture_filter_anisotropic');
            if (ext) {
                const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
            }

            gl.generateMipmap(gl.TEXTURE_2D);
            resolve(texture!);
        }
        img.src = uri;
    });
};

const readBufferFromFile = (gltf: gltf.GlTf, buffers: ArrayBuffer[], accessor: gltf.Accessor) => {
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

const getBufferFromName = (gl: WebGL2RenderingContext, gltf: gltf.GlTf, buffers: ArrayBuffer[], mesh: gltf.Mesh, name: string) => {
    if (mesh.primitives[0].attributes[name] === undefined) {
        return null;
    }

    const attribute = mesh.primitives[0].attributes[name];
    const accessor = gltf.accessors![attribute];
    const bufferData = readBufferFromFile(gltf, buffers, accessor);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.data, gl.STATIC_DRAW);

    return {
        buffer,
        size: bufferData.size,
        type: bufferData.componentType == BufferType.Float ? gl.FLOAT : gl.UNSIGNED_SHORT,
    } as GLBuffer;
};

const loadNodes = (index: number, node: gltf.Node): Node => {
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

const loadAnimation = (gltf: gltf.GlTf, animation: gltf.Animation, buffers: ArrayBuffer[]) => {
    const channels = animation.channels.map(c => {
        const sampler = animation.samplers[c.sampler];
        const time = readBufferFromFile(gltf, buffers, gltf.accessors![sampler.input]);
        const buffer = readBufferFromFile(gltf, buffers, gltf.accessors![sampler.output]);

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

const loadMesh = (gl: WebGL2RenderingContext, gltf: gltf.GlTf, mesh: gltf.Mesh, buffers: ArrayBuffer[]) => {
    const indexBuffer = gltf.bufferViews![gltf.accessors![mesh.primitives[0].indices!].bufferView!];
    const indexArray = new Int16Array(buffers[indexBuffer.buffer], indexBuffer.byteOffset || 0, indexBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT);

    const indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

    return {
        indices,
        elements: indexArray.length,
        positions: getBufferFromName(gl, gltf, buffers, mesh, 'POSITION'),
        normals: getBufferFromName(gl, gltf, buffers, mesh, 'NORMAL'),
        tangents: getBufferFromName(gl, gltf, buffers, mesh, 'TANGENT'),
        texCoord: getBufferFromName(gl, gltf, buffers, mesh, 'TEXCOORD_0'),
        joints: getBufferFromName(gl, gltf, buffers, mesh, 'JOINTS_0'),
        weights: getBufferFromName(gl, gltf, buffers, mesh, 'WEIGHTS_0'),
        material: mesh.primitives[0].material,
    } as Mesh;
};

const loadMaterial = async (gl: WebGL2RenderingContext, material: gltf.Material, path: string, images?: gltf.Image[]): Promise<Material> => {
    const dir = path.split('/').slice(0,-1).join('/');
    let baseColorTexture: WebGLTexture | null = null;
    let roughnessTexture: WebGLTexture | null = null;
    let emissiveTexture: WebGLTexture | null = null;
    let normalTexture: WebGLTexture | null = null;
    let occlusionTexture: WebGLTexture | null = null;
    let baseColor = vec4.create();
    let roughnessMetallic = vec2.create();

    const pbr = material.pbrMetallicRoughness;
    if (pbr) {
        if (pbr.baseColorTexture) {
            const uri = images![pbr.baseColorTexture.index].uri!;
            baseColorTexture = await getTexture(gl, `${dir}/${uri}`);
        }
        if (pbr.metallicRoughnessTexture) {
            const uri = images![pbr.metallicRoughnessTexture.index].uri!;
            roughnessTexture = await getTexture(gl, `${dir}/${uri}`);
        }
        baseColor = pbr.baseColorFactor
            ? vec4.fromValues(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2], pbr.baseColorFactor[3])
            : vec4.create();

        roughnessMetallic = vec2.fromValues(
            pbr.roughnessFactor ? pbr.roughnessFactor[0] : 0.0,
            pbr.metallicFactor ? pbr.metallicFactor[0] : 0.0
        );
    }

    if (material.emissiveTexture) {
        const uri = images![material.emissiveTexture.index].uri!;
        emissiveTexture = await getTexture(gl, `${dir}/${uri}`);
    }

    if (material.normalTexture) {
        const uri = images![material.normalTexture.index].uri!;
        normalTexture = await getTexture(gl, `${dir}/${uri}`);
    }

    if (material.occlusionTexture) {
        const uri = images![material.occlusionTexture.index].uri!;
        occlusionTexture = await getTexture(gl, `${dir}/${uri}`);
    }

    return {
        baseColorTexture,
        roughnessTexture,
        emissiveTexture,
        normalTexture,
        occlusionTexture,
        baseColor,
        roughnessMetallic,
    } as Material;
};

/**
 * Loads a GLTF model and its assets
 * @param gl Web GL context
 * @param uri URI to model
 */
const loadModel = async (gl: WebGL2RenderingContext, uri: string) => {
    const response = await fetch(uri);
    const gltf = await response.json() as gltf.GlTf;

    if (gltf.accessors === undefined || gltf.accessors.length === 0) {
        throw new Error('GLTF File is missing accessors')
    }

    const buffers = await Promise.all(
        gltf.buffers!.map(async (b) => await getBuffer(uri, b.uri!)
    ));

    const scene = gltf.scenes![gltf.scene || 0];
    const meshes = gltf.meshes!.map(m => loadMesh(gl, gltf, m, buffers));
    const materials = gltf.materials ? await Promise.all(gltf.materials.map(async (m) => await loadMaterial(gl, m, uri, gltf.images))) : [];

    const rootNode = scene.nodes![0];
    const nodes = gltf.nodes!.map((n, i) => loadNodes(i, n));

    const animations = {} as Animation;
    gltf.animations?.forEach(anim => animations[anim.name as string] = loadAnimation(gltf, anim, buffers));

    const skins = gltf.skins ? gltf.skins.map(x => {
        const bindTransforms = readBufferFromFile(gltf, buffers, gltf.accessors![x.inverseBindMatrices!]);
        const inverseBindTransforms = x.joints.map((_, i) => createMat4FromArray(bindTransforms.data.slice(i * 16, i * 16 + 16)));

        return {
            joints: x.joints,
            inverseBindTransforms,
            skeleton: x.skeleton,
        };
    }) : [] as Skin[];

    const name = uri.split('/').slice(-1)[0];
    return {
        name,
        meshes,
        nodes,
        rootNode,
        animations,
        skins,
        materials,
    } as Model;
};

export {
    loadModel,
};
