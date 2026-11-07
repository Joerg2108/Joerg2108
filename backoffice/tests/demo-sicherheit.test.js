'use strict';
// Demo für Sicherheitsunternehmen: DEMO_MODE=1 + SECURITY_EDITION=1 (muss vor dem Laden der Konfiguration gesetzt sein)
process.env.DEMO_MODE = '1';
process.env.SECURITY_EDITION = '1';
process.env.SMTP_HOST = 'smtp.example.invalid';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { db, client, cleanup } = require('./helpers');
const demo = require('../src/lib/demo');
const demoData = require('../src/db/demo-data');
const catalog = require('../src/lib/catalog');
const { createApp } = require('../src/app');

let server;
let base;
const [chefin] = demoData.ACCOUNTS;
before(async () => {
  demo.reset({ force: true });
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  cleanup();
});

test('Sicherheits-Demo: Edition, Musterobjekte und eigener Firmenname', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  for (const p of ['/lage', '/objekte', '/streife', '/vorfaelle', '/fahrzeuge']) {
    assert.equal((await c.req(p)).status, 200, `${p} muss erreichbar sein`);
  }
  const dash = await (await c.req('/')).text();
  assert.match(dash, /Sicherheitsdienst/);
  assert.match(dash, /Muster Sicherheit GmbH/);
  assert.match(dash, /Streife &amp; Wachbuch/);
  assert.ok(db.get('SELECT COUNT(*) AS n FROM objects').n > 0);
});

test('Sicherheits-Demo: Katalog mit Sicherheitsleistungen, ohne Back-Office-Pakete', () => {
  assert.equal(catalog.active(), catalog.MUSTER_SECURITY_CATALOG);
  assert.equal(db.get('SELECT COUNT(*) AS n FROM products').n, catalog.MUSTER_SECURITY_CATALOG.length);
  assert.ok(db.get("SELECT id FROM products WHERE sku = 'SD-01'"));
  assert.equal(db.get("SELECT id FROM products WHERE sku LIKE 'BO-%'"), undefined);
});

test('Sicherheits-Demo: Anmeldeseite zeigt die Leistungen für Sicherheitsunternehmen', async () => {
  const html = await (await client(base).req('/login')).text();
  assert.match(html, /Back Office für Sicherheitsunternehmen/);
  assert.match(html, /Streife &amp; digitales Wachbuch/);
  assert.match(html, /Muster Sicherheit GmbH/);
});
