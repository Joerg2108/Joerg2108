'use strict';
// Hilfen für Routen: fachliche Fehler als Flash-Meldung, Pagination, ID-Parsing

class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.userMessage = true;
    this.status = status;
  }
}

function isUserFacing(e) {
  return e.userMessage || /Festgeschrieben|unveränderlich|gesperrt|UNIQUE constraint/i.test(e.message || '');
}

// Wrapper für (async) Handler: fachliche Fehler -> zurück zur vorherigen Seite mit Meldung
function wrap(fn) {
  return (req, res, next) => {
    const handle = (e) => {
      if (isUserFacing(e)) {
        let msg = e.message;
        if (/UNIQUE constraint/.test(e.message)) msg = 'Dieser Wert ist bereits vergeben (z. B. E-Mail oder Nummer).';
        req.flash('error', msg);
        return res.redirect(req.get('referer') || '/');
      }
      next(e);
    };
    try {
      const r = fn(req, res, next);
      if (r && typeof r.catch === 'function') r.catch(handle);
    } catch (e) {
      handle(e);
    }
  };
}

function id(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new UserError('Ungültige ID', 404);
  return n;
}

function paginate(total, page, perPage = 25) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, Number(page) || 1), pages);
  return { page: p, pages, limit: perPage, offset: (p - 1) * perPage, total };
}

function notFound(res, what = 'Eintrag') {
  return res.status(404).render('error', { title: 'Nicht gefunden', message: `${what} wurde nicht gefunden.` });
}

// Leere Strings -> null, Strings trimmen
function clean(body, fields) {
  const out = {};
  for (const k of fields) {
    const v = body[k];
    out[k] = v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim();
  }
  return out;
}

module.exports = { UserError, wrap, id, paginate, notFound, clean };
