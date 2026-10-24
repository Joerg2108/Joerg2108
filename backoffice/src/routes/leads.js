'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { insertCustomer } = require('./customers');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('leads'));

const STATUSES = ['neu', 'kontaktiert', 'qualifiziert', 'gewonnen', 'verloren'];

router.get('/', (req, res) => {
  const view = req.query.ansicht === 'liste' ? 'liste' : 'board';
  const where = [];
  const params = [];
  if (req.query.q) {
    where.push('(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ? OR l.subject LIKE ?)');
    params.push(...Array(4).fill(`%${req.query.q}%`));
  }
  if (req.query.status) { where.push('l.status = ?'); params.push(req.query.status); }
  const rows = db.all(
    `SELECT l.*, u.name AS assignee FROM leads l LEFT JOIN users u ON u.id = l.assigned_to ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY l.created_at DESC LIMIT 500`, ...params,
  );
  const columns = STATUSES.map((s) => ({ status: s, items: rows.filter((r) => r.status === s), sum: rows.filter((r) => r.status === s).reduce((a, r) => a + r.value, 0) }));
  const stats = db.get("SELECT COUNT(*) AS total, SUM(status='gewonnen') AS won, SUM(status='verloren') AS lost FROM leads");
  stats.rate = stats.won + stats.lost ? Math.round((stats.won / (stats.won + stats.lost)) * 100) : 0;
  res.render('leads/index', { title: 'Anfragen & Vertrieb', rows, columns, view, stats, STATUSES });
});

router.get('/neu', (req, res) => {
  res.render('leads/form', { title: 'Neue Anfrage', l: { source: 'telefon', status: 'neu' }, users: db.all('SELECT id, name FROM users WHERE active = 1') });
});

function fromBody(body) {
  const d = clean(body, ['name', 'company', 'email', 'phone', 'subject', 'message', 'source']);
  if (!d.name) throw new UserError('Name fehlt.');
  d.status = STATUSES.includes(body.status) ? body.status : 'neu';
  d.value = f.parseMoney(body.value);
  d.assigned_to = Number(body.assigned_to) || null;
  return d;
}

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run(
    'INSERT INTO leads (name, company, email, phone, subject, message, source, status, value, assigned_to, consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
    d.name, d.company, d.email, d.phone, d.subject, d.message, d.source || 'manuell', d.status, d.value, d.assigned_to,
  );
  audit.log(req, 'anfrage.angelegt', 'lead', Number(r.lastInsertRowid));
  res.redirect(`/anfragen/${r.lastInsertRowid}`);
}));

router.get('/:id', wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  const activities = db.all('SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE lead_id = ? ORDER BY created_at DESC', l.id);
  res.render('leads/show', { title: l.name, l, activities, STATUSES, users: db.all('SELECT id, name FROM users WHERE active = 1') });
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  res.render('leads/form', { title: 'Anfrage bearbeiten', l, users: db.all('SELECT id, name FROM users WHERE active = 1') });
}));

router.post('/:id', wrap((req, res) => {
  const lid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(
    "UPDATE leads SET name=?, company=?, email=?, phone=?, subject=?, message=?, source=?, status=?, value=?, assigned_to=?, updated_at=datetime('now') WHERE id=?",
    d.name, d.company, d.email, d.phone, d.subject, d.message, d.source || 'manuell', d.status, d.value, d.assigned_to, lid,
  );
  res.redirect(`/anfragen/${lid}`);
}));

// Status-Wechsel (Kanban Drag & Drop oder Buttons)
router.post('/:id/status', wrap((req, res) => {
  const lid = id(req.params.id);
  if (!STATUSES.includes(req.body.status)) throw new UserError('Ungültiger Status');
  db.run("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?", req.body.status, lid);
  audit.log(req, 'anfrage.status', 'lead', lid, { status: req.body.status });
  if (req.accepts(['html', 'json']) === 'json') return res.json({ ok: true });
  res.redirect(req.get('referer') || `/anfragen/${lid}`);
}));

router.post('/:id/notiz', wrap((req, res) => {
  const lid = id(req.params.id);
  const d = clean(req.body, ['type', 'subject', 'body']);
  if (!d.subject) throw new UserError('Betreff fehlt.');
  db.run('INSERT INTO activities (lead_id, type, subject, body, user_id) VALUES (?, ?, ?, ?, ?)', lid, ['notiz', 'anruf', 'email', 'termin', 'besuch'].includes(d.type) ? d.type : 'notiz', d.subject, d.body, req.user.id);
  if (db.get('SELECT status FROM leads WHERE id = ?', lid)?.status === 'neu') db.run("UPDATE leads SET status = 'kontaktiert' WHERE id = ?", lid);
  res.redirect(`/anfragen/${lid}`);
}));

// Anfrage -> Kunde übernehmen (inkl. Historie)
router.post('/:id/zu-kunde', wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  if (l.customer_id) return res.redirect(`/kunden/${l.customer_id}`);
  const parts = l.name.trim().split(/\s+/);
  const cid = db.tx(() => {
    const newId = insertCustomer({
      type: l.company ? 'firma' : 'privat', company: l.company, first_name: parts.length > 1 ? parts.slice(0, -1).join(' ') : null,
      last_name: parts[parts.length - 1], email: l.email, phone: l.phone, country: 'DE', status: 'interessent',
      notes: l.message ? `Erstanfrage (${f.date(l.created_at)}): ${l.message}` : null, payment_terms: null, discount_pct: 0, gdpr_consent: l.consent,
    }, req.user.id);
    db.run("UPDATE leads SET customer_id = ?, status = CASE WHEN status IN ('neu','kontaktiert') THEN 'qualifiziert' ELSE status END, updated_at = datetime('now') WHERE id = ?", newId, l.id);
    db.run('UPDATE activities SET customer_id = ? WHERE lead_id = ?', newId, l.id);
    return newId;
  });
  audit.log(req, 'anfrage.zu_kunde', 'lead', l.id, { customer_id: cid });
  req.flash('success', 'Kunde aus Anfrage angelegt.');
  res.redirect(`/kunden/${cid}`);
}));

router.post('/:id/loeschen', wrap((req, res) => {
  const lid = id(req.params.id);
  db.run('DELETE FROM leads WHERE id = ?', lid);
  audit.log(req, 'anfrage.geloescht', 'lead', lid);
  req.flash('success', 'Anfrage gelöscht.');
  res.redirect('/anfragen');
}));

module.exports = router;
