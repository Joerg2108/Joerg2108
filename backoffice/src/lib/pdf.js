'use strict';
// PDF-Erzeugung für Angebote, Auftragsbestätigungen, Rechnungen, Stornos und Mahnungen.
// Layout angelehnt an DIN 5008 (Form B): Anschriftfeld passt in DL-/C6-Fensterumschläge.
const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const settings = require('./settings');
const config = require('../config');
const f = require('./format');
const { KIND_LABELS, fillPlaceholders } = require('./sales');

const MM = 72 / 25.4;
const mm = (v) => v * MM;

// EPC-QR-Code ("GiroCode"): Kunde scannt mit Banking-App und überweist ohne Abtippen
async function giroCode(s, amountCents, reference) {
  if (!s.bank_iban || amountCents <= 0) return null;
  const payload = [
    'BCD', '002', '1', 'SCT', (s.bank_bic || '').replace(/\s/g, ''), s.company_name.slice(0, 70),
    s.bank_iban.replace(/\s/g, ''), `EUR${(amountCents / 100).toFixed(2)}`, '', '', reference.slice(0, 140), '',
  ].join('\n');
  return QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', margin: 0, width: 300 });
}

function hexColor(c) {
  return /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#1d4ed8';
}

// Nutzbare Inhaltsbreite (25 mm links, 20 mm rechts) – funktioniert für Hoch- und Querformat
const cw = (doc) => doc.page.width - mm(45);

function base(s, layout = 'portrait') {
  const doc = new PDFDocument({ size: 'A4', layout, margins: { top: mm(20), bottom: mm(30), left: mm(25), right: mm(20) }, bufferPages: true, info: { Producer: 'Back Office', Creator: s.company_name } });
  doc.font('Helvetica');
  return doc;
}

function header(doc, s) {
  const color = hexColor(s.brand_color);
  const logo = s.logo_file ? path.join(config.uploadDir, s.logo_file) : null;
  if (logo && fs.existsSync(logo)) {
    try { doc.image(logo, mm(25) + cw(doc) - mm(60), mm(12), { fit: [mm(60), mm(25)], align: 'right' }); } catch { /* ungültiges Bild ignorieren */ }
  } else {
    doc.fillColor(color).font('Helvetica-Bold').fontSize(16).text(s.company_name, mm(25), mm(18), { width: cw(doc), align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor('#555').text(s.company_website || '', { width: cw(doc), align: 'right' });
  }
}

function addressBlock(doc, s, snap) {
  // Rücksendeangabe (klein, unterstrichen) – Zone über dem Anschriftfeld
  doc.fillColor('#666').fontSize(7).font('Helvetica')
    .text(`${s.company_name} · ${s.company_street} · ${s.company_zip} ${s.company_city}`, mm(25), mm(50), { width: mm(85), underline: true });
  doc.fillColor('#000').fontSize(10);
  const lines = [snap.name, snap.contact, snap.street, [snap.zip, snap.city].filter(Boolean).join(' '), snap.country && snap.country !== 'DE' ? snap.country : ''].filter(Boolean);
  doc.text(lines.join('\n'), mm(25), mm(56), { width: mm(85), lineGap: 1 });
}

function infoBlock(doc, rows) {
  let y = mm(50);
  doc.fontSize(9);
  for (const [label, value] of rows) {
    if (!value) continue;
    doc.fillColor('#666').text(label, mm(125), y, { width: mm(30) });
    doc.fillColor('#000').text(String(value), mm(155), y, { width: mm(35), align: 'right' });
    y += 13;
  }
}

function footer(doc, s) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - mm(24);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font('Helvetica');
    doc.moveTo(mm(25), y - 4).lineTo(mm(25) + cw(doc), y - 4).lineWidth(0.5).strokeColor('#ccc').stroke();
    doc.fontSize(7).fillColor('#666');
    const w = cw(doc) / 3;
    const col1 = [s.company_name, s.company_owner && s.company_owner !== s.company_name ? `Inhaber: ${s.company_owner}` : '', s.company_street, `${s.company_zip} ${s.company_city}`].filter(Boolean).join('\n');
    const col2 = [s.company_phone ? `Tel. ${s.company_phone}` : '', s.company_email, s.company_website, s.company_register].filter(Boolean).join('\n');
    const col3 = [s.bank_name, s.bank_iban ? `IBAN ${s.bank_iban}` : '', s.bank_bic ? `BIC ${s.bank_bic}` : '', s.company_vat_id ? `USt-IdNr. ${s.company_vat_id}` : s.company_tax_number ? `St.-Nr. ${s.company_tax_number}` : ''].filter(Boolean).join('\n');
    doc.text(col1, mm(25), y, { width: w, lineBreak: true });
    doc.text(col2, mm(25) + w, y, { width: w });
    doc.text(col3, mm(25) + 2 * w, y, { width: w });
    doc.text(`Seite ${i - range.start + 1} von ${range.count}`, mm(25), doc.page.height - mm(8), { width: cw(doc), align: 'right' });
    doc.page.margins.bottom = oldBottom;
  }
}

function itemsTable(doc, s, d) {
  const color = hexColor(s.brand_color);
  const cols = { pos: mm(25), name: mm(33), qty: mm(108), unit: mm(124), price: mm(138), tax: mm(160), total: mm(170) };
  const showTax = !d.small_business && new Set(d.items.map((i) => i.tax_rate)).size > 1;
  const drawHead = () => {
    const y = doc.y;
    doc.rect(mm(25), y - 3, mm(165), 16).fill(color);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('Pos.', cols.pos + 2, y + 1, { width: 20 });
    doc.text('Bezeichnung', cols.name, y + 1, { width: mm(72) });
    doc.text('Menge', cols.qty, y + 1, { width: mm(15), align: 'right' });
    doc.text('Einh.', cols.unit + 3, y + 1, { width: mm(14) });
    doc.text('Einzelpreis', cols.price, y + 1, { width: mm(20), align: 'right' });
    if (showTax) doc.text('USt', cols.tax, y + 1, { width: mm(10), align: 'right' });
    doc.text('Gesamt', cols.total, y + 1, { width: mm(20), align: 'right' });
    doc.font('Helvetica').fillColor('#000');
    doc.y = y + 18;
  };
  drawHead();
  d.items.forEach((it, idx) => {
    const descH = it.description ? doc.font('Helvetica').fontSize(8).heightOfString(it.description, { width: mm(72) }) : 0;
    const nameH = doc.font('Helvetica-Bold').fontSize(9).heightOfString(it.name, { width: mm(72) });
    doc.font('Helvetica');
    if (doc.y + nameH + descH + 10 > doc.page.height - mm(35)) {
      doc.addPage();
      doc.y = mm(25);
      drawHead();
    }
    const y = doc.y;
    if (idx % 2 === 1) doc.rect(mm(25), y - 3, mm(165), nameH + descH + 7).fill('#f5f7fa').fillColor('#000');
    doc.fontSize(9).fillColor('#000');
    doc.text(String(it.position), cols.pos + 2, y, { width: 20 });
    doc.font('Helvetica-Bold').text(it.name, cols.name, y, { width: mm(72) }).font('Helvetica');
    if (it.description) doc.fontSize(8).fillColor('#555').text(it.description, cols.name, y + nameH, { width: mm(72) }).fillColor('#000').fontSize(9);
    doc.text(f.num(it.quantity, 3), cols.qty, y, { width: mm(15), align: 'right' });
    doc.text(it.unit, cols.unit + 3, y, { width: mm(14) });
    let price = f.eur(it.unit_price);
    if (it.discount_pct) price += `\n-${f.num(it.discount_pct)} %`;
    doc.text(price, cols.price, y, { width: mm(20), align: 'right' });
    if (showTax) doc.text(`${f.num(it.tax_rate)} %`, cols.tax, y, { width: mm(10), align: 'right' });
    doc.text(f.eur(it.net_amount), cols.total, y, { width: mm(20), align: 'right' });
    doc.y = y + Math.max(nameH + descH, it.discount_pct ? 22 : 0) + 6;
  });
}

function totals(doc, s, d) {
  if (doc.y > doc.page.height - mm(70)) { doc.addPage(); doc.y = mm(25); }
  let y = doc.y + 6;
  doc.moveTo(mm(120), y).lineTo(mm(190), y).lineWidth(0.5).strokeColor('#999').stroke();
  y += 6;
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10.5 : 9);
    doc.text(label, mm(110), y, { width: mm(55), align: 'right' });
    doc.text(value, mm(165), y, { width: mm(25), align: 'right' });
    y += bold ? 16 : 13;
  };
  row('Summe netto', f.eur(d.calc.net));
  if (!d.small_business && !d.reverse_charge) for (const t of d.calc.taxes) row(`zzgl. ${f.num(t.rate)} % USt auf ${f.eur(t.base)}`, f.eur(t.tax));
  doc.moveTo(mm(120), y - 2).lineTo(mm(190), y - 2).stroke();
  y += 2;
  row(d.kind === 'angebot' ? 'Angebotssumme' : 'Gesamtbetrag', f.eur(d.reverse_charge ? d.calc.net : d.calc.gross), true);
  if (d.paid_total > 0 && d.kind === 'rechnung') {
    row('bereits bezahlt', `-${f.eur(d.paid_total)}`);
    row('offener Betrag', f.eur(d.gross_total - d.paid_total), true);
  }
  doc.font('Helvetica').fontSize(9);
  doc.y = y + 8;
}

function textBlock(doc, text) {
  if (!text) return;
  if (doc.y > doc.page.height - mm(45)) { doc.addPage(); doc.y = mm(25); }
  doc.fontSize(9.5).fillColor('#000').text(text, mm(25), doc.y, { width: mm(165), lineGap: 2 });
  doc.moveDown(0.8);
}

function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

async function salesDocument(d) {
  const s = settings.all();
  const doc = base(s);
  const label = KIND_LABELS[d.kind];
  doc.info.Title = `${label} ${d.number || 'Entwurf'}`;
  header(doc, s);
  addressBlock(doc, s, d.snapshot);
  const rows = [
    [`${label}snr.`.replace('Stornorechnungsnr.', 'Storno-Nr.').replace('Auftragsbestätigungsnr.', 'AB-Nr.'), d.number || 'ENTWURF'],
    ['Datum', f.date(d.issue_date)],
    ['Kundennr.', d.snapshot.number],
  ];
  if (['rechnung', 'storno'].includes(d.kind)) {
    rows.push(['Leistungsdatum', d.service_until ? `${f.date(d.service_date)} –` : f.date(d.service_date)]);
    if (d.service_until) rows.push(['', f.date(d.service_until)]);
  }
  if (d.kind === 'rechnung' && d.due_date) rows.push(['Fällig am', f.date(d.due_date)]);
  if (d.kind === 'angebot' && d.valid_until) rows.push(['Gültig bis', f.date(d.valid_until)]);
  if (d.snapshot.vat_id) rows.push(['Ihre USt-IdNr.', d.snapshot.vat_id]);
  if (d.snapshot.leitweg_id) rows.push(['Leitweg-ID', d.snapshot.leitweg_id]);
  infoBlock(doc, rows);

  if (!d.finalized_at && ['rechnung', 'storno'].includes(d.kind)) {
    doc.save().rotate(-35, { origin: [mm(105), mm(150)] }).fontSize(70).fillColor('#e5e7eb').text('ENTWURF', mm(25), mm(140), { width: mm(165), align: 'center' }).restore();
  }

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text(d.title || `${label} ${d.number || ''}`, mm(25), mm(103), { width: mm(165) });
  doc.font('Helvetica').moveDown(0.6);
  textBlock(doc, fillPlaceholders(d.intro, d));
  itemsTable(doc, s, d);
  totals(doc, s, d);

  // Pflichthinweise
  const notes = [];
  if (d.small_business) notes.push('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).');
  if (d.reverse_charge) notes.push('Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, § 13b UStG).');
  if (notes.length) textBlock(doc, notes.join('\n'));
  textBlock(doc, fillPlaceholders(d.footer, d));

  if (d.kind === 'rechnung') {
    const qr = await giroCode(s, d.gross_total - d.paid_total, d.number || '');
    if (qr) {
      if (doc.y > doc.page.height - mm(60)) { doc.addPage(); doc.y = mm(25); }
      const y = doc.y + 4;
      doc.image(qr, mm(25), y, { width: mm(26) });
      doc.fontSize(8).fillColor('#555').text('Bequem bezahlen: QR-Code mit Ihrer Banking-App scannen (GiroCode).', mm(55), y + mm(9), { width: mm(90) });
      doc.y = y + mm(30);
    }
  }
  footer(doc, s);
  return toBuffer(doc);
}

async function dunningLetter(d, dunning) {
  const s = settings.all();
  const doc = base(s);
  const titles = { 1: 'Zahlungserinnerung', 2: '2. Mahnung', 3: 'Letzte Mahnung' };
  header(doc, s);
  addressBlock(doc, s, d.snapshot);
  infoBlock(doc, [['Datum', f.date(dunning.created_at)], ['Rechnungsnr.', d.number], ['Kundennr.', d.snapshot.number], ['Mahnstufe', String(dunning.level)]]);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text(`${titles[dunning.level]} zu Rechnung ${d.number}`, mm(25), mm(103));
  doc.font('Helvetica').fontSize(10).moveDown(1);
  const sn = d.snapshot;
  const salutation = sn.salutation === 'Frau' && sn.last_name ? `Sehr geehrte Frau ${sn.last_name},`
    : sn.salutation === 'Herr' && sn.last_name ? `Sehr geehrter Herr ${sn.last_name},`
      : sn.contact ? `Guten Tag ${sn.contact},` : 'Sehr geehrte Damen und Herren,';
  const text = String(s[`dunning_text_${dunning.level}`] || '').replaceAll('{DUE_DATE}', f.date(dunning.due_date));
  doc.text(`${salutation}\n\n${text}`, { width: mm(165), lineGap: 2 });
  doc.moveDown(1);
  const fees = d.dunnings.filter((x) => x.level <= dunning.level).reduce((a, x) => a + x.fee, 0);
  const rows = [
    [`Rechnung ${d.number} vom ${f.date(d.issue_date)}, fällig seit ${f.date(d.due_date)}`, f.eur(d.gross_total)],
    ...(d.paid_total ? [['abzüglich Zahlungen', `-${f.eur(d.paid_total)}`]] : []),
    ...(fees ? [['Mahngebühren', f.eur(fees)]] : []),
  ];
  for (const [l, v] of rows) {
    const y = doc.y;
    doc.text(l, mm(25), y, { width: mm(130) });
    doc.text(v, mm(155), y, { width: mm(35), align: 'right' });
    doc.moveDown(0.4);
  }
  const total = d.gross_total - d.paid_total + fees;
  const y = doc.y + 4;
  doc.moveTo(mm(120), y).lineTo(mm(190), y).stroke();
  doc.font('Helvetica-Bold').text('Zu zahlender Betrag', mm(25), y + 6, { width: mm(130) });
  doc.text(f.eur(total), mm(155), y + 6, { width: mm(35), align: 'right' });
  doc.font('Helvetica').moveDown(2);
  doc.text('Sollten Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.\n\nMit freundlichen Grüßen\n' + s.company_owner, mm(25), doc.y, { width: mm(165), lineGap: 2 });
  const qr = await giroCode(s, total, d.number);
  if (qr) doc.image(qr, mm(25), doc.y + 10, { width: mm(26) });
  footer(doc, s);
  return toBuffer(doc);
}

// Einfache Tabellen-PDFs für Berichte (z. B. Stundennachweis)
async function tableReport(title, subtitle, headers, rows, widths, { landscape = false } = {}) {
  const s = settings.all();
  const doc = base(s, landscape ? 'landscape' : 'portrait');
  doc.page.margins.top = mm(20);
  header(doc, s);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(15).text(title, mm(25), mm(45));
  doc.font('Helvetica').fontSize(9).fillColor('#555').text(subtitle || '', { width: cw(doc) }).moveDown(1);
  const total = widths.reduce((a, b) => a + b, 0);
  const ws = widths.map((w) => (w / total) * cw(doc));
  const drawRow = (cells, bold, fill) => {
    const h = Math.max(...cells.map((c, i) => doc.fontSize(8.5).heightOfString(String(c ?? ''), { width: ws[i] - 4 }))) + 6;
    if (doc.y + h > doc.page.height - mm(35)) { doc.addPage(); doc.y = mm(25); }
    const y = doc.y;
    if (fill) doc.rect(mm(25), y - 2, cw(doc), h).fill(fill);
    let x = mm(25);
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(fill === hexColor(s.brand_color) ? '#fff' : '#000');
    cells.forEach((c, i) => {
      const right = /^-?[\d.,]+\s?(€|h|%)?$/.test(String(c).trim()) || String(c).includes('€');
      doc.text(String(c ?? ''), x + 2, y + 1, { width: ws[i] - 4, align: right ? 'right' : 'left' });
      x += ws[i];
    });
    doc.y = y + h;
  };
  drawRow(headers, true, hexColor(s.brand_color));
  rows.forEach((r, i) => drawRow(r.cells || r, r.bold, i % 2 ? '#f5f7fa' : null));
  footer(doc, s);
  return toBuffer(doc);
}

module.exports = { salesDocument, dunningLetter, tableReport };
