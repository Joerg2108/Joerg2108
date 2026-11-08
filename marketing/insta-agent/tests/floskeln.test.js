// Prüft die deutsche KI-Floskel-Erkennung und dass Agent und Skill dieselbe Liste nutzen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { pruefeFloskeln } from "../src/floskeln.js";
import { pruefePost } from "../src/pruefung.js";

test("typische KI-Floskeln und Muster werden erkannt (auch gebeugt und mit Umlauten)", () => {
  const m = pruefeFloskeln([{ ort: "Caption", text:
    "In der heutigen digitalen Welt ist das nicht nur schön, sondern auch wichtig. " +
    "Eine maßgeschneiderte Lösung mit Mehrwert – ein echter Gamechanger!!" }]);
  for (const erwartet of ["in der heutigen digitalen Welt", "maßgeschneiderte", "Mehrwert", "Gamechanger", "nicht nur", "Ausrufezeichen"])
    assert.ok(m.some((x) => x.includes(erwartet)), `fehlt: ${erwartet}\n${m.join("\n")}`);
});

test("natürlicher, konkreter Text bleibt ohne Befund", () => {
  const m = pruefeFloskeln([{ ort: "Caption", text:
    "Letzte Woche rief mich ein Dachdecker aus Leipzig an. Seine Website lud am Handy 7,8 Sekunden. " +
    "Nach dem Umbau: 0,9 Sekunden. Wie lange lädt Ihre Seite? Schreiben Sie mir die Zahl." }]);
  assert.deepEqual(m, []);
});

test("Wortgrenzen: „Reisen“ im Sinne von Urlaub ist nicht „Reise“-Floskel, Teilwörter zählen nicht", () => {
  const m = pruefeFloskeln([{ ort: "x", text: "Unsere Reisebüro-Kunden und die Gamechangerin" }]);
  assert.deepEqual(m, []);
});

test("Demo-Post besteht die komplette Prüfung", () => {
  const post = JSON.parse(readFileSync(new URL("../beispiele/demo-post.json", import.meta.url), "utf8"));
  assert.deepEqual(pruefePost(post), []);
});

test("Floskel-Liste ist identisch mit der im Skill /ig-human", { skip: !existsSync(new URL("../../../.claude/skills/ig-human/slop.de.json", import.meta.url)) }, () => {
  const agent = readFileSync(new URL("../src/floskeln.de.json", import.meta.url), "utf8");
  const skill = readFileSync(new URL("../../../.claude/skills/ig-human/slop.de.json", import.meta.url), "utf8");
  assert.equal(agent, skill, "Bitte src/floskeln.de.json und .claude/skills/ig-human/slop.de.json abgleichen");
});
