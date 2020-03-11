#version 300 es

layout (location=0) in vec3 position;
layout (location=1) in vec3 normal;
layout (location=2) in vec4 tangent;
layout (location=3) in vec2 texCoord;
layout (location=4) in vec4 joints;
layout (location=5) in vec4 weights;

uniform mat4 pMatrix;
uniform mat4 mvMatrix;
uniform mat4 jointTransform[50];
uniform mat4 mMatrix;
uniform int isAnimated;

out vec2 texCoords;

void main() {
    vec4 totalLocalPos = vec4(position, 1.0);
    vec4 totalNormal = vec4(normal, 0.0);

    mat4 skinMatrix = mat4(1.0);
    if (isAnimated == 1) {
        skinMatrix = weights.x * jointTransform[int(joints.x)] +
            weights.y * jointTransform[int(joints.y)] +
            weights.z * jointTransform[int(joints.z)] +
            weights.w * jointTransform[int(joints.w)];
    }

    texCoords = texCoord;
    gl_Position = pMatrix * mvMatrix * mMatrix * skinMatrix * totalLocalPos;
}
