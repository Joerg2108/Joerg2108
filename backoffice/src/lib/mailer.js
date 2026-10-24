'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');
const settings = require('./settings');

let transport;

// In der Demo-Instanz wird grundsätzlich nichts versendet
function enabled() {
  return !!config.smtp.host && !config.demo.enabled;
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
    console.log(`[Mail – nicht versendet, ${config.demo.enabled ? 'Demo-Modus' : 'SMTP fehlt'}] An: ${to} | Betreff: ${subject} | Anhänge: ${attachments.map((a) => a.filename).join(', ')}`);
    return { simulated: true };
  }
  return getTransport().sendMail({ from, to, subject, text, attachments, replyTo });
}

// Hinweistext für die Oberfläche, wenn nur simuliert wurde
function simulatedNotice() {
  return config.demo.enabled
    ? 'Demo-Version: Der Versand wurde simuliert. In Ihrer Installation geht die E-Mail mit PDF-Anhang direkt an den Kunden.'
    : 'SMTP ist nicht eingerichtet – Versand wurde nur simuliert (siehe Server-Log).';
}

module.exports = { send, enabled, simulatedNotice };
