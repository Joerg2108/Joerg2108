# caveman (Projekt-Skill)

Knapper Antwortmodus für Claude Code: Füllwörter, Floskeln und Absicherungen fliegen raus,
technischer Inhalt (Code, Fehlermeldungen, Zahlen, API-Namen) bleibt exakt.

## Herkunft

- Quelle: [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman), `skills/caveman/SKILL.md`
- Stand: Commit `2fd153c67988e980fb0b2455c90832159a6a5a25`
- Lizenz: MIT (das Verzeichnis `skills/` steht laut `LICENSING.md` des Originals unter MIT), siehe [`LICENSE`](./LICENSE)
- `SKILL.md` ist unverändert übernommen. Zum Aktualisieren die Datei aus dem Original-Repo neu kopieren und den Commit hier nachtragen.

## Aufruf

```
/caveman              # Stufe full (Standard)
/caveman lite         # nur Füllwörter weg, ganze Sätze bleiben
/caveman ultra        # maximal knapp
/caveman off          # aus
stop caveman          # zurück zu normaler Sprache
```

Die Antwortsprache bleibt Deutsch – der Skill komprimiert den Stil, nicht die Sprache.
Commits, Code-Kommentare, Doku und PR-Texte schreibt er weiterhin in normaler Prosa.
Bei Sicherheitswarnungen und unumkehrbaren Aktionen schaltet er automatisch auf Klartext.

## Beispiel

Frage: „Warum rendert meine React-Komponente ständig neu?"

- normal: „Deine Komponente rendert neu, weil du bei jedem Render eine neue Objekt-Referenz erzeugst. Pack das Objekt in `useMemo`."
- full: „Neue Objekt-Referenz pro Render. Inline-Objekt-Prop = neue Referenz = Re-Render. In `useMemo` packen."
- ultra: „Inline-Objekt, neue Referenz, Re-Render. `useMemo`."
