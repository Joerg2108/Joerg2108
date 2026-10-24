'use strict';
const path = require('node:path');
const fs = require('node:fs');

// Minimaler .env-Loader (keine zusätzliche Abhängigkeit nötig)
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const env = process.env;
const dataDir = path.resolve(env.DATA_DIR || path.join(__dirname, '..', 'data'));

module.exports = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  port: Number(env.PORT || 3000),
  host: env.HOST || '0.0.0.0',
  baseUrl: (env.BASE_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, ''),
  dataDir,
  dbFile: path.join(dataDir, env.DB_FILE || 'backoffice.sqlite'),
  uploadDir: path.join(dataDir, 'uploads'),
  backupDir: path.join(dataDir, 'backups'),
  sessionSecret: env.SESSION_SECRET || 'dev-secret-bitte-in-.env-aendern',
  sessionDays: Number(env.SESSION_DAYS || 7),
  trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
  // Komma-getrennte Liste erlaubter Website-Origins für das Kontaktformular
  corsOrigins: (env.CORS_ORIGINS || 'https://joerg-noack.com,https://www.joerg-noack.com')
    .split(',').map((s) => s.trim()).filter(Boolean),
  maxUploadMb: Number(env.MAX_UPLOAD_MB || 20),
  backupKeep: Number(env.BACKUP_KEEP || 30),
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || '',
  },
  admin: {
    email: env.ADMIN_EMAIL || 'admin@example.com',
    password: env.ADMIN_PASSWORD || '',
    name: env.ADMIN_NAME || 'Administrator',
  },
};
