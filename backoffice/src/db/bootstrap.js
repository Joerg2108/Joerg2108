'use strict';
const crypto = require('node:crypto');
const db = require('./index');
const config = require('../config');
const { hashPassword } = require('../lib/security');

// Legt beim ersten Start einen Admin an. Ohne ADMIN_PASSWORD wird ein Zufallspasswort erzeugt und einmalig ausgegeben.
function ensureAdmin() {
  const n = db.get('SELECT COUNT(*) AS n FROM users').n;
  if (n > 0) return null;
  const password = config.admin.password || crypto.randomBytes(9).toString('base64url') + 'A1';
  db.run("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')", config.admin.email, config.admin.name, hashPassword(password));
  console.log('──────────────────────────────────────────────');
  console.log(' Erster Start – Administrator angelegt:');
  console.log(`   E-Mail:   ${config.admin.email}`);
  if (!config.admin.password) console.log(`   Passwort: ${password}   (bitte nach dem Login ändern!)`);
  console.log('──────────────────────────────────────────────');
  return password;
}

module.exports = { ensureAdmin };
