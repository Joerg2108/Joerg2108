#!/usr/bin/env node
// Instagram-Agent für Jörg Noack – hochwertige Posts zum Angebot „Webseiten-Erstellung“.
//
//   node agent.js --thema "5 Fehler, die Ihre Website Kunden kosten"
//   node agent.js --thema "Baukasten vs. programmiert" --format einzelbild
//   node agent.js --auto                 # Agent wählt selbst ein frisches Thema
//   node agent.js --plan 12              # Redaktionsplan mit 12 Ideen
//   node agent.js --demo                 # Beispiel-Post rendern, ohne API-Key
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pruefePost } from "./src/pruefung.js";
import { rendere, pruefeLayout, schliessen } from "./src/render.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const AUSGABE = path.join(HIER, "ausgabe");
const VERLAUF = path.join(AUSGABE, "verlauf.json");

const { values: arg } = parseArgs({
  options: {
    thema: { type: "string", short: "t" },
    format: { type: "string", short: "f", default: "karussell" },
    folien: { type: "string" },
    notizen: { type: "string", short: "n" },
    auto: { type: "boolean" },
    plan: { type: "string" },
    runden: { type: "string", default: "3" },
    zielnote: { type: "string", default: "9" },
    demo: { type: "boolean" },
    hilfe: { type: "boolean", short: "h" },
  },
});

const log = (...a) => console.log(...a);
const slug = (s) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

async function ladeVerlauf() {
  return existsSync(VERLAUF) ? JSON.parse(await readFile(VERLAUF, "utf8")) : [];
}

async function speichere(post, marke, extra = {}) {
  const datum = new Date().toISOString().slice(0, 10);
  const ordner = path.join(AUSGABE, `${datum}-${slug(post.thema)}`);
  const bilder = await rendere(post, marke, ordner);
  const hashtags = post.hashtags.join(" ");
  // Fertig zum Kopieren: Caption + Hashtags (durch Leerzeilen-Punkte getrennt, wie viele Creator es machen)
  await writeFile(path.join(ordner, "caption.txt"), `${post.caption}\n.\n.\n.\n${hashtags}\n`);
  await writeFile(path.join(ordner, "post.json"), JSON.stringify({ ...post, ...extra }, null, 2));
  await writeFile(
    path.join(ordner, "README.md"),
    `# ${post.thema}\n\n**Format:** ${post.format} · ${bilder.length} Bild(er)\n\n` +
      `## Caption\n\n${post.caption}\n\n## Hashtags\n\n${hashtags}\n\n## Alt-Text\n\n${post.alt_text}\n\n` +
      `## Posting-Tipp\n\n${post.posting_tipp}\n` +
      (extra.bewertung ? `\n## Qualität\n\nNote des Creative Directors: **${extra.bewertung}/10**\n` : "")
  );
  const verlauf = await ladeVerlauf();
  verlauf.push({ datum, thema: post.thema, format: post.format, ordner: path.relative(HIER, ordner) });
  await writeFile(VERLAUF, JSON.stringify(verlauf, null, 2));
  return { ordner, bilder };
}

// Der eigentliche Agent: schreiben → prüfen (Regeln + Layout) → kritisieren/überarbeiten → bis gut genug.
async function erstellePost(marke, { thema, format, folien, notizen }) {
  const { schreibePost, ueberarbeite, MODELL } = await import("./src/claude.js");
  const bisherige = (await ladeVerlauf()).map((v) => v.thema);
  const runden = Number(arg.runden);
  const zielnote = Number(arg.zielnote);

  log(`✍️  Schreibe Entwurf mit ${MODELL} …`);
  let post = await schreibePost(marke, { thema, format, folien, notizen, bisherige });
  let bewertung = 0;

  for (let r = 1; r <= runden; r++) {
    const maengel = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    log(`🔎 Runde ${r}: ${maengel.length} Mängel gefunden${maengel.length ? ` – z. B. „${maengel[0]}“` : ""}`);
    const review = await ueberarbeite(marke, post, maengel);
    bewertung = review.bewertung;
    post = review.post;
    log(`🎯 Creative Director: ${bewertung}/10${review.kritik.length ? ` – ${review.kritik.slice(0, 2).join(" | ")}` : ""}`);

    const rest = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    if (!rest.length && bewertung >= zielnote) break;
    if (r === runden && rest.length) log(`⚠️  Nach ${runden} Runden noch offen:\n   - ${rest.join("\n   - ")}`);
  }
  return { post, bewertung };
}

async function main() {
  if (arg.hilfe) {
    log(`Nutzung:
  node agent.js --thema "…" [--format karussell|einzelbild] [--folien 7] [--notizen "…"]
  node agent.js --auto              Agent wählt ein neues Thema aus den Themen-Säulen
  node agent.js --plan 12           Redaktionsplan (Markdown) mit 12 Ideen
  node agent.js --demo              Beispiel-Post ohne API-Key rendern
Optionen: --runden 3 (max. Überarbeitungen), --zielnote 9`);
    return;
  }

  const marke = JSON.parse(await readFile(path.join(HIER, "marke.json"), "utf8"));
  await mkdir(AUSGABE, { recursive: true });

  if (arg.demo) {
    const post = JSON.parse(await readFile(path.join(HIER, "beispiele", "demo-post.json"), "utf8"));
    const maengel = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    if (maengel.length) log(`⚠️  Demo-Post hat Mängel:\n   - ${maengel.join("\n   - ")}`);
    const { ordner, bilder } = await speichere(post, marke);
    log(`✅ ${bilder.length} Folien gerendert → ${path.relative(process.cwd(), ordner)}`);
    return;
  }

  if (arg.plan) {
    const { planeThemen } = await import("./src/claude.js");
    const bisherige = (await ladeVerlauf()).map((v) => v.thema);
    log(`🗓️  Erstelle Redaktionsplan mit ${arg.plan} Ideen …`);
    const { ideen } = await planeThemen(marke, Number(arg.plan), bisherige);
    const md = `# Redaktionsplan (${new Date().toLocaleDateString("de-DE")})\n\n` +
      ideen.map((x, i) =>
        `## ${i + 1}. ${x.thema}\n\n- **Säule:** ${x.saeule}\n- **Format:** ${x.format}\n- **Hook:** ${x.hook}\n- **Warum:** ${x.warum}\n\n` +
        "```bash\nnode agent.js --thema " + JSON.stringify(x.thema) + ` --format ${x.format}\n` + "```\n").join("\n");
    const datei = path.join(AUSGABE, `redaktionsplan-${new Date().toISOString().slice(0, 10)}.md`);
    await writeFile(datei, md);
    log(`✅ Plan gespeichert → ${path.relative(process.cwd(), datei)}`);
    return;
  }

  let { thema, format } = arg;
  if (!["karussell", "einzelbild"].includes(format)) throw new Error("--format muss „karussell“ oder „einzelbild“ sein.");
  if (arg.auto && !thema) {
    const { planeThemen } = await import("./src/claude.js");
    const bisherige = (await ladeVerlauf()).map((v) => v.thema);
    const [idee] = (await planeThemen(marke, 1, bisherige)).ideen;
    ({ thema, format } = idee);
    log(`💡 Gewähltes Thema: ${thema} (${format})`);
  }
  if (!thema) throw new Error('Bitte --thema "…" angeben (oder --auto / --plan / --demo). Hilfe: --hilfe');

  const { post, bewertung } = await erstellePost(marke, { thema, format, folien: arg.folien, notizen: arg.notizen });
  const { ordner, bilder } = await speichere(post, marke, { bewertung });
  log(`\n✅ Fertig: ${bilder.length} Bild(er) + caption.txt → ${path.relative(process.cwd(), ordner)}`);
  log(`\n${post.caption.split("\n")[0]}`);
}

main()
  .catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exitCode = 1;
  })
  .finally(schliessen);
