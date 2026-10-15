'use strict';
const path = require('node:path');
const fs = require('node:fs');

// SQLite ist in Node >= 22.5 eingebaut – keine nativen Abhängigkeiten nötig.
process.removeAllListeners('warning');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.BAUDAH_DATA || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'baudah.sqlite');
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'privat',
  salutation TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  address_extra TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'DE',
  email TEXT NOT NULL DEFAULT '',
  email_cc TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  vat_id TEXT NOT NULL DEFAULT '',
  leitweg_id TEXT NOT NULL DEFAULT '',
  reverse_charge INTEGER NOT NULL DEFAULT 0,
  payment_days INTEGER,
  discount REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'Stk',
  price INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  labor_percent REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,               -- angebot | rechnung | abschlag | schluss | storno
  number TEXT,
  status TEXT NOT NULL DEFAULT 'entwurf',
  customer_id INTEGER REFERENCES customers(id),
  source_id INTEGER REFERENCES documents(id),
  ref_id INTEGER REFERENCES documents(id),
  date TEXT NOT NULL,
  service_period TEXT NOT NULL DEFAULT '',
  valid_until TEXT,
  due_date TEXT,
  payment_days INTEGER,
  subject TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL DEFAULT '',
  site_address TEXT NOT NULL DEFAULT '',
  customer_ref TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  outro TEXT NOT NULL DEFAULT '',
  tax_mode TEXT NOT NULL DEFAULT 'standard',
  show_35a INTEGER NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  skonto_percent REAL NOT NULL DEFAULT 0,
  skonto_days INTEGER NOT NULL DEFAULT 0,
  abschlag_no INTEGER,
  customer_snapshot TEXT,
  prepaid_json TEXT,
  net INTEGER NOT NULL DEFAULT 0,
  vat INTEGER NOT NULL DEFAULT 0,
  gross INTEGER NOT NULL DEFAULT 0,
  prepaid_gross INTEGER NOT NULL DEFAULT 0,
  prepaid_net INTEGER NOT NULL DEFAULT 0,
  labor INTEGER NOT NULL DEFAULT 0,
  finalized_at TEXT,
  sent_at TEXT,
  paid_at TEXT,
  decided_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_number ON documents(type, number) WHERE number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doc_customer ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_doc_source ON documents(source_id);

CREATE TABLE IF NOT EXISTS document_items (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sort INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'item',  -- item | title | text | pagebreak
  article_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  labor_percent REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,
  optional INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_doc ON document_items(document_id, sort);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'Überweisung',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  fee INTEGER NOT NULL DEFAULT 0,
  open_amount INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY,
  document_id INTEGER,
  reminder_id INTEGER,
  to_addr TEXT NOT NULL,
  cc TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`;
db.exec(SCHEMA);

// Migrationen für ältere Datenbanken
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
}
ensureColumn('documents', 'prepaid_net', 'INTEGER NOT NULL DEFAULT 0');

/* ------------------------------------------------------------------ */
/* Helfer                                                              */
/* ------------------------------------------------------------------ */
const all = (sql, ...p) => db.prepare(sql).all(...p);
const get = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Einstellungen mit Standardwerten                                    */
/* ------------------------------------------------------------------ */
const DEFAULTS = {
  company: {
    name: 'BauDaH Bauunternehmen',
    short: 'BauDaH',
    claim: 'Meisterbetrieb',
    owner: 'Daniel Hönemann',
    owner_title: 'Handwerksmeister',
    street: 'Am Mühlbach 28',
    zip: '04683',
    city: 'Naunhof',
    country: 'DE',
    phone: '0176 43286472',
    mobile: '',
    email: 'baudah@gmx.net',
    web: 'www.baudah.de',
    tax_number: '',
    vat_id: '',
    chamber: 'Handwerkskammer zu Leipzig',
    chamber_no: '',
    bank_name: '',
    iban: '',
    bic: '',
    account_holder: 'Daniel Hönemann',
    brand_color: '#2c5aa0',
    accent_color: '#c1272d',
  },
  numbering: {
    angebot: 'AN-{JJJJ}-{NR}',
    rechnung: 'RE-{JJJJ}-{NR}',
    kunde: '{NR}',
    padding: 4,
    customer_start: 10001,
  },
  defaults: {
    payment_days: 14,
    valid_days: 30,
    vat_rate: 19,
    skonto_percent: 0,
    skonto_days: 0,
    show_35a_private: true,
  },
  texts: {
    angebot_intro:
      'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen für das oben genannte Bauvorhaben folgendes Angebot:',
    angebot_outro:
      'Wir würden uns freuen, den Auftrag für Sie ausführen zu dürfen. Die Abrechnung erfolgt nach tatsächlichem Aufmaß. Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.\n\nMit freundlichen Grüßen',
    rechnung_intro: 'für die ausgeführten Arbeiten erlauben wir uns, Ihnen folgende Leistungen in Rechnung zu stellen:',
    rechnung_outro: 'Vielen Dank für Ihren Auftrag und das entgegengebrachte Vertrauen.\n\nMit freundlichen Grüßen',
    abschlag_intro: 'gemäß Vereinbarung stellen wir Ihnen für den bisherigen Bauablauf folgende Abschlagszahlung in Rechnung:',
    abschlag_outro: 'Mit freundlichen Grüßen',
    schluss_intro: 'nach Fertigstellung der Arbeiten erlauben wir uns, Ihnen folgende Schlussrechnung zu stellen:',
    schluss_outro: 'Vielen Dank für Ihren Auftrag und die gute Zusammenarbeit.\n\nMit freundlichen Grüßen',
    storno_intro: 'hiermit stornieren wir die unten genannte Rechnung vollständig.',
    storno_outro: 'Mit freundlichen Grüßen',
    payment:
      'Bitte überweisen Sie den Rechnungsbetrag ohne Abzug bis zum {faellig} unter Angabe der Rechnungsnummer {nummer} auf unten stehendes Konto.',
    payment_skonto:
      'Bei Zahlung innerhalb von {skonto_tage} Tagen gewähren wir {skonto_prozent} % Skonto ({skonto_betrag}). Zahlbar ohne Abzug bis zum {faellig}.',
    reverse_charge:
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b Abs. 2 Nr. 4 i. V. m. Abs. 5 UStG. Die Umsatzsteuer ist vom Leistungsempfänger anzumelden und abzuführen.',
    private_note: 'Sie sind gesetzlich verpflichtet, diese Rechnung zwei Jahre lang aufzubewahren (§ 14b Abs. 1 Satz 5 UStG).',
    validity: 'Dieses Angebot ist gültig bis zum {gueltig}.',
  },
  dunning: {
    days: 10,
    fees: [0, 5, 10],
    titles: ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung'],
    texts: [
      'sicherlich ist es Ihrer Aufmerksamkeit entgangen, dass die unten aufgeführte Rechnung noch nicht beglichen wurde. Wir bitten Sie, den offenen Betrag bis zum {faellig} zu überweisen.\n\nSollten Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.',
      'leider konnten wir bis heute keinen Zahlungseingang zu der unten aufgeführten Rechnung feststellen. Wir bitten Sie, den offenen Betrag zuzüglich Mahngebühr bis spätestens {faellig} zu begleichen.',
      'trotz unserer bisherigen Erinnerungen ist die unten aufgeführte Rechnung weiterhin offen. Wir fordern Sie hiermit letztmalig auf, den Gesamtbetrag bis zum {faellig} zu überweisen. Nach Ablauf dieser Frist werden wir die Forderung ohne weitere Ankündigung an ein Inkassounternehmen bzw. das gerichtliche Mahnverfahren übergeben.',
    ],
  },
  mail: {
    host: 'mail.gmx.net',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from_name: 'BauDaH Bauunternehmen',
    from_email: 'baudah@gmx.net',
    bcc_self: true,
    signature:
      'Mit freundlichen Grüßen\n\nDaniel Hönemann\nHandwerksmeister\n\nBauDaH Bauunternehmen – Meisterbetrieb\nAm Mühlbach 28 · 04683 Naunhof\nTelefon: 0176 43286472\nE-Mail: baudah@gmx.net · www.baudah.de',
  },
  mail_templates: {
    angebot: {
      subject: 'Ihr Angebot {nummer} – {bauvorhaben}',
      body: '{anrede},\n\nvielen Dank für Ihre Anfrage. Im Anhang erhalten Sie unser Angebot {nummer} vom {datum} über {betrag}.\n\nDas Angebot ist gültig bis zum {gueltig}. Für Rückfragen oder einen Vor-Ort-Termin stehe ich Ihnen gerne zur Verfügung.\n\n{signatur}',
    },
    rechnung: {
      subject: '{belegart} {nummer} – {bauvorhaben}',
      body: '{anrede},\n\nim Anhang erhalten Sie unsere {belegart} {nummer} vom {datum} über {betrag}.\n\nBitte überweisen Sie den Betrag bis zum {faellig} auf das in der Rechnung angegebene Konto.\n\nVielen Dank für Ihren Auftrag!\n\n{signatur}',
    },
    mahnung: {
      subject: '{mahnstufe} zu Rechnung {nummer}',
      body: '{anrede},\n\nanbei erhalten Sie unsere {mahnstufe} zur Rechnung {nummer} vom {datum}. Der offene Betrag beläuft sich auf {offen}.\n\nWir bitten um Ausgleich bis zum {faellig}. Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie es bitte als gegenstandslos.\n\n{signatur}',
    },
  },
  backup: { keep: 30 },
  datev: {
    consultant: '',
    client: '',
    fiscal_start: '01-01',
    account_length: 4,
    skr: '03',
    debitor_mode: 'einzeln',
    collective_debitor: 10000,
    revenue_19: 8400,
    revenue_7: 8300,
    revenue_0: 8100,
    revenue_13b: 8337,
    bank: 1200,
    cash: 1000,
    skonto: 8736,
  },
};

function getSetting(key) {
  const row = get('SELECT value FROM settings WHERE key = ?', key);
  const def = DEFAULTS[key];
  if (!row) return def === undefined ? null : structuredClone(def);
  const val = JSON.parse(row.value);
  if (def && typeof def === 'object' && !Array.isArray(def)) return { ...structuredClone(def), ...val };
  return val;
}

function setSetting(key, value) {
  run(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value)
  );
}

function allSettings() {
  const out = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = getSetting(k);
  return out;
}

/* ------------------------------------------------------------------ */
/* Nummernkreise (lückenlos, transaktionssicher)                       */
/* ------------------------------------------------------------------ */
function nextCounter(key, start = 1) {
  const row = get('SELECT value FROM counters WHERE key = ?', key);
  const value = row ? row.value + 1 : start;
  run(
    'INSERT INTO counters(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
  return value;
}

function formatNumber(pattern, nr, padding, date = new Date()) {
  const y = String(date.getFullYear());
  return pattern
    .replace(/\{JJJJ\}/g, y)
    .replace(/\{JJ\}/g, y.slice(2))
    .replace(/\{MM\}/g, String(date.getMonth() + 1).padStart(2, '0'))
    .replace(/\{NR\}/g, String(nr).padStart(padding, '0'));
}

/** type: 'angebot' | 'rechnung' (alle Rechnungsarten teilen sich einen Nummernkreis) */
function nextDocumentNumber(type, dateStr) {
  const cfg = getSetting('numbering');
  const d = dateStr ? new Date(dateStr) : new Date();
  const pattern = cfg[type];
  const yearly = /\{JJ(JJ)?\}/.test(pattern);
  const key = yearly ? `${type}-${d.getFullYear()}` : type;
  for (;;) {
    const nr = nextCounter(key, 1);
    const number = formatNumber(pattern, nr, Number(cfg.padding) || 4, d);
    const kind = type === 'angebot' ? "type = 'angebot'" : "type <> 'angebot'";
    if (!get(`SELECT 1 FROM documents WHERE ${kind} AND number = ?`, number)) return number;
  }
}

function nextCustomerNumber() {
  const cfg = getSetting('numbering');
  for (;;) {
    const nr = nextCounter('kunde', Number(cfg.customer_start) || 10001);
    const number = formatNumber(cfg.kunde || '{NR}', nr, 0);
    if (!get('SELECT 1 FROM customers WHERE number = ?', number)) return number;
  }
}

function logActivity(userId, entity, entityId, action, details = '') {
  run(
    'INSERT INTO activity(user_id, entity, entity_id, action, details) VALUES(?, ?, ?, ?, ?)',
    userId ?? null,
    entity,
    entityId ?? null,
    action,
    details
  );
}

/* ------------------------------------------------------------------ */
/* Startdaten: Leistungskatalog                                        */
/* ------------------------------------------------------------------ */
// Preise sind marktübliche Richtwerte (Raum Leipzig, netto) und dienen als Startpunkt.
const SEED_ARTICLES = [
  // [Nr, Kategorie, Bezeichnung, Beschreibung, Einheit, VK, EK, Lohn%]
  ['100', 'Baustelleneinrichtung', 'Baustelleneinrichtung', 'Baustelle einrichten, vorhalten und nach Fertigstellung räumen. Inkl. An- und Abtransport von Werkzeug, Geräten und Kleinmaterial.', 'psch', 350, 80, 70],
  ['101', 'Baustelleneinrichtung', 'Absperrung und Sicherung', 'Baustelle gemäß Vorschriften absperren und sichern, inkl. Beschilderung.', 'psch', 120, 30, 60],
  ['102', 'Baustelleneinrichtung', 'Bauschuttcontainer 7 m³', 'Container für gemischten Bauschutt stellen, abholen und fachgerecht entsorgen inkl. Gebühren.', 'Stk', 480, 380, 10],
  ['103', 'Baustelleneinrichtung', 'Fassadengerüst', 'Arbeits- und Schutzgerüst stellen, vorhalten (4 Wochen) und abbauen, Lastklasse 3.', 'm²', 12.5, 8, 50],

  ['200', 'Maurerarbeiten', 'Mauerwerk KS 17,5 cm', 'Innen-/Außenmauerwerk aus Kalksandstein 17,5 cm, Dünnbettmörtel, inkl. Material.', 'm²', 89, 38, 55],
  ['201', 'Maurerarbeiten', 'Mauerwerk Porenbeton 24 cm', 'Mauerwerk aus Porenbeton-Plansteinen 24 cm, Dünnbettmörtel, inkl. Material.', 'm²', 98, 45, 50],
  ['202', 'Maurerarbeiten', 'Mauerwerk Ziegel 11,5 cm', 'Nichttragende Innenwand aus Hochlochziegeln 11,5 cm, inkl. Material.', 'm²', 72, 28, 60],
  ['203', 'Maurerarbeiten', 'Mauerwerksdurchbruch herstellen', 'Wanddurchbruch bis 1,00 m² in Mauerwerk bis 24 cm herstellen, inkl. Sturz und Schuttentsorgung.', 'Stk', 420, 90, 75],
  ['204', 'Maurerarbeiten', 'Fertigteilsturz einbauen', 'Fertigteilsturz bis 1,50 m Länge liefern und einbauen.', 'Stk', 95, 35, 50],
  ['205', 'Maurerarbeiten', 'Mauerwerk abbrechen', 'Mauerwerk bis 24 cm abbrechen, Schutt laden und entsorgen.', 'm²', 48, 6, 85],

  ['300', 'Putzarbeiten', 'Kalkzement-Innenputz', 'Maschinenputz Kalkzement, einlagig 15 mm, auf Mauerwerk, inkl. Eckschutzschienen.', 'm²', 29, 7, 75],
  ['301', 'Putzarbeiten', 'Gipsputz Q3 gefilzt', 'Gipsmaschinenputz 10 mm, Oberfläche Q3 geglättet/gefilzt.', 'm²', 26, 6, 75],
  ['302', 'Putzarbeiten', 'Außenputz mineralisch', 'Mineralischer Außenputz zweilagig (Unterputz + Oberputz Körnung 2 mm), inkl. Gewebeeinlage.', 'm²', 62, 18, 70],
  ['303', 'Putzarbeiten', 'Putzschäden ausbessern', 'Schadhafte Putzflächen abschlagen, Untergrund vorbereiten und neu verputzen.', 'm²', 55, 9, 85],
  ['304', 'Putzarbeiten', 'Sockelputz', 'Sockelputz zementgebunden, inkl. Sockelabdichtung.', 'lfm', 38, 9, 70],

  ['400', 'Fugenarbeiten', 'Bauwerksfuge erneuern', 'Alte Fugenmasse entfernen, Flanken reinigen, vorbehandeln, Hinterfüllprofil einbringen und mit elastischem Dichtstoff neu verfugen.', 'lfm', 18.5, 3.2, 80],
  ['401', 'Fugenarbeiten', 'Klinkerfugen sanieren', 'Mürbe Fugen mind. 15 mm tief auskratzen, reinigen und mit Fugenmörtel neu verfugen (Fugenglattstrich).', 'm²', 68, 8, 85],
  ['402', 'Fugenarbeiten', 'Dehnungsfuge Fassade', 'Dehnungsfuge an Fassade herstellen bzw. erneuern inkl. Fugenband.', 'lfm', 24, 5, 75],
  ['403', 'Fugenarbeiten', 'Silikonfuge Sanitär', 'Wartungsfuge im Sanitärbereich entfernen und neu mit Sanitärsilikon ausführen.', 'lfm', 9.5, 1.5, 85],

  ['500', 'Fassade & Klinker', 'Verblendmauerwerk Klinker', 'Klinkervorsatzschale NF inkl. Luftschicht, Drahtanker und Verfugung. Klinker lt. Bemusterung.', 'm²', 145, 65, 55],
  ['501', 'Fassade & Klinker', 'Klinkerriemchen verlegen', 'Klinkerriemchen auf vorbereiteten Untergrund im Kleberbett verlegen und verfugen.', 'm²', 118, 48, 60],
  ['502', 'Fassade & Klinker', 'Fassade reinigen', 'Fassadenreinigung mit Heißwasser-Hochdruck, inkl. Abdeckarbeiten.', 'm²', 9.8, 1.2, 85],
  ['503', 'Fassade & Klinker', 'Wärmedämmverbundsystem', 'WDVS mit EPS 140 mm WLG 035, inkl. Armierung und mineralischem Oberputz.', 'm²', 128, 52, 55],
  ['504', 'Fassade & Klinker', 'Fensterbank außen', 'Aluminium-Fensterbank bis 2,00 m liefern und montieren.', 'Stk', 115, 45, 45],

  ['600', 'Innenausbau & Trockenbau', 'Ständerwand GK 100 mm', 'Metallständerwand CW 75, beidseitig einfach beplankt mit GK 12,5 mm, Mineralwolle 60 mm, Q2 gespachtelt.', 'm²', 69, 24, 60],
  ['601', 'Innenausbau & Trockenbau', 'Vorsatzschale GK', 'Vorsatzschale auf Unterkonstruktion, einfach beplankt, Q2 gespachtelt.', 'm²', 48, 15, 65],
  ['602', 'Innenausbau & Trockenbau', 'Abgehängte Decke GK', 'Abgehängte GK-Decke auf Metall-UK, Q2 gespachtelt.', 'm²', 62, 19, 65],
  ['603', 'Innenausbau & Trockenbau', 'Dachschräge dämmen und verkleiden', 'Zwischensparrendämmung, Dampfbremse, GK-Beplankung, Q2.', 'm²', 89, 34, 60],
  ['604', 'Innenausbau & Trockenbau', 'Spachtelung Q3 Zulage', 'Zulage für Oberflächenqualität Q3.', 'm²', 7.5, 1, 90],
  ['605', 'Innenausbau & Trockenbau', 'Türzarge in Trockenbauwand', 'UA-Profilzarge für Tür bis 1,01 m einbauen.', 'Stk', 135, 45, 60],
  ['606', 'Innenausbau & Trockenbau', 'Estrich Zementestrich 50 mm', 'Zementestrich CT-C25-F4 auf Trennlage, inkl. Randdämmstreifen.', 'm²', 34, 11, 60],

  ['700', 'Pflaster- & Wegebau', 'Betonsteinpflaster verlegen', 'Betonsteinpflaster 8 cm in Splittbett verlegen, rütteln und einsanden. Inkl. Material Standardsortiment.', 'm²', 69, 26, 60],
  ['701', 'Pflaster- & Wegebau', 'Unterbau Schotter 25 cm', 'Schottertragschicht 0/32, 25 cm, lagenweise verdichtet.', 'm²', 24, 9, 50],
  ['702', 'Pflaster- & Wegebau', 'Bodenaushub', 'Boden lösen, laden und abfahren inkl. Entsorgung (Z0).', 'm³', 48, 22, 45],
  ['703', 'Pflaster- & Wegebau', 'Rasenbordstein setzen', 'Rasenbord 100/25/5 in Beton setzen, inkl. Rückenstütze.', 'lfm', 29, 8, 65],
  ['704', 'Pflaster- & Wegebau', 'Pflaster aufnehmen und neu verlegen', 'Vorhandenes Pflaster aufnehmen, Bettung ausgleichen, Steine wieder verlegen.', 'm²', 38, 3, 85],
  ['705', 'Pflaster- & Wegebau', 'Entwässerungsrinne', 'Kastenrinne mit Gussabdeckung liefern und in Beton setzen.', 'lfm', 115, 55, 45],

  ['800', 'Landschaftsbau', 'Terrasse Natursteinplatten', 'Natursteinplatten auf Drainagemörtel verlegen und verfugen.', 'm²', 125, 55, 55],
  ['801', 'Landschaftsbau', 'Stützmauer L-Steine', 'L-Steine 60 cm auf Betonfundament setzen.', 'lfm', 175, 85, 45],
  ['802', 'Landschaftsbau', 'Oberboden andecken', 'Mutterboden liefern, andecken und planieren, 15 cm.', 'm²', 14, 6, 50],

  ['900', 'Reparatur Hoch- & Tiefbau', 'Facharbeiterstunde', 'Arbeitsstunde Facharbeiter/Maurer.', 'Std', 58, 0, 100],
  ['901', 'Reparatur Hoch- & Tiefbau', 'Meisterstunde', 'Arbeitsstunde Handwerksmeister.', 'Std', 72, 0, 100],
  ['902', 'Reparatur Hoch- & Tiefbau', 'Helferstunde', 'Arbeitsstunde Bauhelfer.', 'Std', 45, 0, 100],
  ['903', 'Reparatur Hoch- & Tiefbau', 'Anfahrtspauschale', 'An- und Abfahrt im Umkreis von 25 km.', 'psch', 45, 10, 80],
  ['904', 'Reparatur Hoch- & Tiefbau', 'Kellerabdichtung außen', 'Erdreich freilegen, Wand reinigen, Bitumendickbeschichtung zweilagig, Noppenbahn, Verfüllen.', 'lfm', 285, 70, 65],
  ['905', 'Reparatur Hoch- & Tiefbau', 'Betonsanierung', 'Schadhaften Beton abtragen, Bewehrung entrosten und schützen, reprofilieren.', 'm²', 145, 30, 75],
  ['906', 'Reparatur Hoch- & Tiefbau', 'Kleinmaterial', 'Kleinmaterial nach Aufwand.', 'psch', 35, 20, 0],
];

function seedArticles() {
  const has = get('SELECT COUNT(*) AS n FROM articles').n;
  if (has) return;
  const st = db.prepare(
    'INSERT INTO articles(number, category, name, description, unit, price, cost, labor_percent, vat_rate) VALUES(?,?,?,?,?,?,?,?,19)'
  );
  tx(() => {
    for (const a of SEED_ARTICLES) {
      st.run(a[0], a[1], a[2], a[3], a[4], Math.round(a[5] * 100), Math.round(a[6] * 100), a[7]);
    }
  });
}
seedArticles();

module.exports = {
  db,
  DATA_DIR,
  DB_FILE,
  all,
  get,
  run,
  tx,
  getSetting,
  setSetting,
  allSettings,
  DEFAULTS,
  nextDocumentNumber,
  nextCustomerNumber,
  logActivity,
};
