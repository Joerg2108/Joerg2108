'use strict';
// Gemeinsame Test-Umgebung: eigene temporäre Datenbank je Testlauf
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bo-test-'));
process.env.DATA_DIR = dir;
process.env.ADMIN_EMAIL = 'admin@test.de';
process.env.ADMIN_PASSWORD = 'Test-Passwort1';
process.env.CORS_ORIGINS = 'https://joerg-noack.com';

const db = require('../src/db');
db.open();
require('../src/db/bootstrap').ensureAdmin();

function customer(extra = {}) {
  const numbering = require('../src/lib/numbering');
  return Number(db.run('INSERT INTO customers (number, company, email, street, zip, city) VALUES (?, ?, ?, ?, ?, ?)',
    numbering.next('customer'), extra.company || 'Test GmbH', 'kunde@test.de', 'Weg 1', '12345', 'Berlin').lastInsertRowid);
}

// Minimaler HTTP-Client mit Cookie-Jar
function client(base) {
  let cookie = '';
  async function req(p, opts = {}) {
    const r = await fetch(base + p, { redirect: 'manual', ...opts, headers: { cookie, ...(opts.headers || {}) } });
    for (const c of r.headers.getSetCookie()) {
      const v = c.split(';')[0];
      if (v.startsWith('bo_sid=')) cookie = v;
    }
    return r;
  }
  async function csrf(p = '/login') {
    const html = await (await req(p)).text();
    return (html.match(/name="_csrf" value="([^"]+)"/) || [])[1];
  }
  async function login(email = 'admin@test.de', password = 'Test-Passwort1') {
    const token = await csrf('/login');
    return req('/login', { method: 'POST', body: new URLSearchParams({ _csrf: token, email, password, next: '/' }) });
  }
  async function post(p, data, from = '/') {
    const token = await csrf(from);
    return req(p, { method: 'POST', body: new URLSearchParams({ _csrf: token, ...data }) });
  }
  return { req, csrf, login, post };
}

function cleanup() {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { db, dir, customer, client, cleanup };
