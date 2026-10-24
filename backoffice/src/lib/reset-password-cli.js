'use strict';
// Notfall: Passwort eines Benutzers neu setzen (z. B. wenn kein E-Mail-Versand eingerichtet ist).
// Aufruf auf dem Server:  sudo bash deploy/reset-password.sh info@joerg-noack.com
const crypto = require('node:crypto');
const db = require('../db');
const { hashPassword } = require('./security');

const email = process.argv[2];
if (!email) {
  console.error('Aufruf: reset-password-cli.js <E-Mail>');
  process.exit(1);
}
db.open();
const u = db.get('SELECT id, name FROM users WHERE email = ?', email);
if (!u) {
  console.error(`Kein Benutzer mit der E-Mail ${email} gefunden.`);
  process.exit(1);
}
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const raw = [...crypto.randomBytes(12)].map((b) => alphabet[b % alphabet.length]).join('');
const password = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-Ab7`;
db.run("UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL, totp_enabled = 0, totp_secret = NULL, active = 1, updated_at = datetime('now') WHERE id = ?", hashPassword(password), u.id);
db.run('DELETE FROM sessions WHERE user_id = ?', u.id);
require('./audit').log(null, 'passwort.notfall_reset', 'user', u.id);
console.log(`Neues Passwort für ${u.name} (${email}): ${password}`);
console.log('2FA wurde deaktiviert – bitte nach dem Login Passwort ändern und 2FA neu einrichten.');
db.close();
