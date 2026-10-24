'use strict';
const config = require('./config');
const { createApp } = require('./app');
const db = require('./db');
const sales = require('./lib/sales');
const backup = require('./lib/backup');
const settings = require('./lib/settings');
const bootstrap = require('./db/bootstrap');

if (config.isProd && config.sessionSecret.startsWith('dev-secret')) {
  console.error('FEHLER: SESSION_SECRET muss in Produktion gesetzt sein (.env).');
  process.exit(1);
}

const demo = require('./lib/demo');

// Demo-Reset vor dem App-Start, damit noch keine (leere) Datenbank angelegt ist
if (demo.enabled) {
  try {
    demo.reset();
  } catch (e) {
    console.error('FEHLER:', e.message);
    process.exit(1);
  }
}
const app = createApp();
if (!demo.enabled) bootstrap.ensureAdmin();

// Hintergrundjobs: wiederkehrende Rechnungen, Session-Aufräumen, tägliches Backup
function jobs() {
  try {
    const created = sales.runRecurring();
    if (created.length) console.log(`Wiederkehrende Rechnungen erzeugt: ${created.length}`);
    require('./lib/shifts').notifyExpiring();
    db.run("DELETE FROM sessions WHERE expires_at < datetime('now')");
    db.run("DELETE FROM password_resets WHERE expires_at < datetime('now') OR used = 1");
    if (settings.get('backup_auto') === '1' && !demo.enabled) {
      const last = backup.list()[0];
      if (!last || Date.now() - last.mtime.getTime() > 24 * 3600 * 1000) console.log('Backup:', backup.create('auto'));
    }
  } catch (e) {
    console.error('Hintergrundjob fehlgeschlagen:', e);
  }
}
jobs();
setInterval(jobs, 60 * 60 * 1000).unref();
if (demo.enabled) setInterval(() => { try { demo.resetIfDue(); } catch (e) { console.error('Demo-Reset fehlgeschlagen:', e); } }, 5 * 60 * 1000).unref();

const server = app.listen(config.port, config.host, () => {
  console.log(`Back Office läuft auf ${config.baseUrl} (Port ${config.port}, ${config.env})`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
