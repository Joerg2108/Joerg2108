// Projekt-Folien: nur mit vorhandenen Screenshots, höchstens zwei pro Karussell.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pruefePost, projektVorhanden } from "../src/pruefung.js";

const demo = () => JSON.parse(readFileSync(new URL("../beispiele/demo-post.json", import.meta.url), "utf8"));

test("Screenshots aller Projekte aus marke.json sind vorhanden", () => {
  const marke = JSON.parse(readFileSync(new URL("../marke.json", import.meta.url), "utf8"));
  for (const p of [...marke.referenzen, ...marke.projekte_in_arbeit.liste]) assert.ok(projektVorhanden(p.kuerzel), p.kuerzel);
});

test("unbekanntes Projekt und Pfad-Tricks werden abgelehnt", () => {
  for (const k of ["gibt-es-nicht", "../src", ""]) {
    const post = demo();
    post.folien[2].projekt = k;
    assert.ok(pruefePost(post).some((m) => m.includes("keine Screenshots")), k);
  }
});

test("mehr als zwei Projekt-Folien sind zu viel", () => {
  const post = demo();
  for (const i of [1, 3, 4]) Object.assign(post.folien[i], { typ: "projekt", projekt: "diani-home-hosting", punkte: [], text: "" });
  assert.ok(pruefePost(post).some((m) => m.includes("Höchstens 2 Projekt-Folien")));
});

test("projekt-Feld bei anderen Folientypen wird bemängelt", () => {
  const post = demo();
  post.folien[1].projekt = "diani-home-hosting";
  assert.ok(pruefePost(post).some((m) => m.includes("nur bei typ „projekt“")));
});
