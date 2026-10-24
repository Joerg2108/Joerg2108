'use strict';
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');

// ---------- Rollen & Rechte ----------
// Jede Rolle erbt nichts automatisch – die Matrix ist bewusst explizit und im README dokumentiert.
const PERMISSIONS = {
  admin: ['*'],
  manager: ['dashboard', 'customers', 'leads', 'sales', 'sales.finalize', 'payments', 'projects', 'tasks', 'calendar', 'time', 'time.all', 'expenses', 'files', 'reports', 'products', 'shifts', 'shifts.view', 'staff'],
  buchhaltung: ['dashboard', 'customers', 'sales', 'sales.finalize', 'payments', 'expenses', 'files', 'reports', 'products'],
  mitarbeiter: ['dashboard', 'customers', 'leads', 'projects', 'tasks', 'calendar', 'time', 'files', 'shifts.view'],
};

const ROLE_LABELS = { admin: 'Administrator', manager: 'Manager', buchhaltung: 'Buchhaltung', mitarbeiter: 'Mitarbeiter' };

function can(user, perm) {
  if (!user) return false;
  const list = PERMISSIONS[user.role] || [];
  return list.includes('*') || list.includes(perm);
}

function requirePerm(perm) {
  return (req, res, next) => {
    if (can(req.user, perm)) return next();
    res.status(403).render('error', { title: 'Keine Berechtigung', message: 'Für diesen Bereich fehlt dir die Berechtigung.' });
  };
}

// ---------- Passwörter ----------
function hashPassword(pw) {
  return bcrypt.hashSync(pw, 12);
}

function checkPassword(pw, hash) {
  return bcrypt.compareSync(String(pw || ''), hash || '');
}

function passwordProblems(pw) {
  const p = [];
  if (!pw || pw.length < 10) p.push('mindestens 10 Zeichen');
  if (!/[A-ZÄÖÜ]/.test(pw || '')) p.push('einen Großbuchstaben');
  if (!/[a-zäöüß]/.test(pw || '')) p.push('einen Kleinbuchstaben');
  if (!/\d/.test(pw || '')) p.push('eine Ziffer');
  return p;
}

// ---------- Sessions (serverseitig in SQLite, signiertes Cookie) ----------
const COOKIE = 'bo_sid';

function sign(value) {
  return value + '.' + crypto.createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

function unsign(signed) {
  if (!signed || !signed.includes('.')) return null;
  const value = signed.slice(0, signed.lastIndexOf('.'));
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signed);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual) ? value : null;
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setCookie(res, value, maxAgeSec) {
  const parts = [`${COOKIE}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`];
  if (config.isProd || config.baseUrl.startsWith('https://')) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sid = unsign(cookies[COOKIE]);
  let row = sid ? db.get("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')", sid) : null;
  if (!row) {
    const id = crypto.randomBytes(32).toString('base64url');
    const expires = new Date(Date.now() + config.sessionDays * 86400000).toISOString().replace('T', ' ').slice(0, 19);
    db.run('INSERT INTO sessions (id, data, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)', id, '{}', req.ip, String(req.headers['user-agent'] || '').slice(0, 250), expires);
    row = { id, user_id: null, data: '{}' };
    setCookie(res, sign(id), config.sessionDays * 86400);
  }
  req.session = JSON.parse(row.data || '{}');
  req.sessionId = row.id;
  req.sessionUserId = row.user_id;
  const before = row.data;
  res.on('finish', () => {
    const after = JSON.stringify(req.session);
    if (after !== before && req.sessionId) db.run('UPDATE sessions SET data = ? WHERE id = ?', after, req.sessionId);
  });
  next();
}

// Neue Session-ID nach Login (Schutz gegen Session Fixation)
function regenerate(req, res, userId) {
  if (req.sessionId) db.run('DELETE FROM sessions WHERE id = ?', req.sessionId);
  const id = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.sessionDays * 86400000).toISOString().replace('T', ' ').slice(0, 19);
  req.session = { csrf: crypto.randomBytes(24).toString('base64url') };
  db.run('INSERT INTO sessions (id, user_id, data, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)', id, userId, JSON.stringify(req.session), req.ip, String(req.headers['user-agent'] || '').slice(0, 250), expires);
  req.sessionId = id;
  req.sessionUserId = userId;
  setCookie(res, sign(id), config.sessionDays * 86400);
}

function destroy(req, res) {
  if (req.sessionId) db.run('DELETE FROM sessions WHERE id = ?', req.sessionId);
  req.sessionId = null;
  req.session = {};
  setCookie(res, '', 0);
}

function loadUser(req, res, next) {
  req.user = null;
  if (req.sessionUserId) {
    const u = db.get('SELECT id, email, name, role, active, totp_enabled, hourly_rate FROM users WHERE id = ?', req.sessionUserId);
    if (u && u.active) req.user = u;
  }
  res.locals.user = req.user;
  next();
}

function requireLogin(req, res, next) {
  if (req.user) return next();
  if (req.accepts(['html', 'json']) === 'json') return res.status(401).json({ error: 'Nicht angemeldet' });
  res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

// ---------- CSRF (Synchronizer Token) ----------
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('base64url');
  res.locals.csrf = req.session.csrf;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = (req.body && req.body._csrf) || req.headers['x-csrf-token'] || (req.query && req.query._csrf);
  const a = Buffer.from(String(token || ''));
  const b = Buffer.from(req.session.csrf);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  res.status(403).render('error', { title: 'Sicherheitsprüfung fehlgeschlagen', message: 'Das Formular ist abgelaufen. Bitte lade die Seite neu und versuche es erneut.' });
}

// ---------- Rate Limiting (In-Memory, pro IP + Schlüssel) ----------
function rateLimit({ windowMs, max, key = 'default', message = 'Zu viele Anfragen – bitte später erneut versuchen.' }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const k = `${key}:${req.ip}`;
    const now = Date.now();
    let h = hits.get(k);
    if (!h || h.reset < now) h = { count: 0, reset: now + windowMs };
    h.count++;
    hits.set(k, h);
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.reset - now) / 1000)));
      if (req.path.startsWith('/api/')) return res.status(429).json({ error: message });
      return res.status(429).render('error', { title: 'Zu viele Versuche', message });
    }
    next();
  };
}

// ---------- API-Schlüssel ----------
function hashToken(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

function createApiKey(name, scopes, userId) {
  const raw = 'bo_' + crypto.randomBytes(24).toString('base64url');
  db.run('INSERT INTO api_keys (name, key_hash, key_prefix, scopes, created_by) VALUES (?, ?, ?, ?, ?)', name, hashToken(raw), raw.slice(0, 10), scopes, userId);
  return raw;
}

function apiAuth(scope) {
  return (req, res, next) => {
    const h = String(req.headers.authorization || '');
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    const key = token ? db.get('SELECT * FROM api_keys WHERE key_hash = ? AND revoked = 0', hashToken(token)) : null;
    if (!key) return res.status(401).json({ error: 'Ungültiger oder fehlender API-Schlüssel' });
    const scopes = key.scopes.split(',');
    if (!scopes.includes(scope) && !scopes.includes('write')) return res.status(403).json({ error: `Scope "${scope}" fehlt` });
    db.run("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?", key.id);
    req.apiKey = key;
    next();
  };
}

module.exports = {
  PERMISSIONS, ROLE_LABELS, can, requirePerm, hashPassword, checkPassword, passwordProblems,
  sessionMiddleware, regenerate, destroy, loadUser, requireLogin, csrf, rateLimit, hashToken, createApiKey, apiAuth,
};
