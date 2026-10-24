'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

let db;
let txDepth = 0;

function open(file = config.dbFile) {
  if (db) return db;
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  migrate(db);
  return db;
}

// Spätere Schema-Änderungen hier als nummerierte Migrationen ergänzen.
const migrations = [
  // 1: Kategorien für den Leistungskatalog
  (d) => d.exec('ALTER TABLE products ADD COLUMN category TEXT'),
];

function migrate(d) {
  const row = d.prepare('SELECT version FROM schema_version').get();
  let version = row ? row.version : 0;
  if (!row) d.prepare('INSERT INTO schema_version (version) VALUES (0)').run();
  for (; version < migrations.length; version++) {
    migrations[version](d);
    d.prepare('UPDATE schema_version SET version = ?').run(version + 1);
  }
}

function get() {
  return db || open();
}

// Kleine Helfer, damit Routen kompakt bleiben
const q = {
  all: (sql, ...p) => get().prepare(sql).all(...p),
  get: (sql, ...p) => get().prepare(sql).get(...p),
  run: (sql, ...p) => get().prepare(sql).run(...p),
  // Verschachtelbar: innere Aufrufe laufen als SAVEPOINT
  tx(fn) {
    const d = get();
    const sp = `sp${txDepth}`;
    d.exec(txDepth === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${sp}`);
    txDepth++;
    try {
      const r = fn();
      txDepth--;
      d.exec(txDepth === 0 ? 'COMMIT' : `RELEASE ${sp}`);
      return r;
    } catch (e) {
      txDepth--;
      d.exec(txDepth === 0 ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
      throw e;
    }
  },
};

function close() {
  if (db) db.close();
  db = undefined;
}

module.exports = { open, conn: get, close, ...q };
