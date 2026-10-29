'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('vehicles'));

const STATUS = { verfuegbar: 'Verfügbar', im_einsatz: 'Im Einsatz', werkstatt: 'Werkstatt', stillgelegt: 'Stillgelegt' };
const COLS = ['plate', 'model', 'staff_id', 'mileage', 'tuev', 'insurance', 'status', 'notes'];

function fromBody(b) {
  const d = clean(b, ['plate', 'model', 'insurance', 'notes']);
  if (!d.plate) throw new UserError('Kennzeichen ist Pflicht.');
  d.staff_id = Number(b.staff_id) || null;
  d.mileage = Math.max(0, Number(b.mileage) || 0);
  d.tuev = /^\d{4}-\d{2}(-\d{2})?$/.test(b.tuev || '') ? (b.tuev.length === 7 ? b.tuev + '-01' : b.tuev) : null;
  d.status = STATUS[b.status] ? b.status : 'verfuegbar';
  return d;
}

const staffList = () => db.all('SELECT id, first_name, last_name FROM staff WHERE active = 1 ORDER BY last_name').map((s) => [s.id, `${s.last_name}, ${s.first_name}`]);

router.get('/', (req, res) => {
  const rows = db.all('SELECT v.*, s.first_name, s.last_name FROM vehicles v LEFT JOIN staff s ON s.id = v.staff_id ORDER BY v.plate');
  res.render('vehicles/index', { title: 'Fahrzeuge', rows, STATUS, today: f.today(), soon: f.addDays(f.today(), 60) });
});

router.get('/neu', (req, res) => res.render('vehicles/form', { title: 'Neues Fahrzeug', v: { status: 'verfuegbar', mileage: 0 }, staff: staffList(), STATUS }));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run(`INSERT INTO vehicles (${COLS.join(', ')}) VALUES (${COLS.map(() => '?').join(', ')})`, ...COLS.map((k) => d[k] ?? null));
  audit.log(req, 'fahrzeug.angelegt', 'vehicles', Number(r.lastInsertRowid));
  req.flash('success', 'Fahrzeug angelegt.');
  res.redirect('/fahrzeuge');
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const v = db.get('SELECT * FROM vehicles WHERE id = ?', id(req.params.id));
  if (!v) return notFound(res, 'Fahrzeug');
  res.render('vehicles/form', { title: `Fahrzeug ${v.plate}`, v, staff: staffList(), STATUS });
}));

router.post('/:id(\\d+)', wrap((req, res) => {
  const vid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(`UPDATE vehicles SET ${COLS.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...COLS.map((k) => d[k] ?? null), vid);
  audit.log(req, 'fahrzeug.geaendert', 'vehicles', vid);
  req.flash('success', 'Gespeichert.');
  res.redirect('/fahrzeuge');
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const vid = id(req.params.id);
  db.run('DELETE FROM vehicles WHERE id = ?', vid);
  audit.log(req, 'fahrzeug.geloescht', 'vehicles', vid);
  res.redirect('/fahrzeuge');
}));

module.exports = router;
