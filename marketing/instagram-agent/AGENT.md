# Instagram-Agent – Back Office (Demo Dienstleistung & Demo Sicherheit)

Postet jeden Tag **einen** Beitrag **und eine Story** auf Instagram (Konto **flowkit5**), abwechselnd für die
Demo **Dienstleistung** und die Demo **Sicherheit**. Läuft als geplante Aufgabe in Claude Code
und postet über den Windsor.ai-Connector (Aktionen `create_image_post` und `create_story`).

## Dateien

| Datei | Inhalt |
|---|---|
| `posts.json` | Beitragsbank: `id`, `demo`, `image` (Feed), `story` (Story), `caption` – Reihenfolge = Postingreihenfolge |
| `posts/*.jpg` | Feed-Bilder 1080 × 1350 (4:5), JPEG |
| `stories/*.jpg` | Story-Bilder 1080 × 1920 (9:16), JPEG – gleiches Thema wie der Feed-Beitrag |
| `posted.json` | Protokoll: welcher Beitrag wann gepostet wurde (`id`, `date`, `media_id`, `story_media_id`) |
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
6. `create_story` mit `image_url` = Story-Bild desselben Beitrags (Stories haben keine Bildunterschrift).
7. Eintrag in `posted.json` ergänzen (`story_media_id`, sonst `null`), committen, auf `claude/instagram-agent` pushen.
8. Sind weniger als 5 Beiträge übrig → im Ergebnis darauf hinweisen.

## Neue Beiträge erzeugen

```bash
# beide Demos lokal starten (Port 3004 = Dienstleistung, 3005 = Sicherheit), dann:
node build/screenshots.js build/shots
node build/render.js build/shots   # schreibt posts/*.jpg, stories/*.jpg und posts.json
```
Neue Beiträge in `build/content.js` ergänzen. Bereits gepostete IDs bleiben in `posted.json` und
werden nicht erneut gepostet.

## Stoppen

In Claude unter **Geplante Aufgaben** die Aufgabe „Instagram-Agent Back Office“ pausieren oder löschen.

---

# Zweiter Strang: Webdesign (täglich zusätzlich zum Back-Office-Beitrag)

Täglich **ein** Webdesign-Beitrag (Karussell oder Einzelbild) **plus eine Story**, ebenfalls auf **flowkit5** über
Windsor.ai. Läuft als eigene geplante Aufgabe „Instagram-Agent Webdesign“ (abends), unabhängig vom
Back-Office-Strang oben. Die Back-Office-Dateien (`posts.json`, `posted.json`) bleiben unberührt.

| Datei | Inhalt |
|---|---|
| `posts-webdesign.json` | Beitragsbank: `id` (W01 …), `thema`, `format` (`karussell`/`einzelbild`), `images` (Liste), `story`, `caption` (inkl. Hashtags), `alt_text` |
| `webdesign/<id>/folie-*.jpg` | Feed-Bilder 1080 × 1350, JPEG |
| `webdesign/<id>/story.jpg` | Story 1080 × 1920, JPEG |
| `posted-webdesign.json` | Protokoll (`id`, `date`, `media_id`, `story_media_id`) |

Erzeugt und geprüft (Zeichengrenzen, KI-Floskeln, Layout, Projekt-Screenshots) mit dem Agenten in
`marketing/insta-agent/` (Branch `claude/upbeat-curie-td1txg`): Beiträge in `webdesign-bank.json` ergänzen, dann

```bash
node bank-bauen.js <Pfad zu diesem Ordner>
```

Veröffentlichen: mehr als ein Bild → `create_carousel_post` mit `image_urls` (Reihenfolge wie in `images`),
ein Bild → `create_image_post`. Danach `create_story` mit dem Story-Bild. URL-Basis wie oben.
