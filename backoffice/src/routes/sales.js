'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const sales = require('../lib/sales');
const pdf = require('../lib/pdf');
const xrechnung = require('../lib/xrechnung');
const settings = require('../lib/settings');
const mailer = require('../lib/mailer');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { wrap, id, paginate, notFound, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('sales'));

const KIND_ROUTES = { angebote: 'angebot', auftraege: 'auftrag', rechnungen: 'rechnung', stornos: 'storno' };
const KIND_PLURAL = { angebot: 'Angebote', auftrag: 'Auftragsbestätigungen', rechnung: 'Rechnungen', storno: 'Stornorechnungen' };
const ROUTE_OF = Object.fromEntries(Object.entries(KIND_ROUTES).map(([k, v]) => [v, k]));

router.get('/', (req, res) => res.redirect('/belege/rechnungen'));

// ---------- Listen ----------
router.get('/:kind(angebote|auftraege|rechnungen|stornos)', (req, res) => {
  const kind = KIND_ROUTES[req.params.kind];
  const where = ['d.kind = ?'];
  const params = [kind];
  const today = f.today();
  if (req.query.status === 'ueberfaellig') { where.push("d.status IN ('offen','teilbezahlt') AND d.due_date < ?"); params.push(today); }
  else if (req.query.status) { where.push('d.status = ?'); params.push(req.query.status); }
  if (req.query.q) {
    where.push('(d.number LIKE ? OR d.title LIKE ? OR c.company LIKE ? OR c.last_name LIKE ?)');
    params.push(...Array(4).fill(`%${req.query.q}%`));
  }
  if (req.query.von) { where.push('d.issue_date >= ?'); params.push(req.query.von); }
  if (req.query.bis) { where.push('d.issue_date <= ?'); params.push(req.query.bis); }
  const w = where.join(' AND ');
  const total = db.get(`SELECT COUNT(*) AS n FROM documents_sales d JOIN customers c ON c.id = d.customer_id WHERE ${w}`, ...params).n;
  const p = paginate(total, req.query.page, 30);
  const rows = db.all(
    `SELECT d.*, c.company, c.first_name, c.last_name, c.email AS customer_email FROM documents_sales d JOIN customers c ON c.id = d.customer_id
     WHERE ${w} ORDER BY d.issue_date DESC, d.id DESC LIMIT ? OFFSET ?`, ...params, p.limit, p.offset,
  );
  const sums = db.get(`SELECT COALESCE(SUM(d.net_total),0) AS net, COALESCE(SUM(d.gross_total),0) AS gross, COALESCE(SUM(d.gross_total - d.paid_total),0) AS open FROM documents_sales d JOIN customers c ON c.id = d.customer_id WHERE ${w}`, ...params);
  res.render('sales/index', { title: KIND_PLURAL[kind], kind, route: req.params.kind, rows, p, sums, today, statuses: sales.STATUS[kind] });
});

// ---------- Neu / Bearbeiten ----------
function formData(kind, doc = {}) {
  const s = settings.all();
  const today = f.today();
  return {
    kind,
    customer_id: doc.customer_id || '',
    project_id: doc.project_id || '',
    title: doc.title ?? '',
    intro: doc.intro ?? (kind === 'angebot' ? s.quote_intro : kind === 'auftrag' ? s.order_intro : s.invoice_intro),
    footer: doc.footer ?? (kind === 'angebot' ? s.quote_footer : kind === 'rechnung' ? s.invoice_footer : ''),
    issue_date: doc.issue_date || today,
    service_date: doc.service_date ?? (kind === 'rechnung' ? today : ''),
    service_until: doc.service_until || '',
    due_date: doc.due_date ?? (kind === 'rechnung' ? f.addDays(today, Number(s.payment_terms_days)) : ''),
    valid_until: doc.valid_until ?? (kind === 'angebot' ? f.addDays(today, Number(s.quote_valid_days)) : ''),
    reverse_charge: doc.reverse_charge || 0,
    items: doc.items && doc.items.length ? doc.items : [{ name: '', quantity: 1, unit: 'Stk.', unit_price: 0, tax_rate: Number(s.default_tax_rate), discount_pct: 0 }],
  };
}

function lookups() {
  return {
    customers: db.all("SELECT id, number, company, first_name, last_name, payment_terms, discount_pct FROM customers WHERE anonymized = 0 AND status != 'inaktiv' ORDER BY COALESCE(company, last_name) COLLATE NOCASE"),
    projects: db.all("SELECT id, number, name, customer_id FROM projects WHERE status NOT IN ('abgeschlossen','storniert') ORDER BY name"),
    products: db.all('SELECT * FROM products WHERE active = 1 ORDER BY name'),
  };
}

router.get('/:kind(angebote|auftraege|rechnungen)/neu', (req, res) => {
  const kind = KIND_ROUTES[req.params.kind];
  const d = formData(kind, { customer_id: Number(req.query.kunde) || '', project_id: Number(req.query.projekt) || '' });
  res.render('sales/form', { title: `${sales.KIND_LABELS[kind]} erstellen`, d, route: req.params.kind, ...lookups() });
});

function dataFromBody(body) {
  const customerId = Number(body.customer_id);
  if (!customerId || !db.get('SELECT id FROM customers WHERE id = ?', customerId)) throw new UserError('Bitte einen Kunden auswählen.');
  const isDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);
  const issue = isDate(body.issue_date);
  if (!issue) throw new UserError('Belegdatum fehlt.');
  return {
    customer_id: customerId, project_id: Number(body.project_id) || null, title: String(body.title || '').trim(),
    intro: String(body.intro || ''), footer: String(body.footer || ''), issue_date: issue,
    service_date: isDate(body.service_date), service_until: isDate(body.service_until), due_date: isDate(body.due_date),
    valid_until: isDate(body.valid_until), reverse_charge: body.reverse_charge ? 1 : 0,
  };
}

router.post('/:kind(angebote|auftraege|rechnungen)', wrap((req, res) => {
  const kind = KIND_ROUTES[req.params.kind];
  const items = sales.itemsFromForm(req.body);
  if (!items.length) throw new UserError('Bitte mindestens eine Position erfassen.');
  const newId = sales.save({ kind, data: dataFromBody(req.body), items, userId: req.user.id });
  audit.log(req, `${kind}.angelegt`, 'document', newId);
  if (req.body.after === 'finalize') return finalizeAndRedirect(req, res, newId);
  req.flash('success', `${sales.KIND_LABELS[kind]} gespeichert.`);
  res.redirect(`/belege/${newId}`);
}));

function finalizeAndRedirect(req, res, docId) {
  if (!sec.can(req.user, 'sales.finalize')) throw new UserError('Keine Berechtigung zum Festschreiben.');
  const number = sales.finalize(docId);
  audit.log(req, 'beleg.festgeschrieben', 'document', docId, { number });
  req.flash('success', `Beleg ${number} wurde festgeschrieben.`);
  res.redirect(`/belege/${docId}`);
}

router.get('/:id(\\d+)', wrap((req, res) => {
  const d = sales.load(id(req.params.id));
  if (!d) return notFound(res, 'Beleg');
  const related = db.all('SELECT id, kind, number, status, issue_date FROM documents_sales WHERE ref_id = ? OR id = ?', d.id, d.ref_id || 0);
  const recurring = db.get('SELECT * FROM recurring_invoices WHERE template_id = ?', d.id);
  const history = db.all("SELECT * FROM audit_log WHERE entity = 'document' AND entity_id = ? ORDER BY id DESC LIMIT 30", d.id);
  res.render('sales/show', { title: `${sales.KIND_LABELS[d.kind]} ${d.number || '(Entwurf)'}`, d, related, recurring, history, route: ROUTE_OF[d.kind], mailEnabled: mailer.enabled() });
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const d = sales.load(id(req.params.id));
  if (!d) return notFound(res, 'Beleg');
  if (d.finalized_at && ['rechnung', 'storno'].includes(d.kind)) {
    req.flash('warning', 'Festgeschriebene Rechnungen können nicht bearbeitet werden (GoBD). Erstelle bei Bedarf eine Stornorechnung.');
    return res.redirect(`/belege/${d.id}`);
  }
  res.render('sales/form', { title: `${sales.KIND_LABELS[d.kind]} bearbeiten`, d: { ...formData(d.kind, d), id: d.id, number: d.number }, route: ROUTE_OF[d.kind], ...lookups() });
}));

router.post('/:id(\\d+)', wrap((req, res) => {
  const docId = id(req.params.id);
  const existing = db.get('SELECT kind FROM documents_sales WHERE id = ?', docId);
  if (!existing) return notFound(res, 'Beleg');
  const items = sales.itemsFromForm(req.body);
  if (!items.length) throw new UserError('Bitte mindestens eine Position erfassen.');
  sales.save({ id: docId, kind: existing.kind, data: dataFromBody(req.body), items, userId: req.user.id });
  audit.log(req, 'beleg.geaendert', 'document', docId);
  if (req.body.after === 'finalize') return finalizeAndRedirect(req, res, docId);
  req.flash('success', 'Gespeichert.');
  res.redirect(`/belege/${docId}`);
}));

router.post('/:id(\\d+)/festschreiben', sec.requirePerm('sales.finalize'), wrap((req, res) => finalizeAndRedirect(req, res, id(req.params.id))));

router.post('/:id(\\d+)/status', wrap((req, res) => {
  const docId = id(req.params.id);
  const d = db.get('SELECT * FROM documents_sales WHERE id = ?', docId);
  const allowed = { angebot: ['entwurf', 'versendet', 'angenommen', 'abgelehnt', 'abgelaufen'], auftrag: ['entwurf', 'versendet', 'in_bearbeitung', 'abgeschlossen'] }[d.kind];
  if (!allowed || !allowed.includes(req.body.status)) throw new UserError('Status kann hier nicht gesetzt werden.');
  db.run("UPDATE documents_sales SET status = ?, updated_at = datetime('now') WHERE id = ?", req.body.status, docId);
  audit.log(req, 'beleg.status', 'document', docId, { status: req.body.status });
  res.redirect(`/belege/${docId}`);
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const docId = id(req.params.id);
  const d = db.get('SELECT kind FROM documents_sales WHERE id = ?', docId);
  sales.remove(docId);
  audit.log(req, 'beleg.geloescht', 'document', docId);
  req.flash('success', 'Beleg gelöscht.');
  res.redirect(`/belege/${ROUTE_OF[d?.kind] || 'rechnungen'}`);
}));

// ---------- Ausgabe: PDF / XRechnung ----------
router.get('/:id(\\d+)/pdf', wrap(async (req, res) => {
  const d = sales.load(id(req.params.id));
  if (!d) return notFound(res, 'Beleg');
  const buf = await pdf.salesDocument(d);
  const name = `${sales.KIND_LABELS[d.kind]}_${d.number || 'Entwurf-' + d.id}.pdf`.replace(/[^\w.-]+/g, '_');
  res.type('application/pdf').set('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${name}"`).send(buf);
}));

router.get('/:id(\\d+)/xrechnung.xml', wrap((req, res) => {
  const d = sales.load(id(req.params.id));
  if (!d || !['rechnung', 'storno'].includes(d.kind) || !d.finalized_at) throw new UserError('XRechnung nur für festgeschriebene Rechnungen.');
  if (d.ref_id) d.ref_number = db.get('SELECT number FROM documents_sales WHERE id = ?', d.ref_id)?.number;
  audit.log(req, 'beleg.xrechnung_export', 'document', d.id);
  res.type('application/xml').attachment(`XRechnung_${d.number}.xml`).send(xrechnung.build(d));
}));

router.get('/:id(\\d+)/mahnung/:level/pdf', wrap(async (req, res) => {
  const d = sales.load(id(req.params.id));
  const dn = d && d.dunnings.find((x) => x.level === Number(req.params.level));
  if (!dn) return notFound(res, 'Mahnung');
  res.type('application/pdf').set('Content-Disposition', `inline; filename="Mahnung_${dn.level}_${d.number}.pdf"`).send(await pdf.dunningLetter(d, dn));
}));

// ---------- Versand per E-Mail ----------
router.post('/:id(\\d+)/senden', wrap(async (req, res) => {
  const d = sales.load(id(req.params.id));
  if (!d) return notFound(res, 'Beleg');
  if (['rechnung', 'storno'].includes(d.kind) && !d.finalized_at) throw new UserError('Bitte die Rechnung vor dem Versand festschreiben.');
  const to = String(req.body.to || d.snapshot.email || '').trim();
  if (!to) throw new UserError('Keine E-Mail-Adresse hinterlegt.');
  const s = settings.all();
  const key = d.kind === 'angebot' ? 'quote' : 'invoice';
  const attachments = [{ filename: `${sales.KIND_LABELS[d.kind]}_${d.number}.pdf`, content: await pdf.salesDocument(d) }];
  if (d.kind === 'rechnung' && req.body.xrechnung) attachments.push({ filename: `XRechnung_${d.number}.xml`, content: xrechnung.build(d) });
  const result = await mailer.send({
    to,
    subject: req.body.subject || sales.fillPlaceholders(s[`email_${key}_subject`], d),
    text: req.body.text || sales.fillPlaceholders(s[`email_${key}_body`], d),
    attachments,
    replyTo: s.company_email,
  });
  db.run("UPDATE documents_sales SET sent_at = datetime('now'), status = CASE WHEN status = 'entwurf' THEN 'versendet' ELSE status END WHERE id = ?", d.id);
  audit.log(req, 'beleg.versendet', 'document', d.id, { to });
  req.flash(result.simulated ? 'warning' : 'success', result.simulated ? 'SMTP ist nicht eingerichtet – Versand wurde nur simuliert (siehe Server-Log).' : `Beleg an ${to} gesendet.`);
  res.redirect(`/belege/${d.id}`);
}));

// ---------- Zahlungen ----------
router.post('/:id(\\d+)/zahlungen', sec.requirePerm('payments'), wrap((req, res) => {
  const docId = id(req.params.id);
  sales.addPayment(docId, { amount: f.parseMoney(req.body.amount), paid_at: req.body.paid_at, method: req.body.method, note: req.body.note }, req.user.id);
  audit.log(req, 'zahlung.erfasst', 'document', docId, { amount: req.body.amount });
  req.flash('success', 'Zahlung erfasst.');
  res.redirect(`/belege/${docId}`);
}));

router.post('/zahlungen/:pid/loeschen', sec.requirePerm('payments'), wrap((req, res) => {
  const docId = sales.deletePayment(id(req.params.pid));
  audit.log(req, 'zahlung.geloescht', 'document', docId, { payment: req.params.pid });
  res.redirect(`/belege/${docId}`);
}));

// ---------- Umwandeln, Duplizieren, Stornieren, Mahnen ----------
router.post('/:id(\\d+)/umwandeln', wrap((req, res) => {
  const target = ['auftrag', 'rechnung'].includes(req.body.target) ? req.body.target : 'rechnung';
  const newId = sales.convert(id(req.params.id), target, req.user.id);
  audit.log(req, 'beleg.umgewandelt', 'document', newId, { from: req.params.id });
  req.flash('success', `${sales.KIND_LABELS[target]} wurde erstellt – bitte prüfen und speichern.`);
  res.redirect(`/belege/${newId}/bearbeiten`);
}));

router.post('/:id(\\d+)/duplizieren', wrap((req, res) => {
  const newId = sales.duplicate(id(req.params.id), req.user.id);
  audit.log(req, 'beleg.dupliziert', 'document', newId, { from: req.params.id });
  req.flash('success', 'Kopie erstellt.');
  res.redirect(`/belege/${newId}/bearbeiten`);
}));

router.post('/:id(\\d+)/stornieren', sec.requirePerm('sales.finalize'), wrap((req, res) => {
  const newId = sales.createStorno(id(req.params.id), req.user.id);
  audit.log(req, 'rechnung.storniert', 'document', id(req.params.id), { storno: newId });
  req.flash('success', 'Stornorechnung erstellt. Die Originalrechnung bleibt unverändert archiviert.');
  res.redirect(`/belege/${newId}`);
}));

router.post('/:id(\\d+)/mahnen', wrap((req, res) => {
  const docId = id(req.params.id);
  const level = sales.createDunning(docId, req.user.id);
  audit.log(req, 'rechnung.gemahnt', 'document', docId, { level });
  req.flash('success', `Mahnstufe ${level} erstellt.`);
  res.redirect(`/belege/${docId}`);
}));

// ---------- Wiederkehrende Rechnungen ----------
router.get('/wiederkehrend', (req, res) => {
  const rows = db.all(
    `SELECT r.*, d.title, d.net_total, d.number, c.company, c.first_name, c.last_name FROM recurring_invoices r
     JOIN documents_sales d ON d.id = r.template_id JOIN customers c ON c.id = d.customer_id ORDER BY r.next_date`,
  );
  res.render('sales/recurring', { title: 'Wiederkehrende Rechnungen', rows });
});

router.post('/:id(\\d+)/wiederkehrend', wrap((req, res) => {
  const docId = id(req.params.id);
  const interval = ['monatlich', 'quartalsweise', 'halbjaehrlich', 'jaehrlich'].includes(req.body.interval) ? req.body.interval : 'monatlich';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.next_date || '')) throw new UserError('Startdatum fehlt.');
  db.run('DELETE FROM recurring_invoices WHERE template_id = ?', docId);
  db.run('INSERT INTO recurring_invoices (template_id, interval, next_date, end_date, auto_finalize) VALUES (?, ?, ?, ?, ?)', docId, interval, req.body.next_date, req.body.end_date || null, req.body.auto_finalize ? 1 : 0);
  audit.log(req, 'abo.angelegt', 'document', docId, { interval });
  req.flash('success', 'Wiederkehrende Rechnung eingerichtet.');
  res.redirect(`/belege/${docId}`);
}));

router.post('/wiederkehrend/:rid/umschalten', wrap((req, res) => {
  db.run('UPDATE recurring_invoices SET active = 1 - active WHERE id = ?', id(req.params.rid));
  res.redirect(req.get('referer') || '/belege/wiederkehrend');
}));

router.post('/wiederkehrend/:rid/loeschen', wrap((req, res) => {
  db.run('DELETE FROM recurring_invoices WHERE id = ?', id(req.params.rid));
  res.redirect(req.get('referer') || '/belege/wiederkehrend');
}));

router.post('/wiederkehrend/ausfuehren', wrap((req, res) => {
  const created = sales.runRecurring();
  req.flash('success', `${created.length} Rechnung(en) erzeugt.`);
  res.redirect('/belege/wiederkehrend');
}));

// ---------- Mahnwesen-Übersicht ----------
router.get('/mahnwesen', (req, res) => {
  const today = f.today();
  const rows = db.all(
    `SELECT d.*, c.company, c.first_name, c.last_name, c.email AS customer_email, julianday(?) - julianday(d.due_date) AS days_over
     FROM documents_sales d JOIN customers c ON c.id = d.customer_id
     WHERE d.kind = 'rechnung' AND d.status IN ('offen','teilbezahlt') AND d.due_date < ? ORDER BY d.due_date`, today, today,
  );
  res.render('sales/dunning', { title: 'Mahnwesen', rows });
});

module.exports = router;
