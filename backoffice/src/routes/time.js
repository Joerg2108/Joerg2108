'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const csv = require('../lib/csv');
const pdf = require('../lib/pdf');
const sec = require('../lib/security');
const { wrap, id, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('time'));

const lookups = () => ({
  projects: db.all("SELECT id, number, name, customer_id FROM projects WHERE status NOT IN ('abgeschlossen','storniert') ORDER BY name"),
  users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name'),
});

function filters(req) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.von || '') ? req.query.von : f.today().slice(0, 8) + '01';
  const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.bis || '') ? req.query.bis : f.today();
  const where = ['t.date BETWEEN ? AND ?'];
  const params = [from, to];
  const all = sec.can(req.user, 'time.all');
  const userId = all && req.query.user ? Number(req.query.user) : all && req.query.user === undefined ? req.user.id : all ? null : req.user.id;
  if (userId) { where.push('t.user_id = ?'); params.push(userId); }
  if (req.query.projekt) { where.push('t.project_id = ?'); params.push(Number(req.query.projekt)); }
  return { from, to, where: where.join(' AND '), params, userId };
}

function query(fl) {
  return db.all(
    `SELECT t.*, u.name AS user_name, p.name AS project_name, p.number AS project_number FROM time_entries t
     JOIN users u ON u.id = t.user_id LEFT JOIN projects p ON p.id = t.project_id WHERE ${fl.where} ORDER BY t.date DESC, t.id DESC`, ...fl.params,
  );
}

router.get('/', (req, res) => {
  const fl = filters(req);
  const rows = query(fl);
  const sum = rows.reduce((a, r) => a + r.minutes, 0);
  const billable = rows.filter((r) => r.billable).reduce((a, r) => a + r.minutes, 0);
  // Wochenübersicht (Mo–So der aktuellen Woche) für den eigenen Benutzer
  const today = f.today();
  const dow = (new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const monday = f.addDays(today, -dow);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = f.addDays(monday, i);
    week.push({ d, min: db.get('SELECT COALESCE(SUM(minutes),0) AS s FROM time_entries WHERE user_id = ? AND date = ?', req.user.id, d).s });
  }
  res.render('time/index', { title: 'Zeiterfassung', rows, sum, billable, fl, week, today, ...lookups(), canAll: sec.can(req.user, 'time.all') });
});

router.post('/', wrap((req, res) => {
  const d = clean(req.body, ['description', 'date']);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) throw new UserError('Datum fehlt.');
  let minutes = f.parseDuration(req.body.duration);
  if (!minutes && req.body.from && req.body.to) {
    const [h1, m1] = req.body.from.split(':').map(Number);
    const [h2, m2] = req.body.to.split(':').map(Number);
    minutes = h2 * 60 + m2 - (h1 * 60 + m1) - (Number(req.body.pause) || 0);
  }
  if (!minutes || minutes <= 0 || minutes > 24 * 60) throw new UserError('Bitte eine gültige Dauer angeben (z. B. 1:30 oder 1,5).');
  const projectId = Number(req.body.project_id) || null;
  const customerId = projectId ? db.get('SELECT customer_id FROM projects WHERE id = ?', projectId)?.customer_id : null;
  const userId = sec.can(req.user, 'time.all') && req.body.user_id ? Number(req.body.user_id) : req.user.id;
  db.run(
    'INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, started_at, description, billable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    userId, projectId, customerId, d.date, minutes, req.body.from || null, d.description, req.body.billable ? 1 : 0,
  );
  req.flash('success', `${f.minutes(minutes)} erfasst.`);
  res.redirect(req.body.back || '/zeiten');
}));

router.post('/:id/loeschen', wrap((req, res) => {
  const e = db.get('SELECT * FROM time_entries WHERE id = ?', id(req.params.id));
  if (!e) return res.redirect('/zeiten');
  if (e.user_id !== req.user.id && !sec.can(req.user, 'time.all')) throw new UserError('Nur eigene Einträge können gelöscht werden.');
  if (e.invoiced_in) throw new UserError('Eintrag wurde bereits abgerechnet.');
  db.run('DELETE FROM time_entries WHERE id = ?', e.id);
  res.redirect(req.get('referer') || '/zeiten');
}));

// ---------- Stoppuhr ----------
router.post('/timer/start', wrap((req, res) => {
  db.run('DELETE FROM timers WHERE user_id = ?', req.user.id);
  db.run('INSERT INTO timers (user_id, project_id, description, started_at) VALUES (?, ?, ?, ?)', req.user.id, Number(req.body.project_id) || null, req.body.description || null, new Date().toISOString());
  res.redirect(req.get('referer') || '/zeiten');
}));

router.post('/timer/stop', wrap((req, res) => {
  const t = db.get('SELECT * FROM timers WHERE user_id = ?', req.user.id);
  if (!t) return res.redirect('/zeiten');
  const minutes = Math.max(1, Math.round((Date.now() - new Date(t.started_at).getTime()) / 60000));
  const customerId = t.project_id ? db.get('SELECT customer_id FROM projects WHERE id = ?', t.project_id)?.customer_id : null;
  const started = new Date(t.started_at);
  db.tx(() => {
    db.run(
      'INSERT INTO time_entries (user_id, project_id, customer_id, date, minutes, started_at, description, billable) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      req.user.id, t.project_id, customerId, f.localDate(started), minutes,
      started.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }), req.body.description || t.description,
    );
    db.run('DELETE FROM timers WHERE user_id = ?', req.user.id);
  });
  req.flash('success', `Stoppuhr gestoppt: ${f.minutes(minutes)} erfasst.`);
  res.redirect(req.get('referer') || '/zeiten');
}));

// ---------- Exporte ----------
router.get('/export.csv', (req, res) => {
  const fl = filters(req);
  const rows = query(fl);
  res.type('text/csv').attachment(`zeiten-${fl.from}-${fl.to}.csv`).send(csv.stringify(
    ['Datum', 'Mitarbeiter', 'Projekt', 'Beschreibung', 'Minuten', 'Stunden', 'Abrechenbar', 'Abgerechnet'],
    rows.map((r) => [f.date(r.date), r.user_name, r.project_name || '', r.description || '', r.minutes, f.num(r.minutes / 60), r.billable ? 'ja' : 'nein', r.invoiced_in ? 'ja' : 'nein']),
  ));
});

router.get('/nachweis.pdf', wrap(async (req, res) => {
  const fl = filters(req);
  const rows = query(fl).reverse();
  const sum = rows.reduce((a, r) => a + r.minutes, 0);
  const subtitle = `Zeitraum ${f.date(fl.from)} – ${f.date(fl.to)}${fl.userId ? ` · ${rows[0]?.user_name || ''}` : ''}${req.query.projekt ? ` · Projekt ${rows[0]?.project_name || ''}` : ''}`;
  const buf = await pdf.tableReport('Stundennachweis', subtitle, ['Datum', 'Mitarbeiter', 'Projekt', 'Tätigkeit', 'Dauer'],
    [...rows.map((r) => [f.date(r.date), r.user_name, r.project_name || '–', r.description || '', f.minutes(r.minutes)]), { cells: ['', '', '', 'Summe', f.minutes(sum)], bold: true }],
    [14, 18, 22, 36, 10]);
  res.type('application/pdf').set('Content-Disposition', 'inline; filename="Stundennachweis.pdf"').send(buf);
}));

module.exports = router;
