#version 300 es

#define LIGHT_AMBIENT vec3(0.3, 0.3, 0.3)
#define LIGHT_DIFFUSE vec3(0.8, 0.8, 0.8)
#define LIGHT_POSITION vec3(10.0, 10.0, 10.0)

precision highp float;

uniform sampler2D uBaseColorTexture;
uniform int uHasBaseColorTexture;
uniform vec4 uBaseColor;

in vec2 texCoord;
in vec3 normal;
in vec3 position;

out vec4 fragColor;

vec4 calculateLight() {
    vec3 lightDir = normalize(LIGHT_POSITION - position);

    float diff = max(dot(normalize(normal), lightDir), 0.0);
    vec3 diffuse = diff * LIGHT_DIFFUSE;

    return vec4(LIGHT_AMBIENT + diffuse, 1.0);
}

void main() {
    if (uHasBaseColorTexture == 1) {
        fragColor = texture(uBaseColorTexture, texCoord);
    } else {
        fragColor = uBaseColor;
    }

    fragColor *= calculateLight();
}
