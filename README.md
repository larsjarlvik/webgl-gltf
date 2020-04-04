# webgl-gltf
A small GLTF loader For WebGL. Only depends on *gl-matrix*.

Supports both WebGL and WebGL 2.

Please see example folder for implementation.

## Documentation
Please see the wiki for documentation
[Wiki](https://github.com/larsjarlvik/webgl-gltf/wiki)

## Supports
* Multiple meshes
* Textures
* PBR materials (base color, metal-roughness, normal, occlusion and emissive)
* Animations
* Animation blending
* GLTF+bin files

## Does NOT support
* Fully binary (`.glb`) files
* GLTF with embedded data
* Any GLTF extensions
* And probably a lot more...

## Demo
* Robot: https://larsjarlvik.github.io/?model=robot
* Waterbottle: https://larsjarlvik.github.io/?model=waterbottle
* Cesium man (animation): https://larsjarlvik.github.io/?model=cesium

## Installation
* `npm install webgl-gltf`

## Run example code
* `npm install`
* `npm run start`

*Models curtesy of https://github.com/KhronosGroup/glTF-Sample-Models*
