'use strict';
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const ejs = require('ejs');
const config = require('./config');
const db = require('./db');
const settings = require('./lib/settings');
const sec = require('./lib/security');
const view = require('./lib/view');
const demo = require('./lib/demo');

function createApp() {
  db.open();
  fs.mkdirSync(config.uploadDir, { recursive: true });

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'"],
        styleSrcAttr: ["'unsafe-inline'"],
        scriptSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.baseUrl.startsWith('https://') ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: config.isProd ? '7d' : 0 }));
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // Öffentliche & API-Routen (eigene Auth, kein Session-Cookie)
  app.use('/api', require('./routes/api'));

  app.use(express.urlencoded({ extended: false, limit: '2mb', parameterLimit: 5000 }));
  app.use(express.json({ limit: '1mb' }));
  app.use(sec.sessionMiddleware);
  app.use(sec.loadUser);

  // Layout-Rendering: View wird in views/layout.ejs eingebettet
  app.use((req, res, next) => {
    const s = settings.all();
    Object.assign(res.locals, {
      h: view, s, path: req.path, can: (p) => sec.can(req.user, p), title: '', flash: req.session.flash || [],
      ROLE_LABELS: sec.ROLE_LABELS, query: req.query, demo: demo.locals(),
    });
    delete req.session.flash;
    req.flash = (type, msg) => { (req.session.flash = req.session.flash || []).push({ type, msg }); };
    const render = res.render.bind(res);
    res.render = (name, locals = {}, cb) => {
      render(name, locals, (err, body) => {
        if (err) return next(err);
        if (locals.layout === false) return res.send(body);
        render(locals.layout || (req.user ? 'layout' : 'layout-auth'), { ...locals, body }, cb || ((e, html) => (e ? next(e) : res.send(html))));
      });
    };
    if (req.user) {
      res.locals.unread = db.get('SELECT COUNT(*) AS n FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND read = 0', req.user.id).n;
      res.locals.timer = db.get('SELECT t.*, p.name AS project_name FROM timers t LEFT JOIN projects p ON p.id = t.project_id WHERE user_id = ?', req.user.id);
      res.locals.newLeads = db.get("SELECT COUNT(*) AS n FROM leads WHERE status = 'neu'").n;
    }
    next();
  });

  app.use(sec.csrf);
  app.use(demo.guard);
  // Logo ist auch auf der Login-Seite sichtbar (nicht vertraulich)
  app.get('/logo', (req, res) => {
    const logo = settings.get('logo_file');
    if (!logo) return res.status(404).end();
    res.sendFile(path.join(config.uploadDir, path.basename(logo)));
  });
  app.use(require('./routes/auth'));
  app.use(sec.requireLogin);
  app.use(require('./routes/dashboard'));
  app.use('/lage', require('./routes/livelage'));
  app.use('/kunden', require('./routes/customers'));
  app.use('/objekte', require('./routes/objects'));
  app.use('/streife', require('./routes/patrols'));
  app.use('/vorfaelle', require('./routes/incidents'));
  app.use('/fahrzeuge', require('./routes/vehicles'));
  app.use('/waechter', require('./routes/waechter'));
  app.use('/anfragen', require('./routes/leads'));
  app.use('/belege', require('./routes/sales'));
  app.use('/artikel', require('./routes/products'));
  app.use('/projekte', require('./routes/projects'));
  app.use('/aufgaben', require('./routes/tasks'));
  app.use('/kalender', require('./routes/calendar'));
  app.use('/zeiten', require('./routes/time'));
  app.use('/dienstplan', require('./routes/shifts'));
  app.use('/personal', require('./routes/staff'));
  app.use('/ausgaben', require('./routes/expenses'));
  app.use('/dateien', require('./routes/files'));
  app.use('/berichte', require('./routes/reports'));
  app.use('/admin', require('./routes/admin'));

  app.use((req, res) => res.status(404).render('error', { title: 'Nicht gefunden', message: 'Diese Seite existiert nicht.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    if (req.path.startsWith('/api/')) return res.status(status).json({ error: err.expose ? err.message : 'Interner Fehler' });
    // Bekannte fachliche Fehler (z. B. GoBD-Sperre) als Hinweis zurückgeben statt Fehlerseite
    if (err.userMessage && req.flash && req.get('referer')) {
      req.flash('error', err.message);
      return res.redirect(req.get('referer'));
    }
    try {
      res.status(status).render('error', { title: 'Fehler', message: config.isProd ? 'Es ist ein Fehler aufgetreten.' : err.message });
    } catch {
      res.status(status).send('Fehler');
    }
  });

  return app;
}

module.exports = { createApp, ejs };
