'use strict';
// Demo-Daten für Vorführung & Tests:  npm run seed   (Option --force überschreibt eine bestehende Datenbank)
const fs = require('node:fs');
const config = require('../config');

if (fs.existsSync(config.dbFile) && !process.argv.includes('--force')) {
  console.error(`Datenbank existiert bereits (${config.dbFile}). Mit "npm run seed -- --force" neu anlegen.`);
  process.exit(1);
}
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbFile + suffix, { force: true });

const db = require('./index');
const { hashPassword } = require('../lib/security');
const numbering = require('../lib/numbering');
const sales = require('../lib/sales');
const settings = require('../lib/settings');
const f = require('../lib/format');

db.open();

settings.setMany({
  company_name: 'Jörg Noack Dienstleistungen',
  company_owner: 'Jörg Noack',
  company_street: 'Musterstraße 12',
  company_zip: '10115',
  company_city: 'Berlin',
  company_email: 'info@joerg-noack.com',
  company_phone: '+49 30 1234567',
  company_website: 'https://joerg-noack.com',
  company_tax_number: '12/345/67890',
  company_vat_id: 'DE123456789',
  company_register: '',
  bank_name: 'Musterbank Berlin',
  bank_iban: 'DE89 3704 0044 0532 0130 00',
  bank_bic: 'COBADEFFXXX',
});

const pw = process.env.ADMIN_PASSWORD || 'Demo-Passwort1';
const admin = Number(db.run("INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES (?, 'Jörg Noack', ?, 'admin', 6500)", config.admin.email, hashPassword(pw)).lastInsertRowid);
const staff = Number(db.run("INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES ('mitarbeiter@example.com', 'Max Werner', ?, 'mitarbeiter', 3800)", hashPassword(pw)).lastInsertRowid);
db.run("INSERT INTO users (email, name, password_hash, role) VALUES ('buchhaltung@example.com', 'Bea Buchhalter', ?, 'buchhaltung')", hashPassword(pw));

const today = f.today();
const ago = (d) => f.addDays(today, -d);

const customer = (o) => {
  const number = numbering.next('customer');
  return Number(db.run(
    `INSERT INTO customers (number, type, company, salutation, first_name, last_name, email, phone, street, zip, city, vat_id, leitweg_id, payment_terms, tags, status, gdpr_consent, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    number, o.type || 'firma', o.company || null, o.salutation || null, o.first || null, o.last || null, o.email || null, o.phone || null,
    o.street || null, o.zip || null, o.city || null, o.vat || null, o.leitweg || null, o.terms ?? null, o.tags || null, o.status || 'aktiv', admin,
  ).lastInsertRowid);
};

const c1 = customer({ company: 'Hausverwaltung Spreebogen GmbH', salutation: 'Frau', first: 'Sabine', last: 'Kramer', email: 'verwaltung@spreebogen.example', phone: '030 555 100', street: 'Uferweg 5', zip: '10557', city: 'Berlin', vat: 'DE987654321', tags: 'Hausmeisterdienst, Stammkunde', terms: 14 });
const c2 = customer({ company: 'Galerie Lichtraum UG', first: 'Tim', last: 'Becker', email: 'tim@lichtraum.example', phone: '030 555 200', street: 'Auguststraße 9', zip: '10117', city: 'Berlin', tags: 'Ausstellungsbau, Kultur' });
const c3 = customer({ type: 'behoerde', company: 'Bezirksamt Musterstadt – Kulturamt', first: 'Petra', last: 'Amt', email: 'rechnung@bezirksamt.example', street: 'Rathausplatz 1', zip: '10178', city: 'Berlin', leitweg: '11000000-12345-67', tags: 'Öffentlich, XRechnung, Digitalisierung', terms: 30 });
const c4 = customer({ company: 'Bäckerei Krume & Kruste', salutation: 'Herr', first: 'Klaus', last: 'Krume', email: 'klaus@krume.example', phone: '0170 1234567', street: 'Marktstraße 77', zip: '12043', city: 'Berlin', tags: 'Social Media, Online-Marketing' });
const c5 = customer({ company: 'Konzerthaus am Kanal e. V.', first: 'Oliver', last: 'Bühne', email: 'produktion@konzerthaus.example', street: 'Kanalstraße 3', zip: '12047', city: 'Berlin', tags: 'Künstlerbetreuung, Veranstaltungen', status: 'interessent' });

require('../lib/catalog').importCatalog();
const catalogItems = require('../lib/catalog').CATALOG;

const pid = (name, customerId, status, budget, rate, description) => Number(db.run(
  'INSERT INTO projects (number, name, customer_id, status, start_date, budget, hourly_rate, manager_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  numbering.next('project'), name, customerId, status, ago(60), budget, rate, admin, description,
).lastInsertRowid);
const p1 = pid('Hausmeisterbetreuung Wohnanlage Spreebogen', c1, 'aktiv', 2400000, 3900, 'Hausmeisterdienst für 3 Häuser mit 48 Wohneinheiten inkl. Außenanlagen.');
const p2 = pid('Ausstellung „Licht & Raum“ – Aufbau und Künstlerbetreuung', c2, 'aktiv', 800000, 4200, 'Ausstellungsbau, Vernissage und Betreuung der ausstellenden Künstler.');
const p3 = pid('Digitalisierung Verwaltungsabläufe Kulturamt', c3, 'geplant', 1500000, 7500, 'Digitale Antrags- und Dokumentationsabläufe, KI-Unterstützung, Berichtswesen.');

const item = (sku, qty, extra = {}) => {
  const p = catalogItems.find((x) => x.sku === sku);
  return { name: p.name, description: p.description, unit: p.unit, unit_price: p.price, quantity: qty, tax_rate: 19, discount_pct: 0, ...extra };
};
const doc = (kind, customerId, issue, items, extra = {}) => sales.save({
  kind, userId: admin, items,
  data: { customer_id: customerId, project_id: extra.project || null, title: extra.title || '', intro: settings.get(kind === 'angebot' ? 'quote_intro' : 'invoice_intro'),
    footer: settings.get(kind === 'angebot' ? 'quote_footer' : 'invoice_footer'), issue_date: issue, service_date: extra.service || issue, service_until: extra.until || null,
    due_date: kind === 'rechnung' ? f.addDays(issue, extra.terms || 14) : null, valid_until: kind === 'angebot' ? f.addDays(issue, 30) : null },
});

// Bezahlte, offene, überfällige Rechnungen über die letzten Monate verteilt
for (let m = 5; m >= 1; m--) {
  const issue = f.addMonths(today, -m).slice(0, 8) + '28';
  const id = doc('rechnung', c1, issue, [item('HM-02', 3), item('HM-01', 10 + m * 2, { description: 'Zusätzliche Einsätze lt. Stundennachweis' })], { project: p1, title: 'Hausmeisterdienst Monatsabrechnung', service: issue.slice(0, 8) + '01', until: issue });
  sales.finalize(id);
  if (m > 1) sales.addPayment(id, { amount: sales.load(id).gross_total, paid_at: f.addDays(issue, 10), method: 'ueberweisung' }, admin);
}
const inv2 = doc('rechnung', c2, ago(40), [item('EV-03', 36), item('EV-02', 2), item('OD-01', 6)], { project: p2, title: 'Ausstellungsbau und Künstlerbetreuung Vernissage' });
sales.finalize(inv2);
sales.addPayment(inv2, { amount: 100000, paid_at: ago(20), method: 'ueberweisung', note: 'Anzahlung' }, admin);
sales.createDunning(inv2, admin);
const inv3 = doc('rechnung', c4, ago(25), [item('DM-04', 1), item('DM-01', 6, { description: 'Einrichtung Google-Unternehmensprofil und Newsletter-Vorlage' })], { title: 'Social Media & Online-Marketing September' });
sales.finalize(inv3);
const inv4 = doc('rechnung', c3, ago(3), [item('OD-02', 12, { description: 'Ist-Analyse der Antrags- und Ablageprozesse inkl. Workshop' })], { project: p3, title: 'Prozessanalyse Digitalisierung', terms: 30 });
sales.finalize(inv4);
doc('rechnung', c1, today, [item('HM-02', 3), item('MO-01', 8, { description: 'Austausch von 4 Wohnungseingangstüren (Normelemente)' })], { project: p1, title: 'Hausmeisterdienst & Türentausch (Entwurf)' });

const q1 = doc('angebot', c5, ago(5), [item('EV-02', 6, { description: 'Künstlerbetreuung an 6 Konzertabenden inkl. Transfers' }), item('DM-03', 12), item('OD-04', 4)], { title: 'Angebot Künstlerbetreuung Konzertreihe Herbst' });
db.run("UPDATE documents_sales SET status = 'versendet' WHERE id = ?", q1);
const q2 = doc('angebot', c2, ago(70), [item('EV-03', 36), item('EV-02', 2)], { title: 'Angebot Ausstellungsbau „Licht & Raum“' });
db.run("UPDATE documents_sales SET status = 'angenommen' WHERE id = ?", q2);
doc('angebot', c3, ago(15), [item('OD-02', 40), item('OD-03', 16, { description: 'Einführung KI-Assistenz für Schriftverkehr und Protokolle inkl. Schulung' }), item('OD-06', 8)], { project: p3, title: 'Angebot Digitalisierung & KI-Unterstützung' });

// Wiederkehrende Rechnung: Social-Media-Betreuung monatlich
const tpl = doc('rechnung', c4, ago(1), [item('DM-04', 1)], { title: 'Social-Media-Betreuung Monatspauschale' });
db.run('INSERT INTO recurring_invoices (template_id, interval, next_date, auto_finalize) VALUES (?, ?, ?, 0)', tpl, 'monatlich', f.addMonths(today, 1).slice(0, 8) + '01');

// Anfragen
const leads = [
  ['Andrea Hoffmann', 'Hotel Am Park', 'a.hoffmann@example.com', 'Hausmeisterdienst für Hotel', 'Wir suchen ab nächsten Monat einen Hausmeisterdienst für unser Hotel (ca. 20 Std./Woche).', 'neu', 1200000, 1],
  ['Markus Event', 'Clubhaus 21', 'm@clubhaus.example', 'Social-Media-Betreuung', 'Wir brauchen Unterstützung bei Instagram und TikTok für unsere Veranstaltungen.', 'neu', 650000, 0],
  ['Julia Retail', 'ModeHaus Mitte', 'j@modehaus.example', 'Kundenanfragen & Online-Shop', 'Unterstützung bei der Beantwortung von Kundenanfragen und im Online-Vertrieb.', 'kontaktiert', 480000, 2],
  ['Oliver Bühne', 'Konzerthaus am Kanal e. V.', 'produktion@konzerthaus.example', 'Künstlerbetreuung Konzertreihe', 'Betreuung der Künstler an 6 Abenden im Herbst.', 'qualifiziert', 2400000, 1],
  ['Tim Becker', 'Galerie Lichtraum UG', 'tim@lichtraum.example', 'Ausstellungsaufbau', 'Aufbau unserer neuen Ausstellung inkl. Vernissage.', 'gewonnen', 780000, 3],
];
for (const [name, company, email, subject, message, status, value, d] of leads) {
  db.run("INSERT INTO leads (name, company, email, subject, message, status, value, source, consent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'website', 1, datetime('now', ?))", name, company, email, subject, message, status, value, `-${d} days`);
}

// Aufgaben, Termine, Zeiten, Ausgaben
const task = (title, status, priority, due, project, user) => db.run('INSERT INTO tasks (title, status, priority, due_date, project_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', title, status, priority, due, project, user, admin);
task('Einsatzplan Dezember erstellen', 'offen', 'hoch', f.addDays(today, 3), p1, admin);
task('Arbeitsschutzunterweisung neue Mitarbeitende durchführen', 'in_arbeit', 'dringend', f.addDays(today, 1), null, admin);
task('Hängeplan & Beleuchtung mit Galerie abstimmen', 'erledigt', 'normal', ago(30), p2, staff);
task('Workshop-Termin Kulturamt vereinbaren', 'offen', 'normal', f.addDays(today, 7), p3, admin);
task('Prüfprotokolle Spielplatz digitalisieren', 'wartet', 'niedrig', null, p1, staff);
db.run("UPDATE tasks SET completed_at = datetime('now','-2 days') WHERE status = 'erledigt'");

const appt = (title, day, from, to, customerId, color, location) => db.run('INSERT INTO appointments (title, starts_at, ends_at, customer_id, user_id, color, location) VALUES (?, ?, ?, ?, ?, ?, ?)', title, `${f.addDays(today, day)}T${from}`, `${f.addDays(today, day)}T${to}`, customerId, admin, color, location);
appt('Vorgespräch Konzertreihe', 1, '10:00', '11:30', c5, 'gruen', 'Kanalstraße 3, Berlin');
appt('Objektbegehung Spreebogen', 4, '14:00', '15:00', c1, 'blau', 'Uferweg 5');
appt('KI-Workshop Kulturamt', 9, '09:00', '13:00', c3, 'lila', 'Rathausplatz 1');

for (let i = 1; i <= 15; i++) {
  db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', i % 2 ? admin : staff, p1, c1, ago(i), 240, 'Hausmeisterdienst: Kontrollgang, Kleinreparaturen');
}
db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', admin, p3, c3, ago(2), 180, 'Vorbereitung Prozessworkshop');

const sup = Number(db.run("INSERT INTO suppliers (name, email) VALUES ('Werkzeug & Bedarf Profi GmbH', 'shop@werkzeug.example')").lastInsertRowid);
const exp = (date, supplier, category, desc, gross, rate = 19) => {
  const net = Math.round(gross / (1 + rate / 100));
  db.run('INSERT INTO expenses (date, supplier_id, supplier_name, category, description, net_amount, tax_rate, tax_amount, gross_amount, paid, paid_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)', date, supplier ? sup : null, supplier || 'Diverse', category, desc, net, rate, gross - net, gross, date, admin);
};
for (let m = 5; m >= 0; m--) {
  const d = f.addMonths(today, -m).slice(0, 8) + '05';
  if (d <= today) {
    exp(d, null, 'Fahrzeug', 'Tanken Transporter', 18500);
    exp(d, null, 'Hard- & Software', 'Software-Abos (Office, KI-Tools, Social-Media-Planung)', 7990);
    exp(d, null, 'Versicherungen', 'Betriebshaftpflicht (anteilig)', 12000, 0);
  }
}
exp(ago(50), 'Werkzeug & Bedarf Profi GmbH', 'Ausrüstung', 'Akkuschrauber-Set, Leitern, Arbeitskleidung', 64260);
exp(ago(12), null, 'Fortbildung', 'Online-Kurs KI im Büroalltag', 21000, 0);

// Einsatzplanung: Qualifikationen, Personal, Nachweise, Urlaub, Schichten (aktuelle + nächste Woche)
const qt = (name, months, desc) => Number(db.run('INSERT INTO qualification_types (name, validity_months, description) VALUES (?, ?, ?)', name, months, desc).lastInsertRowid);
const qAS = qt('Arbeitsschutzunterweisung', 12, 'Jährliche Unterweisung nach § 12 ArbSchG');
const qEH = qt('Ersthelfer', 24, 'Erste-Hilfe-Ausbildung, Auffrischung alle 2 Jahre');
const qHB = qt('Hubarbeitsbühne / Arbeiten in Höhe', 60, 'Bedienerschulung nach DGUV Grundsatz 308-008');
const qST = qt('Staplerschein', null, 'Fahrausweis Flurförderzeuge (DGUV Grundsatz 308-001)');
const qFS = qt('Führerschein Klasse B', null, '');
const staffRow = (no, first, last, emp, hours, wage, color, userId) => Number(db.run(
  'INSERT INTO staff (personnel_no, first_name, last_name, email, phone, employment, weekly_hours, hourly_wage, color, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  no, first, last, `${first.toLowerCase()}@example.com`, '0170 000000' + no.slice(-1), emp, hours, wage, color, userId,
).lastInsertRowid);
const s1 = staffRow('1001', 'Max', 'Werner', 'vollzeit', 40, 1600, 'blau', staff);
const s2 = staffRow('1002', 'Sandra', 'Klein', 'teilzeit', 30, 1650, 'gruen', null);
const s3 = staffRow('1003', 'Ali', 'Demir', 'teilzeit', 25, 1550, 'orange', null);
const s4 = staffRow('1004', 'Lena', 'Vogt', 'minijob', 8, 1390, 'lila', null);
const sq = (sid, tid, issued, expires) => db.run('INSERT INTO staff_qualifications (staff_id, type_id, issued_at, expires_at) VALUES (?, ?, ?, ?)', sid, tid, issued, expires);
for (const sid of [s1, s2, s3, s4]) sq(sid, qAS, ago(120), f.addDays(today, 245));
sq(s1, qEH, ago(400), f.addDays(today, 20)); sq(s2, qEH, ago(100), f.addDays(today, 630));
sq(s1, qFS, '2010-01-01', null); sq(s3, qFS, '2015-01-01', null);
sq(s1, qHB, '2022-04-01', '2027-03-31'); sq(s3, qHB, '2020-05-01', ago(40)); sq(s1, qST, '2019-02-01', null);
const mon = f.addDays(today, -((new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7));
db.run("INSERT INTO absences (staff_id, type, date_from, date_to, note) VALUES (?, 'urlaub', ?, ?, 'Jahresurlaub')", s2, f.addDays(mon, 10), f.addDays(mon, 13));
const location = { [p1]: 'Uferweg 5, Berlin', [p2]: 'Auguststraße 9, Berlin', [p3]: 'Rathausplatz 1, Berlin' };
const shift = (sid, dayOffset, from, to, brk, title, project, reqs, status = 'bestaetigt') => {
  const day = f.addDays(mon, dayOffset);
  const end = to <= from ? f.addDays(day, 1) : day;
  db.run('INSERT INTO shifts (staff_id, project_id, customer_id, title, location, starts_at, ends_at, break_minutes, status, required_qualifications, created_by) VALUES (?, ?, (SELECT customer_id FROM projects WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?)',
    sid, project, project, title, location[project], `${day}T${from}`, `${end}T${to}`, brk, status, reqs, admin);
};
for (let w = 0; w < 2; w++) {
  const st = w ? 'geplant' : 'bestaetigt';
  for (let d = 0; d < 5; d++) {
    const o = w * 7 + d;
    // Max: Hausmeisterdienst Vollzeit, Sandra: Hausmeisterdienst vormittags (außer Urlaub in Woche 2)
    shift(s1, o, '07:00', '15:30', 30, 'Hausmeisterdienst Wohnanlage', p1, String(qAS), st);
    if (!(w === 1 && d >= 3)) shift(s2, o, '08:00', '14:00', 0, 'Hausmeisterdienst Außenanlagen', p1, String(qAS), st);
    else shift(null, o, '08:00', '14:00', 0, 'Hausmeisterdienst Außenanlagen', p1, String(qAS), 'geplant');
  }
  // Ausstellungsaufbau Donnerstag/Freitag
  shift(s3, w * 7 + 3, '09:00', '17:30', 30, 'Ausstellungsbau', p2, String(qAS), st);
  shift(w ? null : s3, w * 7 + 4, '09:00', '17:30', 30, 'Ausstellungsbau', p2, String(qAS), st);
}
// Bewusste Beispiele für die Konfliktprüfung: abgelaufene Hubarbeitsbühnen-Schulung, fehlender Ersthelfer-Nachweis
shift(s3, 5, '08:00', '14:00', 30, 'Ausstellungsbau – Beleuchtung mit Hubarbeitsbühne', p2, `${qAS},${qHB}`);
shift(s4, 5, '18:00', '23:00', 0, 'Künstlerbetreuung Vernissage', p2, String(qEH));
shift(null, 12, '18:00', '23:00', 0, 'Künstlerbetreuung Finissage', p2, String(qEH), 'geplant');

db.run("INSERT INTO notifications (user_id, title, link) VALUES (NULL, 'Willkommen im Back Office! Starte mit den Einstellungen.', '/admin/einstellungen')");

console.log('Demo-Daten angelegt.');
console.log(`Login: ${config.admin.email} / ${pw}  (weitere: mitarbeiter@example.com, buchhaltung@example.com – gleiches Passwort)`);
db.close();
