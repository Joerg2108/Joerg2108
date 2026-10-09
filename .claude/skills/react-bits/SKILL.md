---
name: react-bits
description: React Bits skill for 214 free animated React components (reactbits.dev) - text animations (SplitText, BlurText, ShinyText, CountUp), animations (ClickSpark, Magnet, AnimatedContent), UI components (Dock, Carousel, Masonry, PillNav), micro interactions and WebGL backgrounds (Aurora, Silk, Particles, LightRays, Dither). Use when the user mentions React Bits or reactbits.dev, asks for an animated text effect, hover/scroll animation, animated nav or gallery, or an animated hero background in React or Next.js. Covers variant choice (JS/TS x CSS/Tailwind), install via shadcn or jsrepo CLI, required props, dependencies and known pitfalls.
license: MIT
---

# React Bits

React Bits is a copy-in library: the CLI copies the component source into the project. There is no `react-bits` npm package to import from.
Source: https://github.com/DavidHDev/react-bits (MIT + Commons Clause). Free for personal and commercial projects. Do not resell the components as a component library.
Docs with live demo and props table: https://reactbits.dev
Full catalog with dependencies and required props: [`references/catalog.md`](references/catalog.md). Read it to pick a component.

## Categories

| Category | Count | Examples |
|---|---|---|
| Text Animations | 33 | `SplitText`, `BlurText`, `ShinyText`, `DecryptedText`, `CountUp`, `RotatingText`, `GradientText` |
| Animations | 41 | `AnimatedContent`, `FadeContent`, `ClickSpark`, `Magnet`, `LogoLoop`, `SplashCursor`, `PixelTransition` |
| Components | 47 | `Dock`, `Carousel`, `Masonry`, `PillNav`, `CardNav`, `Stepper`, `TiltedCard`, `CircularGallery` |
| Micro | 34 | small interactions: switches, buttons, loaders, tooltips (`RubberSegment`, `WarmTooltip`) |
| Backgrounds | 59 | `Aurora`, `Silk`, `Particles`, `LightRays`, `Threads`, `Dither`, `Iridescence`, `Galaxy` |

## Pick the variant

Every component has 4 variants. The suffix goes into the install name.

| Suffix | Language | Styling | Pick when |
|---|---|---|---|
| `TS-TW` | TypeScript | Tailwind | project has `tsconfig.json` and Tailwind |
| `TS-CSS` | TypeScript | plain CSS file | TypeScript, no Tailwind |
| `JS-TW` | JavaScript | Tailwind | JavaScript and Tailwind |
| `JS-CSS` | JavaScript | plain CSS file | JavaScript, no Tailwind |

Check the project first: `tsconfig.json` means TS. `tailwindcss` in `package.json` means TW. The Tailwind variants are written against Tailwind v4 (the repo uses `tailwindcss@^4`).

## Install with the CLI

Both CLIs read the same registry: `https://reactbits.dev/r/<Name>-<Variant>.json`. Both install the npm dependencies listed in that file.

```bash
# shadcn (needs components.json, run `npx shadcn@latest init` first)
npx shadcn@latest add @react-bits/SplitText-TS-TW

# jsrepo (no shadcn setup needed)
npx jsrepo@latest add https://reactbits.dev/r/SplitText-TS-TW
```

If shadcn does not know the `@react-bits` namespace, add the registry to `components.json`:

```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

Replace `npx` with `pnpm dlx`, `yarn` or `bun x --bun` for other package managers. Read the CLI output for the target path; then import from that path.

## Install by hand

Copy the folder from the repo and install the dependencies from [`references/catalog.md`](references/catalog.md).

| Variant | Repo path |
|---|---|
| `JS-CSS` | `src/content/<Category>/<Name>/` |
| `JS-TW` | `src/tailwind/<Category>/<Name>/` |
| `TS-CSS` | `src/ts-default/<Category>/<Name>/` |
| `TS-TW` | `src/ts-tailwind/<Category>/<Name>/` |

`<Category>` is one of `TextAnimations`, `Animations`, `Components`, `Micro`, `Backgrounds`. CSS variants ship `<Name>.css` next to the component; keep both files in the same folder.

## Usage

All components except `GridScan` use a default export. Props are typed in the source file (`<Name>Props`). Read the copied source for the full prop list and defaults; the source is the truth, not memory.

```tsx
import SplitText from '@/components/SplitText/SplitText';
import Aurora from '@/components/Aurora/Aurora';

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background fills its parent: the parent needs a real height */}
      <div className="absolute inset-0 -z-10">
        <Aurora colorStops={['#3A29FF', '#FF94B4', '#FF3232']} amplitude={1} blend={0.5} />
      </div>

      <SplitText
        text="Hello, World!"
        tag="h1"
        className="text-6xl font-bold"
        delay={50}
        duration={1.25}
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
      />
    </section>
  );
}
```

Next.js App Router: every component file starts with `'use client'`. Import it from a Server Component like any client component.

## Pitfalls

Verified against commit `b2098591` (React 19, Vite 8, Tailwind 4, Chromium headless). All 214 TS-TW components build with `vite build` and were rendered one by one; the failures are the cases listed here. Exception: `Ballpit` logged a shader validation error under software WebGL (SwiftShader); it was not tested on a real GPU. All TS components pass `tsc --strict` except the cases listed here.

1. **Required props crash the render.** Without them the component throws, for example `Cannot read properties of undefined (reading 'map')`. Examples: `Masonry`, `GooeyNav`, `GlassIcons`, `RubberSegment` need `items`; `PillNav` and `CardNav` need `logo` and `items`; `LogoLoop` needs `logos`; `CountUp` needs `to`; `Counter` needs `value`; `RotatingText` and `ScrollVelocity` need `texts`; `VariableProximity` needs `label`, `fromFontVariationSettings`, `toFontVariationSettings` and `containerRef`. The catalog lists required props per component.
2. **Backgrounds take the size of the parent.** Root element is `w-full h-full` (Aurora, Particles, Silk ...). A parent without height gives a 0 px canvas and nothing shows.
3. **`GridScan` is a named export.** Use `import { GridScan } from './GridScan'`. A default import gives React error #306.
4. **`FluidGlass` needs 3D model files.** It loads `/assets/3d/lens.glb`, `/assets/3d/cube.glb`, `/assets/3d/bar.glb`. The registry does not ship them. Copy them from `public/assets/3d/` in the repo into the project's `public/assets/3d/`.
5. **Demo defaults load remote images.** 16 components default to images from `picsum.photos`, `images.unsplash.com` or `i.pravatar.cc`: `AccordionGallery`, `ChromaGrid`, `CircularCarousel`, `CircularGallery`, `DecayCard`, `DepthCarousel`, `DitherVeil`, `DomeGallery`, `DriftWall`, `FlexCarousel`, `FluidGlass`, `HalftoneReveal`, `InfiniteMenu`, `MorphSlider`, `RippleDistortion`, `Stack`. `ModelViewer` loads its HDR environment from a remote drei preset. Pass your own images. Under GDPR, every remote request sends the visitor IP to a third party.
6. **Google Fonts from the CDN.** `ASCIIText`, `TextPressure` and `CircularGallery` load fonts from `fonts.googleapis.com`. For GDPR, self-host the font and remove the remote URL.
7. **Camera and microphone.** `GridScan` and `ReflectiveCard` call the webcam; `GridScan` also loads face-api models from `cdn.jsdelivr.net` (`modelsPath` prop). `VoicePill` uses the microphone. All need HTTPS and a permission prompt.
8. **Dependency versions.** `Dither` fails `tsc` with `@react-three/postprocessing@3.1.x` (`Property 'colorNum' does not exist`); pin `@react-three/postprocessing@3.0.4`. `ShapeWaves` needs `vgpu@^0.3`; `vgpu@0.5` breaks the types.
9. **`ElasticSlider` CSS variants need Chakra UI.** `JS-CSS` and `TS-CSS` import `@chakra-ui/react` (plus `@emotion/react` as its peer). The Tailwind variants do not.
10. **`Shuffle` TS-CSS fails `tsc` on React 19 types** with `Cannot find namespace 'JSX'`. Change `keyof JSX.IntrinsicElements` to `keyof React.JSX.IntrinsicElements`, or use the `TS-TW` variant.
11. **WebGL context limit.** 53 components use `ogl` and 26 use `three`. Each one opens its own WebGL context. Browsers drop the oldest context at around 16. Use 1 or 2 WebGL backgrounds per page.
12. **Reduced motion.** Only 73 of 215 component files check `prefers-reduced-motion`. For the others, gate the animation yourself:

```tsx
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
return reduce ? <h1 className="text-6xl">Hello</h1> : <SplitText text="Hello" tag="h1" />;
```

## Dependencies

| Package | Components | Note |
|---|---|---|
| `ogl` | 53 | small WebGL library, most backgrounds |
| `motion` | 37 | Motion (formerly Framer Motion) |
| `gsap` (+ `@gsap/react`) | 35 | free incl. all plugins; see the `gsap-*` skills |
| `three` | 26 | three.js, some with `@react-three/fiber` / `drei` |
| `@hugeicons/react` | 15 | icons in Micro components |

## Related skills

- `gsap-react`, `gsap-scrolltrigger`: write custom scroll animations around React Bits components.
- `vanta`: alternative WebGL backgrounds without React.
- React Bits Pro (pro.reactbits.dev) is a separate paid product. Mention it only when the user asks.
