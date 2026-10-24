'use strict';
const db = require('../db');

// Standardwerte – alles über "Einstellungen" im Back Office änderbar (White-Label).
const DEFAULTS = {
  company_name: 'Ihre Firma',
  company_owner: '',
  company_street: 'Musterstraße 1',
  company_zip: '12345',
  company_city: 'Musterstadt',
  company_country: 'DE',
  company_email: '',
  company_phone: '',
  company_website: '',
  company_tax_number: '',
  company_vat_id: '',
  company_register: '',
  bank_name: '',
  bank_iban: '',
  bank_bic: '',
  brand_color: '#1d4ed8',
  logo_file: '',
  app_title: 'Back Office',
  small_business: '0', // Kleinunternehmerregelung § 19 UStG
  default_tax_rate: '19',
  payment_terms_days: '14',
  quote_valid_days: '30',
  prefix_invoice: 'RE-{YYYY}-',
  prefix_quote: 'AN-{YYYY}-',
  prefix_order: 'AB-{YYYY}-',
  prefix_storno: 'ST-{YYYY}-',
  prefix_customer: 'K-',
  prefix_project: 'P-{YYYY}-',
  number_digits: '4',
  invoice_intro: 'Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:',
  invoice_footer: 'Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer bis zum {DUE_DATE}.',
  quote_intro: 'Gerne unterbreiten wir Ihnen folgendes Angebot:',
  quote_footer: 'Wir freuen uns auf Ihren Auftrag. Dieses Angebot ist gültig bis {VALID_UNTIL}.',
  order_intro: 'Vielen Dank für Ihren Auftrag. Hiermit bestätigen wir:',
  dunning_fee_1: '0',
  dunning_fee_2: '5,00',
  dunning_fee_3: '10,00',
  dunning_days: '7',
  dunning_text_1: 'sicher haben Sie übersehen, dass die folgende Rechnung noch offen ist. Wir bitten um Ausgleich bis zum {DUE_DATE}.',
  dunning_text_2: 'leider konnten wir bis heute keinen Zahlungseingang feststellen. Bitte begleichen Sie den offenen Betrag inkl. Mahngebühr bis zum {DUE_DATE}.',
  dunning_text_3: 'trotz mehrfacher Erinnerung ist die Rechnung weiterhin offen. Sollte bis zum {DUE_DATE} kein Zahlungseingang erfolgen, übergeben wir die Forderung ohne weitere Ankündigung an ein Inkassounternehmen.',
  email_invoice_subject: 'Ihre Rechnung {NUMBER}',
  email_invoice_body: 'Guten Tag {NAME},\n\nanbei erhalten Sie die Rechnung {NUMBER} über {AMOUNT}.\n\nMit freundlichen Grüßen\n{COMPANY}',
  email_quote_subject: 'Ihr Angebot {NUMBER}',
  email_quote_body: 'Guten Tag {NAME},\n\nanbei erhalten Sie unser Angebot {NUMBER}.\n\nMit freundlichen Grüßen\n{COMPANY}',
  lead_notify_email: '',
  expense_categories: 'Büromaterial,Fahrtkosten,Fortbildung,Hard- & Software,Kommunikation,Marketing,Miete,Versicherungen,Fahrzeug,Ausrüstung,Fremdleistungen,Bewirtung,Sonstiges',
  backup_auto: '1',
  holiday_state: 'BE',
  night_from: '20',
  minijob_limit: '603,00',
  shift_rate: '45,00',
  surcharge_night_pct: '25',
  surcharge_sunday_pct: '50',
  surcharge_holiday_pct: '100',
  public_show_prices: '0',
  public_contact_url: '',
  public_catalog_intro: 'Unsere Leistungen im Überblick.',
};

let cache = null;

function all() {
  if (!cache) {
    cache = { ...DEFAULTS };
    for (const r of db.all('SELECT key, value FROM settings')) cache[r.key] = r.value;
  }
  return cache;
}

function get(key) {
  return all()[key];
}

function setMany(obj) {
  db.tx(() => {
    for (const [k, v] of Object.entries(obj)) {
      if (!(k in DEFAULTS)) continue;
      db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, String(v ?? ''));
    }
  });
  cache = null;
}

function reset() { cache = null; }

module.exports = { DEFAULTS, all, get, setMany, reset };
