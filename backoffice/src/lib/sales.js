'use strict';
const db = require('../db');
const settings = require('./settings');
const numbering = require('./numbering');
const f = require('./format');
const { UserError } = require('./route');

const KIND_LABELS = { angebot: 'Angebot', auftrag: 'Auftragsbestätigung', rechnung: 'Rechnung', storno: 'Stornorechnung' };
const STATUS = {
  angebot: ['entwurf', 'versendet', 'angenommen', 'abgelehnt', 'abgelaufen'],
  auftrag: ['entwurf', 'versendet', 'in_bearbeitung', 'abgeschlossen'],
  rechnung: ['entwurf', 'offen', 'teilbezahlt', 'bezahlt', 'storniert'],
  storno: ['entwurf', 'offen', 'erledigt'],
};
const STATUS_LABELS = {
  entwurf: 'Entwurf', versendet: 'Versendet', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt', abgelaufen: 'Abgelaufen',
  in_bearbeitung: 'In Bearbeitung', abgeschlossen: 'Abgeschlossen', offen: 'Offen', teilbezahlt: 'Teilbezahlt',
  bezahlt: 'Bezahlt', storniert: 'Storniert', erledigt: 'Erledigt', ueberfaellig: 'Überfällig',
};

// Positionen berechnen: Netto je Position, USt gruppiert je Steuersatz (Rundung je Satz – wie in DATEV üblich)
function calcItems(items, { smallBusiness = false } = {}) {
  const groups = new Map();
  let net = 0;
  const out = items.map((it, i) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const disc = Number(it.discount_pct) || 0;
    const lineNet = Math.round(qty * price * (1 - disc / 100));
    const rate = smallBusiness ? 0 : Number(it.tax_rate) || 0;
    net += lineNet;
    groups.set(rate, (groups.get(rate) || 0) + lineNet);
    return { ...it, position: i + 1, quantity: qty, unit_price: price, discount_pct: disc, tax_rate: rate, net_amount: lineNet };
  });
  const taxes = [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([rate, base]) => ({ rate, base, tax: Math.round(base * rate / 100) }));
  const tax = taxes.reduce((s, t) => s + t.tax, 0);
  return { items: out, net, tax, gross: net + tax, taxes };
}

// Formular -> Positionen (Arrays aus name[]/quantity[]/…)
function itemsFromForm(body) {
  const arr = (k) => (Array.isArray(body[k]) ? body[k] : body[k] !== undefined ? [body[k]] : []);
  const names = arr('item_name');
  const items = [];
  names.forEach((name, i) => {
    if (!String(name || '').trim()) return;
    items.push({
      product_id: Number(arr('item_product_id')[i]) || null,
      name: String(name).trim(),
      description: String(arr('item_description')[i] || '').trim(),
      quantity: f.parseNumber(arr('item_quantity')[i], 1),
      unit: String(arr('item_unit')[i] || 'Stk.').trim() || 'Stk.',
      unit_price: f.parseMoney(arr('item_price')[i]),
      discount_pct: f.parseNumber(arr('item_discount')[i], 0),
      tax_rate: f.parseNumber(arr('item_tax')[i], Number(settings.get('default_tax_rate')) || 19),
    });
  });
  return items;
}

function snapshotCustomer(customerId) {
  const c = db.get('SELECT * FROM customers WHERE id = ?', customerId);
  if (!c) throw new UserError('Kunde nicht gefunden');
  const contact = [c.salutation, c.first_name, c.last_name].filter(Boolean).join(' ');
  return {
    number: c.number, name: f.customerName(c), contact: c.company ? contact : '', salutation: c.salutation, last_name: c.last_name, street: c.street, zip: c.zip,
    city: c.city, country: c.country, vat_id: c.vat_id, email: c.email, leitweg_id: c.leitweg_id,
  };
}

function load(id) {
  const doc = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
  if (!doc) return null;
  doc.items = db.all('SELECT * FROM document_items WHERE document_id = ? ORDER BY position', id);
  doc.customer = db.get('SELECT * FROM customers WHERE id = ?', doc.customer_id);
  doc.snapshot = doc.customer_snapshot ? JSON.parse(doc.customer_snapshot) : snapshotCustomer(doc.customer_id);
  doc.payments = db.all('SELECT p.*, u.name AS user_name FROM payments p LEFT JOIN users u ON u.id = p.created_by WHERE document_id = ? ORDER BY paid_at', id);
  doc.dunnings = db.all('SELECT * FROM dunnings WHERE document_id = ? ORDER BY level', id);
  doc.calc = calcItems(doc.items, { smallBusiness: !!doc.small_business });
  doc.open_amount = doc.gross_total - doc.paid_total;
  doc.overdue = doc.kind === 'rechnung' && ['offen', 'teilbezahlt'].includes(doc.status) && doc.due_date && doc.due_date < f.today();
  return doc;
}

function save({ id, kind, data, items, userId }) {
  // Fehlende optionale Felder -> null (SQLite kann undefined nicht binden)
  const FIELDS = ['project_id', 'ref_id', 'title', 'intro', 'footer', 'service_date', 'service_until', 'due_date', 'valid_until'];
  data = { ...data };
  for (const k of FIELDS) if (data[k] === undefined) data[k] = null;
  userId = userId ?? null;
  const smallBusiness = settings.get('small_business') === '1';
  const calc = calcItems(items, { smallBusiness });
  return db.tx(() => {
    if (id) {
      const existing = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
      if (!existing) throw new UserError('Beleg nicht gefunden');
      if (existing.finalized_at && ['rechnung', 'storno'].includes(existing.kind)) throw new UserError('Festgeschriebene Rechnungen können nicht bearbeitet werden. Erstelle eine Stornorechnung.');
      db.run(
        `UPDATE documents_sales SET customer_id=?, project_id=?, title=?, intro=?, footer=?, issue_date=?, service_date=?, service_until=?,
         due_date=?, valid_until=?, net_total=?, tax_total=?, gross_total=?, small_business=?, reverse_charge=?, updated_at=datetime('now') WHERE id=?`,
        data.customer_id, data.project_id || null, data.title, data.intro, data.footer, data.issue_date, data.service_date || null,
        data.service_until || null, data.due_date || null, data.valid_until || null, calc.net, calc.tax, calc.gross,
        smallBusiness ? 1 : 0, data.reverse_charge ? 1 : 0, id,
      );
      db.run('DELETE FROM document_items WHERE document_id = ?', id);
    } else {
      // Angebote/AB bekommen sofort eine Nummer; Rechnungen erst beim Festschreiben (lückenlos!)
      const number = ['angebot', 'auftrag'].includes(kind) ? numbering.next(kind, data.issue_date) : null;
      const r = db.run(
        `INSERT INTO documents_sales (kind, number, customer_id, project_id, ref_id, status, title, intro, footer, issue_date, service_date,
         service_until, due_date, valid_until, net_total, tax_total, gross_total, small_business, reverse_charge, created_by)
         VALUES (?, ?, ?, ?, ?, 'entwurf', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        kind, number, data.customer_id, data.project_id || null, data.ref_id || null, data.title, data.intro, data.footer,
        data.issue_date, data.service_date || null, data.service_until || null, data.due_date || null, data.valid_until || null,
        calc.net, calc.tax, calc.gross, smallBusiness ? 1 : 0, data.reverse_charge ? 1 : 0, userId,
      );
      id = Number(r.lastInsertRowid);
    }
    for (const it of calc.items) {
      db.run(
        `INSERT INTO document_items (document_id, position, product_id, name, description, quantity, unit, unit_price, discount_pct, tax_rate, net_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, it.position, it.product_id || null, it.name, it.description || null, it.quantity, it.unit, it.unit_price, it.discount_pct, it.tax_rate, it.net_amount,
      );
    }
    return id;
  });
}

// Festschreiben (GoBD): Nummer vergeben, Kundendaten einfrieren, danach unveränderlich
function finalize(id) {
  return db.tx(() => {
    const doc = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
    if (!doc) throw new UserError('Beleg nicht gefunden');
    if (doc.finalized_at) return doc.number;
    const count = db.get('SELECT COUNT(*) AS n FROM document_items WHERE document_id = ?', id).n;
    if (!count) throw new UserError('Der Beleg hat keine Positionen.');
    if (doc.kind === 'rechnung' && !doc.service_date) throw new UserError('Leistungsdatum fehlt (Pflichtangabe nach § 14 Abs. 4 UStG).');
    const number = doc.number || numbering.next(doc.kind, doc.issue_date);
    const snap = JSON.stringify(snapshotCustomer(doc.customer_id));
    const status = ['rechnung', 'storno'].includes(doc.kind) ? 'offen' : 'versendet';
    db.run("UPDATE documents_sales SET number=?, customer_snapshot=?, status=?, finalized_at=datetime('now'), updated_at=datetime('now') WHERE id=?", number, snap, status, id);
    if (doc.kind === 'storno' && doc.ref_id) {
      db.run("UPDATE documents_sales SET status='storniert', updated_at=datetime('now') WHERE id=?", doc.ref_id);
      db.run("UPDATE documents_sales SET status='erledigt' WHERE id=?", id);
    }
    return number;
  });
}

function refreshPaymentStatus(id) {
  const doc = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
  const paid = db.get('SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE document_id = ?', id).s;
  let status = doc.status;
  if (doc.status !== 'storniert' && doc.kind === 'rechnung') {
    status = paid <= 0 ? 'offen' : paid >= doc.gross_total ? 'bezahlt' : 'teilbezahlt';
  }
  db.run("UPDATE documents_sales SET paid_total=?, status=?, updated_at=datetime('now') WHERE id=?", paid, status, id);
}

function addPayment(id, { amount, paid_at, method, note }, userId) {
  const doc = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
  if (!doc || doc.kind !== 'rechnung' || !doc.finalized_at) throw new UserError('Zahlungen nur auf festgeschriebene Rechnungen möglich.');
  if (doc.status === 'storniert') throw new UserError('Rechnung ist storniert.');
  if (!amount) throw new UserError('Betrag fehlt.');
  return db.tx(() => {
    db.run('INSERT INTO payments (document_id, amount, paid_at, method, note, created_by) VALUES (?, ?, ?, ?, ?, ?)', id, amount, paid_at || f.today(), method || 'ueberweisung', note || null, userId);
    refreshPaymentStatus(id);
  });
}

function deletePayment(paymentId) {
  const p = db.get('SELECT * FROM payments WHERE id = ?', paymentId);
  if (!p) return null;
  db.tx(() => {
    db.run('DELETE FROM payments WHERE id = ?', paymentId);
    refreshPaymentStatus(p.document_id);
  });
  return p.document_id;
}

// Stornorechnung mit negativen Beträgen erzeugen (Original bleibt unverändert erhalten)
function createStorno(id, userId) {
  const doc = load(id);
  if (!doc || doc.kind !== 'rechnung' || !doc.finalized_at) throw new UserError('Nur festgeschriebene Rechnungen können storniert werden.');
  if (doc.status === 'storniert') throw new UserError('Rechnung ist bereits storniert.');
  if (doc.paid_total > 0) throw new UserError('Auf diese Rechnung sind Zahlungen gebucht. Bitte zuerst Zahlungen entfernen oder Gutschrift erstellen.');
  return db.tx(() => {
    const newId = save({
      kind: 'storno', userId,
      data: {
        customer_id: doc.customer_id, project_id: doc.project_id, ref_id: doc.id,
        title: `Stornorechnung zu Rechnung ${doc.number}`,
        intro: `Hiermit stornieren wir die Rechnung ${doc.number} vom ${f.date(doc.issue_date)} vollständig.`,
        footer: '', issue_date: f.today(), service_date: doc.service_date, service_until: doc.service_until,
      },
      items: doc.items.map((it) => ({ ...it, quantity: -it.quantity })),
    });
    finalize(newId);
    return newId;
  });
}

// Angebot -> Auftragsbestätigung / Rechnung, Auftrag -> Rechnung
function convert(id, targetKind, userId) {
  const doc = load(id);
  if (!doc) throw new UserError('Beleg nicht gefunden');
  const s = settings.all();
  const issue = f.today();
  const intro = targetKind === 'rechnung' ? s.invoice_intro : s.order_intro;
  const newId = save({
    kind: targetKind, userId,
    data: {
      customer_id: doc.customer_id, project_id: doc.project_id, ref_id: doc.id,
      title: doc.title, intro, footer: targetKind === 'rechnung' ? s.invoice_footer : '',
      issue_date: issue, service_date: targetKind === 'rechnung' ? issue : null,
      due_date: targetKind === 'rechnung' ? f.addDays(issue, doc.customer?.payment_terms ?? Number(s.payment_terms_days)) : null,
    },
    items: doc.items,
  });
  if (doc.kind === 'angebot') db.run("UPDATE documents_sales SET status='angenommen', updated_at=datetime('now') WHERE id=?", id);
  return newId;
}

function duplicate(id, userId) {
  const doc = load(id);
  const issue = f.today();
  const s = settings.all();
  return save({
    kind: doc.kind === 'storno' ? 'rechnung' : doc.kind, userId,
    data: {
      customer_id: doc.customer_id, project_id: doc.project_id, title: doc.title, intro: doc.intro, footer: doc.footer,
      issue_date: issue, service_date: doc.kind === 'rechnung' ? issue : null,
      due_date: doc.kind === 'rechnung' ? f.addDays(issue, Number(s.payment_terms_days)) : null,
      valid_until: doc.kind === 'angebot' ? f.addDays(issue, Number(s.quote_valid_days)) : null,
    },
    items: doc.items,
  });
}

function createDunning(id, userId) {
  const doc = load(id);
  if (!doc || doc.kind !== 'rechnung' || !['offen', 'teilbezahlt'].includes(doc.status)) throw new UserError('Nur offene Rechnungen können gemahnt werden.');
  const level = Math.min((doc.dunning_level || 0) + 1, 3);
  if (doc.dunning_level >= 3) throw new UserError('Höchste Mahnstufe (3) bereits erreicht.');
  const fee = f.parseMoney(settings.get(`dunning_fee_${level}`));
  const due = f.addDays(f.today(), Number(settings.get('dunning_days')) || 7);
  db.tx(() => {
    db.run('INSERT INTO dunnings (document_id, level, fee, due_date, created_by) VALUES (?, ?, ?, ?, ?)', id, level, fee, due, userId);
    db.run("UPDATE documents_sales SET dunning_level=?, last_dunning_at=datetime('now') WHERE id=?", level, id);
  });
  return level;
}

function remove(id) {
  const doc = db.get('SELECT * FROM documents_sales WHERE id = ?', id);
  if (!doc) return;
  if (doc.finalized_at && ['rechnung', 'storno'].includes(doc.kind)) throw new UserError('Festgeschriebene Rechnungen dürfen nicht gelöscht werden (GoBD).');
  db.tx(() => {
    db.run('UPDATE documents_sales SET ref_id = NULL WHERE ref_id = ?', id);
    db.run('UPDATE time_entries SET invoiced_in = NULL WHERE invoiced_in = ?', id);
    db.run('DELETE FROM recurring_invoices WHERE template_id = ?', id);
    db.run('DELETE FROM documents_sales WHERE id = ?', id);
  });
}

// Wiederkehrende Rechnungen erzeugen (läuft beim Start und stündlich)
function runRecurring(now = f.today()) {
  const created = [];
  const due = db.all("SELECT * FROM recurring_invoices WHERE active = 1 AND next_date <= ? AND (end_date IS NULL OR end_date = '' OR next_date <= end_date)", now);
  const step = { monatlich: 1, quartalsweise: 3, halbjaehrlich: 6, jaehrlich: 12 };
  for (const r of due) {
    const tpl = load(r.template_id);
    if (!tpl) continue;
    const s = settings.all();
    const issue = r.next_date;
    const newId = save({
      kind: 'rechnung', userId: tpl.created_by,
      data: {
        customer_id: tpl.customer_id, project_id: tpl.project_id, title: tpl.title, intro: tpl.intro, footer: tpl.footer,
        issue_date: issue, service_date: issue, service_until: f.addDays(f.addMonths(issue, step[r.interval]), -1),
        due_date: f.addDays(issue, tpl.customer?.payment_terms ?? Number(s.payment_terms_days)),
      },
      items: tpl.items,
    });
    if (r.auto_finalize) finalize(newId);
    db.run("UPDATE recurring_invoices SET next_date=?, last_run_at=datetime('now') WHERE id=?", f.addMonths(r.next_date, step[r.interval]), r.id);
    created.push(newId);
  }
  return created;
}

function fillPlaceholders(text, doc) {
  const s = settings.all();
  return String(text || '')
    .replaceAll('{DUE_DATE}', f.date(doc.due_date))
    .replaceAll('{VALID_UNTIL}', f.date(doc.valid_until))
    .replaceAll('{NUMBER}', doc.number || '')
    .replaceAll('{AMOUNT}', f.eur(doc.gross_total))
    .replaceAll('{NAME}', doc.snapshot?.contact || doc.snapshot?.name || '')
    .replaceAll('{COMPANY}', s.company_name);
}

module.exports = {
  KIND_LABELS, STATUS, STATUS_LABELS, calcItems, itemsFromForm, snapshotCustomer, load, save, finalize, addPayment,
  deletePayment, createStorno, convert, duplicate, createDunning, remove, runRecurring, fillPlaceholders, refreshPaymentStatus,
};
