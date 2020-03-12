#version 300 es

layout (location=0) in vec3 vPosition;
layout (location=1) in vec3 vNormal;
layout (location=2) in vec4 vTangent;
layout (location=3) in vec2 vTexCoord;
layout (location=4) in vec4 vJoints;
layout (location=5) in vec4 vWeights;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uMeshMatrix;
uniform mat4 uJointTransform[50];

uniform int uIsAnimated;

out vec2 texCoord;
out vec3 normal;
out vec3 position;

void main() {
    mat4 skinMatrix = mat4(1.0);
    if (uIsAnimated == 1) {
        skinMatrix = vWeights.x * uJointTransform[int(vJoints.x)] +
            vWeights.y * uJointTransform[int(vJoints.y)] +
            vWeights.z * uJointTransform[int(vJoints.z)] +
            vWeights.w * uJointTransform[int(vJoints.w)];
    }

    texCoord = vTexCoord;
    normal = vec3(skinMatrix * vec4(vNormal, 1.0));
    position = vPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * uMeshMatrix * skinMatrix * vec4(vPosition, 1.0);
}
