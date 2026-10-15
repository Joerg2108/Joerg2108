'use strict';
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const calc = require('../public/js/calc');
const { db, all, get, run, tx, getSetting, setSetting, allSettings, nextCustomerNumber, logActivity, DATA_DIR, DEFAULTS } = require('./db');
const auth = require('./auth');
const D = require('./documents');
const pdf = require('./pdf');
const mail = require('./mail');
const { buildXRechnung, checkXRechnung } = require('./xrechnung');
const backup = require('./backup');

const api = express.Router();
api.use(express.json({ limit: '5mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });
const { HttpError } = D;

const needsSetup = () => get('SELECT COUNT(*) AS n FROM users').n === 0;

/* ================================================================== */
/* Setup & Login                                                       */
/* ================================================================== */
api.get('/status', (req, res) => {
  res.json({ setup: needsSetup(), user: auth.currentUser(req), company: getSetting('company').name });
});

api.post('/setup', (req, res) => {
  if (!needsSetup()) throw new HttpError(403, 'Die Ersteinrichtung wurde bereits durchgeführt.');
  const { username, password, name, email, company } = req.body || {};
  if (!username || String(password || '').length < 8) throw new HttpError(400, 'Benutzername und ein Passwort mit mindestens 8 Zeichen sind erforderlich.');
  const r = run("INSERT INTO users(username, name, email, password, role) VALUES(?,?,?,?, 'admin')", username.trim(), name || '', email || '', auth.hashPassword(password));
  if (company) setSetting('company', { ...getSetting('company'), ...company });
  auth.createSession(res, Number(r.lastInsertRowid), req.secure);
  logActivity(Number(r.lastInsertRowid), 'system', null, 'Ersteinrichtung');
  res.json({ ok: true });
});

api.post('/login', (req, res) => {
  const ip = req.ip;
  if (auth.loginThrottle(ip)) throw new HttpError(429, 'Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen.');
  const { username, password } = req.body || {};
  const u = get('SELECT * FROM users WHERE username = ? AND active = 1', String(username || '').trim());
  if (!u || !auth.verifyPassword(password, u.password)) {
    auth.loginFailed(ip);
    throw new HttpError(401, 'Benutzername oder Passwort ist falsch.');
  }
  auth.loginOk(ip);
  auth.createSession(res, u.id, req.secure);
  logActivity(u.id, 'system', null, 'Anmeldung');
  res.json({ ok: true });
});

api.post('/logout', (req, res) => {
  auth.destroySession(req, res);
  res.json({ ok: true });
});

// Ab hier nur angemeldet
api.use(auth.requireAuth);

api.get('/me', (req, res) => res.json(req.user));
api.put('/me/password', (req, res) => {
  const { current, password } = req.body || {};
  const u = get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!auth.verifyPassword(current, u.password)) throw new HttpError(400, 'Das aktuelle Passwort ist falsch.');
  if (String(password || '').length < 8) throw new HttpError(400, 'Das neue Passwort muss mindestens 8 Zeichen haben.');
  run('UPDATE users SET password = ? WHERE id = ?', auth.hashPassword(password), u.id);
  res.json({ ok: true });
});

/* ================================================================== */
/* Kunden                                                              */
/* ================================================================== */
const CUSTOMER_FIELDS = [
  'type', 'salutation', 'title', 'first_name', 'last_name', 'company', 'contact_person', 'address_extra', 'street',
  'zip', 'city', 'country', 'email', 'email_cc', 'phone', 'mobile', 'vat_id', 'leitweg_id', 'reverse_charge',
  'payment_days', 'discount', 'notes', 'archived',
];

function cleanCustomer(b) {
  const c = {};
  for (const k of CUSTOMER_FIELDS) if (b[k] !== undefined) c[k] = b[k];
  if (c.type && !['privat', 'gewerblich', 'oeffentlich'].includes(c.type)) c.type = 'privat';
  if (c.reverse_charge !== undefined) c.reverse_charge = c.reverse_charge ? 1 : 0;
  if (c.archived !== undefined) c.archived = c.archived ? 1 : 0;
  if (c.payment_days === '' || c.payment_days === undefined) c.payment_days = c.payment_days === '' ? null : undefined;
  if (c.payment_days != null) c.payment_days = parseInt(c.payment_days, 10) || null;
  if (c.discount !== undefined) c.discount = Number(c.discount) || 0;
  for (const k of Object.keys(c)) if (c[k] === undefined) delete c[k];
  return c;
}

api.get('/customers', (req, res) => {
  const { q, archived } = req.query;
  const where = [archived === '1' ? 'c.archived = 1' : 'c.archived = 0'];
  const params = [];
  if (q) {
    where.push('(c.number LIKE ? OR c.company LIKE ? OR c.last_name LIKE ? OR c.first_name LIKE ? OR c.city LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.street LIKE ?)');
    for (let i = 0; i < 8; i++) params.push(`%${q}%`);
  }
  const rows = all(
    `SELECT c.*,
      (SELECT COALESCE(SUM(net - prepaid_net),0) FROM documents d WHERE d.customer_id = c.id AND d.type <> 'angebot' AND d.finalized_at IS NOT NULL AND d.status <> 'storniert' AND d.type <> 'storno') AS revenue,
      (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id) AS doc_count,
      (SELECT MAX(date) FROM documents d WHERE d.customer_id = c.id) AS last_activity
     FROM customers c WHERE ${where.join(' AND ')}
     ORDER BY COALESCE(NULLIF(c.company,''), c.last_name) COLLATE NOCASE`,
    ...params
  );
  res.json(rows.map((r) => ({ ...r, display_name: D.customerDisplayName(r) })));
});

api.get('/customers/export.csv', (req, res) => {
  const rows = all('SELECT * FROM customers ORDER BY number');
  const cols = ['number', ...CUSTOMER_FIELDS];
  const csv = [cols.join(';'), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(';'))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kunden.csv"');
  res.send('﻿' + csv);
});

api.post('/customers/import', upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Keine Datei.');
  const rows = parseCsv(req.file.buffer.toString('utf8').replace(/^﻿/, ''));
  const head = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
  let n = 0;
  tx(() => {
    for (const r of rows) {
      const o = {};
      head.forEach((h, i) => (o[h] = r[i]));
      const c = cleanCustomer(o);
      if (!c.company && !c.last_name) continue;
      insertCustomer(c, req.user);
      n++;
    }
  });
  res.json({ imported: n });
});

function insertCustomer(c, user) {
  const number = nextCustomerNumber();
  const keys = Object.keys(c);
  const r = run(
    `INSERT INTO customers(number${keys.map((k) => ', ' + k).join('')}) VALUES(?${keys.map(() => ',?').join('')})`,
    number, ...keys.map((k) => c[k])
  );
  logActivity(user?.id, 'customer', Number(r.lastInsertRowid), 'angelegt', number);
  return Number(r.lastInsertRowid);
}

api.get('/customers/:id', (req, res) => {
  const c = get('SELECT * FROM customers WHERE id = ?', req.params.id);
  if (!c) throw new HttpError(404, 'Kunde nicht gefunden.');
  const docs = D.listDocuments({ customer_id: c.id });
  const invoices = docs.filter((d) => d.type !== 'angebot' && d.finalized_at && d.status !== 'storniert' && d.type !== 'storno');
  res.json({
    ...c,
    display_name: D.customerDisplayName(c),
    documents: docs,
    stats: {
      revenue: invoices.reduce((s, d) => s + d.net - d.prepaid_net, 0),
      open: invoices.reduce((s, d) => s + Math.max(0, d.open), 0),
      offers: docs.filter((d) => d.type === 'angebot').length,
      offers_won: docs.filter((d) => d.type === 'angebot' && ['angenommen', 'abgerechnet'].includes(d.status)).length,
    },
  });
});

api.post('/customers', (req, res) => {
  const c = cleanCustomer(req.body || {});
  if (!c.company && !c.last_name) throw new HttpError(400, 'Bitte Firmenname oder Nachname angeben.');
  res.json({ id: insertCustomer(c, req.user) });
});

api.put('/customers/:id', (req, res) => {
  const c = cleanCustomer(req.body || {});
  const keys = Object.keys(c);
  if (!keys.length) return res.json({ ok: true });
  run(
    `UPDATE customers SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`,
    ...keys.map((k) => c[k]), req.params.id
  );
  // Adressänderung in offene Entwürfe übernehmen
  const drafts = all('SELECT id FROM documents WHERE customer_id = ? AND finalized_at IS NULL', req.params.id);
  const cust = get('SELECT * FROM customers WHERE id = ?', req.params.id);
  for (const d of drafts) run('UPDATE documents SET customer_snapshot = ? WHERE id = ?', JSON.stringify(D.customerSnapshot(cust)), d.id);
  logActivity(req.user.id, 'customer', Number(req.params.id), 'geändert');
  res.json({ ok: true });
});

api.delete('/customers/:id', (req, res) => {
  const n = get('SELECT COUNT(*) AS n FROM documents WHERE customer_id = ?', req.params.id).n;
  if (n) {
    run('UPDATE customers SET archived = 1 WHERE id = ?', req.params.id);
    return res.json({ archived: true });
  }
  run('DELETE FROM customers WHERE id = ?', req.params.id);
  logActivity(req.user.id, 'customer', Number(req.params.id), 'gelöscht');
  res.json({ deleted: true });
});

/* ================================================================== */
/* Leistungskatalog                                                    */
/* ================================================================== */
const ARTICLE_FIELDS = ['number', 'category', 'name', 'description', 'unit', 'price', 'cost', 'labor_percent', 'vat_rate', 'active'];
function cleanArticle(b) {
  const a = {};
  for (const k of ARTICLE_FIELDS) if (b[k] !== undefined) a[k] = b[k];
  if (a.price !== undefined) a.price = Math.round(Number(a.price) || 0);
  if (a.cost !== undefined) a.cost = Math.round(Number(a.cost) || 0);
  if (a.labor_percent !== undefined) a.labor_percent = Math.min(100, Math.max(0, Number(a.labor_percent) || 0));
  if (a.vat_rate !== undefined) a.vat_rate = [0, 7, 19].includes(Number(a.vat_rate)) ? Number(a.vat_rate) : 19;
  if (a.active !== undefined) a.active = a.active ? 1 : 0;
  return a;
}

api.get('/articles', (req, res) => {
  const { q, category, all: showAll } = req.query;
  const where = [];
  const params = [];
  if (showAll !== '1') where.push('active = 1');
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (q) {
    where.push('(number LIKE ? OR name LIKE ? OR description LIKE ? OR category LIKE ?)');
    for (let i = 0; i < 4; i++) params.push(`%${q}%`);
  }
  const rows = all(
    `SELECT a.*, (SELECT COUNT(*) FROM document_items i WHERE i.article_id = a.id) AS usage
     FROM articles a ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY category COLLATE NOCASE, number COLLATE NOCASE, name COLLATE NOCASE`,
    ...params
  );
  res.json(rows);
});

api.get('/articles/categories', (req, res) => {
  res.json(all("SELECT category, COUNT(*) AS n FROM articles WHERE category <> '' GROUP BY category ORDER BY MIN(number), category"));
});

api.post('/articles', (req, res) => {
  const a = cleanArticle(req.body || {});
  if (!a.name) throw new HttpError(400, 'Bitte eine Bezeichnung angeben.');
  const keys = Object.keys(a);
  const r = run(`INSERT INTO articles(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, ...keys.map((k) => a[k]));
  res.json({ id: Number(r.lastInsertRowid) });
});

api.put('/articles/:id', (req, res) => {
  const a = cleanArticle(req.body || {});
  const keys = Object.keys(a);
  if (keys.length) {
    run(`UPDATE articles SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`, ...keys.map((k) => a[k]), req.params.id);
  }
  res.json({ ok: true });
});

api.delete('/articles/:id', (req, res) => {
  // Positionen in Belegen bleiben erhalten (Werte sind kopiert)
  run('DELETE FROM articles WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

/** Preisanpassung: alle (oder eine Kategorie) um x % */
api.post('/articles/adjust-prices', auth.requireAdmin, (req, res) => {
  const pct = Number(req.body?.percent);
  if (!pct || Math.abs(pct) > 100) throw new HttpError(400, 'Bitte eine Prozentzahl zwischen -100 und 100 angeben.');
  const roundTo = Number(req.body?.round_to) || 1; // in Cent, z. B. 10 = auf 10 Cent runden
  const rows = req.body?.category ? all('SELECT id, price FROM articles WHERE category = ?', req.body.category) : all('SELECT id, price FROM articles');
  tx(() => {
    for (const r of rows) {
      const p = Math.round((r.price * (1 + pct / 100)) / roundTo) * roundTo;
      run("UPDATE articles SET price = ?, updated_at = datetime('now','localtime') WHERE id = ?", p, r.id);
    }
  });
  logActivity(req.user.id, 'article', null, 'Preisanpassung', `${pct} % (${rows.length} Leistungen)`);
  res.json({ updated: rows.length });
});

api.get('/articles/export.csv', (req, res) => {
  const rows = all('SELECT * FROM articles ORDER BY category, number');
  const csv = [
    'Nummer;Kategorie;Bezeichnung;Beschreibung;Einheit;VK netto;EK netto;Lohnanteil %;MwSt %;Aktiv',
    ...rows.map((r) =>
      [r.number, r.category, r.name, r.description, r.unit, (r.price / 100).toFixed(2).replace('.', ','),
        (r.cost / 100).toFixed(2).replace('.', ','), r.labor_percent, r.vat_rate, r.active].map(csvCell).join(';')
    ),
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leistungskatalog.csv"');
  res.send('﻿' + csv);
});

api.post('/articles/import', upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Keine Datei.');
  const rows = parseCsv(req.file.buffer.toString('utf8').replace(/^﻿/, ''));
  rows.shift();
  let n = 0;
  tx(() => {
    for (const r of rows) {
      if (!r[2]) continue;
      const a = cleanArticle({
        number: r[0] || '', category: r[1] || '', name: r[2], description: r[3] || '', unit: r[4] || 'Stk',
        price: calc.parseMoney(r[5]), cost: calc.parseMoney(r[6]), labor_percent: calc.parseNumber(r[7]),
        vat_rate: r[8] ? calc.parseNumber(r[8]) : 19, active: r[9] === undefined || r[9] === '' ? 1 : r[9] !== '0',
      });
      const existing = a.number ? get('SELECT id FROM articles WHERE number = ?', a.number) : null;
      const keys = Object.keys(a);
      if (existing) run(`UPDATE articles SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...keys.map((k) => a[k]), existing.id);
      else run(`INSERT INTO articles(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, ...keys.map((k) => a[k]));
      n++;
    }
  });
  res.json({ imported: n });
});

/* ================================================================== */
/* Belege                                                              */
/* ================================================================== */
api.get('/documents', (req, res) => res.json(D.listDocuments(req.query)));

api.get('/documents/defaults', (req, res) => {
  const c = req.query.customer_id ? get('SELECT * FROM customers WHERE id = ?', req.query.customer_id) : null;
  res.json(D.defaultsFor(req.query.type || 'angebot', c));
});

api.get('/documents/:id', (req, res) => {
  const doc = D.loadDocument(Number(req.params.id));
  doc.xrechnung_issues = D.INVOICE_TYPES.includes(doc.type) ? checkXRechnung(doc) : [];
  res.json(doc);
});

api.post('/documents', (req, res) => {
  const { type, ...data } = req.body || {};
  res.json({ id: D.createDocument(type, data, req.user) });
});

api.put('/documents/:id', (req, res) => {
  D.updateDocument(Number(req.params.id), req.body || {}, req.user);
  res.json(D.loadDocument(Number(req.params.id)));
});

api.delete('/documents/:id', (req, res) => {
  D.deleteDocument(Number(req.params.id), req.user);
  res.json({ ok: true });
});

api.post('/documents/:id/finalize', (req, res) => {
  D.finalizeDocument(Number(req.params.id), req.user);
  res.json(D.loadDocument(Number(req.params.id)));
});

api.post('/documents/:id/derive', (req, res) => {
  const { target, ...opts } = req.body || {};
  res.json({ id: D.deriveDocument(Number(req.params.id), target, opts, req.user) });
});

api.post('/documents/:id/cancel', (req, res) => {
  res.json({ id: D.cancelDocument(Number(req.params.id), req.user) });
});

api.post('/documents/:id/status', (req, res) => {
  D.setOfferStatus(Number(req.params.id), req.body?.status, req.user);
  res.json({ ok: true });
});

api.get('/documents/:id/pdf', async (req, res) => {
  const doc = D.loadDocument(Number(req.params.id));
  const buf = await pdf.toBuffer(pdf.renderDocumentPdf(doc));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${pdf.fileName(doc)}"`);
  res.send(buf);
});

api.get('/documents/:id/xml', (req, res) => {
  const doc = D.loadDocument(Number(req.params.id));
  if (!D.INVOICE_TYPES.includes(doc.type)) throw new HttpError(400, 'XRechnung nur für Rechnungen.');
  if (!doc.number) throw new HttpError(400, 'Bitte die Rechnung zuerst festschreiben.');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName(doc, 'xml')}"`);
  res.send(buildXRechnung(doc));
});

api.get('/documents/:id/mail-draft', (req, res) => {
  const doc = D.loadDocument(Number(req.params.id));
  res.json({ ...mail.draftFor(doc), pdf_name: pdf.fileName(doc), xml_name: pdf.fileName(doc, 'xml'), can_xml: D.INVOICE_TYPES.includes(doc.type) });
});

api.post('/documents/:id/send', async (req, res) => {
  const id = Number(req.params.id);
  let doc = D.loadDocument(id);
  if (D.INVOICE_TYPES.includes(doc.type) && !doc.finalized_at) {
    D.finalizeDocument(id, req.user);
    doc = D.loadDocument(id);
  }
  const b = req.body || {};
  // Platzhalter "Entwurf" durch die frisch vergebene Nummer ersetzen
  const subject = String(b.subject || '').replace(/Entwurf/g, doc.number);
  const body = String(b.body || '').replace(/\bEntwurf\b/g, doc.number);
  const attachments = [];
  if (b.attach_pdf !== false) attachments.push({ filename: pdf.fileName(doc), content: await pdf.toBuffer(pdf.renderDocumentPdf(doc)), contentType: 'application/pdf' });
  if (b.attach_xml && D.INVOICE_TYPES.includes(doc.type)) {
    attachments.push({ filename: pdf.fileName(doc, 'xml'), content: Buffer.from(buildXRechnung(doc), 'utf8'), contentType: 'application/xml' });
  }
  await mail.sendMail({ to: b.to, cc: b.cc, subject, body, attachments, documentId: id, userId: req.user.id });
  D.markSent(id);
  logActivity(req.user.id, 'document', id, 'per E-Mail versendet', b.to);
  res.json(D.loadDocument(id));
});

api.post('/documents/:id/mark-sent', (req, res) => {
  D.markSent(Number(req.params.id));
  res.json({ ok: true });
});

api.post('/documents/:id/payments', (req, res) => {
  D.addPayment(Number(req.params.id), req.body || {}, req.user);
  res.json(D.loadDocument(Number(req.params.id)));
});

api.delete('/documents/:id/payments/:pid', (req, res) => {
  D.deletePayment(Number(req.params.id), Number(req.params.pid), req.user);
  res.json(D.loadDocument(Number(req.params.id)));
});

api.post('/documents/:id/reminders', (req, res) => {
  const rid = D.createReminder(Number(req.params.id), req.user);
  res.json({ id: rid, doc: D.loadDocument(Number(req.params.id)) });
});

function reminderOf(req) {
  const doc = D.loadDocument(Number(req.params.id));
  const r = doc.reminders.find((x) => x.id === Number(req.params.rid));
  if (!r) throw new HttpError(404, 'Mahnung nicht gefunden.');
  return { doc, r };
}

api.get('/documents/:id/reminders/:rid/pdf', async (req, res) => {
  const { doc, r } = reminderOf(req);
  const buf = await pdf.toBuffer(pdf.renderReminderPdf(doc, r));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Mahnung_${r.level}_${doc.number}.pdf"`);
  res.send(buf);
});

api.get('/documents/:id/reminders/:rid/mail-draft', (req, res) => {
  const { doc, r } = reminderOf(req);
  res.json({ ...mail.draftFor(doc, r), pdf_name: `Mahnung_${r.level}_${doc.number}.pdf`, can_xml: false });
});

api.post('/documents/:id/reminders/:rid/send', async (req, res) => {
  const { doc, r } = reminderOf(req);
  const b = req.body || {};
  const buf = await pdf.toBuffer(pdf.renderReminderPdf(doc, r));
  const attachments = [{ filename: `Mahnung_${r.level}_${doc.number}.pdf`, content: buf, contentType: 'application/pdf' }];
  if (b.attach_invoice) attachments.push({ filename: pdf.fileName(doc), content: await pdf.toBuffer(pdf.renderDocumentPdf(doc)) });
  await mail.sendMail({ to: b.to, cc: b.cc, subject: b.subject, body: b.body, attachments, documentId: doc.id, reminderId: r.id, userId: req.user.id });
  run("UPDATE reminders SET sent_at = datetime('now','localtime') WHERE id = ?", r.id);
  res.json(D.loadDocument(doc.id));
});

api.delete('/documents/:id/reminders/:rid', (req, res) => {
  const { doc, r } = reminderOf(req);
  if (r.level !== doc.reminders.at(-1).level) throw new HttpError(400, 'Nur die letzte Mahnstufe kann gelöscht werden.');
  run('DELETE FROM reminders WHERE id = ?', r.id);
  res.json(D.loadDocument(doc.id));
});

/* ================================================================== */
/* Dashboard                                                           */
/* ================================================================== */
api.get('/dashboard', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const y = String(year);
  const today = D.today();
  const invoiceWhere = "type IN ('rechnung','abschlag','schluss','storno') AND finalized_at IS NOT NULL";
  const revenue = get(`SELECT COALESCE(SUM(net - prepaid_net),0) AS net, COALESCE(SUM(gross - prepaid_gross),0) AS gross FROM documents WHERE ${invoiceWhere} AND type <> 'storno' AND status <> 'storniert' AND substr(date,1,4) = ?`, y);
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, invoiced: 0, paid: 0, offers: 0 }));
  for (const r of all(`SELECT CAST(substr(date,6,2) AS INTEGER) AS m, SUM(net - prepaid_net) AS s FROM documents WHERE ${invoiceWhere} AND type <> 'storno' AND status <> 'storniert' AND substr(date,1,4) = ? GROUP BY m`, y)) months[r.m - 1].invoiced = r.s;
  for (const r of all(`SELECT CAST(substr(p.date,6,2) AS INTEGER) AS m, SUM(p.amount) AS s FROM payments p WHERE substr(p.date,1,4) = ? GROUP BY m`, y)) months[r.m - 1].paid = r.s;
  for (const r of all(`SELECT CAST(substr(date,6,2) AS INTEGER) AS m, SUM(net) AS s FROM documents WHERE type = 'angebot' AND substr(date,1,4) = ? GROUP BY m`, y)) months[r.m - 1].offers = r.s;

  const openInvoices = D.listDocuments({ kind: 'rechnungen' }).filter((d) => d.finalized_at && d.open > 0 && d.status !== 'storniert');
  const overdue = openInvoices.filter((d) => d.due_date && d.due_date < today);
  const offers = D.listDocuments({ kind: 'angebote' });
  const yearOffers = offers.filter((o) => o.date.startsWith(y));
  const decided = yearOffers.filter((o) => ['angenommen', 'abgerechnet', 'abgelehnt'].includes(o.status));
  const won = decided.filter((o) => o.status !== 'abgelehnt');
  const pending = offers.filter((o) => ['versendet', 'entwurf'].includes(o.status));
  const drafts = D.listDocuments({ kind: 'rechnungen' }).filter((d) => !d.finalized_at);

  const topCustomers = all(
    `SELECT c.id, c.company, c.first_name, c.last_name, SUM(d.net - d.prepaid_net) AS revenue FROM documents d JOIN customers c ON c.id = d.customer_id
     WHERE d.${invoiceWhere.replace(/ AND finalized_at/, ' AND d.finalized_at')} AND d.type <> 'storno' AND d.status <> 'storniert' AND substr(d.date,1,4) = ?
     GROUP BY c.id ORDER BY revenue DESC LIMIT 5`, y
  ).map((r) => ({ ...r, name: r.company || [r.first_name, r.last_name].filter(Boolean).join(' ') }));

  res.json({
    year,
    revenue,
    months,
    open: { count: openInvoices.length, sum: openInvoices.reduce((s, d) => s + d.open, 0) },
    overdue: { count: overdue.length, sum: overdue.reduce((s, d) => s + d.open, 0), list: overdue.slice(0, 8) },
    offers: {
      pending_count: pending.length,
      pending_sum: pending.reduce((s, o) => s + o.net, 0),
      rate: decided.length ? (won.length / decided.length) * 100 : null,
      won_sum: won.reduce((s, o) => s + o.net, 0),
      expiring: pending.filter((o) => o.valid_until && o.valid_until >= today && o.valid_until <= D.addDays(today, 7)).slice(0, 6),
      followup: pending.filter((o) => o.status === 'versendet').slice(0, 6),
    },
    drafts: drafts.slice(0, 6),
    top_customers: topCustomers,
    customers: get('SELECT COUNT(*) AS n FROM customers WHERE archived = 0').n,
    activity: all(
      `SELECT a.*, u.name AS user_name FROM activity a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 12`
    ),
    years: all("SELECT DISTINCT substr(date,1,4) AS y FROM documents ORDER BY y DESC").map((r) => Number(r.y)),
  });
});

api.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ customers: [], documents: [] });
  const customers = all(
    `SELECT id, number, company, first_name, last_name, city FROM customers WHERE archived = 0 AND (number LIKE ? OR company LIKE ? OR last_name LIKE ? OR first_name LIKE ? OR city LIKE ?) LIMIT 6`,
    ...Array(5).fill(`%${q}%`)
  ).map((c) => ({ ...c, display_name: D.customerDisplayName(c) }));
  const documents = D.listDocuments({ q }).slice(0, 8);
  res.json({ customers, documents });
});

/* ================================================================== */
/* Einstellungen                                                       */
/* ================================================================== */
api.get('/settings', (req, res) => {
  const s = allSettings();
  s.mail = { ...s.mail, pass: s.mail.pass ? '********' : '' };
  s.has_logo = !!pdf.logoPath();
  res.json(s);
});

api.put('/settings/:key', auth.requireAdmin, (req, res) => {
  const key = req.params.key;
  if (!(key in DEFAULTS)) throw new HttpError(400, 'Unbekannte Einstellung.');
  let value = req.body;
  if (key === 'mail') {
    const old = getSetting('mail');
    value = { ...old, ...value, port: Number(value.port) || 587, secure: !!value.secure, bcc_self: !!value.bcc_self };
    value.pass = value.pass === '********' ? old.pass : auth.encrypt(value.pass);
  }
  setSetting(key, value);
  logActivity(req.user.id, 'settings', null, `Einstellungen „${key}" geändert`);
  res.json({ ok: true });
});

api.post('/settings/logo', auth.requireAdmin, upload.single('logo'), (req, res) => {
  if (!req.file || !/image\/(png|jpe?g)/.test(req.file.mimetype)) throw new HttpError(400, 'Bitte ein PNG- oder JPG-Bild hochladen.');
  for (const f of pdf.LOGO_FILES) fs.rmSync(path.join(DATA_DIR, f), { force: true });
  fs.writeFileSync(path.join(DATA_DIR, req.file.mimetype === 'image/png' ? 'logo.png' : 'logo.jpg'), req.file.buffer);
  res.json({ ok: true });
});

api.delete('/settings/logo', auth.requireAdmin, (req, res) => {
  for (const f of pdf.LOGO_FILES) fs.rmSync(path.join(DATA_DIR, f), { force: true });
  res.json({ ok: true });
});

api.get('/logo', (req, res) => {
  const p = pdf.logoPath();
  if (!p) return res.status(404).end();
  res.sendFile(p);
});

api.post('/mail/test', auth.requireAdmin, async (req, res) => {
  try {
    await mail.testConnection();
  } catch (e) {
    throw new HttpError(502, `Verbindung fehlgeschlagen: ${e.message}`);
  }
  const m = getSetting('mail');
  await mail.sendMail({
    to: req.body?.to || m.from_email,
    subject: 'BauDaH Office – Testnachricht',
    body: 'Der E-Mail-Versand aus BauDaH Office funktioniert.\n\n' + m.signature,
    userId: req.user.id,
  });
  res.json({ ok: true });
});

api.get('/mail/log', (req, res) => {
  res.json(all(
    `SELECT e.id, e.document_id, e.to_addr, e.subject, e.status, e.error, e.attachments, e.created_at, d.number, d.type
     FROM email_log e LEFT JOIN documents d ON d.id = e.document_id ORDER BY e.id DESC LIMIT 200`
  ));
});

/* ---------------- Benutzer ---------------- */
api.get('/users', auth.requireAdmin, (req, res) => {
  res.json(all('SELECT id, username, name, email, role, active, created_at FROM users ORDER BY id'));
});
api.post('/users', auth.requireAdmin, (req, res) => {
  const { username, name, email, password, role } = req.body || {};
  if (!username || String(password || '').length < 8) throw new HttpError(400, 'Benutzername und Passwort (mind. 8 Zeichen) erforderlich.');
  if (get('SELECT 1 FROM users WHERE username = ?', username)) throw new HttpError(400, 'Benutzername ist bereits vergeben.');
  run('INSERT INTO users(username, name, email, password, role) VALUES(?,?,?,?,?)', username.trim(), name || '', email || '', auth.hashPassword(password), role === 'admin' ? 'admin' : 'user');
  res.json({ ok: true });
});
api.put('/users/:id', auth.requireAdmin, (req, res) => {
  const { name, email, role, active, password } = req.body || {};
  const id = Number(req.params.id);
  if (id === req.user.id && (active === false || role === 'user')) throw new HttpError(400, 'Sie können sich nicht selbst sperren oder herabstufen.');
  run('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), active = COALESCE(?, active) WHERE id = ?',
    name ?? null, email ?? null, role ? (role === 'admin' ? 'admin' : 'user') : null, active === undefined ? null : active ? 1 : 0, id);
  if (password) {
    if (String(password).length < 8) throw new HttpError(400, 'Passwort mind. 8 Zeichen.');
    run('UPDATE users SET password = ? WHERE id = ?', auth.hashPassword(password), id);
    run('DELETE FROM sessions WHERE user_id = ?', id);
  }
  res.json({ ok: true });
});
api.delete('/users/:id', auth.requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id) throw new HttpError(400, 'Sie können sich nicht selbst löschen.');
  run('UPDATE users SET active = 0 WHERE id = ?', req.params.id);
  run('DELETE FROM sessions WHERE user_id = ?', req.params.id);
  res.json({ ok: true });
});

/* ---------------- Datensicherung ---------------- */
api.get('/backups', auth.requireAdmin, (req, res) => res.json(backup.list()));
api.post('/backups', auth.requireAdmin, (req, res) => res.json(backup.create('manuell')));
api.get('/backups/:name', auth.requireAdmin, (req, res) => {
  const p = backup.file(req.params.name);
  res.download(p);
});
api.get('/backup/download', auth.requireAdmin, (req, res) => {
  const info = backup.create('download');
  res.download(backup.file(info.name));
});

api.get('/activity', (req, res) => {
  res.json(all('SELECT a.*, u.name AS user_name FROM activity a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 300'));
});

/* ================================================================== */
/* CSV-Helfer                                                          */
/* ================================================================== */
function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsv(text) {
  const sep = (text.split('\n')[0].match(/;/g) || []).length >= (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

/* ================================================================== */
/* Fehlerbehandlung                                                    */
/* ================================================================== */
// eslint-disable-next-line no-unused-vars
api.use((err, req, res, next) => {
  const status = err.status || (err.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) console.error(err);
  let message = err.message || 'Unbekannter Fehler';
  if (err.code === 'LIMIT_FILE_SIZE') message = 'Die Datei ist zu groß (max. 3 MB).';
  if (/UNIQUE constraint/.test(message)) message = 'Dieser Eintrag existiert bereits (Nummer doppelt).';
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 400 : status).json({ error: status >= 500 && !err.status ? `Interner Fehler: ${message}` : message });
});

module.exports = api;
