#version 300 es
precision highp float;

uniform sampler2D baseColorTexture;
uniform int hasBaseColorTexture;

in vec2 texCoords;
in vec3 color;

out vec4 fragColor;

void main() {
    fragColor = vec4(color, 1.0);
    if (hasBaseColorTexture == 1) {
        fragColor = texture(baseColorTexture, texCoords);
    }
}
