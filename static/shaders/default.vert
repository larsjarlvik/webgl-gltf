#version 300 es

uniform mat4 pMatrix;
uniform mat4 mvMatrix;

layout (location=0) in vec4 position;
layout (location=1) in vec3 normal;
layout (location=2) in vec4 tangent;
layout (location=3) in vec2 texCoord;

out vec3 color;

void main() {
    color = normal;
    gl_Position = pMatrix * mvMatrix * position;
}
