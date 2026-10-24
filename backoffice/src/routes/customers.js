'use strict';
const express = require('express');
const multer = require('multer');
const db = require('../db');
const f = require('../lib/format');
const csv = require('../lib/csv');
const audit = require('../lib/audit');
const numbering = require('../lib/numbering');
const sec = require('../lib/security');
const { wrap, id, paginate, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('customers'));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const FIELDS = ['type', 'company', 'salutation', 'first_name', 'last_name', 'email', 'phone', 'mobile', 'website', 'street', 'zip', 'city', 'country', 'vat_id', 'leitweg_id', 'tags', 'notes', 'status'];

function fromBody(body) {
  const d = clean(body, FIELDS);
  d.type = ['firma', 'privat', 'behoerde'].includes(d.type) ? d.type : 'firma';
  d.status = ['aktiv', 'interessent', 'inaktiv'].includes(d.status) ? d.status : 'aktiv';
  d.country = (d.country || 'DE').toUpperCase().slice(0, 2);
  d.payment_terms = body.payment_terms === '' || body.payment_terms === undefined ? null : Number(body.payment_terms) || 0;
  d.discount_pct = f.parseNumber(body.discount_pct, 0);
  d.gdpr_consent = body.gdpr_consent ? 1 : 0;
  if (!d.company && !d.last_name) throw new UserError('Bitte Firma oder Nachname angeben.');
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw new UserError('E-Mail-Adresse ist ungültig.');
  return d;
}

function insert(d, userId) {
  const number = numbering.next('customer');
  const r = db.run(
    `INSERT INTO customers (number, ${FIELDS.join(', ')}, payment_terms, discount_pct, gdpr_consent, created_by)
     VALUES (?, ${FIELDS.map(() => '?').join(', ')}, ?, ?, ?, ?)`,
    number, ...FIELDS.map((k) => d[k] ?? null), d.payment_terms ?? null, d.discount_pct ?? 0, d.gdpr_consent ? 1 : 0, userId,
  );
  return Number(r.lastInsertRowid);
}

router.get('/', (req, res) => {
  const where = ['anonymized = 0'];
  const params = [];
  if (req.query.q) {
    where.push('(company LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR number LIKE ? OR city LIKE ? OR tags LIKE ?)');
    params.push(...Array(7).fill(`%${req.query.q}%`));
  }
  if (req.query.status) { where.push('status = ?'); params.push(req.query.status); }
  if (req.query.type) { where.push('type = ?'); params.push(req.query.type); }
  const w = where.join(' AND ');
  const total = db.get(`SELECT COUNT(*) AS n FROM customers WHERE ${w}`, ...params).n;
  const p = paginate(total, req.query.page);
  const sort = { name: "COALESCE(company, last_name) COLLATE NOCASE", number: 'number', city: 'city', created: 'created_at DESC' }[req.query.sort] || "COALESCE(company, last_name) COLLATE NOCASE";
  const rows = db.all(
    `SELECT c.*, (SELECT COALESCE(SUM(net_total),0) FROM documents_sales d WHERE d.customer_id = c.id AND d.kind IN ('rechnung','storno') AND d.finalized_at IS NOT NULL) AS revenue,
       (SELECT COALESCE(SUM(gross_total - paid_total),0) FROM documents_sales d WHERE d.customer_id = c.id AND d.kind='rechnung' AND d.status IN ('offen','teilbezahlt')) AS open
     FROM customers c WHERE ${w} ORDER BY ${sort} LIMIT ? OFFSET ?`, ...params, p.limit, p.offset,
  );
  res.render('customers/index', { title: 'Kunden', rows, p });
});

router.get('/neu', (req, res) => {
  res.render('customers/form', { title: 'Neuer Kunde', c: { type: 'firma', country: 'DE', status: 'aktiv', ...req.query } });
});

router.post('/', wrap((req, res) => {
  const newId = insert(fromBody(req.body), req.user.id);
  audit.log(req, 'kunde.angelegt', 'customer', newId);
  req.flash('success', 'Kunde angelegt.');
  res.redirect(`/kunden/${newId}`);
}));

router.get('/export.csv', (req, res) => {
  const rows = db.all('SELECT * FROM customers WHERE anonymized = 0 ORDER BY number');
  const headers = ['number', ...FIELDS, 'payment_terms', 'discount_pct', 'created_at'];
  res.type('text/csv; charset=utf-8').attachment(`kunden-${f.today()}.csv`).send(csv.stringify(headers, rows.map((r) => headers.map((h) => r[h]))));
});

router.get('/import', (req, res) => res.render('customers/import', { title: 'Kunden importieren', fields: FIELDS }));

router.post('/import', upload.single('file'), wrap((req, res) => {
  if (!req.file) throw new UserError('Bitte eine CSV-Datei auswählen.');
  // Deutsche Spaltennamen (z. B. aus Excel oder anderen Programmen) werden automatisch zugeordnet
  const ALIASES = {
    firma: 'company', unternehmen: 'company', anrede: 'salutation', vorname: 'first_name', nachname: 'last_name', name: 'last_name',
    'e-mail': 'email', mail: 'email', telefon: 'phone', tel: 'phone', handy: 'mobile', mobil: 'mobile', webseite: 'website',
    strasse: 'street', 'straße': 'street', plz: 'zip', ort: 'city', stadt: 'city', land: 'country', 'ust-idnr': 'vat_id',
    notizen: 'notes', typ: 'type', zahlungsziel: 'payment_terms', rabatt: 'discount_pct',
  };
  const rows = csv.parse(req.file.buffer.toString('utf8'))
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [ALIASES[k] || k, v])));
  let ok = 0;
  const errors = [];
  db.tx(() => {
    rows.forEach((r, i) => {
      try {
        insert(fromBody(r), req.user.id);
        ok++;
      } catch (e) {
        errors.push(`Zeile ${i + 2}: ${e.message}`);
      }
    });
  });
  audit.log(req, 'kunde.import', 'customer', null, { ok, errors: errors.length });
  req.flash(errors.length ? 'warning' : 'success', `${ok} Kunden importiert.${errors.length ? ` ${errors.length} Fehler: ${errors.slice(0, 5).join('; ')}` : ''}`);
  res.redirect('/kunden');
}));

router.get('/:id', wrap((req, res) => {
  const c = db.get('SELECT * FROM customers WHERE id = ?', id(req.params.id));
  if (!c) return notFound(res, 'Kunde');
  const docs = sec.can(req.user, 'sales') ? db.all('SELECT * FROM documents_sales WHERE customer_id = ? ORDER BY issue_date DESC, id DESC', c.id) : [];
  const stats = {
    revenue: db.get("SELECT COALESCE(SUM(net_total),0) AS s FROM documents_sales WHERE customer_id = ? AND kind IN ('rechnung','storno') AND finalized_at IS NOT NULL", c.id).s,
    open: db.get("SELECT COALESCE(SUM(gross_total - paid_total),0) AS s FROM documents_sales WHERE customer_id = ? AND kind='rechnung' AND status IN ('offen','teilbezahlt')", c.id).s,
    hours: db.get('SELECT COALESCE(SUM(minutes),0) AS s FROM time_entries WHERE customer_id = ? OR project_id IN (SELECT id FROM projects WHERE customer_id = ?)', c.id, c.id).s,
  };
  res.render('customers/show', {
    title: f.customerName(c), c, docs, stats,
    contacts: db.all('SELECT * FROM contacts WHERE customer_id = ? ORDER BY is_primary DESC, name', c.id),
    activities: db.all('SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE customer_id = ? ORDER BY a.created_at DESC LIMIT 50', c.id),
    projects: db.all('SELECT * FROM projects WHERE customer_id = ? ORDER BY created_at DESC', c.id),
    files: db.all('SELECT * FROM files WHERE customer_id = ? ORDER BY created_at DESC', c.id),
    appointments: db.all('SELECT * FROM appointments WHERE customer_id = ? ORDER BY starts_at DESC LIMIT 10', c.id),
  });
}));

router.get('/:id/bearbeiten', wrap((req, res) => {
  const c = db.get('SELECT * FROM customers WHERE id = ?', id(req.params.id));
  if (!c) return notFound(res, 'Kunde');
  res.render('customers/form', { title: `${f.customerName(c)} bearbeiten`, c });
}));

router.post('/:id', wrap((req, res) => {
  const cid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(
    `UPDATE customers SET ${FIELDS.map((k) => `${k} = ?`).join(', ')}, payment_terms = ?, discount_pct = ?, gdpr_consent = ?, updated_at = datetime('now') WHERE id = ?`,
    ...FIELDS.map((k) => d[k]), d.payment_terms, d.discount_pct, d.gdpr_consent, cid,
  );
  audit.log(req, 'kunde.geaendert', 'customer', cid);
  req.flash('success', 'Kunde gespeichert.');
  res.redirect(`/kunden/${cid}`);
}));

router.post('/:id/loeschen', sec.requirePerm('sales'), wrap((req, res) => {
  const cid = id(req.params.id);
  const n = db.get('SELECT COUNT(*) AS n FROM documents_sales WHERE customer_id = ?', cid).n;
  if (n > 0) throw new UserError('Kunde hat Belege und kann nicht gelöscht werden. Setze ihn auf „inaktiv“ oder anonymisiere ihn (DSGVO).');
  db.run('DELETE FROM customers WHERE id = ?', cid);
  audit.log(req, 'kunde.geloescht', 'customer', cid);
  req.flash('success', 'Kunde gelöscht.');
  res.redirect('/kunden');
}));

// ---------- Ansprechpartner & Aktivitäten ----------
router.post('/:id/kontakte', wrap((req, res) => {
  const cid = id(req.params.id);
  const d = clean(req.body, ['name', 'position', 'email', 'phone']);
  if (!d.name) throw new UserError('Name fehlt.');
  db.run('INSERT INTO contacts (customer_id, name, position, email, phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)', cid, d.name, d.position, d.email, d.phone, req.body.is_primary ? 1 : 0);
  res.redirect(`/kunden/${cid}#kontakte`);
}));

router.post('/:id/kontakte/:cid/loeschen', wrap((req, res) => {
  db.run('DELETE FROM contacts WHERE id = ? AND customer_id = ?', id(req.params.cid), id(req.params.id));
  res.redirect(`/kunden/${req.params.id}#kontakte`);
}));

router.post('/:id/aktivitaeten', wrap((req, res) => {
  const cid = id(req.params.id);
  const d = clean(req.body, ['type', 'subject', 'body']);
  if (!d.subject) throw new UserError('Betreff fehlt.');
  db.run('INSERT INTO activities (customer_id, type, subject, body, user_id) VALUES (?, ?, ?, ?, ?)', cid, ['notiz', 'anruf', 'email', 'termin', 'besuch'].includes(d.type) ? d.type : 'notiz', d.subject, d.body, req.user.id);
  res.redirect(`/kunden/${cid}#aktivitaeten`);
}));

// ---------- DSGVO ----------
router.get('/:id/dsgvo-export', wrap((req, res) => {
  const cid = id(req.params.id);
  const c = db.get('SELECT * FROM customers WHERE id = ?', cid);
  if (!c) return notFound(res, 'Kunde');
  const data = {
    exportiert_am: new Date().toISOString(),
    hinweis: 'Auskunft nach Art. 15 DSGVO',
    stammdaten: c,
    ansprechpartner: db.all('SELECT * FROM contacts WHERE customer_id = ?', cid),
    aktivitaeten: db.all('SELECT type, subject, body, created_at FROM activities WHERE customer_id = ?', cid),
    belege: db.all('SELECT kind, number, issue_date, gross_total, status FROM documents_sales WHERE customer_id = ?', cid),
    projekte: db.all('SELECT number, name, status FROM projects WHERE customer_id = ?', cid),
    termine: db.all('SELECT title, starts_at, ends_at, location FROM appointments WHERE customer_id = ?', cid),
    anfragen: db.all('SELECT name, email, phone, subject, message, created_at FROM leads WHERE customer_id = ?', cid),
  };
  audit.log(req, 'kunde.dsgvo_export', 'customer', cid);
  res.attachment(`dsgvo-auskunft-${c.number}.json`).json(data);
}));

// Anonymisieren statt löschen: Belege müssen 8–10 Jahre aufbewahrt werden (§ 147 AO, § 14b UStG).
// Die eingefrorenen Kundendaten auf festgeschriebenen Rechnungen bleiben deshalb erhalten.
router.post('/:id/anonymisieren', sec.requirePerm('sales'), wrap((req, res) => {
  const cid = id(req.params.id);
  db.tx(() => {
    db.run(
      `UPDATE customers SET company = NULL, salutation = NULL, first_name = 'Anonymisiert', last_name = ?, email = NULL, phone = NULL, mobile = NULL,
       website = NULL, street = NULL, zip = NULL, city = NULL, vat_id = NULL, notes = NULL, tags = NULL, status = 'inaktiv', anonymized = 1,
       updated_at = datetime('now') WHERE id = ?`, `#${cid}`, cid,
    );
    db.run('DELETE FROM contacts WHERE customer_id = ?', cid);
    db.run('DELETE FROM activities WHERE customer_id = ?', cid);
    db.run("UPDATE leads SET name = 'Anonymisiert', email = NULL, phone = NULL, message = NULL, company = NULL WHERE customer_id = ?", cid);
  });
  audit.log(req, 'kunde.anonymisiert', 'customer', cid);
  req.flash('success', 'Kunde wurde anonymisiert. Festgeschriebene Rechnungen bleiben wegen der gesetzlichen Aufbewahrungspflicht unverändert.');
  res.redirect('/kunden');
}));

module.exports = router;
module.exports.insertCustomer = insert;
module.exports.customerFromBody = fromBody;
