'use strict';
const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const config = require('../config');
const sec = require('../lib/security');
const settings = require('../lib/settings');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('calendar'));

const COLORS = { blau: 'Blau', gruen: 'Grün', rot: 'Rot', orange: 'Orange', lila: 'Lila', grau: 'Grau' };
const isDT = (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v || '');

function fromBody(b) {
  const d = clean(b, ['title', 'description', 'location']);
  if (!d.title) throw new UserError('Titel fehlt.');
  d.all_day = b.all_day ? 1 : 0;
  d.starts_at = d.all_day ? `${String(b.starts_at).slice(0, 10)}T00:00` : b.starts_at;
  d.ends_at = d.all_day ? `${String(b.ends_at || b.starts_at).slice(0, 10)}T23:59` : b.ends_at;
  if (!isDT(d.starts_at) || !isDT(d.ends_at)) throw new UserError('Beginn und Ende müssen angegeben werden.');
  if (d.ends_at < d.starts_at) throw new UserError('Ende liegt vor dem Beginn.');
  d.customer_id = Number(b.customer_id) || null;
  d.project_id = Number(b.project_id) || null;
  d.user_id = Number(b.user_id) || null;
  d.color = COLORS[b.color] ? b.color : 'blau';
  return d;
}

const lookups = () => ({
  users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name'),
  customers: db.all('SELECT id, company, first_name, last_name FROM customers WHERE anonymized = 0 ORDER BY COALESCE(company, last_name) COLLATE NOCASE'),
  projects: db.all("SELECT id, name FROM projects WHERE status NOT IN ('abgeschlossen','storniert') ORDER BY name"),
  COLORS,
});

router.get('/', (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.monat || '') ? req.query.monat : f.today().slice(0, 7);
  const first = `${month}-01`;
  const startDow = (new Date(first + 'T12:00:00Z').getUTCDay() + 6) % 7; // Montag = 0
  const gridStart = f.addDays(first, -startDow);
  const days = [];
  for (let i = 0; i < 42; i++) days.push(f.addDays(gridStart, i));
  const where = ['a.starts_at <= ? AND a.ends_at >= ?'];
  const params = [days[41] + 'T23:59', days[0]];
  if (req.query.user) { where.push('a.user_id = ?'); params.push(Number(req.query.user)); }
  const events = db.all(
    `SELECT a.*, u.name AS user_name FROM appointments a LEFT JOIN users u ON u.id = a.user_id WHERE ${where.join(' AND ')} ORDER BY a.starts_at`, ...params,
  );
  const tasks = db.all("SELECT id, title, due_date, priority FROM tasks WHERE status != 'erledigt' AND due_date BETWEEN ? AND ?", days[0], days[41]);
  const invoicesDue = sec.can(req.user, 'sales')
    ? db.all("SELECT id, number, due_date FROM documents_sales WHERE kind = 'rechnung' AND status IN ('offen','teilbezahlt') AND due_date BETWEEN ? AND ?", days[0], days[41])
    : [];
  const byDay = Object.fromEntries(days.map((d) => [d, []]));
  for (const e of events) for (const d of days) if (e.starts_at.slice(0, 10) <= d && e.ends_at.slice(0, 10) >= d) byDay[d].push({ ...e, type: 'termin' });
  for (const t of tasks) byDay[t.due_date]?.push({ id: t.id, title: t.title, type: 'aufgabe', priority: t.priority });
  for (const i of invoicesDue) byDay[i.due_date]?.push({ id: i.id, title: `Fällig: ${i.number}`, type: 'rechnung' });
  const prev = f.addMonths(first, -1).slice(0, 7);
  const next = f.addMonths(first, 1).slice(0, 7);
  const me = db.get('SELECT id FROM users WHERE id = ?', req.user.id);
  const feedToken = icalToken(me.id);
  res.render('calendar/index', { title: 'Kalender', month, days, byDay, prev, next, today: f.today(), users: lookups().users, feedUrl: `${config.baseUrl}/api/kalender/${me.id}/${feedToken}.ics` });
});

function icalToken(userId) {
  return crypto.createHmac('sha256', config.sessionSecret).update(`ical:${userId}`).digest('hex').slice(0, 32);
}

router.get('/neu', (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.datum || '') ? req.query.datum : f.today();
  res.render('calendar/form', { title: 'Neuer Termin', a: { starts_at: `${date}T09:00`, ends_at: `${date}T10:00`, user_id: req.user.id, color: 'blau', customer_id: Number(req.query.kunde) || '' }, ...lookups() });
});

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  db.run(
    'INSERT INTO appointments (title, description, location, starts_at, ends_at, all_day, customer_id, project_id, user_id, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    d.title, d.description, d.location, d.starts_at, d.ends_at, d.all_day, d.customer_id, d.project_id, d.user_id, d.color,
  );
  res.redirect(`/kalender?monat=${d.starts_at.slice(0, 7)}`);
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const a = db.get('SELECT * FROM appointments WHERE id = ?', id(req.params.id));
  if (!a) return notFound(res, 'Termin');
  res.render('calendar/form', { title: 'Termin bearbeiten', a, ...lookups() });
}));

router.post('/:id', wrap((req, res) => {
  const aid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(
    'UPDATE appointments SET title=?, description=?, location=?, starts_at=?, ends_at=?, all_day=?, customer_id=?, project_id=?, user_id=?, color=? WHERE id=?',
    d.title, d.description, d.location, d.starts_at, d.ends_at, d.all_day, d.customer_id, d.project_id, d.user_id, d.color, aid,
  );
  res.redirect(`/kalender?monat=${d.starts_at.slice(0, 7)}`);
}));

router.post('/:id/loeschen', wrap((req, res) => {
  db.run('DELETE FROM appointments WHERE id = ?', id(req.params.id));
  res.redirect('/kalender');
}));

// iCal-Feed (für Outlook, Google Kalender, Apple Kalender) – öffentlich über geheimen Token
function icsFeed(userId) {
  const esc = (s) => String(s || '').replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
  const dt = (s) => s.replace(/[-:]/g, '').slice(0, 13) + '00';
  const events = db.all("SELECT * FROM appointments WHERE (user_id = ? OR user_id IS NULL) AND starts_at >= date('now','-90 days') ORDER BY starts_at", userId);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${settings.get('company_name')}//Back Office//DE`, 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(settings.get('app_title'))}`, 'X-WR-TIMEZONE:Europe/Berlin'];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:appointment-${e.id}@backoffice`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`);
    if (e.all_day) lines.push(`DTSTART;VALUE=DATE:${e.starts_at.slice(0, 10).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${f.addDays(e.ends_at.slice(0, 10), 1).replace(/-/g, '')}`);
    else lines.push(`DTSTART;TZID=Europe/Berlin:${dt(e.starts_at)}`, `DTEND;TZID=Europe/Berlin:${dt(e.ends_at)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

module.exports = router;
module.exports.icalToken = icalToken;
module.exports.icsFeed = icsFeed;
