#version 300 es
precision highp float;

uniform sampler2D baseColorTexture;
uniform int hasBaseColorTexture;
uniform vec4 baseColor;

in vec2 texCoords;

out vec4 fragColor;

void main() {
    if (hasBaseColorTexture == 1) {
        fragColor = texture(baseColorTexture, texCoords);
    } else {
        fragColor = baseColor;
    }
}
