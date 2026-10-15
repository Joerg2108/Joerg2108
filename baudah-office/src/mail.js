'use strict';
const nodemailer = require('nodemailer');
const calc = require('../public/js/calc');
const { getSetting, run } = require('./db');
const { decrypt } = require('./auth');
const { formatDate, letterSalutation, HttpError } = require('./documents');

function transport() {
  const m = getSetting('mail');
  if (process.env.BAUDAH_MAIL_TEST) return nodemailer.createTransport({ jsonTransport: true });
  if (!m.host || !m.user) throw new HttpError(400, 'E-Mail-Versand ist noch nicht eingerichtet (Einstellungen → E-Mail).');
  return nodemailer.createTransport({
    host: m.host,
    port: Number(m.port) || 587,
    secure: !!m.secure,
    requireTLS: !m.secure,
    auth: { user: m.user, pass: decrypt(m.pass) },
    connectionTimeout: 15000,
  });
}

function fill(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

/** Platzhalter für E-Mail-Vorlagen */
function mailVars(doc, reminder) {
  const m = getSetting('mail');
  const dunning = getSetting('dunning');
  const sal = letterSalutation(doc.snapshot);
  return {
    anrede: sal,
    kunde: doc.snapshot?.name || '',
    nummer: doc.number || 'Entwurf',
    belegart: doc.label || 'Rechnung',
    datum: formatDate(doc.date),
    betrag: calc.formatMoney(doc.totals.payable),
    netto: calc.formatMoney(doc.totals.net),
    faellig: formatDate(reminder ? reminder.due_date : doc.due_date),
    gueltig: formatDate(doc.valid_until),
    bauvorhaben: doc.project || doc.subject || '',
    betreff: doc.subject || '',
    offen: calc.formatMoney(reminder ? reminder.open_amount + reminder.fee : doc.open),
    mahnstufe: reminder ? dunning.titles[reminder.level - 1] : '',
    firma: getSetting('company').name,
    signatur: m.signature || '',
  };
}

function draftFor(doc, reminder) {
  const tpl = getSetting('mail_templates');
  const key = reminder ? 'mahnung' : doc.type === 'angebot' ? 'angebot' : 'rechnung';
  const t = tpl[key];
  const vars = mailVars(doc, reminder);
  const cc = doc.customer?.email_cc || '';
  return {
    to: doc.snapshot?.email || doc.customer?.email || '',
    cc,
    subject: fill(t.subject, vars).replace(/\s+–\s*$/, ''),
    body: fill(t.body, vars),
  };
}

async function sendMail({ to, cc, subject, body, attachments, documentId, reminderId, userId }) {
  const m = getSetting('mail');
  const addr = String(to || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+(\s*[,;]\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/.test(addr)) {
    throw new HttpError(400, 'Bitte eine gültige Empfängeradresse angeben.');
  }
  const message = {
    from: { name: m.from_name, address: m.from_email || m.user },
    to: addr,
    cc: cc || undefined,
    bcc: m.bcc_self ? m.from_email || m.user : undefined,
    subject,
    text: body,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">${escapeHtml(body).replace(/\n/g, '<br>')}</div>`,
    attachments: attachments || [],
  };
  const names = (attachments || []).map((a) => a.filename).join(', ');
  try {
    const info = await transport().sendMail(message);
    run(
      'INSERT INTO email_log(document_id, reminder_id, to_addr, cc, subject, body, attachments, status, user_id) VALUES(?,?,?,?,?,?,?,?,?)',
      documentId ?? null, reminderId ?? null, addr, cc || '', subject, body, names, 'gesendet', userId ?? null
    );
    return info;
  } catch (e) {
    run(
      'INSERT INTO email_log(document_id, reminder_id, to_addr, cc, subject, body, attachments, status, error, user_id) VALUES(?,?,?,?,?,?,?,?,?,?)',
      documentId ?? null, reminderId ?? null, addr, cc || '', subject, body, names, 'fehler', String(e.message || e), userId ?? null
    );
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, `E-Mail konnte nicht gesendet werden: ${e.message}`);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

async function testConnection() {
  await transport().verify();
}

module.exports = { draftFor, sendMail, testConnection, mailVars };
