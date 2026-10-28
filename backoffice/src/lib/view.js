'use strict';
// View-Helfer: Formularfelder, Badges, Pagination – halten die EJS-Templates schlank.
const f = require('./format');
const { STATUS_LABELS } = require('./sales');

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function attrs(o = {}) {
  return Object.entries(o)
    .filter(([, v]) => v !== false && v !== null && v !== undefined)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
}

function input(name, label, value, opts = {}) {
  const { type = 'text', hint, cls = '', ...rest } = opts;
  const id = `f_${name}`;
  const field = type === 'textarea'
    ? `<textarea id="${id}" name="${esc(name)}"${attrs({ rows: 3, ...rest })}>${esc(value)}</textarea>`
    : `<input id="${id}" type="${type}" name="${esc(name)}" value="${esc(value)}"${attrs(rest)}>`;
  return `<label class="field ${cls}" for="${id}"><span>${esc(label)}${rest.required ? ' <i class="req">*</i>' : ''}</span>${field}${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
}

function select(name, label, value, options, opts = {}) {
  const { cls = '', empty, hint, ...rest } = opts;
  const id = `f_${name}`;
  const list = Array.isArray(options) ? options.map((o) => (Array.isArray(o) ? o : [o, o])) : Object.entries(options);
  const opt = (empty !== undefined ? `<option value="">${esc(empty)}</option>` : '') +
    list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value ?? '') ? ' selected' : ''}>${esc(l)}</option>`).join('');
  return `<label class="field ${cls}" for="${id}"><span>${esc(label)}${rest.required ? ' <i class="req">*</i>' : ''}</span><select id="${id}" name="${esc(name)}"${attrs(rest)}>${opt}</select>${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
}

function checkbox(name, label, checked, opts = {}) {
  return `<label class="check"><input type="checkbox" name="${esc(name)}" value="1"${checked ? ' checked' : ''}${attrs(opts)}> <span>${esc(label)}</span></label>`;
}

const BADGE_TONES = {
  entwurf: 'grey', versendet: 'blue', angenommen: 'green', abgelehnt: 'red', abgelaufen: 'grey', in_bearbeitung: 'blue',
  abgeschlossen: 'green', offen: 'amber', teilbezahlt: 'blue', bezahlt: 'green', storniert: 'grey', erledigt: 'green',
  ueberfaellig: 'red', neu: 'blue', kontaktiert: 'amber', qualifiziert: 'violet', gewonnen: 'green', verloren: 'grey',
  aktiv: 'green', interessent: 'blue', inaktiv: 'grey', geplant: 'grey', pausiert: 'amber', in_arbeit: 'blue', wartet: 'amber',
  niedrig: 'grey', normal: 'blue', hoch: 'amber', dringend: 'red',
  // Sicherheitsdienst
  laeuft: 'amber', ob: 'green', vorfall: 'red', abgebrochen: 'grey',
  verfuegbar: 'green', im_einsatz: 'blue', werkstatt: 'amber', stillgelegt: 'grey',
  rundgang: 'green', kontrollpunkt: 'blue', vorkommnis: 'red', notiz: 'grey',
  mittel: 'amber',
};
const LABELS = {
  ...STATUS_LABELS, neu: 'Neu', kontaktiert: 'Kontaktiert', qualifiziert: 'Qualifiziert', gewonnen: 'Gewonnen', verloren: 'Verloren',
  aktiv: 'Aktiv', interessent: 'Interessent', inaktiv: 'Inaktiv', geplant: 'Geplant', pausiert: 'Pausiert', in_arbeit: 'In Arbeit',
  wartet: 'Wartet', niedrig: 'Niedrig', normal: 'Normal', hoch: 'Hoch', dringend: 'Dringend', firma: 'Firma', privat: 'Privat', behoerde: 'Behörde',
  // Sicherheitsdienst
  laeuft: 'läuft', ob: 'o.B.', vorfall: 'Vorfall', abgebrochen: 'Abgebrochen',
  verfuegbar: 'Verfügbar', im_einsatz: 'Im Einsatz', werkstatt: 'Werkstatt', stillgelegt: 'Stillgelegt',
  in_bearbeitung: 'In Bearbeitung', rundgang: 'Rundgang', kontrollpunkt: 'Kontrollpunkt', vorkommnis: 'Vorkommnis', notiz: 'Notiz',
  mittel: 'Mittel',
  // Vorfall-Kategorien
  diebstahl: 'Diebstahl', sachbeschaedigung: 'Sachbeschädigung', ruhestoerung: 'Ruhestörung', hausverbot: 'Hausverbot',
  koerperverletzung: 'Körperverletzung', brand: 'Brand', notfall: 'Medizinischer Notfall', defekt: 'Technischer Defekt',
};

function badge(status, label) {
  return `<span class="badge ${BADGE_TONES[status] || 'grey'}">${esc(label || LABELS[status] || status)}</span>`;
}

function label(key) {
  return LABELS[key] || key;
}

function pagination(page, pages, query = {}) {
  if (pages <= 1) return '';
  const link = (p) => '?' + new URLSearchParams({ ...query, page: p }).toString();
  let html = '<nav class="pagination">';
  if (page > 1) html += `<a href="${esc(link(page - 1))}">‹ Zurück</a>`;
  html += `<span>Seite ${page} von ${pages}</span>`;
  if (page < pages) html += `<a href="${esc(link(page + 1))}">Weiter ›</a>`;
  return html + '</nav>';
}

function icon(name) {
  const paths = {
    home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    euro: 'M4 10h12M4 14h9M19 6a7.7 7.7 0 00-5.2-2A7.9 7.9 0 006 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2',
    box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 7h8M8 11h8M8 15h5',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
    bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    plus: 'M12 5v14M5 12h14',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
    menu: 'M3 12h18M3 6h18M3 18h18',
    repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    building: 'M3 21h18M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16M19 21V11a1 1 0 00-1-1h-3M9 7h2M9 11h2M9 15h2',
    alert: 'M10.29 3.86l-8.18 14A1.5 1.5 0 003.4 20h17.2a1.5 1.5 0 001.29-2.14l-8.18-14a1.5 1.5 0 00-2.62 0zM12 9v4M12 17h.01',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    route: 'M4 19a2 2 0 100-4 2 2 0 000 4zM20 7a2 2 0 100-4 2 2 0 000 4zM6 17h8a4 4 0 004-4V9M6 17a4 4 0 01-4-4V9',
    car: 'M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13M5 13h14a1 1 0 011 1v4h-3M5 13a1 1 0 00-1 1v4h3m0 0a1.5 1.5 0 003 0m-3 0h8m4 0a1.5 1.5 0 01-3 0',
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
}

module.exports = { esc, input, select, checkbox, badge, label, pagination, icon, LABELS, ...f };
