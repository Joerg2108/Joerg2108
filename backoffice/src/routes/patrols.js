'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const patrol = require('../lib/patrol');
const pdf = require('../lib/pdf');
const { wrap, id, notFound, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('patrols.view'));

const STATUS_LABEL = { laeuft: 'läuft', ob: 'o.B.', vorfall: 'Vorfall', abgebrochen: 'Abgebrochen' };

const SELECT = `SELECT p.*, o.name AS object_name, s.first_name, s.last_name,
  (SELECT COUNT(*) FROM patrol_log l WHERE l.patrol_id = p.id) AS entries
  FROM patrols p LEFT JOIN objects o ON o.id = p.object_id LEFT JOIN staff s ON s.id = p.staff_id`;

router.get('/', (req, res) => {
  const running = db.all(`${SELECT} WHERE p.status = 'laeuft' ORDER BY p.started_at DESC`);
  const recent = db.all(`${SELECT} WHERE p.status != 'laeuft' ORDER BY p.started_at DESC LIMIT 60`);
  res.render('patrols/index', { title: 'Streife / Wachbuch', running, recent });
});

router.get('/neu', sec.requirePerm('patrols'), (req, res) => res.render('patrols/new', {
  title: 'Streife starten',
  objects: db.all("SELECT id, name FROM objects WHERE status = 'aktiv' ORDER BY name"),
  staff: db.all('SELECT id, first_name, last_name FROM staff WHERE active = 1 ORDER BY last_name'),
}));

router.post('/', sec.requirePerm('patrols'), wrap((req, res) => {
  const pid = patrol.start({ objectId: Number(req.body.object_id) || null, staffId: Number(req.body.staff_id) || null, userId: req.user.id });
  audit.log(req, 'streife.gestartet', 'patrols', pid);
  res.redirect(`/streife/${pid}`);
}));

router.get('/:id(\\d+)', wrap((req, res) => {
  const p = db.get(`${SELECT} WHERE p.id = ?`, id(req.params.id));
  if (!p) return notFound(res, 'Streife');
  const logs = db.all('SELECT * FROM patrol_log WHERE patrol_id = ? ORDER BY at DESC, id DESC', p.id);
  const incidents = db.all('SELECT id, number, category, status FROM incidents WHERE patrol_id = ? ORDER BY occurred_at DESC', p.id);
  res.render('patrols/show', { title: `Streife ${p.object_name || ''}`.trim(), p, logs, incidents, LOG_KINDS: patrol.LOG_KINDS, canManage: sec.can(req.user, 'patrols') });
}));

router.get('/:id(\\d+)/pdf', wrap(async (req, res) => {
  const p = db.get(`${SELECT} WHERE p.id = ?`, id(req.params.id));
  if (!p) return notFound(res, 'Streife');
  const logs = db.all('SELECT * FROM patrol_log WHERE patrol_id = ? ORDER BY at, id', p.id)
    .map((l) => ({ ...l, kind_label: patrol.LOG_KINDS[l.kind] || l.kind }));
  const buf = await pdf.patrolReport({
    object_name: p.object_name, staff_name: [p.last_name, p.first_name].filter(Boolean).join(', '),
    started_at: p.started_at, ended_at: p.ended_at, rounds: p.rounds,
    status_label: STATUS_LABEL[p.status] || p.status, summary: p.summary, logs,
  });
  res.type('application/pdf').set('Content-Disposition', `inline; filename="Wachbuch_${p.id}.pdf"`).send(buf);
}));

router.post('/:id(\\d+)/log', wrap((req, res) => {
  const p = db.get("SELECT * FROM patrols WHERE id = ?", id(req.params.id));
  if (!p) return notFound(res, 'Streife');
  if (p.status !== 'laeuft') throw new UserError('Streife ist bereits beendet.');
  const kind = req.body.kind;
  if ((kind === 'kontrollpunkt' || kind === 'vorkommnis' || kind === 'notiz') && !String(req.body.text || '').trim()) throw new UserError('Bitte einen Text eingeben.');
  patrol.addLog(p.id, kind, String(req.body.text || '').trim());
  res.redirect(`/streife/${p.id}`);
}));

router.post('/:id(\\d+)/beenden', wrap((req, res) => {
  const p = db.get('SELECT * FROM patrols WHERE id = ?', id(req.params.id));
  if (!p) return notFound(res, 'Streife');
  if (p.status !== 'laeuft') return res.redirect(`/streife/${p.id}`);
  patrol.endPatrol(p.id);
  audit.log(req, 'streife.beendet', 'patrols', p.id);
  req.flash('success', 'Streife beendet.');
  res.redirect(`/streife/${p.id}`);
}));

router.post('/:id(\\d+)/loeschen', sec.requirePerm('patrols'), wrap((req, res) => {
  const pid = id(req.params.id);
  db.run('DELETE FROM patrols WHERE id = ?', pid);
  audit.log(req, 'streife.geloescht', 'patrols', pid);
  res.redirect('/streife');
}));

module.exports = router;
