#!/usr/bin/env node
// Instagram-Agent für Jörg Noack – hochwertige Posts zum Angebot „Webseiten-Erstellung“ (manuelle Nutzung).
// Für die tägliche Automatik mit Veröffentlichung siehe taeglich.js.
//
//   node agent.js --thema "5 Fehler, die Ihre Website Kunden kosten"
//   node agent.js --thema "Baukasten vs. programmiert" --format einzelbild
//   node agent.js --auto                 # Agent wählt selbst ein frisches Thema
//   node agent.js --plan 12              # Redaktionsplan mit 12 Ideen
//   node agent.js --rendern ausgabe/…/post.json   # bearbeitete post.json neu rendern
//   node agent.js --demo                 # Beispiel-Post rendern, ohne API-Key
import "./src/env.js"; // zuerst: .env laden (ANTHROPIC_API_KEY usw.)
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pruefePost } from "./src/pruefung.js";
import { pruefeLayout, schliessen } from "./src/render.js";
import {
  HIER, AUSGABE, ladeMarke, bisherigeThemen, erstellePost, speicherePost, speichereStories, log,
} from "./src/werkstatt.js";

const { values: arg } = parseArgs({
  options: {
    thema: { type: "string", short: "t" },
    format: { type: "string", short: "f", default: "karussell" },
    folien: { type: "string" },
    notizen: { type: "string", short: "n" },
    auto: { type: "boolean" },
    plan: { type: "string" },
    rendern: { type: "string" },
    runden: { type: "string", default: "3" },
    zielnote: { type: "string", default: "9" },
    demo: { type: "boolean" },
    hilfe: { type: "boolean", short: "h" },
  },
});

async function main() {
  if (arg.hilfe) {
    console.log(`Nutzung:
  node agent.js --thema "…" [--format karussell|einzelbild] [--folien 7] [--notizen "…"]
  node agent.js --auto              Agent wählt ein neues Thema aus den Themen-Säulen
  node agent.js --plan 12           Redaktionsplan (Markdown) mit 12 Ideen
  node agent.js --rendern <post.json>   Bearbeitete post.json neu rendern
  node agent.js --demo              Beispiel-Post + Stories ohne API-Key rendern
Optionen: --runden 3 (max. Überarbeitungen), --zielnote 9
Tägliche Automatik: node taeglich.js --hilfe`);
    return;
  }

  const marke = await ladeMarke();
  await mkdir(AUSGABE, { recursive: true });

  if (arg.demo) {
    const post = JSON.parse(await readFile(path.join(HIER, "beispiele", "demo-post.json"), "utf8"));
    const stories = JSON.parse(await readFile(path.join(HIER, "beispiele", "demo-stories.json"), "utf8"));
    const maengel = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    if (maengel.length) log(`⚠️  Demo-Post hat Mängel:\n   - ${maengel.join("\n   - ")}`);
    const { ordner, bilder } = await speicherePost(post, marke);
    const sBilder = await speichereStories(stories, marke, ordner);
    log(`✅ ${bilder.length} Folien + ${sBilder.length} Stories gerendert → ${path.relative(process.cwd(), ordner)}`);
    return;
  }

  if (arg.rendern) {
    const datei = path.resolve(arg.rendern);
    const post = JSON.parse(await readFile(datei, "utf8"));
    const maengel = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    if (maengel.length) log(`⚠️  Hinweise:\n   - ${maengel.join("\n   - ")}`);
    const { bilder } = await speicherePost(post, marke, {}, path.dirname(datei));
    log(`✅ ${bilder.length} Folien neu gerendert → ${path.relative(process.cwd(), path.dirname(datei))}`);
    return;
  }

  if (arg.plan) {
    const { planeThemen } = await import("./src/claude.js");
    log(`🗓️  Erstelle Redaktionsplan mit ${arg.plan} Ideen …`);
    const { ideen } = await planeThemen(marke, Number(arg.plan), await bisherigeThemen());
    const md = `# Redaktionsplan (${new Date().toLocaleDateString("de-DE")})\n\n` +
      ideen.map((x, i) =>
        `## ${i + 1}. ${x.thema}\n\n- **Säule:** ${x.saeule}\n- **Format:** ${x.format}\n- **Hook:** ${x.hook}\n- **Warum:** ${x.warum}\n\n` +
        "```bash\nnode agent.js --thema " + JSON.stringify(x.thema) + ` --format ${x.format}\n` + "```\n").join("\n");
    const datei = path.join(AUSGABE, `redaktionsplan-${new Date().toISOString().slice(0, 10)}.md`);
    await writeFile(datei, md);
    // Zusätzlich als Warteschlange für die tägliche Automatik nutzbar
    await writeFile(path.join(AUSGABE, "plan-themen.txt"), ideen.map((x) => `${x.format} | ${x.thema}`).join("\n") + "\n");
    log(`✅ Plan gespeichert → ${path.relative(process.cwd(), datei)}`);
    log(`   Tipp: Zeilen aus ausgabe/plan-themen.txt in warteschlange.txt kopieren, dann postet die Automatik sie der Reihe nach.`);
    return;
  }

  let { thema, format } = arg;
  if (!["karussell", "einzelbild"].includes(format)) throw new Error("--format muss „karussell“ oder „einzelbild“ sein.");
  if (arg.auto && !thema) {
    const { planeThemen } = await import("./src/claude.js");
    const [idee] = (await planeThemen(marke, 1, await bisherigeThemen())).ideen;
    ({ thema, format } = idee);
    log(`💡 Gewähltes Thema: ${thema} (${format})`);
  }
  if (!thema) throw new Error('Bitte --thema "…" angeben (oder --auto / --plan / --demo). Hilfe: --hilfe');

  const { post, bewertung } = await erstellePost(marke, {
    thema, format, folien: arg.folien, notizen: arg.notizen, runden: Number(arg.runden), zielnote: Number(arg.zielnote),
  });
  const { ordner, bilder } = await speicherePost(post, marke, { bewertung });
  log(`✅ Fertig: ${bilder.length} Bild(er) + caption.txt → ${path.relative(process.cwd(), ordner)}`);
  console.log(`\n${post.caption.split("\n")[0]}`);
}

main()
  .catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exitCode = 1;
  })
  .finally(schliessen);
