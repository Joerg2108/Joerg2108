const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  async function run(port, prefix, pages, mobile) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 780 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}/login`);
    await p.click(`button.demo-account >> nth=${mobile ? 2 : 0}`);
    await p.waitForLoadState('networkidle');
    for (const [name, url] of pages) {
      const r = await p.goto(`http://localhost:${port}${url}`); await p.waitForLoadState('networkidle');
      await p.evaluate(() => {
        document.querySelectorAll('.demo-banner').forEach(e => e.remove());
        document.querySelectorAll('h2').forEach(h => { if (h.textContent.includes('Rundgang')) h.closest('.card')?.remove(); });
      });
      await p.waitForTimeout(500);
      if (mobile) { await p.screenshot({ path: `${out}/${prefix}-${name}.png` }); }
      else {
        const main = await p.$('main'); const bb = await main.boundingBox();
        await p.screenshot({ path: `${out}/${prefix}-${name}.png`, clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, 1000 - bb.y) } });
      }
      console.log(prefix, name, r.status());
    }
    await ctx.close();
  }
  const common = [['dash','/'],['rechnungen','/belege/rechnungen'],['mahnwesen','/belege/mahnwesen'],['dienstplan','/dienstplan'],['auswertung','/dienstplan/auswertung'],['abos','/belege/wiederkehrend'],['anfragen','/anfragen'],['projekte','/projekte'],['berichte','/berichte'],['personal','/personal'],['benutzer','/admin/benutzer']];
  await run(3004, 'svc', common);
  await run(3005, 'sec', [...common, ['lage','/lage'],['objekte','/objekte'],['streife','/streife'],['vorfaelle','/vorfaelle'],['fahrzeuge','/fahrzeuge']]);
  await run(3005, 'mob', [['waechter','/waechter'],['streife','/waechter/streife']], true);
  await b.close();
})();
