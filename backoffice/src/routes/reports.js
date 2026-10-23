'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const csv = require('../lib/csv');
const settings = require('../lib/settings');
const pdf = require('../lib/pdf');
const sec = require('../lib/security');
const { wrap } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('reports'));

const yearOf = (req) => (/^\d{4}$/.test(req.query.jahr || '') ? req.query.jahr : f.today().slice(0, 4));
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Einnahmen-Überschuss-Rechnung nach Zuflussprinzip (§ 4 Abs. 3 EStG): Einnahmen bei Zahlungseingang
function euer(year) {
  const income = db.all(
    `SELECT substr(p.paid_at,6,2) AS m, SUM(p.amount) AS gross,
       SUM(ROUND(p.amount * CAST(d.net_total AS REAL) / NULLIF(d.gross_total,0))) AS net
     FROM payments p JOIN documents_sales d ON d.id = p.document_id WHERE substr(p.paid_at,1,4) = ? GROUP BY m`, year,
  );
  const expenses = db.all("SELECT substr(COALESCE(paid_at, date),6,2) AS m, SUM(gross_amount) AS gross, SUM(net_amount) AS net, SUM(tax_amount) AS tax FROM expenses WHERE paid = 1 AND substr(COALESCE(paid_at, date),1,4) = ? GROUP BY m", year);
  const rows = MONTHS.map((name, i) => {
    const m = String(i + 1).padStart(2, '0');
    const inc = income.find((x) => x.m === m) || { gross: 0, net: 0 };
    const exp = expenses.find((x) => x.m === m) || { gross: 0, net: 0, tax: 0 };
    return { name, incomeNet: inc.net || 0, incomeGross: inc.gross || 0, expNet: exp.net || 0, expGross: exp.gross || 0, result: (inc.net || 0) - (exp.net || 0) };
  });
  const total = rows.reduce((a, r) => ({ incomeNet: a.incomeNet + r.incomeNet, incomeGross: a.incomeGross + r.incomeGross, expNet: a.expNet + r.expNet, expGross: a.expGross + r.expGross, result: a.result + r.result }), { incomeNet: 0, incomeGross: 0, expNet: 0, expGross: 0, result: 0 });
  const byCategory = db.all("SELECT category, SUM(net_amount) AS net FROM expenses WHERE paid = 1 AND substr(COALESCE(paid_at, date),1,4) = ? GROUP BY category ORDER BY net DESC", year);
  return { rows, total, byCategory };
}

// USt-Übersicht (Soll-Versteuerung nach Rechnungsdatum) als Vorbereitung für die Voranmeldung
function vat(year, period) {
  const groupExpr = period === 'quartal' ? "((CAST(substr(issue_date,6,2) AS INTEGER) + 2) / 3)" : 'CAST(substr(issue_date,6,2) AS INTEGER)';
  const groupExpr2 = period === 'quartal' ? "((CAST(substr(date,6,2) AS INTEGER) + 2) / 3)" : 'CAST(substr(date,6,2) AS INTEGER)';
  const out = db.all(
    `SELECT ${groupExpr} AS p, i.tax_rate AS rate, SUM(i.net_amount) AS base FROM document_items i JOIN documents_sales d ON d.id = i.document_id
     WHERE d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL AND substr(d.issue_date,1,4) = ? GROUP BY p, rate`, year,
  );
  const inp = db.all(`SELECT ${groupExpr2} AS p, SUM(tax_amount) AS tax FROM expenses WHERE substr(date,1,4) = ? GROUP BY p`, year);
  const n = period === 'quartal' ? 4 : 12;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const o = out.filter((x) => x.p === i);
    const b19 = o.filter((x) => x.rate === 19).reduce((a, x) => a + x.base, 0);
    const b7 = o.filter((x) => x.rate === 7).reduce((a, x) => a + x.base, 0);
    const b0 = o.filter((x) => ![19, 7].includes(x.rate)).reduce((a, x) => a + x.base, 0);
    const t19 = Math.round(b19 * 0.19);
    const t7 = Math.round(b7 * 0.07);
    const vst = inp.find((x) => x.p === i)?.tax || 0;
    rows.push({ name: period === 'quartal' ? `Q${i}` : MONTHS[i - 1], b19, t19, b7, t7, b0, vst, zahllast: t19 + t7 - vst });
  }
  return rows;
}

router.get('/', (req, res) => {
  const year = yearOf(req);
  const revenueByMonth = MONTHS.map((name, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`;
    return {
      name,
      net: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND substr(issue_date,1,7) = ?", m).s,
      prev: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND substr(issue_date,1,7) = ?", `${Number(year) - 1}-${m.slice(5)}`).s,
    };
  });
  const topCustomers = db.all(
    `SELECT c.id, c.company, c.first_name, c.last_name, SUM(d.net_total) AS net, COUNT(*) AS n FROM documents_sales d JOIN customers c ON c.id = d.customer_id
     WHERE d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL AND substr(d.issue_date,1,4) = ? GROUP BY c.id ORDER BY net DESC LIMIT 10`, year,
  );
  const topProducts = db.all(
    `SELECT i.name, SUM(i.quantity) AS qty, SUM(i.net_amount) AS net FROM document_items i JOIN documents_sales d ON d.id = i.document_id
     WHERE d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL AND substr(d.issue_date,1,4) = ? GROUP BY i.name ORDER BY net DESC LIMIT 10`, year,
  );
  const quotes = db.get("SELECT COUNT(*) AS n, SUM(status='angenommen') AS won, SUM(status='abgelehnt') AS lost FROM documents_sales WHERE kind = 'angebot' AND substr(issue_date,1,4) = ?", year);
  const avgPayDays = db.get(
    "SELECT AVG(julianday(p.paid_at) - julianday(d.issue_date)) AS d FROM payments p JOIN documents_sales d ON d.id = p.document_id WHERE substr(p.paid_at,1,4) = ?", year,
  ).d;
  const hours = db.all('SELECT u.name, SUM(t.minutes) AS min, SUM(CASE WHEN t.billable = 1 THEN t.minutes ELSE 0 END) AS billable FROM time_entries t JOIN users u ON u.id = t.user_id WHERE substr(t.date,1,4) = ? GROUP BY u.id ORDER BY min DESC', year);
  const years = db.all("SELECT DISTINCT substr(issue_date,1,4) AS y FROM documents_sales UNION SELECT substr(date,1,4) FROM expenses UNION SELECT ? ORDER BY y DESC", f.today().slice(0, 4)).map((r) => r.y);
  res.render('reports/index', { title: 'Berichte & Auswertungen', year, years, revenueByMonth, topCustomers, topProducts, quotes, avgPayDays, hours, e: euer(year) });
});

router.get('/euer', (req, res) => {
  const year = yearOf(req);
  res.render('reports/euer', { title: `EÜR ${year}`, year, e: euer(year) });
});

router.get('/euer.pdf', wrap(async (req, res) => {
  const year = yearOf(req);
  const e = euer(year);
  const rows = e.rows.map((r) => [r.name, f.eur(r.incomeNet), f.eur(r.expNet), f.eur(r.result)]);
  rows.push({ cells: ['Summe', f.eur(e.total.incomeNet), f.eur(e.total.expNet), f.eur(e.total.result)], bold: true });
  const buf = await pdf.tableReport(`Einnahmen-Überschuss-Rechnung ${year}`, 'Netto-Werte nach Zuflussprinzip (§ 4 Abs. 3 EStG) – vorläufige Auswertung, ersetzt nicht die Anlage EÜR.', ['Monat', 'Einnahmen', 'Ausgaben', 'Ergebnis'], rows, [25, 25, 25, 25]);
  res.type('application/pdf').set('Content-Disposition', `inline; filename="EUER_${year}.pdf"`).send(buf);
}));

router.get('/ust', (req, res) => {
  const year = yearOf(req);
  const period = req.query.zeitraum === 'quartal' ? 'quartal' : 'monat';
  res.render('reports/vat', { title: `Umsatzsteuer ${year}`, year, period, rows: vat(year, period), small: settings.get('small_business') === '1' });
});

router.get('/offene-posten', (req, res) => {
  const today = f.today();
  const rows = db.all(
    `SELECT d.*, c.company, c.first_name, c.last_name, julianday(?) - julianday(d.due_date) AS days_over FROM documents_sales d JOIN customers c ON c.id = d.customer_id
     WHERE d.kind = 'rechnung' AND d.status IN ('offen','teilbezahlt') ORDER BY d.due_date`, today,
  );
  const buckets = { 'nicht fällig': 0, '1–30 Tage': 0, '31–60 Tage': 0, '61–90 Tage': 0, '> 90 Tage': 0 };
  for (const r of rows) {
    const open = r.gross_total - r.paid_total;
    const d = r.days_over;
    if (d <= 0) buckets['nicht fällig'] += open;
    else if (d <= 30) buckets['1–30 Tage'] += open;
    else if (d <= 60) buckets['31–60 Tage'] += open;
    else if (d <= 90) buckets['61–90 Tage'] += open;
    else buckets['> 90 Tage'] += open;
  }
  res.render('reports/open', { title: 'Offene Posten', rows, buckets });
});

// Rechnungsausgangsbuch als CSV (für Steuerberater)
router.get('/rechnungsausgangsbuch.csv', (req, res) => {
  const year = yearOf(req);
  const rows = db.all(
    `SELECT d.*, c.number AS cnum, c.company, c.first_name, c.last_name FROM documents_sales d JOIN customers c ON c.id = d.customer_id
     WHERE d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL AND substr(d.issue_date,1,4) = ? ORDER BY d.number`, year,
  );
  res.type('text/csv').attachment(`rechnungsausgangsbuch-${year}.csv`).send(csv.stringify(
    ['Rechnungsnr.', 'Art', 'Datum', 'Leistungsdatum', 'Kundennr.', 'Kunde', 'Netto', 'USt', 'Brutto', 'Bezahlt', 'Status'],
    rows.map((r) => [r.number, r.kind === 'storno' ? 'Storno' : 'Rechnung', f.date(r.issue_date), f.date(r.service_date), r.cnum, f.customerName(r), f.moneyInput(r.net_total), f.moneyInput(r.tax_total), f.moneyInput(r.gross_total), f.moneyInput(r.paid_total), r.status]),
  ));
});

// DATEV-Buchungsstapel (EXTF, SKR03) – Konten bitte mit dem Steuerberater abstimmen
const SKR03_EXPENSE = {
  'Büromaterial': '4930', Fahrtkosten: '4670', Fortbildung: '4945', 'Hard- & Software': '4806', Kommunikation: '4920', Marketing: '4600',
  Miete: '4210', Versicherungen: '4360', Fahrzeug: '4500', Ausrüstung: '4980', Fremdleistungen: '3100', Bewirtung: '4650', Sonstiges: '4900',
};

router.get('/datev.csv', (req, res) => {
  const year = yearOf(req);
  const s = settings.all();
  const small = s.small_business === '1';
  const lines = [];
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14) + '000';
  // EXTF-Kopfzeile (Format 700, Kategorie 21 = Buchungsstapel)
  lines.push(['"EXTF"', 700, 21, '"Buchungsstapel"', 12, stamp, '', '"BO"', '""', '""', '', '', `${year}0101`, 4, `${year}0101`, `${year}1231`, `"Back Office ${year}"`, '""', 1, 0, 0, '"EUR"'].join(';'));
  lines.push(['Umsatz (ohne Soll/Haben-Kz)', 'Soll/Haben-Kennzeichen', 'WKZ Umsatz', 'Konto', 'Gegenkonto (ohne BU-Schlüssel)', 'BU-Schlüssel', 'Belegdatum', 'Belegfeld 1', 'Buchungstext'].join(';'));
  const ddmm = (iso) => iso.slice(8, 10) + iso.slice(5, 7);
  const money = (c) => (Math.abs(c) / 100).toFixed(2).replace('.', ',');
  const docs = db.all("SELECT d.*, c.number AS cnum, c.company, c.first_name, c.last_name FROM documents_sales d JOIN customers c ON c.id = d.customer_id WHERE d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL AND substr(d.issue_date,1,4) = ?", year);
  for (const d of docs) {
    const debitor = String(10000 + d.customer_id);
    const items = db.all('SELECT tax_rate, SUM(net_amount) AS net FROM document_items WHERE document_id = ? GROUP BY tax_rate', d.id);
    for (const it of items) {
      const gross = it.net + (small ? 0 : Math.round(it.net * it.tax_rate / 100));
      const account = small ? '8195' : it.tax_rate === 19 ? '8400' : it.tax_rate === 7 ? '8300' : '8120';
      lines.push([money(gross), gross >= 0 ? 'S' : 'H', 'EUR', debitor, account, '', ddmm(d.issue_date), `"${d.number}"`, `"${f.customerName(d).slice(0, 55).replace(/"/g, '')}"`].join(';'));
    }
  }
  for (const p of db.all('SELECT p.*, d.number, d.customer_id FROM payments p JOIN documents_sales d ON d.id = p.document_id WHERE substr(p.paid_at,1,4) = ?', year)) {
    lines.push([money(p.amount), 'S', 'EUR', '1200', String(10000 + p.customer_id), '', ddmm(p.paid_at), `"${p.number}"`, '"Zahlungseingang"'].join(';'));
  }
  for (const e of db.all('SELECT * FROM expenses WHERE substr(date,1,4) = ?', year)) {
    const bu = e.tax_rate === 19 ? '9' : e.tax_rate === 7 ? '8' : '';
    lines.push([money(e.gross_amount), 'S', 'EUR', SKR03_EXPENSE[e.category] || '4900', e.paid ? '1200' : '70000', bu, ddmm(e.date), `"${(e.receipt_no || 'A' + e.id).slice(0, 36)}"`, `"${String(e.supplier_name || e.description || e.category).slice(0, 55).replace(/"/g, '')}"`].join(';'));
  }
  res.type('text/csv; charset=utf-8').attachment(`EXTF_Buchungsstapel_${year}.csv`).send(lines.join('\r\n') + '\r\n');
});

module.exports = router;
