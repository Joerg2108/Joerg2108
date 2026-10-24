'use strict';
// Musterdaten für Vorführung & Tests:  npm run seed   (Option --force überschreibt eine bestehende Datenbank)
const fs = require('node:fs');
const config = require('../config');

if (fs.existsSync(config.dbFile) && !process.argv.includes('--force')) {
  console.error(`Datenbank existiert bereits (${config.dbFile}). Mit "npm run seed -- --force" neu anlegen.`);
  process.exit(1);
}
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbFile + suffix, { force: true });

const db = require('./index');
const demo = require('./demo-data');

db.open();
const password = process.env.ADMIN_PASSWORD || demo.PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || undefined;
demo.seed({ adminEmail, password });

console.log('Musterdaten (Muster Service GmbH) angelegt.');
console.log(`Login: ${adminEmail || demo.ACCOUNTS[0].email} / ${password}`);
console.log(`Weitere: ${demo.ACCOUNTS.slice(1).map((a) => a.email).join(', ')} – gleiches Passwort`);
db.close();
