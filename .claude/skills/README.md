# Projekt-Skills

Claude Code lädt alle Ordner hier automatisch als Skills, sobald eine Session in diesem Repo startet.
Die Skills sind unverändert aus den Original-Repos übernommen. Zum Aktualisieren die `SKILL.md` neu kopieren und den Commit unten nachtragen.

## caveman

Knapper Antwortmodus, Aufruf mit `/caveman`. Details: [`caveman/README.md`](./caveman/README.md).

## GSAP

Offizielle Skills von GreenSock für die Animations-Library [GSAP](https://gsap.com).
Sie greifen automatisch, sobald es um Animationen geht – kein Aufruf nötig.

- Quelle: [greensock/gsap-skills](https://github.com/greensock/gsap-skills), Ordner `skills/`
- Stand: Commit `aed9cfd3277740755f6bfc1155c7aa645403b760`
- Lizenz: MIT, Kopie liegt in jedem `gsap-*`-Ordner als `LICENSE`

| Skill | Wofür |
|---|---|
| `gsap-core` | `gsap.to()` / `from()` / `fromTo()`, Easing, Stagger, `gsap.matchMedia()` inkl. `prefers-reduced-motion` |
| `gsap-timeline` | `gsap.timeline()`, Position-Parameter, Verschachtelung, Abspielsteuerung |
| `gsap-scrolltrigger` | Scroll-Animationen, Pinning, Scrub, Parallax |
| `gsap-plugins` | Plugin-Registrierung, Flip, Draggable, SplitText, ScrollSmoother, MorphSVG, CustomEase … |
| `gsap-utils` | `gsap.utils`: `clamp`, `mapRange`, `random`, `snap`, `toArray`, `wrap` … |
| `gsap-react` | `useGSAP()`-Hook, Refs, Cleanup (React / Next.js) |
| `gsap-frameworks` | Vue, Nuxt, Svelte, SvelteKit: Lifecycle, Scoping, Cleanup |
| `gsap-performance` | Transforms statt Layout-Properties, Batching, ruckelfreie 60 fps |

Seit der Übernahme durch Webflow ist GSAP samt aller Plugins kostenlos, auch kommerziell – alles kommt aus dem öffentlichen npm-Paket `gsap`.

## vanta

Animierte 3D-/WebGL-Hintergründe mit [Vanta.js](https://www.vantajs.com) (Wellen, Vögel, Nebel, Netz, Globus …).
Greift automatisch, sobald du einen animierten Hero- oder Abschnitts-Hintergrund willst.

- **Eigener Skill** – Vanta hat kein offizielles Skill-Repo. Inhalt abgeleitet aus README und Quellcode von [tengbao/vanta](https://github.com/tengbao/vanta) (MIT), Commit `f8b351906688b56f0fc744e53bde81fc3c56f150`, Version 0.5.24.
- Getestet in Chromium (headless): alle 14 Effekte starten mit three.js r134 bzw. p5 1.1.9, `destroy()` räumt auf; npm-Import mit übergebenem `THREE` funktioniert. Ab three.js r159 bricht BIRDS.
- Das Projekt wird seit Januar 2023 nicht mehr gepflegt – deshalb pinnt der Skill die Versionen.

## threejs

3D-Grafik im Browser mit [three.js](https://threejs.org) (WebGL und WebGPU): Szenen, Modell-Viewer, Produktkonfiguratoren, Partikel, Shader.
Greift automatisch, sobald es um 3D im Browser geht oder three.js erwähnt wird.

- **Eigener Skill** – three.js hat kein offizielles Skill-Repo. Grundlage sind die offiziellen LLM-Regeln aus [`docs/llms.txt`](https://threejs.org/docs/llms.txt) von [mrdoob/three.js](https://github.com/mrdoob/three.js) (MIT), Commit `560f66427a4c3012e621fc9c6c1ec80b76a906ab`, Version 0.186.1 (r186).
- Getestet in Chromium (headless) mit three 0.186.1: WebGL-Szene mit OrbitControls, Schatten und Container-Resize; WebGPURenderer mit TSL (läuft headless über den WebGL2-Fallback); glTF laden inkl. Animation; Raycasting auf InstancedMesh; die Cleanup-Funktion gibt alle Geometrien und Texturen frei. npm-Importpfade (`three`, `three/webgpu`, `three/tsl`, `three/addons/…`) lösen im Bundler auf.
- Seit r183 ist `THREE.Clock` veraltet (`THREE.Timer` nutzen), seit r180 `RGBELoader` (`HDRLoader` nutzen) – der Skill berücksichtigt das.
- Verträgt sich nicht mit dem `vanta`-Skill in derselben Szene: Vanta braucht das alte globale three.js r134.
