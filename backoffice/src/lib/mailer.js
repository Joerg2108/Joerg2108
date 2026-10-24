'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');
const settings = require('./settings');

let transport;

function enabled() {
  return !!config.smtp.host;
}

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transport;
}

// Ohne SMTP-Konfiguration wird die Mail nur protokolliert (praktisch für Tests/Entwicklung)
async function send({ to, subject, text, attachments = [], replyTo }) {
  const from = config.smtp.from || `${settings.get('company_name')} <${settings.get('company_email')}>`;
  if (!enabled()) {
    console.log(`[Mail – nicht versendet, SMTP fehlt] An: ${to} | Betreff: ${subject} | Anhänge: ${attachments.map((a) => a.filename).join(', ')}`);
    return { simulated: true };
  }
  return getTransport().sendMail({ from, to, subject, text, attachments, replyTo });
}

module.exports = { send, enabled };
