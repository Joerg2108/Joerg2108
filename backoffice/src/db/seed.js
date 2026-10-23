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
  company_name: 'Jörg Noack Sicherheitsdienstleistungen',
  company_owner: 'Jörg Noack',
  company_street: 'Musterstraße 12',
  company_zip: '10115',
  company_city: 'Berlin',
  company_email: 'info@joerg-noack.com',
  company_phone: '+49 30 1234567',
  company_website: 'https://joerg-noack.com',
  company_tax_number: '12/345/67890',
  company_vat_id: 'DE123456789',
  company_register: 'Bewacherregister-ID: 0000000 (Beispiel)',
  bank_name: 'Musterbank Berlin',
  bank_iban: 'DE89 3704 0044 0532 0130 00',
  bank_bic: 'COBADEFFXXX',
});

const pw = process.env.ADMIN_PASSWORD || 'Demo-Passwort1';
const admin = Number(db.run("INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES (?, 'Jörg Noack', ?, 'admin', 6500)", config.admin.email, hashPassword(pw)).lastInsertRowid);
const staff = Number(db.run("INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES ('mitarbeiter@example.com', 'Max Wachsam', ?, 'mitarbeiter', 3800)", hashPassword(pw)).lastInsertRowid);
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

const c1 = customer({ company: 'Logistikzentrum Nord GmbH', salutation: 'Frau', first: 'Sabine', last: 'Kramer', email: 'einkauf@logistik-nord.example', phone: '030 555 100', street: 'Industriestraße 5', zip: '13403', city: 'Berlin', vat: 'DE987654321', tags: 'Objektschutz, Stammkunde', terms: 14 });
const c2 = customer({ company: 'Eventagentur Spreelicht UG', first: 'Tim', last: 'Becker', email: 'tim@spreelicht.example', phone: '030 555 200', street: 'Am Ufer 9', zip: '10997', city: 'Berlin', tags: 'Veranstaltungen' });
const c3 = customer({ type: 'behoerde', company: 'Bezirksamt Musterstadt', first: 'Petra', last: 'Amt', email: 'rechnung@bezirksamt.example', street: 'Rathausplatz 1', zip: '10178', city: 'Berlin', leitweg: '11000000-12345-67', tags: 'Öffentlich, XRechnung', terms: 30 });
const c4 = customer({ type: 'privat', salutation: 'Herr', first: 'Klaus', last: 'Villenbesitzer', email: 'k.v@example.com', phone: '0170 1234567', street: 'Seestraße 77', zip: '14109', city: 'Berlin', tags: 'Revierdienst' });
const c5 = customer({ company: 'Baustelle Wohnpark Süd GmbH & Co. KG', first: 'Oliver', last: 'Bauleiter', email: 'bau@wohnpark.example', street: 'Baufeld 3', zip: '12355', city: 'Berlin', tags: 'Baustellenbewachung', status: 'interessent' });

const products = [
  ['SD-01', 'Sicherheitsmitarbeiter (§ 34a GewO)', 'Einsatz je Stunde, inkl. Dienstkleidung', 'Std.', 2850],
  ['SD-02', 'Sicherheitsmitarbeiter Nacht-/Sonntagszuschlag', 'Zuschlag je Stunde', 'Std.', 650],
  ['SD-03', 'Objektleiter / Schichtführer', 'je Stunde', 'Std.', 3600],
  ['RV-01', 'Revierkontrolle', 'Kontrollfahrt inkl. Protokoll', 'Stk.', 3900],
  ['BW-01', 'Brandsicherheitswache', 'je Stunde, gem. VStättVO', 'Std.', 3200],
  ['AL-01', 'Alarmverfolgung', 'Intervention nach Alarm inkl. Anfahrt', 'Stk.', 8500],
  ['KO-01', 'Sicherheitskonzept / Gefährdungsanalyse', 'Erstellung inkl. Begehung', 'Pauschal', 89000],
  ['SC-01', 'Schulung Hausrecht & Deeskalation', 'Halbtagesschulung bis 12 Personen', 'Pauschal', 69000],
];
for (const p of products) db.run('INSERT INTO products (sku, name, description, unit, price, tax_rate) VALUES (?, ?, ?, ?, ?, 19)', ...p);

const pid = (name, customerId, status, budget, rate) => Number(db.run(
  'INSERT INTO projects (number, name, customer_id, status, start_date, budget, hourly_rate, manager_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  numbering.next('project'), name, customerId, status, ago(60), budget, rate, admin, 'Demo-Projekt',
).lastInsertRowid);
const p1 = pid('Objektschutz Logistikzentrum Nord', c1, 'aktiv', 4500000, 2850);
const p2 = pid('Sommerfest Spreelicht – Veranstaltungsschutz', c2, 'aktiv', 800000, 2850);
const p3 = pid('Sicherheitskonzept Rathaus', c3, 'geplant', 150000, 6500);

const item = (sku, qty, extra = {}) => {
  const p = products.find((x) => x[0] === sku);
  return { name: p[1], description: p[2], unit: p[3], unit_price: p[4], quantity: qty, tax_rate: 19, discount_pct: 0, ...extra };
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
  const id = doc('rechnung', c1, issue, [item('SD-01', 300 + m * 10), item('SD-02', 90), item('RV-01', 20)], { project: p1, title: 'Objektschutz Monatsabrechnung', service: issue.slice(0, 8) + '01', until: issue });
  sales.finalize(id);
  if (m > 1) sales.addPayment(id, { amount: sales.load(id).gross_total, paid_at: f.addDays(issue, 10), method: 'ueberweisung' }, admin);
}
const inv2 = doc('rechnung', c2, ago(40), [item('SD-01', 48), item('BW-01', 12), item('SD-03', 12)], { project: p2, title: 'Veranstaltungsschutz Sommerfest' });
sales.finalize(inv2);
sales.addPayment(inv2, { amount: 100000, paid_at: ago(20), method: 'ueberweisung', note: 'Anzahlung' }, admin);
sales.createDunning(inv2, admin);
const inv3 = doc('rechnung', c4, ago(25), [item('RV-01', 30), item('AL-01', 2)], { title: 'Revierdienst Villa' });
sales.finalize(inv3);
const inv4 = doc('rechnung', c3, ago(3), [item('KO-01', 1)], { project: p3, title: 'Gefährdungsanalyse Rathaus', terms: 30 });
sales.finalize(inv4);
doc('rechnung', c1, today, [item('SD-01', 320), item('SD-02', 100)], { project: p1, title: 'Objektschutz (Entwurf)' });

const q1 = doc('angebot', c5, ago(5), [item('SD-01', 720, { description: 'Baustellenbewachung nachts, 3 Monate' }), item('RV-01', 60), item('AL-01', 4)], { title: 'Angebot Baustellenbewachung Wohnpark Süd' });
db.run("UPDATE documents_sales SET status = 'versendet' WHERE id = ?", q1);
const q2 = doc('angebot', c2, ago(70), [item('SD-01', 48), item('BW-01', 12)], { title: 'Angebot Sommerfest' });
db.run("UPDATE documents_sales SET status = 'angenommen' WHERE id = ?", q2);
doc('angebot', c3, ago(15), [item('SC-01', 2)], { title: 'Schulung Hausrecht für Mitarbeitende' });

// Wiederkehrende Rechnung: Revierdienst monatlich
const tpl = doc('rechnung', c4, ago(1), [item('RV-01', 30, { description: 'Monatspauschale Revierkontrollen' })], { title: 'Revierdienst Monatspauschale' });
db.run('INSERT INTO recurring_invoices (template_id, interval, next_date, auto_finalize) VALUES (?, ?, ?, 0)', tpl, 'monatlich', f.addMonths(today, 1).slice(0, 8) + '01');

// Anfragen
const leads = [
  ['Andrea Hotelier', 'Hotel Am Park', 'a.hotel@example.com', 'Nachtportier & Sicherheitsdienst', 'Wir suchen ab nächsten Monat einen Nachtdienst für unser Hotel (22–6 Uhr).', 'neu', 1200000, 1],
  ['Markus Event', 'Clubhaus 21', 'm@clubhaus.example', 'Einlasskontrolle Wochenende', 'Freitag/Samstag Einlass, 2 Personen, 21–4 Uhr.', 'neu', 650000, 0],
  ['Julia Retail', 'ModeHaus Mitte', 'j@modehaus.example', 'Ladendetektiv', 'Bitte um Angebot für Ladendetektive in der Vorweihnachtszeit.', 'kontaktiert', 480000, 2],
  ['Oliver Bauleiter', 'Baustelle Wohnpark Süd GmbH & Co. KG', 'bau@wohnpark.example', 'Baustellenbewachung', 'Nachtbewachung für 3 Monate.', 'qualifiziert', 2400000, 1],
  ['Tim Becker', 'Eventagentur Spreelicht UG', 'tim@spreelicht.example', 'Sommerfest', 'Sicherheit für Sommerfest mit 800 Gästen.', 'gewonnen', 780000, 3],
];
for (const [name, company, email, subject, message, status, value, d] of leads) {
  db.run("INSERT INTO leads (name, company, email, subject, message, status, value, source, consent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'website', 1, datetime('now', ?))", name, company, email, subject, message, status, value, `-${d} days`);
}

// Aufgaben, Termine, Zeiten, Ausgaben
const task = (title, status, priority, due, project, user) => db.run('INSERT INTO tasks (title, status, priority, due_date, project_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', title, status, priority, due, project, user, admin);
task('Dienstplan Dezember erstellen', 'offen', 'hoch', f.addDays(today, 3), p1, admin);
task('Unterweisung neue Mitarbeiter (§ 34a Nachweise prüfen)', 'in_arbeit', 'dringend', f.addDays(today, 1), null, admin);
task('Lageplan & Fluchtwege für Sommerfest abstimmen', 'erledigt', 'normal', ago(30), p2, staff);
task('Begehung Rathaus terminieren', 'offen', 'normal', f.addDays(today, 7), p3, admin);
task('Wachbuch digitalisieren', 'wartet', 'niedrig', null, p1, staff);
db.run("UPDATE tasks SET completed_at = datetime('now','-2 days') WHERE status = 'erledigt'");

const appt = (title, day, from, to, customerId, color, location) => db.run('INSERT INTO appointments (title, starts_at, ends_at, customer_id, user_id, color, location) VALUES (?, ?, ?, ?, ?, ?, ?)', title, `${f.addDays(today, day)}T${from}`, `${f.addDays(today, day)}T${to}`, customerId, admin, color, location);
appt('Begehung Wohnpark Süd', 1, '10:00', '11:30', c5, 'gruen', 'Baufeld 3, Berlin');
appt('Quartalsgespräch Logistik Nord', 4, '14:00', '15:00', c1, 'blau', 'Industriestraße 5');
appt('Schulung Deeskalation', 9, '09:00', '13:00', null, 'lila', 'Schulungsraum');

for (let i = 1; i <= 15; i++) {
  db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', i % 2 ? admin : staff, p1, c1, ago(i), 480, 'Objektschutz Tagschicht');
}
db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', admin, p3, c3, ago(2), 180, 'Vorbereitung Begehung');

const sup = Number(db.run("INSERT INTO suppliers (name, email) VALUES ('Workwear Profi GmbH', 'shop@workwear.example')").lastInsertRowid);
const exp = (date, supplier, category, desc, gross, rate = 19) => {
  const net = Math.round(gross / (1 + rate / 100));
  db.run('INSERT INTO expenses (date, supplier_id, supplier_name, category, description, net_amount, tax_rate, tax_amount, gross_amount, paid, paid_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)', date, supplier ? sup : null, supplier || 'Diverse', category, desc, net, rate, gross - net, gross, date, admin);
};
for (let m = 5; m >= 0; m--) {
  const d = f.addMonths(today, -m).slice(0, 8) + '05';
  if (d <= today) {
    exp(d, null, 'Fahrzeug', 'Tanken Dienstwagen', 18500);
    exp(d, null, 'Kommunikation', 'Mobilfunk & Funkgeräte', 7990);
    exp(d, null, 'Versicherungen', 'Betriebshaftpflicht (anteilig)', 12000, 0);
  }
}
exp(ago(50), 'Workwear Profi GmbH', 'Ausrüstung', 'Dienstkleidung & Warnwesten', 64260);
exp(ago(12), null, 'Fortbildung', 'Sachkundeprüfung § 34a Mitarbeiter', 21000, 0);

db.run("INSERT INTO notifications (user_id, title, link) VALUES (NULL, 'Willkommen im Back Office! Starte mit den Einstellungen.', '/admin/einstellungen')");

console.log('Demo-Daten angelegt.');
console.log(`Login: ${config.admin.email} / ${pw}  (weitere: mitarbeiter@example.com, buchhaltung@example.com – gleiches Passwort)`);
db.close();
