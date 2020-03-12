#version 300 es

#define LIGHT_INTENSITY vec3(0.5)
#define LIGHT_POSITION vec3(10.0)
#define PI 3.14159

precision highp float;

uniform sampler2D uBaseColorTexture;
uniform int uHasBaseColorTexture;
uniform vec4 uBaseColor;

uniform sampler2D uRoughnessTexture;
uniform int uHasRoughnessTexture;
uniform float uRoughness;

in vec2 texCoord;
in vec3 normal;
in vec3 position;
in vec3 cameraPosition;

out vec4 fragColor;

vec3 schlickFresnel(float lDotH) {
    vec3 f0 = vec3(0.04);
    return f0 + (1.0 - f0) * pow(1.0 - lDotH, 5.0);
}

float geomSmith(float dotProd, float rough) {
    float k = (rough + 1.0) * (rough + 1.0) / 8.0;
    float denom = dotProd * (1.0 - k) + k;
    return 1.0 / denom;
}

float ggxDistribution(float nDotH, float rough) {
    float alpha2 = rough * rough * rough * rough;
    float d = (nDotH * nDotH) * (alpha2 - 1.0) + 1.0;
    return alpha2 / (PI * d * d);
}

vec3 calculateLight(float roughness) {
    vec3 diffuseBrdf = vec3(0.0);

    vec3 n = normalize(normal);
    vec3 l = normalize(LIGHT_POSITION);
    vec3 v = normalize(-position);
    vec3 h = normalize(v + l);

    float nDotH = dot(n, h);
    float lDotH = dot(l, h);
    float nDotL = max(dot(n, l), 0.0);
    float nDotV = dot(n, v);

    vec3 specBrdf = 0.25 * ggxDistribution(nDotH, roughness) * schlickFresnel(lDotH) * geomSmith(nDotL, roughness);

    return (diffuseBrdf + PI + specBrdf) * LIGHT_INTENSITY * nDotL;
}

void main() {
    vec4 baseColor = uBaseColor;
    if (uHasBaseColorTexture == 1) {
        baseColor = texture(uBaseColorTexture, texCoord);
    }

    float roughness = uRoughness;
    if (uHasRoughnessTexture == 1) {
        roughness = texture(uRoughnessTexture, texCoord).g;
    }

    vec3 light = pow(calculateLight(roughness), vec3(1.0 / 2.2));
    fragColor = baseColor * vec4(light, 1.0);
}
