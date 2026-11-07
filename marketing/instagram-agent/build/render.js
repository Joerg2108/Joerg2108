'use strict';
// Rendert die Beitragsbank als JPEG (1080 × 1350, 4:5) und schreibt posts.json.
// Aufruf: node render.js <Ordner mit Screenshots>   (Screenshots erzeugt screenshots.js)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { POSTS } = require('./content');

const shotsDir = path.resolve(process.argv[2] || path.join(__dirname, 'shots'));
const outDir = path.join(__dirname, '..', 'posts');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1080px; height: 1350px; font-family: "Inter", sans-serif; -webkit-font-smoothing: antialiased; }
.post { width: 1080px; height: 1350px; position: relative; overflow: hidden; padding: 84px 80px 130px; display: flex; flex-direction: column; }
.light { background: #f4f6fb; color: #0f172a; --accent: #2563eb; --muted: #64748b; }
.dark { background: radial-gradient(120% 80% at 85% 0%, #1b2b55 0%, #0b1220 55%); color: #fff; --accent: #f5a524; --muted: #b6c2dc; }
.kicker { font-size: 26px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
h1 { font-family: "Inter Display", "Inter", sans-serif; font-weight: 800; letter-spacing: -.03em; line-height: 1.04; margin-top: 22px; font-size: 76px; }
h1 em { font-style: normal; color: var(--accent); }
.l-text h1 { font-size: 104px; margin-top: 120px; }
.lead { font-size: 36px; line-height: 1.4; color: var(--muted); font-weight: 500; margin-top: 48px; max-width: 880px; }
.shot { margin-top: 40px; border-radius: 26px; overflow: hidden; background: #fff; box-shadow: 0 30px 80px -20px rgba(15,23,42,.45), 0 0 0 1px rgba(15,23,42,.08); }
.shot .bar { height: 40px; background: #e9edf5; display: flex; gap: 9px; align-items: center; padding: 0 18px; }
.shot .bar i { width: 13px; height: 13px; border-radius: 50%; background: #c7cfdd; }
.shot img { display: block; width: 100%; height: 560px; object-fit: cover; object-position: top left; }
.phone-wrap { display: flex; gap: 48px; margin-top: 40px; align-items: flex-start; }
.phone { flex: none; width: 400px; height: 800px; border-radius: 52px; padding: 14px; background: #05080f; box-shadow: 0 30px 80px -20px rgba(0,0,0,.7), 0 0 0 2px #2a3550; }
.phone img { width: 100%; height: 100%; border-radius: 40px; object-fit: cover; object-position: top; display: block; }
ul { list-style: none; display: grid; gap: 22px; margin-top: 40px; }
.phone-wrap ul { margin-top: 30px; gap: 34px; }
li { font-size: 32px; font-weight: 600; line-height: 1.3; padding-left: 58px; position: relative; }
li::before { content: "✓"; position: absolute; left: 0; top: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 22px; font-weight: 800; display: grid; place-items: center; }
.dark li::before { color: #0b1220; }
.foot { position: absolute; left: 80px; right: 80px; bottom: 50px; display: flex; justify-content: space-between; align-items: center; font-size: 25px; font-weight: 600; color: var(--muted); }
.brand { display: flex; gap: 14px; align-items: center; }
.logo { width: 42px; height: 42px; border-radius: 11px; background: #2563eb; color: #fff; display: grid; place-items: center; font-weight: 800; }
.badge { font-size: 22px; font-weight: 700; padding: 10px 18px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.cta { margin-top: auto; align-self: flex-start; background: var(--accent); color: #0b1220; font-size: 38px; font-weight: 800; padding: 30px 52px; border-radius: 999px; }
.light .cta { color: #fff; }
`;

function html(p) {
  const theme = p.demo === 'sicherheit' ? 'dark' : 'light';
  const badge = p.demo === 'sicherheit' ? 'Demo Sicherheit' : 'Demo Dienstleistung';
  const img = (name) => 'file://' + path.join(shotsDir, name + '.png');
  const bullets = (p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('');
  let body = '';
  if (p.layout === 'text') {
    body = `<p class="lead">${esc(p.lead)}</p><div class="cta">🔗 Live-Demo: Link in Bio</div>`;
  } else if (p.layout === 'phone') {
    body = `<div class="phone-wrap"><div class="phone"><img src="${img(p.shot)}"></div><ul>${bullets}</ul></div>`;
  } else {
    body = `<div class="shot"><div class="bar"><i></i><i></i><i></i></div><img src="${img(p.shot)}"></div><ul>${bullets}</ul>`;
  }
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="post ${theme} l-${p.layout}">
  <div class="kicker">${esc(p.kicker)}</div>
  <h1>${p.title}</h1>
  ${body}
  <div class="foot"><span class="brand"><span class="logo">J</span>Jörg Noack · Back Office</span><span class="badge">${badge}</span></div>
</div></body></html>`;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(require('node:os').tmpdir(), 'ig-post.html');
  const out = [];
  for (const p of POSTS) {
    fs.writeFileSync(tmp, html(p));
    await page.goto('file://' + tmp);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    // Überlauf prüfen: nichts darf in die Fußzeile ragen
    const over = await page.evaluate(() => {
      const foot = document.querySelector('.foot').getBoundingClientRect().top;
      return [...document.querySelectorAll('.post > *:not(.foot)')].some((e) => e.getBoundingClientRect().bottom > foot - 10);
    });
    if (over) console.warn(`WARNUNG: Beitrag ${p.id} läuft in die Fußzeile`);
    const file = `posts/${p.id}.jpg`;
    await page.screenshot({ path: path.join(__dirname, '..', file), type: 'jpeg', quality: 88 });
    out.push({ id: p.id, demo: p.demo, image: file, caption: p.caption });
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, '..', 'posts.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`${out.length} Beiträge gerendert`);
})();
