# webgl-gltf
A basic GLTF loader For WebGL (**alpha!**). Only depends on *gl-matrix*.

Requires WebGL 2 to run.

Please see example folder for implementation.

## Supports
* Textures
* PBR materials (base color, metal-roughness, normal, occlusion and emissive)
* Animations
* Animation blending
* GLTF+bin files

## Does NOT support
* Fully binary (`.glb`) files
* GLTF with embedded data
* Multiple root meshes (TODO)
* Any GLTF extensions
* And probably a lot more...

## Demo
* Robot: https://larsjarlvik.github.io/?model=robot
* Waterbottle: https://larsjarlvik.github.io/?model=waterbottle
* Cesium man (animation): https://larsjarlvik.github.io/?model=cesium

## Run example code
* `npm install`
* `npm run start`

*Models curtesy of https://github.com/KhronosGroup/glTF-Sample-Models*
