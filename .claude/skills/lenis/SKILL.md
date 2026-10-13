---
name: lenis
description: Lenis smooth scroll skill (darkroom.engineering) for vanilla JS, React, Next.js, Vue and Nuxt. Use when the user wants smooth scrolling, inertia/momentum scroll, scroll synced with GSAP ScrollTrigger or WebGL, smooth anchor links, scroll snapping with smooth scroll, or mentions Lenis, lenis/react, ReactLenis, useLenis, VueLenis or lenis/snap. Covers setup and the raf loop, recommended CSS, options, scrollTo, stop/start for modals, nested scroll, reduced motion, framework adapters and known pitfalls.
license: MIT
---

# Lenis

Lenis smooths the native scroll of the page or of one scroll container. Position `sticky`, anchors and accessibility keep working because the browser still scrolls.
Source: https://github.com/darkroomengineering/lenis (MIT, version 1.3.26). Demo: https://lenis.darkroom.engineering
One npm package `lenis` contains all entry points: `lenis`, `lenis/react`, `lenis/vue`, `lenis/nuxt`, `lenis/snap`, `lenis/dist/lenis.css`. No runtime dependencies, about 5 KB gzip.

## Rule 1: something must call `raf()` every frame

Lenis catches `wheel` and `touch` events and moves the scroll itself. Without a running loop the page does not scroll at all. Tested: `new Lenis()` without `autoRaf` and without a loop keeps `scrollY` at 0 after a wheel event.

Pick exactly one driver:

| Driver | Code |
|---|---|
| Lenis itself | `new Lenis({ autoRaf: true })` |
| own loop | `requestAnimationFrame` loop that calls `lenis.raf(time)` (time in ms) |
| GSAP ticker | `gsap.ticker.add(t => lenis.raf(t * 1000))` (GSAP time is seconds) |
| Motion | `frame.update(({ timestamp }) => lenis.raf(timestamp), true)` |

Never combine `autoRaf: true` with a second loop: `raf()` then runs twice per frame.
Defaults differ: core `new Lenis()` has `autoRaf: false`. `<ReactLenis>` and `<VueLenis>` default to `autoRaf: true`. Set `options={{ autoRaf: false }}` when you drive them from GSAP or Motion.

## Setup (vanilla)

```bash
npm i lenis
```

```js
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const lenis = new Lenis({
  autoRaf: true,
  anchors: true,            // smooth scroll for <a href="#id">
  allowNestedScroll: true,  // inner scroll boxes scroll natively
})

lenis.on('scroll', (l) => {
  console.log(l.scroll, l.velocity, l.direction, l.progress)
})
```

No build step:

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>
<script>new Lenis({ autoRaf: true, anchors: true })</script>
```

Always load `lenis.css`. It sets `height: auto` on `html`/`body`, clips overflow while stopped (`.lenis-stopped`), sets `overscroll-behavior: contain` on `data-lenis-prevent` elements and disables pointer events on iframes during smooth scroll.

## GSAP ScrollTrigger

```js
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()                         // no autoRaf: GSAP drives it
lenis.on('scroll', ScrollTrigger.update)          // keep ScrollTrigger in sync
gsap.ticker.add((time) => lenis.raf(time * 1000)) // seconds to ms
gsap.ticker.lagSmoothing(0)                       // no catch-up jumps
```

All three lines matter. Tested: a ScrollTrigger `onEnter` fires while Lenis scrolls. For ScrollTrigger details see the `gsap-scrolltrigger` skill.

## React / Next.js

```tsx
'use client'
import { ReactLenis, useLenis } from 'lenis/react'
import 'lenis/dist/lenis.css'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useLenis((lenis) => {
    // runs on every scroll frame
  })
  return (
    <>
      <ReactLenis root options={{ anchors: true }} />
      {children}
    </>
  )
}
```

- `root`: instance on `<html>`, reachable via `useLenis()` anywhere, even outside the provider tree. Without `root`, `<ReactLenis>` renders a wrapper `div` and a content `div` and smooths that container; give the wrapper a height and `overflow: auto`.
- `useLenis(callback?, deps?, priority?)` returns the instance (`undefined` on the first render) and subscribes `callback` to `scroll`.
- Ref: `useRef<LenisRef>(null)`, then `ref.current?.lenis`.
- `lenis/react` ships `"use client"`. In Next.js App Router put `<ReactLenis root />` in a client component inside `app/layout.tsx`.
- Options are compared with `JSON.stringify`. A changed function option (`easing`, `prevent`, `virtualScroll`) alone does not recreate the instance.

GSAP with React (the README example misses `ScrollTrigger.update` and `lagSmoothing`):

```tsx
'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll() {
  const lenis = useLenis() // re-renders once the root instance exists

  useEffect(() => {
    if (!lenis) return
    const update = (time: number) => lenis.raf(time * 1000)
    const off = lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    return () => {
      off()
      gsap.ticker.remove(update)
    }
  }, [lenis])

  return <ReactLenis root options={{ autoRaf: false }} />
}
```

Tested: page scrolls and a ScrollTrigger `onEnter` fires. Do not read `ref.current.lenis` in the parent's `useEffect`: `<ReactLenis>` creates the instance in its own effect and re-renders only itself, so the parent effect sees `undefined` and the page never scrolls (tested).

## Vue / Nuxt

```js
// main.js
import { createApp } from 'vue'
import LenisVue from 'lenis/vue'
createApp(App).use(LenisVue).mount('#app')   // registers <VueLenis> / <vue-lenis>

// nuxt.config.ts
export default defineNuxtConfig({ modules: ['lenis/nuxt'] })
```

```vue
<script setup>
import { useLenis } from 'lenis/vue'
useLenis((lenis) => { /* every scroll */ }, 0) // callback, priority
</script>

<template>
  <VueLenis root :options="{ anchors: true }" />
</template>
```

`useLenis` in Vue returns a ref; watch it to get the instance. For GSAP, use `:options="{ autoRaf: false }"` and the ticker code from above inside `watchEffect` with `onInvalidate(() => gsap.ticker.remove(update))`.

## Important options

| Option | Default | Note |
|---|---|---|
| `autoRaf` | `false` (core) | see Rule 1 |
| `lerp` | `0.1` | 0 to 1; smaller = smoother/slower. When set, `duration`/`easing` are ignored |
| `duration` / `easing` | `1.2` / expo out | only without `lerp` |
| `anchors` | `false` | `true` or `scrollTo` options (`{ offset: -80 }` for a fixed header) |
| `allowNestedScroll` | `false` | auto-detect inner scroll boxes; checks the DOM on every event |
| `prevent` | - | `(node) => boolean`; cheaper than `allowNestedScroll` |
| `autoToggle` | `false` | start/stop from the wrapper `overflow`; needs `lenis.css`, Safari 17.4+, Chrome 117+, Firefox 129+ |
| `syncTouch` | `false` | smooth touch too; can be unstable on iOS < 16. Required for `infinite` on touch |
| `smoothWheel` | `true` | smooth mouse wheel |
| `wheelMultiplier` / `touchMultiplier` | `1` | speed |
| `orientation` / `gestureOrientation` | `vertical` | `horizontal` / `both` for horizontal sites |
| `infinite` | `false` | endless loop scroll |
| `respectReducedMotion` | `true` | keep it on |
| `stopInertiaOnNavigate` | `false` | stop momentum when an internal link is clicked |
| `wrapper` / `content` | `window` / `<html>` | for a custom scroll container |

## Methods

```js
lenis.scrollTo('#contact', { offset: -80, duration: 1.5 })
lenis.scrollTo(0, { immediate: true })            // jump, no animation
lenis.scrollTo('bottom', { lock: true, onComplete: () => {} })
lenis.stop()      // block user scroll (modal open); html gets .lenis-stopped + overflow: clip
lenis.start()     // resume
lenis.resize()    // only needed with autoResize: false
lenis.destroy()   // remove listeners and classes (SPA route change, unmount)
const off = lenis.on('scroll', cb); off()          // on() returns an unsubscribe function
```

`scrollTo` targets: number (px), CSS selector, element, or `'top' | 'bottom' | 'start' | 'end' | 'left' | 'right'`. Options: `offset`, `lerp`, `duration`, `easing`, `immediate`, `lock`, `force` (scroll even when stopped), `onStart`, `onComplete`, `userData`.
Properties: `scroll`, `targetScroll`, `velocity`, `direction` (`1` down, `-1` up), `progress` (0 to 1), `limit`, `isScrolling` (`'smooth' | 'native' | false`), `isStopped`, `prefersReducedMotion`.

## Nested scroll and modals

```html
<div class="modal" data-lenis-prevent>long scrollable content</div>
```

Tested: wheel over a `data-lenis-prevent` box scrolls only the box; the page stays put. Variants: `data-lenis-prevent-wheel`, `-touch`, `-vertical`, `-horizontal`.
For a modal: call `lenis.stop()` on open and `lenis.start()` on close. Do not set `overflow: hidden` on `body` by hand.

## Snap

```js
import Lenis from 'lenis'
import Snap from 'lenis/snap'

const lenis = new Lenis({ autoRaf: true })
const snap = new Snap(lenis, { type: 'mandatory', debounce: 100 }) // 'proximity' (default) | 'mandatory' | 'lock'
snap.addElements(document.querySelectorAll('section'), { align: 'start' }) // 'start' | 'center' | 'end'
// snap.add(1000) returns a remove function; snap.next(), snap.previous(), snap.goTo(i)
```

Lenis ignores CSS `scroll-snap`; use `lenis/snap`. Tested: after a wheel event, `type: 'mandatory'` settles exactly on the next section top. Slideshow: `{ type: 'lock', distanceThreshold: '100%', debounce: 0 }`.

## Pitfalls

Verified with lenis 1.3.26, React 19, GSAP 3.15 and Chromium headless.

1. **No loop, no scroll.** See Rule 1. Most "Lenis breaks scrolling" reports come from here.
2. **React README "custom raf loop" example is broken.** It calls `requestAnimationFrame(update)` once and never again, so the page does not scroll. Tested. Re-schedule inside the callback:

```tsx
useEffect(() => {
  let id = 0
  const update = (time: number) => {
    lenisRef.current?.lenis?.raf(time)
    id = requestAnimationFrame(update)
  }
  id = requestAnimationFrame(update)
  return () => cancelAnimationFrame(id)
}, [])
```

3. **Missing `lenis.css`.** `stop()` still blocks the wheel, but keyboard (`PageDown`, arrows, space) and the scrollbar keep scrolling; with the CSS, `overflow: clip` blocks all of them (tested). `autoToggle` needs the CSS too.
4. **README says `direction` 1 = up. Source and test say the opposite:** `direction` is `Math.sign(velocity)`, so `1` = down, `-1` = up.
5. **Fixed header hides anchor targets.** The offset is added to the target, so use a negative value: `anchors: { offset: -headerHeight }`. Alternative: CSS `scroll-margin-top` on the targets or `scroll-padding-top` on `html`; `scrollTo` reads both.
6. **Iframes** (YouTube, maps) swallow wheel events; smooth scroll stops over them.
7. **Safari** caps at 60 fps, 30 fps in low power mode.
8. **Reduced motion works out of the box.** With `prefers-reduced-motion: reduce`, smoothing is off and `scrollTo` jumps instantly (tested). Do not set `respectReducedMotion: false`.
9. **SPA route changes.** Call `lenis.scrollTo(0, { immediate: true })` on navigation, or `destroy()` and recreate. `ReactLenis`/`VueLenis` destroy on unmount.
10. **Two instances on `window`** fight over the scroll. Use one root instance per page.

## Related skills

- `gsap-scrolltrigger`, `gsap-react`: scroll animations on top of Lenis.
- `react-bits`: some React Bits components already import `lenis`.
