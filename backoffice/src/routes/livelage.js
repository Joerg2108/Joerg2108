'use strict';
const express = require('express');
const db = require('../db');
const sec = require('../lib/security');
const patrol = require('../lib/patrol');

const router = express.Router();
router.use(sec.requirePerm('livelage'));

router.get('/', (req, res) => {
  const running = db.all(
    `SELECT p.*, o.name AS object_name, s.first_name, s.last_name,
       (SELECT COUNT(*) FROM patrol_log l WHERE l.patrol_id = p.id) AS entries
     FROM patrols p LEFT JOIN objects o ON o.id = p.object_id LEFT JOIN staff s ON s.id = p.staff_id
     WHERE p.status = 'laeuft' ORDER BY p.started_at`);
  for (const p of running) p.last = db.all('SELECT * FROM patrol_log WHERE patrol_id = ? ORDER BY at DESC, id DESC LIMIT 5', p.id);
  const onDuty = db.all('SELECT t.*, u.name FROM timers t JOIN users u ON u.id = t.user_id ORDER BY t.started_at');
  const incidents = db.all(
    `SELECT i.*, o.name AS object_name FROM incidents i LEFT JOIN objects o ON o.id = i.object_id
     WHERE i.status != 'abgeschlossen' ORDER BY i.occurred_at DESC LIMIT 12`);
  const logsToday = db.get("SELECT COUNT(*) AS n FROM patrol_log WHERE date(at) = date('now')").n;
  res.render('livelage', {
    title: 'Live-Lage', running, onDuty, incidents, logsToday, LOG_KINDS: patrol.LOG_KINDS,
    now: new Date().toLocaleTimeString('de-DE'),
  });
});

module.exports = router;
