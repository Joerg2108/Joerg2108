// Rendert die Folien als 1080×1350-PNG (Instagram-Hochformat 4:5) und Stories als 1080×1920 mit Playwright.
// Design wie joerg-noack.com: fast schwarz, Gold, Überschriften in Playfair Display, Text in Manrope.
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const B = 1080;
const H = 1350;
const STORY_H = 1920;

// Story-Frame → gleiche Bausteine wie eine Feed-Folie
const STORY_TYP = { teaser: "titel", tipp: "inhalt", fakt: "zahl", frage: "inhalt", projekt: "projekt" };

// Screenshots der Kundenprojekte (erzeugt mit: node screenshots.js) als data-URL einbetten
const PROJEKTE = new URL("../projekte/", import.meta.url);
const bildCache = new Map();
function projektBild(kuerzel, art) {
  const url = new URL(`${kuerzel}/${art}.jpg`, PROJEKTE);
  const schluessel = url.href;
  if (!bildCache.has(schluessel)) {
    bildCache.set(schluessel, existsSync(url) ? `data:image/jpeg;base64,${readFileSync(url).toString("base64")}` : "");
  }
  return bildCache.get(schluessel);
}

function domainVon(marke, kuerzel) {
  const p = [...(marke.referenzen ?? []), ...(marke.projekte_in_arbeit?.liste ?? [])].find((x) => x.kuerzel === kuerzel);
  try {
    return p?.url ? new URL(p.url).hostname.replace(/^www\./, "") : kuerzel;
  } catch {
    return kuerzel;
  }
}

function mockupHtml(f, marke, story) {
  if (f.typ !== "projekt" || !f.projekt) return "";
  const desktop = projektBild(f.projekt, "desktop");
  const mobil = projektBild(f.projekt, "mobil");
  return `<div class="mockup">
    ${story ? "" : `<div class="browser"><div class="browserleiste"><i></i><i></i><i></i><span>${esc(domainVon(marke, f.projekt))}</span></div>
      <img src="${desktop}" alt=""></div>`}
    <div class="handy"><img src="${mobil}" alt=""></div>
  </div>`;
}
const alsFolie = (s) => ({ ...s, typ: STORY_TYP[s.typ] ?? "inhalt", punkte: [] });

const feedHtml = (post, marke) => post.folien.map((f, i) => folieHtml(f, i, post.folien.length, marke)).join("\n");
const storyHtml = (stories, marke) =>
  stories.frames.map((s, i) => folieHtml(alsFolie(s), i, stories.frames.length, marke, true)).join("\n");

// Schriften lokal einbetten → identisches Ergebnis ohne Internet und ohne Google-Fonts-Abruf.
const SCHRIFTEN = [
  ["Playfair Display", "playfair-display", [[500, "normal"], [600, "normal"], [700, "normal"], [500, "italic"], [600, "italic"]]],
  ["Manrope", "manrope", [[300, "normal"], [400, "normal"], [500, "normal"], [600, "normal"], [700, "normal"]]],
];
let schriftCss;
async function schriften() {
  if (schriftCss) return schriftCss;
  const css = [];
  for (const [familie, paket, schnitte] of SCHRIFTEN) {
    for (const [w, stil] of schnitte) {
      const datei = require.resolve(`@fontsource/${paket}/files/${paket}-latin-${w}-${stil}.woff2`);
      const b64 = (await readFile(datei)).toString("base64");
      css.push(`@font-face{font-family:"${familie}";font-weight:${w};font-style:${stil};src:url(data:font/woff2;base64,${b64}) format("woff2");}`);
    }
  }
  return (schriftCss = css.join("\n"));
}

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Je länger die Zeile, desto kleiner die Schrift – verhindert Überlauf schon im Ansatz.
function groesse(text, typ) {
  const n = (text ?? "").length;
  if (typ === "zahl") return n <= 6 ? 250 : n <= 12 ? 165 : 115;
  if (n <= 18) return 108;
  if (n <= 30) return 92;
  if (n <= 45) return 78;
  return 66;
}

function folieHtml(f, i, anzahl, marke, story = false) {
  const d = marke.design;
  const istErste = i === 0 && anzahl > 1 && !story;
  const hGr = Math.round(groesse(f.headline, f.typ) * (f.typ === "projekt" ? 0.8 : 1));
  const aGr = f.typ === "zahl" ? 62 : Math.round(Math.min(hGr, groesse(f.akzent, "titel")) * 0.82);

  const punkte = f.typ === "liste" && f.punkte.length
    ? `<ul class="punkte">${f.punkte.map((p, j) => `<li><span class="nr">${String(j + 1).padStart(2, "0")}</span><span>${esc(p)}</span></li>`).join("")}</ul>`
    : "";

  const unten = story
    ? `<div class="cta-knopf">${esc(f.hinweis)}</div>`
    : istErste
    ? `<div class="wischen">Wischen <span class="pfeil">→</span></div>`
    : f.typ === "cta"
      ? `<div class="cta-knopf">${esc(marke.website)}</div>`
      : "";

  return `
  <section class="folie typ-${f.typ}${story ? " story" : ""}" style="--h:${hGr}px;--a:${aGr}px">
    <div class="linie"></div>
    <div class="inhalt">
      ${f.eyebrow ? `<div class="eyebrow">${esc(f.eyebrow)}</div>` : ""}
      <h1 class="headline">${esc(f.headline)}</h1>
      ${f.akzent ? `<h2 class="akzent">${esc(f.akzent)}</h2>` : ""}
      ${f.text ? `<p class="text">${esc(f.text)}</p>` : ""}
      ${punkte}
      ${mockupHtml(f, marke, story)}
    </div>
    <div class="fuss">
      ${unten}
      <div class="leiste">
        <div class="autor"><span class="badge">${esc(d.kuerzel)}</span>
          <span class="logo"><b>${esc(marke.name)}</b><small>${esc((marke.marke ?? "").split("·")[1]?.trim() ?? "")}</small></span></div>
        ${anzahl > 1 && !story ? `<div class="seite">${String(i + 1).padStart(2, "0")} / ${String(anzahl).padStart(2, "0")}</div>` : ""}
      </div>
    </div>
  </section>`;
}

async function seitenHtml(abschnitte, marke) {
  const d = marke.design;
  const titel = `"${d.schrift_titel ?? "Playfair Display"}", Georgia, serif`;
  const text = `"${d.schrift_text ?? "Manrope"}", system-ui, sans-serif`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${await schriften()}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${text};background:#000}
.folie{width:${B}px;height:${H}px;position:relative;overflow:hidden;padding:104px 96px 76px 120px;display:flex;flex-direction:column;
  color:${d.text};background:radial-gradient(1000px 760px at 100% 0%, ${d.verlauf} 0%, ${d.hintergrund} 62%), ${d.hintergrund}}
.folie::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(700px 600px at 0% 100%, ${d.akzent}12 0%, transparent 70%)}
/* feine Goldlinie links wie auf der Website */
.linie{position:absolute;left:56px;top:0;bottom:0;width:2px;background:linear-gradient(${d.akzent}00, ${d.akzent}aa 30%, ${d.akzent}55 80%, ${d.akzent}00)}
.linie::after{content:"";position:absolute;left:-5px;top:30%;width:12px;height:12px;border-radius:50%;background:${d.akzent};box-shadow:0 0 18px ${d.akzent}}
.inhalt{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1;min-height:0}
.eyebrow{display:flex;align-items:center;gap:22px;color:${d.akzent};font-weight:500;font-size:24px;letter-spacing:.32em;text-transform:uppercase;margin-bottom:54px}
.eyebrow::before{content:"";width:64px;height:2px;background:${d.akzent};flex:none}
.typ-titel .eyebrow{position:absolute;top:0;left:0}
.headline{font-family:${titel};font-weight:600;font-size:var(--h);line-height:1.04;letter-spacing:-.012em}
.akzent{font-family:${titel};font-style:italic;font-weight:500;font-size:var(--a);line-height:1.12;color:${d.akzent};margin-top:26px}
.text{color:${d.text_gedimmt};font-size:35px;line-height:1.5;font-weight:300;margin-top:50px;max-width:840px}
.punkte{list-style:none;margin-top:56px;display:flex;flex-direction:column;gap:30px}
.punkte li{display:flex;gap:30px;align-items:baseline;font-size:37px;line-height:1.35;font-weight:400;padding-bottom:26px;border-bottom:1px solid ${d.akzent}33}
.nr{flex:none;font-family:${titel};font-style:italic;color:${d.akzent};font-size:40px;min-width:56px}
.typ-zahl .headline{color:${d.akzent};letter-spacing:-.02em;line-height:1}
.typ-zahl .akzent{color:${d.text};font-style:normal;font-weight:600}
.typ-cta .headline{font-size:calc(var(--h)*.95)}
.fuss{position:relative;z-index:1;display:flex;flex-direction:column;gap:46px}
.wischen{display:flex;align-items:center;gap:20px;color:${d.akzent};font-weight:500;font-size:26px;letter-spacing:.3em;text-transform:uppercase}
.pfeil{width:64px;height:64px;border:2px solid ${d.akzent};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;letter-spacing:0}
.cta-knopf{align-self:flex-start;background:${d.akzent};color:${d.hintergrund};font-weight:600;font-size:30px;letter-spacing:.14em;text-transform:uppercase;padding:28px 46px}
.leiste{display:flex;justify-content:space-between;align-items:center;color:${d.text_gedimmt};font-size:24px;font-weight:500;letter-spacing:.12em}
.autor{display:flex;align-items:center;gap:20px}
.badge{width:62px;height:62px;border-radius:50%;border:2px solid ${d.akzent};color:${d.akzent};font-family:${titel};font-weight:600;
  display:flex;align-items:center;justify-content:center;font-size:24px;letter-spacing:0;box-shadow:0 0 22px ${d.akzent}40}
.logo{display:flex;flex-direction:column;gap:4px;line-height:1}
.logo b{font-family:${titel};font-weight:600;color:${d.text};font-size:26px;letter-spacing:.16em;text-transform:uppercase}
.logo small{color:${d.akzent};font-size:15px;letter-spacing:.34em;text-transform:uppercase}
/* Projekt-Folie: Text oben, Browser + Handy darunter */
.typ-projekt .inhalt{justify-content:flex-start}
.typ-projekt .eyebrow{margin-bottom:40px}
.typ-projekt .akzent{margin-top:16px}
.typ-projekt .text{margin-top:26px;font-size:30px}
.mockup{position:relative;margin-top:auto;height:600px;flex:none}
.browser{position:absolute;left:0;top:0;width:740px;border-radius:14px;overflow:hidden;background:#15110b;
  border:1px solid ${d.akzent}55;box-shadow:0 30px 70px #000c, 0 0 40px ${d.akzent}22}
.browserleiste{height:42px;display:flex;align-items:center;gap:9px;padding:0 18px;background:#1c170f;border-bottom:1px solid ${d.akzent}33}
.browserleiste i{width:12px;height:12px;border-radius:50%;background:${d.akzent}66}
.browserleiste span{margin-left:18px;font-size:18px;color:${d.text_gedimmt};letter-spacing:.04em}
.browser img{display:block;width:100%;height:462px;object-fit:cover;object-position:top}
.handy{position:absolute;right:0;bottom:0;width:250px;height:520px;border-radius:42px;overflow:hidden;background:#000;
  border:10px solid #1c170f;box-shadow:0 0 0 2px ${d.akzent}88, 0 30px 70px #000d}
.handy img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.story.typ-projekt .mockup{height:780px;margin-top:40px}
.story .handy{left:50%;right:auto;transform:translateX(-50%);width:380px;height:770px;border-radius:54px;border-width:12px}
.story{height:${STORY_H}px;padding:250px 96px 400px 120px}
.story .text{font-size:42px}
.story .eyebrow{position:static}
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
