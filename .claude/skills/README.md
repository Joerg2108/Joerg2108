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

## HyperFrames

Videos aus HTML rendern mit [HyperFrames](https://github.com/heygen-com/hyperframes) von HeyGen: Erklärvideos, Titelkarten, Untertitel, Charts, Hochkant-Clips, Präsentationen.

- Installiert mit `npx skills add heygen-com/hyperframes -a claude-code -s '*' --copy -y` (Stand: Commit `a04b45a6db0d1f724be9cf1985c3b13657195f0d`). Dateien unverändert, per `diff` gegen das Original geprüft.
- `skills-lock.json` im Repo-Root hält Quelle und Hash pro Skill fest. Aktualisieren: `npx skills update -p`.
- Lizenz: Apache-2.0, Kopie liegt in jedem Ordner als `LICENSE`.
- Der Skill `reverse-any-video` ist im Original als intern markiert und wird vom Installer nicht mitgeliefert.

| Skill | Wofür |
|---|---|
| `hyperframes` | Einstieg: Render-Regeln, Arbeitsablauf, Projektaufbau |
| `hyperframes-cli` | `npx hyperframes init / check / preview / render …` |
| `hyperframes-registry` | ca. 450 fertige Bausteine: Übergänge, Titel, Untertitel, Charts, 3D |
| `media-use` | Musik, Soundeffekte, Bilder, Sprachausgabe, Farblooks – lokal oder über HeyGen |
| `slideshow` | Live-Präsentation mit Sprechernotizen (`hyperframes present`) |
| `figma` | Figma-Designs und Markenfarben ins Video holen |
| `remotion-to-hyperframes` | Bestehende Remotion-/Lottie-/Three.js-Animationen übernehmen |

Voraussetzungen laut Skill: Node.js und `npx hyperframes`; für Audio und Farblooks zusätzlich ffmpeg.
Optionale Cloud-Dienste brauchen eigene Keys (`HEYGEN_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`).
Die Skripte von `media-use` senden Nutzungsdaten an PostHog – abschalten mit `HYPERFRAMES_NO_TELEMETRY=1` oder `DO_NOT_TRACK=1`.
