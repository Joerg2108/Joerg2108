// Das Stimm-Profil landet ohne unausgefüllte Platzhalter im System-Prompt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ladeStimme } from "../src/claude.js";

test("voice.md: Platzhalter und leere Felder fliegen raus, echte Angaben bleiben", () => {
  const s = ladeStimme();
  assert.ok(s.includes("Jörg Noack"));
  assert.ok(s.includes("Meine Positionen"));
  assert.ok(s.includes("@flowkit5"));
  assert.doesNotMatch(s, /\{\{|\*\*Gesicht vor der Kamera:\*\*|\n\s*\n\s*\n/); // leere Felder sind weg
});

test("fehlende Datei → leerer Text, kein Absturz", () => {
  const datei = path.join(mkdtempSync(path.join(tmpdir(), "stimme-")), "gibtsnicht.md");
  assert.equal(ladeStimme(datei), "");
});

test("ausgefüllte Belege werden übernommen", () => {
  const datei = path.join(mkdtempSync(path.join(tmpdir(), "stimme-")), "voice.md");
  writeFileSync(datei, "Kopf\n---\n## Belege\n\n- Seite von 6,2 auf 0,9 Sekunden\n- {{noch offen}}\n");
  const s = ladeStimme(datei);
  assert.match(s, /6,2 auf 0,9 Sekunden/);
  assert.doesNotMatch(s, /noch offen/);
});
