import { GlTf, Mesh as GlTfMesh, Node as GlTfNode, Accessor, Animation, Material as GlTfMaterial, Image } from 'types/gltf';
import { mat4, quat, vec3, vec4, vec2 } from 'gl-matrix';
import { createMat4FromArray, applyRotationFromQuat } from 'utils/mat';
import { Channel, Buffer, BufferType, Node, Mesh, Model, KeyFrame, Skin, Material } from './parsedMesh';


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

const getTexture = async (gl: WebGL2RenderingContext, uri: string) => {
    return new Promise<WebGLTexture>(resolve => {
        const img = new Image();
        img.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            resolve(texture!);
        }
        img.src = uri;
    });
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

const loadMesh = (gltf: GlTf, buffers: ArrayBuffer[], mesh: GlTfMesh) => {
    const indexBuffer = gltf.bufferViews![gltf.accessors![mesh.primitives[0].indices!].bufferView!];
    const indices = new Int16Array(buffers[indexBuffer.buffer], indexBuffer.byteOffset || 0, indexBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT);

    return {
        indices,
        elements: indices.length,
        positions: getArrayFromName(gltf, buffers, mesh, 'POSITION'),
        normals: getArrayFromName(gltf, buffers, mesh, 'NORMAL'),
        tangents: getArrayFromName(gltf, buffers, mesh, 'TANGENT'),
        texCoord: getArrayFromName(gltf, buffers, mesh, 'TEXCOORD_0'),
        joints: getArrayFromName(gltf, buffers, mesh, 'JOINTS_0'),
        weights: getArrayFromName(gltf, buffers, mesh, 'WEIGHTS_0'),
        material: mesh.primitives[0].material,
    } as Mesh;
};

const loadMaterial = async (gl: WebGL2RenderingContext, material: GlTfMaterial, model: string, images?: Image[]) : Promise<Material> => {
    let baseColorTexture: WebGLTexture | null = null;
    let roughnessTexture: WebGLTexture | null = null;
    let baseColor = vec4.create();
    let roughnessMetallic = vec2.create();

    const pbr = material.pbrMetallicRoughness;
    if (pbr) {
        if (pbr.baseColorTexture) {
            const uri = images![pbr.baseColorTexture.index].uri!;
            baseColorTexture = await getTexture(gl, `/models/${model}/${uri}`);
        }
        if (pbr.metallicRoughnessTexture) {
            const uri = images![pbr.metallicRoughnessTexture.index].uri!;
            roughnessTexture = await getTexture(gl, `/models/${model}/${uri}`);
        }

        baseColor = pbr.baseColorFactor
            ? vec4.fromValues(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2], pbr.baseColorFactor[3])
            : vec4.create();

        roughnessMetallic = vec2.fromValues(
            pbr.roughnessFactor ? pbr.roughnessFactor[0] : 0.0,
            pbr.metallicFactor ? pbr.metallicFactor[0] : 0.0
        );
    }

    return {
        baseColorTexture,
        roughnessTexture,
        baseColor,
        roughnessMetallic,
    } as Material;
};

const loadModel = async (gl: WebGL2RenderingContext, model: string) => {
    const response = await fetch(`/models/${model}/${model}.gltf`);
    const gltf = await response.json() as GlTf;

    if (gltf.accessors === undefined || gltf.accessors.length === 0) {
        throw new Error('GLTF File is missing accessors')
    }

    const buffers = await Promise.all(
        gltf.buffers!.map(async (b) => await getBuffer(model, b.uri!)
    ));

    const scene = gltf.scenes![gltf.scene || 0];
    const meshes = gltf.meshes!.map(m => loadMesh(gltf, buffers, m));
    const materials = gltf.materials ? await Promise.all(gltf.materials.map(async (m) => await loadMaterial(gl, m, model, gltf.images))) : [];

    const rootNode = scene.nodes![0];
    const nodes = gltf.nodes!.map((n, i) => loadNodes(i, n));
    const channels = gltf.animations && gltf.animations.length > 0 ? loadAnimation(gltf.animations![0], gltf, buffers) : null;

    const brdfLut = await getTexture(gl, '/textures/brdfLUT.png')

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
        materials,
        brdfLut,
    } as Model;
};

export {
    loadModel,
};
