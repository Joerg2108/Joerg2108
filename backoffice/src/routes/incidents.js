'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const numbering = require('../lib/numbering');
const pdf = require('../lib/pdf');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('incidents'));

const CATEGORIES = {
  diebstahl: 'Diebstahl', sachbeschaedigung: 'Sachbeschädigung', ruhestoerung: 'Ruhestörung', hausverbot: 'Hausverbot',
  koerperverletzung: 'Körperverletzung', brand: 'Brand', notfall: 'Medizinischer Notfall', defekt: 'Technischer Defekt', sonstiges: 'Sonstiges',
};
const SEVERITY = { niedrig: 'Niedrig', mittel: 'Mittel', hoch: 'Hoch' };
const STATUS = { offen: 'Offen', in_bearbeitung: 'In Bearbeitung', abgeschlossen: 'Abgeschlossen' };
const COLS = ['object_id', 'staff_id', 'occurred_at', 'category', 'severity', 'description', 'measures', 'police', 'police_ref', 'status'];

function fromBody(b) {
  const d = clean(b, ['description', 'measures', 'police_ref']);
  if (!d.description) throw new UserError('Beschreibung ist Pflicht.');
  d.object_id = Number(b.object_id) || null;
  d.staff_id = Number(b.staff_id) || null;
  d.occurred_at = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?/.test(b.occurred_at || '') ? b.occurred_at.replace('T', ' ') : f.today() + ' 00:00';
  d.category = CATEGORIES[b.category] ? b.category : 'sonstiges';
  d.severity = SEVERITY[b.severity] ? b.severity : 'mittel';
  d.status = STATUS[b.status] ? b.status : 'offen';
  d.police = b.police ? 1 : 0;
  return d;
}

function lists() {
  return {
    objects: db.all("SELECT id, name FROM objects WHERE status = 'aktiv' ORDER BY name").map((o) => [o.id, o.name]),
    staff: db.all('SELECT id, first_name, last_name FROM staff WHERE active = 1 ORDER BY last_name').map((s) => [s.id, `${s.last_name}, ${s.first_name}`]),
  };
}

router.get('/', (req, res) => {
  const status = STATUS[req.query.status] ? req.query.status : null;
  const rows = db.all(
    `SELECT i.*, o.name AS object_name, s.first_name, s.last_name FROM incidents i
     LEFT JOIN objects o ON o.id = i.object_id LEFT JOIN staff s ON s.id = i.staff_id
     ${status ? 'WHERE i.status = ?' : ''} ORDER BY i.occurred_at DESC LIMIT 200`, ...(status ? [status] : []));
  const counts = db.get("SELECT SUM(status='offen') offen, SUM(status='in_bearbeitung') bearb, SUM(status='abgeschlossen') zu FROM incidents");
  res.render('incidents/index', { title: 'Vorfälle', rows, status, STATUS, CATEGORIES, counts });
});

router.get('/neu', (req, res) => res.render('incidents/form', {
  title: 'Vorfall melden', i: { severity: 'mittel', status: 'offen', occurred_at: f.today() + ' ' + new Date().toISOString().slice(11, 16) },
  ...lists(), CATEGORIES, SEVERITY, STATUS,
}));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const number = numbering.seq('VF-{YYYY}-', 4);
  const r = db.run(`INSERT INTO incidents (number, ${COLS.join(', ')}, user_id) VALUES (?, ${COLS.map(() => '?').join(', ')}, ?)`, number, ...COLS.map((k) => d[k] ?? null), req.user.id);
  audit.log(req, 'vorfall.gemeldet', 'incidents', Number(r.lastInsertRowid));
  req.flash('success', `Vorfall ${number} gemeldet.`);
  res.redirect(`/vorfaelle/${r.lastInsertRowid}`);
}));

router.get('/:id(\\d+)', wrap((req, res) => {
  const i = db.get(
    `SELECT i.*, o.name AS object_name, s.first_name, s.last_name, u.name AS reporter FROM incidents i
     LEFT JOIN objects o ON o.id = i.object_id LEFT JOIN staff s ON s.id = i.staff_id LEFT JOIN users u ON u.id = i.user_id WHERE i.id = ?`, id(req.params.id));
  if (!i) return notFound(res, 'Vorfall');
  res.render('incidents/show', { title: `Vorfall ${i.number}`, i, CATEGORIES, SEVERITY, STATUS });
}));

router.get('/:id(\\d+)/pdf', wrap(async (req, res) => {
  const i = db.get(
    `SELECT i.*, o.name AS object_name, s.first_name, s.last_name FROM incidents i
     LEFT JOIN objects o ON o.id = i.object_id LEFT JOIN staff s ON s.id = i.staff_id WHERE i.id = ?`, id(req.params.id));
  if (!i) return notFound(res, 'Vorfall');
  const buf = await pdf.incidentReport({
    number: i.number, occurred_at: i.occurred_at, object_name: i.object_name,
    staff_name: [i.last_name, i.first_name].filter(Boolean).join(', '),
    category_label: CATEGORIES[i.category] || i.category, severity_label: SEVERITY[i.severity] || i.severity,
    status_label: STATUS[i.status] || i.status, police: i.police, police_ref: i.police_ref,
    description: i.description, measures: i.measures,
  });
  res.type('application/pdf').set('Content-Disposition', `inline; filename="Vorfall_${i.number || i.id}.pdf"`).send(buf);
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const i = db.get('SELECT * FROM incidents WHERE id = ?', id(req.params.id));
  if (!i) return notFound(res, 'Vorfall');
  res.render('incidents/form', { title: `Vorfall ${i.number} bearbeiten`, i, ...lists(), CATEGORIES, SEVERITY, STATUS });
}));

router.post('/:id(\\d+)', wrap((req, res) => {
  const iid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(`UPDATE incidents SET ${COLS.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...COLS.map((k) => d[k] ?? null), iid);
  audit.log(req, 'vorfall.geaendert', 'incidents', iid);
  req.flash('success', 'Gespeichert.');
  res.redirect(`/vorfaelle/${iid}`);
}));

router.post('/:id(\\d+)/status', wrap((req, res) => {
  const iid = id(req.params.id);
  const st = STATUS[req.body.status] ? req.body.status : 'offen';
  db.run("UPDATE incidents SET status = ?, updated_at = datetime('now') WHERE id = ?", st, iid);
  audit.log(req, 'vorfall.status', 'incidents', iid, { status: st });
  res.redirect(`/vorfaelle/${iid}`);
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const iid = id(req.params.id);
  db.run('DELETE FROM incidents WHERE id = ?', iid);
  audit.log(req, 'vorfall.geloescht', 'incidents', iid);
  res.redirect('/vorfaelle');
}));

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;
