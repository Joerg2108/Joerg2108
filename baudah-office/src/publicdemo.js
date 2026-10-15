'use strict';
/*
 * Öffentlicher Demo-Betrieb (Umgebungsvariable BAUDAH_DEMO=1).
 * Für einen Server im Internet, dessen Link man Interessenten schickt:
 *  - Zugang demo / demo1234 wird automatisch angelegt und auf der Anmeldeseite angezeigt
 *  - E-Mails werden NICHT verschickt (nur protokolliert) – kein Missbrauch als Spam-Schleuder
 *  - Benutzer, Passwörter und E-Mail-Zugang sind gesperrt
 *  - Daten werden beim Start und danach alle 6 Stunden auf den Demo-Stand zurückgesetzt
 */
const { get, run, getSetting, setSetting } = require('./db');
const auth = require('./auth');
const demo = require('./demo');

const ENABLED = process.env.BAUDAH_DEMO === '1';
const USER = 'demo';
const PASS = 'demo1234';
const RESET_HOURS = Number(process.env.BAUDAH_DEMO_RESET_HOURS) || 6;

function ensureUser() {
  const u = get('SELECT id FROM users WHERE username = ?', USER);
  if (u) {
    run("UPDATE users SET password = ?, active = 1, role = 'admin' WHERE id = ?", auth.hashPassword(PASS), u.id);
    return u.id;
  }
  const r = run("INSERT INTO users(username, name, email, password, role) VALUES(?, 'Demo-Benutzer', '', ?, 'admin')", USER, auth.hashPassword(PASS));
  return Number(r.lastInsertRowid);
}

function ensureCompany() {
  const c = getSetting('company');
  // Platzhalter, damit Besucher Rechnungen festschreiben können
  setSetting('company', {
    ...c,
    tax_number: c.tax_number || '000/000/00000 (Demo)',
    iban: c.iban || 'DE89370400440532013000',
    bic: c.bic || 'COBADEFFXXX',
    bank_name: c.bank_name || 'Musterbank (Demo)',
  });
}

function refresh() {
  const userId = ensureUser();
  const user = { id: userId };
  if (!demo.isEmpty()) demo.resetData(user, { withBackup: false });
  demo.loadDemo(user);
  console.log(`[Demo] Demo-Daten neu geladen (${new Date().toLocaleString('de-DE')})`);
}

function start() {
  if (!ENABLED) return;
  ensureCompany();
  refresh();
  setInterval(() => {
    try {
      refresh();
    } catch (e) {
      console.error('[Demo] Zurücksetzen fehlgeschlagen:', e.message);
    }
  }, RESET_HOURS * 3600 * 1000).unref();
}

/** Sperrt im Demo-Betrieb Aktionen, die anderen Besuchern schaden oder missbraucht werden könnten */
function guard(req, res, next) {
  if (!ENABLED) return next();
  const blocked =
    (req.path.startsWith('/users') && req.method !== 'GET') ||
    req.path === '/me/password' ||
    (req.path === '/settings/mail' && req.method === 'PUT') ||
    req.path === '/setup' ||
    (req.path.startsWith('/backup') && !(req.method === 'GET' && req.path === '/backups'));
  if (blocked) return res.status(403).json({ error: 'In der Online-Demo nicht verfügbar. In der Vollversion ist diese Funktion selbstverständlich enthalten.' });
  next();
}

const info = () => (ENABLED ? { user: USER, password: PASS, reset_hours: RESET_HOURS } : null);

module.exports = { ENABLED, start, guard, info };
