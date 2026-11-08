// Datenmodell eines Instagram-Posts. Claude muss exakt diese Struktur liefern
// (Structured Outputs) – dadurch kann der Renderer sich blind darauf verlassen.
// Längen-Grenzen prüft src/pruefung.js, nicht das Schema (Structured Outputs
// unterstützt nicht alle Zod-Einschränkungen).
import { z } from "zod";

export const FolienTyp = z.enum(["titel", "inhalt", "liste", "zahl", "cta"]);

export const Folie = z.object({
  typ: FolienTyp.describe(
    "titel = Hook-Folie (immer Folie 1), inhalt = Überschrift + kurzer Text, " +
      "liste = Überschrift + 2–5 Punkte, zahl = eine große Kennzahl/ein Schlagwort in 'headline' + Erklärung in 'text', " +
      "cta = Abschluss mit Handlungsaufforderung (immer letzte Folie im Karussell)"
  ),
  eyebrow: z.string().describe("Kleine Dachzeile in Großbuchstaben, max. 40 Zeichen, z. B. 'WEBSITE-CHECK · TEIL 1'. Darf leer sein."),
  headline: z.string().describe("Hauptzeile in Weiß, max. 60 Zeichen. Kurz und knackig."),
  akzent: z.string().describe("Zweite Zeile in Akzentfarbe (Orange), max. 40 Zeichen. Darf leer sein."),
  text: z.string().describe("Fließtext, max. 220 Zeichen. Darf leer sein (bei 'liste' meist leer)."),
  punkte: z.array(z.string()).describe("Nur bei typ 'liste': 2–5 Punkte, je max. 70 Zeichen. Sonst leeres Array."),
});

export const Post = z.object({
  thema: z.string().describe("Arbeitstitel des Posts"),
  format: z.enum(["karussell", "einzelbild"]),
  folien: z.array(Folie).describe("Karussell: 5–8 Folien. Einzelbild: genau 1 Folie (typ 'titel' oder 'zahl')."),
  caption: z
    .string()
    .describe(
      "Instagram-Bildunterschrift. Erste Zeile = Hook (max. 125 Zeichen, wird vor 'mehr' angezeigt). " +
        "Danach kurze Absätze mit Leerzeilen, Mehrwert, dann CTA. Keine Hashtags in der Caption. Max. 2000 Zeichen."
    ),
  hashtags: z.array(z.string()).describe("8–15 Hashtags mit #, Mischung aus groß, mittel und Nische/regional. Keine Duplikate."),
  alt_text: z.string().describe("Barrierefreier Alternativtext für das Bild/Karussell, 1–2 Sätze."),
  posting_tipp: z.string().describe("Kurzer Tipp für Jörg: beste Uhrzeit/Wochentag, Story-Idee oder Frage für die Kommentare."),
});

export const Review = z.object({
  bewertung: z.number().int().describe("Gesamtnote 1–10 aus Sicht eines strengen Creative Directors"),
  kritik: z.array(z.string()).describe("Konkrete Schwachstellen der Eingangsversion (leer, wenn nichts zu verbessern ist)"),
  post: Post.describe("Die überarbeitete, verbesserte Version des Posts (oder unverändert, wenn sie schon top ist)"),
});

export const Themenplan = z.object({
  ideen: z.array(
    z.object({
      thema: z.string(),
      saeule: z.string().describe("Welche Themen-Säule aus dem Markenprofil"),
      format: z.enum(["karussell", "einzelbild"]),
      hook: z.string().describe("Die Hook-Zeile für Folie 1"),
      warum: z.string().describe("Warum dieser Post für die Zielgruppe relevant ist, 1 Satz"),
    })
  ),
});

// Story-Frames (1080×1920). Interaktive Sticker (Umfrage, Link) gibt es über die API nicht –
// deshalb arbeiten Stories mit klaren Text-Hinweisen („Link in Bio“, „Schreiben Sie mir“).
export const StoryFrame = z.object({
  typ: z.enum(["teaser", "tipp", "fakt", "frage"]).describe(
    "teaser = macht neugierig auf den heutigen Feed-Beitrag, tipp = ein schneller Praxistipp, " +
      "fakt = eine große Zahl/ein Schlagwort mit Erklärung, frage = Denkanstoß mit Aufforderung zur DM"
  ),
  eyebrow: z.string().describe("Dachzeile in Großbuchstaben, max. 30 Zeichen"),
  headline: z.string().describe("Hauptzeile, max. 50 Zeichen"),
  akzent: z.string().describe("Zeile in Orange, max. 35 Zeichen, darf leer sein"),
  text: z.string().describe("Kurzer Text, max. 160 Zeichen, darf leer sein"),
  hinweis: z.string().describe("Handlungsaufforderung unten, max. 40 Zeichen, z. B. „Neuer Beitrag im Feed ↗“ oder „Link in Bio“"),
});

export const Stories = z.object({
  frames: z.array(StoryFrame).describe("Die Story-Frames in Reihenfolge"),
});
