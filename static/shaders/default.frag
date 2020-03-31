#version 300 es

precision highp float;

#define LIGHT_INTENSITY 1.0
#define LIGHT_DIRECTION vec3(-0.7, -0.7, 1.0)
#define LIGHT_COLOR vec3(1.0)
#define M_PI 3.141592653589793

uniform sampler2D uBaseColorTexture;
uniform int uHasBaseColorTexture;
uniform vec4 uBaseColor;

uniform sampler2D uRoughnessTexture;
uniform int uHasRoughnessTexture;
uniform vec2 uRoughnessMetallic;

uniform sampler2D uEmissiveTexture;
uniform int uHasEmissiveTexture;

uniform sampler2D uNormalTexture;
uniform int uHasNormalTexture;

uniform sampler2D uOcclusionTexture;
uniform int uHasOcclusionTexture;

uniform sampler2D uBrdfLut;
uniform samplerCube uEnvironmentDiffuse;
uniform samplerCube uEnvironmentSpecular;

uniform vec3 uCameraPosition;

in vec2 texCoord;
in vec3 normal;
in vec3 position;
in mat3 tangent;

out vec4 fragColor;

struct MaterialInfo {
    vec3 reflectance0;
    float alphaRoughness;
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 reflectance90;
    float perceptualRoughness;
};


vec3 linearToSrgb(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

vec4 srgbToLinear(vec4 srgbIn) {
    return vec4(pow(srgbIn.xyz, vec3(2.2)), srgbIn.w);
}

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

    if (NdotL > 0.0 || NdotV > 0.0) {
        vec3 F = specularReflection(materialInfo, VdotH);
        float D = microfacetDistribution(materialInfo, NdotH);
        vec3 diffuseContrib = (1.0 - F) * (materialInfo.diffuseColor / M_PI);
        vec3 specContrib = F * D;

        return LIGHT_INTENSITY * LIGHT_COLOR * NdotL * (diffuseContrib + specContrib);
    }

    return vec3(0.0);
}

vec3 getIBLContribution(MaterialInfo materialInfo, vec3 n, vec3 v) {
    float NdotV = clamp(dot(n, v), 0.0, 1.0);

    float lod = clamp(materialInfo.perceptualRoughness * 4.0, 0.0, 4.0);
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, materialInfo.perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));

    vec2 brdf = texture(uBrdfLut, brdfSamplePoint).rg;
    vec4 diffuseSample = vec4(0.1, 0.1, 0.1, 1.0);
    vec4 specularSample = vec4(0.3);

    vec3 diffuseLight = srgbToLinear(texture(uEnvironmentDiffuse, n)).rgb * 0.1;
    vec3 specularLight = srgbToLinear(texture(uEnvironmentSpecular, n)).rgb * 0.2;

    vec3 diffuse = diffuseLight * materialInfo.diffuseColor;
    vec3 specular = specularLight * (materialInfo.specularColor * brdf.x + brdf.y);

    return diffuse + specular;
}

vec4 getBaseColor() {
    if (uHasBaseColorTexture == 1) {
        return srgbToLinear(texture(uBaseColorTexture, texCoord));
    }
    return uBaseColor;
}

vec2 getRoughnessMetallic() {
    if (uHasRoughnessTexture == 1) {
        return texture(uRoughnessTexture, texCoord).gb;
    }
    return uRoughnessMetallic;
}

vec4 getEmissive() {
    if (uHasEmissiveTexture == 1) {
        return texture(uEmissiveTexture, texCoord);
    }
    return vec4(0.0);
}

float getOcclusion() {
    if (uHasOcclusionTexture == 1) {
        return texture(uOcclusionTexture, texCoord).r;
    }
    return 1.0;
}

MaterialInfo getMaterialInfo() {
    vec3 f0 = vec3(0.04);

    vec2 mrSample = getRoughnessMetallic();
    float perceptualRoughness = clamp(mrSample.r, 0.0, 1.0);
    float metallic = clamp(mrSample.g, 0.0, 1.0);

    vec4 baseColor = getBaseColor();
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
        reflectance90,
        perceptualRoughness
    );
}

void main() {
    MaterialInfo materialInfo = getMaterialInfo();

    vec3 n = normal;
    if (uHasNormalTexture == 1) {
        n = texture(uNormalTexture, texCoord).rgb;
        n = normalize(tangent * (2.0 * n - 1.0));
    }

    vec3 view = normalize(uCameraPosition - position);
    vec3 color = calculateDirectionalLight(materialInfo, n, view);

    color += getIBLContribution(materialInfo, n, view);
    color += getEmissive().rgb;
    color = clamp(color, 0.0, 1.0);
    color = mix(color, color * getOcclusion(), 1.0);

    fragColor = vec4(linearToSrgb(color), 1.0);
}
