'use strict';
const crypto = require('node:crypto');
const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const config = require('../config');
const sec = require('../lib/security');
const totp = require('../lib/totp');
const audit = require('../lib/audit');
const mailer = require('../lib/mailer');
const settings = require('../lib/settings');
const { wrap } = require('../lib/route');

const router = express.Router();
const loginLimiter = sec.rateLimit({ windowMs: 15 * 60 * 1000, max: 20, key: 'login', message: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' });

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/');

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/login', { title: 'Anmelden', layout: 'layout-auth', next: safeNext(req.query.next), email: '' });
});

router.post('/login', loginLimiter, (req, res) => {
  const email = String(req.body.email || '').trim();
  const next = safeNext(req.body.next);
  const fail = (msg) => res.status(401).render('auth/login', { title: 'Anmelden', layout: 'layout-auth', next, email, error: msg });
  const u = db.get('SELECT * FROM users WHERE email = ?', email);
  if (u && u.locked_until && u.locked_until > new Date().toISOString()) {
    return fail('Konto vorübergehend gesperrt (zu viele Fehlversuche). Bitte später erneut versuchen.');
  }
  if (!u || !u.active || !sec.checkPassword(req.body.password, u.password_hash)) {
    if (u) {
      const fails = u.failed_logins + 1;
      const lock = fails >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      db.run('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?', lock ? 0 : fails, lock, u.id);
      audit.log({ ip: req.ip, user: null }, 'login.fehlgeschlagen', 'user', u.id, { email });
    }
    return fail('E-Mail oder Passwort ist falsch.');
  }
  if (u.totp_enabled) {
    req.session.pending2fa = { userId: u.id, next, at: Date.now() };
    return res.redirect('/login/2fa');
  }
  completeLogin(req, res, u, next);
});

function completeLogin(req, res, u, next) {
  db.run("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?", u.id);
  sec.regenerate(req, res, u.id);
  req.user = u;
  audit.log(req, 'login', 'user', u.id);
  res.redirect(next || '/');
}

router.get('/login/2fa', (req, res) => {
  if (!req.session.pending2fa) return res.redirect('/login');
  res.render('auth/2fa', { title: 'Zwei-Faktor-Anmeldung', layout: 'layout-auth' });
});

router.post('/login/2fa', loginLimiter, (req, res) => {
  const p = req.session.pending2fa;
  if (!p || Date.now() - p.at > 5 * 60 * 1000) {
    delete req.session.pending2fa;
    return res.redirect('/login');
  }
  const u = db.get('SELECT * FROM users WHERE id = ?', p.userId);
  if (!u || !totp.verify(u.totp_secret, req.body.code)) {
    return res.status(401).render('auth/2fa', { title: 'Zwei-Faktor-Anmeldung', layout: 'layout-auth', error: 'Code ungültig.' });
  }
  completeLogin(req, res, u, p.next);
});

router.post('/logout', (req, res) => {
  if (req.user) audit.log(req, 'logout', 'user', req.user.id);
  sec.destroy(req, res);
  res.redirect('/login');
});

// ---------- Passwort vergessen ----------
router.get('/passwort-vergessen', (req, res) => {
  res.render('auth/forgot', { title: 'Passwort vergessen', layout: 'layout-auth' });
});

router.post('/passwort-vergessen', loginLimiter, wrap(async (req, res) => {
  const u = db.get('SELECT * FROM users WHERE email = ? AND active = 1', String(req.body.email || '').trim());
  if (u) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expires = new Date(Date.now() + 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    db.run('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)', sec.hashToken(token), u.id, expires);
    await mailer.send({
      to: u.email,
      subject: `${settings.get('app_title')}: Passwort zurücksetzen`,
      text: `Hallo ${u.name},\n\nüber folgenden Link kannst du dein Passwort neu setzen (1 Stunde gültig):\n${config.baseUrl}/passwort-neu/${token}\n\nFalls du das nicht angefordert hast, ignoriere diese Mail einfach.`,
    });
    audit.log({ ip: req.ip }, 'passwort.reset_angefordert', 'user', u.id);
  }
  // Immer gleiche Antwort – verrät nicht, ob die E-Mail existiert
  res.render('auth/forgot', { title: 'Passwort vergessen', layout: 'layout-auth', sent: true });
}));

router.get('/passwort-neu/:token', (req, res) => {
  const r = db.get("SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')", sec.hashToken(req.params.token));
  if (!r) return res.render('auth/forgot', { title: 'Link ungültig', layout: 'layout-auth', error: 'Der Link ist ungültig oder abgelaufen.' });
  res.render('auth/reset', { title: 'Neues Passwort', layout: 'layout-auth', token: req.params.token });
});

router.post('/passwort-neu/:token', loginLimiter, (req, res) => {
  const r = db.get("SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')", sec.hashToken(req.params.token));
  if (!r) return res.redirect('/passwort-vergessen');
  const problems = sec.passwordProblems(req.body.password);
  if (problems.length || req.body.password !== req.body.password2) {
    return res.render('auth/reset', {
      title: 'Neues Passwort', layout: 'layout-auth', token: req.params.token,
      error: problems.length ? `Passwort benötigt ${problems.join(', ')}.` : 'Passwörter stimmen nicht überein.',
    });
  }
  db.tx(() => {
    db.run("UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?", sec.hashPassword(req.body.password), r.user_id);
    db.run('UPDATE password_resets SET used = 1 WHERE token_hash = ?', r.token_hash);
    db.run('DELETE FROM sessions WHERE user_id = ?', r.user_id);
  });
  audit.log({ ip: req.ip }, 'passwort.zurueckgesetzt', 'user', r.user_id);
  req.flash('success', 'Passwort geändert. Bitte melde dich an.');
  res.redirect('/login');
});

// ---------- Profil (eingeloggt) ----------
router.get('/profil', sec.requireLogin, wrap(async (req, res) => {
  const u = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  let qr = null;
  let secret = null;
  if (!u.totp_enabled) {
    secret = req.session.totpSetup || totp.generateSecret();
    req.session.totpSetup = secret;
    qr = await QRCode.toDataURL(totp.otpauthUrl(secret, u.email, settings.get('app_title') + ' ' + settings.get('company_name')));
  }
  const sessions = db.all('SELECT id, ip, user_agent, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC', u.id);
  res.render('auth/profile', { title: 'Mein Profil', u, qr, secret, sessions, currentSession: req.sessionId });
}));

router.post('/profil', sec.requireLogin, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name) db.run("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?", name, req.user.id);
  req.flash('success', 'Profil gespeichert.');
  res.redirect('/profil');
});

router.post('/profil/passwort', sec.requireLogin, (req, res) => {
  const u = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!sec.checkPassword(req.body.current, u.password_hash)) {
    req.flash('error', 'Aktuelles Passwort ist falsch.');
    return res.redirect('/profil');
  }
  const problems = sec.passwordProblems(req.body.password);
  if (problems.length) req.flash('error', `Neues Passwort benötigt ${problems.join(', ')}.`);
  else if (req.body.password !== req.body.password2) req.flash('error', 'Passwörter stimmen nicht überein.');
  else {
    db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", sec.hashPassword(req.body.password), u.id);
    db.run('DELETE FROM sessions WHERE user_id = ? AND id != ?', u.id, req.sessionId);
    audit.log(req, 'passwort.geaendert', 'user', u.id);
    req.flash('success', 'Passwort geändert. Andere Sitzungen wurden abgemeldet.');
  }
  res.redirect('/profil');
});

router.post('/profil/2fa/aktivieren', sec.requireLogin, (req, res) => {
  const secret = req.session.totpSetup;
  if (!secret || !totp.verify(secret, req.body.code)) {
    req.flash('error', 'Code ungültig – bitte erneut versuchen.');
    return res.redirect('/profil');
  }
  db.run('UPDATE users SET totp_secret = ?, totp_enabled = 1 WHERE id = ?', secret, req.user.id);
  delete req.session.totpSetup;
  audit.log(req, '2fa.aktiviert', 'user', req.user.id);
  req.flash('success', 'Zwei-Faktor-Authentifizierung ist aktiv.');
  res.redirect('/profil');
});

router.post('/profil/2fa/deaktivieren', sec.requireLogin, (req, res) => {
  const u = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!sec.checkPassword(req.body.password, u.password_hash)) {
    req.flash('error', 'Passwort ist falsch.');
    return res.redirect('/profil');
  }
  db.run('UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?', u.id);
  audit.log(req, '2fa.deaktiviert', 'user', u.id);
  req.flash('success', 'Zwei-Faktor-Authentifizierung deaktiviert.');
  res.redirect('/profil');
});

router.post('/profil/sitzungen/abmelden', sec.requireLogin, (req, res) => {
  db.run('DELETE FROM sessions WHERE user_id = ? AND id != ?', req.user.id, req.sessionId);
  req.flash('success', 'Alle anderen Sitzungen wurden abgemeldet.');
  res.redirect('/profil');
});

module.exports = router;
