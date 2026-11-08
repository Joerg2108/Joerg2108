#!/usr/bin/env node
// Baut die Webdesign-Beitragsbank für den Windsor-Veröffentlicher (Branch claude/instagram-agent).
// Prüft jeden Beitrag (Zeichengrenzen, KI-Floskeln, Layout-Überlauf, Projekt-Screenshots) und rendert
// Karussell-Folien (1080×1350) und Story (1080×1920) als JPEG.
//
//   node bank-bauen.js <ziel-ordner> [webdesign|backoffice]   (Standard: webdesign)
//
// Ergebnis im Ziel-Ordner:
//   webdesign/<id>/folie-1.jpg … , webdesign/<id>/story.jpg
//   posts-webdesign.json  (Reihenfolge = Postingreihenfolge)
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { pruefePost, pruefeStories } from "./src/pruefung.js";
import { rendere, rendereStories, pruefeLayout, pruefeStoryLayout, schliessen } from "./src/render.js";
import { HIER, ladeMarke } from "./src/werkstatt.js";

const ziel = path.resolve(process.argv[2] ?? "");
const strang = process.argv[3] || "webdesign";
if (!["webdesign", "backoffice"].includes(strang)) throw new Error("Strang muss „webdesign“ oder „backoffice“ sein.");
if (!process.argv[2]) throw new Error("Ziel-Ordner angeben, z. B. node bank-bauen.js ../instagram-agent");

const marke = await ladeMarke();
const bank = JSON.parse(await readFile(path.join(HIER, `${strang}-bank.json`), "utf8"));
const tmp = path.join(tmpdir(), `bank-${Date.now()}`);
const eintraege = [];
let fehler = 0;

try {
  for (const b of bank) {
    const stories = { frames: [b.story] };
    const maengel = [
      ...pruefePost(b), ...(await pruefeLayout(b, marke)),
      ...pruefeStories(stories, 1), ...(await pruefeStoryLayout(stories, marke)),
    ];
    if (maengel.length) {
      fehler++;
      console.log(`❌ ${b.id} ${b.thema}\n   - ${maengel.join("\n   - ")}`);
      continue;
    }
    const roh = path.join(tmp, b.id);
    const folien = await rendere(b, marke, roh);
    const story = await rendereStories(stories, marke, roh);

    const ordner = path.join(ziel, strang, b.id);
    await rm(ordner, { recursive: true, force: true });
    await mkdir(ordner, { recursive: true });
    const images = [];
    for (const [i, jpg] of folien.jpg.entries()) {
      const name = `folie-${i + 1}.jpg`;
      await copyFile(jpg, path.join(ordner, name));
      images.push(`${strang}/${b.id}/${name}`);
    }
    await copyFile(story.jpg[0], path.join(ordner, "story.jpg"));

    eintraege.push({
      id: b.id,
      thema: b.thema,
      format: images.length > 1 ? "karussell" : "einzelbild",
      images,
      story: `${strang}/${b.id}/story.jpg`,
      caption: `${b.caption}\n.\n.\n.\n${b.hashtags.join(" ")}`,
      alt_text: b.alt_text,
    });
    console.log(`✅ ${b.id} ${b.thema} (${images.length} Bild${images.length > 1 ? "er" : ""} + Story)`);
  }
} finally {
  await schliessen();
  await rm(tmp, { recursive: true, force: true });
}

if (fehler) {
  console.log(`\n${fehler} Beitrag/Beiträge mit Mängeln – posts-webdesign.json wurde NICHT geschrieben.`);
  process.exitCode = 1;
} else {
  for (const e of eintraege) if (e.caption.length > 2200) throw new Error(`${e.id}: Caption über 2200 Zeichen`);
  await writeFile(path.join(ziel, `posts-${strang}.json`), JSON.stringify(eintraege, null, 2) + "\n");
  console.log(`\n✅ ${eintraege.length} Beiträge → ${path.join(ziel, `posts-${strang}.json`)}`);
}
