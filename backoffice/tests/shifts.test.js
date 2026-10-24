'use strict';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { db, customer, client, cleanup } = require('./helpers');
const sh = require('../src/lib/shifts');
const sales = require('../src/lib/sales');
const sec = require('../src/lib/security');
const settings = require('../src/lib/settings');
const { createApp } = require('../src/app');

let server;
let base;
let staffA;
let staffB;
let qualId;
let projectId;

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  staffA = Number(db.run("INSERT INTO staff (first_name, last_name, weekly_hours, hourly_wage) VALUES ('Anna', 'A', 40, 1500)").lastInsertRowid);
  staffB = Number(db.run("INSERT INTO staff (first_name, last_name, weekly_hours, employment, hourly_wage) VALUES ('Ben', 'B', 10, 'minijob', 1400)").lastInsertRowid);
  qualId = Number(db.run("INSERT INTO qualification_types (name, validity_months) VALUES ('Ersthelfer', 24)").lastInsertRowid);
  const cid = customer({ company: 'Objekt GmbH' });
  projectId = Number(db.run("INSERT INTO projects (number, name, customer_id, status, hourly_rate) VALUES ('P-T-1', 'Objekt', ?, 'aktiv', 3000)", cid).lastInsertRowid);
});
after(() => {
  server.close();
  cleanup();
});

const add = (o) => Number(db.run(
  'INSERT INTO shifts (staff_id, project_id, title, starts_at, ends_at, break_minutes, status, required_qualifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  o.staff_id ?? null, o.project_id ?? null, o.title || 'Dienst', o.starts_at, o.ends_at, o.break_minutes ?? 0, o.status || 'geplant', o.required_qualifications ?? null,
).lastInsertRowid);

test('Feiertage: Ostern und bewegliche Feiertage, Landesfeiertage', () => {
  assert.equal(sh.easter(2026), '2026-04-05');
  assert.equal(sh.easter(2027), '2027-03-28');
  const be = sh.holidays(2026, 'BE');
  assert.equal(be.get('2026-04-03'), 'Karfreitag');
  assert.equal(be.get('2026-05-14'), 'Christi Himmelfahrt');
  assert.equal(be.get('2026-03-08'), 'Internationaler Frauentag');
  assert.equal(be.get('2026-11-01'), undefined);
  assert.equal(sh.holidays(2026, 'BY').get('2026-11-01'), 'Allerheiligen');
  assert.equal(sh.holidays(2026, 'SN').get('2026-11-18'), 'Buß- und Bettag');
});

test('SFN-Aufteilung: Nachtschicht in den Feiertag, Pause anteilig', () => {
  // Heiligabend 22:00 bis 1. Weihnachtsfeiertag 06:00, keine Pause
  const sp = sh.splitMinutes({ starts_at: '2026-12-24T22:00', ends_at: '2026-12-25T06:00', break_minutes: 0 });
  assert.equal(sp.total, 480);
  assert.equal(sp.night, 480);
  assert.equal(sp.coreNight, 240);
  assert.equal(sp.holiday, 360);
  // Sonntagsschicht mit 60 Min. Pause: Fenster werden anteilig gekürzt
  const sun = sh.splitMinutes({ starts_at: '2026-10-25T08:00', ends_at: '2026-10-25T18:00', break_minutes: 60 });
  assert.equal(sun.total, 540);
  assert.equal(sun.sunday, 540);
  assert.ok(sun.night <= sun.total);
});

test('Konflikte: Doppelbuchung, Ruhezeit, Höchstarbeitszeit, Pausen', () => {
  add({ staff_id: staffA, starts_at: '2026-11-02T06:00', ends_at: '2026-11-02T14:00', break_minutes: 30 });
  const overlap = sh.conflicts({ staff_id: staffA, starts_at: '2026-11-02T12:00', ends_at: '2026-11-02T16:00' });
  assert.ok(overlap.some((w) => w.level === 'error' && /Doppelt/.test(w.text)));
  const rest = sh.conflicts({ staff_id: staffA, starts_at: '2026-11-02T20:00', ends_at: '2026-11-02T23:00' });
  assert.ok(rest.some((w) => /Ruhezeit/.test(w.text)));
  const long = sh.conflicts({ staff_id: null, starts_at: '2026-11-05T06:00', ends_at: '2026-11-05T18:00', break_minutes: 30 });
  assert.ok(long.some((w) => /10 Stunden/.test(w.text)));
  const pause = sh.conflicts({ staff_id: null, starts_at: '2026-11-05T06:00', ends_at: '2026-11-05T13:00', break_minutes: 0 });
  assert.ok(pause.some((w) => /30 Min/.test(w.text)));
});

test('Konflikte: Abwesenheit und fehlende/abgelaufene Qualifikation', () => {
  db.run("INSERT INTO absences (staff_id, type, date_from, date_to) VALUES (?, 'urlaub', '2026-11-10', '2026-11-12')", staffB);
  const abs = sh.conflicts({ staff_id: staffB, starts_at: '2026-11-11T08:00', ends_at: '2026-11-11T12:00' });
  assert.ok(abs.some((w) => /Urlaub/.test(w.text)));
  const missing = sh.conflicts({ staff_id: staffB, starts_at: '2026-11-20T08:00', ends_at: '2026-11-20T12:00', required_qualifications: String(qualId) });
  assert.ok(missing.some((w) => /fehlt/.test(w.text)));
  db.run("INSERT INTO staff_qualifications (staff_id, type_id, issued_at, expires_at) VALUES (?, ?, '2024-01-01', '2025-12-31')", staffB, qualId);
  const expired = sh.conflicts({ staff_id: staffB, starts_at: '2026-11-20T08:00', ends_at: '2026-11-20T12:00', required_qualifications: String(qualId) });
  assert.ok(expired.some((w) => /abgelaufen/.test(w.text)));
});

test('Stundenauswertung: Soll/Ist und Minijob-Grenze', () => {
  settings.setMany({ minijob_limit: '50,00' });
  add({ staff_id: staffB, starts_at: '2026-11-03T08:00', ends_at: '2026-11-03T14:00' });
  const rows = sh.staffReport('2026-11-01', '2026-11-30');
  const b = rows.find((r) => r.staff_id === staffB);
  assert.equal(b.total, 360);
  assert.equal(b.wage, 8400);
  assert.equal(b.minijobOver, true);
  settings.setMany({ minijob_limit: '603,00' });
});

test('HTTP: Schicht anlegen mit Konflikt wird blockiert, Serie legt mehrere an', async () => {
  const c = client(base);
  await c.login();
  // Konflikt (Urlaub) ohne force -> 409
  let r = await c.post('/dienstplan/schicht', { title: 'Tor 1', date: '2026-11-11', from: '08:00', to: '16:00', break_minutes: '30', staff_id: String(staffB), status: 'geplant' }, '/dienstplan/schicht/neu');
  assert.equal(r.status, 409);
  // Serie Mo–Fr über zwei Wochen, über Mitternacht
  r = await c.post('/dienstplan/schicht', {
    title: 'Nachtdienst', date: '2026-11-16', from: '22:00', to: '06:00', break_minutes: '45', staff_id: String(staffA), project_id: String(projectId),
    status: 'bestaetigt', repeat_until: '2026-11-27', repeat_days: '0',
  }, '/dienstplan/schicht/neu');
  assert.equal(r.status, 302);
  const created = db.all("SELECT * FROM shifts WHERE title = 'Nachtdienst' ORDER BY starts_at");
  assert.equal(created.length, 2); // Mo 16.11. und Mo 23.11.
  assert.equal(created[0].ends_at, '2026-11-17T06:00');
});

test('HTTP: Woche kopieren, Wochenplan & PDF', async () => {
  const c = client(base);
  await c.login();
  let r = await c.post('/dienstplan/woche-kopieren', { woche: '2026-11-02' }, '/dienstplan');
  assert.equal(r.status, 302);
  assert.ok(db.get("SELECT COUNT(*) AS n FROM shifts WHERE starts_at LIKE '2026-11-09%'").n >= 1);
  r = await c.req('/dienstplan?woche=2026-11-16');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Nachtdienst/);
  r = await c.req('/dienstplan/pdf?woche=2026-11-16');
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
});

test('HTTP: Schichten abrechnen erzeugt Rechnung mit Zuschlägen und sperrt Schichten', async () => {
  const c = client(base);
  await c.login();
  const r = await c.post('/dienstplan/abrechnen', { project_id: String(projectId), von: '2026-11-01', bis: '2026-11-30' }, '/dienstplan/auswertung');
  assert.equal(r.status, 302);
  const docId = Number(r.headers.get('location').split('/')[2]);
  const d = sales.load(docId);
  assert.equal(d.items[0].unit_price, 3000);
  assert.ok(d.items.some((i) => /Nachtzuschlag/.test(i.name)));
  assert.equal(db.get("SELECT COUNT(*) AS n FROM shifts WHERE project_id = ? AND invoiced_in IS NULL AND status != 'abgesagt'", projectId).n, 0);
  const s = db.get('SELECT id FROM shifts WHERE invoiced_in = ?', docId);
  const del = await c.post(`/dienstplan/schicht/${s.id}/loeschen`, {}, '/dienstplan');
  assert.equal(del.status, 302);
  assert.ok(db.get('SELECT id FROM shifts WHERE id = ?', s.id), 'abgerechnete Schicht darf nicht gelöscht werden');
});

test('HTTP: Mitarbeiter sieht Dienstplan, darf aber nicht planen', async () => {
  db.run("INSERT INTO users (email, name, password_hash, role) VALUES ('wache@test.de', 'Wache', ?, 'mitarbeiter')", sec.hashPassword('Test-Passwort1'));
  const c = client(base);
  await c.login('wache@test.de', 'Test-Passwort1');
  assert.equal((await c.req('/dienstplan')).status, 200);
  assert.equal((await c.req('/dienstplan/schicht/neu')).status, 403);
  assert.equal((await c.req('/personal')).status, 403);
  assert.equal((await c.req('/dienstplan/auswertung')).status, 403);
});
