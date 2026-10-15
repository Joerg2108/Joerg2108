'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { db, DATA_DIR, getSetting } = require('./db');

const DIR = path.join(DATA_DIR, 'backups');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

/** Konsistente Kopie der laufenden Datenbank (VACUUM INTO) */
function create(reason = 'auto') {
  const name = `baudah_${stamp()}_${reason}.sqlite`;
  const target = path.join(DIR, name);
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  prune();
  const st = fs.statSync(target);
  return { name, size: st.size, created: st.mtime };
}

function list() {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const st = fs.statSync(path.join(DIR, f));
      return { name: f, size: st.size, created: st.mtime };
    })
    .sort((a, b) => b.created - a.created);
}

function prune() {
  const keep = Number(getSetting('backup')?.keep) || 30;
  const auto = list().filter((b) => /_auto\.sqlite$/.test(b.name));
  for (const b of auto.slice(keep)) fs.rmSync(path.join(DIR, b.name), { force: true });
}

function file(name) {
  if (!/^baudah_[\w-]+\.sqlite$/.test(name)) throw Object.assign(new Error('Ungültiger Dateiname'), { status: 400 });
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) throw Object.assign(new Error('Sicherung nicht gefunden'), { status: 404 });
  return p;
}

/** Tägliche automatische Sicherung */
function schedule() {
  const run = () => {
    const today = stamp().slice(0, 10);
    if (!list().some((b) => b.name.includes(today) && b.name.endsWith('_auto.sqlite'))) {
      try {
        create('auto');
      } catch (e) {
        console.error('Automatische Sicherung fehlgeschlagen:', e.message);
      }
    }
  };
  run();
  setInterval(run, 60 * 60 * 1000).unref();
}

module.exports = { create, list, file, schedule };
