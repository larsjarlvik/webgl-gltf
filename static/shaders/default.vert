#version 300 es

const int MAX_JOINTS = 50;
const int MAX_WEIGHTS = 4;

layout (location=0) in vec4 position;
layout (location=1) in vec3 normal;
layout (location=2) in vec4 tangent;
layout (location=3) in vec2 texCoord;
layout (location=4) in vec4 joints;
layout (location=5) in vec4 weights;

uniform mat4 pMatrix;
uniform mat4 mvMatrix;
uniform mat4 jointTransform;

out vec3 color;

void main() {
    vec4 totalLocalPos = vec4(0.0);
    vec4 totalNormal = vec4(0.0);

    for (int i = 0; i < MAX_WEIGHTS; i ++) {
        totalLocalPos += jointTransform * position * weights[i];
        totalNormal += jointTransform * vec4(normal, 0.0) * weights[i];
    }

    color = totalNormal.xyz;
    gl_Position = pMatrix * mvMatrix * totalLocalPos;
}
