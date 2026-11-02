'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const numbering = require('../lib/numbering');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('objects'));

const COLS = ['number', 'name', 'customer_id', 'street', 'zip', 'city', 'contact_name', 'contact_phone', 'access_info', 'checkpoints', 'instructions', 'status', 'notes'];

function fromBody(b) {
  const d = clean(b, ['number', 'name', 'street', 'zip', 'city', 'contact_name', 'contact_phone', 'access_info', 'instructions', 'notes']);
  if (!d.name) throw new UserError('Objektname ist Pflicht.');
  d.customer_id = Number(b.customer_id) || null;
  d.checkpoints = Math.max(0, Number(b.checkpoints) || 0);
  d.status = b.status === 'inaktiv' ? 'inaktiv' : 'aktiv';
  return d;
}

router.get('/', (req, res) => {
  const showAll = req.query.alle === '1';
  const rows = db.all(
    `SELECT o.*, c.company, c.last_name AS c_last,
       (SELECT COUNT(*) FROM patrols p WHERE p.object_id = o.id AND p.status = 'laeuft') AS running,
       (SELECT COUNT(*) FROM incidents i WHERE i.object_id = o.id AND i.status != 'abgeschlossen') AS open_incidents
     FROM objects o LEFT JOIN customers c ON c.id = o.customer_id
     ${showAll ? '' : "WHERE o.status = 'aktiv'"} ORDER BY o.name`,
  );
  res.render('objects/index', { title: 'Objekte', rows, showAll });
});

router.get('/neu', (req, res) => res.render('objects/form', {
  title: 'Neues Objekt', o: { status: 'aktiv', checkpoints: 0 }, customers: customerList(),
}));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  if (!d.number) d.number = numbering.seq('OBJ-');
  const r = db.run(`INSERT INTO objects (${COLS.join(', ')}) VALUES (${COLS.map(() => '?').join(', ')})`, ...COLS.map((k) => d[k] ?? null));
  audit.log(req, 'objekt.angelegt', 'objects', Number(r.lastInsertRowid));
  req.flash('success', 'Objekt angelegt.');
  res.redirect(`/objekte/${r.lastInsertRowid}`);
}));

router.get('/:id(\\d+)', wrap((req, res) => {
  const o = db.get('SELECT o.*, c.company, c.last_name AS c_last, c.first_name AS c_first FROM objects o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = ?', id(req.params.id));
  if (!o) return notFound(res, 'Objekt');
  const patrols = db.all(
    `SELECT p.*, s.first_name, s.last_name FROM patrols p LEFT JOIN staff s ON s.id = p.staff_id
     WHERE p.object_id = ? ORDER BY p.started_at DESC LIMIT 15`, o.id);
  const incidents = db.all('SELECT * FROM incidents WHERE object_id = ? ORDER BY occurred_at DESC LIMIT 15', o.id);
  res.render('objects/show', { title: o.name, o, patrols, incidents });
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const o = db.get('SELECT * FROM objects WHERE id = ?', id(req.params.id));
  if (!o) return notFound(res, 'Objekt');
  res.render('objects/form', { title: 'Objekt bearbeiten', o, customers: customerList() });
}));

router.post('/:id(\\d+)', wrap((req, res) => {
  const oid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(`UPDATE objects SET ${COLS.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...COLS.map((k) => d[k] ?? null), oid);
  audit.log(req, 'objekt.geaendert', 'objects', oid);
  req.flash('success', 'Gespeichert.');
  res.redirect(`/objekte/${oid}`);
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const oid = id(req.params.id);
  db.run('DELETE FROM objects WHERE id = ?', oid);
  audit.log(req, 'objekt.geloescht', 'objects', oid);
  req.flash('success', 'Objekt gelöscht.');
  res.redirect('/objekte');
}));

function customerList() {
  return db.all("SELECT id, company, last_name, first_name FROM customers WHERE status != 'inaktiv' ORDER BY company, last_name")
    .map((c) => [c.id, c.company || `${c.last_name || ''} ${c.first_name || ''}`.trim() || `Kunde ${c.id}`]);
}

module.exports = router;
