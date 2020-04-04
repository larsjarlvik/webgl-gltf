#version 100

attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec4 vTangent;
attribute vec2 vTexCoord;
attribute vec4 vJoints;
attribute vec4 vWeights;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uJointTransform[25];

uniform int uIsAnimated;

varying vec2 texCoord;
varying vec3 normal;
varying vec3 position;
varying mat3 tangent;

void main() {
    mat4 skinMatrix = mat4(1.0);
    if (uIsAnimated == 1) {
        skinMatrix = vWeights.x * uJointTransform[int(vJoints.x)] +
            vWeights.y * uJointTransform[int(vJoints.y)] +
            vWeights.z * uJointTransform[int(vJoints.z)] +
            vWeights.w * uJointTransform[int(vJoints.w)];
    }

    vec3 n = normalize(vNormal);
    vec4 t = normalize(vTangent);

    mat4 normalMatrix = skinMatrix;
    vec3 normalW = normalize(vec3(normalMatrix * vec4(n.xyz, 0.0)));
    vec3 tangentW = normalize(vec3(uModelMatrix * vec4(t.xyz, 0.0)));
    vec3 bitangentW = cross(normalW, tangentW) * t.w;

    tangent = mat3(tangentW, bitangentW, normalW);
    normal = normalize(mat3(normalMatrix) * vec3(skinMatrix * vec4(vNormal, 1.0)));
    texCoord = vTexCoord;
    position = vec3(mat3(uModelMatrix) * vPosition);

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * skinMatrix * vec4(vPosition, 1.0);
}
