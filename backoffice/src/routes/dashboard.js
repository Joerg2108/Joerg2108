'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const sec = require('../lib/security');

const router = express.Router();

router.get('/', (req, res) => {
  const today = f.today();
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);
  const kpi = {
    revenueMonth: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND substr(issue_date,1,7) = ?", month).s,
    revenueYear: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND substr(issue_date,1,4) = ?", year).s,
    open: db.get("SELECT COALESCE(SUM(gross_total - paid_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='rechnung' AND status IN ('offen','teilbezahlt')"),
    overdue: db.get("SELECT COALESCE(SUM(gross_total - paid_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='rechnung' AND status IN ('offen','teilbezahlt') AND due_date < ?", today),
    expensesYear: db.get('SELECT COALESCE(SUM(net_amount),0) AS s FROM expenses WHERE substr(date,1,4) = ?', year).s,
    quotesOpen: db.get("SELECT COALESCE(SUM(net_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='angebot' AND status IN ('entwurf','versendet')"),
    leadsNew: db.get("SELECT COUNT(*) AS n FROM leads WHERE status='neu'").n,
    pipeline: db.get("SELECT COALESCE(SUM(value),0) AS s FROM leads WHERE status IN ('neu','kontaktiert','qualifiziert')").s,
    hoursMonth: db.get('SELECT COALESCE(SUM(minutes),0) AS s FROM time_entries WHERE substr(date,1,7) = ? AND user_id = ?', month, req.user.id).s,
    customers: db.get("SELECT COUNT(*) AS n FROM customers WHERE status != 'inaktiv' AND anonymized = 0").n,
  };

  // Umsatz vs. Ausgaben der letzten 12 Monate
  const months = [];
  for (let i = 11; i >= 0; i--) months.push(f.addMonths(month + '-15', -i).slice(0, 7));
  const rev = Object.fromEntries(db.all(
    "SELECT substr(issue_date,1,7) AS m, SUM(net_total) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND issue_date >= ? GROUP BY m", months[0] + '-01',
  ).map((r) => [r.m, r.s]));
  const exp = Object.fromEntries(db.all('SELECT substr(date,1,7) AS m, SUM(net_amount) AS s FROM expenses WHERE date >= ? GROUP BY m', months[0] + '-01').map((r) => [r.m, r.s]));
  const chart = months.map((m) => ({ m, label: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][Number(m.slice(5)) - 1], revenue: rev[m] || 0, expenses: exp[m] || 0 }));

  const tasks = db.all(
    `SELECT t.*, p.name AS project_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.status != 'erledigt' AND (t.assigned_to = ? OR t.assigned_to IS NULL)
     ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date, CASE t.priority WHEN 'dringend' THEN 0 WHEN 'hoch' THEN 1 ELSE 2 END LIMIT 8`, req.user.id,
  );
  const appointments = db.all(
    `SELECT a.*, c.company, c.first_name, c.last_name FROM appointments a LEFT JOIN customers c ON c.id = a.customer_id
     WHERE a.starts_at >= ? AND a.starts_at < ? ORDER BY a.starts_at LIMIT 8`, today, f.addDays(today, 7) + 'T99',
  );
  const leads = db.all("SELECT * FROM leads WHERE status = 'neu' ORDER BY created_at DESC LIMIT 5");
  const overdueList = sec.can(req.user, 'sales')
    ? db.all(
      `SELECT d.*, c.company, c.first_name, c.last_name FROM documents_sales d JOIN customers c ON c.id = d.customer_id
       WHERE d.kind='rechnung' AND d.status IN ('offen','teilbezahlt') AND d.due_date < ? ORDER BY d.due_date LIMIT 6`, today,
    )
    : [];
  res.render('dashboard', { title: 'Dashboard', kpi, chart, tasks, appointments, leads, overdueList, today });
});

// Globale Suche über alle Bereiche
router.get('/suche', (req, res) => {
  const term = String(req.query.q || '').trim();
  const results = [];
  if (term.length >= 2) {
    const like = `%${term}%`;
    for (const c of db.all("SELECT * FROM customers WHERE anonymized = 0 AND (company LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR number LIKE ? OR city LIKE ? OR phone LIKE ?) LIMIT 15", like, like, like, like, like, like, like)) {
      results.push({ type: 'Kunde', title: f.customerName(c), sub: [c.number, c.email, c.city].filter(Boolean).join(' · '), url: `/kunden/${c.id}` });
    }
    if (sec.can(req.user, 'sales')) {
      for (const d of db.all('SELECT d.*, c.company, c.first_name, c.last_name FROM documents_sales d JOIN customers c ON c.id = d.customer_id WHERE d.number LIKE ? OR d.title LIKE ? OR c.company LIKE ? OR c.last_name LIKE ? ORDER BY d.issue_date DESC LIMIT 15', like, like, like, like)) {
        results.push({ type: { angebot: 'Angebot', auftrag: 'Auftrag', rechnung: 'Rechnung', storno: 'Storno' }[d.kind], title: `${d.number || 'Entwurf'} – ${f.customerName(d)}`, sub: `${f.date(d.issue_date)} · ${f.eur(d.gross_total)}`, url: `/belege/${d.id}` });
      }
    }
    for (const p of db.all('SELECT * FROM projects WHERE name LIKE ? OR number LIKE ? LIMIT 10', like, like)) results.push({ type: 'Projekt', title: p.name, sub: p.number, url: `/projekte/${p.id}` });
    for (const l of db.all('SELECT * FROM leads WHERE name LIKE ? OR company LIKE ? OR email LIKE ? OR subject LIKE ? LIMIT 10', like, like, like, like)) results.push({ type: 'Anfrage', title: l.name, sub: l.subject || l.email, url: `/anfragen/${l.id}` });
    for (const t of db.all('SELECT * FROM tasks WHERE title LIKE ? LIMIT 10', like)) results.push({ type: 'Aufgabe', title: t.title, sub: t.status, url: `/aufgaben/${t.id}/bearbeiten` });
    for (const x of db.all('SELECT * FROM files WHERE original_name LIKE ? LIMIT 10', like)) results.push({ type: 'Datei', title: x.original_name, sub: x.folder, url: `/dateien/${x.id}/download` });
  }
  if (req.query.format === 'json') return res.json(results.slice(0, 12));
  res.render('search', { title: 'Suche', term, results });
});

router.get('/benachrichtigungen', (req, res) => {
  const items = db.all('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 100', req.user.id);
  res.render('notifications', { title: 'Benachrichtigungen', items });
});

router.post('/benachrichtigungen/gelesen', (req, res) => {
  db.run('UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL', req.user.id);
  res.redirect('/benachrichtigungen');
});

module.exports = router;
