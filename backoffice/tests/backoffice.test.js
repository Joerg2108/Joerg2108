'use strict';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { db, customer, client, cleanup } = require('./helpers');
const sales = require('../src/lib/sales');
const f = require('../src/lib/format');
const totp = require('../src/lib/totp');
const csv = require('../src/lib/csv');
const audit = require('../src/lib/audit');
const xrechnung = require('../src/lib/xrechnung');
const sec = require('../src/lib/security');
const { createApp } = require('../src/app');

let server;
let base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  cleanup();
});

const items = [
  { name: 'Hausmeisterdienst', quantity: 10, unit: 'Std.', unit_price: 2850, tax_rate: 19, discount_pct: 0 },
  { name: 'Fachbuch', quantity: 1, unit: 'Stk.', unit_price: 1999, tax_rate: 7, discount_pct: 10 },
];

function invoice(customerId, extra = {}) {
  return sales.save({
    kind: 'rechnung', userId: 1, items,
    data: { customer_id: customerId, title: 'Test', intro: '', footer: '', issue_date: '2026-10-01', service_date: '2026-10-01', due_date: '2026-10-15', ...extra },
  });
}

// ---------- Formatierung ----------
test('Beträge werden deutsch geparst und formatiert', () => {
  assert.equal(f.parseMoney('1.234,56'), 123456);
  assert.equal(f.parseMoney('1234.5'), 123450);
  assert.equal(f.parseMoney('12 €'), 1200);
  assert.equal(f.parseDuration('1:30'), 90);
  assert.equal(f.parseDuration('1,5'), 90);
  assert.equal(f.parseDuration('45m'), 45);
  assert.equal(f.addMonths('2026-01-31', 1), '2026-02-28');
  assert.match(f.eur(123456), /1\.234,56\s€/);
});

// ---------- Berechnung ----------
test('Positionen: Rabatt, USt je Satz gruppiert, Summen korrekt', () => {
  const c = sales.calcItems(items);
  assert.equal(c.items[0].net_amount, 28500);
  assert.equal(c.items[1].net_amount, 1799); // 19,99 € −10 %
  assert.equal(c.net, 30299);
  assert.deepEqual(c.taxes.map((t) => [t.rate, t.tax]), [[19, 5415], [7, 126]]);
  assert.equal(c.gross, 30299 + 5415 + 126);
});

test('Kleinunternehmer: keine Umsatzsteuer', () => {
  const c = sales.calcItems(items, { smallBusiness: true });
  assert.equal(c.tax, 0);
  assert.equal(c.gross, c.net);
});

// ---------- GoBD ----------
test('Rechnungsnummer erst beim Festschreiben, lückenlos fortlaufend', () => {
  const cid = customer();
  const a = invoice(cid);
  const b = invoice(cid);
  assert.equal(db.get('SELECT number FROM documents_sales WHERE id = ?', a).number, null);
  sales.remove(a); // Entwurf löschen erzeugt keine Lücke
  const n1 = sales.finalize(b);
  const n2 = sales.finalize(invoice(cid));
  const seq = (n) => Number(n.split('-').pop());
  assert.equal(seq(n2), seq(n1) + 1);
});

test('Festgeschriebene Rechnung ist unveränderlich (auch direkt in der DB)', () => {
  const id = invoice(customer());
  sales.finalize(id);
  assert.throws(() => sales.save({ id, kind: 'rechnung', items, userId: 1, data: { customer_id: 1, issue_date: '2026-10-02' } }), /Festgeschriebene/);
  assert.throws(() => db.run('UPDATE documents_sales SET gross_total = 1 WHERE id = ?', id), /Festgeschriebene/);
  assert.throws(() => db.run('DELETE FROM documents_sales WHERE id = ?', id), /Festgeschriebene/);
  assert.throws(() => db.run('UPDATE document_items SET unit_price = 1 WHERE document_id = ?', id), /gesperrt/);
});

test('Leistungsdatum ist Pflicht beim Festschreiben', () => {
  const id = invoice(customer(), { service_date: null });
  assert.throws(() => sales.finalize(id), /Leistungsdatum/);
});

test('Zahlungen setzen Status teilbezahlt/bezahlt', () => {
  const id = invoice(customer());
  sales.finalize(id);
  const gross = sales.load(id).gross_total;
  sales.addPayment(id, { amount: 1000, paid_at: '2026-10-05' }, 1);
  assert.equal(sales.load(id).status, 'teilbezahlt');
  sales.addPayment(id, { amount: gross - 1000, paid_at: '2026-10-06' }, 1);
  assert.equal(sales.load(id).status, 'bezahlt');
});

test('Storno erzeugt Gegenbeleg mit negativen Beträgen, Original bleibt erhalten', () => {
  const id = invoice(customer());
  sales.finalize(id);
  const stornoId = sales.createStorno(id, 1);
  const st = sales.load(stornoId);
  const orig = sales.load(id);
  assert.equal(st.kind, 'storno');
  assert.equal(st.gross_total, -orig.gross_total);
  assert.equal(orig.status, 'storniert');
  assert.ok(orig.number && st.number);
  assert.throws(() => sales.createStorno(id, 1), /bereits storniert/);
});

test('Mahnstufen 1–3 mit Gebühren', () => {
  const id = invoice(customer());
  sales.finalize(id);
  assert.equal(sales.createDunning(id, 1), 1);
  assert.equal(sales.createDunning(id, 1), 2);
  assert.equal(sales.createDunning(id, 1), 3);
  assert.throws(() => sales.createDunning(id, 1), /Höchste Mahnstufe/);
  assert.equal(sales.load(id).dunnings[1].fee, 500);
});

test('Angebot → Rechnung übernimmt Positionen und setzt Angebot auf angenommen', () => {
  const cid = customer();
  const q = sales.save({ kind: 'angebot', userId: 1, items, data: { customer_id: cid, issue_date: '2026-10-01', title: 'A' } });
  const inv = sales.convert(q, 'rechnung', 1);
  assert.equal(sales.load(inv).items.length, 2);
  assert.equal(sales.load(q).status, 'angenommen');
});

test('Wiederkehrende Rechnungen werden erzeugt und Datum fortgeschrieben', () => {
  const tpl = invoice(customer());
  db.run("INSERT INTO recurring_invoices (template_id, interval, next_date, auto_finalize) VALUES (?, 'monatlich', '2026-01-01', 1)", tpl);
  const created = sales.runRecurring('2026-01-15');
  assert.equal(created.length, 1);
  assert.ok(sales.load(created[0]).finalized_at);
  assert.equal(db.get('SELECT next_date FROM recurring_invoices WHERE template_id = ?', tpl).next_date, '2026-02-01');
});

// ---------- E-Rechnung ----------
test('XRechnung enthält Pflichtfelder und stimmige Summen', () => {
  const id = invoice(customer());
  sales.finalize(id);
  const xml = xrechnung.build(sales.load(id));
  assert.match(xml, /xrechnung_3\.0/);
  assert.match(xml, /<cbc:InvoiceTypeCode>380<\/cbc:InvoiceTypeCode>/);
  assert.match(xml, /<cbc:BuyerReference>/);
  assert.match(xml, /<cbc:TaxExclusiveAmount currencyID="EUR">302\.99<\/cbc:TaxExclusiveAmount>/);
  assert.equal((xml.match(/<cac:InvoiceLine>/g) || []).length, 2);
  assert.doesNotMatch(xml, /undefined|NaN/);
});

// ---------- Sicherheit ----------
test('TOTP: RFC-6238-Testvektor und Verifikation', () => {
  const secret = totp.base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(totp.code(secret, Math.floor(59000 / 30000)), '287082');
  const s = totp.generateSecret();
  assert.ok(totp.verify(s, totp.code(s, Math.floor(Date.now() / 30000))));
  assert.ok(!totp.verify(s, '000000') || totp.code(s, Math.floor(Date.now() / 30000)) === '000000');
});

test('Passwortrichtlinie', () => {
  assert.ok(sec.passwordProblems('kurz').length > 0);
  assert.equal(sec.passwordProblems('Sicheres-Passwort9').length, 0);
});

test('Audit-Log ist hash-verkettet und unveränderlich', () => {
  audit.log(null, 'test.eintrag', 'x', 1, { a: 1 });
  audit.log(null, 'test.eintrag2', 'x', 2);
  assert.equal(audit.verify().ok, true);
  assert.throws(() => db.run("UPDATE audit_log SET action = 'manipuliert'"), /unveränderlich/);
  assert.throws(() => db.run('DELETE FROM audit_log'), /unveränderlich/);
});

test('CSV: Parser versteht Semikolon, Anführungszeichen und Zeilenumbrüche', () => {
  const rows = csv.parse('﻿firma;ort\n"Müller; Söhne";"Berlin\nMitte"\nB GmbH;Hamburg\n');
  assert.deepEqual(rows, [{ firma: 'Müller; Söhne', ort: 'Berlin\nMitte' }, { firma: 'B GmbH', ort: 'Hamburg' }]);
  assert.match(csv.stringify(['a'], [['x;y']]), /"x;y"/);
});

// ---------- HTTP ----------
test('HTTP: ohne Login Umleitung, Login funktioniert, Sicherheits-Header gesetzt', async () => {
  const c = client(base);
  let r = await c.req('/kunden');
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /^\/login/);
  r = await c.login();
  assert.equal(r.status, 302);
  r = await c.req('/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
});

test('HTTP: falsches Passwort wird abgelehnt', async () => {
  const c = client(base);
  const r = await c.login('admin@test.de', 'falsch');
  assert.equal(r.status, 401);
});

test('HTTP: POST ohne CSRF-Token wird blockiert', async () => {
  const c = client(base);
  await c.login();
  const r = await c.req('/kunden', { method: 'POST', body: new URLSearchParams({ company: 'Hacker AG' }) });
  assert.equal(r.status, 403);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM customers WHERE company = 'Hacker AG'").n, 0);
});

test('HTTP: Kunde anlegen und Rechnung erstellen + PDF', async () => {
  const c = client(base);
  await c.login();
  let r = await c.post('/kunden', { type: 'firma', company: 'HTTP Kunde GmbH', country: 'DE', status: 'aktiv', email: 'h@test.de' }, '/kunden/neu');
  assert.equal(r.status, 302);
  const cid = db.get("SELECT id FROM customers WHERE company = 'HTTP Kunde GmbH'").id;
  r = await c.post('/belege/rechnungen', {
    customer_id: String(cid), issue_date: '2026-10-01', service_date: '2026-10-01', due_date: '2026-10-15', title: 'Web',
    item_name: 'Leistung', item_quantity: '2', item_unit: 'Std.', item_price: '50,00', item_discount: '', item_tax: '19', after: 'finalize',
  }, '/belege/rechnungen/neu');
  assert.equal(r.status, 302);
  const docId = Number(r.headers.get('location').split('/').pop());
  const d = sales.load(docId);
  assert.equal(d.gross_total, 11900);
  assert.ok(d.finalized_at);
  r = await c.req(`/belege/${docId}/pdf`);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
});

test('HTTP: Rollen – Mitarbeiter hat keinen Zugriff auf Belege und Verwaltung', async () => {
  db.run("INSERT INTO users (email, name, password_hash, role) VALUES ('ma@test.de', 'MA', ?, 'mitarbeiter')", sec.hashPassword('Test-Passwort1'));
  const c = client(base);
  await c.login('ma@test.de', 'Test-Passwort1');
  assert.equal((await c.req('/belege/rechnungen')).status, 403);
  assert.equal((await c.req('/admin/benutzer')).status, 403);
  assert.equal((await c.req('/kunden')).status, 200);
});

test('API: Website-Kontaktformular legt Anfrage an (CORS, Honeypot, Validierung)', async () => {
  let r = await fetch(`${base}/api/public/kontakt`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://joerg-noack.com' },
    body: JSON.stringify({ name: 'Website Test', email: 'web@test.de', message: 'Bitte Angebot', consent: true }),
  });
  assert.equal(r.status, 201);
  assert.equal(r.headers.get('access-control-allow-origin'), 'https://joerg-noack.com');
  assert.equal(db.get("SELECT COUNT(*) AS n FROM leads WHERE name = 'Website Test'").n, 1);
  // Honeypot: wird stillschweigend verworfen
  r = await fetch(`${base}/api/public/kontakt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Bot', email: 'b@b.de', message: 'spam', consent: 1, website: 'http://spam' }) });
  assert.equal(r.status, 200);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM leads WHERE name = 'Bot'").n, 0);
  // Fehlende Einwilligung
  r = await fetch(`${base}/api/public/kontakt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'X', email: 'x@x.de', message: 'm' }) });
  assert.equal(r.status, 422);
});

test('API: REST nur mit gültigem Schlüssel, Scopes werden geprüft', async () => {
  assert.equal((await fetch(`${base}/api/v1/kunden`)).status, 401);
  const readKey = sec.createApiKey('lesen', 'read', 1);
  let r = await fetch(`${base}/api/v1/kunden`, { headers: { Authorization: `Bearer ${readKey}` } });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(await r.json()));
  r = await fetch(`${base}/api/v1/kunden`, { method: 'POST', headers: { Authorization: `Bearer ${readKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'API GmbH' }) });
  assert.equal(r.status, 403);
  const writeKey = sec.createApiKey('schreiben', 'read,write', 1);
  r = await fetch(`${base}/api/v1/kunden`, { method: 'POST', headers: { Authorization: `Bearer ${writeKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'API GmbH' }) });
  assert.equal(r.status, 201);
});

test('Leistungskatalog: wird vollständig eingespielt, erneutes Einspielen erzeugt keine Duplikate', async () => {
  const catalog = require('../src/lib/catalog');
  const first = catalog.importCatalog();
  assert.equal(first.added, catalog.CATALOG.length);
  db.run("UPDATE products SET price = 9999 WHERE sku = 'OD-03'");
  const second = catalog.importCatalog();
  assert.equal(second.added, 0);
  assert.equal(db.get("SELECT price FROM products WHERE sku = 'OD-03'").price, 9999, 'eigene Preise bleiben erhalten');
  for (const name of ['Hausmeisterdienst', 'Einbau genormter Baufertigteile', 'Künstlerbetreuung', 'Ausstellungsbau', 'Online-Marketing', 'Social-Media-Kommunikation',
    'Kundenanfragen & digitale Vertriebsunterstützung', 'Prozess- und Projektkoordination', 'Digitalisierung von Verwaltungs-, Dokumentations- und Planungsabläufen',
    'KI-Unterstützung', 'Einsatz- und Qualitätsplanung', 'Erstellung und Pflege von Dokumentationen', 'Berichtswesen und Auswertungen']) {
    assert.ok(db.get('SELECT id FROM products WHERE name = ?', name), `fehlt: ${name}`);
  }
  // Artikelliste zeigt Kategorien
  const c = client(base);
  await c.login();
  const html = await (await c.req('/artikel')).text();
  assert.match(html, /Organisation &amp; Digitalisierung/);
  assert.match(html, /Event &amp; Ausstellung/);
});

test('Website: Leistungskatalog öffentlich abrufbar, nur freigegebene Leistungen, Preise nur auf Wunsch', async () => {
  const catalog = require('../src/lib/catalog');
  const settings = require('../src/lib/settings');
  catalog.importCatalog();
  db.run("UPDATE products SET public = 0 WHERE sku = 'HM-02'");
  db.run("UPDATE products SET active = 0 WHERE sku = 'EV-02'");
  let r = await fetch(`${base}/api/public/leistungen`, { headers: { Origin: 'https://irgendeine-seite.de' } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.equal(r.headers.get('cross-origin-resource-policy'), 'cross-origin');
  let data = await r.json();
  const skus = data.categories.flatMap((c) => c.items.map((i) => i.sku));
  assert.ok(skus.includes('HM-01'));
  assert.ok(!skus.includes('HM-02'), 'nicht freigegebene Leistung darf nicht erscheinen');
  assert.ok(!skus.includes('EV-02'), 'inaktive Leistung darf nicht erscheinen');
  assert.equal(data.categories[0].items[0].price, undefined, 'Preise standardmäßig ausgeblendet');
  settings.setMany({ public_show_prices: '1' });
  data = await (await fetch(`${base}/api/public/leistungen`)).json();
  const hm = data.categories.flatMap((c) => c.items).find((i) => i.sku === 'HM-01');
  assert.equal(typeof hm.price, 'number');
  settings.setMany({ public_show_prices: '0' });
  // Widget-Skript und CSS werden ausgeliefert und dürfen fremd eingebunden werden
  r = await fetch(`${base}/api/public/leistungen.js`);
  assert.match(r.headers.get('content-type'), /javascript/);
  assert.equal(r.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.match(await r.text(), /leistungen-widget/);
  r = await fetch(`${base}/api/public/leistungen.css`);
  assert.match(r.headers.get('content-type'), /text\/css/);
  // Interne Felder (Steuersatz, IDs) werden nicht veröffentlicht
  assert.doesNotMatch(JSON.stringify(data), /tax_rate|"id":/);
});
