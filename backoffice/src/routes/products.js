'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const catalog = require('../lib/catalog');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('products'));

function fromBody(b) {
  const d = clean(b, ['sku', 'category', 'name', 'description', 'unit']);
  if (!d.name) throw new UserError('Bezeichnung fehlt.');
  d.unit = d.unit || 'Stk.';
  d.price = f.parseMoney(b.price);
  d.tax_rate = f.parseNumber(b.tax_rate, 19);
  d.active = b.active ? 1 : 0;
  d.public = b.public ? 1 : 0;
  return d;
}

router.get('/', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const rows = db.all("SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? OR category LIKE ? ORDER BY active DESC, COALESCE(category, 'zzz'), sku, name", q, q, q);
  // Nach Kategorie gruppieren, inaktive Leistungen gesammelt am Ende
  const byGroup = new Map();
  for (const r of rows) {
    const name = r.active ? r.category || 'Ohne Kategorie' : 'Inaktiv';
    if (!byGroup.has(name)) byGroup.set(name, []);
    byGroup.get(name).push(r);
  }
  const groups = [...byGroup].map(([name, items]) => ({ name, items }));
  const missing = catalog.CATALOG.filter((c) => !db.get('SELECT id FROM products WHERE sku = ?', c.sku)).length;
  res.render('products/index', { title: 'Artikel & Leistungen', rows, groups, missing });
});

const categories = () => db.all("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category").map((r) => r.category);

router.get('/neu', (req, res) => res.render('products/form', { title: 'Neuer Artikel', p: { unit: 'Std.', tax_rate: 19, active: 1, public: 1 }, categories: categories() }));

router.post('/katalog', wrap((req, res) => {
  const r = catalog.importCatalog();
  audit.log(req, 'artikel.katalog_importiert', 'product', null, r);
  req.flash('success', `Leistungskatalog eingespielt: ${r.added} neu${r.skipped ? `, ${r.skipped} bereits vorhanden (unverändert)` : ''}.`);
  res.redirect('/artikel');
}));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run('INSERT INTO products (sku, category, name, description, unit, price, tax_rate, active, public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', d.sku, d.category, d.name, d.description, d.unit, d.price, d.tax_rate, d.active, d.public);
  audit.log(req, 'artikel.angelegt', 'product', Number(r.lastInsertRowid));
  req.flash('success', 'Artikel angelegt.');
  res.redirect('/artikel');
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const p = db.get('SELECT * FROM products WHERE id = ?', id(req.params.id));
  if (!p) return notFound(res, 'Artikel');
  res.render('products/form', { title: 'Artikel bearbeiten', p, categories: categories() });
}));

router.post('/:id', wrap((req, res) => {
  const pid = id(req.params.id);
  const d = fromBody(req.body);
  db.run('UPDATE products SET sku=?, category=?, name=?, description=?, unit=?, price=?, tax_rate=?, active=?, public=? WHERE id=?', d.sku, d.category, d.name, d.description, d.unit, d.price, d.tax_rate, d.active, d.public, pid);
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
