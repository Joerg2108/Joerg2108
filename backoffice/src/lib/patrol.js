'use strict';
// Gemeinsame Streifen-/Wachbuch-Logik für Office und Wächter-App.
const db = require('../db');

const LOG_KINDS = { rundgang: 'Rundgang', kontrollpunkt: 'Kontrollpunkt', vorkommnis: 'Vorkommnis', notiz: 'Notiz' };

// Laufende Streife eines Back-Office-Benutzers (Wächter-App)
function runningForUser(userId) {
  return db.get("SELECT * FROM patrols WHERE user_id = ? AND status = 'laeuft' ORDER BY started_at DESC LIMIT 1", userId);
}

function start({ objectId = null, staffId = null, userId = null }) {
  const r = db.run(
    "INSERT INTO patrols (object_id, staff_id, user_id, started_at, status) VALUES (?, ?, ?, datetime('now'), 'laeuft')",
    objectId || null, staffId || null, userId || null,
  );
  return Number(r.lastInsertRowid);
}

function addLog(patrolId, kind, text) {
  const k = LOG_KINDS[kind] ? kind : 'notiz';
  db.tx(() => {
    db.run('INSERT INTO patrol_log (patrol_id, kind, text) VALUES (?, ?, ?)', patrolId, k, text || null);
    if (k === 'rundgang') db.run('UPDATE patrols SET rounds = rounds + 1 WHERE id = ?', patrolId);
  });
}

function endPatrol(patrolId) {
  const logs = db.all('SELECT kind, text FROM patrol_log WHERE patrol_id = ?', patrolId);
  const hasIncident = logs.some((l) => l.kind === 'vorkommnis');
  const summary = logs.filter((l) => l.kind !== 'rundgang' && l.text)
    .map((l) => `${LOG_KINDS[l.kind]}: ${l.text}`).join('\n') || (hasIncident ? '' : 'Keine besonderen Vorkommnisse.');
  db.run("UPDATE patrols SET ended_at = datetime('now'), status = ?, summary = ? WHERE id = ?", hasIncident ? 'vorfall' : 'ob', summary, patrolId);
  return hasIncident;
}

module.exports = { LOG_KINDS, runningForUser, start, addLog, endPatrol };
