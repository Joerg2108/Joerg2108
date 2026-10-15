'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');
const calc = require('../public/js/calc');
const { getSetting, DATA_DIR } = require('./db');
const { formatDate, letterSalutation, TYPE_LABEL } = require('./documents');

const MM = 72 / 25.4;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ML = 25 * MM; // linker Rand DIN 5008
const MR = 20 * MM;
const CW = PAGE_W - ML - MR;
const FOOT_Y = PAGE_H - 27 * MM;
const BOTTOM = FOOT_Y - 12 * MM;

const money = (c) => calc.formatMoney(c);
const LOGO_FILES = ['logo.png', 'logo.jpg', 'logo.jpeg'];

function logoPath() {
  for (const f of LOGO_FILES) {
    const p = path.join(DATA_DIR, f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function hexToRgb(hex) {
  const h = String(hex || '#2c5aa0').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function tint(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  return [Math.round(r + (255 - r) * f), Math.round(g + (255 - g) * f), Math.round(b + (255 - b) * f)];
}

function fill(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

/* ================================================================== */
/* Briefbogen                                                          */
/* ================================================================== */
class Letter {
  constructor({ title, subjectLine }) {
    this.company = getSetting('company');
    this.brand = this.company.brand_color || '#2c5aa0';
    this.accent = this.company.accent_color || '#c1272d';
    this.title = title;
    this.subjectLine = subjectLine;
    this.pdf = new PDFDocument({
      size: 'A4',
      margins: { top: 0, left: ML, right: MR, bottom: 0 },
      bufferPages: true,
      info: { Title: title, Author: this.company.name, Creator: 'BauDaH Office', Producer: 'BauDaH Office' },
    });
    this.y = 0;
  }

  /* ---------- Grundelemente ---------- */
  text(str, x, y, opts = {}) {
    const { font = 'Helvetica', size = 9, color = '#222222', ...rest } = opts;
    this.pdf.font(font).fontSize(size).fillColor(color).text(String(str ?? ''), x, y, { lineGap: 1, ...rest });
  }
  height(str, width, font = 'Helvetica', size = 9) {
    return this.pdf.font(font).fontSize(size).heightOfString(String(str ?? ''), { width, lineGap: 1 });
  }

  drawPageFrame(first) {
    const p = this.pdf;
    // Farbband oben
    p.save().rect(0, 0, PAGE_W, 5).fill(this.brand).restore();
    p.save().rect(PAGE_W - 120, 0, 120, 5).fill(this.accent).restore();
    // Falz- und Lochmarken
    p.save().lineWidth(0.4).strokeColor('#9a9a9a');
    p.moveTo(4 * MM, 105 * MM).lineTo(9 * MM, 105 * MM).stroke();
    p.moveTo(4 * MM, 210 * MM).lineTo(9 * MM, 210 * MM).stroke();
    p.moveTo(4 * MM, 148.5 * MM).lineTo(11 * MM, 148.5 * MM).stroke();
    p.restore();

    if (first) this.drawLogo(PAGE_W - MR, 14 * MM, 62 * MM, 24 * MM);
    else {
      this.drawLogo(PAGE_W - MR, 9 * MM, 40 * MM, 12 * MM);
      this.text(this.title, ML, 12 * MM, { font: 'Helvetica-Bold', size: 9, color: '#555555' });
    }
    this.drawFooter();
  }

  drawLogo(right, top, maxW, maxH) {
    const lp = logoPath();
    if (lp) {
      try {
        const img = this.pdf.openImage(lp);
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * scale;
        this.pdf.image(img, right - w, top, { width: w });
        return;
      } catch {
        /* Fallback auf Wortmarke */
      }
    }
    // Wortmarke im Stil der Visitenkarte
    const big = maxH > 15 * MM;
    const nameSize = big ? 26 : 15;
    const p = this.pdf;
    const short = this.company.short || this.company.name;
    p.font('Helvetica-Bold').fontSize(nameSize);
    const w = p.widthOfString(short);
    p.save().fillColor(this.brand).text(short, right - w, top, { lineBreak: false }).restore();
    if (big) {
      const claim = this.company.claim || '';
      p.font('Helvetica').fontSize(9.5);
      const cw = p.widthOfString(claim);
      p.fillColor('#555555').text(claim, right - cw, top + nameSize + 1, { lineBreak: false });
      p.save().rect(right - w, top + nameSize + 15, w, 1.6).fill(this.accent).restore();
    }
  }

  drawFooter() {
    const c = this.company;
    const p = this.pdf;
    p.save().lineWidth(0.6).strokeColor(this.brand).moveTo(ML, FOOT_Y).lineTo(PAGE_W - MR, FOOT_Y).stroke().restore();
    const cols = [
      [c.name, c.claim, `Inh. ${c.owner}`, `${c.street} · ${c.zip} ${c.city}`],
      [c.phone && `Telefon: ${c.phone}`, c.mobile && `Mobil: ${c.mobile}`, c.email && `E-Mail: ${c.email}`, c.web && `Web: ${c.web}`],
      [c.bank_name, c.iban && `IBAN: ${formatIban(c.iban)}`, c.bic && `BIC: ${c.bic}`, c.account_holder && `Inhaber: ${c.account_holder}`],
      [c.tax_number && `Steuernr.: ${c.tax_number}`, c.vat_id && `USt-IdNr.: ${c.vat_id}`, c.chamber, c.chamber_no && `Betriebsnr.: ${c.chamber_no}`],
    ];
    const weights = [0.27, 0.23, 0.29, 0.21];
    let x = ML;
    cols.forEach((lines, i) => {
      const colW = CW * weights[i];
      const t = lines.filter(Boolean).join('\n');
      this.text(t, x, FOOT_Y + 2.5 * MM, { size: 6.6, color: '#555555', width: colW - 4, lineGap: 0.6 });
      x += colW;
    });
  }

  newPage() {
    this.pdf.addPage();
    this.drawPageFrame(false);
    this.y = 26 * MM;
  }

  ensure(h) {
    if (this.y + h > BOTTOM) {
      this.newPage();
      return true;
    }
    return false;
  }

  /* ---------- Briefkopf erste Seite ---------- */
  header({ snapshot, info }) {
    this.drawPageFrame(true);
    const c = this.company;
    const addrTop = 45 * MM;
    // Rücksendeangabe
    const sender = [c.name, c.street, `${c.zip} ${c.city}`].filter(Boolean).join(' · ');
    this.text(sender, ML, addrTop + 9 * MM, { size: 6.8, color: '#666666', width: 85 * MM, lineBreak: false });
    this.pdf.save().lineWidth(0.3).strokeColor('#999999')
      .moveTo(ML, addrTop + 12.2 * MM).lineTo(ML + this.pdf.font('Helvetica').fontSize(6.8).widthOfString(sender), addrTop + 12.2 * MM).stroke().restore();
    // Anschrift
    const lines = snapshot?.lines?.length ? snapshot.lines : ['(kein Kunde ausgewählt)'];
    this.text(lines.join('\n'), ML, addrTop + 17.7 * MM, { size: 10, color: '#111111', width: 85 * MM, lineGap: 1.5 });

    // Infoblock rechts
    const ix = 125 * MM;
    let iy = addrTop + 4 * MM;
    const lw = 30 * MM;
    for (const [label, value, bold] of info.filter((r) => r && r[1])) {
      this.text(label, ix, iy, { size: 8, color: '#666666', width: lw });
      this.text(value, ix + lw, iy, { size: 8.5, color: '#111111', font: bold ? 'Helvetica-Bold' : 'Helvetica', width: PAGE_W - MR - ix - lw });
      iy += this.height(value, PAGE_W - MR - ix - lw, 'Helvetica', 8.5) + 2.6;
    }
    this.y = Math.max(103 * MM, iy + 6 * MM);
  }

  heading(title, lines) {
    this.text(title, ML, this.y, { font: 'Helvetica-Bold', size: 15, color: this.brand });
    this.y += 21;
    for (const [label, value] of lines.filter((l) => l[1])) {
      this.pdf.font('Helvetica-Bold').fontSize(9.5).fillColor('#111111').text(`${label}: `, ML, this.y, { continued: true, width: CW });
      this.pdf.font('Helvetica').text(value, { width: CW });
      this.y = this.pdf.y + 2;
    }
    this.y += 8;
  }

  paragraph(str, opts = {}) {
    if (!str) return;
    const size = opts.size || 9.5;
    const h = this.height(str, CW, opts.font, size);
    if (h < BOTTOM - 30 * MM) this.ensure(h);
    this.text(str, ML, this.y, { size, width: CW, color: opts.color || '#222222', font: opts.font || 'Helvetica', lineGap: 1.6 });
    this.y = this.pdf.y + (opts.after ?? 8);
  }

  box(lines, color) {
    const text = lines.join('\n');
    const h = this.height(text, CW - 16, 'Helvetica', 8.5) + 12;
    this.ensure(h + 4);
    const p = this.pdf;
    p.save().rect(ML, this.y, CW, h).fill(tint(color || this.brand, 0.92)).restore();
    p.save().rect(ML, this.y, 2.5, h).fill(color || this.brand).restore();
    this.text(text, ML + 10, this.y + 6, { size: 8.5, width: CW - 16, color: '#222222' });
    this.y += h + 8;
  }

  finish() {
    const range = this.pdf.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      this.pdf.switchToPage(i);
      this.text(`Seite ${i + 1} von ${range.count}`, ML, FOOT_Y - 5 * MM, {
        size: 7.5, color: '#777777', width: CW, align: 'right', lineBreak: false,
      });
    }
    this.pdf.end();
    return this.pdf;
  }
}

function formatIban(iban) {
  return String(iban || '').replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
}

/* ================================================================== */
/* Angebot / Rechnung                                                  */
/* ================================================================== */
const COL = {
  pos: { x: ML, w: 32 },
  name: { x: ML + 32, w: CW - 32 - 70 - 66 - 74 },
  qty: { x: PAGE_W - MR - 74 - 66 - 70, w: 70 },
  ep: { x: PAGE_W - MR - 74 - 66, w: 66 },
  gp: { x: PAGE_W - MR - 74, w: 74 },
};

function renderDocumentPdf(doc) {
  const company = getSetting('company');
  const texts = getSetting('texts');
  const isOffer = doc.type === 'angebot';
  const label = TYPE_LABEL[doc.type] + (doc.type === 'abschlag' && doc.abschlag_no ? ` (${doc.abschlag_no}.)` : '');
  const number = doc.number || 'ENTWURF';
  const title = `${TYPE_LABEL[doc.type]} ${number}`;
  const L = new Letter({ title });
  const snap = doc.snapshot;

  const info = [
    [`${isOffer ? 'Angebots' : 'Rechnungs'}-Nr.`, number, true],
    ['Datum', formatDate(doc.date)],
    ['Kunden-Nr.', snap?.number],
    isOffer ? ['Gültig bis', formatDate(doc.valid_until)] : ['Leistung', doc.service_period],
    !isOffer && doc.type !== 'storno' ? ['Fällig am', formatDate(doc.due_date)] : null,
    doc.customer_ref ? ['Ihr Zeichen', doc.customer_ref] : null,
    doc.ref ? ['Bezug', `${TYPE_LABEL[doc.ref.type]} ${doc.ref.number}`] : null,
    !doc.ref && doc.source && !isOffer ? ['Angebot', doc.source.number] : null,
    snap?.vat_id && doc.tax_mode === '13b' ? ['Ihre USt-IdNr.', snap.vat_id] : null,
    ['Ansprechpartner', company.owner],
    ['Telefon', company.phone],
    ['E-Mail', company.email],
  ];
  L.header({ snapshot: snap, info });

  L.heading(`${label} ${doc.number ? number : '– ENTWURF –'}`, [
    ['Bauvorhaben', doc.project],
    ['Baustelle', doc.site_address],
    ['Betreff', doc.subject],
  ]);

  L.paragraph(`${letterSalutation(snap)},`, { after: 6 });
  L.paragraph(doc.intro, { after: 12 });

  /* ---------- Tabelle ---------- */
  const p = L.pdf;
  const items = calc.numberItems(doc.items);
  const totals = doc.totals;
  let carry = 0;
  const titleRows = items.filter((i) => i.kind === 'title');

  const tableHeader = () => {
    const h = 17;
    p.save().rect(ML, L.y, CW, h).fill(L.brand).restore();
    const o = { font: 'Helvetica-Bold', size: 8, color: '#ffffff' };
    L.text('Pos.', COL.pos.x + 4, L.y + 5, o);
    L.text('Leistungsbeschreibung', COL.name.x, L.y + 5, o);
    L.text('Menge', COL.qty.x, L.y + 5, { ...o, width: COL.qty.w - 4, align: 'right' });
    L.text('Einzelpreis', COL.ep.x, L.y + 5, { ...o, width: COL.ep.w - 4, align: 'right' });
    L.text('Gesamt', COL.gp.x, L.y + 5, { ...o, width: COL.gp.w - 4, align: 'right' });
    L.y += h + 4;
  };
  const carryLine = (txt) => {
    p.save().lineWidth(0.4).strokeColor('#bbbbbb').moveTo(COL.ep.x, L.y).lineTo(PAGE_W - MR, L.y).stroke().restore();
    L.text(txt, COL.name.x, L.y + 3, { size: 8.5, font: 'Helvetica-Oblique', color: '#555555', width: COL.name.w + COL.qty.w + COL.ep.w - 4, align: 'right' });
    L.text(money(carry), COL.gp.x, L.y + 3, { size: 8.5, font: 'Helvetica-Bold', width: COL.gp.w - 4, align: 'right' });
    L.y += 16;
  };
  const breakIfNeeded = (h) => {
    if (L.y + h > BOTTOM - 14) {
      carryLine('Übertrag');
      L.newPage();
      tableHeader();
      carryLine('Übertrag');
      return true;
    }
    return false;
  };

  tableHeader();
  let currentTitle = null;
  const closeTitle = () => {
    if (!currentTitle) return;
    breakIfNeeded(20);
    p.save().lineWidth(0.5).strokeColor(L.brand).moveTo(COL.ep.x, L.y).lineTo(PAGE_W - MR, L.y).stroke().restore();
    L.text(`Summe Titel ${currentTitle.posnr} – ${currentTitle.name}`, COL.name.x, L.y + 4, {
      font: 'Helvetica-Bold', size: 8.5, width: COL.name.w + COL.qty.w + COL.ep.w - 4, align: 'right', color: L.brand,
    });
    L.text(money(currentTitle.titleSum), COL.gp.x, L.y + 4, { font: 'Helvetica-Bold', size: 8.5, width: COL.gp.w - 4, align: 'right', color: L.brand });
    L.y += 22;
    currentTitle = null;
  };

  for (const it of items) {
    if (it.kind === 'pagebreak') {
      closeTitle();
      carryLine('Übertrag');
      L.newPage();
      tableHeader();
      carryLine('Übertrag');
      continue;
    }
    if (it.kind === 'title') {
      closeTitle();
      breakIfNeeded(40);
      p.save().rect(ML, L.y, CW, 18).fill(tint(L.brand, 0.88)).restore();
      L.text(it.posnr, COL.pos.x + 4, L.y + 5, { font: 'Helvetica-Bold', size: 9.5, color: L.brand });
      L.text(it.name, COL.name.x, L.y + 5, { font: 'Helvetica-Bold', size: 9.5, color: L.brand, width: CW - 40 });
      L.y += 22;
      if (it.description) {
        const h = L.height(it.description, COL.name.w + COL.qty.w, 'Helvetica', 8.3);
        L.text(it.description, COL.name.x, L.y, { size: 8.3, color: '#444444', width: COL.name.w + COL.qty.w });
        L.y += h + 6;
      }
      currentTitle = it;
      continue;
    }
    if (it.kind === 'text') {
      const txt = [it.name, it.description].filter(Boolean).join('\n');
      const h = L.height(txt, CW - 32, 'Helvetica', 8.5);
      breakIfNeeded(h + 6);
      L.text(txt, COL.name.x, L.y, { size: 8.5, color: '#333333', width: CW - 32 });
      L.y += h + 8;
      continue;
    }
    // Position
    const descParts = [];
    if (it.description) descParts.push(it.description);
    if (it.discount) descParts.push(`abzgl. ${calc.formatQty(it.discount)} % Nachlass`);
    const desc = descParts.join('\n');
    const nameLabel = it.optional ? `${it.name}  [Eventualposition]` : it.name;
    const hName = L.height(nameLabel, COL.name.w - 8, 'Helvetica-Bold', 9);
    const descW = COL.name.w + COL.qty.w - 12;
    const hDesc = desc ? L.height(desc, descW, 'Helvetica', 8.2) + 2 : 0;
    const rowH = hName + hDesc + 8;
    breakIfNeeded(Math.min(rowH, 200));
    const top = L.y;
    L.text(it.posnr, COL.pos.x + 4, top, { size: 8.5, color: '#555555' });
    L.text(nameLabel, COL.name.x, top, { font: 'Helvetica-Bold', size: 9, width: COL.name.w - 8 });
    if (desc) L.text(desc, COL.name.x, top + hName + 2, { size: 8.2, color: '#4a4a4a', width: descW });
    L.text(`${calc.formatQty(it.qty)} ${it.unit}`, COL.qty.x, top, { size: 8.8, width: COL.qty.w - 4, align: 'right' });
    L.text(money(it.price), COL.ep.x, top, { size: 8.8, width: COL.ep.w - 4, align: 'right' });
    if (it.optional) {
      L.text('nur EP', COL.gp.x, top, { size: 8.3, font: 'Helvetica-Oblique', color: '#777777', width: COL.gp.w - 4, align: 'right' });
    } else {
      L.text(money(it.total), COL.gp.x, top, { size: 8.8, font: 'Helvetica-Bold', width: COL.gp.w - 4, align: 'right' });
      carry += it.total;
    }
    L.y = Math.max(L.pdf.y, top + rowH - 4) + 4;
    p.save().lineWidth(0.3).strokeColor('#e3e3e3').moveTo(ML, L.y - 3).lineTo(PAGE_W - MR, L.y - 3).stroke().restore();
  }
  closeTitle();

  /* ---------- Zusammenstellung (Bau-LV) ---------- */
  if (titleRows.length > 1) {
    L.ensure(30 + titleRows.length * 14);
    L.y += 4;
    L.text('Zusammenstellung', ML, L.y, { font: 'Helvetica-Bold', size: 10, color: L.brand });
    L.y += 16;
    for (const t of titleRows) {
      L.text(`Titel ${t.posnr}`, ML, L.y, { size: 8.8, color: '#555555' });
      L.text(t.name, ML + 50, L.y, { size: 8.8, width: CW - 50 - 90 });
      L.text(money(t.titleSum), PAGE_W - MR - 90, L.y, { size: 8.8, width: 86, align: 'right' });
      L.y += 14;
    }
    L.y += 4;
  }

  /* ---------- Summen ---------- */
  const rows = [];
  if (totals.discount) {
    rows.push(['Zwischensumme', money(totals.subtotal)]);
    rows.push([`abzgl. ${calc.formatQty(doc.discount_percent)} % Rabatt`, money(-totals.discount)]);
  }
  rows.push(['Summe netto', money(totals.net), 'bold']);
  if (doc.tax_mode === '13b') rows.push(['Umsatzsteuer (§ 13b UStG)', money(0)]);
  else for (const g of totals.vatGroups) rows.push([`zzgl. ${calc.formatQty(g.rate)} % USt auf ${money(g.net)}`, money(g.vat)]);
  const grossLabel = doc.type === 'storno' ? 'Stornobetrag' : isOffer ? 'Angebotssumme' : doc.type === 'schluss' ? 'Gesamtleistung brutto' : 'Rechnungsbetrag';

  const tw = 260;
  const tx = PAGE_W - MR - tw;
  const prepaidRows = doc.prepaid?.list?.length ? doc.prepaid.list : [];
  L.ensure(rows.length * 15 + 40 + prepaidRows.length * 15 + (prepaidRows.length ? 40 : 0));
  L.y += 6;
  for (const [l, v, b] of rows) {
    L.text(l, tx, L.y, { size: 9, width: tw - 90, font: b ? 'Helvetica-Bold' : 'Helvetica' });
    L.text(v, tx + tw - 90, L.y, { size: 9, width: 90, align: 'right', font: b ? 'Helvetica-Bold' : 'Helvetica' });
    L.y += 15;
  }
  const boxRow = (labelText, value) => {
    p.save().rect(tx - 6, L.y - 2, tw + 6, 21).fill(L.brand).restore();
    L.text(labelText, tx, L.y + 4, { size: 10, font: 'Helvetica-Bold', color: '#ffffff', width: tw - 100 });
    L.text(value, tx + tw - 100, L.y + 4, { size: 10.5, font: 'Helvetica-Bold', color: '#ffffff', width: 96, align: 'right' });
    L.y += 28;
  };
  if (prepaidRows.length) {
    L.text(grossLabel, tx, L.y, { size: 9, font: 'Helvetica-Bold', width: tw - 90 });
    L.text(money(totals.gross), tx + tw - 90, L.y, { size: 9, font: 'Helvetica-Bold', width: 90, align: 'right' });
    L.y += 17;
    const sign = doc.type === 'storno' ? -1 : 1;
    for (const a of prepaidRows) {
      const t = `abzgl. Abschlag ${a.number} v. ${formatDate(a.date)}\n(netto ${money(a.net * sign)} + USt ${money(a.vat * sign)})`;
      L.text(t, tx, L.y, { size: 8.3, width: tw - 90, color: '#444444' });
      L.text(money(-a.gross * sign), tx + tw - 90, L.y, { size: 9, width: 90, align: 'right' });
      L.y += 25;
    }
    boxRow(doc.type === 'storno' ? 'Stornobetrag' : 'Verbleibender Zahlbetrag', money(totals.payable));
  } else {
    boxRow(grossLabel, money(totals.gross));
  }

  /* ---------- Hinweise ---------- */
  const vars = {
    nummer: number,
    faellig: formatDate(doc.due_date),
    gueltig: formatDate(doc.valid_until),
    datum: formatDate(doc.date),
    skonto_tage: doc.skonto_days,
    skonto_prozent: calc.formatQty(doc.skonto_percent),
    skonto_betrag: money(calc.round(totals.payable * (1 - doc.skonto_percent / 100))),
  };
  const notes = [];
  if (doc.tax_mode === '13b') notes.push(texts.reverse_charge);
  if (doc.show_35a && totals.labor > 0 && doc.type !== 'storno') {
    notes.push(
      `Im ${isOffer ? 'Angebotsbetrag' : 'Rechnungsbetrag'} enthaltene Arbeits-/Lohnkosten inkl. USt gemäß § 35a EStG: ${money(totals.labor)}` +
        (doc.type === 'schluss' && prepaidRows.length ? ' (Gesamtleistung)' : '')
    );
  }
  if (notes.length) L.box(notes, L.accent);

  if (isOffer) {
    if (doc.valid_until) L.paragraph(fill(texts.validity, vars), { after: 6 });
  } else if (doc.type !== 'storno') {
    L.paragraph(fill(texts.payment, vars), { after: 4 });
    if (doc.skonto_percent && doc.skonto_days) L.paragraph(fill(texts.payment_skonto, vars), { after: 4 });
    if (snap?.type === 'privat') L.paragraph(texts.private_note, { size: 8, color: '#666666', after: 4 });
    L.y += 6;
  }

  L.paragraph(doc.outro, { after: 4 });
  L.ensure(30);
  L.y += 18;
  L.text(company.owner, ML, L.y, { size: 9.5, font: 'Helvetica-Bold' });
  L.text(`${company.owner_title || ''}${company.owner_title ? ' · ' : ''}${company.name}`, ML, L.y + 13, { size: 8.5, color: '#555555' });
  L.y += 30;

  if (isOffer) {
    // Auftragsbestätigung zum Unterschreiben
    L.ensure(70);
    L.y += 8;
    p.save().lineWidth(0.4).dash(2, { space: 2 }).strokeColor('#999999').moveTo(ML, L.y).lineTo(PAGE_W - MR, L.y).stroke().undash().restore();
    L.y += 10;
    L.text('Auftragserteilung', ML, L.y, { font: 'Helvetica-Bold', size: 10, color: L.brand });
    L.y += 15;
    L.text(`Hiermit beauftrage ich die Ausführung der Leistungen gemäß Angebot ${number} vom ${formatDate(doc.date)}.`, ML, L.y, { size: 8.8, width: CW });
    L.y += 36;
    p.save().lineWidth(0.5).strokeColor('#333333');
    p.moveTo(ML, L.y).lineTo(ML + 70 * MM, L.y).stroke();
    p.moveTo(ML + 90 * MM, L.y).lineTo(PAGE_W - MR, L.y).stroke();
    p.restore();
    L.text('Ort, Datum', ML, L.y + 3, { size: 7.5, color: '#666666' });
    L.text('Unterschrift Auftraggeber', ML + 90 * MM, L.y + 3, { size: 7.5, color: '#666666' });
    L.y += 16;
  }

  if (!doc.number) {
    // Wasserzeichen für Entwürfe
    const range = p.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      p.switchToPage(i);
      p.save().rotate(-35, { origin: [PAGE_W / 2, PAGE_H / 2] }).font('Helvetica-Bold').fontSize(90)
        .fillColor('#000000').fillOpacity(0.05).text('ENTWURF', 0, PAGE_H / 2 - 50, { width: PAGE_W, align: 'center' }).restore();
    }
  }
  return L.finish();
}

/* ================================================================== */
/* Mahnung                                                             */
/* ================================================================== */
function renderReminderPdf(doc, reminder) {
  const company = getSetting('company');
  const cfg = getSetting('dunning');
  const texts = getSetting('texts');
  const title = cfg.titles[reminder.level - 1] || `${reminder.level - 1}. Mahnung`;
  const L = new Letter({ title: `${title} zu ${doc.number}` });
  const snap = doc.snapshot;
  L.header({
    snapshot: snap,
    info: [
      ['Datum', formatDate(reminder.date)],
      ['Kunden-Nr.', snap?.number],
      ['Rechnung', doc.number, true],
      ['Ansprechpartner', company.owner],
      ['Telefon', company.phone],
      ['E-Mail', company.email],
    ],
  });
  L.heading(title, [
    ['Rechnung', `${doc.number} vom ${formatDate(doc.date)}`],
    ['Bauvorhaben', doc.project],
  ]);
  L.paragraph(`${letterSalutation(snap)},`, { after: 6 });
  L.paragraph(fill(cfg.texts[reminder.level - 1] || '', { faellig: formatDate(reminder.due_date), nummer: doc.number }), { after: 14 });

  const p = L.pdf;
  const rowsData = [
    ['Rechnungsbetrag', money(doc.totals.payable)],
    ['bereits gezahlt', money(-doc.paid)],
    ['offener Rechnungsbetrag', money(reminder.open_amount)],
  ];
  const prevFees = doc.reminders.filter((r) => r.level < reminder.level).reduce((s, r) => s + r.fee, 0);
  if (prevFees) rowsData.push(['Mahngebühren aus Vorstufen', money(prevFees)]);
  if (reminder.fee) rowsData.push(['Mahngebühr', money(reminder.fee)]);

  p.save().rect(ML, L.y, CW, 17).fill(L.brand).restore();
  L.text('Rechnung', ML + 6, L.y + 5, { font: 'Helvetica-Bold', size: 8, color: '#fff' });
  L.text('Datum', ML + 120, L.y + 5, { font: 'Helvetica-Bold', size: 8, color: '#fff' });
  L.text('Fällig seit', ML + 190, L.y + 5, { font: 'Helvetica-Bold', size: 8, color: '#fff' });
  L.text('Betrag', PAGE_W - MR - 96, L.y + 5, { font: 'Helvetica-Bold', size: 8, color: '#fff', width: 90, align: 'right' });
  L.y += 22;
  L.text(doc.number, ML + 6, L.y, { size: 9 });
  L.text(formatDate(doc.date), ML + 120, L.y, { size: 9 });
  L.text(formatDate(doc.due_date), ML + 190, L.y, { size: 9 });
  L.text(money(doc.totals.payable), PAGE_W - MR - 96, L.y, { size: 9, width: 90, align: 'right' });
  L.y += 20;
  const tw = 260;
  const tx = PAGE_W - MR - tw;
  for (const [l, v] of rowsData) {
    L.text(l, tx, L.y, { size: 9, width: tw - 96 });
    L.text(v, tx + tw - 96, L.y, { size: 9, width: 90, align: 'right' });
    L.y += 15;
  }
  const total = reminder.open_amount + reminder.fee + prevFees;
  p.save().rect(tx - 6, L.y, tw + 6, 21).fill(L.accent).restore();
  L.text('Zu zahlender Betrag', tx, L.y + 6, { size: 10, font: 'Helvetica-Bold', color: '#fff' });
  L.text(money(total), tx + tw - 100, L.y + 6, { size: 10.5, font: 'Helvetica-Bold', color: '#fff', width: 94, align: 'right' });
  L.y += 36;

  L.box([
    `Bitte überweisen Sie ${money(total)} bis zum ${formatDate(reminder.due_date)} auf folgendes Konto:`,
    `${company.account_holder || company.name} · IBAN ${formatIban(company.iban)}${company.bic ? ` · BIC ${company.bic}` : ''}${company.bank_name ? ` · ${company.bank_name}` : ''}`,
    `Verwendungszweck: ${doc.number}`,
  ]);
  if (doc.tax_mode === '13b') L.paragraph(texts.reverse_charge, { size: 8, color: '#666666' });
  L.paragraph('Mit freundlichen Grüßen', { after: 4 });
  L.y += 18;
  L.text(company.owner, ML, L.y, { size: 9.5, font: 'Helvetica-Bold' });
  L.text(company.name, ML, L.y + 13, { size: 8.5, color: '#555555' });
  return L.finish();
}

/** Stream -> Buffer */
function toBuffer(pdf) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdf.on('data', (c) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
}

function fileName(doc, suffix = 'pdf') {
  const t = TYPE_LABEL[doc.type].replace(/[^A-Za-zÄÖÜäöüß]/g, '');
  return `${t}_${(doc.number || 'Entwurf').replace(/[^\w.-]/g, '_')}.${suffix}`;
}

module.exports = { renderDocumentPdf, renderReminderPdf, toBuffer, fileName, logoPath, fill, formatIban, LOGO_FILES };
