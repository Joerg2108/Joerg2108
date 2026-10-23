'use strict';
// Formatierung & Parsing für deutsche Beträge/Datumswerte. Beträge intern immer in Cent.

const eurFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const numFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

function eur(cents) {
  return eurFmt.format((Number(cents) || 0) / 100);
}

function num(n, digits = 2) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(Number(n) || 0);
}

// "1.234,56" | "1234.56" | "1234,5" -> 123456 (Cent)
function parseMoney(input) {
  if (input === undefined || input === null || input === '') return 0;
  if (typeof input === 'number') return Math.round(input * 100);
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function parseNumber(input, fallback = 0) {
  if (input === undefined || input === null || input === '') return fallback;
  let s = String(input).trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function moneyInput(cents) {
  return ((Number(cents) || 0) / 100).toFixed(2).replace('.', ',');
}

function date(iso) {
  if (!iso) return '';
  const d = String(iso).slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}

function dateTime(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T') + (String(iso).includes('Z') || String(iso).includes('+') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
}

function today() {
  return localDate(new Date());
}

// Lokales Datum (Europe/Berlin) als YYYY-MM-DD
function localDate(d) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d);
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function addMonths(isoDate, months) {
  const d = new Date(isoDate + 'T12:00:00Z');
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
}

function minutes(m) {
  m = Number(m) || 0;
  const h = Math.floor(m / 60);
  return `${h}:${String(m % 60).padStart(2, '0')} h`;
}

// "1:30" | "1,5" | "90m" -> Minuten
function parseDuration(input) {
  const s = String(input || '').trim().toLowerCase();
  if (!s) return 0;
  let m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d+)\s*m(in)?$/);
  if (m) return Number(m[1]);
  return Math.round(parseNumber(s.replace(/h$/, '')) * 60);
}

function customerName(c) {
  if (!c) return '';
  if (c.company) return c.company;
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || `Kunde #${c.id}`;
}

function bytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${numFmt.format(n / 1024)} KB`;
  return `${numFmt.format(n / 1024 / 1024)} MB`;
}

module.exports = {
  eur, num, parseMoney, parseNumber, moneyInput, date, dateTime, today, localDate,
  addDays, addMonths, daysBetween, minutes, parseDuration, customerName, bytes,
};
