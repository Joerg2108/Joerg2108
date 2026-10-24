'use strict';
const express = require('express');
const db = require('../db');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('tasks'));

const STATUSES = ['offen', 'in_arbeit', 'wartet', 'erledigt'];
const PRIORITIES = ['niedrig', 'normal', 'hoch', 'dringend'];

function fromBody(b) {
  const d = clean(b, ['title', 'description', 'due_date']);
  if (!d.title) throw new UserError('Titel fehlt.');
  d.status = STATUSES.includes(b.status) ? b.status : 'offen';
  d.priority = PRIORITIES.includes(b.priority) ? b.priority : 'normal';
  d.project_id = Number(b.project_id) || null;
  d.customer_id = Number(b.customer_id) || null;
  d.assigned_to = Number(b.assigned_to) || null;
  return d;
}

const lookups = () => ({
  users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name'),
  projects: db.all("SELECT id, number, name FROM projects WHERE status NOT IN ('abgeschlossen','storniert') ORDER BY name"),
  customers: db.all('SELECT id, company, first_name, last_name FROM customers WHERE anonymized = 0 ORDER BY COALESCE(company, last_name) COLLATE NOCASE'),
});

function notify(userId, title, link) {
  if (userId) db.run('INSERT INTO notifications (user_id, title, link) VALUES (?, ?, ?)', userId, title, link);
}

router.get('/', (req, res) => {
  const where = [];
  const params = [];
  const mine = req.query.filter !== 'alle';
  if (mine) { where.push('(t.assigned_to = ? OR t.created_by = ?)'); params.push(req.user.id, req.user.id); }
  if (req.query.projekt) { where.push('t.project_id = ?'); params.push(Number(req.query.projekt)); }
  if (req.query.q) { where.push('t.title LIKE ?'); params.push(`%${req.query.q}%`); }
  if (req.query.erledigt !== '1') where.push("(t.status != 'erledigt' OR t.completed_at >= datetime('now','-7 days'))");
  const rows = db.all(
    `SELECT t.*, u.name AS assignee, p.name AS project_name, c.company, c.first_name, c.last_name FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN customers c ON c.id = t.customer_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE t.priority WHEN 'dringend' THEN 0 WHEN 'hoch' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.due_date IS NULL, t.due_date`, ...params,
  );
  const columns = STATUSES.map((s) => ({ status: s, items: rows.filter((r) => r.status === s) }));
  res.render('tasks/index', { title: 'Aufgaben', columns, mine, STATUSES });
});

router.get('/neu', (req, res) => res.render('tasks/form', {
  title: 'Neue Aufgabe', t: { status: 'offen', priority: 'normal', assigned_to: req.user.id, project_id: Number(req.query.projekt) || '', customer_id: Number(req.query.kunde) || '' }, ...lookups(), STATUSES, PRIORITIES,
}));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run(
    'INSERT INTO tasks (title, description, status, priority, due_date, project_id, customer_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    d.title, d.description, d.status, d.priority, d.due_date, d.project_id, d.customer_id, d.assigned_to, req.user.id,
  );
  if (d.assigned_to && d.assigned_to !== req.user.id) notify(d.assigned_to, `Neue Aufgabe von ${req.user.name}: ${d.title}`, `/aufgaben/${r.lastInsertRowid}/bearbeiten`);
  audit.log(req, 'aufgabe.angelegt', 'task', Number(r.lastInsertRowid));
  res.redirect(req.body.back || (d.project_id ? `/projekte/${d.project_id}` : '/aufgaben'));
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const t = db.get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return notFound(res, 'Aufgabe');
  res.render('tasks/form', { title: 'Aufgabe bearbeiten', t, ...lookups(), STATUSES, PRIORITIES });
}));

router.post('/:id', wrap((req, res) => {
  const tid = id(req.params.id);
  const old = db.get('SELECT * FROM tasks WHERE id = ?', tid);
  const d = fromBody(req.body);
  db.run(
    `UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, project_id=?, customer_id=?, assigned_to=?,
     completed_at = CASE WHEN ? = 'erledigt' THEN COALESCE(completed_at, datetime('now')) ELSE NULL END, updated_at=datetime('now') WHERE id=?`,
    d.title, d.description, d.status, d.priority, d.due_date, d.project_id, d.customer_id, d.assigned_to, d.status, tid,
  );
  if (d.assigned_to && d.assigned_to !== old.assigned_to && d.assigned_to !== req.user.id) notify(d.assigned_to, `Aufgabe zugewiesen: ${d.title}`, `/aufgaben/${tid}/bearbeiten`);
  res.redirect('/aufgaben');
}));

router.post('/:id/status', wrap((req, res) => {
  const tid = id(req.params.id);
  const status = STATUSES.includes(req.body.status) ? req.body.status : 'erledigt';
  db.run("UPDATE tasks SET status = ?, completed_at = CASE WHEN ? = 'erledigt' THEN datetime('now') ELSE NULL END, updated_at = datetime('now') WHERE id = ?", status, status, tid);
  if (req.accepts(['html', 'json']) === 'json') return res.json({ ok: true });
  res.redirect(req.get('referer') || '/aufgaben');
}));

router.post('/:id/loeschen', wrap((req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', id(req.params.id));
  res.redirect(req.get('referer') || '/aufgaben');
}));

module.exports = router;
