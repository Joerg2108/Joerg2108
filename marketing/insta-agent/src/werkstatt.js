// Gemeinsame Bausteine für agent.js (manuell) und taeglich.js (Automatik):
// Post/Stories erstellen inkl. Prüf- und Überarbeitungsschleife, Ergebnisse speichern, Verlauf führen.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pruefePost, pruefeStories } from "./pruefung.js";
import { rendere, rendereStories, pruefeLayout, pruefeStoryLayout } from "./render.js";

export const HIER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUSGABE = process.env.INSTA_AUSGABE || path.join(HIER, "ausgabe");
const VERLAUF = path.join(AUSGABE, "verlauf.json");

export const log = (...a) => console.log(`[${new Date().toLocaleTimeString("de-DE")}]`, ...a);

export const heute = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }); // JJJJ-MM-TT

export const slug = (s) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

export async function ladeMarke() {
  return JSON.parse(await readFile(path.join(HIER, "marke.json"), "utf8"));
}

export async function ladeJson(datei, standard) {
  return existsSync(datei) ? JSON.parse(await readFile(datei, "utf8")) : standard;
}

export async function speichereJson(datei, daten) {
  await mkdir(path.dirname(datei), { recursive: true });
  await writeFile(datei, JSON.stringify(daten, null, 2));
}

export const ladeVerlauf = () => ladeJson(VERLAUF, []);
export const bisherigeThemen = async () => (await ladeVerlauf()).map((v) => v.thema);

export const tagesOrdner = (thema) => path.join(AUSGABE, `${heute()}-${slug(thema)}`);

// Speichert einen Feed-Post: PNG + JPEG, caption.txt, post.json, README.md, Verlaufseintrag.
export async function speicherePost(post, marke, extra = {}, ordner = tagesOrdner(post.thema)) {
  const bilder = await rendere(post, marke, ordner);
  const hashtags = post.hashtags.join(" ");
  await writeFile(path.join(ordner, "caption.txt"), volleCaption(post));
  await speichereJson(path.join(ordner, "post.json"), { ...post, ...extra });
  await writeFile(
    path.join(ordner, "README.md"),
    `# ${post.thema}\n\n**Format:** ${post.format} · ${bilder.length} Bild(er)\n\n` +
      `## Caption\n\n${post.caption}\n\n## Hashtags\n\n${hashtags}\n\n## Alt-Text\n\n${post.alt_text}\n\n` +
      `## Posting-Tipp\n\n${post.posting_tipp}\n` +
      (extra.bewertung ? `\n## Qualität\n\nNote des Creative Directors: **${extra.bewertung}/10**\n` : "")
  );
  const verlauf = await ladeVerlauf();
  verlauf.push({ datum: heute(), thema: post.thema, format: post.format, ordner: path.relative(AUSGABE, ordner) });
  await speichereJson(VERLAUF, verlauf);
  return { ordner, bilder };
}

export const volleCaption = (post) => `${post.caption}\n.\n.\n.\n${post.hashtags.join(" ")}`;

// Der eigentliche Agent: schreiben → prüfen (Regeln + Layout) → kritisieren/überarbeiten → bis gut genug.
export async function erstellePost(marke, { thema, format, folien, notizen, runden = 3, zielnote = 9 }) {
  const { schreibePost, ueberarbeite, MODELL } = await import("./claude.js");
  const bisherige = await bisherigeThemen();

  log(`✍️  Schreibe Entwurf mit ${MODELL} …`);
  let post = await schreibePost(marke, { thema, format, folien, notizen, bisherige });
  let bewertung = 0;
  let offen = [];

  for (let r = 1; r <= runden; r++) {
    const maengel = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    log(`🔎 Runde ${r}: ${maengel.length} Mängel${maengel.length ? ` – z. B. „${maengel[0]}“` : ""}`);
    const review = await ueberarbeite(marke, post, maengel);
    bewertung = review.bewertung;
    post = review.post;
    log(`🎯 Creative Director: ${bewertung}/10${review.kritik.length ? ` – ${review.kritik.slice(0, 2).join(" | ")}` : ""}`);

    offen = [...pruefePost(post), ...(await pruefeLayout(post, marke))];
    if (!offen.length && bewertung >= zielnote) break;
  }
  if (offen.length) log(`⚠️  Noch offen:\n   - ${offen.join("\n   - ")}`);
  return { post, bewertung, offen };
}

// Stories: schreiben → prüfen → bei Mängeln nachbessern (max. 3 Versuche).
export async function erstelleStories(marke, { post, anzahl = 2 }) {
  const { schreibeStories } = await import("./claude.js");
  let stories = await schreibeStories(marke, { post, anzahl });
  let offen = [];
  for (let r = 1; r <= 3; r++) {
    offen = [...pruefeStories(stories, anzahl), ...(await pruefeStoryLayout(stories, marke))];
    if (!offen.length) break;
    log(`🔎 Stories Runde ${r}: ${offen.length} Mängel – überarbeite …`);
    stories = await schreibeStories(marke, { post, anzahl, maengel: offen, vorher: stories });
  }
  offen = [...pruefeStories(stories, anzahl), ...(await pruefeStoryLayout(stories, marke))];
  return { stories, offen };
}

export async function speichereStories(stories, marke, ordner) {
  const bilder = await rendereStories(stories, marke, ordner);
  await speichereJson(path.join(ordner, "stories.json"), stories);
  return bilder;
}
