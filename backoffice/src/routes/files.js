'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const config = require('../config');
const audit = require('../lib/audit');
const sec = require('../lib/security');
const { wrap, id, notFound, UserError } = require('../lib/route');

const router = express.Router();

// Erlaubte Dateitypen (Whitelist) – keine ausführbaren Dateien
// Demo-Instanz: nur PDF/Bilder bis 2 MB (Uploads werden beim Demo-Reset gelöscht)
const ALLOWED = config.demo.enabled ? /\.(pdf|png|jpe?g)$/i : /\.(pdf|png|jpe?g|gif|webp|heic|txt|csv|xlsx?|docx?|pptx?|odt|ods|zip|xml|eml|msg)$/i;
const MAX_MB = config.demo.enabled ? Math.min(2, config.maxUploadMb) : config.maxUploadMb;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => cb(ALLOWED.test(file.originalname) ? null : new UserError(`Dateityp nicht erlaubt: ${file.originalname}`), ALLOWED.test(file.originalname)),
});

function store(file, meta, userId) {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
  // Dateinamen kommen von multer als latin1 – nach UTF-8 korrigieren (Umlaute)
  const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const r = db.run(
    'INSERT INTO files (original_name, stored_name, mime, size, sha256, folder, customer_id, project_id, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    name, file.filename, file.mimetype, file.size, sha, meta.folder || 'Allgemein', meta.customer_id || null, meta.project_id || null, userId,
  );
  return Number(r.lastInsertRowid);
}

router.get('/', sec.requirePerm('files'), (req, res) => {
  const where = [];
  const params = [];
  if (req.query.ordner) { where.push('f.folder = ?'); params.push(req.query.ordner); }
  if (req.query.q) { where.push('f.original_name LIKE ?'); params.push(`%${req.query.q}%`); }
  const rows = db.all(
    `SELECT f.*, u.name AS uploader, c.company, c.first_name, c.last_name, p.name AS project_name FROM files f
     LEFT JOIN users u ON u.id = f.uploaded_by LEFT JOIN customers c ON c.id = f.customer_id LEFT JOIN projects p ON p.id = f.project_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY f.created_at DESC LIMIT 500`, ...params,
  );
  const folders = db.all('SELECT folder, COUNT(*) AS n, SUM(size) AS size FROM files GROUP BY folder ORDER BY folder');
  const used = db.get('SELECT COALESCE(SUM(size),0) AS s FROM files').s;
  res.render('files/index', { title: 'Dokumente', rows, folders, used });
});

router.post('/', sec.requirePerm('files'), (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      req.flash('error', err.code === 'LIMIT_FILE_SIZE' ? `Datei zu groß (max. ${MAX_MB} MB).` : err.message);
      return res.redirect(req.get('referer') || '/dateien');
    }
    try {
      const files = req.files || [];
      if (!files.length) throw new UserError('Keine Datei ausgewählt.');
      for (const file of files) {
        const fid = store(file, { folder: String(req.body.folder || 'Allgemein').trim().slice(0, 60), customer_id: Number(req.body.customer_id) || null, project_id: Number(req.body.project_id) || null }, req.user.id);
        audit.log(req, 'datei.hochgeladen', 'file', fid, { name: file.originalname });
      }
      req.flash('success', `${files.length} Datei(en) hochgeladen.`);
      res.redirect(req.get('referer') || '/dateien');
    } catch (e) {
      next(e);
    }
  });
});

router.get('/:id/download', wrap((req, res) => {
  const file = db.get('SELECT * FROM files WHERE id = ?', id(req.params.id));
  if (!file) return notFound(res, 'Datei');
  // Belege nur für Buchhaltung/Admin, sonstige Dateien für alle mit Dokumentenrecht
  const isReceipt = db.get('SELECT COUNT(*) AS n FROM expenses WHERE file_id = ?', file.id).n > 0;
  const allowed = isReceipt ? sec.can(req.user, 'expenses') : sec.can(req.user, 'files');
  if (!allowed) {
    return res.status(403).render('error', { title: 'Keine Berechtigung', message: 'Für diese Datei fehlt dir die Berechtigung.' });
  }
  const p = path.join(config.uploadDir, path.basename(file.stored_name));
  if (!fs.existsSync(p)) return notFound(res, 'Datei');
  // Bilder & PDFs inline anzeigen, alles andere herunterladen
  const inline = /^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(file.mime || '') && !req.query.download;
  res.set('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
  res.set('X-Content-Type-Options', 'nosniff');
  res.type(inline ? file.mime : 'application/octet-stream').sendFile(p);
}));

router.post('/:id/loeschen', sec.requirePerm('files'), wrap((req, res) => {
  const file = db.get('SELECT * FROM files WHERE id = ?', id(req.params.id));
  if (!file) return notFound(res, 'Datei');
  if (db.get('SELECT COUNT(*) AS n FROM expenses WHERE file_id = ?', file.id).n) throw new UserError('Datei ist ein Ausgabenbeleg und muss aufbewahrt werden.');
  db.run('DELETE FROM files WHERE id = ?', file.id);
  fs.rmSync(path.join(config.uploadDir, path.basename(file.stored_name)), { force: true });
  audit.log(req, 'datei.geloescht', 'file', file.id, { name: file.original_name });
  req.flash('success', 'Datei gelöscht.');
  res.redirect(req.get('referer') || '/dateien');
}));

module.exports = router;
module.exports.upload = upload;
module.exports.store = store;
