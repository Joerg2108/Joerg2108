'use strict';
// Demo-Modus (DEMO_MODE=1): öffentliche Vorführ-Instanz für Interessenten.
//  - Musterdaten der fiktiven "Muster Service GmbH", Ein-Klick-Login auf der Anmeldeseite
//  - automatischer Reset alle DEMO_RESET_HOURS Stunden (und bei jedem Start)
//  - Sperren: Zugangsdaten, 2FA, Benutzer, API-Schlüssel, Logo, Backups; es werden keine E-Mails versendet
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const db = require('../db');
const settings = require('./settings');

const enabled = config.demo.enabled;
let lastReset = 0;

// Gesperrte Aktionen (nur POST) – alles andere darf ausprobiert werden
const BLOCKED = [
  [/^\/profil\/(passwort|2fa\/)/, 'Passwort und Zwei-Faktor-Anmeldung'],
  [/^\/profil\/?$/, 'Das Profil'],
  [/^\/passwort-(vergessen|neu)/, 'Das Zurücksetzen von Passwörtern'],
  [/^\/admin\/benutzer/, 'Die Benutzerverwaltung'],
  [/^\/admin\/api\/?$/, 'Das Erstellen von API-Schlüsseln'],
  [/^\/admin\/einstellungen\/(logo|testmail)/, 'Logo-Upload und Testmail'],
  [/^\/admin\/backups/, 'Das Erstellen von Backups'],
];

function blockedReason(method, p) {
  if (!enabled || method !== 'POST') return null;
  const hit = BLOCKED.find(([re]) => re.test(p));
  return hit ? hit[1] : null;
}

function guard(req, res, next) {
  const reason = blockedReason(req.method, req.path);
  if (!reason) return next();
  req.flash('error', `${reason} ist in der Demo-Version deaktiviert. In Ihrer eigenen Installation steht alles uneingeschränkt zur Verfügung.`);
  res.redirect(req.get('referer') || '/');
}

// Markierung im Datenverzeichnis: nur so gekennzeichnete Datenbanken darf der Demo-Modus löschen
const marker = () => path.join(config.dataDir, '.demo-instance');

// Datenbank und Uploads verwerfen und Musterdaten neu anlegen (synchron – läuft zwischen zwei Anfragen).
// Schutz: Eine vorhandene Datenbank ohne Demo-Markierung (= echte Daten) wird niemals gelöscht.
function reset({ force = false } = {}) {
  const demoData = require('../db/demo-data');
  if (!force && fs.existsSync(config.dbFile) && !fs.existsSync(marker())) {
    throw new Error(`DEMO_MODE ist aktiv, aber ${config.dbFile} enthält keine Demo-Daten. `
      + 'Zum Schutz echter Daten wird nichts gelöscht. Demo-Instanzen brauchen ein eigenes, leeres DATA_DIR.');
  }
  db.close();
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbFile + suffix, { force: true });
  fs.rmSync(config.uploadDir, { recursive: true, force: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });
  db.open();
  fs.writeFileSync(marker(), 'Demo-Instanz – Daten werden automatisch zurückgesetzt.\n');
  settings.reset();
  demoData.seed();
  settings.reset();
  lastReset = Date.now();
  console.log(`Demo-Daten zurückgesetzt (nächster Reset in ${config.demo.resetHours} Std.)`);
}

function resetIfDue() {
  if (enabled && Date.now() - lastReset >= config.demo.resetHours * 3600 * 1000) reset();
}

function nextReset() {
  return new Date(lastReset + config.demo.resetHours * 3600 * 1000);
}

// Daten für Banner und Login-Seite
function locals() {
  if (!enabled) return null;
  const { ACCOUNTS, PASSWORD } = require('../db/demo-data');
  const next = nextReset();
  return {
    accounts: ACCOUNTS,
    password: PASSWORD,
    contactUrl: config.demo.contactUrl,
    vendor: config.demo.vendor,
    resetHours: config.demo.resetHours,
    nextReset: next.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }),
  };
}

module.exports = { enabled, guard, reset, resetIfDue, blockedReason, locals };
