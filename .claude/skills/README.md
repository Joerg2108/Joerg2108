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

## react-bits

214 kostenlose animierte React-Komponenten von [React Bits](https://reactbits.dev): Text-Animationen, Animationen, UI-Komponenten, Micro-Interactions und WebGL-Hintergründe.
Greift automatisch, sobald du animierten Text, Hover-/Scroll-Effekte, eine animierte Navigation/Galerie oder einen Hero-Hintergrund in React oder Next.js willst.

- **Eigener Skill** – React Bits hat kein offizielles Skill-Repo. Inhalt abgeleitet aus `public/llms.txt`, Registry-Dateien und Quellcode von [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) (MIT + Commons Clause), Commit `b2098591ad5b3489eff65ca9e5b9f9bdf2de29c3`.
- `references/catalog.md`: alle 214 Komponenten mit Beschreibung, npm-Abhängigkeiten und Pflicht-Props – generiert aus dem Quellcode.
- Getestet mit React 19, Vite 8, Tailwind 4 und Chromium (headless): alle TS-Tailwind-Komponenten bauen und rendern; `tsc --strict` über alle TS-Varianten. Gefundene Stolperfallen (Pflicht-Props, Named Export bei `GridScan`, fehlende `.glb`-Dateien, Versions-Pins, DSGVO-relevante Remote-Bilder/Google Fonts) stehen im Skill.
- Die CLI-Installation (`shadcn` / `jsrepo`) ist nicht live getestet – `reactbits.dev` war aus der Sandbox nicht erreichbar. Befehle und Registry-Format stammen aus dem Repo-Quellcode.

## lenis

Smooth Scroll mit [Lenis](https://github.com/darkroomengineering/lenis) für Vanilla JS, React/Next.js, Vue/Nuxt – inkl. GSAP-ScrollTrigger-Sync, Snap, Modals und verschachteltem Scroll.
Greift automatisch, sobald du Smooth Scroll, Momentum-Scroll oder weiche Anker-Links willst.

- **Eigener Skill** – Lenis hat kein offizielles Skill-Repo. Inhalt abgeleitet aus READMEs und Quellcode von [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) (MIT), Commit `bc152f90d7c9b04ef372718350e2f616f3c706b2`, Version 1.3.26.
- Getestet in Chromium (headless) mit React 19 und GSAP 3.15: `autoRaf`, eigener Loop, GSAP-Ticker + ScrollTrigger (Vanilla und React), `ReactLenis root` + `useLenis`, `data-lenis-prevent`, `stop()` mit/ohne CSS, `scrollTo` mit `prefers-reduced-motion`, `lenis/snap` (`mandatory`).
- Zwei Fehler in der offiziellen Doku gefunden und im Skill korrigiert: Das „Custom raf loop“-Beispiel im React-README läuft nur einen Frame (Seite scrollt nicht), und `direction` ist vertauscht (`1` = runter, nicht hoch).
