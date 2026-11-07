# Instagram-Agent – Back Office (Demo Dienstleistung & Demo Sicherheit)

Postet jeden Tag **einen** Beitrag auf Instagram (Konto **flowkit5**), abwechselnd für die
Demo **Dienstleistung** und die Demo **Sicherheit**. Läuft als geplante Aufgabe in Claude Code
und postet über den Windsor.ai-Connector (Aktion `create_image_post`).

## Dateien

| Datei | Inhalt |
|---|---|
| `posts.json` | Beitragsbank: `id`, `demo`, `image` (Pfad), `caption` – Reihenfolge = Postingreihenfolge |
| `posts/*.jpg` | Bilder 1080 × 1350 (4:5), JPEG |
| `posted.json` | Protokoll: welcher Beitrag wann gepostet wurde (`id`, `date`, `media_id`) |
| `build/content.js` | Quelle der Beiträge (Titel, Stichpunkte, Bildunterschrift) |
| `build/screenshots.js`, `build/render.js` | Screenshots aus den lokalen Demos holen und Bilder rendern |

Bild-URLs für Instagram (Repo ist öffentlich):
`https://raw.githubusercontent.com/Joerg2108/Joerg2108/claude/instagram-agent/marketing/instagram-agent/<image>`

## Ablauf pro Tag

1. Branch `claude/instagram-agent` holen.
2. Ersten Eintrag aus `posts.json` nehmen, dessen `id` noch nicht in `posted.json` steht.
3. Prüfen, ob heute (Europe/Berlin) schon etwas gepostet wurde → dann nichts tun.
4. Windsor.ai: Konto **flowkit5** beim Connector `instagram` suchen. Fehlt es → **nicht posten**
   (auch nicht auf ein anderes Konto) und melden.
5. `create_image_post` mit `image_url` und `caption`.
6. Eintrag in `posted.json` ergänzen, committen, auf `claude/instagram-agent` pushen.
7. Sind weniger als 5 Beiträge übrig → im Ergebnis darauf hinweisen.

## Neue Beiträge erzeugen

```bash
# beide Demos lokal starten (Port 3004 = Dienstleistung, 3005 = Sicherheit), dann:
node build/screenshots.js build/shots
node build/render.js build/shots   # schreibt posts/*.jpg und posts.json
```
Neue Beiträge in `build/content.js` ergänzen. Bereits gepostete IDs bleiben in `posted.json` und
werden nicht erneut gepostet.

## Stoppen

In Claude unter **Geplante Aufgaben** die Aufgabe „Instagram-Agent Back Office“ pausieren oder löschen.
