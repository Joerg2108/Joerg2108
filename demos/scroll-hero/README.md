# Scroll Hero Demo

One-Pager für eine fiktive Sicherheitsfirma („Wachwerk“). Er zeigt Lenis, GSAP ScrollTrigger und React-Bits-Komponenten zusammen.
Stack: Vite 8, React 19, TypeScript, Tailwind CSS 4.

```bash
cd demos/scroll-hero
npm install
npm run dev       # http://localhost:5173
npm run build     # Typecheck + Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```

## Was wo steckt

| Datei | Inhalt |
|---|---|
| `src/SmoothScroll.tsx` | Eine Lenis-Instanz auf `<html>`, angetrieben vom GSAP-Ticker. `lenis.on('scroll', ScrollTrigger.update)` hält ScrollTrigger synchron. `anchors: true` macht Menü-Links weich. |
| `src/sections/Hero.tsx` | React Bits `Aurora` (WebGL-Hintergrund), `ShinyText`, `SplitText` |
| `src/sections/Intro.tsx` | React Bits `ScrollReveal`: Wörter blenden beim Scrollen ein |
| `src/sections/Services.tsx` | Eigene GSAP-Animation: Die Sektion wird gepinnt, vertikales Scrollen schiebt die Karten horizontal (`useGSAP` + `gsap.matchMedia`) |
| `src/sections/Stats.tsx` | React Bits `CountUp` in `SpotlightCard` |
| `src/sections/Contact.tsx` | „Nach oben“-Button mit `useLenis()` + `lenis.scrollTo(0)` |
| `src/useReducedMotion.ts` | Live-Abfrage von `prefers-reduced-motion` |
| `src/components/` | Unveränderte Kopien aus React Bits (TS + Tailwind), Ausnahme siehe unten |

## Verhalten

- **Fester Header:** `scroll-padding-top: 5rem` in `src/index.css`. Lenis liest den Wert bei Anker-Links, deshalb landet die Überschrift unter dem Header statt dahinter.
- **Reduced Motion:**
  - Lenis schaltet das Glätten selbst ab.
  - Die horizontale Sektion pinnt nicht, die Karten stehen untereinander.
  - Überschrift und Intro-Text erscheinen als normaler Text.
  - Die Zahlen stehen sofort.
  - Aurora bleibt stehen.
- **Unter 768 px Breite:** kein Pinning, die Karten stehen untereinander.
- **DSGVO:** nur System-Schriften und keine externen Bilder oder Fonts. Die Seite schickt keine Anfrage an Dritte.

## Geänderte React-Bits-Datei

`src/components/ScrollReveal/ScrollReveal.tsx` ist gepatcht.
Original: Der Cleanup ruft `ScrollTrigger.getAll().forEach(t => t.kill())` auf. Er löscht damit **alle** ScrollTrigger der Seite, auch das Pinning der Leistungs-Sektion. Das passiert, sobald `ScrollReveal` unmountet oder sich seine Props ändern.
Patch: Die Tweens laufen in `gsap.context()`. Der Cleanup ruft `ctx.revert()` auf und räumt nur die eigenen Trigger weg.

## Getestet

Chromium (headless), Produktions-Build und Dev-Server (React StrictMode):

- Keine Konsolenfehler.
- Pinning aktiv, der Track verschiebt sich horizontal.
- Ein Klick auf „Zahlen“ landet genau 80 px unter der Oberkante (Header-Höhe).
- „Nach oben“ scrollt zurück auf 0.
- Mit `prefers-reduced-motion: reduce`: kein Pinning, kein Split-Text, die Zahlen stehen sofort auf dem Endwert.
- Mobil (390 px): kein horizontaler Überlauf.

Hinweis zu `CountUp`: `duration` steuert eine Feder (Spring), keine feste Dauer. Der Endwert steht erst nach etwa dem 3- bis 4-fachen von `duration`.

## Lizenz

- Eigener Code: frei verwendbar.
- React-Bits-Komponenten: MIT + Commons Clause, siehe `src/components/LICENSE-react-bits.md`. Nutzung in eigenen Projekten erlaubt, Weiterverkauf als Komponenten-Bibliothek nicht.
- Lenis und GSAP: MIT bzw. kostenlose GSAP-Lizenz.
