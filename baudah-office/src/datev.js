'use strict';
/*
 * DATEV-Export: Buchungsstapel im Format „DATEV-Format“ (EXTF, Version 700, Kategorie 21).
 * Erzeugt Ausgangsrechnungen (je Steuersatz eine Buchungszeile) und optional Zahlungseingänge.
 *
 * Buchungslogik (übliche Variante für kleine Handwerksbetriebe):
 *   Rechnung:        Debitor  an Erlöskonto (Automatikkonto, USt wird von DATEV errechnet)
 *   Abschlag:        wie Rechnung (Abschläge sind sofort Erlös)
 *   Schlussrechnung: nur der Restbetrag nach Abzug der Abschläge
 *   Storno:          Gegenbuchung (Haben)
 *   Zahlung:         Bank an Debitor
 * Kontenzuordnung ist in den Einstellungen anpassbar und sollte mit dem Steuerberater abgestimmt werden.
 */
const { all, get, getSetting } = require('./db');

const PRESETS = {
  '03': { revenue_19: 8400, revenue_7: 8300, revenue_0: 8100, revenue_13b: 8337, bank: 1200, cash: 1000, skonto: 8736 },
  '04': { revenue_19: 4400, revenue_7: 4300, revenue_0: 4100, revenue_13b: 4337, bank: 1800, cash: 1600, skonto: 4736 },
};

const COLUMNS = [
  'Umsatz (ohne Soll/Haben-Kz)', 'Soll/Haben-Kennzeichen', 'WKZ Umsatz', 'Kurs', 'Basis-Umsatz', 'WKZ Basis-Umsatz',
  'Konto', 'Gegenkonto (ohne BU-Schlüssel)', 'BU-Schlüssel', 'Belegdatum', 'Belegfeld 1', 'Belegfeld 2', 'Skonto',
  'Buchungstext', 'Postensperre', 'Diverse Adressnummer', 'Geschäftspartnerbank', 'Sachverhalt', 'Zinssperre',
  'Beleglink', 'Beleginfo - Art 1', 'Beleginfo - Inhalt 1',
];

const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const amount = (cents) => (Math.abs(cents) / 100).toFixed(2).replace('.', ',');
const ddmm = (d) => `${d.slice(8, 10)}${d.slice(5, 7)}`;
const clean = (s, max) => String(s || '').replace(/[\r\n;]+/g, ' ').trim().slice(0, max);

/** Debitorenkonto: Kundennummer, wenn sie in den Personenkontenbereich passt, sonst Sammeldebitor */
function debitor(cfg, customerNumber) {
  const len = Number(cfg.account_length) + 1;
  const min = 10 ** (len - 1);
  const max = min * 7 - 1; // 10000–69999 bei 4-stelligen Sachkonten
  const n = Number(customerNumber);
  if (cfg.debitor_mode === 'einzeln' && Number.isInteger(n) && n >= min && n <= max) return n;
  return Number(cfg.collective_debitor) || min;
}

function revenueAccount(cfg, rate, reverse) {
  if (reverse) return cfg.revenue_13b;
  if (rate === 19) return cfg.revenue_19;
  if (rate === 7) return cfg.revenue_7;
  return cfg.revenue_0;
}

/** Liefert die Buchungszeilen für den Zeitraum */
function bookings({ from, to, payments = true }) {
  const cfg = getSetting('datev');
  const rows = [];
  const docs = all(
    `SELECT d.*, c.number AS customer_number, c.company, c.first_name, c.last_name FROM documents d
     LEFT JOIN customers c ON c.id = d.customer_id
     WHERE d.type <> 'angebot' AND d.finalized_at IS NOT NULL AND d.date BETWEEN ? AND ?
     ORDER BY d.date, d.number`,
    from, to
  );
  const calc = require('../public/js/calc');
  for (const d of docs) {
    const items = all('SELECT * FROM document_items WHERE document_id = ?', d.id);
    const prepaid = d.prepaid_json ? JSON.parse(d.prepaid_json) : null;
    const t = calc.totals(d, items, prepaid);
    const name = d.company || [d.first_name, d.last_name].filter(Boolean).join(' ');
    const reverse = d.tax_mode === '13b';
    // Schlussrechnung: Abschläge (netto) anteilig vom größten Steuersatz abziehen
    let prepaidNet = prepaid?.net || 0;
    const groups = t.vatGroups.map((g) => ({ ...g })).sort((a, b) => b.rate - a.rate);
    for (const g of groups) {
      if (!prepaidNet) break;
      const take = Math.sign(prepaidNet) === Math.sign(g.net) ? (Math.abs(prepaidNet) > Math.abs(g.net) ? g.net : prepaidNet) : 0;
      g.net -= take;
      g.vat = reverse ? 0 : Math.round(g.net * g.rate / 100);
      prepaidNet -= take;
    }
    for (const g of groups) {
      const gross = g.net + g.vat;
      if (!gross) continue;
      rows.push({
        amount: gross,
        sh: gross >= 0 ? 'S' : 'H',
        account: debitor(cfg, d.customer_number),
        contra: revenueAccount(cfg, g.rate, reverse),
        date: d.date,
        doc: d.number,
        doc2: d.due_date ? ddmm(d.due_date) + d.due_date.slice(2, 4) : '',
        text: clean(`${{ rechnung: 'RE', abschlag: 'AR', schluss: 'SR', storno: 'ST' }[d.type]} ${name}`, 60),
        kind: 'Rechnung',
        rate: g.rate,
      });
    }
  }

  if (payments) {
    const pays = all(
      `SELECT p.*, d.number, c.number AS customer_number, c.company, c.first_name, c.last_name FROM payments p
       JOIN documents d ON d.id = p.document_id LEFT JOIN customers c ON c.id = d.customer_id
       WHERE p.date BETWEEN ? AND ? ORDER BY p.date, p.id`,
      from, to
    );
    for (const p of pays) {
      const name = p.company || [p.first_name, p.last_name].filter(Boolean).join(' ');
      const contra = p.method === 'Bar' ? cfg.cash : p.method === 'Skonto' ? cfg.skonto : cfg.bank;
      rows.push({
        amount: p.amount,
        sh: p.amount >= 0 ? 'S' : 'H',
        account: contra,
        contra: debitor(cfg, p.customer_number),
        date: p.date,
        doc: p.number,
        doc2: '',
        text: clean(`${p.method === 'Skonto' ? 'Skonto' : 'Zahlung'} ${name}`, 60),
        kind: 'Zahlung',
      });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

function stamp() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds(), 3)}`;
}

/** Erzeugt die CSV-Datei (Windows-1252 / ANSI, wie DATEV sie erwartet) */
function buildBuchungsstapel({ from, to, payments = true }) {
  const cfg = getSetting('datev');
  if (!cfg.consultant || !cfg.client) {
    const e = new Error('Bitte zuerst Berater- und Mandantennummer in den DATEV-Einstellungen eintragen.');
    e.status = 400;
    throw e;
  }
  if (from.slice(0, 4) !== to.slice(0, 4)) {
    const e = new Error('Ein DATEV-Buchungsstapel darf nur ein Wirtschaftsjahr enthalten – bitte Zeitraum innerhalb eines Jahres wählen.');
    e.status = 400;
    throw e;
  }
  const rows = bookings({ from, to, payments });
  const year = from.slice(0, 4);
  const fyStart = `${year}${String(cfg.fiscal_start || '01-01').replace('-', '')}`;
  const header = [
    q('EXTF'), 700, 21, q('Buchungsstapel'), 13, stamp(), '', q('RE'), q('BauDaH'), q(''),
    cfg.consultant, cfg.client, fyStart, cfg.account_length, from.replace(/-/g, ''), to.replace(/-/g, ''),
    q(clean(`BauDaH ${from} - ${to}`, 30)), q(''), 1, 0, 0, q('EUR'), '', q(''), '', '',
    q(cfg.skr), '', '', q(''), q(''),
  ].join(';');
  const lines = [header, COLUMNS.join(';')];
  for (const r of rows) {
    const vals = [
      amount(r.amount), q(r.sh), q('EUR'), '', '', '',
      r.account, r.contra, q(''), ddmm(r.date), q(clean(r.doc, 36)), q(r.doc2), '',
      q(r.text), '', q(''), '', '', '', q(''), q(''), q(''),
    ];
    lines.push(vals.join(';'));
  }
  const csv = lines.join('\r\n') + '\r\n';
  return { buffer: Buffer.from(csv, 'latin1'), count: rows.length, rows };
}

module.exports = { buildBuchungsstapel, bookings, PRESETS, debitor };
