// Rendert die Folien als 1080×1350-PNG (Instagram-Hochformat 4:5) mit Playwright.
// Design orientiert sich am bestehenden Karussell in marketing/instagram-karussell/.
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const B = 1080;
const H = 1350;
const STORY_H = 1920;

// Story-Frame → gleiche Bausteine wie eine Feed-Folie
const STORY_TYP = { teaser: "titel", tipp: "inhalt", fakt: "zahl", frage: "inhalt" };
const alsFolie = (s) => ({ ...s, typ: STORY_TYP[s.typ] ?? "inhalt", punkte: [] });

const feedHtml = (post, marke) => post.folien.map((f, i) => folieHtml(f, i, post.folien.length, marke)).join("\n");
const storyHtml = (stories, marke) =>
  stories.frames.map((s, i) => folieHtml(alsFolie(s), i, stories.frames.length, marke, true)).join("\n");

// Inter lokal einbetten → identisches Ergebnis ohne Internet/Google Fonts.
async function schriften() {
  const css = [];
  for (const w of [400, 500, 600, 800, 900]) {
    const datei = require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff2`);
    const b64 = (await readFile(datei)).toString("base64");
    css.push(`@font-face{font-family:Inter;font-weight:${w};src:url(data:font/woff2;base64,${b64}) format("woff2");}`);
  }
  return css.join("\n");
}

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Je länger die Zeile, desto kleiner die Schrift – verhindert Überlauf schon im Ansatz.
function groesse(text, typ) {
  const n = (text ?? "").length;
  if (typ === "zahl") return n <= 6 ? 260 : n <= 12 ? 170 : 120;
  if (n <= 18) return 112;
  if (n <= 30) return 96;
  if (n <= 45) return 82;
  return 70;
}

function folieHtml(f, i, anzahl, marke, story = false) {
  const d = marke.design;
  const istErste = i === 0 && anzahl > 1 && !story;
  const hGr = groesse(f.headline, f.typ);
  const aGr = f.typ === "zahl" ? 64 : Math.min(hGr, groesse(f.akzent, "titel"));

  const punkte = f.typ === "liste" && f.punkte.length
    ? `<ul class="punkte">${f.punkte.map((p) => `<li><span class="haken">✓</span><span>${esc(p)}</span></li>`).join("")}</ul>`
    : "";

  const unten = story
    ? `<div class="cta-knopf">${esc(f.hinweis)}</div>`
    : istErste
    ? `<div class="wischen"><span class="pfeil">→</span>Wischen</div>`
    : f.typ === "cta"
      ? `<div class="cta-knopf">${esc(marke.website)}</div>`
      : "";

  return `
  <section class="folie typ-${f.typ}${story ? " story" : ""}" style="--h:${hGr}px;--a:${aGr}px">
    <div class="inhalt">
      ${f.eyebrow ? `<div class="eyebrow">${esc(f.eyebrow)}</div>` : ""}
      <h1 class="headline">${esc(f.headline)}</h1>
      ${f.akzent ? `<h2 class="akzent">${esc(f.akzent)}</h2>` : ""}
      ${f.text ? `<p class="text">${esc(f.text)}</p>` : ""}
      ${punkte}
    </div>
    <div class="fuss">
      ${unten}
      <div class="leiste">
        <div class="autor"><span class="badge">${esc(d.kuerzel)}</span>${esc(marke.name)}</div>
        ${anzahl > 1 && !story ? `<div class="seite">${i + 1} / ${anzahl}</div>` : ""}
      </div>
    </div>
  </section>`;
}

async function seitenHtml(abschnitte, marke) {
  const d = marke.design;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${await schriften()}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:#000}
.folie{width:${B}px;height:${H}px;position:relative;overflow:hidden;padding:96px 88px 72px;display:flex;flex-direction:column;
  color:${d.text};background:radial-gradient(1100px 800px at 100% 0%, ${d.verlauf} 0%, ${d.hintergrund} 60%) , ${d.hintergrund}}
.folie::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(600px 600px at 0% 100%, ${d.akzent}14 0%, transparent 70%)}
.inhalt{flex:1;display:flex;flex-direction:column;justify-content:center;gap:0;position:relative;z-index:1;min-height:0}
.eyebrow{color:${d.akzent};font-weight:800;font-size:28px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:56px}
.typ-titel .eyebrow{position:absolute;top:0;left:0}
.headline{font-weight:900;font-size:var(--h);line-height:.98;letter-spacing:-.045em}
.akzent{font-weight:900;font-size:var(--a);line-height:1;letter-spacing:-.045em;color:${d.akzent};margin-top:22px}
.text{color:${d.text_gedimmt};font-size:36px;line-height:1.38;font-weight:400;margin-top:52px;max-width:860px}
.punkte{list-style:none;margin-top:56px;display:flex;flex-direction:column;gap:30px}
.punkte li{display:flex;gap:26px;align-items:flex-start;font-size:38px;line-height:1.3;font-weight:500}
.haken{flex:none;width:52px;height:52px;border-radius:14px;background:${d.akzent};color:${d.hintergrund};
  display:flex;align-items:center;justify-content:center;font-weight:900;font-size:30px;margin-top:-2px}
.typ-zahl .headline{color:${d.akzent};letter-spacing:-.06em}
.typ-zahl .akzent{color:${d.text}}
.typ-cta .headline{font-size:calc(var(--h)*.92)}
.fuss{position:relative;z-index:1;display:flex;flex-direction:column;gap:44px}
.wischen{display:flex;align-items:center;gap:22px;color:${d.akzent};font-weight:700;font-size:34px}
.pfeil{width:72px;height:72px;border-radius:50%;background:${d.akzent};color:${d.hintergrund};display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900}
.cta-knopf{align-self:flex-start;background:${d.akzent};color:${d.hintergrund};font-weight:800;font-size:36px;padding:26px 44px;border-radius:999px}
.leiste{display:flex;justify-content:space-between;align-items:center;color:${d.text_gedimmt};font-size:26px;font-weight:500}
.autor{display:flex;align-items:center;gap:16px}
.story{height:${STORY_H}px;padding:250px 88px 400px}
.story .text{font-size:42px}
.story .eyebrow{position:static}
.badge{width:40px;height:40px;border-radius:9px;background:${d.badge};color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:22px}
</style></head><body>
${abschnitte}
</body></html>`;
}

// Prüft, ob Text über den Folienrand hinausläuft. Liefert eine Mängelliste.
async function ueberlauf(page) {
  return page.$$eval(".folie", (folien) =>
    folien.flatMap((f, i) => {
      const inhalt = f.querySelector(".inhalt");
      const zuHoch = inhalt.scrollHeight > inhalt.clientHeight + 2;
      const zuBreit = [...f.querySelectorAll("h1,h2")].some((h) => h.scrollWidth > h.clientWidth + 2);
      return zuHoch || zuBreit
        ? [`Folie ${i + 1}: Text passt nicht auf die Folie (${zuHoch ? "zu viel Text" : "Wort zu lang für eine Zeile"}) – kürzen.`]
        : [];
    })
  );
}

let browser;
async function seite(abschnitte, marke) {
  browser ??= await chromium.launch();
  const page = await browser.newPage({ viewport: { width: B, height: STORY_H }, deviceScaleFactor: 1 });
  await page.setContent(await seitenHtml(abschnitte, marke), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function pruefe(abschnitte, marke, name) {
  const page = await seite(abschnitte, marke);
  try {
    return (await ueberlauf(page)).map((m) => m.replace(/^Folie/, name));
  } finally {
    await page.close();
  }
}

export const pruefeLayout = (post, marke) => pruefe(feedHtml(post, marke), marke, "Folie");
export const pruefeStoryLayout = (stories, marke) => pruefe(storyHtml(stories, marke), marke, "Story");

// Schreibt PNG (zum Ansehen/manuellen Posten) und JPEG (die Instagram-API akzeptiert nur JPEG).
async function fotografiere(abschnitte, marke, ordner, praefix) {
  await mkdir(ordner, { recursive: true });
  const page = await seite(abschnitte, marke);
  const png = [];
  const jpg = [];
  try {
    const els = await page.$$(".folie");
    for (let i = 0; i < els.length; i++) {
      const basis = path.join(ordner, `${praefix}-${i + 1}`);
      await els[i].screenshot({ path: `${basis}.png` });
      await els[i].screenshot({ path: `${basis}.jpg`, type: "jpeg", quality: 92 });
      png.push(`${basis}.png`);
      jpg.push(`${basis}.jpg`);
    }
    await writeFile(path.join(ordner, `${praefix}-vorschau.html`), await page.content());
  } finally {
    await page.close();
  }
  return { png, jpg };
}

// Rückgabe: PNG-Pfade als Array, die JPEG-Pfade hängen als .jpg daran
export async function rendere(post, marke, ordner) {
  const { png, jpg } = await fotografiere(feedHtml(post, marke), marke, ordner, "folie");
  return Object.assign(png, { jpg });
}

export async function rendereStories(stories, marke, ordner) {
  const { png, jpg } = await fotografiere(storyHtml(stories, marke), marke, ordner, "story");
  return Object.assign(png, { jpg });
}

export async function schliessen() {
  await browser?.close();
  browser = undefined;
}
