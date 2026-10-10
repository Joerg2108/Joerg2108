# Projektregeln

## Kostenpflichtige Generierung nur mit Bestätigung

KI-Generierung über externe Dienste kostet Credits oder Geld. Das betrifft:

- Bilder und Videos: Higgsfield (`generate_image`, `generate_video`, …), Adobe Firefly, Figma `generate_image`
- Komponenten und Code: 21st MCP (`generate`, `iterate_generation`, auch die alten Namen `21st_magic_component_builder` und `21st_magic_component_refiner`)
- jedes andere Tool, dessen Beschreibung Credits, Kontingent oder Abrechnung erwähnt

Regeln:

- Vor dem ersten Generierungs-Aufruf einer Aufgabe: Dienst, Anzahl der Aufrufe, Modell (falls wählbar) und geschätzte Kosten nennen und auf ausdrückliche Bestätigung warten.
- Das gilt auch, wenn ein Skill die Generierung vorschreibt. Das betrifft vor allem `design-taste-frontend` (Abschnitt 4.8), `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile` und `brandkit`. Diese Regel hat Vorrang vor dem Skill.
- Eine Bestätigung gilt nur für die genannte Anzahl. Für weitere Aufrufe oder Neu-Generierungen erneut fragen.
- Ohne Bestätigung:
  - bei Bildern: Platzhalter-Slots im Code lassen (`<!-- TODO: hero image, 1600x1200 -->`) und am Ende auflisten, welche Bilder fehlen
  - bei Komponenten: kostenlose Wege nehmen (21st `search` / `get_component`, React Bits, eigener Code)
- Kostenlose Lese-Aufrufe wie 21st `search`, `get_component`, `search_logo` und `get_usage` brauchen keine Bestätigung.
