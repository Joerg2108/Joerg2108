---
name: threejs
description: three.js skill for 3D graphics in the browser with WebGL and WebGPU. Use when the user wants a 3D scene, model viewer, product configurator, 3D hero, particles, shaders, or mentions three.js, threejs.org, THREE., WebGLRenderer, WebGPURenderer, TSL, GLTFLoader or OrbitControls, in vanilla JS, Vite, React, Next.js or Vue. Covers import maps vs npm, renderer choice, scene setup, lights and shadows, loading glTF models and animations, TSL node materials, raycasting, InstancedMesh, resize handling, cleanup and known pitfalls.
license: MIT
---

# three.js

three.js is a JavaScript library for 3D graphics with WebGL and WebGPU.
Source: https://github.com/mrdoob/three.js (MIT). Docs: https://threejs.org/docs. Manual: https://threejs.org/manual.
The rules below follow the official LLM guidance at https://threejs.org/docs/llms.txt. Version in this skill: `0.186.1` (r186).

## Rules

1. **Use ES modules.** Load three.js with an import map or from npm. Never use the old `<script src=".../three.min.js">` pattern or the global `THREE`. The UMD build no longer exists.
2. **Pin an exact version** in CDN URLs, such as `three@0.186.1`. Never use `three@latest`, because an unpinned upgrade can break the page.
3. **Import addons from `three/addons/...`.** This covers controls, loaders, exporters and postprocessing. Never use `three/examples/js/...`.
4. **Default to `WebGLRenderer`.** Use `WebGPURenderer` only for TSL shaders, compute, or node materials.
5. **Use TSL for custom shaders with `WebGPURenderer`.** Do not use raw GLSL strings or `onBeforeCompile`.
6. **Use `THREE.Timer`, not `THREE.Clock`.** `Clock` is deprecated since r183 and logs a warning.
7. **Use `renderer.setAnimationLoop(fn)`.** Do not hand-roll a `requestAnimationFrame` loop. WebXR needs `setAnimationLoop`, and passing `null` stops the loop cleanly.
8. **Dispose what you create.** Every geometry, material, texture, render target and renderer holds GPU memory until `dispose()` is called.

## Setup with an import map (no build step)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; }
    #stage { width: 100%; height: 100vh; }
  </style>
</head>
<body>
<div id="stage"></div>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const el = document.getElementById('stage');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap: 3x screens cost a lot of fill rate
renderer.setSize(el.clientWidth, el.clientHeight);
renderer.shadowMap.enabled = true;
el.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // needs controls.update() every frame

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 5, 2);
sun.castShadow = true;
scene.add(sun);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x44aa88 })
);
cube.castShadow = true;
scene.add(cube);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// Size from the container, not the window, so the canvas works inside any layout
const ro = new ResizeObserver(() => {
  camera.aspect = el.clientWidth / el.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(el.clientWidth, el.clientHeight);
});
ro.observe(el);

const timer = new THREE.Timer();
timer.connect(document); // pauses the delta while the tab is hidden

renderer.setAnimationLoop((time) => {
  timer.update(time);
  cube.rotation.y += timer.getDelta(); // frame-rate independent
  controls.update();
  renderer.render(scene, camera);
});
</script>
</body>
</html>
```

## Setup with npm (Vite, Next.js, any bundler)

```bash
npm install three@0.186.1
npm install -D @types/three   # TypeScript only
```

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

The import paths match the import map, so code moves between the two setups unchanged.

## Choosing the renderer

| | `WebGLRenderer` | `WebGPURenderer` |
|---|---|---|
| Import | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| Init | ready immediately | `await renderer.init()` before the first render |
| Custom shaders | `ShaderMaterial` (GLSL) | TSL node materials |
| Use for | everything by default | TSL, compute shaders, node materials |

Without WebGPU support (older browsers, many headless setups), `WebGPURenderer` falls back to a WebGL2 backend by itself and logs `WebGPU is not available, running under WebGL2 backend.` Check which backend is active with `renderer.backend.isWebGPUBackend`.

## WebGPURenderer with TSL

The import map needs three entries. `three` points at the WebGPU build so that addons share one copy of the core:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
    "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.tsl.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three/webgpu';
import { color, mix, positionLocal, sin, time, uniform, uv } from 'three/tsl';

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
await renderer.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 3;
scene.add(new THREE.AmbientLight(0xffffff, 1));

const tint = uniform(new THREE.Color(0xff0000)); // change at runtime: tint.value.set(0x00ff00)

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = mix(color(0x0000ff), tint, uv().x);                          // gradient
material.positionNode = positionLocal.add(sin(time.add(positionLocal.y)).mul(0.1)); // wobble

const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
scene.add(mesh);

renderer.setAnimationLoop(() => renderer.render(scene, camera));
</script>
```

Node materials: `MeshBasicNodeMaterial`, `MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`, `LineBasicNodeMaterial`, `SpriteNodeMaterial`.
Full TSL reference: https://threejs.org/docs/llms-full.txt and https://threejs.org/docs/#TSL

## Loading glTF models and animations

Use glTF/GLB as the model format. Convert FBX or OBJ to GLB with Blender before loading.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltf = await new GLTFLoader().loadAsync('model.glb', (e) => {
  if (e.total) console.log(Math.round(e.loaded / e.total * 100) + '%');
});
scene.add(gltf.scene);

// Find parts by the names set in Blender
const wheel = gltf.scene.getObjectByName('Wheel');

// Play embedded animations
const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations[0]).play();
// in the loop: mixer.update(timer.getDelta());

// Frame the model: center it and fit the camera to its size
const box = new THREE.Box3().setFromObject(gltf.scene);
const size = box.getSize(new THREE.Vector3()).length();
gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));
camera.position.set(0, size * 0.3, size * 1.2);
controls.target.set(0, 0, 0);
```

Compressed models need a decoder on the loader: `DRACOLoader` via `loader.setDRACOLoader(...)` and `KTX2Loader` via `loader.setKTX2Loader(...)`, both from `three/addons/loaders/`.

## Textures and color

```js
const tex = await new THREE.TextureLoader().loadAsync('albedo.jpg');
tex.colorSpace = THREE.SRGBColorSpace; // color/albedo maps only
material.map = tex;
```

- Set `SRGBColorSpace` on color, albedo and emissive maps. Leave normal, roughness, metalness and AO maps at the default, because they hold data, not color. A wrong color space gives washed-out or too-dark colors.
- `renderer.outputColorSpace` is already `SRGBColorSpace`. Do not change it.
- For a photographic look, set `renderer.toneMapping = THREE.ACESFilmicToneMapping` and light the scene with an HDR environment through `scene.environment` (`HDRLoader` from `three/addons/loaders/HDRLoader.js` with `texture.mapping = THREE.EquirectangularReflectionMapping`; `RGBELoader` is deprecated since r180).

## Picking objects with the mouse

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect(); // correct when the canvas is not full-page
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(scene.children, true)[0];
  if (hit) console.log(hit.object.name, hit.point, hit.instanceId);
});
```

## Many objects: InstancedMesh

Thousands of copies of one geometry render in a single draw call:

```js
const count = 1000;
const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial(), count);
const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
  mesh.setColorAt(i, new THREE.Color().setHSL(i / count, 1, 0.5));
}
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere(); // needed for correct raycasting and culling after moving instances
scene.add(mesh);
```

Raycasting returns `hit.instanceId` for the instance that was hit.

## Cleanup

This matters for single-page apps, React effects, Vue `onUnmounted` and anything else that removes the canvas.

```js
function destroy() {
  renderer.setAnimationLoop(null);
  ro.disconnect();
  controls.dispose();
  timer.dispose();
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      for (const m of [].concat(obj.material)) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    }
  });
  renderer.dispose();
  renderer.domElement.remove();
}
```

`renderer.info.memory` shows the live geometry and texture counts. Use it to confirm that cleanup works.

### React (plain three.js in an effect)

```jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Scene() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    // ... build scene, camera, renderer, controls, ro, timer exactly as in the setup above ...
    el.appendChild(renderer.domElement);
    return destroy; // the cleanup function from above; StrictMode mounts twice in dev
  }, []);
  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
```

For a React-first app, React Three Fiber (`@react-three/fiber` plus `@react-three/drei`) wraps three.js declaratively and handles disposal. It is a separate project with its own versioning. Check its docs for which three.js versions it supports.

## Pitfalls

- **Black screen:** no light for `MeshStandardMaterial`, so add a light or use `MeshBasicMaterial` to test. Other causes: the camera sits inside the object, `near`/`far` cut the object off, or the container has 0 px height.
- **Stretched picture after a resize:** `camera.updateProjectionMatrix()` was not called after changing `camera.aspect`.
- **Two copies of three.js** (the warning `Multiple instances of Three.js being imported`): an addon was loaded from a different URL or version than `three`. Keep every URL on the same pinned version.
- **Damping does nothing:** `controls.update()` is missing from the animation loop.
- **Shadows missing:** all three are required: `renderer.shadowMap.enabled`, `light.castShadow` and `mesh.castShadow` / `receiveShadow`.
- **Vanta.js in the same project:** Vanta needs the old global three.js r134 (see the `vanta` skill). Do not share one three.js between Vanta and a modern module scene.
