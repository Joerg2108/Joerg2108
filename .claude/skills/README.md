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
