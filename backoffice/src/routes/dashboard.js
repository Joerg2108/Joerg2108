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
    open: db.get("SELECT COALESCE(SUM(gross_total - paid_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='rechnung' AND status IN ('offen','teilbezahlt')"),
    overdue: db.get("SELECT COALESCE(SUM(gross_total - paid_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='rechnung' AND status IN ('offen','teilbezahlt') AND due_date < ?", today),
    quotesOpen: db.get("SELECT COALESCE(SUM(net_total),0) AS s, COUNT(*) AS n FROM documents_sales WHERE kind='angebot' AND status IN ('entwurf','versendet')"),
    leadsNew: db.get("SELECT COUNT(*) AS n FROM leads WHERE status='neu'").n,
  };

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
  const shiftsLib = require('../lib/shifts');
  const staffMe = db.get('SELECT id FROM staff WHERE user_id = ?', req.user.id);
  const myShifts = staffMe ? db.all("SELECT * FROM shifts WHERE staff_id = ? AND ends_at >= ? AND status != 'abgesagt' ORDER BY starts_at LIMIT 5", staffMe.id, today) : [];
  const roster = sec.can(req.user, 'shifts') ? {
    open: db.get("SELECT COUNT(*) AS n FROM shifts WHERE staff_id IS NULL AND status != 'abgesagt' AND starts_at >= ? AND starts_at < ?", today, f.addDays(today, 14)).n,
    expiring: shiftsLib.expiringQualifications(30),
  } : null;
  // „Heute zu tun“: nur Einträge, aus denen sich direkt eine Handlung ergibt – in Reihenfolge der Dringlichkeit
  const todo = [];
  const cust = 'c.company, c.first_name, c.last_name';
  if (sec.can(req.user, 'sales')) {
    for (const d of overdueList) {
      const days = Math.max(1, Math.round((Date.parse(today) - Date.parse(d.due_date)) / 864e5));
      todo.push({ tone: 'red', kind: 'Rechnung überfällig', title: `${d.number} · ${f.customerName(d)}`, sub: `seit ${days} Tag${days === 1 ? '' : 'en'} fällig${d.dunning_level ? ' · Mahnstufe ' + d.dunning_level : ' · noch nicht gemahnt'}`, amount: d.gross_total - d.paid_total, href: `/belege/${d.id}`, action: d.dunning_level < 3 ? 'Mahnen' : 'Ansehen' });
    }
  }
  if (sec.can(req.user, 'leads')) {
    for (const l of leads) todo.push({ tone: 'blue', kind: 'Neue Anfrage', title: [l.name, l.company].filter(Boolean).join(' · '), sub: l.subject || 'ohne Betreff', amount: l.value || null, href: `/anfragen/${l.id}`, action: 'Beantworten' });
  }
  if (sec.can(req.user, 'sales')) {
    const docs = (where, ...params) => db.all(`SELECT d.*, ${cust} FROM documents_sales d JOIN customers c ON c.id = d.customer_id WHERE ${where} ORDER BY d.issue_date LIMIT 5`, ...params);
    for (const d of docs("d.kind='angebot' AND d.status='angenommen' AND NOT EXISTS (SELECT 1 FROM documents_sales x WHERE x.ref_id = d.id)")) {
      todo.push({ tone: 'green', kind: 'Angebot angenommen', title: `${d.number} · ${f.customerName(d)}`, sub: 'noch nicht abgerechnet', amount: d.gross_total, href: `/belege/${d.id}`, action: 'Rechnung erstellen' });
    }
    for (const d of docs("d.kind='rechnung' AND d.status='entwurf' AND NOT EXISTS (SELECT 1 FROM recurring_invoices r WHERE r.template_id = d.id)")) {
      todo.push({ tone: 'amber', kind: 'Rechnung im Entwurf', title: `${f.customerName(d)} · ${d.title || 'ohne Titel'}`, sub: 'noch nicht festgeschrieben und versendet', amount: d.gross_total, href: `/belege/${d.id}`, action: 'Fertigstellen' });
    }
    for (const d of docs("d.kind='angebot' AND d.status='versendet' AND d.issue_date <= ?", f.addDays(today, -5))) {
      todo.push({ tone: 'amber', kind: 'Angebot ohne Antwort', title: `${d.number} · ${f.customerName(d)}`, sub: `versendet am ${f.date(d.issue_date)}${d.valid_until ? ' · gültig bis ' + f.date(d.valid_until) : ''}`, amount: d.gross_total, href: `/belege/${d.id}`, action: 'Nachfassen' });
    }
    for (const d of docs("d.kind='angebot' AND d.status='entwurf'")) {
      todo.push({ tone: 'grey', kind: 'Angebot im Entwurf', title: `${f.customerName(d)} · ${d.title || 'ohne Titel'}`, sub: 'noch nicht versendet', amount: d.gross_total, href: `/belege/${d.id}`, action: 'Senden' });
    }
  }
  res.render('dashboard', { title: 'Übersicht', kpi, todo, tasks, appointments, today, myShifts, roster });
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
