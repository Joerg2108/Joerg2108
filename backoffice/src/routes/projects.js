'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const numbering = require('../lib/numbering');
const sales = require('../lib/sales');
const settings = require('../lib/settings');
const sec = require('../lib/security');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('projects'));

const STATUSES = ['geplant', 'aktiv', 'pausiert', 'abgeschlossen', 'storniert'];

function fromBody(b) {
  const d = clean(b, ['name', 'description', 'start_date', 'end_date']);
  if (!d.name) throw new UserError('Projektname fehlt.');
  d.customer_id = Number(b.customer_id) || null;
  d.manager_id = Number(b.manager_id) || null;
  d.status = STATUSES.includes(b.status) ? b.status : 'geplant';
  d.budget = f.parseMoney(b.budget);
  d.hourly_rate = f.parseMoney(b.hourly_rate);
  return d;
}

const lookups = () => ({
  customers: db.all('SELECT id, number, company, first_name, last_name FROM customers WHERE anonymized = 0 ORDER BY COALESCE(company, last_name) COLLATE NOCASE'),
  users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name'),
});

router.get('/', (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status) { where.push('p.status = ?'); params.push(req.query.status); } else where.push("p.status NOT IN ('abgeschlossen','storniert')");
  if (req.query.q) { where.push('(p.name LIKE ? OR p.number LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const rows = db.all(
    `SELECT p.*, c.company, c.first_name, c.last_name, u.name AS manager,
       (SELECT COALESCE(SUM(minutes),0) FROM time_entries t WHERE t.project_id = p.id) AS minutes,
       (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'erledigt') AS open_tasks,
       (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS all_tasks,
       (SELECT COALESCE(SUM(net_total),0) FROM documents_sales d WHERE d.project_id = p.id AND d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL) AS invoiced
     FROM projects p LEFT JOIN customers c ON c.id = p.customer_id LEFT JOIN users u ON u.id = p.manager_id
     WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC`, ...params,
  );
  res.render('projects/index', { title: 'Projekte', rows, STATUSES });
});

router.get('/neu', (req, res) => res.render('projects/form', { title: 'Neues Projekt', p: { status: 'aktiv', customer_id: Number(req.query.kunde) || '', manager_id: req.user.id, hourly_rate: 0 }, ...lookups(), STATUSES }));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const number = numbering.next('project');
  const r = db.run(
    'INSERT INTO projects (number, name, customer_id, status, description, start_date, end_date, budget, hourly_rate, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    number, d.name, d.customer_id, d.status, d.description, d.start_date, d.end_date, d.budget, d.hourly_rate, d.manager_id,
  );
  audit.log(req, 'projekt.angelegt', 'project', Number(r.lastInsertRowid));
  res.redirect(`/projekte/${r.lastInsertRowid}`);
}));

router.get('/:id', wrap((req, res) => {
  const p = db.get('SELECT p.*, u.name AS manager FROM projects p LEFT JOIN users u ON u.id = p.manager_id WHERE p.id = ?', id(req.params.id));
  if (!p) return notFound(res, 'Projekt');
  const customer = p.customer_id ? db.get('SELECT * FROM customers WHERE id = ?', p.customer_id) : null;
  const tasks = db.all('SELECT t.*, u.name AS assignee FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to WHERE project_id = ? ORDER BY status = \'erledigt\', due_date', p.id);
  const times = db.all('SELECT t.*, u.name AS user_name, u.hourly_rate AS user_rate FROM time_entries t JOIN users u ON u.id = t.user_id WHERE project_id = ? ORDER BY date DESC LIMIT 100', p.id);
  const totals = db.get('SELECT COALESCE(SUM(minutes),0) AS all_min, COALESCE(SUM(CASE WHEN billable = 1 AND invoiced_in IS NULL THEN minutes END),0) AS open_min FROM time_entries WHERE project_id = ?', p.id);
  const docs = sec.can(req.user, 'sales') ? db.all('SELECT * FROM documents_sales WHERE project_id = ? ORDER BY issue_date DESC', p.id) : [];
  const expenses = db.get('SELECT COALESCE(SUM(net_amount),0) AS s FROM expenses WHERE project_id = ?', p.id).s;
  const invoiced = docs.filter((d) => ['rechnung', 'storno'].includes(d.kind) && d.finalized_at).reduce((a, d) => a + d.net_total, 0);
  const files = db.all('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC', p.id);
  res.render('projects/show', { title: p.name, p, customer, tasks, times, totals, docs, expenses, invoiced, files, users: lookups().users });
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const p = db.get('SELECT * FROM projects WHERE id = ?', id(req.params.id));
  if (!p) return notFound(res, 'Projekt');
  res.render('projects/form', { title: 'Projekt bearbeiten', p, ...lookups(), STATUSES });
}));

router.post('/:id', wrap((req, res) => {
  const pid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(
    "UPDATE projects SET name=?, customer_id=?, status=?, description=?, start_date=?, end_date=?, budget=?, hourly_rate=?, manager_id=?, updated_at=datetime('now') WHERE id=?",
    d.name, d.customer_id, d.status, d.description, d.start_date, d.end_date, d.budget, d.hourly_rate, d.manager_id, pid,
  );
  audit.log(req, 'projekt.geaendert', 'project', pid);
  res.redirect(`/projekte/${pid}`);
}));

router.post('/:id/loeschen', wrap((req, res) => {
  const pid = id(req.params.id);
  if (db.get("SELECT COUNT(*) AS n FROM documents_sales WHERE project_id = ? AND finalized_at IS NOT NULL AND kind IN ('rechnung','storno')", pid).n) {
    throw new UserError('Projekt hat festgeschriebene Rechnungen – bitte stattdessen abschließen.');
  }
  db.run('DELETE FROM projects WHERE id = ?', pid);
  audit.log(req, 'projekt.geloescht', 'project', pid);
  res.redirect('/projekte');
}));

// Offene, abrechenbare Zeiten in eine Rechnung übernehmen
router.post('/:id/abrechnen', sec.requirePerm('sales'), wrap((req, res) => {
  const p = db.get('SELECT * FROM projects WHERE id = ?', id(req.params.id));
  if (!p || !p.customer_id) throw new UserError('Projekt braucht einen Kunden, um abgerechnet zu werden.');
  const entries = db.all('SELECT t.*, u.name AS user_name, u.hourly_rate AS user_rate FROM time_entries t JOIN users u ON u.id = t.user_id WHERE project_id = ? AND billable = 1 AND invoiced_in IS NULL ORDER BY date', p.id);
  if (!entries.length) throw new UserError('Keine offenen abrechenbaren Zeiten vorhanden.');
  const s = settings.all();
  const grouped = req.body.mode === 'einzeln' ? entries.map((e) => [e]) : [entries];
  const items = grouped.map((group) => {
    const minutes = group.reduce((a, e) => a + e.minutes, 0);
    const rate = p.hourly_rate || group[0].user_rate || 0;
    const first = group[0].date;
    const last = group[group.length - 1].date;
    return {
      name: group.length === 1 ? (group[0].description || 'Arbeitszeit') : `Arbeitszeit Projekt ${p.number}`,
      description: group.length === 1 ? `${f.date(first)} · ${group[0].user_name}` : `Zeitraum ${f.date(first)} – ${f.date(last)}, ${group.length} Einträge`,
      quantity: Math.round((minutes / 60) * 100) / 100, unit: 'Std.', unit_price: rate, tax_rate: Number(s.default_tax_rate), discount_pct: 0,
    };
  });
  const today = f.today();
  const docId = db.tx(() => {
    const newId = sales.save({
      kind: 'rechnung', userId: req.user.id, items,
      data: {
        customer_id: p.customer_id, project_id: p.id, title: `Rechnung Projekt ${p.name}`, intro: s.invoice_intro, footer: s.invoice_footer,
        issue_date: today, service_date: entries[0].date, service_until: entries[entries.length - 1].date !== entries[0].date ? entries[entries.length - 1].date : null,
        due_date: f.addDays(today, Number(s.payment_terms_days)),
      },
    });
    for (const e of entries) db.run('UPDATE time_entries SET invoiced_in = ? WHERE id = ?', newId, e.id);
    return newId;
  });
  audit.log(req, 'projekt.abgerechnet', 'project', p.id, { document: docId, entries: entries.length });
  req.flash('success', `${entries.length} Zeiteinträge in Rechnungsentwurf übernommen.`);
  res.redirect(`/belege/${docId}/bearbeiten`);
}));

module.exports = router;
