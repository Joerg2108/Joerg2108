'use strict';
const fs = require('node:fs');
const path = require('node:path');
const db = require('../db');
const config = require('../config');

// Konsistentes Online-Backup per VACUUM INTO (läuft auch bei laufendem Betrieb)
function create(label = 'auto') {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const file = path.join(config.backupDir, `backup-${stamp}-${label}.sqlite`);
  db.conn().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  prune();
  return file;
}

function list() {
  if (!fs.existsSync(config.backupDir)) return [];
  return fs.readdirSync(config.backupDir)
    .filter((n) => n.endsWith('.sqlite'))
    .map((name) => {
      const st = fs.statSync(path.join(config.backupDir, name));
      return { name, size: st.size, mtime: st.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function prune() {
  const files = list();
  for (const f of files.slice(config.backupKeep)) fs.unlinkSync(path.join(config.backupDir, f.name));
}

function resolve(name) {
  if (!/^backup-[\w-]+\.sqlite$/.test(name)) return null;
  const p = path.join(config.backupDir, name);
  return fs.existsSync(p) ? p : null;
}

module.exports = { create, list, resolve };
