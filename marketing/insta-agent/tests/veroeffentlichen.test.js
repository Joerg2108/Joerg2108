// End-to-End-Test der Veröffentlichung gegen einen nachgebauten Instagram-Server.
// Prüft: Hosting (Ordner + Webserver), Token-Erneuerung, Karussell-/Story-Ablauf, Fehlerbehandlung.
// Start: npm test   (braucht keinen API-Key und kein Instagram-Konto)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const aufrufe = [];
let medienZaehler = 0;
let server;
let tmp;

before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "insta-test-"));
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    // Bild-Hosting (wie Caddy file_server)
    if (url.pathname.startsWith("/bilder/")) {
      try {
        const daten = await readFile(path.join(tmp, "public", url.pathname.slice(8)));
        res.writeHead(200, { "content-type": "image/jpeg" });
        return res.end(req.method === "HEAD" ? undefined : daten);
      } catch {
        res.writeHead(404);
        return res.end();
      }
    }
    let body = "";
    for await (const c of req) body += c;
    const p = Object.fromEntries(new URLSearchParams(req.method === "GET" ? url.search : body));
    aufrufe.push({ methode: req.method, pfad: url.pathname, p });
    const json = (o, s = 200) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };

    if (url.pathname === "/refresh_access_token") return json({ access_token: "NEU", expires_in: 5184000 });
    if (url.pathname === "/v24.0/me") return json({ user_id: "4711", username: "test" });
    if (url.pathname === "/v24.0/4711/media") {
      if (p.access_token !== "NEU") return json({ error: { message: "falsches Token", code: 190 } }, 400);
      if (p.alt_text) return json({ error: { message: "Unsupported parameter alt_text", code: 100 } }, 400);
      return json({ id: `c${++medienZaehler}` });
    }
    if (url.pathname === "/v24.0/4711/media_publish") return json({ id: `m-${p.creation_id}` });
    if (/^\/v24\.0\/c\d+$/.test(url.pathname)) return json({ status_code: "FINISHED" });
    if (/^\/v24\.0\/m-/.test(url.pathname)) return json({ permalink: "https://instagram.com/p/xyz" });
    json({ error: { message: `unbekannt ${url.pathname}` } }, 404);
  });
  await new Promise((r) => server.listen(0, r));
  const basis = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, {
    INSTA_AUSGABE: path.join(tmp, "ausgabe"),
    INSTAGRAM_API_HOST: basis,
    INSTAGRAM_ACCESS_TOKEN: "ALT",
    BILD_HOSTING: "ordner",
    BILD_ORDNER: path.join(tmp, "public"),
    BILD_BASIS_URL: `${basis}/bilder`,
  });
});

after(async () => {
  server.close();
  await rm(tmp, { recursive: true, force: true });
});

test("Karussell und Story werden hochgeladen und veröffentlicht", async () => {
  const { hochladen, pruefeErreichbar } = await import("../src/hosting.js");
  const { postFeed, postStory } = await import("../src/instagram.js");
  const bild = path.resolve("beispiele/hosting-test.jpg");

  const urls = await hochladen([bild, bild, bild], "2026-01-01");
  assert.equal(urls.length, 3);
  await pruefeErreichbar(urls[0]);

  const feed = await postFeed(urls, "Caption", "Alt-Text");
  assert.equal(feed.permalink, "https://instagram.com/p/xyz");
  assert.ok(aufrufe.some((a) => a.pfad === "/refresh_access_token"), "Token wurde erneuert");

  const kinder = aufrufe.filter((a) => a.pfad.endsWith("/media") && a.p.is_carousel_item === "true" && !a.p.alt_text);
  assert.equal(kinder.length, 3, "3 Karussell-Elemente (nach alt_text-Fallback)");
  const karussell = aufrufe.find((a) => a.p.media_type === "CAROUSEL");
  assert.equal(karussell.p.children.split(",").length, 3);
  assert.equal(karussell.p.caption, "Caption");

  const story = await postStory(urls[0]);
  assert.match(story.id, /^m-c\d+$/);
  assert.ok(aufrufe.some((a) => a.p.media_type === "STORIES" && a.p.image_url === urls[0]));
});

test("Nicht erreichbares Bild wird vor dem Posten erkannt", async () => {
  const { pruefeErreichbar } = await import("../src/hosting.js");
  await assert.rejects(pruefeErreichbar(`${process.env.BILD_BASIS_URL}/gibtsnicht.jpg`), /nicht öffentlich erreichbar/);
});

test("Konto-Sicherung: falsches Konto wird vor dem Posten gestoppt, richtiges durchgelassen", async () => {
  const { pruefeKonto, kontoPasst } = await import("../src/instagram.js");
  await assert.rejects(pruefeKonto("flowkit"), /gehört zu @test.*NICHTS veröffentlicht/);
  await pruefeKonto("@Test"); // Groß-/Kleinschreibung und @ egal
  assert.ok(kontoPasst("Flowkit", "@flowkit"));
  assert.ok(!kontoPasst("flowkit.de", "flowkit"));
});
