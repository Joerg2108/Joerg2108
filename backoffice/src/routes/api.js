'use strict';
// Öffentliche Endpunkte (Website-Kontaktformular, iCal) und REST-API v1 mit API-Schlüssel
const express = require('express');
const db = require('../db');
const config = require('../config');
const settings = require('../lib/settings');
const sec = require('../lib/security');
const mailer = require('../lib/mailer');
const audit = require('../lib/audit');
const sales = require('../lib/sales');
const f = require('../lib/format');

const router = express.Router();
router.use(express.json({ limit: '100kb' }));
router.use(express.urlencoded({ extended: false, limit: '100kb' }));

// ---------- Kontaktformular der Website ----------
function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && config.corsOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

const contactLimiter = sec.rateLimit({ windowMs: 60 * 60 * 1000, max: 10, key: 'contact', message: 'Zu viele Anfragen. Bitte später erneut versuchen.' });

router.options('/public/kontakt', cors);
router.post('/public/kontakt', cors, contactLimiter, async (req, res) => {
  const b = req.body || {};
  const wantsJson = req.is('json') || req.accepts(['html', 'json']) === 'json';
  const reply = (status, msg) => {
    if (wantsJson) return res.status(status).json(status < 300 ? { ok: true, message: msg } : { ok: false, error: msg });
    const back = b.redirect && config.corsOrigins.some((o) => String(b.redirect).startsWith(o)) ? b.redirect : null;
    if (back) return res.redirect(303, back + (back.includes('?') ? '&' : '?') + (status < 300 ? 'gesendet=1' : 'fehler=1'));
    res.status(status).type('text/plain').send(msg);
  };
  // Honeypot-Feld: echte Besucher lassen "website" leer, Bots füllen es aus
  if (b.website) return reply(200, 'Danke!');
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  const message = String(b.message || b.nachricht || '').trim().slice(0, 5000);
  if (!name || !message || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return reply(422, 'Bitte Name, gültige E-Mail und Nachricht angeben.');
  if (!email && !b.phone) return reply(422, 'Bitte E-Mail oder Telefonnummer angeben.');
  if (!b.consent && !b.datenschutz) return reply(422, 'Bitte der Datenschutzerklärung zustimmen.');
  const r = db.run(
    "INSERT INTO leads (name, company, email, phone, subject, message, source, ip, consent) VALUES (?, ?, ?, ?, ?, ?, 'website', ?, 1)",
    name, String(b.company || b.firma || '').trim().slice(0, 120) || null, email || null, String(b.phone || b.telefon || '').trim().slice(0, 50) || null,
    String(b.subject || b.betreff || 'Anfrage über die Website').trim().slice(0, 200), message, req.ip,
  );
  const leadId = Number(r.lastInsertRowid);
  db.run('INSERT INTO notifications (user_id, title, link) VALUES (NULL, ?, ?)', `Neue Website-Anfrage von ${name}`, `/anfragen/${leadId}`);
  audit.log({ ip: req.ip }, 'anfrage.website', 'lead', leadId);
  const notifyTo = settings.get('lead_notify_email') || settings.get('company_email');
  mailer.send({
    to: notifyTo, replyTo: email || undefined, subject: `Neue Anfrage: ${name}`,
    text: `Neue Anfrage über die Website\n\nName: ${name}\nE-Mail: ${email}\nTelefon: ${b.phone || b.telefon || '-'}\n\n${message}\n\n→ ${config.baseUrl}/anfragen/${leadId}`,
  }).catch((e) => console.error('Benachrichtigung fehlgeschlagen:', e.message));
  reply(201, 'Vielen Dank! Ihre Anfrage ist eingegangen – wir melden uns schnellstmöglich.');
});

// ---------- Leistungskatalog für die Website ----------
// Öffentliche, nicht personenbezogene Daten: für jede Website abrufbar (CORS *),
// Cross-Origin-Resource-Policy erlaubt das Einbinden des Widgets auf fremden Domains.
const path = require('node:path');
const catalog = require('../lib/catalog');
function publicAsset(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cache-Control', 'public, max-age=300');
  next();
}
const catalogLimiter = sec.rateLimit({ windowMs: 60 * 1000, max: 120, key: 'catalog' });

router.get('/public/leistungen', catalogLimiter, publicAsset, (req, res) => res.json(catalog.publicCatalog()));
router.get('/public/leistungen.js', publicAsset, (req, res) => res.type('application/javascript').sendFile(path.join(__dirname, '..', '..', 'public', 'widget', 'leistungen.js')));
router.get('/public/leistungen.css', publicAsset, (req, res) => res.type('text/css').sendFile(path.join(__dirname, '..', '..', 'public', 'widget', 'leistungen.css')));

// ---------- iCal-Feed ----------
router.get('/kalender/:uid/:token.ics', (req, res) => {
  const { icalToken, icsFeed } = require('./calendar');
  const uid = Number(req.params.uid);
  const expected = icalToken(uid);
  if (!uid || req.params.token.length !== expected.length || req.params.token !== expected) return res.status(404).end();
  res.type('text/calendar; charset=utf-8').send(icsFeed(uid));
});

// ---------- REST-API v1 ----------
const v1 = express.Router();
v1.use(sec.rateLimit({ windowMs: 60 * 1000, max: 120, key: 'api' }));

v1.get('/kunden', sec.apiAuth('read'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  res.json(db.all('SELECT id, number, type, company, first_name, last_name, email, phone, street, zip, city, country, vat_id, status, created_at, updated_at FROM customers WHERE anonymized = 0 ORDER BY id LIMIT ? OFFSET ?', limit, offset));
});

v1.get('/kunden/:id', sec.apiAuth('read'), (req, res) => {
  const c = db.get('SELECT * FROM customers WHERE id = ? AND anonymized = 0', Number(req.params.id));
  return c ? res.json(c) : res.status(404).json({ error: 'Nicht gefunden' });
});

v1.post('/kunden', sec.apiAuth('write'), (req, res) => {
  const { insertCustomer, customerFromBody } = require('./customers');
  try {
    const cid = insertCustomer(customerFromBody(req.body || {}), null);
    audit.log(req, 'kunde.api_angelegt', 'customer', cid);
    res.status(201).json(db.get('SELECT * FROM customers WHERE id = ?', cid));
  } catch (e) {
    res.status(422).json({ error: e.message });
  }
});

v1.get('/rechnungen', sec.apiAuth('read'), (req, res) => {
  const where = ["kind IN ('rechnung','storno')", 'finalized_at IS NOT NULL'];
  const params = [];
  if (req.query.status) { where.push('status = ?'); params.push(req.query.status); }
  if (req.query.seit) { where.push('updated_at >= ?'); params.push(req.query.seit); }
  const rows = db.all(`SELECT id, kind, number, customer_id, status, issue_date, due_date, net_total, tax_total, gross_total, paid_total, updated_at FROM documents_sales WHERE ${where.join(' AND ')} ORDER BY issue_date DESC LIMIT 500`, ...params);
  res.json(rows.map((r) => ({ ...r, net_total: r.net_total / 100, tax_total: r.tax_total / 100, gross_total: r.gross_total / 100, paid_total: r.paid_total / 100 })));
});

v1.get('/rechnungen/:id', sec.apiAuth('read'), (req, res) => {
  const d = sales.load(Number(req.params.id));
  if (!d || !d.finalized_at) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json({ id: d.id, kind: d.kind, number: d.number, status: d.status, issue_date: d.issue_date, due_date: d.due_date, customer: d.snapshot, items: d.items, totals: { net: d.calc.net / 100, tax: d.calc.tax / 100, gross: d.calc.gross / 100, open: d.open_amount / 100 } });
});

v1.get('/anfragen', sec.apiAuth('read'), (req, res) => {
  res.json(db.all('SELECT id, name, company, email, phone, subject, status, source, value, created_at FROM leads ORDER BY created_at DESC LIMIT 500'));
});

v1.get('/kennzahlen', sec.apiAuth('read'), (req, res) => {
  const y = f.today().slice(0, 4);
  res.json({
    umsatz_jahr_netto: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE kind IN ('rechnung','storno') AND finalized_at IS NOT NULL AND substr(issue_date,1,4) = ?", y).s / 100,
    offene_posten: db.get("SELECT COALESCE(SUM(gross_total-paid_total),0) AS s FROM documents_sales WHERE kind='rechnung' AND status IN ('offen','teilbezahlt')").s / 100,
    neue_anfragen: db.get("SELECT COUNT(*) AS n FROM leads WHERE status='neu'").n,
  });
});

v1.use((req, res) => res.status(404).json({ error: 'Endpunkt nicht gefunden' }));
router.use('/v1', v1);

module.exports = router;
