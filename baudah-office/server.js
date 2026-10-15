'use strict';
/*
 * BauDaH Office – Angebote, Rechnungen, Kunden & Leistungskatalog
 * Start: node server.js  (Standard-Port 3000, änderbar über PORT)
 */
const path = require('node:path');
const express = require('express');
const api = require('./src/api');
const backup = require('./src/backup');
const publicDemo = require('./src/publicdemo');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.disable('x-powered-by');
// Hinter einem Hosting-Proxy (Render, Railway …) die echte Besucher-IP verwenden
app.set('trust proxy', publicDemo.ENABLED ? true : 'loopback');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self' blob:; object-src 'self' blob:"
  );
  next();
});

app.use('/api', api);
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', maxAge: '1h' }));
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

backup.schedule();
publicDemo.start();

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  BauDaH Office läuft                         │');
  console.log(`  │  Im Browser öffnen: http://localhost:${String(PORT).padEnd(8)}│`);
  console.log('  │  Beenden mit Strg + C                        │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');
});
