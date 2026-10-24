'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const csv = require('../lib/csv');
const audit = require('../lib/audit');
const settings = require('../lib/settings');
const sec = require('../lib/security');
const files = require('./files');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('expenses'));

const lookups = () => ({
  suppliers: db.all('SELECT * FROM suppliers ORDER BY name'),
  projects: db.all("SELECT id, name FROM projects WHERE status NOT IN ('storniert') ORDER BY name"),
  categories: settings.get('expense_categories').split(',').map((s) => s.trim()).filter(Boolean),
});

function fromBody(b) {
  const d = clean(b, ['date', 'supplier_name', 'category', 'description', 'receipt_no', 'paid_at']);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) throw new UserError('Belegdatum fehlt.');
  d.tax_rate = f.parseNumber(b.tax_rate, 19);
  // Eingabe wahlweise brutto oder netto
  if (b.amount_mode === 'netto') {
    d.net_amount = f.parseMoney(b.amount);
    d.tax_amount = Math.round(d.net_amount * d.tax_rate / 100);
    d.gross_amount = d.net_amount + d.tax_amount;
  } else {
    d.gross_amount = f.parseMoney(b.amount);
    d.net_amount = Math.round(d.gross_amount / (1 + d.tax_rate / 100));
    d.tax_amount = d.gross_amount - d.net_amount;
  }
  if (!d.gross_amount) throw new UserError('Betrag fehlt.');
  d.supplier_id = Number(b.supplier_id) || null;
  if (d.supplier_id && !d.supplier_name) d.supplier_name = db.get('SELECT name FROM suppliers WHERE id = ?', d.supplier_id)?.name;
  d.project_id = Number(b.project_id) || null;
  d.paid = b.paid ? 1 : 0;
  d.category = d.category || 'Sonstiges';
  return d;
}

router.get('/', (req, res) => {
  const year = /^\d{4}$/.test(req.query.jahr || '') ? req.query.jahr : f.today().slice(0, 4);
  const where = ['substr(e.date,1,4) = ?'];
  const params = [year];
  if (req.query.kategorie) { where.push('e.category = ?'); params.push(req.query.kategorie); }
  if (req.query.q) { where.push('(e.supplier_name LIKE ? OR e.description LIKE ? OR e.receipt_no LIKE ?)'); params.push(...Array(3).fill(`%${req.query.q}%`)); }
  const rows = db.all(`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE ${where.join(' AND ')} ORDER BY e.date DESC, e.id DESC`, ...params);
  const byCat = db.all(`SELECT category, SUM(net_amount) AS net, SUM(tax_amount) AS tax, COUNT(*) AS n FROM expenses e WHERE ${where.join(' AND ')} GROUP BY category ORDER BY net DESC`, ...params);
  const sums = rows.reduce((a, r) => ({ net: a.net + r.net_amount, tax: a.tax + r.tax_amount, gross: a.gross + r.gross_amount }), { net: 0, tax: 0, gross: 0 });
  res.render('expenses/index', { title: 'Ausgaben', rows, byCat, sums, year, ...lookups() });
});

router.get('/neu', (req, res) => res.render('expenses/form', { title: 'Neue Ausgabe', e: { date: f.today(), tax_rate: 19, paid: 1, category: 'Sonstiges' }, ...lookups() }));

// Formular mit optionalem Belegupload (multipart); CSRF-Token kommt über die URL
router.post('/', (req, res, next) => files.upload.single('receipt')(req, res, (err) => {
  if (err) { req.flash('error', err.message); return res.redirect('/ausgaben/neu'); }
  wrap((rq, rs) => {
    const d = fromBody(rq.body);
    const fileId = rq.file ? files.store(rq.file, { folder: 'Belege', project_id: d.project_id }, rq.user.id) : null;
    const r = db.run(
      `INSERT INTO expenses (date, supplier_id, supplier_name, category, description, receipt_no, net_amount, tax_rate, tax_amount, gross_amount, paid, paid_at, project_id, file_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      d.date, d.supplier_id, d.supplier_name, d.category, d.description, d.receipt_no, d.net_amount, d.tax_rate, d.tax_amount, d.gross_amount, d.paid, d.paid_at, d.project_id, fileId, rq.user.id,
    );
    audit.log(rq, 'ausgabe.angelegt', 'expense', Number(r.lastInsertRowid));
    rq.flash('success', 'Ausgabe gespeichert.');
    rs.redirect(rq.body.again ? '/ausgaben/neu' : '/ausgaben');
  })(req, res, next);
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const e = db.get('SELECT * FROM expenses WHERE id = ?', id(req.params.id));
  if (!e) return notFound(res, 'Ausgabe');
  res.render('expenses/form', { title: 'Ausgabe bearbeiten', e, ...lookups() });
}));

router.post('/:id(\\d+)', (req, res, next) => files.upload.single('receipt')(req, res, (err) => {
  if (err) { req.flash('error', err.message); return res.redirect(req.get('referer')); }
  wrap((rq, rs) => {
    const eid = id(rq.params.id);
    const d = fromBody(rq.body);
    const fileId = rq.file ? files.store(rq.file, { folder: 'Belege', project_id: d.project_id }, rq.user.id) : null;
    db.run(
      `UPDATE expenses SET date=?, supplier_id=?, supplier_name=?, category=?, description=?, receipt_no=?, net_amount=?, tax_rate=?, tax_amount=?, gross_amount=?,
       paid=?, paid_at=?, project_id=?, file_id=COALESCE(?, file_id) WHERE id=?`,
      d.date, d.supplier_id, d.supplier_name, d.category, d.description, d.receipt_no, d.net_amount, d.tax_rate, d.tax_amount, d.gross_amount, d.paid, d.paid_at, d.project_id, fileId, eid,
    );
    audit.log(rq, 'ausgabe.geaendert', 'expense', eid);
    rs.redirect('/ausgaben');
  })(req, res, next);
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const eid = id(req.params.id);
  db.run('DELETE FROM expenses WHERE id = ?', eid);
  audit.log(req, 'ausgabe.geloescht', 'expense', eid);
  res.redirect('/ausgaben');
}));

router.get('/export.csv', (req, res) => {
  const year = /^\d{4}$/.test(req.query.jahr || '') ? req.query.jahr : f.today().slice(0, 4);
  const rows = db.all('SELECT * FROM expenses WHERE substr(date,1,4) = ? ORDER BY date', year);
  res.type('text/csv').attachment(`ausgaben-${year}.csv`).send(csv.stringify(
    ['Datum', 'Lieferant', 'Kategorie', 'Beschreibung', 'Belegnr.', 'Netto', 'USt-Satz', 'USt', 'Brutto', 'Bezahlt'],
    rows.map((r) => [f.date(r.date), r.supplier_name, r.category, r.description, r.receipt_no, f.moneyInput(r.net_amount), r.tax_rate, f.moneyInput(r.tax_amount), f.moneyInput(r.gross_amount), r.paid ? 'ja' : 'nein']),
  ));
});

// ---------- Lieferanten ----------
router.get('/lieferanten', (req, res) => {
  const rows = db.all('SELECT s.*, (SELECT COALESCE(SUM(net_amount),0) FROM expenses e WHERE e.supplier_id = s.id) AS total FROM suppliers s ORDER BY name');
  res.render('expenses/suppliers', { title: 'Lieferanten', rows });
});

router.post('/lieferanten', wrap((req, res) => {
  const d = clean(req.body, ['name', 'email', 'phone', 'iban', 'notes']);
  if (!d.name) throw new UserError('Name fehlt.');
  db.run('INSERT INTO suppliers (name, email, phone, iban, notes) VALUES (?, ?, ?, ?, ?)', d.name, d.email, d.phone, d.iban, d.notes);
  res.redirect('/ausgaben/lieferanten');
}));

router.post('/lieferanten/:id/loeschen', wrap((req, res) => {
  db.run('DELETE FROM suppliers WHERE id = ?', id(req.params.id));
  res.redirect('/ausgaben/lieferanten');
}));

module.exports = router;
