#!/usr/bin/env node
// Macht Screenshots deiner Projekt-Websites (Desktop + Handy) für die Projekt-Folien.
// Die Liste kommt aus marke.json (referenzen + projekte_in_arbeit, jeweils mit "url" und "kuerzel").
//
//   node screenshots.js              alle Projekte
//   node screenshots.js safari-adventure-tour   nur eins
//
// Ergebnis: projekte/<kuerzel>/desktop.jpg und mobil.jpg (werden ins Repo eingecheckt,
// damit der Server beim täglichen Posten nicht erst fremde Websites abrufen muss).
import "./src/env.js";
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { HIER, ladeMarke, log } from "./src/werkstatt.js";

export const PROJEKT_ORDNER = path.join(HIER, "projekte");

// Häufige Cookie-Banner wegklicken, damit sie nicht das Bild verdecken
const COOKIE_TEXTE = /^(alle akzeptieren|akzeptieren|alle cookies akzeptieren|zustimmen|einverstanden|accept all|accept|i agree|got it|ok|allow all)$/i;

async function bannerWeg(page) {
  for (const rolle of ["button", "link"]) {
    const knopf = page.getByRole(rolle, { name: COOKIE_TEXTE }).first();
    if (await knopf.isVisible().catch(() => false)) {
      await knopf.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(800);
      return true;
    }
  }
  // Fallback: Banner nicht anklicken (manche Seiten springen dabei woanders hin), sondern ausblenden
  return page.evaluate(() => {
    let weg = false;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if ((cs.position === "fixed" || cs.position === "sticky") && /cookie|datenschutz|einwillig|consent|privacy/i.test(el.innerText || "")
          && el.getBoundingClientRect().height < window.innerHeight * 0.6) {
        el.style.setProperty("display", "none", "important");
        weg = true;
      }
    }
    return weg;
  });
}

// Viele Seiten blenden Inhalte erst beim Scrollen ein (Lazy-Loading, Einblend-Animationen).
async function einmalDurchscrollen(page) {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < Math.min(h, 6000); y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    // Sofort nach oben – manche Seiten scrollen sonst „weich“ und stehen beim Foto noch unten
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
}

// Erkennt (fast) leere Bilder: kaum unterschiedliche Pixel = Seite noch nicht geladen
async function istLeer(page) {
  const buf = await page.screenshot({ type: "png", scale: "css", clip: { x: 0, y: 0, width: 300, height: 300 } });
  return new Set(buf.subarray(0, 4000).toString("hex").match(/.{8}/g)).size < 40;
}

async function fotografiere(browser, url, datei, kontextOptionen) {
  const ctx = await browser.newContext({ ...kontextOptionen, ignoreHTTPSErrors: true, locale: "de-DE" });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(2500);
    await bannerWeg(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    if (await istLeer(page)) {
      // Nur wenn nötig: Inhalte durch Scrollen einblenden, dann auf langsame Seiten warten
      await einmalDurchscrollen(page);
      for (let i = 0; i < 3 && (await istLeer(page)); i++) await page.waitForTimeout(4000);
      await bannerWeg(page);
    }
    await page.screenshot({ path: datei, type: "jpeg", quality: 85 });
  } finally {
    await ctx.close();
  }
}

export async function alleProjekte(marke) {
  return [...(marke.referenzen ?? []), ...(marke.projekte_in_arbeit?.liste ?? [])].filter((p) => p.url && p.kuerzel);
}

async function main() {
  const marke = await ladeMarke();
  const nur = process.argv[2];
  const projekte = (await alleProjekte(marke)).filter((p) => !nur || p.kuerzel === nur);
  if (!projekte.length) throw new Error(nur ? `Kein Projekt mit Kürzel „${nur}“ in marke.json.` : "Keine Projekte mit url/kuerzel in marke.json.");

  const browser = await chromium.launch({
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  });
  let fehler = 0;
  try {
    for (const p of projekte) {
      const ordner = path.join(PROJEKT_ORDNER, p.kuerzel);
      await mkdir(ordner, { recursive: true });
      try {
        await fotografiere(browser, p.url, path.join(ordner, "desktop.jpg"), { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
        await fotografiere(browser, p.url, path.join(ordner, "mobil.jpg"), { ...devices["iPhone 13"] });
        log(`📸 ${p.name}`);
      } catch (e) {
        fehler++;
        log(`⚠️  ${p.name}: ${e.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
  log(`✅ Fertig → ${path.relative(process.cwd(), PROJEKT_ORDNER)}/ (bitte jedes Bild kurz ansehen, bevor es gepostet wird)`);
  if (fehler) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(`❌ ${e.message}`); process.exitCode = 1; });
