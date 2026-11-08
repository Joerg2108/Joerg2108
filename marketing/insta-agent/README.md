# Instagram-Agent – hochwertige Posts für die Webseiten-Erstellung

Ein KI-Agent, der fertige Instagram-Posts zu deinem Angebot **hochwertige Webseiten** erstellt:
Folien als PNG (1080×1350, 4:5-Hochformat), Caption, Hashtags, Alt-Text und Posting-Tipp.

![Beispiel-Karussell](beispiele/vorschau.png)

## So arbeitet der Agent

```
Thema ──► 1. Entwurf (Claude, Texter-Rolle)
              │
              ▼
          2. Automatische Prüfung ──── Zeichengrenzen, Folienaufbau, Hashtags,
              │                         heikle Werbeaussagen (UWG), Text-Überlauf im echten Layout
              ▼
          3. Creative-Director-Review ── Note 1–10 + überarbeitete Fassung
              │
              └── wiederholen, bis Note ≥ 9 und 0 Mängel (max. 3 Runden)
              ▼
          4. Rendern ──► ausgabe/<datum>-<thema>/ folie-1.png … caption.txt
```

- **Faktenquelle ist nur `marke.json`.** Der Agent erfindet keine Kundenzahlen, Preise oder Bewertungen.
- **Verlauf:** Jeder Post landet in `ausgabe/verlauf.json`, damit sich Themen und Hooks nicht wiederholen.
- **Design** wie dein bestehendes Karussell (Navy, Orange, Inter). Schrift ist lokal eingebettet, funktioniert also offline.

## Einrichtung (einmalig)

```bash
cd marketing/insta-agent
npm install
npx playwright install chromium
```

API-Schlüssel von https://platform.claude.com → *API Keys*:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Unter Windows (PowerShell): `$env:ANTHROPIC_API_KEY="sk-ant-..."`

## Benutzung

Post zu einem Thema:

```bash
node agent.js --thema "5 Fehler, die Ihre Website Kunden kosten"
```

Einzelbild statt Karussell, mit eigenen Hinweisen:

```bash
node agent.js --thema "Baukasten vs. programmiert" --format einzelbild --notizen "Zielgruppe Handwerker"
```

Agent wählt selbst ein frisches Thema:

```bash
node agent.js --auto
```

Redaktionsplan mit 12 Ideen (Markdown mit fertigen Befehlen):

```bash
node agent.js --plan 12
```

Layout testen ohne API-Key:

```bash
node agent.js --demo
```

| Option | Bedeutung | Standard |
|---|---|---|
| `--thema`, `-t` | Worum es im Post geht | – |
| `--format`, `-f` | `karussell` oder `einzelbild` | `karussell` |
| `--folien` | Gewünschte Folienzahl (5–8) | 6–7 |
| `--notizen`, `-n` | Zusatzinfos (Aktion, Branche, Anlass …) | – |
| `--runden` | Max. Überarbeitungsrunden | `3` |
| `--zielnote` | Ab dieser Note ist der Post fertig | `9` |

Modell ändern (Standard `claude-opus-5-5`): `INSTA_AGENT_MODEL=claude-sonnet-5-5 node agent.js …`

## Ergebnis

```
ausgabe/2026-11-08-5-fehler-die-ihre-website-kunden-kosten/
├── folie-1.png … folie-6.png   → direkt bei Instagram hochladen
├── caption.txt                 → Caption + Hashtags zum Kopieren
├── README.md                   → alles auf einen Blick, inkl. Alt-Text und Posting-Tipp
├── post.json                   → Rohdaten (zum Nachbearbeiten)
└── vorschau.html               → alle Folien im Browser ansehen
```

Eigene Änderungen: `post.json` bearbeiten und die Folien neu rendern lassen – oder einfach `--notizen` nutzen und neu generieren.

## Anpassen

- **`marke.json`** – Angebot, Leistungen, USPs, Zielgruppe, Tonalität, CTAs, Themen-Säulen, Farben.
  Je konkreter und ehrlicher, desto besser die Posts. Echte Referenzen/Kundenstimmen hier eintragen, dann nutzt der Agent sie.
- **`src/pruefung.js`** – harte Regeln (Zeichengrenzen, verbotene Aussagen).
- **`src/render.js`** – Folien-Design (CSS).

## Kosten

Ein Post braucht 4–7 API-Aufrufe (Entwurf + bis zu 3 Review-Runden). Das Markenprofil wird per Prompt-Caching
wiederverwendet, das senkt die Kosten der Folgeaufrufe. Aktuelle Preise: https://claude.com/pricing
