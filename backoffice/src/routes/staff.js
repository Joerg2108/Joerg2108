'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const shifts = require('../lib/shifts');
const files = require('./files');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('staff'));

const EMPLOYMENT = { vollzeit: 'Vollzeit', teilzeit: 'Teilzeit', minijob: 'Minijob', aushilfe: 'Aushilfe', freelancer: 'Freelancer / Subunternehmer' };
const COLORS = { blau: 'Blau', gruen: 'Grün', rot: 'Rot', orange: 'Orange', lila: 'Lila', grau: 'Grau' };

function fromBody(b) {
  const d = clean(b, ['personnel_no', 'first_name', 'last_name', 'email', 'phone', 'bewacher_id', 'notes']);
  if (!d.first_name || !d.last_name) throw new UserError('Vor- und Nachname sind Pflicht.');
  d.employment = EMPLOYMENT[b.employment] ? b.employment : 'vollzeit';
  d.weekly_hours = f.parseNumber(b.weekly_hours, 40);
  d.hourly_wage = f.parseMoney(b.hourly_wage);
  d.user_id = Number(b.user_id) || null;
  d.color = COLORS[b.color] ? b.color : 'blau';
  d.active = b.active ? 1 : 0;
  return d;
}

const COLS = ['personnel_no', 'first_name', 'last_name', 'email', 'phone', 'user_id', 'employment', 'weekly_hours', 'hourly_wage', 'bewacher_id', 'color', 'active', 'notes'];

router.get('/', (req, res) => {
  const showAll = req.query.alle === '1';
  const rows = db.all(
    `SELECT s.*, (SELECT COUNT(*) FROM staff_qualifications q WHERE q.staff_id = s.id) AS quals,
       (SELECT MIN(expires_at) FROM staff_qualifications q WHERE q.staff_id = s.id AND q.expires_at IS NOT NULL) AS next_expiry
     FROM staff s ${showAll ? '' : 'WHERE s.active = 1'} ORDER BY s.last_name, s.first_name`,
  );
  res.render('staff/index', { title: 'Personal', rows, EMPLOYMENT, showAll, today: f.today(), soon: f.addDays(f.today(), 60), expiring: shifts.expiringQualifications(60) });
});

router.get('/neu', (req, res) => res.render('staff/form', { title: 'Neuer Mitarbeiter', st: { employment: 'vollzeit', weekly_hours: 40, active: 1, color: 'blau' }, EMPLOYMENT, COLORS, users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name') }));

router.post('/', wrap((req, res) => {
  const d = fromBody(req.body);
  const r = db.run(`INSERT INTO staff (${COLS.join(', ')}) VALUES (${COLS.map(() => '?').join(', ')})`, ...COLS.map((k) => d[k] ?? null));
  audit.log(req, 'personal.angelegt', 'staff', Number(r.lastInsertRowid));
  req.flash('success', 'Mitarbeiter angelegt.');
  res.redirect(`/personal/${r.lastInsertRowid}`);
}));

// ---------- Qualifikationsarten (Katalog) ----------
router.get('/qualifikationen', (req, res) => {
  const rows = db.all('SELECT t.*, (SELECT COUNT(*) FROM staff_qualifications q WHERE q.type_id = t.id) AS n FROM qualification_types t ORDER BY name');
  res.render('staff/qualtypes', { title: 'Qualifikationen', rows });
});

router.post('/qualifikationen', wrap((req, res) => {
  const d = clean(req.body, ['name', 'description']);
  if (!d.name) throw new UserError('Name fehlt.');
  db.run('INSERT INTO qualification_types (name, validity_months, description) VALUES (?, ?, ?)', d.name, Number(req.body.validity_months) || null, d.description);
  res.redirect('/personal/qualifikationen');
}));

router.post('/qualifikationen/:id/loeschen', wrap((req, res) => {
  db.run('DELETE FROM qualification_types WHERE id = ?', id(req.params.id));
  res.redirect('/personal/qualifikationen');
}));

router.get('/:id(\\d+)', wrap((req, res) => {
  const st = db.get('SELECT * FROM staff WHERE id = ?', id(req.params.id));
  if (!st) return notFound(res, 'Mitarbeiter');
  const quals = db.all('SELECT q.*, t.name AS type_name FROM staff_qualifications q JOIN qualification_types t ON t.id = q.type_id WHERE staff_id = ? ORDER BY t.name', st.id);
  const absences = db.all('SELECT * FROM absences WHERE staff_id = ? ORDER BY date_from DESC LIMIT 50', st.id);
  const upcoming = db.all("SELECT * FROM shifts WHERE staff_id = ? AND ends_at >= ? AND status != 'abgesagt' ORDER BY starts_at LIMIT 20", st.id, f.today());
  const month = f.today().slice(0, 7);
  const report = shifts.staffReport(`${month}-01`, f.addDays(f.addMonths(`${month}-01`, 1), -1)).find((r) => r.staff_id === st.id);
  res.render('staff/show', {
    title: `${st.first_name} ${st.last_name}`, st, quals, absences, upcoming, report, EMPLOYMENT, ABSENCE_LABELS: shifts.ABSENCE_LABELS,
    types: db.all('SELECT * FROM qualification_types ORDER BY name'), today: f.today(), soon: f.addDays(f.today(), 60),
  });
}));

router.get('/:id(\\d+)/bearbeiten', wrap((req, res) => {
  const st = db.get('SELECT * FROM staff WHERE id = ?', id(req.params.id));
  if (!st) return notFound(res, 'Mitarbeiter');
  res.render('staff/form', { title: 'Mitarbeiter bearbeiten', st, EMPLOYMENT, COLORS, users: db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name') });
}));

router.post('/:id(\\d+)', wrap((req, res) => {
  const sid = id(req.params.id);
  const d = fromBody(req.body);
  db.run(`UPDATE staff SET ${COLS.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...COLS.map((k) => d[k] ?? null), sid);
  audit.log(req, 'personal.geaendert', 'staff', sid);
  req.flash('success', 'Gespeichert.');
  res.redirect(`/personal/${sid}`);
}));

router.post('/:id(\\d+)/loeschen', wrap((req, res) => {
  const sid = id(req.params.id);
  if (db.get('SELECT COUNT(*) AS n FROM shifts WHERE staff_id = ?', sid).n) throw new UserError('Mitarbeiter hat Schichten – bitte stattdessen deaktivieren.');
  db.run('DELETE FROM staff WHERE id = ?', sid);
  audit.log(req, 'personal.geloescht', 'staff', sid);
  res.redirect('/personal');
}));

// Qualifikation mit optionalem Nachweis-Upload (multipart, CSRF über Query)
router.post('/:id(\\d+)/qualifikationen', (req, res, next) => files.upload.single('file')(req, res, (err) => {
  if (err) { req.flash('error', err.message); return res.redirect(`/personal/${req.params.id}`); }
  wrap((rq, rs) => {
    const sid = id(rq.params.id);
    const typeId = Number(rq.body.type_id);
    const type = db.get('SELECT * FROM qualification_types WHERE id = ?', typeId);
    if (!type) throw new UserError('Bitte eine Qualifikation wählen.');
    const issued = /^\d{4}-\d{2}-\d{2}$/.test(rq.body.issued_at || '') ? rq.body.issued_at : null;
    let expires = /^\d{4}-\d{2}-\d{2}$/.test(rq.body.expires_at || '') ? rq.body.expires_at : null;
    if (!expires && issued && type.validity_months) expires = f.addDays(f.addMonths(issued, type.validity_months), -1);
    const fileId = rq.file ? files.store(rq.file, { folder: 'Personal' }, rq.user.id) : null;
    db.run('INSERT INTO staff_qualifications (staff_id, type_id, issued_at, expires_at, file_id, note) VALUES (?, ?, ?, ?, ?, ?)', sid, typeId, issued, expires, fileId, rq.body.note || null);
    audit.log(rq, 'personal.qualifikation', 'staff', sid, { type: type.name, expires });
    rs.redirect(`/personal/${sid}#qualifikationen`);
  })(req, res, next);
}));

router.post('/:id(\\d+)/qualifikationen/:qid/loeschen', wrap((req, res) => {
  db.run('DELETE FROM staff_qualifications WHERE id = ? AND staff_id = ?', id(req.params.qid), id(req.params.id));
  res.redirect(`/personal/${req.params.id}#qualifikationen`);
}));

router.post('/:id(\\d+)/abwesenheiten', wrap((req, res) => {
  const sid = id(req.params.id);
  const { date_from: from, date_to: to } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || to < from) throw new UserError('Bitte gültigen Zeitraum angeben.');
  const type = shifts.ABSENCE_LABELS[req.body.type] ? req.body.type : 'urlaub';
  db.run('INSERT INTO absences (staff_id, type, date_from, date_to, note) VALUES (?, ?, ?, ?, ?)', sid, type, from, to, req.body.note || null);
  const clash = db.get("SELECT COUNT(*) AS n FROM shifts WHERE staff_id = ? AND status != 'abgesagt' AND substr(starts_at,1,10) <= ? AND substr(ends_at,1,10) >= ?", sid, to, from).n;
  req.flash(clash ? 'warning' : 'success', clash ? `Abwesenheit eingetragen – Achtung: ${clash} geplante Schicht(en) im Zeitraum müssen neu besetzt werden.` : 'Abwesenheit eingetragen.');
  res.redirect(`/personal/${sid}#abwesenheiten`);
}));

router.post('/:id(\\d+)/abwesenheiten/:aid/loeschen', wrap((req, res) => {
  db.run('DELETE FROM absences WHERE id = ? AND staff_id = ?', id(req.params.aid), id(req.params.id));
  res.redirect(`/personal/${req.params.id}#abwesenheiten`);
}));

module.exports = router;
module.exports.EMPLOYMENT = EMPLOYMENT;
