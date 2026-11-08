// KI-Floskel-Prüfung für deutsche Texte.
// Quelle: floskeln.de.json – dieselbe Liste wie im Skill /ig-human (.claude/skills/ig-human/slop.de.json).
// Wer die Liste erweitert, ändert beide Dateien (npm test prüft, dass sie gleich sind).
import { readFileSync } from "node:fs";

const LEX = JSON.parse(readFileSync(new URL("./floskeln.de.json", import.meta.url), "utf8"));

// Diese Muster sind für automatische Posts zu streng oder passen nicht:
// Dreierketten kommen im Deutschen oft legitim vor, Großbuchstaben stehen bewusst in Dachzeilen,
// Hashtags liegen ohnehin in einem eigenen Feld.
const IGNORIERT = new Set(["dreierkette", "caps-shout", "hashtag-wall"]);

// Wortgrenzen, die auch mit Umlauten funktionieren (JS-\b kennt nur ASCII)
const L = "(?<![\\p{L}\\p{N}])";
const R = "(?![\\p{L}\\p{N}])";
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");

const begriffe = [...LEX.phrases, ...LEX.words]
  .sort((a, b) => b.find.length - a.find.length) // Phrasen vor Einzelwörtern
  .map((e) => ({ ...e, re: new RegExp(L + escape(e.find) + R, "giu") }));

// Python-Regex aus dem Skill → JavaScript: Inline-Flags nach vorne, \A → ^, \U0001F680 → \u{1F680}
function alsJsRegex(py) {
  let flags = "gu";
  let quelle = py.replace(/^\(\?([imsx]+)\)/, (_, f) => {
    flags += f.replace("x", "");
    return "";
  });
  quelle = quelle.replace(/\\A/g, "^").replace(/\\U([0-9A-Fa-f]{8})/g, (_, h) => `\\u{${parseInt(h, 16).toString(16)}}`);
  return new RegExp(quelle, flags);
}

const strukturen = LEX.structures
  .filter((s) => !IGNORIERT.has(s.id))
  .map((s) => ({ ...s, re: alsJsRegex(s.regex) }));

// Liefert Mängel im selben Stil wie pruefung.js. `ort` z. B. „Folie 2“ oder „Caption“.
export function pruefeFloskeln(teile) {
  const maengel = [];
  for (const { ort, text, strukturenPruefen = true } of teile) {
    if (!text?.trim()) continue;
    const gefunden = new Set();
    let rest = text;
    for (const b of begriffe) {
      b.re.lastIndex = 0;
      if (!b.re.test(rest)) continue;
      gefunden.add(b.find);
      rest = rest.replace(b.re, " "); // nicht doppelt melden („maßgeschneiderte“ und „maßgeschneidert“)
      const tipp = b.replace === null ? "umformulieren" : b.replace === "" ? "streichen" : `z. B. „${b.replace}“`;
      maengel.push(`${ort}: KI-Floskel „${b.find}“ – ${tipp}.`);
    }
    if (!strukturenPruefen) continue;
    for (const s of strukturen) {
      s.re.lastIndex = 0;
      if (s.re.test(text)) maengel.push(`${ort}: Muster ${s.name} – ${s.fix}`);
    }
  }
  return maengel;
}

// Kurzliste für den System-Prompt: lieber gleich vermeiden als hinterher korrigieren.
export function floskelHinweis() {
  const grundformen = LEX.words.filter((w) => w.family !== "adjectives" || !/(?:e|en|er|es|em)$/.test(w.find));
  const auswahl = [...LEX.phrases.slice(0, 20), ...grundformen.slice(0, 40)].map((e) => e.find);
  return [...new Set(auswahl)].join(", ");
}
