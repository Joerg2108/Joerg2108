'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const viewLib = require('../lib/view');
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
  const counts = Object.fromEntries(db.all('SELECT status, COUNT(*) AS n FROM leads GROUP BY status').map((r) => [r.status, r.n]));
  res.render('leads/index', { title: 'Anfragen', rows, columns, view, stats, counts, STATUSES });
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
  req.flash('success', 'Anfrage erfasst.');
  res.redirect(`/anfragen/${r.lastInsertRowid}`);
}));

router.get('/:id', wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  const activities = db.all('SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE lead_id = ? ORDER BY created_at DESC', l.id);
  const docs = l.customer_id && sec.can(req.user, 'sales')
    ? db.all("SELECT id, kind, number, status, title, issue_date, due_date, gross_total, paid_total FROM documents_sales WHERE customer_id = ? AND kind != 'storno' ORDER BY issue_date DESC, id DESC LIMIT 8", l.customer_id)
    : [];
  const customer = l.customer_id ? db.get('SELECT id, number, company, first_name, last_name FROM customers WHERE id = ?', l.customer_id) : null;
  res.render('leads/show', { title: l.name, l, activities, docs, customer, today: f.today(), STATUSES });
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
  req.flash('success', 'Anfrage gespeichert.');
  res.redirect(`/anfragen/${lid}`);
}));

// Status-Wechsel (Kanban Drag & Drop oder Buttons)
router.post('/:id/status', wrap((req, res) => {
  const lid = id(req.params.id);
  if (!STATUSES.includes(req.body.status)) throw new UserError('Ungültiger Status');
  db.run("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?", req.body.status, lid);
  audit.log(req, 'anfrage.status', 'lead', lid, { status: req.body.status });
  if (req.accepts(['html', 'json']) === 'json') return res.json({ ok: true });
  req.flash('success', `Status geändert: ${viewLib.label(req.body.status)}.`);
  res.redirect(req.get('referer') || `/anfragen/${lid}`);
}));

router.post('/:id/notiz', wrap((req, res) => {
  const lid = id(req.params.id);
  const d = clean(req.body, ['type', 'subject', 'body']);
  if (!d.subject) throw new UserError('Betreff fehlt.');
  db.run('INSERT INTO activities (lead_id, type, subject, body, user_id) VALUES (?, ?, ?, ?, ?)', lid, ['notiz', 'anruf', 'email', 'termin', 'besuch'].includes(d.type) ? d.type : 'notiz', d.subject, d.body, req.user.id);
  const wasNew = db.get('SELECT status FROM leads WHERE id = ?', lid)?.status === 'neu';
  if (wasNew) db.run("UPDATE leads SET status = 'kontaktiert', updated_at = datetime('now') WHERE id = ?", lid);
  req.flash('success', wasNew ? 'Eintrag gespeichert. Status steht jetzt auf „Kontaktiert“.' : 'Eintrag gespeichert.');
  res.redirect(`/anfragen/${lid}`);
}));

// Anfrage -> Kunde (inkl. Historie). Gibt es bereits einen Kunden mit derselben E-Mail-Adresse, wird dieser verknüpft statt doppelt angelegt.
function ensureCustomer(l, userId) {
  if (l.customer_id) return { id: l.customer_id, created: false };
  return db.tx(() => {
    const existing = l.email ? db.get('SELECT id FROM customers WHERE anonymized = 0 AND lower(email) = lower(?)', l.email) : null;
    let cid = existing && existing.id;
    if (!cid) {
      const parts = l.name.trim().split(/\s+/);
      cid = insertCustomer({
        type: l.company ? 'firma' : 'privat', company: l.company, first_name: parts.length > 1 ? parts.slice(0, -1).join(' ') : null,
        last_name: parts[parts.length - 1], email: l.email, phone: l.phone, country: 'DE', status: 'interessent',
        notes: l.message ? `Erstanfrage (${f.date(l.created_at)}): ${l.message}` : null, payment_terms: null, discount_pct: 0, gdpr_consent: l.consent,
      }, userId);
    }
    db.run("UPDATE leads SET customer_id = ?, status = CASE WHEN status IN ('neu','kontaktiert') THEN 'qualifiziert' ELSE status END, updated_at = datetime('now') WHERE id = ?", cid, l.id);
    db.run('UPDATE activities SET customer_id = ? WHERE lead_id = ?', cid, l.id);
    return { id: cid, created: !existing };
  });
}

router.post('/:id/zu-kunde', wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  if (l.customer_id) return res.redirect(`/kunden/${l.customer_id}`);
  const c = ensureCustomer(l, req.user.id);
  audit.log(req, 'anfrage.zu_kunde', 'lead', l.id, { customer_id: c.id });
  req.flash('success', c.created ? 'Kunde aus Anfrage angelegt.' : 'Anfrage mit dem bestehenden Kunden verknüpft.');
  res.redirect(`/kunden/${c.id}`);
}));

// Ein Schritt statt drei: Kunde übernehmen (falls nötig) und direkt das Angebot öffnen – Betreff ist vorbelegt
router.post('/:id/angebot', sec.requirePerm('sales'), wrap((req, res) => {
  const l = db.get('SELECT * FROM leads WHERE id = ?', id(req.params.id));
  if (!l) return notFound(res, 'Anfrage');
  const c = ensureCustomer(l, req.user.id);
  if (c.created) audit.log(req, 'anfrage.zu_kunde', 'lead', l.id, { customer_id: c.id });
  db.run('INSERT INTO activities (lead_id, customer_id, type, subject, user_id) VALUES (?, ?, ?, ?, ?)', l.id, c.id, 'notiz', 'Angebot begonnen', req.user.id);
  res.redirect(`/belege/angebote/neu?kunde=${c.id}&anfrage=${l.id}`);
}));

router.post('/:id/loeschen', wrap((req, res) => {
  const lid = id(req.params.id);
  db.run('DELETE FROM leads WHERE id = ?', lid);
  audit.log(req, 'anfrage.geloescht', 'lead', lid);
  req.flash('success', 'Anfrage gelöscht.');
  res.redirect('/anfragen');
}));

module.exports = router;
