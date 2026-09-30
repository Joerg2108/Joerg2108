---
name: vanta
description: Vanta.js skill for animated 3D/WebGL website backgrounds (birds, waves, fog, net, globe, clouds, halo, cells, dots, rings, ripple, topology, trunk). Use when the user wants an animated hero or section background, mentions Vanta or vantajs.com, or asks for VANTA.WAVES / VANTA.BIRDS / VANTA.NET etc. in vanilla JS, React, Next.js or Vue. Covers setup with three.js or p5.js, per-effect options, setOptions/resize/destroy, framework cleanup and known pitfalls.
license: MIT
---

# Vanta.js

Vanta renders an animated canvas as the background of one HTML element. Other children of that element stay in front as foreground content.
Source: https://github.com/tengbao/vanta (MIT, version 0.5.24, last release January 2023; the project is unmaintained).
Gallery with live option editor: https://www.vantajs.com

## Engine per effect

Every effect needs one engine. Load the engine BEFORE the effect, or pass it in through the options.

| Effect | Call | Engine |
|---|---|---|
| birds, dots, globe, net, rings, waves | `VANTA.BIRDS` ... | three.js |
| cells, clouds, clouds2, fog, halo, ripple | `VANTA.FOG` ... | three.js (shader) |
| topology, trunk | `VANTA.TOPOLOGY`, `VANTA.TRUNK` | p5.js |

## Setup with script tags

Pin three.js to r134, the version the Vanta README uses. Tested with vanta 0.5.24 in Chromium: all 12 three.js effects start at r134 and r150. At r159, BIRDS fails with `birds init error: TypeError: ... is not a constructor` and the call returns `undefined`. Newer three.js versions are not supported by the project.

```html
<div id="hero" style="min-height: 100vh">
  <h1>Foreground content</h1>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.waves.min.js"></script>
<script>
  const effect = VANTA.WAVES({
    el: '#hero',
    color: 0x005588,
    waveHeight: 15
  })
</script>
```

For p5 effects, load p5 instead of three:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.topology.min.js"></script>
<script>VANTA.TOPOLOGY({ el: '#hero' })</script>
```

## Setup with npm

```bash
npm i vanta three@0.134.0
```

```js
import * as THREE from 'three'
import WAVES from 'vanta/dist/vanta.waves.min'

const effect = WAVES({ el: document.querySelector('#hero'), THREE })
```

Pass `THREE` (or `p5` for topology/trunk) explicitly. Without it, Vanta reads `window.THREE` and fails if the global is missing.

## Common options (all effects)

| Option | Default | Meaning |
|---|---|---|
| `el` | required | Selector string or DOM element. The canvas takes this element's size. |
| `mouseControls` | `true` | React to mouse movement (only some effects use it). |
| `touchControls` | `true` | React to touch input. |
| `gyroControls` | `false` | Use device gyroscope like a mouse. |
| `minHeight` / `minWidth` | `200` | Minimum canvas size in px. |
| `scale` / `scaleMobile` | `1` (effect-specific for shaders) | Render scale. Higher values on shader effects render fewer pixels and are faster. |
| `backgroundColor` | effect-specific | Also used as the fallback if WebGL init fails. |
| `THREE` / `p5` | `window.THREE` / `window.p5` | Engine instance from npm. |

Colors are numbers in `0xRRGGBB` form, not CSS strings: `color: 0xff3f81`.

## Effect-specific defaults

Read from the source of 0.5.24. Use these names exactly.

- **WAVES**: `color: 0x005588, shininess: 30, waveHeight: 15, waveSpeed: 1, zoom: 1`
- **BIRDS**: `backgroundColor: 0x07192f, color1: 0xff0000, color2: 0x00d1ff, colorMode: 'varianceGradient', birdSize: 1, wingSpan: 30, speedLimit: 5, separation: 20, alignment: 20, cohesion: 20, quantity: 5` (quantity range 2-5)
- **NET**: `color: 0xff3f81, backgroundColor: 0x23153c, points: 10, maxDistance: 20, spacing: 15, showDots: true`
- **GLOBE**: like NET plus `color2: 0xffffff, size: 1`
- **DOTS**: `color: 0xff8820, color2: 0xff8820, backgroundColor: 0x222222, size: 3, spacing: 35, showLines: true`
- **RINGS**: `backgroundColor: 0x202428, color: 0x88ff00`
- **FOG**: `highlightColor: 0xffc300, midtoneColor: 0xff1f00, lowlightColor: 0x2d00ff, baseColor: 0xffebeb, blurFactor: 0.6, speed: 1, zoom: 1, scale: 2, scaleMobile: 4`
- **CLOUDS**: `backgroundColor: 0xffffff, skyColor: 0x68b8d7, cloudColor: 0xadc1de, cloudShadowColor: 0x183550, sunColor: 0xff9919, sunGlareColor: 0xff6633, sunlightColor: 0xff9933, speed: 1, scale: 3, scaleMobile: 12`
- **CLOUDS2**: `backgroundColor: 0x000000, skyColor: 0x5ca6ca, cloudColor: 0x334d80, lightColor: 0xffffff, speed: 1, scaleMobile: 4, texturePath: './gallery/noise.png'`
- **HALO**: `baseColor: 0x001a59, color2: 0xf2e735, backgroundColor: 0x131a43, amplitudeFactor: 1, ringFactor: 1, rotationFactor: 1, xOffset: 0, yOffset: 0, size: 1, speed: 1`
- **CELLS**: `color1: 0x008c8c, color2: 0xf2e735, backgroundColor: 0xd7ff8f, size: 1.5, speed: 1, scaleMobile: 3`
- **RIPPLE**: `color1: 0x060b25, color2: 0xffffff, backgroundColor: 0xf6f6f6, amplitudeFactor: 1, ringFactor: 4, rotationFactor: 0.1, speed: 1, scaleMobile: 4`
- **TOPOLOGY** (p5): `color: 0x89964e, backgroundColor: 0x002222`
- **TRUNK** (p5): `color: 0x98465f, backgroundColor: 0x222426, spacing: 0, chaos: 1`

## Instance methods

```js
effect.setOptions({ color: 0xff88cc }) // change options while running
effect.resize()                        // redraw after the container changed size
effect.restart()                       // rebuild the scene, keep the renderer
effect.destroy()                       // stop the loop, remove canvas and listeners
```

If an option change has no visible effect after `setOptions` (for example structural options such as `points` or `quantity`), call `restart()`.

## React / Next.js

Create the effect once in `useEffect`, destroy it in the cleanup. Keep the instance in a ref, not in state: state causes an extra render, and React 18 Strict Mode runs effects twice in development.

```jsx
'use client' // Next.js App Router: Vanta needs window and WebGL
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import NET from 'vanta/dist/vanta.net.min'

export default function Hero({ children }) {
  const elRef = useRef(null)

  useEffect(() => {
    const effect = NET({
      el: elRef.current,
      THREE,
      color: 0x3fa9ff,
      backgroundColor: 0x0b1020
    })
    return () => effect?.destroy()
  }, [])

  return <section ref={elRef} style={{ minHeight: '100vh' }}>{children}</section>
}
```

In Next.js Pages Router or other SSR setups, load the component with `dynamic(() => import('./Hero'), { ssr: false })`.

## Vue 3

```vue
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'

const el = ref(null)
let effect
onMounted(() => { effect = FOG({ el: el.value, THREE }) })
onBeforeUnmount(() => { effect?.destroy() })
</script>

<template>
  <section ref="el" style="min-height: 100vh"><slot /></section>
</template>
```

In Nuxt, wrap the component in `<ClientOnly>`.

## Rules and pitfalls

- Give the container a real height (`min-height: 100vh` or fixed px). An empty element without height shows nothing useful.
- Always call `destroy()` on unmount or page change. Otherwise the render loop and WebGL context keep running. Guard it with `effect?.destroy()`: when init fails early (for example BIRDS with an unsupported three.js version), the effect call returns `undefined`.
- Use one Vanta effect per page. Browsers limit the number of WebGL contexts.
- Respect reduced motion. Skip the effect and set a static background instead:
  ```js
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    effect = VANTA.WAVES({ el: '#hero', THREE })
  } else {
    document.querySelector('#hero').style.background = '#005588'
  }
  ```
- Keep foreground text readable: check contrast against the brightest part of the animation, or add a semi-transparent overlay.
- CLOUDS2 loads a noise texture from `texturePath`. The default `./gallery/noise.png` only exists on vantajs.com. Host the file yourself and set `texturePath`. The image must come from the same origin or send CORS headers, and the page must run over HTTP, not `file://`.
- For heavy shader effects on mobile, raise `scaleMobile` for better frame rate.
- If WebGL init fails, Vanta logs `[VANTA] Init error` and falls back to `backgroundColor`. Always set `backgroundColor` so the fallback looks intended.
- Pin versions (`vanta@0.5.24`, three `r134` / `0.134.0`). Do not use `vanta@latest` from a CDN in production.
