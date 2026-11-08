#!/usr/bin/env node
// Screenshots aus den Back-Office-Demos (lokal gestartet) für die Back-Office-Beiträge.
//   Demo Dienstleistung:  DEMO_MODE=1 DATA_DIR=… PORT=3104 node src/server.js
//   Demo Sicherheit:      DEMO_MODE=1 SECURITY_EDITION=1 DATA_DIR=… PORT=3105 node src/server.js
//   node backoffice-screenshots.js [http://localhost:3104] [http://localhost:3105]
// Ergebnis: projekte/bo-<ansicht>/desktop.jpg + mobil.jpg (für den Folientyp „projekt“)
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { HIER } from "./src/werkstatt.js";

const D = process.argv[2] || "http://localhost:3104";
const S = process.argv[3] || "http://localhost:3105";

const ANSICHTEN = [
  // [kürzel, basis, pfad, rolle (0 = Geschäftsführung, 2 = Mitarbeiter)]
  ["bo-dashboard", D, "/", 0],
  ["bo-rechnungen", D, "/belege/rechnungen", 0],
  ["bo-mahnwesen", D, "/belege/mahnwesen", 0],
  ["bo-anfragen", D, "/anfragen", 0],
  ["bo-dienstplan", D, "/dienstplan", 0],
  ["bo-auswertung", D, "/dienstplan/auswertung", 0],
  ["bo-wiederkehrend", D, "/belege/wiederkehrend", 0],
  ["bo-projekte", D, "/projekte", 0],
  ["bo-berichte", D, "/berichte", 0],
  ["bo-benutzer", D, "/admin/benutzer", 0],
  ["bo-lage", S, "/lage", 0],
  ["bo-objekte", S, "/objekte", 0],
  ["bo-vorfaelle", S, "/vorfaelle", 0],
  ["bo-personal", S, "/personal", 0],
  ["bo-fahrzeuge", S, "/fahrzeuge", 0],
  ["bo-waechter", S, "/waechter", 2],
  ["bo-streife", S, "/waechter/streife", 2],
];

async function anmelden(page, basis, rolle) {
  await page.goto(`${basis}/login`);
  await page.locator("button.demo-account").nth(rolle).click();
  await page.waitForLoadState("networkidle");
}

async function aufraeumen(page) {
  await page.evaluate(() => document.querySelectorAll(".demo-banner").forEach((e) => e.remove()));
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
try {
  for (const art of ["desktop", "mobil"]) {
    const kontexte = new Map();
    for (const [kuerzel, basis, pfad, rolle] of ANSICHTEN) {
      const schluessel = `${basis}|${rolle}`;
      if (!kontexte.has(schluessel)) {
        const ctx = await browser.newContext(
          art === "desktop" ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 } : { ...devices["iPhone 13"] }
        );
        const page = await ctx.newPage();
        await anmelden(page, basis, rolle);
        kontexte.set(schluessel, page);
      }
      const page = kontexte.get(schluessel);
      const res = await page.goto(`${basis}${pfad}`);
      await page.waitForLoadState("networkidle");
      await aufraeumen(page);
      const ordner = path.join(HIER, "projekte", kuerzel);
      await mkdir(ordner, { recursive: true });
      await page.screenshot({ path: path.join(ordner, `${art}.jpg`), type: "jpeg", quality: 88 });
      console.log(`${res.status()} ${art} ${kuerzel}`);
    }
    for (const p of kontexte.values()) await p.context().close();
  }
} finally {
  await browser.close();
}
