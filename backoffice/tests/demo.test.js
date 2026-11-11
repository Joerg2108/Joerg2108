'use strict';
// Demo-Modus: eigene Instanz mit DEMO_MODE=1 (muss vor dem Laden der Konfiguration gesetzt sein)
process.env.DEMO_MODE = '1';
process.env.DEMO_CONTACT_URL = 'https://anbieter.example/kontakt';
process.env.SMTP_HOST = 'smtp.example.invalid';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { db, client, cleanup } = require('./helpers');
const demo = require('../src/lib/demo');
const demoData = require('../src/db/demo-data');
const mailer = require('../src/lib/mailer');
const catalog = require('../src/lib/catalog');
const { createApp } = require('../src/app');

let server;
let base;
const [chefin, buchhaltung, mitarbeiter] = demoData.ACCOUNTS;
before(async () => {
  // Die Test-Datenbank enthält bereits einen Admin, aber keine Demo-Markierung -> Reset muss verweigert werden
  assert.throws(() => demo.reset(), /keine Demo-Daten/);
  assert.equal(db.get('SELECT COUNT(*) AS n FROM users').n, 1);
  demo.reset({ force: true });
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  cleanup();
});

const flashText = async (c, p = '/') => (await (await c.req(p)).text());

test('Musterdaten: neutrale Firma, Katalog, Belege, Dienstplan mit Konflikten', () => {
  assert.equal(db.get("SELECT value FROM settings WHERE key = 'company_name'").value, 'Muster Service GmbH');
  assert.equal(db.get('SELECT COUNT(*) AS n FROM users').n, 3);
  assert.equal(db.get('SELECT COUNT(*) AS n FROM products').n, catalog.MUSTER_CATALOG.length);
  assert.ok(db.get("SELECT COUNT(*) AS n FROM documents_sales WHERE kind = 'rechnung' AND number IS NOT NULL").n >= 7);
  assert.ok(db.get('SELECT COUNT(*) AS n FROM dunnings').n >= 1);
  assert.equal(catalog.active(), catalog.MUSTER_CATALOG);
  // Keine Spuren eines echten Unternehmens in den Musterdaten
  const dump = JSON.stringify([db.all('SELECT * FROM settings'), db.all('SELECT * FROM customers'), db.all('SELECT * FROM products'), db.all('SELECT email, name FROM users')]);
  assert.doesNotMatch(dump, /noack/i);
  assert.ok(db.get('SELECT COUNT(*) AS n FROM shifts').n > 20);
  assert.ok(db.get('SELECT COUNT(*) AS n FROM shifts WHERE staff_id IS NULL').n >= 1);
});

test('Demo: keine E-Mails, auch wenn SMTP konfiguriert ist', async () => {
  assert.equal(mailer.enabled(), false);
  assert.deepEqual(await mailer.send({ to: 'x@example.com', subject: 'Test', text: 'x' }), { simulated: true });
});

test('Rechnungsversand zeigt in der Demo einen verständlichen Hinweis', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const inv = db.get("SELECT id FROM documents_sales WHERE kind = 'rechnung' AND finalized_at IS NOT NULL LIMIT 1").id;
  const r = await c.post(`/belege/${inv}/senden`, { to: 'kunde@example.com' }, `/belege/${inv}`);
  assert.equal(r.status, 302);
  assert.match(await flashText(c, `/belege/${inv}`), /Demo-Version: Der Versand wurde simuliert/);
});

test('Login-Seite zeigt Demo-Zugänge und Banner, Ein-Klick-Login funktioniert', async () => {
  const c = client(base);
  const html = await flashText(c, '/login');
  for (const a of demoData.ACCOUNTS) assert.match(html, new RegExp(a.email.replace(/\./g, '\\.')));
  assert.match(html, /Demo-Version/);
  assert.match(html, /anbieter\.example\/kontakt/);
  const r = await c.login(chefin.email, demoData.PASSWORD);
  assert.equal(r.status, 302);
  const dash = await flashText(c, '/');
  assert.match(dash, /Rundgang/);
  assert.match(dash, /Muster Service GmbH/);
});

test('Demo-Sperren: Passwort, Benutzer, API-Schlüssel, Logo', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const before = db.get('SELECT password_hash FROM users WHERE email = ?', chefin.email).password_hash;
  let r = await c.post('/profil/passwort', { current: demoData.PASSWORD, password: 'Neues-Passwort9', password2: 'Neues-Passwort9' }, '/profil');
  assert.equal(r.status, 302);
  assert.equal(db.get('SELECT password_hash FROM users WHERE email = ?', chefin.email).password_hash, before);
  assert.match(await flashText(c, '/'), /in der Demo-Version deaktiviert/);

  const users = db.get('SELECT COUNT(*) AS n FROM users').n;
  await c.post('/admin/benutzer', { email: 'neu@example.com', name: 'Neu', password: 'Neues-Passwort9', role: 'admin' }, '/admin/benutzer/neu');
  assert.equal(db.get('SELECT COUNT(*) AS n FROM users').n, users);

  await c.post('/admin/api', { name: 'Test', scope: 'write' }, '/admin/api');
  assert.equal(db.get('SELECT COUNT(*) AS n FROM api_keys').n, 0);

  // Normale Arbeit bleibt erlaubt, z. B. Einstellungen ändern oder Kunden anlegen
  r = await c.post('/admin/einstellungen', { _tab: 'design', brand_color: '#0f766e' }, '/admin/einstellungen');
  assert.equal(r.status, 302);
  assert.equal(db.get("SELECT value FROM settings WHERE key = 'brand_color'").value, '#0f766e');
});

test('Demo: Fehlversuche sperren die öffentlichen Zugänge nicht', async () => {
  const c = client(base);
  for (let i = 0; i < 6; i++) await c.login(buchhaltung.email, 'falsch');
  assert.equal(db.get('SELECT locked_until FROM users WHERE email = ?', buchhaltung.email).locked_until, null);
  assert.equal((await c.login(buchhaltung.email, demoData.PASSWORD)).status, 302);
});

test('Mitarbeiter-Rolle sieht nur passende Rundgang-Punkte', async () => {
  const c = client(base);
  await c.login(mitarbeiter.email, demoData.PASSWORD);
  const dash = await flashText(c, '/');
  assert.match(dash, /Dienstplan mit Konfliktprüfung/);
  assert.doesNotMatch(dash, /Berichte &amp; DATEV|Website-Anbindung/);
});

test('Reset verwirft Änderungen und stellt die Musterdaten wieder her', async () => {
  db.run("INSERT INTO customers (number, company) VALUES ('K-9999', 'Spaßvogel AG')");
  db.run("UPDATE settings SET value = 'Gekapert' WHERE key = 'company_name'");
  demo.reset();
  assert.equal(db.get("SELECT COUNT(*) AS n FROM customers WHERE company = 'Spaßvogel AG'").n, 0);
  assert.equal(db.get("SELECT value FROM settings WHERE key = 'company_name'").value, 'Muster Service GmbH');
  // Server läuft nach dem Reset normal weiter (Sitzungen sind verworfen)
  const c = client(base);
  assert.equal((await c.login(chefin.email, demoData.PASSWORD)).status, 302);
  assert.equal((await c.req('/belege/rechnungen')).status, 200);
});

test('Demo: ohne Sicherheitsdienst-Edition – Back Office für Dienstleister', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  assert.equal((await c.req('/objekte')).status, 404);
  assert.doesNotMatch(await flashText(c, '/'), /Sicherheitsdienst|Streife|Wächter-App|Live-Lage/);
  assert.equal(db.get('SELECT COUNT(*) AS n FROM objects').n, 0);
});

test('Demo: Anmeldeseite zeigt die Leistungen des Back Office', async () => {
  const html = await (await client(base).req('/login')).text();
  assert.match(html, /auth-features/);
  assert.match(html, /Back Office für Dienstleistungsunternehmen/);
  assert.match(html, /Dienstplan &amp; Einsatzplanung/);
});

test('Übersicht: „Heute zu tun“ listet nur Vorgänge mit Handlung, je Rolle passend', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const dash = await (await c.req('/')).text();
  assert.match(dash, /Heute zu tun/);
  for (const kind of ['Rechnung überfällig', 'Neue Anfrage', 'Angebot angenommen', 'Rechnung im Entwurf', 'Angebot im Entwurf']) assert.match(dash, new RegExp(kind), kind);
  assert.match(dash, /Mahnen/);
  // Die Monatspauschale ist Vorlage einer wiederkehrenden Rechnung und kein offener Entwurf
  assert.doesNotMatch(dash, /Website-Pflege Monatspauschale/);

  const m = client(base);
  await m.login(mitarbeiter.email, demoData.PASSWORD);
  const own = await (await m.req('/')).text();
  // Mitarbeiter bearbeiten Anfragen, sehen aber keine Rechnungen und Angebote
  assert.match(own, /Neue Anfrage/);
  assert.doesNotMatch(own, /Rechnung überfällig|Angebot angenommen|Rechnung im Entwurf|Offene Posten/);
  assert.match(own, /Meine Aufgaben/);
});

test('Anfrage → Angebot in einem Schritt: Kunde wird angelegt, Betreff übernommen', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const lead = db.get("SELECT * FROM leads WHERE name = 'Andrea Hoffmann'");
  const before = db.get('SELECT COUNT(*) AS n FROM customers').n;
  const page = await (await c.req(`/anfragen/${lead.id}`)).text();
  assert.match(page, /Nächster Schritt/);
  assert.match(page, /Angebot erstellen/);
  const r = await c.req(`/anfragen/${lead.id}/angebot`, { method: 'POST', body: new URLSearchParams({ _csrf: await c.csrf('/') }) });
  assert.equal(r.status, 302);
  const after = db.get('SELECT * FROM leads WHERE id = ?', lead.id);
  assert.ok(after.customer_id, 'Anfrage ist mit einem Kunden verknüpft');
  assert.equal(after.status, 'qualifiziert');
  assert.equal(db.get('SELECT COUNT(*) AS n FROM customers').n, before + 1);
  assert.equal(r.headers.get('location'), `/belege/angebote/neu?kunde=${after.customer_id}&anfrage=${lead.id}`);
  const form = await (await c.req(r.headers.get('location'))).text();
  assert.match(form, /value="Wartungsvertrag Haustechnik"/);
  // Zweiter Aufruf legt keinen zweiten Kunden an
  await c.req(`/anfragen/${lead.id}/angebot`, { method: 'POST', body: new URLSearchParams({ _csrf: await c.csrf('/') }) });
  assert.equal(db.get('SELECT COUNT(*) AS n FROM customers').n, before + 1);
});

test('Anfrage mit bekannter E-Mail-Adresse wird mit dem bestehenden Kunden verknüpft', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const existing = db.get("SELECT id FROM customers WHERE company = 'Café Morgenrot'");
  const id = Number(db.run("INSERT INTO leads (name, email, subject, status, source, consent) VALUES ('Klaus Krume', 'HALLO@cafe-morgenrot.example', 'Mehr Reichweite', 'neu', 'website', 1)").lastInsertRowid);
  const before = db.get('SELECT COUNT(*) AS n FROM customers').n;
  await c.req(`/anfragen/${id}/angebot`, { method: 'POST', body: new URLSearchParams({ _csrf: await c.csrf('/') }) });
  assert.equal(db.get('SELECT customer_id FROM leads WHERE id = ?', id).customer_id, existing.id);
  assert.equal(db.get('SELECT COUNT(*) AS n FROM customers').n, before);
});

test('Beleg: Vorgangsleiste und genau eine Hauptaktion je Zustand', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const primary = (html) => (html.match(/<section class="next-step[\s\S]*?<\/section>/) || [''])[0].match(/class="btn primary"[^>]*>([^<]+)</g) || [];
  const quote = db.get("SELECT id FROM documents_sales WHERE kind = 'angebot' AND status = 'versendet'");
  const q = await (await c.req(`/belege/${quote.id}`)).text();
  assert.match(q, /class="steps"/);
  assert.equal(primary(q).length, 1);
  assert.match(primary(q)[0], /Angenommen – Rechnung erstellen/);
  const overdue = db.get("SELECT id FROM documents_sales WHERE kind = 'rechnung' AND status = 'teilbezahlt'");
  const o = await (await c.req(`/belege/${overdue.id}`)).text();
  assert.equal(primary(o).length, 1);
  assert.match(primary(o)[0], /Mahnung erstellen \(Stufe 2\)/);
  const paid = db.get("SELECT id FROM documents_sales WHERE kind = 'rechnung' AND status = 'bezahlt'");
  const p = await (await c.req(`/belege/${paid.id}`)).text();
  assert.equal(primary(p).length, 0);
  assert.match(p, /Vollständig bezahlt/);
});

test('Listen: leere Suche zeigt den Weg zurück, Statuswechsel wird bestätigt', async () => {
  const c = client(base);
  await c.login(chefin.email, demoData.PASSWORD);
  const empty = await (await c.req('/belege/rechnungen?status=offen&q=gibtsnicht')).text();
  assert.match(empty, /Für „gibtsnicht“ gibt es keinen Treffer im Status „Offen“/);
  assert.match(empty, /In allen Rechnungen suchen/);
  assert.match(empty, /Alle Rechnungen anzeigen/);
  const quote = db.get("SELECT id FROM documents_sales WHERE kind = 'angebot' AND status = 'entwurf'");
  await c.req(`/belege/${quote.id}/status`, { method: 'POST', body: new URLSearchParams({ _csrf: await c.csrf('/'), status: 'versendet' }) });
  assert.match(await (await c.req(`/belege/${quote.id}`)).text(), /Status geändert: Versendet\./);
});
