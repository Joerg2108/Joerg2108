'use strict';
const db = require('../db');
const settings = require('./settings');

// Fortlaufende, lückenlose Nummernkreise – pro Jahr, wenn {YYYY} im Präfix steht.
const PREFIX_KEY = {
  rechnung: 'prefix_invoice',
  angebot: 'prefix_quote',
  auftrag: 'prefix_order',
  storno: 'prefix_storno',
  customer: 'prefix_customer',
  project: 'prefix_project',
};

function next(kind, onDate = new Date().toISOString().slice(0, 10)) {
  const pattern = settings.get(PREFIX_KEY[kind]) || `${kind.toUpperCase()}-`;
  const yyyy = onDate.slice(0, 4);
  const prefix = pattern.replace('{YYYY}', yyyy).replace('{YY}', yyyy.slice(2)).replace('{MM}', onDate.slice(5, 7));
  const counterName = `${kind}:${prefix}`;
  const digits = Number(settings.get('number_digits')) || 4;
  return db.tx(() => {
    db.run('INSERT INTO counters (name, value) VALUES (?, 0) ON CONFLICT(name) DO NOTHING', counterName);
    db.run('UPDATE counters SET value = value + 1 WHERE name = ?', counterName);
    const { value } = db.get('SELECT value FROM counters WHERE name = ?', counterName);
    return prefix + String(value).padStart(digits, '0');
  });
}

module.exports = { next };
