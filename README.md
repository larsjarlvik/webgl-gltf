# webgl-gltf
A basic GLTF loader and viewer For WebGL, **experimental!**

Does not depend on any external libraries except *gl-matrix* to load an display models.

Requires WebGL 2 to run.

## Supports
* Animations
* Basic PBR materials (base color, metal-roughness, normal maps and emissive textures)
* GLTF+bin files

## Does NOT support
* Fully binary (glb) files
* GLTF with embedded data
* Multiple root meshes (TODO)
* Any GLTF extensions
* And probably a lot more...

## Demo
* Waterbottle: https://larsjarlvik.github.io/?model=waterbottle
* Cesium man (animation): https://larsjarlvik.github.io/?model=cesium

Models curtesy of https://github.com/KhronosGroup/glTF-Sample-Models
