'use strict';
const express = require('express');
const path = require('node:path');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const numbering = require('../lib/numbering');
const patrol = require('../lib/patrol');
const { wrap, UserError } = require('../lib/route');

const router = express.Router();

const CATEGORIES = {
  diebstahl: 'Diebstahl', sachbeschaedigung: 'Sachbeschädigung', ruhestoerung: 'Ruhestörung', hausverbot: 'Hausverbot',
  koerperverletzung: 'Körperverletzung', brand: 'Brand', notfall: 'Medizinischer Notfall', defekt: 'Technischer Defekt', sonstiges: 'Sonstiges',
};

// Statische PWA-Dateien (ohne Login, nicht vertraulich)
router.get('/manifest.webmanifest', (req, res) => res.type('application/manifest+json').send(JSON.stringify({
  name: 'Wächter-App', short_name: 'Wächter', start_url: '/waechter', scope: '/waechter/', display: 'standalone',
  background_color: '#0b1120', theme_color: '#0f172a', lang: 'de',
  icons: [{ src: '/static/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
})));
router.get('/sw.js', (req, res) => res.type('application/javascript').sendFile(path.join(__dirname, '..', '..', 'public', 'js', 'waechter-sw.js')));

router.use(sec.requirePerm('guard'));

function objectList() {
  return db.all("SELECT id, name FROM objects WHERE status = 'aktiv' ORDER BY name");
}
function myStaffId(req) {
  const s = db.get('SELECT id FROM staff WHERE user_id = ?', req.user.id);
  return s ? s.id : null;
}
function render(res, view, locals = {}) {
  res.render(`waechter/${view}`, { ...locals, layout: 'layout-waechter' });
}

router.get('/', (req, res) => {
  const timer = db.get('SELECT * FROM timers WHERE user_id = ?', req.user.id);
  const running = patrol.runningForUser(req.user.id);
  if (running) running.object_name = running.object_id ? (db.get('SELECT name FROM objects WHERE id = ?', running.object_id) || {}).name : null;
  const staffId = myStaffId(req);
  const shifts = staffId ? db.all(
    "SELECT * FROM shifts WHERE staff_id = ? AND ends_at >= datetime('now') AND status != 'abgesagt' ORDER BY starts_at LIMIT 5", staffId) : [];
  render(res, 'home', { title: 'Wächter', timer, running, shifts, objects: objectList() });
});

// ---- Stempeln (Timer) ----
router.post('/stempel/start', wrap((req, res) => {
  const obj = db.get('SELECT name FROM objects WHERE id = ?', Number(req.body.object_id) || 0);
  db.run('DELETE FROM timers WHERE user_id = ?', req.user.id);
  db.run('INSERT INTO timers (user_id, description, started_at) VALUES (?, ?, ?)', req.user.id, obj ? `Dienst – ${obj.name}` : 'Dienst', new Date().toISOString());
  res.redirect('/waechter');
}));

router.post('/stempel/stop', wrap((req, res) => {
  const t = db.get('SELECT * FROM timers WHERE user_id = ?', req.user.id);
  if (t) {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(t.started_at).getTime()) / 60000));
    db.run('INSERT INTO time_entries (user_id, date, minutes, started_at, description, billable) VALUES (?, ?, ?, ?, ?, 1)',
      req.user.id, t.started_at.slice(0, 10), minutes, t.started_at, t.description || 'Dienst');
    db.run('DELETE FROM timers WHERE user_id = ?', req.user.id);
  }
  res.redirect('/waechter');
}));

// ---- Streife / Wachbuch ----
router.get('/streife', (req, res) => {
  const p = patrol.runningForUser(req.user.id);
  if (p) {
    p.object_name = p.object_id ? (db.get('SELECT name FROM objects WHERE id = ?', p.object_id) || {}).name : null;
    p.logs = db.all('SELECT * FROM patrol_log WHERE patrol_id = ? ORDER BY at DESC, id DESC', p.id);
  }
  render(res, 'streife', { title: 'Streife', p, objects: objectList() });
});

router.post('/streife/start', wrap((req, res) => {
  if (patrol.runningForUser(req.user.id)) return res.redirect('/waechter/streife');
  const pid = patrol.start({ objectId: Number(req.body.object_id) || null, staffId: myStaffId(req), userId: req.user.id });
  audit.log(req, 'streife.gestartet', 'patrols', pid);
  res.redirect('/waechter/streife');
}));

router.post('/streife/log', wrap((req, res) => {
  const p = patrol.runningForUser(req.user.id);
  if (!p) throw new UserError('Keine laufende Streife.');
  const kind = req.body.kind;
  if ((kind === 'kontrollpunkt' || kind === 'vorkommnis' || kind === 'notiz') && !String(req.body.text || '').trim()) throw new UserError('Bitte einen Text eingeben.');
  patrol.addLog(p.id, kind, String(req.body.text || '').trim());
  res.redirect('/waechter/streife');
}));

router.post('/streife/beenden', wrap((req, res) => {
  const p = patrol.runningForUser(req.user.id);
  if (p) { patrol.endPatrol(p.id); audit.log(req, 'streife.beendet', 'patrols', p.id); req.flash('success', 'Streife beendet.'); }
  res.redirect('/waechter');
}));

// ---- Vorfall melden ----
router.get('/vorfall', (req, res) => render(res, 'vorfall', { title: 'Vorfall melden', objects: objectList(), CATEGORIES }));

router.post('/vorfall', wrap((req, res) => {
  const description = String(req.body.description || '').trim();
  if (!description) throw new UserError('Bitte beschreiben, was passiert ist.');
  const number = numbering.seq('VF-{YYYY}-', 4);
  const p = patrol.runningForUser(req.user.id);
  db.run(
    `INSERT INTO incidents (number, object_id, staff_id, user_id, patrol_id, occurred_at, category, severity, description, measures, police, status)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, 'offen')`,
    number, Number(req.body.object_id) || null, myStaffId(req), req.user.id, p ? p.id : null,
    CATEGORIES[req.body.category] ? req.body.category : 'sonstiges',
    ['niedrig', 'mittel', 'hoch'].includes(req.body.severity) ? req.body.severity : 'mittel',
    description, String(req.body.measures || '').trim() || null, req.body.police ? 1 : 0);
  audit.log(req, 'vorfall.gemeldet', 'incidents', null, { number });
  req.flash('success', `Vorfall ${number} gemeldet. Die Einsatzleitung ist informiert.`);
  res.redirect('/waechter');
}));

// ---- Meine Schichten ----
router.get('/schichten', (req, res) => {
  const staffId = myStaffId(req);
  const shifts = staffId ? db.all(
    "SELECT * FROM shifts WHERE staff_id = ? AND ends_at >= datetime('now', '-1 day') AND status != 'abgesagt' ORDER BY starts_at LIMIT 30", staffId) : [];
  render(res, 'schichten', { title: 'Meine Schichten', shifts, hasStaff: !!staffId });
});

module.exports = router;
