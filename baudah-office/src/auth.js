'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { get, run, DATA_DIR } = require('./db');

const SESSION_DAYS = 14;
const COOKIE = 'baudah_sid';

/* ---------------- Passwörter (scrypt) ---------------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(pw, stored) {
  const [alg, saltB64, hashB64] = String(stored || '').split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(pw), Buffer.from(saltB64, 'base64'), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return crypto.timingSafeEqual(expected, actual);
}

/* ---------------- Geheimnisse (AES-256-GCM) ----------------
 * Das SMTP-Passwort liegt verschlüsselt in der Datenbank. Der Schlüssel
 * liegt separat in data/secret.key – eine gestohlene DB allein reicht nicht. */
const KEY_FILE = path.join(DATA_DIR, 'secret.key');
function key() {
  if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  return Buffer.from(fs.readFileSync(KEY_FILE, 'utf8').trim(), 'hex');
}

function encrypt(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return `enc:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}

function decrypt(value) {
  if (!value || !String(value).startsWith('enc:')) return value || '';
  try {
    const [, iv, tag, data] = value.split(':');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
  } catch {
    return '';
  }
}

/* ---------------- Sessions ---------------- */
function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function createSession(res, userId, secure) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 86400000;
  run('INSERT INTO sessions(token, user_id, expires_at) VALUES(?,?,?)', token, userId, expires);
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`
  );
}

function destroySession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  const s = get(
    `SELECT u.id, u.username, u.name, u.email, u.role FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`,
    token,
    Date.now()
  );
  return s || null;
}

function requireAuth(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Bitte melden Sie sich an.' });
  req.user = u;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren.' });
  next();
}

/* ---------------- Brute-Force-Schutz ---------------- */
const attempts = new Map();
function loginThrottle(ip) {
  const now = Date.now();
  const a = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60000);
  attempts.set(ip, a);
  return a.length >= 10;
}
function loginFailed(ip) {
  attempts.set(ip, [...(attempts.get(ip) || []), Date.now()]);
}
function loginOk(ip) {
  attempts.delete(ip);
}

module.exports = {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  createSession,
  destroySession,
  currentUser,
  requireAuth,
  requireAdmin,
  loginThrottle,
  loginFailed,
  loginOk,
};
