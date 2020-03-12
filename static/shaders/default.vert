#version 300 es

layout (location=0) in vec3 vPosition;
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
out vec3 cameraPosition;

void main() {
    mat4 skinMatrix = mat4(1.0);
    if (uIsAnimated == 1) {
        skinMatrix = vWeights.x * uJointTransform[int(vJoints.x)] +
            vWeights.y * uJointTransform[int(vJoints.y)] +
            vWeights.z * uJointTransform[int(vJoints.z)] +
            vWeights.w * uJointTransform[int(vJoints.w)];
    }

    mat3 normalMatrix = mat3(transpose(inverse(uViewMatrix * uModelMatrix)));

    texCoord = vTexCoord;
    normal = normalize(normalMatrix * vec3(skinMatrix * vec4(vNormal, 1.0)));
    position = vPosition;
    cameraPosition = vec3(uViewMatrix[3][0], uViewMatrix[3][1], uViewMatrix[3][0]);
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * skinMatrix * vec4(vPosition, 1.0);
}
