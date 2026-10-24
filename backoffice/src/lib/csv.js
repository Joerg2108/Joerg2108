'use strict';
// CSV im Excel-freundlichen deutschen Format (Semikolon, UTF-8 mit BOM)

function cell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stringify(headers, rows) {
  return '﻿' + [headers.map(cell).join(';'), ...rows.map((r) => r.map(cell).join(';'))].join('\r\n') + '\r\n';
}

// Robuster Parser: erkennt ; oder , als Trenner, unterstützt Anführungszeichen und Zeilenumbrüche in Feldern
function parse(text) {
  text = String(text).replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== '')) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim().toLowerCase());
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
}

module.exports = { stringify, parse };
