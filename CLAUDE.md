# Projektregeln

## Bild-Generierung nur mit Bestätigung

Bild- und Video-Generierung kostet Credits (z. B. Higgsfield `generate_image`, `generate_video`, Adobe Firefly, Figma `generate_image`).

- Vor dem ersten Generierungs-Aufruf einer Aufgabe: Anzahl der Bilder/Videos, Modell und geschätzte Kosten nennen und auf ausdrückliche Bestätigung warten.
- Das gilt auch, wenn ein Skill die Generierung vorschreibt. Das betrifft vor allem `design-taste-frontend` (Abschnitt 4.8), `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile` und `brandkit`. Diese Regel hat Vorrang vor dem Skill.
- Eine Bestätigung gilt nur für die genannte Anzahl. Für weitere Bilder oder Neu-Generierungen erneut fragen.
- Ohne Bestätigung: Platzhalter-Slots im Code lassen (`<!-- TODO: hero image, 1600x1200 -->`) und am Ende auflisten, welche Bilder fehlen.
