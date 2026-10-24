'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const config = require('../config');
const settings = require('../lib/settings');
const audit = require('../lib/audit');
const backup = require('../lib/backup');
const mailer = require('../lib/mailer');
const sec = require('../lib/security');
const f = require('../lib/format');
const { wrap, id, notFound, UserError } = require('../lib/route');

const router = express.Router();
router.use(sec.requirePerm('admin'));

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadDir),
    filename: (req, file, cb) => cb(null, 'logo-' + crypto.randomBytes(6).toString('hex') + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /\.(png|jpe?g)$/i.test(file.originalname)),
});

router.get('/', (req, res) => res.redirect('/admin/einstellungen'));

// ---------- Einstellungen ----------
router.get('/einstellungen', (req, res) => {
  res.render('admin/settings', { title: 'Einstellungen', tab: req.query.tab || 'firma', mailEnabled: mailer.enabled() });
});

router.post('/einstellungen', (req, res) => {
  const data = { ...req.body };
  // Nicht angehakte Checkboxen werden vom Browser nicht gesendet -> explizit auf 0 setzen
  for (const k of String(req.body._checkboxes || '').split(',').filter(Boolean)) data[k] = req.body[k] ? '1' : '0';
  for (const k of ['_csrf', '_tab', '_checkboxes', 'logo_file']) delete data[k];
  settings.setMany(data);
  audit.log(req, 'einstellungen.geaendert', 'settings', null, Object.keys(data));
  req.flash('success', 'Einstellungen gespeichert.');
  res.redirect(`/admin/einstellungen?tab=${encodeURIComponent(req.body._tab || 'firma')}`);
});

router.post('/einstellungen/logo', (req, res) => {
  logoUpload.single('logo')(req, res, (err) => {
    if (err || !req.file) {
      req.flash('error', 'Bitte ein PNG oder JPG bis 2 MB hochladen.');
      return res.redirect('/admin/einstellungen?tab=design');
    }
    const old = settings.get('logo_file');
    if (old) fs.rmSync(path.join(config.uploadDir, path.basename(old)), { force: true });
    settings.setMany({ logo_file: req.file.filename });
    req.flash('success', 'Logo gespeichert.');
    res.redirect('/admin/einstellungen?tab=design');
  });
});

router.post('/einstellungen/logo/entfernen', (req, res) => {
  const old = settings.get('logo_file');
  if (old) fs.rmSync(path.join(config.uploadDir, path.basename(old)), { force: true });
  settings.setMany({ logo_file: '' });
  res.redirect('/admin/einstellungen?tab=design');
});

router.post('/einstellungen/testmail', wrap(async (req, res) => {
  const r = await mailer.send({ to: req.user.email, subject: 'Testmail aus dem Back Office', text: 'Wenn du diese Mail liest, funktioniert der Versand. 👍' });
  req.flash(r.simulated ? 'warning' : 'success', r.simulated ? 'SMTP ist nicht konfiguriert (siehe .env). Mail wurde nur ins Log geschrieben.' : `Testmail an ${req.user.email} gesendet.`);
  res.redirect('/admin/einstellungen?tab=system');
}));

// ---------- Benutzer ----------
router.get('/benutzer', (req, res) => {
  const rows = db.all('SELECT u.*, (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS sessions FROM users u ORDER BY active DESC, name');
  res.render('admin/users', { title: 'Benutzer & Rollen', rows, PERMISSIONS: sec.PERMISSIONS });
});

router.get('/benutzer/neu', (req, res) => res.render('admin/user-form', { title: 'Neuer Benutzer', u: { role: 'mitarbeiter', active: 1 } }));

router.post('/benutzer', wrap((req, res) => {
  const email = String(req.body.email || '').trim();
  const name = String(req.body.name || '').trim();
  if (!email || !name) throw new UserError('Name und E-Mail sind Pflicht.');
  const problems = sec.passwordProblems(req.body.password);
  if (problems.length) throw new UserError(`Passwort benötigt ${problems.join(', ')}.`);
  const role = sec.PERMISSIONS[req.body.role] ? req.body.role : 'mitarbeiter';
  const r = db.run('INSERT INTO users (email, name, password_hash, role, hourly_rate) VALUES (?, ?, ?, ?, ?)', email, name, sec.hashPassword(req.body.password), role, f.parseMoney(req.body.hourly_rate));
  audit.log(req, 'benutzer.angelegt', 'user', Number(r.lastInsertRowid), { email, role });
  req.flash('success', 'Benutzer angelegt.');
  res.redirect('/admin/benutzer');
}));

router.get('/benutzer/:id/bearbeiten', wrap((req, res) => {
  const u = db.get('SELECT * FROM users WHERE id = ?', id(req.params.id));
  if (!u) return notFound(res, 'Benutzer');
  res.render('admin/user-form', { title: 'Benutzer bearbeiten', u });
}));

router.post('/benutzer/:id', wrap((req, res) => {
  const uid = id(req.params.id);
  const role = sec.PERMISSIONS[req.body.role] ? req.body.role : 'mitarbeiter';
  const active = req.body.active ? 1 : 0;
  if (uid === req.user.id && (role !== 'admin' || !active)) throw new UserError('Du kannst dir selbst nicht die Admin-Rechte entziehen.');
  db.run("UPDATE users SET name = ?, email = ?, role = ?, active = ?, hourly_rate = ?, updated_at = datetime('now') WHERE id = ?", String(req.body.name).trim(), String(req.body.email).trim(), role, active, f.parseMoney(req.body.hourly_rate), uid);
  if (req.body.password) {
    const problems = sec.passwordProblems(req.body.password);
    if (problems.length) throw new UserError(`Passwort benötigt ${problems.join(', ')}.`);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', sec.hashPassword(req.body.password), uid);
    db.run('DELETE FROM sessions WHERE user_id = ?', uid);
  }
  if (!active) db.run('DELETE FROM sessions WHERE user_id = ?', uid);
  if (req.body.reset_2fa) db.run('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?', uid);
  if (req.body.unlock) db.run('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?', uid);
  audit.log(req, 'benutzer.geaendert', 'user', uid, { role, active });
  req.flash('success', 'Benutzer gespeichert.');
  res.redirect('/admin/benutzer');
}));

// ---------- API-Schlüssel ----------
router.get('/api', (req, res) => {
  const keys = db.all('SELECT k.*, u.name AS creator FROM api_keys k LEFT JOIN users u ON u.id = k.created_by ORDER BY k.revoked, k.created_at DESC');
  res.render('admin/api', { title: 'API & Website-Anbindung', keys, newKey: req.session.newKey, baseUrl: config.baseUrl, origins: config.corsOrigins });
  delete req.session.newKey;
});

router.post('/api', wrap((req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new UserError('Name fehlt.');
  const scopes = req.body.scope === 'write' ? 'read,write' : 'read';
  req.session.newKey = sec.createApiKey(name, scopes, req.user.id);
  audit.log(req, 'api.schluessel_erstellt', 'api_key', null, { name, scopes });
  res.redirect('/admin/api');
}));

router.post('/api/:id/widerrufen', wrap((req, res) => {
  db.run('UPDATE api_keys SET revoked = 1 WHERE id = ?', id(req.params.id));
  audit.log(req, 'api.schluessel_widerrufen', 'api_key', Number(req.params.id));
  res.redirect('/admin/api');
}));

// ---------- Audit-Log ----------
router.get('/protokoll', (req, res) => {
  const where = [];
  const params = [];
  if (req.query.q) { where.push('(action LIKE ? OR user_name LIKE ? OR details LIKE ?)'); params.push(...Array(3).fill(`%${req.query.q}%`)); }
  const rows = db.all(`SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 500`, ...params);
  res.render('admin/audit', { title: 'Protokoll (Audit-Log)', rows, verify: req.query.pruefen ? audit.verify() : null });
});

// ---------- Backups ----------
router.get('/backups', (req, res) => {
  const dbSize = fs.existsSync(config.dbFile) ? fs.statSync(config.dbFile).size : 0;
  res.render('admin/backups', { title: 'Datensicherung', list: backup.list(), dbSize, dir: config.backupDir });
});

router.post('/backups', wrap((req, res) => {
  const file = backup.create('manuell');
  audit.log(req, 'backup.erstellt', 'backup', null, path.basename(file));
  req.flash('success', `Backup erstellt: ${path.basename(file)}`);
  res.redirect('/admin/backups');
}));

router.get('/backups/:name', (req, res) => {
  const p = backup.resolve(req.params.name);
  if (!p) return notFound(res, 'Backup');
  audit.log(req, 'backup.heruntergeladen', 'backup', null, req.params.name);
  res.download(p);
});

// ---------- System ----------
router.get('/system', (req, res) => {
  const counts = {};
  for (const t of ['users', 'customers', 'leads', 'documents_sales', 'payments', 'projects', 'tasks', 'appointments', 'time_entries', 'expenses', 'files', 'audit_log']) {
    counts[t] = db.get(`SELECT COUNT(*) AS n FROM ${t}`).n;
  }
  res.render('admin/system', {
    title: 'Systeminformationen', counts, node: process.version, uptime: process.uptime(), mem: process.memoryUsage().rss,
    env: config.env, baseUrl: config.baseUrl, dataDir: config.dataDir, mailEnabled: mailer.enabled(),
  });
});

module.exports = router;
