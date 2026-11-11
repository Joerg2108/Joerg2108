// End-to-End-Prüfung des überarbeiteten Ablaufs. Voraussetzung: frische Demo auf Port 3004 (DEMO_MODE=1, eigenes DATA_DIR) und Playwright.
// Aufruf: node pruefung-ablauf.js – zählt die Bedienschritte und legt Screenshots im Unterordner ablauf/ ab.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const out = __dirname + '/ablauf';
require('node:fs').mkdirSync(out, { recursive: true });
const B = 'http://localhost:3004';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 850 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  let steps = 0; const log = [];
  const step = (what) => { steps++; log.push(`${steps}. ${what}`); };
  const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, fullPage: true });
  const t0 = Date.now();
  await page.goto(B + '/login');
  await page.locator('.demo-login form button').first().click();
  await page.waitForURL(B + '/');
  await shot('1-uebersicht');

  // --- Ablauf: Anfrage → Angebot → Rechnung → Zahlung ---
  await page.locator('.worklist a', { hasText: 'Andrea Hoffmann' }).click(); step('Übersicht: Anfrage „Andrea Hoffmann“ öffnen');
  await page.waitForURL(/\/anfragen\/\d+$/);
  const leadUrl = page.url();
  await shot('2-anfrage');
  await page.getByRole('button', { name: 'Angebot erstellen' }).click(); step('Anfrage: „Angebot erstellen“');
  await page.waitForURL(/\/belege\/angebote\/neu/);
  assert.equal(await page.inputValue('[name=title]'), 'Wartungsvertrag Haustechnik');
  assert.match(await page.locator('[name=customer_id] option:checked').innerText(), /Hotel Am Park/);
  const opt = await page.locator('[data-product-pick] option').nth(1).getAttribute('value');
  await page.selectOption('[data-product-pick]', opt); step('Angebot: Leistung aus dem Katalog wählen');
  await shot('3-angebot-formular');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click(); step('Angebot: „Speichern“');
  await page.waitForURL(/\/belege\/\d+$/);
  assert.match(await page.locator('.alert.success').innerText(), /Angebot gespeichert/);
  await page.getByRole('button', { name: 'Angebot per E-Mail senden' }).click(); step('Angebot: „Angebot per E-Mail senden“');
  await page.waitForLoadState();
  assert.match(await page.locator('.page-head h1').innerText(), /Versendet/);
  await shot('4-angebot-versendet');
  await page.getByRole('button', { name: 'Angenommen – Rechnung erstellen' }).click(); step('Angebot: „Angenommen – Rechnung erstellen“');
  await page.waitForURL(/\/bearbeiten$/);
  await page.getByRole('button', { name: 'Speichern & festschreiben' }).click(); step('Rechnung: „Speichern & festschreiben“');
  await page.waitForURL(/\/belege\/\d+$/);
  assert.match(await page.locator('.alert.success').innerText(), /festgeschrieben/);
  const invUrl = page.url();
  await shot('5-rechnung-offen');
  await page.getByRole('button', { name: 'Rechnung per E-Mail senden' }).click(); step('Rechnung: „Rechnung per E-Mail senden“');
  await page.waitForLoadState();
  await page.locator('.next-step').getByRole('link', { name: 'Zahlung erfassen' }).click(); step('Rechnung: „Zahlung erfassen“');
  await page.waitForFunction(() => document.activeElement && document.activeElement.name === 'amount');
  await page.locator('#zahlungen').getByRole('button', { name: 'Zahlung erfassen' }).click(); step('Zahlung: Betrag ist vorbelegt, „Zahlung erfassen“ bestätigen');
  await page.waitForLoadState();
  assert.match(await page.locator('.alert.success').innerText(), /vollständig bezahlt/);
  assert.match(await page.locator('.page-head h1').innerText(), /Bezahlt/);
  assert.equal(await page.locator('.steps li.done').count(), 3); // Angebot, Rechnung, Zahlung (Auftrag übersprungen)
  assert.equal(await page.locator('.next-step .btn.primary').count(), 0);
  await shot('6-rechnung-bezahlt');
  const secs = Math.round((Date.now() - t0) / 1000);
  // PDF und XRechnung der neuen Rechnung
  for (const p of ['/pdf', '/xrechnung.xml']) assert.equal((await ctx.request.get(invUrl + p)).status(), 200);
  // Anfrage zeigt jetzt Angebot und Rechnung
  await page.goto(leadUrl);
  assert.equal(await page.locator('.plain-list li', { hasText: /Angebot|Rechnung/ }).count(), 2);
  await shot('7-anfrage-danach');
  // Übersicht: Anfrage ist aus „Heute zu tun“ verschwunden
  await page.goto(B + '/');
  assert.equal(await page.locator('.worklist a', { hasText: 'Andrea Hoffmann' }).count(), 0);
  console.log('ABLAUF OK –', steps, 'Bedienschritte, automatisiert in', secs, 's'); console.log(log.join('\n'));

  // --- Filter und Listenposition bleiben erhalten ---
  await page.setViewportSize({ width: 1366, height: 420 });
  await page.goto(B + '/belege/rechnungen?status=bezahlt');
  await page.evaluate(() => window.scrollTo(0, 260));
  await page.locator('tbody tr').last().locator('a').click();
  await page.waitForURL(/\/belege\/\d+$/);
  assert.match(await page.locator('a[data-back]').getAttribute('href'), /\/belege\/rechnungen\?status=bezahlt$/);
  await page.locator('a[data-back]').click();
  await page.waitForURL(/status=bezahlt/);
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => window.scrollY);
  assert.ok(Math.abs(y - 260) < 5, 'Scrollposition wiederhergestellt: ' + y);
  console.log('FILTER + POSITION OK (Filter status=bezahlt, scrollY', y, ')');
  await page.setViewportSize({ width: 1366, height: 850 });

  // --- Erfolglose Suche ---
  await page.goto(B + '/belege/rechnungen?status=offen&q=gibtsnicht');
  await shot('8-suche-leer');
  await page.getByRole('link', { name: 'Alle Rechnungen anzeigen' }).click();
  assert.ok(await page.locator('tbody tr').count() > 5);
  console.log('LEERE SUCHE OK');

  // --- Formulareingaben überstehen einen Speicherfehler ---
  await page.goto(B + '/belege/angebote/neu');
  await page.selectOption('[name=customer_id]', { index: 2 });
  await page.fill('[name=title]', 'Testangebot mit langem Titel');
  await page.fill('[name=item_name]', 'Beratung');
  await page.fill('[name=item_price]', '120,00');
  await page.locator('[data-add-row]').click();
  await page.locator('[name=item_name]').nth(1).fill('Anfahrt');
  await page.evaluate(() => { const d = document.querySelector('[name=issue_date]'); d.required = false; d.value = ''; });
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.waitForLoadState();
  assert.match(await page.locator('.alert.error').innerText(), /Belegdatum fehlt/);
  assert.equal(await page.inputValue('[name=title]'), 'Testangebot mit langem Titel');
  assert.equal(await page.locator('[name=item_name]').count(), 2);
  assert.equal(await page.locator('[name=item_name]').nth(1).inputValue(), 'Anfahrt');
  assert.equal(await page.locator('[name=item_price]').first().inputValue(), '120,00');
  await shot('9-speicherfehler');
  console.log('FORMULAR-WIEDERHERSTELLUNG OK');

  // --- Tastatur ---
  await page.goto(B + '/');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+k');
  assert.equal(await page.evaluate(() => document.activeElement.name), 'q');
  await page.goto(B + '/belege/rechnungen');
  for (let i = 0; i < 60; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !!document.activeElement.closest('tbody'))) break; }
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert.equal(ring, 'solid');
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/belege\/\d+$/);
  console.log('TASTATUR OK (Sprunglink, Strg+K, Fokusring, Zeile per Enter)');

  // --- Kein seitliches Scrollen auf Tablet und Smartphone ---
  for (const [n, w, h] of [['tablet', 820, 1100], ['phone', 390, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const [name, url] of [['uebersicht', '/'], ['rechnungen', '/belege/rechnungen'], ['anfragen-liste', '/anfragen?ansicht=liste'], ['rechnung', invUrl.replace(B, '')], ['anfrage', leadUrl.replace(B, '')], ['mahnwesen', '/belege/mahnwesen']]) {
      await page.goto(B + url);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 0, `${n} ${name}: Seite ist ${over}px zu breit`);
      await page.screenshot({ path: `${out}/${n}-${name}.png`, fullPage: name !== 'uebersicht' && name !== 'rechnungen' ? false : true });
    }
  }
  console.log('TABLET + SMARTPHONE OK (kein seitliches Scrollen auf 6 Ansichten)');
  await ctx.close();

  // --- Rollen ---
  for (const [idx, role, allow, deny] of [[1, 'Buchhaltung', '/belege/rechnungen', '/anfragen'], [2, 'Mitarbeiter', '/anfragen', '/belege/rechnungen']]) {
    const c = await b.newContext({ viewport: { width: 1366, height: 850 } });
    const p = await c.newPage();
    await p.goto(B + '/login');
    await p.locator('.demo-login form button').nth(idx).click();
    await p.waitForURL(B + '/');
    await p.screenshot({ path: `${out}/rolle-${role.toLowerCase()}.png`, fullPage: true });
    assert.equal((await p.goto(B + allow)).status(), 200);
    assert.equal((await p.goto(B + deny)).status(), 403);
    await c.close();
  }
  console.log('ROLLEN OK (Buchhaltung, Mitarbeiter)');
  await b.close();
})().catch((e) => { console.error('FEHLER', e); process.exit(1); });
