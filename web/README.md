# Fischer-Art – neue Website

Neubau von www.fischer-art.de mit Next.js 15, React 19, TypeScript und Tailwind CSS 4 (shadcn-Struktur).
Alle Seiten werden statisch erzeugt (`next build`), es gibt keine Datenbank und kein Tracking.

## Entwicklung

    npm install
    npm run dev        # http://localhost:3000
    npm run build && npm start

## Inhalte ändern

- Texte, Kontakt, Vita, Ausstellungen, Kunst am Bau, Publikationen, Aktuelles, Shop: `lib/content.ts`
- Werk-Kategorien (Texte): `lib/works.ts`, Bildlisten: `lib/works-images.json`
- Impressum/Datenschutz: `lib/legal.ts`, danach `LEGAL_TEXTS_REVIEWED = true` setzen

## Bilder neu importieren

`scripts/import-images.mjs` wandelt die Originaldateien der alten WordPress-Seite in WebP (max. 1800 px)
um und schreibt `lib/works-images.json`:

    node scripts/import-images.mjs <ordner-mit-originalen> <gallery.json>
