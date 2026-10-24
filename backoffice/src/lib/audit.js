'use strict';
const crypto = require('node:crypto');
const db = require('../db');

// Hash-verkettetes Protokoll: jede Zeile enthält den Hash der vorherigen.
// Manipulationen an der Datenbankdatei werden dadurch bei verify() sichtbar.
function hashRow(r) {
  return crypto.createHash('sha256')
    .update([r.prev_hash, r.user_id, r.action, r.entity, r.entity_id, r.details, r.ip, r.created_at].join('|'))
    .digest('hex');
}

function log(req, action, entity = null, entityId = null, details = null) {
  const user = req && req.user;
  const prev = db.get('SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1');
  const row = {
    prev_hash: prev ? prev.hash : '',
    user_id: user ? user.id : null,
    user_name: user ? user.name : (req && req.apiKey ? `API:${req.apiKey.name}` : 'System'),
    action,
    entity,
    entity_id: entityId,
    details: details == null ? null : (typeof details === 'string' ? details : JSON.stringify(details)),
    ip: req ? req.ip : null,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  row.hash = hashRow(row);
  db.run(
    `INSERT INTO audit_log (user_id, user_name, action, entity, entity_id, details, ip, prev_hash, hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.user_id, row.user_name, row.action, row.entity, row.entity_id, row.details, row.ip, row.prev_hash, row.hash, row.created_at,
  );
}

function verify() {
  let prev = '';
  let count = 0;
  for (const r of db.all('SELECT * FROM audit_log ORDER BY id')) {
    if (r.prev_hash !== prev || hashRow(r) !== r.hash) return { ok: false, brokenAt: r.id, count };
    prev = r.hash;
    count++;
  }
  return { ok: true, count };
}

module.exports = { log, verify };
