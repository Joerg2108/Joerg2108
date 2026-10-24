'use strict';
const express = require('express');
const db = require('../db');
const f = require('../lib/format');
const csv = require('../lib/csv');
const pdf = require('../lib/pdf');
const audit = require('../lib/audit');
const sales = require('../lib/sales');
const settings = require('../lib/settings');
const mailer = require('../lib/mailer');
const sec = require('../lib/security');
const sh = require('../lib/shifts');
const { wrap, id, notFound, clean, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('shifts.view'));
const edit = sec.requirePerm('shifts');

const STATUS = { geplant: 'Geplant', bestaetigt: 'Bestätigt', erledigt: 'Erledigt', abgesagt: 'Abgesagt' };
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

function monday(date) {
  const dow = (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7;
  return f.addDays(date, -dow);
}

function weekShifts(start) {
  return db.all(
    `SELECT s.*, st.first_name, st.last_name, st.color AS staff_color, p.name AS project_name FROM shifts s
     LEFT JOIN staff st ON st.id = s.staff_id LEFT JOIN projects p ON p.id = s.project_id
     WHERE s.starts_at >= ? AND s.starts_at < ? ORDER BY s.starts_at`, start, f.addDays(start, 7),
  );
}

const lookups = () => ({
  staff: db.all('SELECT * FROM staff WHERE active = 1 ORDER BY last_name, first_name'),
  projects: db.all("SELECT id, number, name, customer_id FROM projects WHERE status NOT IN ('abgeschlossen','storniert') ORDER BY name"),
  customers: db.all('SELECT id, company, first_name, last_name FROM customers WHERE anonymized = 0 ORDER BY COALESCE(company, last_name) COLLATE NOCASE'),
  types: db.all('SELECT * FROM qualification_types ORDER BY name'),
  STATUS,
});

// ---------- Wochenplan ----------
router.get('/', (req, res) => {
  const start = monday(isDate(req.query.woche) ? req.query.woche : f.today());
  const days = [...Array(7)].map((_, i) => f.addDays(start, i));
  const list = weekShifts(start).map((s) => ({ ...s, warnings: s.status === 'abgesagt' ? [] : sh.conflicts(s), minutes: sh.durationMinutes(s) }));
  const staff = db.all('SELECT * FROM staff WHERE active = 1 ORDER BY last_name, first_name');
  const grid = staff.map((st) => ({
    st,
    minutes: list.filter((s) => s.staff_id === st.id && s.status !== 'abgesagt').reduce((a, s) => a + s.minutes, 0),
    cells: days.map((d) => list.filter((s) => s.staff_id === st.id && s.starts_at.slice(0, 10) === d)),
    absences: days.map((d) => db.get('SELECT type FROM absences WHERE staff_id = ? AND date_from <= ? AND date_to >= ?', st.id, d, d)?.type || null),
  }));
  const open = days.map((d) => list.filter((s) => !s.staff_id && s.starts_at.slice(0, 10) === d));
  const me = db.get('SELECT id FROM staff WHERE user_id = ?', req.user.id);
  res.render('shifts/week', {
    title: 'Dienstplan', start, days, grid, open, DAYS, me: me?.id, today: f.today(),
    holidays: days.map((d) => sh.holidayName(d)),
    stats: { total: list.filter((s) => s.status !== 'abgesagt').length, open: list.filter((s) => !s.staff_id && s.status !== 'abgesagt').length, conflicts: list.filter((s) => s.warnings.some((w) => w.level === 'error')).length },
    prev: f.addDays(start, -7), next: f.addDays(start, 7), canEdit: sec.can(req.user, 'shifts'), ABSENCE_LABELS: sh.ABSENCE_LABELS,
  });
});

// ---------- Schicht anlegen / bearbeiten ----------
function fromBody(b) {
  const d = clean(b, ['title', 'location', 'notes']);
  if (!d.title) throw new UserError('Bezeichnung / Einsatz fehlt.');
  if (!isDate(b.date) || !/^\d{2}:\d{2}$/.test(b.from || '') || !/^\d{2}:\d{2}$/.test(b.to || '')) throw new UserError('Datum, Beginn und Ende sind Pflicht.');
  d.starts_at = `${b.date}T${b.from}`;
  // Endet die Schicht vor dem Beginn, geht sie über Mitternacht (z. B. 22:00–06:00)
  d.ends_at = `${b.to <= b.from ? f.addDays(b.date, 1) : b.date}T${b.to}`;
  d.break_minutes = Math.max(0, Number(b.break_minutes) || 0);
  d.staff_id = Number(b.staff_id) || null;
  d.project_id = Number(b.project_id) || null;
  d.customer_id = Number(b.customer_id) || (d.project_id ? db.get('SELECT customer_id FROM projects WHERE id = ?', d.project_id)?.customer_id : null) || null;
  d.status = STATUS[b.status] ? b.status : 'geplant';
  const req = Array.isArray(b.required_qualifications) ? b.required_qualifications : b.required_qualifications ? [b.required_qualifications] : [];
  d.required_qualifications = req.map(Number).filter(Boolean).join(',') || null;
  return d;
}

const COLS = ['staff_id', 'project_id', 'customer_id', 'title', 'location', 'starts_at', 'ends_at', 'break_minutes', 'status', 'required_qualifications', 'notes'];

function formShift(s) {
  return { ...s, date: s.starts_at?.slice(0, 10), from: s.starts_at?.slice(11, 16), to: s.ends_at?.slice(11, 16), req: String(s.required_qualifications || '').split(',').map(Number) };
}

router.get('/schicht/neu', edit, (req, res) => {
  const date = isDate(req.query.datum) ? req.query.datum : f.today();
  const last = db.get('SELECT * FROM shifts ORDER BY id DESC LIMIT 1');
  res.render('shifts/form', {
    title: 'Neue Schicht', ...lookups(), warnings: [],
    s: formShift({ starts_at: `${date}T${last?.starts_at.slice(11) || '06:00'}`, ends_at: `${date}T${last?.ends_at.slice(11) || '14:00'}`, break_minutes: last?.break_minutes ?? 30, staff_id: Number(req.query.ma) || null, project_id: last?.project_id, title: last?.title || '', location: last?.location || '', required_qualifications: last?.required_qualifications, status: 'geplant' }),
  });
});

router.post('/schicht', edit, wrap((req, res) => {
  const d = fromBody(req.body);
  const errors = sh.conflicts(d).filter((w) => w.level === 'error');
  if (errors.length && !req.body.force) {
    return res.status(409).render('shifts/form', { title: 'Neue Schicht', ...lookups(), s: formShift({ ...d }), warnings: sh.conflicts(d), series: req.body });
  }
  // Serie: an gewählten Wochentagen bis Enddatum wiederholen
  const until = isDate(req.body.repeat_until) ? req.body.repeat_until : null;
  const weekdays = [].concat(req.body.repeat_days || []).map(Number);
  const dates = [req.body.date];
  if (until && weekdays.length) {
    for (let day = f.addDays(req.body.date, 1); day <= until && dates.length < 400; day = f.addDays(day, 1)) {
      if (weekdays.includes((new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7)) dates.push(day);
    }
  }
  let unassigned = 0;
  db.tx(() => {
    for (const day of dates) {
      const shift = { ...d, starts_at: day + d.starts_at.slice(10), ends_at: f.addDays(day, f.daysBetween(d.starts_at.slice(0, 10), d.ends_at.slice(0, 10))) + d.ends_at.slice(10) };
      // Bei Konflikten innerhalb einer Serie wird die Schicht offen angelegt statt doppelt verplant
      if (day !== req.body.date && shift.staff_id && sh.conflicts(shift).some((w) => w.level === 'error')) { shift.staff_id = null; unassigned++; }
      db.run(`INSERT INTO shifts (${COLS.join(', ')}, created_by) VALUES (${COLS.map(() => '?').join(', ')}, ?)`, ...COLS.map((k) => shift[k] ?? null), req.user.id);
    }
  });
  audit.log(req, 'schicht.angelegt', 'shift', null, { count: dates.length, title: d.title });
  req.flash(unassigned ? 'warning' : 'success', `${dates.length} Schicht(en) angelegt.${unassigned ? ` ${unassigned} davon wegen Konflikten als offene Schicht.` : ''}`);
  res.redirect(`/dienstplan?woche=${monday(req.body.date)}`);
}));

router.get('/schicht/:id(\\d+)', edit, wrap((req, res) => {
  const s = db.get('SELECT * FROM shifts WHERE id = ?', id(req.params.id));
  if (!s) return notFound(res, 'Schicht');
  res.render('shifts/form', { title: 'Schicht bearbeiten', ...lookups(), s: formShift(s), warnings: sh.conflicts(s), split: sh.splitMinutes(s) });
}));

router.post('/schicht/:id(\\d+)', edit, wrap((req, res) => {
  const sid = id(req.params.id);
  const old = db.get('SELECT * FROM shifts WHERE id = ?', sid);
  if (!old) return notFound(res, 'Schicht');
  if (old.invoiced_in) throw new UserError('Schicht wurde bereits abgerechnet und kann nicht mehr geändert werden.');
  const d = { ...fromBody(req.body), id: sid };
  const warnings = sh.conflicts(d);
  if (warnings.some((w) => w.level === 'error') && !req.body.force) {
    return res.status(409).render('shifts/form', { title: 'Schicht bearbeiten', ...lookups(), s: formShift(d), warnings });
  }
  db.run(`UPDATE shifts SET ${COLS.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...COLS.map((k) => d[k] ?? null), sid);
  audit.log(req, 'schicht.geaendert', 'shift', sid);
  res.redirect(`/dienstplan?woche=${monday(d.starts_at.slice(0, 10))}`);
}));

router.post('/schicht/:id(\\d+)/status', edit, wrap((req, res) => {
  const sid = id(req.params.id);
  if (!STATUS[req.body.status]) throw new UserError('Ungültiger Status');
  db.run("UPDATE shifts SET status = ?, updated_at = datetime('now') WHERE id = ?", req.body.status, sid);
  res.redirect(req.get('referer') || '/dienstplan');
}));

router.post('/schicht/:id(\\d+)/loeschen', edit, wrap((req, res) => {
  const s = db.get('SELECT * FROM shifts WHERE id = ?', id(req.params.id));
  if (!s) return notFound(res, 'Schicht');
  if (s.invoiced_in) throw new UserError('Abgerechnete Schichten können nicht gelöscht werden.');
  db.run('DELETE FROM shifts WHERE id = ?', s.id);
  audit.log(req, 'schicht.geloescht', 'shift', s.id);
  res.redirect(`/dienstplan?woche=${monday(s.starts_at.slice(0, 10))}`);
}));

// ---------- Woche kopieren ----------
router.post('/woche-kopieren', edit, wrap((req, res) => {
  const start = monday(isDate(req.body.woche) ? req.body.woche : f.today());
  const target = f.addDays(start, 7);
  if (db.get('SELECT COUNT(*) AS n FROM shifts WHERE starts_at >= ? AND starts_at < ?', target, f.addDays(target, 7)).n && !req.body.force) {
    throw new UserError('Die Folgewoche enthält bereits Schichten. Bitte erst leeren oder einzeln planen.');
  }
  let n = 0;
  let unassigned = 0;
  db.tx(() => {
    for (const s of weekShifts(start).filter((x) => x.status !== 'abgesagt')) {
      const shift = { ...s, id: undefined, status: 'geplant', starts_at: f.addDays(s.starts_at.slice(0, 10), 7) + s.starts_at.slice(10), ends_at: f.addDays(s.ends_at.slice(0, 10), 7) + s.ends_at.slice(10) };
      if (shift.staff_id && sh.conflicts(shift).some((w) => w.level === 'error')) { shift.staff_id = null; unassigned++; }
      db.run(`INSERT INTO shifts (${COLS.join(', ')}, created_by) VALUES (${COLS.map(() => '?').join(', ')}, ?)`, ...COLS.map((k) => shift[k] ?? null), req.user.id);
      n++;
    }
  });
  audit.log(req, 'dienstplan.kopiert', 'shift', null, { from: start, count: n });
  req.flash(unassigned ? 'warning' : 'success', `${n} Schichten in die Folgewoche kopiert.${unassigned ? ` ${unassigned} wegen Abwesenheit/Konflikt offen gelassen.` : ''}`);
  res.redirect(`/dienstplan?woche=${target}`);
}));

// ---------- PDF & Versand ----------
function planRows(start) {
  const days = [...Array(7)].map((_, i) => f.addDays(start, i));
  const list = weekShifts(start).filter((s) => s.status !== 'abgesagt');
  const staff = db.all('SELECT * FROM staff WHERE active = 1 ORDER BY last_name, first_name');
  const fmt = (s) => `${s.starts_at.slice(11)}–${s.ends_at.slice(11)} ${s.title}`;
  const rows = staff.map((st) => {
    const mine = list.filter((s) => s.staff_id === st.id);
    return [`${st.last_name}, ${st.first_name}`, ...days.map((d) => mine.filter((s) => s.starts_at.startsWith(d)).map(fmt).join('\n')), f.minutes(mine.reduce((a, s) => a + sh.durationMinutes(s), 0))];
  }).filter((r) => r.slice(1, 8).some(Boolean));
  const open = list.filter((s) => !s.staff_id);
  if (open.length) rows.push({ cells: ['OFFEN', ...days.map((d) => open.filter((s) => s.starts_at.startsWith(d)).map(fmt).join('\n')), ''], bold: true });
  return { days, rows, list };
}

router.get('/pdf', wrap(async (req, res) => {
  const start = monday(isDate(req.query.woche) ? req.query.woche : f.today());
  const { days, rows } = planRows(start);
  const buf = await pdf.tableReport(`Dienstplan KW ${isoWeek(start)}`, `${f.date(days[0])} – ${f.date(days[6])}`,
    ['Mitarbeiter', ...days.map((d, i) => `${DAYS[i]} ${d.slice(8)}.${d.slice(5, 7)}.${sh.holidayName(d) ? ' (F)' : ''}`), 'Std.'], rows, [16, 12, 12, 12, 12, 12, 12, 12, 7], { landscape: true });
  res.type('application/pdf').set('Content-Disposition', `inline; filename="Dienstplan_KW${isoWeek(start)}.pdf"`).send(buf);
}));

router.post('/senden', edit, wrap(async (req, res) => {
  const start = monday(isDate(req.body.woche) ? req.body.woche : f.today());
  const { list } = planRows(start);
  const s = settings.all();
  let sent = 0;
  for (const st of db.all("SELECT * FROM staff WHERE active = 1 AND email IS NOT NULL AND email != ''")) {
    const mine = list.filter((x) => x.staff_id === st.id);
    if (!mine.length) continue;
    const lines = mine.map((x) => `${DAYS[(new Date(x.starts_at.slice(0, 10) + 'T12:00:00Z').getUTCDay() + 6) % 7]} ${f.date(x.starts_at)}  ${x.starts_at.slice(11)}–${x.ends_at.slice(11)}  ${x.title}${x.location ? ' · ' + x.location : ''}`);
    await mailer.send({
      to: st.email, replyTo: s.company_email, subject: `Dein Dienstplan KW ${isoWeek(start)}`,
      text: `Hallo ${st.first_name},\n\nhier deine Schichten vom ${f.date(start)} bis ${f.date(f.addDays(start, 6))}:\n\n${lines.join('\n')}\n\nSumme: ${f.minutes(mine.reduce((a, x) => a + sh.durationMinutes(x), 0))}\n\nBei Rückfragen bitte melden.\n${s.company_name}`,
    });
    sent++;
  }
  audit.log(req, 'dienstplan.versendet', 'shift', null, { week: start, sent });
  req.flash(mailer.enabled() ? 'success' : 'warning', `${sent} Dienstplan-Mail(s) ${mailer.enabled() ? 'versendet' : 'simuliert (SMTP nicht eingerichtet)'}.`);
  res.redirect(`/dienstplan?woche=${start}`);
}));

function isoWeek(date) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

// ---------- Auswertung (Lohnvorbereitung) ----------
function range(req) {
  const month = f.today().slice(0, 7);
  const from = isDate(req.query.von) ? req.query.von : `${month}-01`;
  const to = isDate(req.query.bis) ? req.query.bis : f.addDays(f.addMonths(`${month}-01`, 1), -1);
  return { from, to };
}

router.get('/auswertung', edit, (req, res) => {
  const { from, to } = range(req);
  const holidays = [];
  for (let d = from; d <= to; d = f.addDays(d, 1)) if (sh.holidayName(d)) holidays.push([d, sh.holidayName(d)]);
  res.render('shifts/report', {
    title: 'Stundenauswertung', from, to, rows: sh.staffReport(from, to), holidays,
    projects: db.all("SELECT id, number, name FROM projects WHERE customer_id IS NOT NULL AND status != 'storniert' ORDER BY name"),
    state: sh.STATES[settings.get('holiday_state')] || settings.get('holiday_state'),
  });
});

router.get('/auswertung.csv', edit, (req, res) => {
  const { from, to } = range(req);
  const h = (m) => f.num(m / 60);
  res.type('text/csv').attachment(`stunden-${from}-${to}.csv`).send(csv.stringify(
    ['Mitarbeiter', 'Beschäftigung', 'Schichten', 'Stunden', 'Soll', 'Differenz', 'Nacht (20–6)', 'davon 0–4 Uhr', 'Sonntag', 'Feiertag', 'Bruttolohn (Grund)'],
    sh.staffReport(from, to).map((r) => [r.name, r.employment, r.shifts, h(r.total), h(r.target), h(r.diff), h(r.night), h(r.coreNight), h(r.sunday), h(r.holiday), f.moneyInput(r.wage)]),
  ));
});

// ---------- Schichten an den Kunden abrechnen ----------
router.post('/abrechnen', sec.requirePerm('sales'), edit, wrap((req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ?', Number(req.body.project_id));
  if (!project || !project.customer_id) throw new UserError('Bitte ein Projekt mit Kunde wählen.');
  if (!isDate(req.body.von) || !isDate(req.body.bis)) throw new UserError('Zeitraum fehlt.');
  const list = db.all(
    "SELECT * FROM shifts WHERE project_id = ? AND status != 'abgesagt' AND invoiced_in IS NULL AND staff_id IS NOT NULL AND starts_at >= ? AND starts_at <= ? ORDER BY starts_at",
    project.id, req.body.von, req.body.bis + 'T23:59',
  );
  if (!list.length) throw new UserError('Keine abrechenbaren Schichten im Zeitraum.');
  const s = settings.all();
  const rate = project.hourly_rate || f.parseMoney(s.shift_rate);
  const sum = list.reduce((a, x) => { const sp = sh.splitMinutes(x); return { total: a.total + sp.total, night: a.night + sp.night, sunday: a.sunday + sp.sunday, holiday: a.holiday + sp.holiday }; }, { total: 0, night: 0, sunday: 0, holiday: 0 });
  const hrs = (m) => Math.round((m / 60) * 100) / 100;
  const tax = Number(s.default_tax_rate);
  const period = `${f.date(req.body.von)} – ${f.date(req.body.bis)}`;
  const items = [{ name: `Sicherheitsdienstleistung ${project.name}`, description: `${list.length} Schichten im Zeitraum ${period}`, quantity: hrs(sum.total), unit: 'Std.', unit_price: rate, tax_rate: tax, discount_pct: 0 }];
  const add = (key, label, pct) => { if (sum[key] && Number(pct)) items.push({ name: `${label} (${pct} %)`, description: '', quantity: hrs(sum[key]), unit: 'Std.', unit_price: Math.round(rate * Number(pct) / 100), tax_rate: tax, discount_pct: 0 }); };
  add('night', 'Nachtzuschlag', s.surcharge_night_pct);
  add('sunday', 'Sonntagszuschlag', s.surcharge_sunday_pct);
  add('holiday', 'Feiertagszuschlag', s.surcharge_holiday_pct);
  const docId = db.tx(() => {
    const newId = sales.save({
      kind: 'rechnung', userId: req.user.id, items,
      data: {
        customer_id: project.customer_id, project_id: project.id, title: `Abrechnung ${project.name} ${period}`, intro: s.invoice_intro, footer: s.invoice_footer,
        issue_date: f.today(), service_date: req.body.von, service_until: req.body.bis, due_date: f.addDays(f.today(), Number(s.payment_terms_days)),
      },
    });
    for (const x of list) db.run('UPDATE shifts SET invoiced_in = ? WHERE id = ?', newId, x.id);
    return newId;
  });
  audit.log(req, 'dienstplan.abgerechnet', 'project', project.id, { document: docId, shifts: list.length });
  req.flash('success', `${list.length} Schichten (${f.minutes(sum.total)}) in Rechnungsentwurf übernommen – bitte prüfen.`);
  res.redirect(`/belege/${docId}/bearbeiten`);
}));

module.exports = router;
module.exports.isoWeek = isoWeek;
module.exports.monday = monday;
