#!/usr/bin/env node
// Tägliche Automatik: Feed-Beitrag + Stories erstellen, prüfen und bei Instagram veröffentlichen.
// Gedacht für einen Zeitplan (systemd-Timer/cron), einmal pro Tag.
//
//   node taeglich.js --pruefen        Einrichtung testen (Token, Konto, Bild-Hosting) – postet nichts
//   node taeglich.js --trocken        Alles erzeugen, aber NICHT hochladen/veröffentlichen
//   node taeglich.js                  Feed-Beitrag + Stories veröffentlichen
//   node taeglich.js --nur feed       nur den Feed-Beitrag
//   node taeglich.js --nur story      nur Stories (beziehen sich auf den heutigen Beitrag, falls vorhanden)
import "./src/env.js"; // zuerst: .env laden
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { HIER, AUSGABE, heute, log, ladeMarke, ladeJson, speichereJson, bisherigeThemen, tagesOrdner,
  erstellePost, speicherePost, erstelleStories, speichereStories, volleCaption } from "./src/werkstatt.js";
import { schliessen } from "./src/render.js";


const { values: arg } = parseArgs({
  options: {
    nur: { type: "string" },
    trocken: { type: "boolean" },
    erzwingen: { type: "boolean" },
    pruefen: { type: "boolean" },
    stories: { type: "string", default: process.env.STORIES_PRO_TAG || "2" },
    mindestnote: { type: "string", default: process.env.MINDESTNOTE || "8" },
    hilfe: { type: "boolean", short: "h" },
  },
});

const ZUSTAND = path.join(AUSGABE, "zustand", "veroeffentlicht.json");
const WARTESCHLANGE = process.env.INSTA_WARTESCHLANGE || path.join(HIER, "warteschlange.txt");
const datum = heute();

// Optional: Push aufs Handy, z. B. mit ntfy (BENACHRICHTIGUNG_URL=https://ntfy.sh/<geheimer-kanal>)
async function melde(text) {
  log(text);
  const url = process.env.BENACHRICHTIGUNG_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", body: `Instagram-Agent: ${text}` });
  } catch (e) {
    log(`⚠️  Benachrichtigung fehlgeschlagen: ${e.message}`);
  }
}

async function eintrag(daten) {
  const liste = await ladeJson(ZUSTAND, []);
  liste.push({ datum, zeit: new Date().toISOString(), ...daten });
  await speichereJson(ZUSTAND, liste);
}

const heuteSchon = async (art) => (await ladeJson(ZUSTAND, [])).find((e) => e.datum === datum && e.art === art);

// Warteschlange: eine Zeile pro Thema, optional mit Format davor:  "einzelbild | Baukasten vs. programmiert"
async function naechstesThema() {
  if (!existsSync(WARTESCHLANGE)) return null;
  const zeilen = (await readFile(WARTESCHLANGE, "utf8")).split("\n");
  const index = zeilen.findIndex((z) => z.trim() && !z.trim().startsWith("#"));
  if (index < 0) return null;
  const [a, b] = zeilen[index].split("|").map((s) => s.trim());
  const thema = b ?? a;
  const format = b && ["karussell", "einzelbild"].includes(a) ? a : "karussell";
  return {
    thema, format,
    erledigt: async () => {
      zeilen.splice(index, 1);
      await writeFile(WARTESCHLANGE, zeilen.join("\n"));
    },
  };
}

async function veroeffentlichen(jpgs, fn) {
  const { hochladen, pruefeErreichbar } = await import("./src/hosting.js");
  const urls = await hochladen(jpgs, datum);
  await pruefeErreichbar(urls[0]);
  return fn(urls);
}

// ---------------------------------------------------------------- Feed
async function feed(marke) {
  const schon = await heuteSchon("feed");
  if (schon && !arg.erzwingen) {
    log(`⏭️  Feed-Beitrag für heute ist schon online: ${schon.permalink ?? schon.media_id}`);
    return JSON.parse(await readFile(path.join(AUSGABE, schon.ordner, "post.json"), "utf8"));
  }

  let quelle = await naechstesThema();
  if (quelle) log(`📋 Thema aus warteschlange.txt: ${quelle.thema}`);
  else {
    const { planeThemen } = await import("./src/claude.js");
    const [idee] = (await planeThemen(marke, 1, await bisherigeThemen())).ideen;
    quelle = { thema: idee.thema, format: idee.format };
    log(`💡 Selbst gewähltes Thema: ${idee.thema} (${idee.format})`);
  }

  const { post, bewertung, offen } = await erstellePost(marke, { thema: quelle.thema, format: quelle.format });
  const { ordner, bilder } = await speicherePost(post, marke, { bewertung });
  const rel = path.relative(AUSGABE, ordner);

  // Qualitätsschranke: lieber einen Tag nichts posten als etwas Schlechtes.
  const mindestnote = Number(arg.mindestnote);
  if (offen.length || bewertung < mindestnote) {
    await melde(`❌ Beitrag NICHT veröffentlicht (Note ${bewertung}/10, ${offen.length} offene Mängel). Entwurf: ausgabe/${rel}`);
    process.exitCode = 2;
    return null;
  }

  let caption = volleCaption(post);
  if (caption.length > 2200) caption = post.caption.slice(0, 2200); // Instagram-Grenze; Hashtags opfern statt Text

  if (arg.trocken) {
    log(`🧪 Trockenlauf: ${bilder.length} Bild(er) erzeugt, nichts veröffentlicht → ausgabe/${rel}`);
    return post;
  }

  const { postFeed, pruefeKonto } = await import("./src/instagram.js");
  await pruefeKonto(marke.instagram);
  const ergebnis = await veroeffentlichen(bilder.jpg, (urls) => postFeed(urls, caption, post.alt_text));
  await eintrag({ art: "feed", thema: post.thema, ordner: rel, media_id: ergebnis.id, permalink: ergebnis.permalink, note: bewertung });
  await quelle.erledigt?.();
  await melde(`✅ Beitrag online (Note ${bewertung}/10): ${post.thema} ${ergebnis.permalink ?? ""}`);
  return post;
}

// ---------------------------------------------------------------- Stories
async function stories(marke, post) {
  const schon = await heuteSchon("story");
  if (schon && !arg.erzwingen) return log("⏭️  Stories für heute sind schon online.");

  const anzahl = Math.max(1, Math.min(5, Number(arg.stories)));
  log(`📱 Erstelle ${anzahl} Story-Frame(s) …`);
  const { stories: s, offen } = await erstelleStories(marke, { post, anzahl });
  const ordner = post ? tagesOrdner(post.thema) : tagesOrdner("stories");
  const bilder = await speichereStories(s, marke, ordner);

  if (offen.length) {
    await melde(`❌ Stories NICHT veröffentlicht (${offen.length} Mängel). Entwurf: ausgabe/${path.relative(AUSGABE, ordner)}`);
    process.exitCode = 2;
    return;
  }
  if (arg.trocken) return log(`🧪 Trockenlauf: ${bilder.length} Story-Bild(er) erzeugt, nichts veröffentlicht.`);

  const { postStory, pruefeKonto } = await import("./src/instagram.js");
  await pruefeKonto(marke.instagram);
  const ids = await veroeffentlichen(bilder.jpg, async (urls) => {
    const ergebnisse = [];
    for (const url of urls) ergebnisse.push(await postStory(url)); // Reihenfolge einhalten
    return ergebnisse;
  });
  await eintrag({ art: "story", ordner: path.relative(AUSGABE, ordner), media_ids: ids.map((x) => x.id) });
  await melde(`✅ ${ids.length} Story-Frame(s) online.`);
}

// ---------------------------------------------------------------- Einrichtung prüfen
async function pruefen() {
  const { konto, kontoPasst } = await import("./src/instagram.js");
  const marke = await ladeMarke();
  const k = await konto();
  log(`👤 Verbunden mit @${k.username} (${k.account_type}, ${k.followers_count ?? "?"} Follower, ${k.media_count ?? "?"} Beiträge)`);
  if (!kontoPasst(k.username, marke.instagram)) {
    throw new Error(`Das Token gehört zu @${k.username}, in marke.json steht aber @${marke.instagram}. Token vom richtigen Konto erzeugen oder marke.json anpassen.`);
  }
  log(`✅ Richtiges Konto: @${k.username}`);
  if (k.account_type && k.account_type !== "BUSINESS") log(`⚠️  Kontotyp ${k.account_type}: Stories per API gehen nur mit Business-Konten (Instagram → Kontotyp → Unternehmen).`);
  if (k.limit) log(`📊 Veröffentlichungen in den letzten 24 h: ${k.limit.quota_usage} von ${k.limit.config?.quota_total ?? "?"}`);

  const { hochladen, pruefeErreichbar } = await import("./src/hosting.js");
  const test = path.join(HIER, "beispiele", "hosting-test.jpg");
  const [url] = await hochladen([test], `${datum}-test`);
  await pruefeErreichbar(url);
  log(`🌐 Bild-Hosting funktioniert: ${url}`);

  if (!process.env.ANTHROPIC_API_KEY) log("⚠️  ANTHROPIC_API_KEY ist nicht gesetzt – ohne ihn kann der Agent keine Texte schreiben.");
  log("✅ Einrichtung sieht gut aus. Nächster Schritt: node taeglich.js --trocken");
}

async function main() {
  if (arg.hilfe) {
    console.log(`Nutzung:
  node taeglich.js --pruefen       Einrichtung testen (postet nichts)
  node taeglich.js --trocken       erzeugen ohne zu veröffentlichen
  node taeglich.js                 Feed-Beitrag + Stories veröffentlichen
  node taeglich.js --nur feed|story
Optionen: --stories 2 (Frames pro Tag), --mindestnote 8, --erzwingen (heute erneut posten)
Themen: warteschlange.txt (eine Zeile pro Thema), sonst wählt der Agent selbst.`);
    return;
  }
  if (arg.pruefen) return pruefen();
  if (arg.nur && !["feed", "story"].includes(arg.nur)) throw new Error("--nur muss „feed“ oder „story“ sein.");

  const marke = await ladeMarke();
  let post = null;
  if (arg.nur !== "story") post = await feed(marke);
  else {
    const schon = await heuteSchon("feed");
    if (schon) post = JSON.parse(await readFile(path.join(AUSGABE, schon.ordner, "post.json"), "utf8"));
  }
  if (arg.nur !== "feed") await stories(marke, post);
}

main()
  .catch(async (e) => {
    await melde(`❌ Fehler: ${e.message}`);
    process.exitCode = 1;
  })
  .finally(schliessen);
