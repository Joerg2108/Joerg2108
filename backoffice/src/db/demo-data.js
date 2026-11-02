'use strict';
// Neutrale Musterdaten der fiktiven „Muster Service GmbH“ – für Vorführungen, Demo-Instanz und Tests.
// Alle Daten liegen relativ zum heutigen Tag, damit Dashboard, Mahnwesen und Dienstplan immer aktuell wirken.
const db = require('./index');
const { hashPassword } = require('../lib/security');
const numbering = require('../lib/numbering');
const sales = require('../lib/sales');
const settings = require('../lib/settings');
const catalog = require('../lib/catalog');
const f = require('../lib/format');

const PASSWORD = 'Demo-Passwort1';
const ACCOUNTS = [
  { email: 'chefin@muster-service.example', name: 'Alexandra Muster', role: 'admin', rate: 9500, label: 'Geschäftsführung', hint: 'Voller Zugriff auf alle Module und Einstellungen' },
  { email: 'buchhaltung@muster-service.example', name: 'Bernd Beleg', role: 'buchhaltung', rate: 0, label: 'Buchhaltung', hint: 'Rechnungen, Ausgaben, Berichte, DATEV-Export' },
  { email: 'mitarbeiter@muster-service.example', name: 'Max Werner', role: 'mitarbeiter', rate: 4200, label: 'Mitarbeiter', hint: 'Eigene Aufgaben, Zeiten und Dienstplan' },
];

// adminEmail/password: für "npm run seed" (eigene Zugangsdaten); ohne Angabe gelten die Demo-Zugänge
function seed({ adminEmail, password = PASSWORD } = {}) {
  settings.setMany({
    company_name: 'Muster Service GmbH',
    company_owner: 'Alexandra Muster',
    company_street: 'Beispielstraße 12',
    company_zip: '12345',
    company_city: 'Musterstadt',
    company_email: 'info@muster-service.example',
    company_phone: '+49 123 456780',
    company_website: 'https://www.muster-service.example',
    company_tax_number: '12/345/67890',
    company_vat_id: 'DE123456789',
    company_register: 'Amtsgericht Musterstadt HRB 12345',
    bank_name: 'Musterbank',
    bank_iban: 'DE89 3704 0044 0532 0130 00',
    bank_bic: 'COBADEFFXXX',
    public_contact_url: 'https://www.muster-service.example/kontakt',
    public_catalog_intro: 'Beratung, Service, Montage und Digitales – alles aus einer Hand.',
  });

  const users = ACCOUNTS.map((a, i) => Number(db.run(
    'INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES (?, ?, ?, ?, ?)',
    i === 0 && adminEmail ? adminEmail : a.email, a.name, hashPassword(password), a.role, a.rate,
  ).lastInsertRowid));
  const [admin, , staff] = users;

  const today = f.today();
  const ago = (d) => f.addDays(today, -d);

  const customer = (o) => Number(db.run(
    `INSERT INTO customers (number, type, company, salutation, first_name, last_name, email, phone, street, zip, city, vat_id, leitweg_id, payment_terms, tags, status, gdpr_consent, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    numbering.next('customer'), o.type || 'firma', o.company || null, o.salutation || null, o.first || null, o.last || null, o.email || null, o.phone || null,
    o.street || null, o.zip || null, o.city || null, o.vat || null, o.leitweg || null, o.terms ?? null, o.tags || null, o.status || 'aktiv', admin,
  ).lastInsertRowid);

  const c1 = customer({ company: 'Autohaus Beispiel GmbH', salutation: 'Frau', first: 'Sabine', last: 'Kramer', email: 'service@autohaus-beispiel.example', phone: '0123 555100', street: 'Industriering 5', zip: '12345', city: 'Musterstadt', vat: 'DE987654321', tags: 'Wartungsvertrag, Stammkunde', terms: 14 });
  const c2 = customer({ company: 'Praxis Dr. Sommer', salutation: 'Herr', first: 'Tim', last: 'Sommer', email: 'praxis@dr-sommer.example', phone: '0123 555200', street: 'Lindenallee 9', zip: '12345', city: 'Musterstadt', tags: 'Website, Digital' });
  const c3 = customer({ type: 'behoerde', company: 'Stadtwerke Musterstadt', first: 'Petra', last: 'Amt', email: 'rechnung@stadtwerke-musterstadt.example', street: 'Rathausplatz 1', zip: '12345', city: 'Musterstadt', leitweg: '11000000-12345-67', tags: 'Öffentlich, XRechnung', terms: 30 });
  const c4 = customer({ company: 'Café Morgenrot', salutation: 'Herr', first: 'Klaus', last: 'Krume', email: 'hallo@cafe-morgenrot.example', phone: '0170 1234567', street: 'Marktstraße 77', zip: '12347', city: 'Musterstadt', tags: 'Social Media' });
  const c5 = customer({ company: 'Logistik Nord KG', first: 'Oliver', last: 'Hafen', email: 'einkauf@logistik-nord.example', street: 'Hafenstraße 3', zip: '12349', city: 'Musterstadt', tags: 'Schulung, Montage', status: 'interessent' });
  customer({ type: 'privat', salutation: 'Frau', first: 'Maria', last: 'Beispiel', email: 'maria.beispiel@example.com', phone: '0171 9876543', street: 'Gartenweg 2', zip: '12345', city: 'Musterstadt', tags: 'Privatkunde' });

  catalog.importCatalog(catalog.MUSTER_CATALOG);

  const project = (name, customerId, status, budget, rate, description) => Number(db.run(
    'INSERT INTO projects (number, name, customer_id, status, start_date, budget, hourly_rate, manager_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    numbering.next('project'), name, customerId, status, ago(60), budget, rate, admin, description,
  ).lastInsertRowid);
  const p1 = project('Wartung Haustechnik Autohaus', c1, 'aktiv', 2400000, 6800, 'Wartungsvertrag für Werkstatt und Ausstellungshalle inkl. Störungsdienst.');
  const p2 = project('Relaunch Website Praxis Dr. Sommer', c2, 'aktiv', 800000, 9000, 'Neue Website mit Online-Terminbuchung, Pflegevertrag und Schulung des Praxisteams.');
  const p3 = project('Digitalisierung Antragswesen Stadtwerke', c3, 'geplant', 1500000, 9000, 'Digitale Antrags- und Dokumentationsabläufe, Workshops und Berichtswesen.');

  const item = (sku, qty, extra = {}) => {
    const p = catalog.MUSTER_CATALOG.find((x) => x.sku === sku);
    return { name: p.name, description: p.description, unit: p.unit, unit_price: p.price, quantity: qty, tax_rate: 19, discount_pct: 0, ...extra };
  };
  const doc = (kind, customerId, issue, items, extra = {}) => sales.save({
    kind, userId: admin, items,
    data: { customer_id: customerId, project_id: extra.project || null, title: extra.title || '', intro: settings.get(kind === 'angebot' ? 'quote_intro' : 'invoice_intro'),
      footer: settings.get(kind === 'angebot' ? 'quote_footer' : 'invoice_footer'), issue_date: issue, service_date: extra.service || issue, service_until: extra.until || null,
      due_date: kind === 'rechnung' ? f.addDays(issue, extra.terms || 14) : null, valid_until: kind === 'angebot' ? f.addDays(issue, 30) : null },
  });

  // Bezahlte, offene und überfällige Rechnungen über die letzten Monate verteilt
  for (let m = 5; m >= 1; m--) {
    const issue = f.addMonths(today, -m).slice(0, 8) + '28';
    const id = doc('rechnung', c1, issue, [item('SW-02', 1), item('SW-01', 6 + m * 2, { description: 'Zusätzliche Einsätze lt. Servicebericht' }), item('SW-03', 2)], { project: p1, title: 'Wartung & Service Monatsabrechnung', service: issue.slice(0, 8) + '01', until: issue });
    sales.finalize(id);
    if (m > 1) sales.addPayment(id, { amount: sales.load(id).gross_total, paid_at: f.addDays(issue, 10), method: 'ueberweisung' }, admin);
  }
  const inv2 = doc('rechnung', c2, ago(40), [item('DM-01', 40), item('SC-02', 3), item('DM-04', 1)], { project: p2, title: 'Website-Relaunch – Umsetzung' });
  sales.finalize(inv2);
  sales.addPayment(inv2, { amount: 150000, paid_at: ago(20), method: 'ueberweisung', note: 'Anzahlung' }, admin);
  sales.createDunning(inv2, admin);
  const inv3 = doc('rechnung', c4, ago(25), [item('DM-03', 1), item('BP-01', 3, { description: 'Einrichtung Google-Unternehmensprofil und Newsletter-Vorlage' })], { title: 'Social Media & Online-Marketing' });
  sales.finalize(inv3);
  const inv4 = doc('rechnung', c3, ago(3), [item('BP-04', 12, { description: 'Ist-Analyse der Antrags- und Ablageprozesse inkl. Workshop' })], { project: p3, title: 'Prozessanalyse Digitalisierung', terms: 30 });
  sales.finalize(inv4);
  doc('rechnung', c1, today, [item('SW-02', 1), item('MT-01', 6, { description: 'Montage von 4 neuen Werkstattleuchten' }), item('MT-02', 1)], { project: p1, title: 'Wartung & Montage (Entwurf)' });

  const q1 = doc('angebot', c5, ago(5), [item('SC-01', 2, { description: 'Schulung Ladungssicherung für 2 Gruppen à 10 Personen' }), item('MT-01', 16), item('MT-03', 4)], { title: 'Angebot Schulung & Montage Lagertechnik' });
  db.run("UPDATE documents_sales SET status = 'versendet' WHERE id = ?", q1);
  const q2 = doc('angebot', c2, ago(70), [item('DM-01', 40), item('SC-02', 3)], { title: 'Angebot Website-Relaunch' });
  db.run("UPDATE documents_sales SET status = 'angenommen' WHERE id = ?", q2);
  doc('angebot', c3, ago(15), [item('BP-04', 40), item('BP-03', 2), item('BP-02', 16)], { project: p3, title: 'Angebot Digitalisierung Antragswesen' });

  // Wiederkehrende Rechnung: Website-Pflege monatlich
  const tpl = doc('rechnung', c2, ago(1), [item('DM-02', 1)], { title: 'Website-Pflege Monatspauschale' });
  db.run('INSERT INTO recurring_invoices (template_id, interval, next_date, auto_finalize) VALUES (?, ?, ?, 0)', tpl, 'monatlich', f.addMonths(today, 1).slice(0, 8) + '01');

  // Anfragen (z. B. über das Website-Kontaktformular)
  const leads = [
    ['Andrea Hoffmann', 'Hotel Am Park', 'a.hoffmann@example.com', 'Wartungsvertrag Haustechnik', 'Wir suchen ab nächstem Monat einen Wartungsvertrag für unser Hotel mit 40 Zimmern.', 'neu', 1200000, 1],
    ['Markus Event', 'Clubhaus 21', 'm@clubhaus.example', 'Social-Media-Betreuung', 'Wir brauchen Unterstützung bei Instagram und TikTok für unsere Veranstaltungen.', 'neu', 650000, 0],
    ['Julia Retail', 'ModeHaus Mitte', 'j@modehaus.example', 'Neuer Online-Shop', 'Wir möchten unseren Shop neu aufsetzen und suchen einen Partner für Umsetzung und Pflege.', 'kontaktiert', 480000, 2],
    ['Oliver Hafen', 'Logistik Nord KG', 'einkauf@logistik-nord.example', 'Schulung & Montage Lagertechnik', 'Schulung für zwei Gruppen und Montage neuer Regalsysteme.', 'qualifiziert', 2400000, 1],
    ['Tim Sommer', 'Praxis Dr. Sommer', 'praxis@dr-sommer.example', 'Website-Relaunch', 'Neue Website mit Online-Terminbuchung.', 'gewonnen', 780000, 3],
  ];
  for (const [name, company, email, subject, message, status, value, d] of leads) {
    db.run("INSERT INTO leads (name, company, email, subject, message, status, value, source, consent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'website', 1, datetime('now', ?))", name, company, email, subject, message, status, value, `-${d} days`);
  }

  // Aufgaben, Termine, Zeiten, Ausgaben
  const task = (title, status, priority, due, proj, user) => db.run('INSERT INTO tasks (title, status, priority, due_date, project_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', title, status, priority, due, proj, user, admin);
  task('Einsatzplan nächster Monat erstellen', 'offen', 'hoch', f.addDays(today, 3), p1, admin);
  task('Arbeitsschutzunterweisung neue Mitarbeitende', 'in_arbeit', 'dringend', f.addDays(today, 1), null, admin);
  task('Texte und Bilder von der Praxis einholen', 'erledigt', 'normal', ago(30), p2, staff);
  task('Workshop-Termin Stadtwerke vereinbaren', 'offen', 'normal', f.addDays(today, 7), p3, admin);
  task('Prüfprotokolle Werkstatt digitalisieren', 'wartet', 'niedrig', null, p1, staff);
  db.run("UPDATE tasks SET completed_at = datetime('now','-2 days') WHERE status = 'erledigt'");

  const appt = (title, day, from, to, customerId, color, location) => db.run('INSERT INTO appointments (title, starts_at, ends_at, customer_id, user_id, color, location) VALUES (?, ?, ?, ?, ?, ?, ?)', title, `${f.addDays(today, day)}T${from}`, `${f.addDays(today, day)}T${to}`, customerId, admin, color, location);
  appt('Vorgespräch Lagertechnik', 1, '10:00', '11:30', c5, 'gruen', 'Hafenstraße 3, Musterstadt');
  appt('Quartalsbegehung Autohaus', 4, '14:00', '15:00', c1, 'blau', 'Industriering 5');
  appt('Digitalisierungs-Workshop Stadtwerke', 9, '09:00', '13:00', c3, 'lila', 'Rathausplatz 1');

  for (let i = 1; i <= 15; i++) {
    db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', i % 2 ? admin : staff, p1, c1, ago(i), 240, 'Wartung: Kontrollgang, Kleinreparaturen');
  }
  db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', admin, p3, c3, ago(2), 180, 'Vorbereitung Prozessworkshop');
  db.run('INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, description, billable) VALUES (?, ?, ?, ?, ?, ?, 1)', admin, p2, c2, ago(4), 300, 'Umsetzung Startseite und Terminbuchung');

  const sup = Number(db.run("INSERT INTO suppliers (name, email) VALUES ('Werkzeug & Bedarf Profi GmbH', 'shop@werkzeug.example')").lastInsertRowid);
  const exp = (date, supplier, category, desc, gross, rate = 19) => {
    const net = Math.round(gross / (1 + rate / 100));
    db.run('INSERT INTO expenses (date, supplier_id, supplier_name, category, description, net_amount, tax_rate, tax_amount, gross_amount, paid, paid_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)', date, supplier ? sup : null, supplier || 'Diverse', category, desc, net, rate, gross - net, gross, date, admin);
  };
  for (let m = 5; m >= 0; m--) {
    const d = f.addMonths(today, -m).slice(0, 8) + '05';
    if (d <= today) {
      exp(d, null, 'Fahrzeug', 'Tanken Servicefahrzeuge', 28500);
      exp(d, null, 'Hard- & Software', 'Software-Abos (Office, Design, Hosting)', 9990);
      exp(d, null, 'Miete', 'Büro und Lager', 119000, 0);
      exp(d, null, 'Versicherungen', 'Betriebshaftpflicht (anteilig)', 12000, 0);
    }
  }
  exp(ago(50), 'Werkzeug & Bedarf Profi GmbH', 'Ausrüstung', 'Akkuschrauber-Set, Leitern, Arbeitskleidung', 64260);
  exp(ago(12), null, 'Fortbildung', 'Online-Kurs Digitalisierung im Mittelstand', 21000, 0);

  // Einsatzplanung: Qualifikationen, Personal, Nachweise, Urlaub, Schichten (aktuelle + nächste Woche)
  const qt = (name, months, desc) => Number(db.run('INSERT INTO qualification_types (name, validity_months, description) VALUES (?, ?, ?)', name, months, desc).lastInsertRowid);
  const qAS = qt('Arbeitsschutzunterweisung', 12, 'Jährliche Unterweisung nach § 12 ArbSchG');
  const qEH = qt('Ersthelfer', 24, 'Erste-Hilfe-Ausbildung, Auffrischung alle 2 Jahre');
  const qHB = qt('Hubarbeitsbühne / Arbeiten in Höhe', 60, 'Bedienerschulung nach DGUV Grundsatz 308-008');
  const qST = qt('Staplerschein', null, 'Fahrausweis Flurförderzeuge (DGUV Grundsatz 308-001)');
  const qFS = qt('Führerschein Klasse B', null, '');
  const staffRow = (no, first, last, emp, hours, wage, color, userId) => Number(db.run(
    'INSERT INTO staff (personnel_no, first_name, last_name, email, phone, employment, weekly_hours, hourly_wage, color, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    no, first, last, `${first.toLowerCase()}@muster-service.example`, '0170 000000' + no.slice(-1), emp, hours, wage, color, userId,
  ).lastInsertRowid);
  const s1 = staffRow('1001', 'Max', 'Werner', 'vollzeit', 40, 1800, 'blau', staff);
  const s2 = staffRow('1002', 'Sandra', 'Klein', 'teilzeit', 30, 1750, 'gruen', null);
  const s3 = staffRow('1003', 'Ali', 'Demir', 'teilzeit', 25, 1650, 'orange', null);
  const s4 = staffRow('1004', 'Lena', 'Vogt', 'minijob', 8, 1400, 'lila', null);
  const sq = (sid, tid, issued, expires) => db.run('INSERT INTO staff_qualifications (staff_id, type_id, issued_at, expires_at) VALUES (?, ?, ?, ?)', sid, tid, issued, expires);
  for (const sid of [s1, s2, s3, s4]) sq(sid, qAS, ago(120), f.addDays(today, 245));
  sq(s1, qEH, ago(400), f.addDays(today, 20)); sq(s2, qEH, ago(100), f.addDays(today, 630));
  sq(s1, qFS, '2010-01-01', null); sq(s3, qFS, '2015-01-01', null);
  sq(s1, qHB, '2022-04-01', '2027-03-31'); sq(s3, qHB, '2020-05-01', ago(40)); sq(s1, qST, '2019-02-01', null);
  const mon = f.addDays(today, -((new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7));
  db.run("INSERT INTO absences (staff_id, type, date_from, date_to, note) VALUES (?, 'urlaub', ?, ?, 'Jahresurlaub')", s2, f.addDays(mon, 10), f.addDays(mon, 13));
  const location = { [p1]: 'Industriering 5, Musterstadt', [p2]: 'Lindenallee 9, Musterstadt', [p3]: 'Rathausplatz 1, Musterstadt' };
  const shift = (sid, dayOffset, from, to, brk, title, proj, reqs, status = 'bestaetigt') => {
    const day = f.addDays(mon, dayOffset);
    const end = to <= from ? f.addDays(day, 1) : day;
    db.run('INSERT INTO shifts (staff_id, project_id, customer_id, title, location, starts_at, ends_at, break_minutes, status, required_qualifications, created_by) VALUES (?, ?, (SELECT customer_id FROM projects WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?)',
      sid, proj, proj, title, location[proj], `${day}T${from}`, `${end}T${to}`, brk, status, reqs, admin);
  };
  for (let w = 0; w < 2; w++) {
    const st = w ? 'geplant' : 'bestaetigt';
    for (let d = 0; d < 5; d++) {
      const o = w * 7 + d;
      shift(s1, o, '07:00', '15:30', 30, 'Service & Wartung Autohaus', p1, String(qAS), st);
      if (!(w === 1 && d >= 3)) shift(s2, o, '08:00', '14:00', 0, 'Störungsdienst Werkstatt', p1, String(qAS), st);
      else shift(null, o, '08:00', '14:00', 0, 'Störungsdienst Werkstatt', p1, String(qAS), 'geplant');
    }
    shift(s3, w * 7 + 3, '09:00', '17:30', 30, 'Montage Praxisausstattung', p2, String(qAS), st);
    shift(w ? null : s3, w * 7 + 4, '09:00', '17:30', 30, 'Montage Praxisausstattung', p2, String(qAS), st);
  }
  // Bewusste Beispiele für die Konfliktprüfung: abgelaufene Hubarbeitsbühnen-Schulung, fehlender Ersthelfer-Nachweis
  shift(s3, 5, '08:00', '14:00', 30, 'Beleuchtung Ausstellungshalle mit Hubarbeitsbühne', p1, `${qAS},${qHB}`);
  shift(s4, 5, '18:00', '23:00', 0, 'Abendbetreuung Kundenevent Autohaus', p1, String(qEH));
  shift(null, 12, '18:00', '23:00', 0, 'Abendbetreuung Kundenevent Autohaus', p1, String(qEH), 'geplant');

  // ───────── Sicherheitsdienst-Edition: Objekte, Fahrzeuge, Streifen, Vorfälle ─────────
  const yr = today.slice(0, 4);
  const object = (no, name, cid, street, city, cp, contact, phone, instr) => Number(db.run(
    'INSERT INTO objects (number, name, customer_id, street, city, contact_name, contact_phone, checkpoints, instructions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    no, name, cid, street, city, contact, phone, cp, instr, 'aktiv').lastInsertRowid);
  const o1 = object('OBJ-0001', 'City-Galerie Einkaufszentrum', c1, 'Leipziger Str. 44', 'Musterstadt', 6, 'Herr Sommer', '0123 555-900', 'Rundgänge alle 2 Std., Nebeneingänge prüfen, Tiefgarage um 22:00 schließen.');
  const o2 = object('OBJ-0002', 'Logistikzentrum Nord', c5, 'Hafenstraße 3', 'Musterstadt', 8, 'Frau Hafen', '0123 555-300', 'Toranlagen und Zaun kontrollieren, LKW-Hof beleuchten.');
  const o3 = object('OBJ-0003', 'Stadtwerke Verwaltung', c3, 'Rathausplatz 1', 'Musterstadt', 4, 'Herr Amt', '0123 555-100', 'Empfang / Pforte, Besucherausweise ausgeben.');

  const vehicle = (plate, model, sid, km, tuevOffset, ins, status) => db.run(
    'INSERT INTO vehicles (plate, model, staff_id, mileage, tuev, insurance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    plate, model, sid, km, f.addDays(today, tuevOffset), ins, status);
  vehicle('M-SF 101', 'VW Caddy (Streifenwagen)', s1, 84520, 210, 'HUK-Coburg · VK', 'im_einsatz');
  vehicle('M-SF 102', 'Mercedes Vito (Mannschaft)', null, 112340, 120, 'Allianz · VK', 'verfuegbar');
  vehicle('M-SF 103', 'Ford Transit', null, 156900, -12, 'HUK-Coburg · TK', 'werkstatt');

  // Streifen: eine läuft gerade (für die Live-Lage), zwei abgeschlossen
  const pRun = Number(db.run("INSERT INTO patrols (object_id, staff_id, user_id, started_at, rounds, status) VALUES (?, ?, ?, datetime('now','-38 minutes'), 2, 'laeuft')", o1, s1, staff).lastInsertRowid);
  const plog = (minsAgo, kind, text) => db.run("INSERT INTO patrol_log (patrol_id, at, kind, text) VALUES (?, datetime('now', ?), ?, ?)", pRun, `-${minsAgo} minutes`, kind, text);
  plog(33, 'rundgang', null); plog(21, 'kontrollpunkt', 'Haupteingang + Tiefgarage kontrolliert, verschlossen'); plog(9, 'rundgang', null); plog(3, 'notiz', 'Beleuchtung Parkdeck 2 flackert – Haustechnik informieren');
  db.run("INSERT INTO patrols (object_id, staff_id, user_id, started_at, ended_at, rounds, status, summary) VALUES (?, ?, ?, datetime('now','-1 day'), datetime('now','-1 day','+8 hours'), 6, 'vorfall', 'Kontrollpunkt: Tor 3 offen vorgefunden und gesichert.\nVorkommnis: Unbefugte Person am Zaun angetroffen und des Geländes verwiesen.')", o2, s3, staff);
  db.run("INSERT INTO patrols (object_id, staff_id, user_id, started_at, ended_at, rounds, status, summary) VALUES (?, ?, ?, datetime('now','-2 days'), datetime('now','-2 days','+8 hours'), 3, 'ob', 'Keine besonderen Vorkommnisse.')", o3, s1, staff);

  const incident = (seq, oid, sid, daysAgo, cat, sev, desc, meas, police, ref, status) => db.run(
    "INSERT INTO incidents (number, object_id, staff_id, user_id, occurred_at, category, severity, description, measures, police, police_ref, status) VALUES (?, ?, ?, ?, datetime('now', ?), ?, ?, ?, ?, ?, ?, ?)",
    `VF-${yr}-${seq}`, oid, sid, staff, `-${daysAgo} days`, cat, sev, desc, meas, police, ref, status);
  incident('0001', o2, s3, 1, 'hausverbot', 'mittel', 'Unbefugte männliche Person am Außenzaun Tor 3 angetroffen. Person konnte keinen Grund für den Aufenthalt nennen.', 'Person des Geländes verwiesen, Personalien aufgenommen, Einsatzleitung informiert.', 0, null, 'abgeschlossen');
  incident('0002', o1, s1, 0, 'defekt', 'niedrig', 'Brandmeldeanlage Fehlalarm Sektor B.', 'Vor Ort kontrolliert, kein Brand, Haustechnik informiert.', 0, null, 'in_bearbeitung');
  incident('0003', o1, null, 5, 'diebstahl', 'hoch', 'Ladendiebstahl im Elektronikmarkt beobachtet, Täter beim Verlassen gestellt.', 'Täter festgehalten, Polizei verständigt, Übergabe erfolgt.', 1, 'ST-' + yr + '-44821', 'abgeschlossen');

  db.run("INSERT INTO notifications (user_id, title, link) VALUES (NULL, 'Willkommen im Back Office! Starte mit den Einstellungen.', '/admin/einstellungen')");
}

module.exports = { seed, ACCOUNTS, PASSWORD };
