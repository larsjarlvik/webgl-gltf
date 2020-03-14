#version 300 es

precision highp float;

#define LIGHT_INTENSITY vec3(1.0)
#define LIGHT_DIRECTION vec3(-0.7, -0.7, -1.0)
#define LIGHT_COLOR vec3(1.0)
#define M_PI 3.141592653589793

uniform sampler2D uBrdfLut;

uniform sampler2D uBaseColorTexture;
uniform int uHasBaseColorTexture;
uniform vec4 uBaseColor;

uniform sampler2D uRoughnessTexture;
uniform int uHasRoughnessTexture;
uniform vec2 uRoughnessMetallic;

uniform vec3 uCameraPosition;

in vec2 texCoord;
in vec3 normal;
in vec3 position;

out vec4 fragColor;

struct MaterialInfo
{
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 specularColor;
    vec3 reflectance90;           // reflectance color at grazing angle
};

vec3 specularReflection(MaterialInfo materialInfo, float VdotH) {
    return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

float microfacetDistribution(MaterialInfo materialInfo, float NdotH) {
    float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
    float f = (NdotH * alphaRoughnessSq - NdotH) * NdotH + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}

vec3 calculateDirectionalLight(MaterialInfo materialInfo, vec3 normal, vec3 view) {
    vec3 pointToLight = -LIGHT_DIRECTION;

    vec3 n = normalize(normal);           // Outward direction of surface point
    vec3 v = normalize(view);             // Direction from surface point to view
    vec3 l = normalize(pointToLight);     // Direction from surface point to light
    vec3 h = normalize(l + v);            // Direction of the vector between l and v

    float NdotL = clamp(dot(n, l), 0.0, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);
    float NdotV = clamp(dot(n, v), 0.0, 1.0);

    if (NdotL > 0.0 || NdotV > 0.0)
    {
        vec3 F = specularReflection(materialInfo, VdotH);
        float D = microfacetDistribution(materialInfo, NdotH);
        vec3 diffuseContrib = (1.0 - F) * (materialInfo.diffuseColor / M_PI);
        vec3 specContrib = F * D;

        return LIGHT_INTENSITY * LIGHT_COLOR * NdotL * (diffuseContrib + specContrib);
    }

    return vec3(0.0);
}

vec4 getBaseColor() {
    if (uHasBaseColorTexture == 1) {
        return texture(uBaseColorTexture, texCoord);
    }
    return uBaseColor;
}

vec2 getRoughnessMetallic() {
    if (uHasRoughnessTexture == 1) {
        return texture(uRoughnessTexture, texCoord).gb;
    }
    return uRoughnessMetallic;
}

MaterialInfo getMaterialInfo() {
    vec3 f0 = vec3(0.04);

    vec2 mrSample = getRoughnessMetallic();
    float perceptualRoughness = clamp(mrSample[0], 0.0, 1.0);
    float metallic = clamp(mrSample[1], 0.0, 1.0) * 0.5;

    vec4 baseColor = getBaseColor();
    baseColor = vec4(pow(baseColor.rgb, vec3(2.2)), 1.0);

    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
    vec3 reflectance0 = specularColor.rgb;
    vec3 reflectance90 = vec3(clamp(reflectance * 50.0, 0.0, 1.0));
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    return MaterialInfo(
        reflectance0,
        alphaRoughness,
        diffuseColor,
        specularColor,
        reflectance90
    );
}

void main() {
    MaterialInfo materialInfo = getMaterialInfo();

    vec3 view = normalize(uCameraPosition - position);
    vec3 color = calculateDirectionalLight(materialInfo, normal, view);

    fragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
