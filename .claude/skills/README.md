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

## taste-skill (13 Skills)

Design-Regeln gegen „AI-Slop“-Frontends: Layout, Typografie, Farbe, Motion und Bildführung. Dazu kommen Skills für Referenzbilder (Web, Mobile, Brand-Kit).

- Quelle: [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), Ordner `skills/`
- Stand: Commit `717446e07a78d4e6d7918b1fde1a263378eebac9`
- Lizenz: MIT, Kopie liegt in jedem Ordner als `LICENSE`
- Unverändert übernommen. Die Ordner heißen wie das `name:`-Feld (Install-Name), nicht wie die Upstream-Ordner.

| Skill (Ordner hier) | Upstream-Ordner | Wofür |
|---|---|---|
| `design-taste-frontend` | `taste-skill` | **Standard (v2, experimentell).** Landingpages, Portfolios, Redesigns. Liest das Briefing, setzt drei Regler (VARIANCE / MOTION / DENSITY) und hat einen langen Pre-Flight-Check |
| `design-taste-frontend-v1` | `taste-skill-v1` | Alte v1, nur für exakt gleiches Verhalten |
| `gpt-taste` | `gpt-tasteskill` | Strengere Variante für GPT/Codex, GSAP-lastig |
| `redesign-existing-projects` | `redesign-skill` | Bestehende Seite erst prüfen, dann gezielt verbessern |
| `high-end-visual-design` | `soft-skill` | Ruhiger „Agentur“-Look, weiche Schatten, Double-Bezel-Karten |
| `minimalist-ui` | `minimalist-skill` | Editorial-Minimalismus (Notion/Linear) |
| `industrial-brutalist-ui` | `brutalist-skill` | Swiss/Terminal-Brutalismus |
| `stitch-design-taste` | `stitch-skill` | `DESIGN.md` für Google Stitch, Vorlage liegt bei |
| `full-output-enforcement` | `output-skill` | Verbietet Platzhalter wie `// ...` und gekürzte Ausgaben |
| `image-to-code` | `image-to-code-skill` | Erst Bilder generieren, dann analysieren, dann coden |
| `imagegen-frontend-web` | `imagegen-frontend-web` | Website-Referenzbilder, je Sektion ein Bild |
| `imagegen-frontend-mobile` | `imagegen-frontend-mobile` | App-Screens im Phone-Mockup |
| `brandkit` | `brandkit` | Brand-Kit-Board: Logo, Farben, Schrift, Anwendungen |

**Vorsicht beim Einsatz:**

- **Bild-Generierung kostet Credits.** `design-taste-frontend` (Abschnitt 4.8) schreibt vor: Ist ein Bild-Tool verfügbar, *muss* es genutzt werden. `image-to-code` und `imagegen-*` erzeugen ein Bild pro Sektion, bei einer Landingpage standardmäßig 6–8. In diesem Account ist ein Higgsfield-Connector mit `generate_image` verbunden. Vor Bild-Jobs immer nach Anzahl und Budget fragen.
- **DSGVO.** Mehrere Skills nehmen als Platzhalter `picsum.photos`, Logos von `cdn.simpleicons.org` oder Unsplash. Jede dieser Anfragen schickt die IP-Adresse der Besucher an Dritte. Für echte Seiten: Bilder und Logos selbst hosten, Schriften selbst hosten (das verlangt `design-taste-frontend` ohnehin).
- **Widersprüche zwischen den Skills.**
  - `stitch-design-taste` empfiehlt `Fraunces` und `Instrument Serif`. `design-taste-frontend` verbietet genau diese beiden als Standard.
  - `high-end-visual-design` will über jeder Überschrift ein Eyebrow-Label. `design-taste-frontend` erlaubt höchstens eins pro drei Sektionen.
  - Bei Konflikt gilt der Skill, den du ausdrücklich aufrufst (`/name`). Sonst gilt `design-taste-frontend`.
- **Mehrere Stil-Skills greifen gleichzeitig.** v1, v2, `gpt-taste` und die drei Stil-Skills beschreiben sich alle als Frontend-Design-Skill. Für eine feste Richtung den Skill direkt aufrufen, z. B. `/minimalist-ui`.
- **`full-output-enforcement` gegen `caveman`.** Der eine verlangt „nicht auf Kürze optimieren“. Er betrifft aber nur Code und Deliverables, nicht den Chat-Stil.
- `design-taste-frontend` Abschnitt 12 verweist auf einen Ordner `blocks/`. Den gibt es upstream noch nicht.

## web-design-guidelines

Prüft UI-Code gegen die [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines): Barrierefreiheit, Fokus, Formulare, Animation, Typografie, Performance, Dark Mode, i18n, Hydration. Die Ausgabe sind knappe Funde im Format `datei:zeile`.
Greift bei „review my UI“, „check accessibility“, „audit design“. Direkt aufrufen mit `/web-design-guidelines src/**/*.tsx`.

- Quelle: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/web-design-guidelines/SKILL.md`, Commit `063bee94c3f4df8453406c830b0a7df0f2860278`. `SKILL.md` ist unverändert übernommen.
- Lizenz: MIT. Der Repo-README von agent-skills nennt MIT, dort liegt aber keine Lizenzdatei. `LICENSE` stammt aus dem Guidelines-Repo (Copyright Vercel Labs).
- **Lädt die Regeln bei jedem Aufruf live** von `raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`. Ändert Vercel die Datei, ändert sich das Verhalten des Skills, ohne Commit hier. Geprüft am 10.10.2026: erreichbar und unbedenklich.
- `references/command.md` ist eine Kopie dieser Regeln vom Commit `434b7f91364665f2f733b310ec54809bf8f37937`. Ist die URL nicht erreichbar oder fragwürdig verändert, wird diese Kopie genommen. Mit `diff` gegen die Live-Version lässt sich prüfen, was sich geändert hat.
- **Achtung bei deutschen Seiten:** Die Copy-Regeln sind auf Englisch ausgelegt („Title Case for headings“, Chicago Style, `…` am Ende von Platzhaltern). Für deutsche Texte gilt die normale deutsche Groß- und Kleinschreibung. Diese Funde ignorieren.
