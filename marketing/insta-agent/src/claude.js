// Alles, was mit Claude spricht: Post schreiben, Post kritisch überarbeiten,
// Themenplan erstellen. Structured Outputs garantieren gültiges JSON.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Post, Review, Themenplan, Stories } from "./schema.js";
import { floskelHinweis } from "./floskeln.js";
import { readFileSync, existsSync } from "node:fs";

const MODELL = process.env.INSTA_AGENT_MODEL || "claude-opus-5-5";
let client; // erst bei Bedarf anlegen, damit --demo ohne API-Key läuft

// Stimm-Profil (voice.md) – dieselbe Datei, die auch die Instagram-Skills lesen.
// Nicht ausgefüllte Platzhalter {{…}} werden entfernt, damit Claude sie nicht für Fakten hält.
const STIMME_DATEI = process.env.INSTA_STIMME || new URL("../voice.md", import.meta.url);

export function ladeStimme(datei = STIMME_DATEI) {
  if (!existsSync(datei)) return "";
  const text = readFileSync(datei, "utf8");
  const ab = text.indexOf("\n---");
  return (ab >= 0 ? text.slice(ab + 4) : text)
    .replace(/\{\{[^}]*\}\}/g, "")
    .split("\n")
    .map((z) => z.trimEnd())
    .filter((z) => !/^\s*-?\s*(\*\*[^*]+:\*\*)?\s*$/.test(z) || z.trim() === "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function systemPrompt(marke) {
  const stimme = ladeStimme();
  return `Du bist der Social-Media-Texter und Art Director von ${marke.name}. Du erstellst hochwertige Instagram-Posts
(Karussells und Einzelbilder), die das Angebot „hochwertige Webseiten-Erstellung“ verkaufen – ohne marktschreierisch zu sein.

# Markenprofil (Faktenquelle)
${JSON.stringify(marke, null, 2)}
${stimme ? `
# Stimm-Profil von ${marke.name} (so klingt er – Wortwahl, Haltung, Tabus, Belege)
${stimme}
` : ""}
# Regeln für Inhalte
- Verwende ausschließlich Fakten aus dem Markenprofil und dem Abschnitt „Belege“ im Stimm-Profil. Erfinde KEINE Kundenzahlen, Bewertungen, Referenzen, Preise oder Prozentwerte.
  Allgemein bekannte Branchenaussagen sind erlaubt, wenn sie vorsichtig formuliert sind („viele Besucher springen ab, wenn …“).
- Beachte die Liste „verbotene_aussagen“. Keine Garantien, keine unbelegten Superlative, keine Rechtsversprechen (UWG).
- Ansprache: „${marke.ansprache}“. Tonalität: ${marke.tonalitaet}
- Deutsch, korrekte Rechtschreibung, typografische Anführungszeichen „…“, Gedankenstrich –.

# Was einen hochwertigen Post ausmacht
- Folie 1 ist ein Scroll-Stopper: konkretes Problem, überraschende Aussage oder klares Versprechen an die Zielgruppe. Kein „Heute zeige ich euch…“.
- Jede Folie trägt genau EINEN Gedanken. Wenig Text, große Aussagen. Lieber eine Folie mehr als eine überladene.
- Roter Faden: Problem → Folgen → Lösung/Wissen → Beweis aus dem Angebot → CTA.
- Nutzen zuerst: Der Leser soll auch ohne Kauf etwas mitnehmen (speichern-würdig).
- Die CTA-Folie nennt einen konkreten nächsten Schritt aus „cta“.
- Caption: Hook in Zeile 1 (max. 125 Zeichen), dann kurze Absätze mit Leerzeilen, sparsam 1–3 Emojis, am Ende CTA und eine Frage für Kommentare.
- Hashtags: 8–15, gemischt (z. B. #webdesign, #websiteerstellen, #kmu, #handwerk, regionale/Nischen-Tags). Keine Fantasie-Tags.
- Halte die Zeichengrenzen aus den Feldbeschreibungen strikt ein – Texte, die nicht auf die Folie passen, sind wertlos.

# Klingt nach Mensch, nicht nach KI
Schreib so, wie ${marke.name} spricht: konkret, mit Zahlen und Beispielen statt Adjektiven.
Diese Floskeln und ihre Beugungsformen sind tabu (die Prüfung lehnt sie ab): ${floskelHinweis()}.
Ebenfalls tabu: „nicht nur X, sondern auch Y“, „Es geht nicht um X, es geht um Y“, inszenierte Enthüllungen
(„Das Ergebnis?“ als eigene Zeile), Fazit-Absätze, Emoji-Aufzählungen, 🚀🔥💡✨🎯, mehr als ein Ausrufezeichen,
mehr als zwei Gedankenstriche pro Text, „Was denken Sie?“ und andere Allerwelts-Fragen.`;
}

async function frage(marke, inhalt, schema = Post, effort = "high") {
  client ??= new Anthropic();
  const res = await client.messages.parse({
    model: MODELL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort, format: zodOutputFormat(schema) },
    // Markenprofil ist bei jedem Aufruf gleich → Prompt-Caching spart Kosten.
    system: [{ type: "text", text: systemPrompt(marke), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: inhalt }],
  });
  if (res.stop_reason === "refusal") throw new Error("Claude hat die Anfrage abgelehnt.");
  if (res.stop_reason === "max_tokens") throw new Error("Antwort wurde abgeschnitten (max_tokens).");
  if (!res.parsed_output) throw new Error("Antwort konnte nicht als JSON gelesen werden.");
  return res.parsed_output;
}

export async function schreibePost(marke, { thema, format, folien, notizen, bisherige }) {
  return frage(
    marke,
    `Erstelle einen Instagram-Post.
Thema: ${thema}
Format: ${format}${format === "karussell" ? ` mit ${folien ?? "6–7"} Folien` : ""}
${notizen ? `Zusätzliche Hinweise von Jörg: ${notizen}` : ""}
${bisherige?.length ? `Bereits gepostete Themen (nicht wiederholen, andere Hooks wählen):\n- ${bisherige.join("\n- ")}` : ""}`
  );
}

export async function ueberarbeite(marke, post, maengel) {
  return frage(
    marke,
    `Du bist jetzt ein strenger Creative Director. Prüfe diesen Instagram-Post und überarbeite ihn.

Bewerte nach: Stärke des Hooks, ein Gedanke pro Folie, Klarheit, Nutzen für den Leser, Glaubwürdigkeit (keine erfundenen Fakten),
Markenton, CTA, Caption-Aufbau, Hashtag-Qualität. Note 9–10 nur, wenn du den Post selbst sofort veröffentlichen würdest.

${maengel.length ? `Die automatische Prüfung hat diese Mängel gefunden – sie MÜSSEN alle behoben sein:\n- ${maengel.join("\n- ")}\n` : ""}
Post:
${JSON.stringify(post, null, 2)}`,
    Review
  );
}

export async function planeThemen(marke, anzahl, bisherige) {
  return frage(
    marke,
    `Erstelle einen Redaktionsplan mit ${anzahl} Post-Ideen. Verteile sie über die Themen-Säulen,
überwiegend Karussells, ca. jede vierte Idee als Einzelbild.
${bisherige?.length ? `Bereits gepostet (nicht wiederholen):\n- ${bisherige.join("\n- ")}` : ""}`,
    Themenplan,
    "medium"
  );
}

export async function schreibeStories(marke, { post, anzahl, maengel = [], vorher }) {
  return frage(
    marke,
    `Erstelle ${anzahl} Instagram-Story-Frames (Hochformat 9:16) für heute.
${post ? `Heute erscheint dieser Feed-Beitrag – Frame 1 ist ein Teaser dafür (Hinweis z. B. „Neuer Beitrag im Feed ↗“):
Thema: ${post.thema}
Hook: ${post.folien[0]?.headline} ${post.folien[0]?.akzent}` : "Heute gibt es keinen Feed-Beitrag – erstelle eigenständige Stories."}
Die weiteren Frames liefern einen schnellen Tipp, einen Fakt oder einen Denkanstoß aus dem Markenprofil und enden mit einem CTA
(„Link in Bio“ oder „Schreiben Sie mir eine DM“). Stories sind persönlicher und lockerer als der Feed, aber genauso ehrlich.
Wenig Text – eine Story wird ca. 5 Sekunden angesehen. Halte die Zeichengrenzen strikt ein.
${vorher ? `\nVorherige Fassung:\n${JSON.stringify(vorher, null, 2)}` : ""}
${maengel.length ? `\nDiese Mängel MÜSSEN behoben werden:\n- ${maengel.join("\n- ")}` : ""}`,
    Stories,
    "medium"
  );
}

export { MODELL };
