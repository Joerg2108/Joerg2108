'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('products'));

function fromBody(b) {
  const d = clean(b, ['sku', 'name', 'description', 'unit']);
  if (!d.name) throw new UserError('Bezeichnung fehlt.');
  d.unit = d.unit || 'Stk.';
  d.price = f.parseMoney(b.price);
  d.tax_rate = f.parseNumber(b.tax_rate, 19);
  d.active = b.active ? 1 : 0;
  return d;
}

router.get('/', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const rows = db.all('SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY active DESC, name', q, q);
  res.render('products/index', { title: 'Artikel & Leistungen', rows });
});

router.get('/neu', (req, res) => res.render('products/form', { title: 'Neuer Artikel', p: { unit: 'Stk.', tax_rate: 19, active: 1 } }));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run('INSERT INTO products (sku, name, description, unit, price, tax_rate, active) VALUES (?, ?, ?, ?, ?, ?, ?)', d.sku, d.name, d.description, d.unit, d.price, d.tax_rate, d.active);
  audit.log(req, 'artikel.angelegt', 'product', Number(r.lastInsertRowid));
  req.flash('success', 'Artikel angelegt.');
  res.redirect('/artikel');
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const p = db.get('SELECT * FROM products WHERE id = ?', id(req.params.id));
  if (!p) return notFound(res, 'Artikel');
  res.render('products/form', { title: 'Artikel bearbeiten', p });
}));

router.post('/:id', wrap((req, res) => {
  const pid = id(req.params.id);
  const d = fromBody(req.body);
  db.run('UPDATE products SET sku=?, name=?, description=?, unit=?, price=?, tax_rate=?, active=? WHERE id=?', d.sku, d.name, d.description, d.unit, d.price, d.tax_rate, d.active, pid);
  audit.log(req, 'artikel.geaendert', 'product', pid);
  req.flash('success', 'Artikel gespeichert.');
  res.redirect('/artikel');
}));

router.post('/:id/loeschen', wrap((req, res) => {
  const pid = id(req.params.id);
  db.run('DELETE FROM products WHERE id = ?', pid);
  audit.log(req, 'artikel.geloescht', 'product', pid);
  res.redirect('/artikel');
}));

module.exports = router;
