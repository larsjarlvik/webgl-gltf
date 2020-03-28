#version 300 es

layout (location=0) in vec4 vPosition;
layout (location=1) in vec3 vNormal;
layout (location=2) in vec4 vTangent;
layout (location=3) in vec2 vTexCoord;
layout (location=4) in vec4 vJoints;
layout (location=5) in vec4 vWeights;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uJointTransform[50];

uniform int uIsAnimated;

out vec2 texCoord;
out vec3 normal;
out vec3 position;
out mat3 tangent;

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

    mat4 normalMatrix = transpose(inverse(skinMatrix));
    vec3 normalW = normalize(vec3(normalMatrix * vec4(n.xyz, 0.0)));
    vec3 tangentW = normalize(vec3(uModelMatrix * vec4(t.xyz, 0.0)));
    vec3 bitangentW = cross(normalW, tangentW) * t.w;

    tangent = mat3(tangentW, bitangentW, normalW);
    normal = normalize(mat3(normalMatrix) * vec3(skinMatrix * vec4(vNormal, 1.0)));
    texCoord = vTexCoord;
    position = vec3(uModelMatrix * vPosition) / vPosition.w;

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * skinMatrix * vPosition;
}
