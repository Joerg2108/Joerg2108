'use strict';
// Fachlogik Dienstplanung: Feiertage, SFN-Stunden, Konfliktprüfung (ArbZG), Auswertungen
const db = require('../db');
const settings = require('./settings');
const f = require('./format');

const STATES = {
  BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland',
  SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen',
};

// Ostersonntag nach der Gaußschen Osterformel (anonymer gregorianischer Algorithmus)
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f1 = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f1 + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const holidayCache = new Map();

// Gesetzliche Feiertage (bundeseinheitlich + je Bundesland) als Map Datum -> Name
function holidays(year, state = settings.get('holiday_state') || 'BE') {
  const key = `${year}:${state}`;
  if (holidayCache.has(key)) return holidayCache.get(key);
  const e = easter(year);
  const y = (md) => `${year}-${md}`;
  const list = [
    [y('01-01'), 'Neujahr'], [f.addDays(e, -2), 'Karfreitag'], [f.addDays(e, 1), 'Ostermontag'], [y('05-01'), 'Tag der Arbeit'],
    [f.addDays(e, 39), 'Christi Himmelfahrt'], [f.addDays(e, 50), 'Pfingstmontag'], [y('10-03'), 'Tag der Deutschen Einheit'],
    [y('12-25'), '1. Weihnachtsfeiertag'], [y('12-26'), '2. Weihnachtsfeiertag'],
  ];
  const add = (states, date, name) => { if (states.includes(state)) list.push([date, name]); };
  add(['BW', 'BY', 'ST'], y('01-06'), 'Heilige Drei Könige');
  add(['BE', 'MV'], y('03-08'), 'Internationaler Frauentag');
  add(['BB'], e, 'Ostersonntag');
  add(['BB'], f.addDays(e, 49), 'Pfingstsonntag');
  add(['BW', 'BY', 'HE', 'NW', 'RP', 'SL'], f.addDays(e, 60), 'Fronleichnam');
  add(['SL'], y('08-15'), 'Mariä Himmelfahrt');
  add(['TH'], y('09-20'), 'Weltkindertag');
  add(['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'], y('10-31'), 'Reformationstag');
  add(['BW', 'BY', 'NW', 'RP', 'SL'], y('11-01'), 'Allerheiligen');
  if (state === 'SN') {
    // Buß- und Bettag: Mittwoch vor dem 23. November
    const d = new Date(Date.UTC(year, 10, 22));
    while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() - 1);
    list.push([d.toISOString().slice(0, 10), 'Buß- und Bettag']);
  }
  const map = new Map(list);
  holidayCache.set(key, map);
  return map;
}

function holidayName(date) {
  return holidays(Number(date.slice(0, 4))).get(date) || null;
}

// "YYYY-MM-DDTHH:MM" als Wanduhrzeit (Europe/Berlin) – Rechnung in Minuten seit Epoch, ohne Zeitzonenverschiebung
const toMin = (dt) => Date.UTC(+dt.slice(0, 4), +dt.slice(5, 7) - 1, +dt.slice(8, 10), +dt.slice(11, 13), +dt.slice(14, 16)) / 60000;
const fromMin = (m) => new Date(m * 60000).toISOString().slice(0, 16);

function durationMinutes(s) {
  return Math.max(0, toMin(s.ends_at) - toMin(s.starts_at) - (s.break_minutes || 0));
}

// Aufteilung einer Schicht in Nacht- (20–6 Uhr nach § 3b EStG: 20–24 + 0–6), Sonntags- und Feiertagsminuten.
// Zusätzlich "Kernnacht" 0–4 Uhr (bei Beginn vor 0 Uhr höherer Zuschlag nach § 3b Abs. 3 EStG).
// Pausen werden anteilig von allen Zeitfenstern abgezogen, damit Nacht/Sonntag/Feiertag nie größer als die Arbeitszeit sind.
function splitMinutes(s) {
  const out = { total: durationMinutes(s), night: 0, coreNight: 0, sunday: 0, holiday: 0 };
  const start = toMin(s.starts_at);
  const end = toMin(s.ends_at);
  const nightStart = Number(settings.get('night_from') || 20);
  for (let m = start; m < end; m++) {
    const iso = fromMin(m);
    const date = iso.slice(0, 10);
    const hour = Number(iso.slice(11, 13));
    const dow = new Date(date + 'T12:00:00Z').getUTCDay();
    if (hour >= nightStart || hour < 6) out.night++;
    if (hour < 4) out.coreNight++;
    if (holidayName(date)) out.holiday++;
    else if (dow === 0) out.sunday++;
  }
  const gross = end - start;
  if (gross > 0 && out.total < gross) {
    const factor = out.total / gross;
    for (const k of ['night', 'coreNight', 'sunday', 'holiday']) out[k] = Math.round(out[k] * factor);
  }
  return out;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Konfliktprüfung einer (geplanten) Schicht – liefert Liste von Warnungen
function conflicts(shift, { ignoreId = null } = {}) {
  const warnings = [];
  const dur = durationMinutes(shift);
  if (dur > 10 * 60) warnings.push({ level: 'error', text: `Schicht ${f.minutes(dur)} – über 10 Stunden (§ 3 ArbZG)` });
  const gross = toMin(shift.ends_at) - toMin(shift.starts_at);
  if (gross > 9 * 60 && (shift.break_minutes || 0) < 45) warnings.push({ level: 'warn', text: 'Mehr als 9 Std.: mind. 45 Min. Pause nötig (§ 4 ArbZG)' });
  else if (gross > 6 * 60 && (shift.break_minutes || 0) < 30) warnings.push({ level: 'warn', text: 'Mehr als 6 Std.: mind. 30 Min. Pause nötig (§ 4 ArbZG)' });
  if (!shift.staff_id) return warnings;

  const staff = db.get('SELECT * FROM staff WHERE id = ?', shift.staff_id);
  if (staff && !staff.active) warnings.push({ level: 'error', text: 'Mitarbeiter ist inaktiv' });

  const others = db.all(
    "SELECT * FROM shifts WHERE staff_id = ? AND status != 'abgesagt' AND id IS NOT ? AND starts_at < ? AND ends_at > ?",
    shift.staff_id, ignoreId ?? shift.id ?? null, fromMin(toMin(shift.ends_at) + 11 * 60), fromMin(toMin(shift.starts_at) - 11 * 60),
  );
  for (const o of others) {
    if (overlaps(toMin(shift.starts_at), toMin(shift.ends_at), toMin(o.starts_at), toMin(o.ends_at))) {
      warnings.push({ level: 'error', text: `Doppelt eingeplant: „${o.title}“ ${o.starts_at.slice(11)}–${o.ends_at.slice(11)}` });
    } else {
      const gap = Math.min(Math.abs(toMin(shift.starts_at) - toMin(o.ends_at)), Math.abs(toMin(o.starts_at) - toMin(shift.ends_at)));
      if (gap < 11 * 60) warnings.push({ level: 'warn', text: `Ruhezeit nur ${f.minutes(gap)} zu „${o.title}“ (mind. 11 Std., § 5 ArbZG)` });
    }
  }

  const absence = db.get('SELECT * FROM absences WHERE staff_id = ? AND date_from <= ? AND date_to >= ?', shift.staff_id, shift.ends_at.slice(0, 10), shift.starts_at.slice(0, 10));
  if (absence) warnings.push({ level: 'error', text: `Abwesend: ${ABSENCE_LABELS[absence.type]} ${f.date(absence.date_from)}–${f.date(absence.date_to)}` });

  const required = String(shift.required_qualifications || '').split(',').map(Number).filter(Boolean);
  const day = shift.starts_at.slice(0, 10);
  for (const typeId of required) {
    const type = db.get('SELECT name FROM qualification_types WHERE id = ?', typeId);
    if (!type) continue;
    const q = db.get('SELECT * FROM staff_qualifications WHERE staff_id = ? AND type_id = ? ORDER BY expires_at IS NULL DESC, expires_at DESC LIMIT 1', shift.staff_id, typeId);
    if (!q) warnings.push({ level: 'error', text: `Qualifikation fehlt: ${type.name}` });
    else if (q.expires_at && q.expires_at < day) warnings.push({ level: 'error', text: `${type.name} abgelaufen am ${f.date(q.expires_at)}` });
  }
  return warnings;
}

const ABSENCE_LABELS = { urlaub: 'Urlaub', krank: 'Krank', frei: 'Frei', schulung: 'Schulung', sonstiges: 'Sonstiges' };

// Stundenauswertung je Mitarbeiter für einen Zeitraum (Basis für Lohnabrechnung)
function staffReport(from, to) {
  const rows = db.all(
    "SELECT s.*, st.first_name, st.last_name, st.employment, st.weekly_hours, st.hourly_wage FROM shifts s JOIN staff st ON st.id = s.staff_id WHERE s.status != 'abgesagt' AND s.starts_at >= ? AND s.starts_at <= ? ORDER BY st.last_name, s.starts_at",
    from, to + 'T23:59',
  );
  const byStaff = new Map();
  for (const s of rows) {
    if (!byStaff.has(s.staff_id)) {
      byStaff.set(s.staff_id, { staff_id: s.staff_id, name: `${s.last_name}, ${s.first_name}`, employment: s.employment, weekly_hours: s.weekly_hours, hourly_wage: s.hourly_wage, shifts: 0, total: 0, night: 0, coreNight: 0, sunday: 0, holiday: 0 });
    }
    const r = byStaff.get(s.staff_id);
    const sp = splitMinutes(s);
    r.shifts++;
    for (const k of ['total', 'night', 'coreNight', 'sunday', 'holiday']) r[k] += sp[k];
  }
  const days = f.daysBetween(from, to) + 1;
  const minijobLimit = f.parseMoney(settings.get('minijob_limit'));
  return [...byStaff.values()].map((r) => {
    const target = Math.round((r.weekly_hours * 60 * days) / 7);
    const wage = Math.round((r.total / 60) * r.hourly_wage);
    return { ...r, target, diff: r.total - target, wage, minijobOver: r.employment === 'minijob' && minijobLimit > 0 && wage > minijobLimit * Math.max(1, Math.round(days / 30)) };
  });
}

// Qualifikationen, die bald ablaufen (für Dashboard & Benachrichtigungen)
function expiringQualifications(days = 60) {
  return db.all(
    `SELECT q.*, t.name AS type_name, s.first_name, s.last_name, s.id AS staff_id FROM staff_qualifications q
     JOIN qualification_types t ON t.id = q.type_id JOIN staff s ON s.id = q.staff_id
     WHERE s.active = 1 AND q.expires_at IS NOT NULL AND q.expires_at <= ? ORDER BY q.expires_at`, f.addDays(f.today(), days),
  );
}

// Tägliche Erinnerung (einmal je Qualifikation und Schwelle), aufgerufen vom Hintergrundjob
function notifyExpiring() {
  for (const q of expiringQualifications(30)) {
    const title = `${q.type_name} von ${q.first_name} ${q.last_name} ${q.expires_at < f.today() ? 'ist abgelaufen' : 'läuft ab am ' + f.date(q.expires_at)}`;
    if (!db.get('SELECT id FROM notifications WHERE title = ?', title)) {
      db.run('INSERT INTO notifications (user_id, title, link) VALUES (NULL, ?, ?)', title, `/personal/${q.staff_id}`);
    }
  }
}

module.exports = {
  STATES, ABSENCE_LABELS, easter, holidays, holidayName, toMin, fromMin, durationMinutes, splitMinutes, conflicts,
  staffReport, expiringQualifications, notifyExpiring,
};
