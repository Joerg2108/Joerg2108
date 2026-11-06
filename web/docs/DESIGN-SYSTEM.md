# NOIR CHROMA – Designsystem der Website Fischer-Art

Version 1.0 · November 2026 · gilt für `web/` (Next.js 15, statischer Export, Netlify)

> **Idee:** Eine dunkle, luxuriöse Bühne, auf der die Farbe der Kunst leuchtet.
> Fischer-Arts Werke sind laut und bunt – die Oberfläche tritt zurück (Obsidian, Glas, Gold),
> damit die Bilder wie in einem abgedunkelten Ausstellungsraum unter Spots stehen.
> Das Erlebnis wirkt wie ein Film: Kamerafahrten beim Scrollen, Licht, Tiefe, Ruhe.

---

## 1. Informationsarchitektur (unverändert übernommen)

Struktur, Inhalte, Navigation und Geschäftslogik der bisherigen Website sind erhalten.
Neu ist die visuelle Identität und das Erlebnis.

```
/{de|en|zh}/                     Startseite (Kapitel 1–11, siehe unten)
├── werk/{slug}/                 9 Werk-Galerien (originale, skulpturen, portraets, new-art,
│                                events, reisen, friends, charity; kunst-am-bau → eigene Seite)
├── kunst-am-bau/                Referenzen, Kennzahlen, Projektgalerie
├── person/                      Biografie
├── vita/                        Zeitleiste
├── ausstellungen/               Zeitpunkte, Institutionen, Galerie
├── publikationen/               Bücher
├── aktuelles/                   News mit Video
├── impressum/ · datenschutz/    Rechtstexte (deutsch verbindlich)
└── nicht-gefunden/              404 je Sprache (über public/_redirects)
```

**Nutzerreise Startseite** (filmisches Storytelling in Kapiteln):

| # | Kapitel | Zweck | Konversion |
|---|---------|-------|-----------|
| 1 | Hero (Film + 3D) | „Wow“-Moment, Name, Positionierung | CTA „Werke entdecken“, „Anfrage stellen“ |
| 2 | Laufband | Disziplinen auf einen Blick | – |
| 3 | Über | Wer ist der Künstler? | – |
| 4 | Zitat Bach | Atempause, Tonalität | – |
| 5 | Werk (horizontale Kamerafahrt) | Portfolio-Einstieg | Klick in Galerie |
| 6 | In Zahlen (Fassaden-Film) | Vertrauen durch Fakten | Link Kunst am Bau |
| 7 | Leistungen + Atelier-Film | Angebot | Anfrage je Leistung (E-Mail mit Betreff) |
| 8 | Person | Persönlichkeit | Person, Vita |
| 9 | Zitat Twain | Atempause | – |
| 10 | Shop / Preise | Kalender | Bestellung per E-Mail |
| 11 | FAQ | Einwände abbauen | – |
| 12 | Kontakt | Abschluss | Formular (mailto), Telefon, Social |

**Navigation (vereinfacht):** 5 Hauptpunkte statt 9 → geringere kognitive Last.
`Werk ▾` (Mega-Menü mit 9 Bildkacheln) · `Künstler ▾` (Person, Vita, Ausstellungen, Publikationen) ·
`Kunst am Bau` · `Leistungen` · `Aktuelles` · Sprachumschalter · CTA `Kontakt`.
Mobil: Vollbild-Menü mit allen Zielen und großer Serifenschrift.

**Bewusst nicht umgesetzt:** Kundenstimmen. Die bisherige Website enthält keine echten
Testimonials – erfundene Bewertungen wären irreführend (und wettbewerbsrechtlich riskant).
Sobald echte, freigegebene Stimmen vorliegen, kann die Komponente ergänzt werden (siehe 7.12).

---

## 2. Design-Tokens

Alle Tokens liegen als CSS-Variablen in `app/globals.css` (`:root`) und sind über
`@theme inline` als Tailwind-Klassen verfügbar (`bg-bg`, `text-muted`, `text-gold` …).

### 2.1 Farben

| Rolle | Token | Wert | Tailwind | Kontrast auf `bg` |
|-------|-------|------|----------|-------------------|
| Hintergrund | `--nc-bg` | `#06060a` Obsidian | `bg-bg` | – |
| Hintergrund 2 | `--nc-bg-2` | `#0b0b12` Nachtlack | `bg-bg-2` | – |
| Oberfläche | `--nc-surface` | `#11121a` Graphit | `bg-surface` | – |
| Oberfläche 2 | `--nc-surface-2` | `#181925` Schiefer | `bg-surface-2` | – |
| Glas | `--nc-glass` | `rgb(255 255 255 / .045)` | `glass`, `glass-soft` | – |
| Glas-Kante | `--nc-glass-border` | `rgb(255 255 255 / .10)` | `border-line` | – |
| Text | `--nc-text` | `#f4f1ea` Porzellan | `text-text` | 17,9 : 1 |
| Text gedämpft | `--nc-text-muted` | `#a9a5af` Nebel | `text-muted` | 8,4 : 1 |
| Text leise | `--nc-text-dim` | `#8a8693` Rauch | `text-dim` | 5,7 : 1 |
| **Primär** | `--nc-primary` | `#ff5b3a` Glut | `text-primary` | 6,6 : 1 |
| **Sekundär** | `--nc-secondary` | `#8b7bff` Iris | `text-secondary` | 6,1 : 1 |
| **Akzent** | `--nc-accent` | `#3ee6c8` Lagune (Fokus) | `text-accent` | 12,9 : 1 |
| **Hervorhebung** | `--nc-highlight` | `#f2c66d` Blattgold | `text-gold` | 12,6 : 1 |
| Interaktiv | `--nc-interactive` | `#ff8a62` | – | – |
| Hover | `--nc-hover` | `#ff7148` | – | – |
| Leuchten | `--nc-glow` | `rgb(255 91 58 / .45)` | `shadow-[var(--nc-shadow-glow)]` | – |

Alle Text-Kombinationen erfüllen WCAG 2.2 AA (≥ 4,5 : 1), die meisten AAA.

**Verläufe**
- `--nc-gradient-aurora` Glut → Magenta → Iris → Lagune (115°) – Hero-Name, Fortschrittsbalken, Button-Füllung
- `--nc-gradient-metal` gebürstetes Gold – Zahlen, Rahmen, Ornamente (`text-metal`)
- `--nc-gradient-fade` transparent → `bg` – Übergänge unter Filmen

**Schatten**
- `--nc-shadow-float` schwebende Karten: weiche Tiefe + 1 px Lichtkante
- `--nc-shadow-glow` Leuchten von Primär-Buttons beim Hover

### 2.2 Typografie

| Rolle | Schrift | Datei | Einsatz |
|-------|---------|-------|---------|
| Display | **Bodoni Moda** (variabel, mit Kursive) | `@fontsource-variable/bodoni-moda` | Überschriften, Zitate, Zahlen |
| Text/UI | **Inter** (variabel) | `@fontsource-variable/inter` | Fließtext, Navigation, Formulare |
| Label | **JetBrains Mono** (variabel) | `@fontsource-variable/jetbrains-mono` | Kicker, Nummern, Metadaten |
| Chinesisch | Systemschriften: Noto Serif/Sans SC, PingFang, Songti, YaHei | – | automatischer Fallback |

Alle Schriften liegen auf dem eigenen Server (DSGVO: keine Verbindung zu Google Fonts).

| Stufe | Größe | Zeilenhöhe | Laufweite |
|-------|-------|-----------|-----------|
| Hero | `clamp(3.6rem, 12vw, 11rem)` | 0,86 | −0,03 em |
| H1 Seite | `clamp(3rem, 9vw, 8.5rem)` | 0,92 | −0,02 em |
| H2 Abschnitt | `clamp(2.4rem, 5.5vw, 4.8rem)` | 0,98 | −0,015 em |
| Zitat | `clamp(2rem, 4.6vw, 4.2rem)` kursiv | 1,12 | 0 |
| Lead | 1,25–1,5 rem | 1,6 | 0 |
| Body | 1–1,125 rem | 1,65 | 0 |
| Kicker | 0,72 rem Mono, VERSALIEN | – | 0,28 em |

Regeln: Überschriften in Bodoni, Hervorhebungen kursiv (Lateinisch). Auf Chinesisch wird
keine künstliche Kursive erzeugt (`html[lang^="zh"] .italic { font-style: normal }`).
Maximal ~65 Zeichen Zeilenlänge im Fließtext (`max-w-3xl`).

### 2.3 Abstände, Raster, Radien

- Container: `max-w-7xl` (80 rem), Rand 1,25 rem mobil / 2 rem ab `sm`
- Abschnittsabstand: `py-28` mobil, `py-40` Desktop – großzügiger Weißraum ist Absicht
- Radien: `--nc-radius-s` 10 px · `--nc-radius-m` 18 px (Bilder) · `--nc-radius-l` 28 px (Karten) · Pillen `rounded-full`
- Breakpoints (Tailwind): `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280

### 2.4 Bewegung (Motion-Tokens)

| Token | Kurve | Einsatz |
|-------|-------|---------|
| `--nc-ease-out` | `cubic-bezier(.16, 1, .3, 1)` (Expo-out) | Ankommen: Reveals, Hover, Karten |
| `--nc-ease-in-out` | `cubic-bezier(.83, 0, .17, 1)` (Quint) | Szenenwechsel, Orbs, Scroll-Hinweis |
| `--nc-ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | magnetische Buttons |
| `--nc-dur-1` | 180 ms | Farbwechsel, Fokus |
| `--nc-dur-2` | 320 ms | kleine Zustände |
| `--nc-dur-3` | 640 ms | Hover von Karten, Menüs |
| `--nc-dur-4` | 1 200 ms | Reveals beim Scrollen |

Gestaffelte Auftritte: `--i` × 90 ms (Elemente), `--w` × 55 ms (Wörter).

---

## 3. Bewegungsspezifikation

| Element | Auslöser | Bewegung | Dauer / Kurve |
|---------|----------|----------|---------------|
| Seiten-Scroll | Mausrad/Touchpad | Lenis-Trägheit, synchron mit GSAP | 1,15 s, Quart-out |
| Überschriften (`SplitWords`) | 12 % sichtbar | Wörter steigen aus Maske (110 % → 0, 4° → 0°) | 1,3 s expo-out, 55 ms Versatz |
| Blöcke (`data-reveal`) | 12 % sichtbar | 28 px hoch, Blur 6 px → 0, Deckkraft 0 → 1 | 1,2 s expo-out |
| `data-reveal="scale"` | 12 % sichtbar | Skalierung 0,94 → 1 | 1,2 s |
| Werk-Karten (≥ 1024 px) | Scroll | Abschnitt pinnt, Spur fährt horizontal; Bilder ±6 % Parallaxe | scrub 0,8 |
| Karten (`Tilt`) | Mausbewegung | 3D-Neigung max. 5–8°, Lichtkegel folgt dem Zeiger | 500 ms expo-out |
| Buttons (`Magnetic`) | Mausbewegung | Zug zum Zeiger (28 %) | 500 ms Spring |
| Primär-Button | Hover | Aurora-Füllung fährt von unten ein, Glow | 500 ms |
| Kennzahlen (`Counter`) | sichtbar | 0 → Zielwert | 1,8 s Quart-out |
| Zeitleiste | Scroll | Lichtstrahl füllt sich, Punkte glühen auf | rAF |
| Fortschrittsbalken | Scroll | `scaleX` 0 → 1, Aurora-Verlauf | rAF |
| Hero-3D | Zeit/Maus/Scroll | Rotation, Schweben, Kamera folgt Maus mit Trägheit (4,5 %), Rückfahrt beim Scrollen | 60 FPS |
| Lightbox-Bild | Öffnen | schwebt 14 px auf/ab | 8 s |
| Laufband | Endlos | linear | 40 s |

**60 FPS:** Animiert werden nur `transform`, `opacity` und `filter`. Scroll-Handler sind passiv
und per `requestAnimationFrame` gedrosselt. 3D rendert nur, solange es sichtbar ist.

**Barrierefreiheit:** Bei `prefers-reduced-motion: reduce` gibt es kein Smooth Scrolling,
keine Reveals (alles sofort sichtbar), keine Endlos-Animationen, ein stehendes 3D-Bild und
nur Video-Poster statt Filmen.

---

## 4. Interaktive 3D-Konzepte

### 4.1 „Chroma Core“ (umgesetzt, Hero) – `components/hero-scene.tsx`
- Glas-Knoten (`MeshPhysicalMaterial`: Transmission, Irisieren, Klarlack) als Sinnbild für
  Fischer-Arts ineinander verschlungene Figuren
- zwei Ringe aus gebürstetem Gold, 6–11 schwebende Glassplitter, 500–1 600 Farbpigment-Partikel
  in der Markenpalette (additives Leuchten)
- Studio-Umgebungslicht (`RoomEnvironment`, kein HDR-Download) + zwei kreisende Bühnenlichter (Glut, Iris)
- Interaktion: Kamera folgt der Maus mit Trägheit; beim Scrollen fährt die Kamera zurück, der Knoten dreht und verkleinert sich
- Performance: three.js wird erst geladen, wenn der Browser untätig ist (`requestIdleCallback`) –
  der erste Seitenaufbau (LCP) bleibt frei. DPR ≤ 1,75. Unter 768 px ohne Transmissions-Pass und
  mit weniger Partikeln. Stopp bei unsichtbarem Tab oder Canvas. Ohne WebGL bleiben Film und Verlauf sichtbar.

### 4.2 Weitere 3D-Ebenen (umgesetzt, ohne WebGL)
- **Schwebende Karten:** CSS-3D-Neigung mit Lichtkegel (`Tilt`) auf allen Karten und Galeriebildern
- **Parallax-Tiefe:** Werk-Karten bewegen ihr Bild gegenläufig zur Spur
- **Volumetrisches Licht:** unscharfe Farb-Orbs (`.nc-orb`) hinter Seitenköpfen und Abschnitten
- **Filmkorn:** feines SVG-Rauschen über allem (`.nc-grain`)

### 4.3 Ausbaustufen (Konzept, nicht umgesetzt)
1. **Galerie-Raum:** WebGL-Korridor, in dem Werke als beleuchtete Leinwände hängen; Scroll = Kamerafahrt (three.js, Instancing, KTX2-Texturen).
2. **Skulptur in 3D:** fotogrammetrisches Modell einer Stahlfigur (GLB, Draco-komprimiert, < 2 MB) zum Drehen auf der Skulpturen-Seite.
3. **Fassaden-Morph:** Hochhaus-Gitter, das beim Scrollen von Grau in die Fassadenbemalung „umgefärbt“ wird (Shader-Übergang zwischen zwei Texturen).

---

## 5. Videointegration

### 5.1 Umgesetzt
Alle Filme wurden aus den echten Werkfotos erzeugt (Ken-Burns-Kamerafahrten mit Überblendung,
leichte Farbkorrektur) – keine Fremd- oder KI-Bilder. Skript: siehe 9.3.

| Film | Inhalt | Einsatz | Dateien | Größe |
|------|--------|---------|---------|-------|
| `hero` | 6 Originale (Pop-Art-Motive), 21 s Loop | Hero-Hintergrund, 40 % Deckkraft | `-1080.webm` (VP9), `-1080.mp4`, `-540.mp4`, `-poster.webp` | 2,4 MB / 4,0 MB / 1,5 MB / 150 KB |
| `fassaden` | 6 Fassaden „Kunst am Bau“, 21 s Loop | Kennzahlen-Abschnitt, Kopf Kunst am Bau | wie oben | 2,1 MB / 3,4 MB / 1,1 MB / 90 KB |
| `atelier-loop` | 12 s aus dem Frühlingssalon-Video, stumm | Leistungen (Hochformat-Karte) | `.mp4`, `-poster.webp` | 1,2 MB |
| `fruehlingssalon-2026` | Original mit Ton | Aktuelles (mit Bedienelementen) | `.mp4` | 3,5 MB |

**Regeln (Komponente `CinemaVideo`):** stumm, Schleife, `playsInline`, `preload="none"`;
Laden erst 200 px vor dem Sichtbereich; Pause außerhalb des Sichtbereichs; Handys erhalten
540p, Desktop WebM/MP4 1080p; bei `prefers-reduced-motion` oder „Datensparmodus“ nur das
Poster. Filme liegen immer unter einer Vignette – sie verstärken die Stimmung, lenken nie vom
Text ab. Keine Steuerelemente, `aria-hidden`.

### 5.2 Drehplan für echte Filmaufnahmen (empfohlen)
| Motiv | Einsatz | Technik |
|-------|---------|---------|
| Drohnenflug an einer Fassade (z. B. Drei Türme Leipzig) | Hero oder Kunst am Bau | 4K, 24 fps, langsame Seitwärtsfahrt, Abendlicht |
| Makro: Pinsel, Farbe, Leinwandstruktur | Originale, Übergänge | 100 mm Makro, 120 fps (Zeitlupe) |
| Atelier-Rundgang mit Gimbal | Leistungen, Events | 4K, warmes Kunstlicht, kein Ton nötig |
| Stahlfigur im Gegenlicht, Drehteller | Skulpturen | Schwarzer Hintergrund, Kantenlicht |
| Markenfilm 60–90 s mit Ton | eigene Seite / Social | professionelle Produktion |

Austausch: Dateien nach `public/media/` legen (gleiche Namenskonvention), ggf. `film={{ base: "/media/<name>" }}` setzen.
Encoding-Ziel: Loops ≤ 3 MB (WebM VP9 CRF 40–46, H.264 CRF 28–32, 24 fps, ohne Ton).

---

## 6. Mikrointeraktionen

| Element | Ruhe | Hover / Fokus | Aktiv |
|---------|------|---------------|-------|
| Primär-Button | Porzellan, dunkler Text | Aurora fährt ein, Text weiß, Glow, Pfeil +4 px, magnetisch | – |
| Ghost-Button | Glas, Kante 10 % | Kante 30 %, hebt sich 2 px | – |
| Navigation | Nebel-Grau | Porzellan; Mega-Menü öffnet mit 160 ms Schließ-Verzögerung | Pfeil dreht 180° |
| Mega-Kachel | Bild 45 % | Bild 80 %, Zoom 1,1 | – |
| Karte | Glas, Neigung 0 | 3D-Neigung, Lichtkegel folgt Maus | – |
| Galeriebild | Verlauf 70 % | Zoom 1,05, Lupen-Icon blendet ein | Lightbox |
| Link (Fließtext) | – | Unterstrich wächst von links | – |
| Formularfeld | Linie 10 % | Linie Glut | – |
| FAQ | Plus | Frage wird Gold | Plus dreht 45° zum Kreuz, Glut-Ring, Höhe animiert |
| Kennzahl | 0 | zählt hoch | – |
| Fokus (Tastatur) | – | 2 px Lagune-Kontur, 3 px Abstand | – |

---

## 7. Komponentenbibliothek

| # | Komponente | Datei | Notizen |
|---|-----------|-------|---------|
| 7.1 | Navigation + Mega-Menü + Mobilmenü | `components/site-header.tsx` | Glas-Pille, schwebend; `inert` für geschlossene Panels; Escape schließt |
| 7.2 | Sprachumschalter | `site-header.tsx` (`LanguageSwitch`) | gleiche Seite in anderer Sprache, `hreflang` |
| 7.3 | Hero | `app/[locale]/page.tsx` + `hero-scene.tsx` + `cinema-video.tsx` | 3 Ebenen: Film, Licht, 3D; schwebende News-Karte |
| 7.4 | Seitenkopf | `components/page-hero.tsx` (`PageHero`) | Orbs oder Film, Kicker, Maskentitel |
| 7.5 | Abschnittstitel | `page-hero.tsx` (`SectionTitle`) | Kicker + Titel + Lead, links/zentriert |
| 7.6 | Buttons | `page-hero.tsx` (`ButtonLink`), `motion.tsx` (`Magnetic`) | primary / ghost |
| 7.7 | Feature-Karten | Startseite (Über, Leistungen) | `glass` + `Tilt` |
| 7.8 | Statistiken | Startseite, Kunst am Bau | `Counter`, Metall-Zahlen |
| 7.9 | Preise | Startseite (Shop) | Kalender-Karten mit Preis, Bestellung per E-Mail |
| 7.10 | Zeitleiste | `components/timeline.tsx` | Lichtstrahl, wechselseitig ab `sm` |
| 7.11 | Portfolio | `components/horizontal-works.tsx` | gepinnte Kamerafahrt / Snap-Karussell |
| 7.12 | Galerie + Lightbox | `components/gallery.tsx` | Masonry, Tastatur (←/→/Esc), Fokus-Rückgabe |
| 7.13 | Kundenstimmen | – | bewusst nicht umgesetzt (keine echten Stimmen vorhanden) |
| 7.14 | FAQ | `components/faq.tsx` | ARIA-Accordion |
| 7.15 | Kontakt | `components/contact-section.tsx` | mailto-Formular, keine Datenübertragung |
| 7.16 | Fußzeile | `components/site-footer.tsx` → `ui/wild-hunt-footer.tsx` | Palette Obsidian/Porzellan |
| 7.17 | Video | `components/cinema-video.tsx`, `ambient-clip.tsx` | siehe 5 |
| 7.18 | Motion-Primitive | `components/motion.tsx` | `SmoothScroll`, `RevealObserver`, `SplitWords`, `Tilt`, `Magnetic`, `Counter`, `ScrollProgress` |

---

## 8. Responsives Verhalten

| Bereich | Mobil (< 768) | Tablet (768–1023) | Laptop/Desktop (≥ 1024) |
|---------|---------------|-------------------|------------------------|
| Navigation | Vollbild-Menü | Vollbild-Menü | Pille + Mega-Menüs |
| Hero | Text unten, 3D oben, 540p-Film, weniger Partikel | wie mobil, 1080p | Text links, 3D rechts |
| Werk | Snap-Karussell (Wischen) | Snap-Karussell | gepinnte horizontale Fahrt |
| Karten | 1 Spalte | 2 Spalten | 2–4 Spalten |
| Neigung/Magnet | aus (Touch) | aus (Touch) | an |
| Zeitleiste | Jahr links, Text rechts | wechselseitig | wechselseitig |

---

## 9. Hinweise für die Entwickler-Übergabe

### 9.1 Technik
- Next.js 15 (App Router, `output: "export"`), React 19, TypeScript, Tailwind CSS 4, shadcn-Struktur
- three.js 0.187 (nur Hero, dynamisch geladen), GSAP 3 + ScrollTrigger, Lenis
- Inhalte: `lib/content/{de,en,zh}.ts`, `lib/works.ts`, `lib/works-i18n.ts`, UI-Texte `lib/i18n.ts`

### 9.2 Leistung (Core Web Vitals)
- Statisches HTML für alle 60 Seiten → schnelle TTFB über Netlify-CDN
- LCP: Hero-Text ist HTML, Film und 3D starten erst danach (Poster 150 KB, 3D im Leerlauf)
- CLS: alle Bilder mit Breite/Höhe; Schriften selbst gehostet mit `font-display: swap`
- INP: keine schweren Handler; Scroll passiv; 3D pausiert außerhalb des Sichtbereichs
- First Load JS Startseite ≈ 144 KB; three.js (~100 KB gzip) lädt nachträglich
- Cache: `/_next/static/*` und `/images/*` ein Jahr `immutable` (`netlify.toml`)
- Lazy Loading für Bilder (`loading="lazy"`) und Filme (IntersectionObserver)

### 9.3 Medien neu erzeugen
- Bilder: `node scripts/import-images.mjs <originale> <gallery.json>` (WebP, ≤ 1800 px)
- Filme: ffmpeg-Rezept – je Motiv 4,5 s `zoompan` (1080p, 30 fps), 1 s `xfade`, Loop durch
  Rückblende auf das erste Motiv; Ausgabe H.264 CRF 31 / 24 fps, VP9 CRF 46, 540p CRF 32, Poster als WebP.

### 9.4 Barrierefreiheit (Prüfliste)
- Semantische Landmarken (`header`, `nav`, `main`, `section` mit `aria-labelledby`, `footer`)
- Überschriften-Reihenfolge h1 → h2 → h3; Maskentitel enthalten den Klartext für Screenreader
- Tastatur: alle Menüs, Lightbox und FAQ bedienbar; sichtbarer Fokus; „Zum Inhalt springen“
- Dekoratives (3D, Filme, Orbs, Laufband) ist `aria-hidden`
- Kontraste ≥ 4,5 : 1 (siehe 2.1); `prefers-reduced-motion` vollständig berücksichtigt
- `lang` je Sprache, deutsche Rechtstexte mit `lang="de"` markiert

### 9.5 Offene Punkte
- Echte Filmaufnahmen (Drehplan 5.2) ersetzen die Ken-Burns-Loops
- Kundenstimmen nur mit schriftlicher Freigabe der zitierten Personen
- Übersetzungen EN/ZH muttersprachlich prüfen lassen
- Impressum/Datenschutz rechtlich prüfen (Hosting-Anbieter Netlify ergänzen)
