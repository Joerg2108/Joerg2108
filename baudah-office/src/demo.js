'use strict';
/*
 * Demo-Modus: füllt das System mit realistischen Beispieldaten (für Vorführung und Test)
 * und setzt es auf Wunsch für den Echtbetrieb wieder komplett zurück.
 */
const { get, run, tx, setSetting, logActivity, nextCustomerNumber } = require('./db');
const D = require('./documents');
const backup = require('./backup');

const daysAgo = (n) => D.addDays(D.today(), -n);

const CUSTOMERS = [
  { key: 'mueller', type: 'privat', salutation: 'Herr', first_name: 'Thomas', last_name: 'Müller', street: 'Leipziger Straße 12', zip: '04683', city: 'Naunhof', email: 'thomas.mueller@example.de', phone: '034293 41122', notes: 'Einfamilienhaus Bj. 1965, Klinkerfassade. Schlüssel beim Nachbarn (Nr. 14).' },
  { key: 'krause', type: 'privat', salutation: 'Frau', first_name: 'Sabine', last_name: 'Krause', street: 'Am Markt 3', zip: '04821', city: 'Brandis', email: 'sabine.krause@example.de', mobile: '0171 2345678' },
  { key: 'schneider', type: 'privat', salutation: 'Familie', first_name: '', last_name: 'Schneider', street: 'Lindenweg 7', zip: '04668', city: 'Grimma', email: 'familie.schneider@example.de', phone: '03437 998877' },
  { key: 'hausbau', type: 'gewerblich', salutation: 'Firma', company: 'Hausbau Sachsen GmbH', contact_person: 'Herr Schulze', street: 'Industriestraße 5', zip: '04109', city: 'Leipzig', email: 'einkauf@hausbau-sachsen.example', email_cc: 'buchhaltung@hausbau-sachsen.example', phone: '0341 5551230', vat_id: 'DE987654321', reverse_charge: 1, payment_days: 30, notes: 'Generalunternehmer – Rechnungen nach § 13b UStG. Zahlungsziel 30 Tage.' },
  { key: 'immo', type: 'gewerblich', salutation: 'Firma', company: 'Immobilienverwaltung Muldental GmbH', contact_person: 'Frau Becker', street: 'Bahnhofstraße 21', zip: '04808', city: 'Wurzen', email: 'technik@immo-muldental.example', phone: '03425 87650', discount: 3 },
  { key: 'stadt', type: 'oeffentlich', salutation: 'Firma', company: 'Stadt Naunhof – Bauamt', contact_person: 'Herr Lehmann', street: 'Markt 1', zip: '04683', city: 'Naunhof', email: 'bauamt@naunhof.example', leitweg_id: '14729210-00001-31', payment_days: 30 },
  { key: 'weber', type: 'privat', salutation: 'Herr', title: 'Dr.', first_name: 'Klaus', last_name: 'Weber', street: 'Rosenstraße 18', zip: '04451', city: 'Borsdorf', email: 'k.weber@example.de' },
  { key: 'baeckerei', type: 'gewerblich', salutation: 'Firma', company: 'Bäckerei Hoffmann', contact_person: 'Herr Hoffmann', street: 'Hauptstraße 40', zip: '04683', city: 'Naunhof', email: 'info@baeckerei-hoffmann.example', phone: '034293 30303' },
];

function article(number, qty, extra = {}) {
  const a = get('SELECT * FROM articles WHERE number = ?', number);
  if (!a) return null;
  return { kind: 'item', article_id: a.id, name: a.name, description: a.description, qty, unit: a.unit, price: a.price, cost: a.cost, labor_percent: a.labor_percent, vat_rate: a.vat_rate, ...extra };
}
const title = (name) => ({ kind: 'title', name, description: '' });
const items = (...list) => list.filter(Boolean);

function isEmpty() {
  return !get('SELECT 1 FROM documents LIMIT 1') && !get('SELECT 1 FROM customers LIMIT 1');
}

function loadDemo(user) {
  if (!isEmpty()) throw new D.HttpError(409, 'Demo-Daten können nur in ein leeres System geladen werden (keine Kunden und Belege vorhanden).');
  const u = user;
  const C = {};
  for (const c of CUSTOMERS) {
    const { key, ...data } = c;
    const keys = Object.keys(data);
    const r = run(
      `INSERT INTO customers(number, ${keys.join(',')}, created_at) VALUES(?, ${keys.map(() => '?').join(',')}, ?)`,
      nextCustomerNumber(), ...keys.map((k) => data[k]), `${daysAgo(170)} 09:00:00`
    );
    C[key] = Number(r.lastInsertRowid);
  }

  const offer = (customer, ago, data) =>
    D.createDocument('angebot', { customer_id: C[customer], date: daysAgo(ago), valid_until: D.addDays(daysAgo(ago), 30), ...data }, u);
  const invoice = (customer, ago, data) => {
    const c = get('SELECT payment_days FROM customers WHERE id = ?', C[customer]);
    return D.createDocument('rechnung', { customer_id: C[customer], date: daysAgo(ago), due_date: D.addDays(daysAgo(ago), c.payment_days ?? 14), ...data }, u);
  };
  const derive = (srcId, target, ago, period, opts = {}) => {
    const id = D.deriveDocument(srcId, target, opts, u);
    const c = get('SELECT c.payment_days FROM documents d JOIN customers c ON c.id = d.customer_id WHERE d.id = ?', id);
    D.updateDocument(id, { date: daysAgo(ago), due_date: D.addDays(daysAgo(ago), c.payment_days ?? 14), service_period: period }, u);
    return id;
  };
  const finalize = (id) => D.finalizeDocument(id, u, { demo: true });
  const pay = (id, ago, share = 1, method = 'Überweisung') => {
    const d = D.loadDocument(id);
    D.addPayment(id, { amount: Math.round(d.totals.payable * share), date: daysAgo(ago), method }, u);
  };
  const status = (id, s) => {
    D.markSent(id);
    if (s !== 'versendet') D.setOfferStatus(id, s, u);
  };

  // 150 Tage: Rohbau-Auftrag Generalunternehmer (§ 13b)
  const a1 = offer('hausbau', 150, {
    project: 'Neubau MFH Grimmaer Straße 8, Leipzig', subject: 'Mauerwerksarbeiten Erdgeschoss',
    items: items(title('Baustelleneinrichtung'), article('100', 1), title('Maurerarbeiten'), article('200', 186), article('201', 64), article('204', 14), article('203', 2)),
  });
  status(a1, 'angenommen');
  const r1 = derive(a1, 'rechnung', 128, 'KW 21–24/2026');
  finalize(r1);
  pay(r1, 100);

  // 120 Tage: Trockenbau Dachgeschoss (privat, § 35a)
  const a2 = offer('krause', 120, {
    project: 'Ausbau Dachgeschoss', site_address: 'Am Markt 3, 04821 Brandis', subject: 'Trockenbau und Dämmung Dachgeschoss',
    items: items(article('603', 48), article('600', 22), article('605', 2), article('604', 70), article('906', 1)),
  });
  status(a2, 'angenommen');
  const r2 = derive(a2, 'rechnung', 100, '02.06.–20.06.2026');
  finalize(r2);
  pay(r2, 90, 1);

  // 90 Tage: Öffentlicher Auftrag
  const a3 = offer('stadt', 90, {
    project: 'Instandsetzung Gehweg Parkstraße', customer_ref: 'VG-2026-031', subject: 'Pflasterarbeiten Gehweg',
    items: items(article('101', 1), article('704', 85), article('703', 34), article('705', 6)),
  });
  status(a3, 'angenommen');

  // 75 Tage: Fassadensanierung (Abschlag + Schluss)
  const a4 = offer('mueller', 75, {
    project: 'Fassadensanierung EFH Müller', site_address: 'Leipziger Straße 12, 04683 Naunhof', subject: 'Fugensanierung, Fassadenreinigung und Putzausbesserung',
    items: items(
      title('Baustelleneinrichtung'), article('100', 1), article('103', 180),
      title('Fassade & Fugen'), article('502', 142.5), article('401', 142.5), article('400', 86, { discount: 5 }), article('504', 6, { optional: 1 }),
      { kind: 'text', name: 'Hinweis', description: 'Farbton des Fugenmörtels nach Bemusterung vor Ort.' },
      title('Putzarbeiten'), article('303', 24), article('304', 38),
    ),
  });
  status(a4, 'angenommen');

  const r3 = derive(a3, 'rechnung', 68, '15.07.–31.07.2026');
  finalize(r3);
  pay(r3, 45);

  const ab = derive(a4, 'abschlag', 58, 'Baufortschritt bis 15.08.2026', { mode: 'percent', percent: 30, description: 'Gerüst gestellt, Fassadenreinigung abgeschlossen' });
  finalize(ab);
  pay(ab, 50);

  // 45 Tage: Pflaster Einfahrt – wird überfällig, mit Zahlungserinnerung
  const a5 = offer('schneider', 45, {
    project: 'Neue Hofeinfahrt', site_address: 'Lindenweg 7, 04668 Grimma', subject: 'Pflasterung Einfahrt ca. 60 m²',
    items: items(article('702', 18), article('701', 60), article('700', 60), article('703', 32), article('705', 4)),
  });
  status(a5, 'angenommen');
  const r4 = derive(a5, 'rechnung', 35, '01.09.–12.09.2026');
  finalize(r4);
  D.createReminder(r4, u);

  // 28 und 20 Tage: offene Angebote Hausverwaltung
  const a6 = offer('immo', 28, {
    project: 'Wohnanlage Bahnhofstraße 21–25', subject: 'Erneuerung Bauwerksfugen Treppenhäuser',
    items: items(article('100', 1), article('400', 240), article('402', 36)),
  });
  status(a6, 'versendet');

  // 25 Tage: § 13b-Rechnung (Stundenlohn), teilweise bezahlt
  const r5 = invoice('hausbau', 25, {
    project: 'Neubau MFH Grimmaer Straße 8, Leipzig', subject: 'Nacharbeiten Mauerwerk lt. Regiebericht', service_period: 'KW 37/2026', tax_mode: '13b',
    items: items(article('900', 42), article('902', 38), article('906', 1)),
  });
  finalize(r5);
  pay(r5, 6, 0.5);

  const a7 = offer('immo', 20, {
    project: 'Wohnanlage Bahnhofstraße 21–25', subject: 'Fassadenreinigung und Klinkerfugen Giebelseite',
    items: items(article('103', 220), article('502', 210), article('401', 95)),
  });
  status(a7, 'versendet');

  // 15 Tage: abgelehntes Angebot
  const a8 = offer('weber', 15, {
    project: 'Terrasse und Gartenmauer', subject: 'Natursteinterrasse 35 m² mit Stützmauer',
    items: items(article('702', 9), article('701', 35), article('800', 35), article('801', 14)),
  });
  status(a8, 'abgelehnt');

  // 10 Tage: Schlussrechnung Fassade
  const s1 = derive(a4, 'schluss', 10, '10.08.–02.10.2026');
  finalize(s1);

  // 5 Tage: Reparatur Bäckerei, neues Angebot Krause
  const r6 = invoice('baeckerei', 5, {
    project: 'Reparatur Verkaufsraum', subject: 'Wanddurchbruch und Putzausbesserung', service_period: '06.10.2026',
    items: items(article('903', 1), article('901', 3), article('900', 6), article('303', 4), article('906', 1)),
  });
  finalize(r6);

  const a9 = offer('krause', 5, {
    project: 'Kellerabdichtung', site_address: 'Am Markt 3, 04821 Brandis', subject: 'Außenabdichtung Kellerwand Nordseite',
    items: items(article('100', 1), article('102', 1), article('904', 14)),
  });
  status(a9, 'versendet');

  // 2 Tage: Entwurf
  offer('baeckerei', 2, {
    project: 'Umbau Café-Bereich', subject: 'Trockenbauwand und abgehängte Decke',
    items: items(article('600', 18), article('602', 32), article('605', 1)),
  });

  setSetting('demo', { active: true, loaded_at: new Date().toISOString() });
  logActivity(u?.id, 'system', null, 'Demo-Daten geladen');
  return { customers: CUSTOMERS.length, documents: get('SELECT COUNT(*) AS n FROM documents').n };
}

/** Löscht alle Kunden, Belege, Zahlungen, Mahnungen und setzt die Nummernkreise zurück */
function resetData(user, { withBackup = true } = {}) {
  const b = withBackup ? backup.create('vor-neustart') : { name: '-' };
  tx(() => {
    for (const t of ['payments', 'reminders', 'email_log', 'document_items']) run(`DELETE FROM ${t}`);
    run('UPDATE documents SET source_id = NULL, ref_id = NULL');
    run('DELETE FROM documents');
    run('DELETE FROM customers');
    run('DELETE FROM counters');
    run('DELETE FROM activity');
  });
  setSetting('demo', { active: false });
  logActivity(user?.id, 'system', null, 'System für Echtbetrieb zurückgesetzt', `Sicherung: ${b.name}`);
  return { backup: b.name };
}

module.exports = { loadDemo, resetData, isEmpty };
