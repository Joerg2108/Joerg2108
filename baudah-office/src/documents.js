'use strict';
const { all, get, run, tx, getSetting, nextDocumentNumber, logActivity } = require('./db');
const calc = require('../public/js/calc');

const INVOICE_TYPES = ['rechnung', 'abschlag', 'schluss', 'storno'];
const TYPE_LABEL = {
  angebot: 'Angebot',
  rechnung: 'Rechnung',
  abschlag: 'Abschlagsrechnung',
  schluss: 'Schlussrechnung',
  storno: 'Stornorechnung',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ---------------- Datum ---------------- */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(dateStr, n) {
  const d = new Date(`${dateStr || today()}T12:00:00`);
  d.setDate(d.getDate() + Number(n || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDate(s) {
  if (!s) return '';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

/* ---------------- Kunden ---------------- */
function customerDisplayName(c) {
  if (!c) return '';
  if (c.company) return c.company;
  return [c.salutation === 'Firma' ? '' : '', c.title, c.first_name, c.last_name].filter(Boolean).join(' ').trim();
}

function customerSnapshot(c) {
  if (!c) return null;
  const lines = [];
  if (c.company) {
    lines.push(c.company);
    if (c.contact_person) lines.push(`z. Hd. ${c.contact_person}`);
  } else {
    const sal = ['Herr', 'Frau'].includes(c.salutation) ? c.salutation : c.salutation === 'Familie' ? 'Familie' : '';
    if (sal && sal !== 'Familie') lines.push(sal);
    lines.push([sal === 'Familie' ? 'Familie' : '', c.title, c.first_name, c.last_name].filter(Boolean).join(' '));
  }
  if (c.address_extra) lines.push(c.address_extra);
  if (c.street) lines.push(c.street);
  lines.push([c.zip, c.city].filter(Boolean).join(' '));
  if (c.country && c.country !== 'DE') lines.push(c.country);
  return {
    id: c.id,
    number: c.number,
    type: c.type,
    name: customerDisplayName(c),
    lines: lines.filter((l) => l && l.trim()),
    salutation: c.salutation,
    title: c.title,
    first_name: c.first_name,
    last_name: c.last_name,
    company: c.company,
    contact_person: c.contact_person,
    street: c.street,
    zip: c.zip,
    city: c.city,
    country: c.country || 'DE',
    email: c.email,
    vat_id: c.vat_id,
    leitweg_id: c.leitweg_id,
  };
}

/** Briefanrede für Dokumente und E-Mails */
function letterSalutation(snap) {
  if (!snap) return 'Sehr geehrte Damen und Herren';
  const name = [snap.title, snap.last_name].filter(Boolean).join(' ');
  if (snap.company && snap.contact_person) {
    const parts = snap.contact_person.split(' ');
    if (/^(Herr|Frau)$/.test(parts[0])) {
      return parts[0] === 'Herr'
        ? `Sehr geehrter Herr ${parts.slice(1).join(' ')}`
        : `Sehr geehrte Frau ${parts.slice(1).join(' ')}`;
    }
  }
  if (!snap.company || snap.last_name) {
    if (snap.salutation === 'Herr' && snap.last_name) return `Sehr geehrter Herr ${name}`;
    if (snap.salutation === 'Frau' && snap.last_name) return `Sehr geehrte Frau ${name}`;
    if (snap.salutation === 'Familie' && snap.last_name) return `Sehr geehrte Familie ${snap.last_name}`;
  }
  return 'Sehr geehrte Damen und Herren';
}

/* ---------------- Laden ---------------- */
function itemsOf(docId) {
  return all('SELECT * FROM document_items WHERE document_id = ? ORDER BY sort, id', docId);
}

/** Abschläge, die in einer Schlussrechnung abgezogen werden */
function prepaidFor(doc) {
  if (doc.prepaid_json) return JSON.parse(doc.prepaid_json);
  if (doc.type !== 'schluss') return { list: [], net: 0, vat: 0, gross: 0 };
  if (!doc.source_id) return { list: [], net: 0, vat: 0, gross: 0 };
  const rows = all(
    `SELECT id, number, date, net, vat, gross FROM documents
     WHERE type = 'abschlag' AND source_id = ? AND finalized_at IS NOT NULL AND status <> 'storniert'
     ORDER BY date, id`,
    doc.source_id
  );
  return {
    list: rows,
    net: rows.reduce((s, r) => s + r.net, 0),
    vat: rows.reduce((s, r) => s + r.vat, 0),
    gross: rows.reduce((s, r) => s + r.gross, 0),
  };
}

function paidAmount(docId) {
  return get('SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE document_id = ?', docId).s;
}

function displayStatus(doc) {
  if (INVOICE_TYPES.includes(doc.type) && ['offen', 'teilbezahlt'].includes(doc.status) && doc.due_date && doc.due_date < today()) {
    return 'ueberfaellig';
  }
  if (doc.type === 'angebot' && doc.status === 'versendet' && doc.valid_until && doc.valid_until < today()) {
    return 'abgelaufen';
  }
  return doc.status;
}

function loadDocument(id) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  if (!doc) throw new HttpError(404, 'Beleg nicht gefunden.');
  doc.items = itemsOf(id);
  doc.customer = doc.customer_id ? get('SELECT * FROM customers WHERE id = ?', doc.customer_id) : null;
  doc.snapshot = doc.customer_snapshot ? JSON.parse(doc.customer_snapshot) : customerSnapshot(doc.customer);
  doc.prepaid = prepaidFor(doc);
  doc.totals = calc.totals(doc, doc.items, doc.prepaid);
  doc.paid = paidAmount(id);
  doc.open = INVOICE_TYPES.includes(doc.type) && doc.finalized_at && doc.status !== 'storniert' ? doc.totals.payable - doc.paid : 0;
  doc.payments = all('SELECT * FROM payments WHERE document_id = ? ORDER BY date, id', id);
  doc.reminders = all('SELECT * FROM reminders WHERE document_id = ? ORDER BY level', id);
  doc.emails = all(
    'SELECT id, to_addr, cc, subject, status, error, created_at FROM email_log WHERE document_id = ? ORDER BY id DESC',
    id
  );
  doc.source = doc.source_id ? get('SELECT id, type, number, date, status FROM documents WHERE id = ?', doc.source_id) : null;
  doc.ref = doc.ref_id ? get('SELECT id, type, number, date FROM documents WHERE id = ?', doc.ref_id) : null;
  doc.children = all(
    'SELECT id, type, number, date, status, gross, finalized_at FROM documents WHERE source_id = ? OR ref_id = ? ORDER BY id',
    id,
    id
  );
  doc.display_status = displayStatus(doc);
  doc.locked = !!doc.finalized_at;
  doc.label = TYPE_LABEL[doc.type];
  return doc;
}

/* ---------------- Speichern ---------------- */
const HEADER_FIELDS = [
  'customer_id', 'date', 'service_period', 'valid_until', 'due_date', 'payment_days', 'subject', 'project',
  'site_address', 'customer_ref', 'intro', 'outro', 'tax_mode', 'show_35a', 'discount_percent',
  'skonto_percent', 'skonto_days',
];

function cleanItem(it, idx) {
  const kind = ['item', 'title', 'text', 'pagebreak'].includes(it.kind) ? it.kind : 'item';
  return {
    sort: idx,
    kind,
    article_id: it.article_id || null,
    name: String(it.name || '').slice(0, 500),
    description: String(it.description || '').slice(0, 10000),
    qty: kind === 'item' ? Number(it.qty) || 0 : 0,
    unit: kind === 'item' ? String(it.unit || '').slice(0, 20) : '',
    price: kind === 'item' ? Math.round(Number(it.price) || 0) : 0,
    cost: kind === 'item' ? Math.round(Number(it.cost) || 0) : 0,
    labor_percent: Math.min(100, Math.max(0, Number(it.labor_percent) || 0)),
    discount: Math.min(100, Math.max(0, Number(it.discount) || 0)),
    vat_rate: [0, 7, 19].includes(Number(it.vat_rate)) ? Number(it.vat_rate) : 19,
    optional: it.optional ? 1 : 0,
  };
}

function writeItems(docId, items) {
  run('DELETE FROM document_items WHERE document_id = ?', docId);
  const st = require('./db').db.prepare(
    `INSERT INTO document_items(document_id, sort, kind, article_id, name, description, qty, unit, price, cost,
      labor_percent, discount, vat_rate, optional) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  items.map(cleanItem).forEach((i) =>
    st.run(docId, i.sort, i.kind, i.article_id, i.name, i.description, i.qty, i.unit, i.price, i.cost,
      i.labor_percent, i.discount, i.vat_rate, i.optional)
  );
}

function recalc(docId) {
  const doc = get('SELECT * FROM documents WHERE id = ?', docId);
  const items = itemsOf(docId);
  const prepaid = prepaidFor(doc);
  const t = calc.totals(doc, items, prepaid);
  run(
    'UPDATE documents SET net = ?, vat = ?, gross = ?, prepaid_gross = ?, prepaid_net = ?, labor = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
    t.net, t.vat, t.gross, t.prepaidGross, t.prepaidNet, t.labor, docId
  );
}

function refreshSnapshot(docId) {
  const doc = get('SELECT customer_id, finalized_at FROM documents WHERE id = ?', docId);
  if (doc.finalized_at) return;
  const c = doc.customer_id ? get('SELECT * FROM customers WHERE id = ?', doc.customer_id) : null;
  run('UPDATE documents SET customer_snapshot = ? WHERE id = ?', c ? JSON.stringify(customerSnapshot(c)) : null, docId);
}

function defaultsFor(type, customer) {
  const d = getSetting('defaults');
  const texts = getSetting('texts');
  const date = today();
  const paymentDays = customer?.payment_days ?? d.payment_days;
  return {
    date,
    valid_until: type === 'angebot' ? addDays(date, d.valid_days) : null,
    payment_days: paymentDays,
    due_date: type === 'angebot' ? null : addDays(date, paymentDays),
    intro: texts[`${type}_intro`] || '',
    outro: texts[`${type}_outro`] || '',
    tax_mode: customer?.reverse_charge ? '13b' : 'standard',
    show_35a: customer ? (customer.type === 'privat' && d.show_35a_private ? 1 : 0) : 0,
    discount_percent: customer?.discount || 0,
    skonto_percent: d.skonto_percent || 0,
    skonto_days: d.skonto_days || 0,
  };
}

function createDocument(type, data, user) {
  if (!TYPE_LABEL[type] || type === 'storno') throw new HttpError(400, 'Unbekannter Belegtyp.');
  const customer = data.customer_id ? get('SELECT * FROM customers WHERE id = ?', data.customer_id) : null;
  const base = { ...defaultsFor(type, customer), ...pick(data, HEADER_FIELDS) };
  return tx(() => {
    const number = type === 'angebot' ? nextDocumentNumber('angebot', base.date) : null;
    const r = run(
      `INSERT INTO documents(type, number, status, customer_id, source_id, date, service_period, valid_until, due_date,
        payment_days, subject, project, site_address, customer_ref, intro, outro, tax_mode, show_35a, discount_percent,
        skonto_percent, skonto_days, abschlag_no, created_by)
       VALUES(?,?, 'entwurf', ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      type, number, base.customer_id || null, data.source_id || null, base.date, base.service_period || '',
      base.valid_until || null, base.due_date || null, base.payment_days ?? null, base.subject || '', base.project || '',
      base.site_address || '', base.customer_ref || '', base.intro || '', base.outro || '', base.tax_mode || 'standard',
      base.show_35a ? 1 : 0, Number(base.discount_percent) || 0, Number(base.skonto_percent) || 0,
      Number(base.skonto_days) || 0, data.abschlag_no || null, user?.id ?? null
    );
    const id = Number(r.lastInsertRowid);
    writeItems(id, data.items || []);
    refreshSnapshot(id);
    recalc(id);
    logActivity(user?.id, 'document', id, 'erstellt', `${TYPE_LABEL[type]} ${number || '(Entwurf)'}`);
    return id;
  });
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function updateDocument(id, data, user) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  if (!doc) throw new HttpError(404, 'Beleg nicht gefunden.');
  if (doc.finalized_at) {
    throw new HttpError(409, 'Dieser Beleg ist festgeschrieben (GoBD) und kann nicht mehr geändert werden. Bitte stornieren und neu erstellen.');
  }
  const fields = pick(data, HEADER_FIELDS);
  if (fields.show_35a !== undefined) fields.show_35a = fields.show_35a ? 1 : 0;
  if (fields.customer_id === '') fields.customer_id = null;
  if (doc.type !== 'angebot' && (fields.date || fields.payment_days !== undefined) && fields.due_date === undefined) {
    fields.due_date = addDays(fields.date || doc.date, fields.payment_days ?? doc.payment_days ?? 14);
  }
  tx(() => {
    const keys = Object.keys(fields);
    if (keys.length) {
      run(
        `UPDATE documents SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
        ...keys.map((k) => (fields[k] === undefined ? null : fields[k])),
        id
      );
    }
    if (Array.isArray(data.items)) writeItems(id, data.items);
    refreshSnapshot(id);
    recalc(id);
  });
  logActivity(user?.id, 'document', id, 'geändert');
  return id;
}

function deleteDocument(id, user) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  if (!doc) throw new HttpError(404, 'Beleg nicht gefunden.');
  if (doc.finalized_at) throw new HttpError(409, 'Festgeschriebene Rechnungen dürfen nicht gelöscht werden (GoBD). Bitte stornieren.');
  if (doc.type === 'angebot' && get('SELECT 1 FROM documents WHERE source_id = ? AND finalized_at IS NOT NULL', id)) {
    throw new HttpError(409, 'Zu diesem Angebot existieren bereits festgeschriebene Rechnungen.');
  }
  tx(() => {
    run('UPDATE documents SET source_id = NULL WHERE source_id = ?', id);
    run('DELETE FROM documents WHERE id = ?', id);
  });
  logActivity(user?.id, 'document', id, 'gelöscht', `${TYPE_LABEL[doc.type]} ${doc.number || ''}`);
}

/* ---------------- Festschreiben ---------------- */
function finalizeDocument(id, user, opts = {}) {
  return tx(() => {
    const doc = get('SELECT * FROM documents WHERE id = ?', id);
    if (!doc) throw new HttpError(404, 'Beleg nicht gefunden.');
    if (!INVOICE_TYPES.includes(doc.type)) throw new HttpError(400, 'Nur Rechnungen werden festgeschrieben.');
    if (doc.finalized_at) return id;
    if (!doc.customer_id) throw new HttpError(400, 'Bitte zuerst einen Kunden auswählen.');
    const items = itemsOf(id).filter((i) => i.kind === 'item');
    if (!items.length) throw new HttpError(400, 'Die Rechnung enthält keine Positionen.');
    if (!doc.service_period) throw new HttpError(400, 'Bitte den Leistungszeitraum bzw. das Leistungsdatum angeben (Pflichtangabe § 14 UStG).');
    const company = getSetting('company');
    if (!company.tax_number && !company.vat_id && !opts.demo) {
      throw new HttpError(400, 'In den Einstellungen fehlt die Steuernummer bzw. USt-IdNr. (Pflichtangabe § 14 UStG).');
    }
    if (doc.tax_mode === '13b') {
      const c = get('SELECT type FROM customers WHERE id = ?', doc.customer_id);
      if (c?.type === 'privat') throw new HttpError(400, '§ 13b UStG ist bei Privatkunden nicht zulässig.');
    }

    refreshSnapshot(id);
    const prepaid = prepaidFor(doc);
    const date = doc.date || today();
    const number = nextDocumentNumber('rechnung', date);
    run(
      `UPDATE documents SET number = ?, status = 'offen', finalized_at = datetime('now','localtime'),
        due_date = COALESCE(due_date, ?), prepaid_json = ? WHERE id = ?`,
      number,
      addDays(date, doc.payment_days ?? 14),
      doc.type === 'schluss' ? JSON.stringify(prepaid) : null,
      id
    );
    recalc(id);
    if (doc.source_id && ['rechnung', 'schluss'].includes(doc.type)) {
      run("UPDATE documents SET status = 'abgerechnet' WHERE id = ? AND type = 'angebot'", doc.source_id);
    }
    logActivity(user?.id, 'document', id, 'festgeschrieben', `${TYPE_LABEL[doc.type]} ${number}`);
    return id;
  });
}

/* ---------------- Ableiten ---------------- */
function copyHeader(src) {
  return {
    customer_id: src.customer_id,
    subject: src.subject,
    project: src.project,
    site_address: src.site_address,
    customer_ref: src.customer_ref,
    tax_mode: src.tax_mode,
    show_35a: src.show_35a,
    discount_percent: src.discount_percent,
    service_period: src.service_period,
  };
}

function copyItems(items, { dropOptional = false } = {}) {
  return items
    .filter((i) => !(dropOptional && i.optional))
    .map(({ id, document_id, ...rest }) => rest);
}

/** Erstellt aus einem Beleg einen neuen (Rechnung, Abschlag, Schluss, Duplikat) */
function deriveDocument(sourceId, target, opts, user) {
  const src = loadDocument(sourceId);
  if (target === 'duplikat') {
    const id = createDocument(src.type === 'storno' ? 'rechnung' : src.type, {
      ...copyHeader(src),
      intro: src.intro,
      outro: src.outro,
      items: copyItems(src.items),
    }, user);
    return id;
  }
  if (src.type !== 'angebot') throw new HttpError(400, 'Rechnungen können nur aus einem Angebot erzeugt werden.');
  const texts = getSetting('texts');

  if (target === 'rechnung' || target === 'schluss') {
    const id = createDocument(target, {
      ...copyHeader(src),
      source_id: src.id,
      intro: texts[`${target}_intro`],
      outro: texts[`${target}_outro`],
      items: copyItems(src.items, { dropOptional: true }),
    }, user);
    if (src.status === 'versendet' || src.status === 'entwurf') {
      run("UPDATE documents SET status = 'angenommen', decided_at = datetime('now','localtime') WHERE id = ?", src.id);
    }
    return id;
  }

  if (target === 'abschlag') {
    const no = get("SELECT COUNT(*) AS n FROM documents WHERE type = 'abschlag' AND source_id = ? AND status <> 'storniert'", src.id).n + 1;
    let amount;
    let label;
    if (opts.mode === 'percent') {
      const pct = Number(opts.percent) || 0;
      if (pct <= 0 || pct > 100) throw new HttpError(400, 'Bitte einen Prozentsatz zwischen 1 und 100 angeben.');
      amount = calc.round(src.totals.net * pct / 100);
      label = `${pct.toLocaleString('de-DE')} % der Angebotssumme (netto ${calc.formatMoney(src.totals.net)})`;
    } else {
      amount = Math.round(Number(opts.amount) || 0);
      if (amount <= 0) throw new HttpError(400, 'Bitte einen Betrag angeben.');
      label = `Pauschalbetrag lt. Vereinbarung`;
    }
    const laborShare = src.totals.net ? calc.round((src.totals.labor / (1 + (src.tax_mode === '13b' ? 0 : 0.19)) / src.totals.net) * 100) : 0;
    const id = createDocument('abschlag', {
      ...copyHeader(src),
      discount_percent: 0,
      source_id: src.id,
      abschlag_no: no,
      subject: src.subject || `${no}. Abschlagsrechnung`,
      intro: texts.abschlag_intro,
      outro: texts.abschlag_outro,
      items: [
        {
          kind: 'item',
          name: `${no}. Abschlagszahlung zu Angebot ${src.number}`,
          description: `${opts.description ? opts.description + '\n' : ''}${label}`,
          qty: 1,
          unit: 'psch',
          price: amount,
          labor_percent: Math.min(100, Math.max(0, laborShare)),
          vat_rate: 19,
        },
      ],
    }, user);
    if (src.status === 'versendet' || src.status === 'entwurf') {
      run("UPDATE documents SET status = 'angenommen', decided_at = datetime('now','localtime') WHERE id = ?", src.id);
    }
    return id;
  }
  throw new HttpError(400, 'Unbekanntes Ziel.');
}

/* ---------------- Storno ---------------- */
function cancelDocument(id, user) {
  return tx(() => {
    const src = loadDocument(id);
    if (!INVOICE_TYPES.includes(src.type) || src.type === 'storno') throw new HttpError(400, 'Dieser Beleg kann nicht storniert werden.');
    if (!src.finalized_at) throw new HttpError(400, 'Entwürfe können einfach gelöscht werden.');
    if (src.status === 'storniert') throw new HttpError(400, 'Bereits storniert.');
    const texts = getSetting('texts');
    const date = today();
    const number = nextDocumentNumber('rechnung', date);
    const prepaid = src.prepaid?.gross
      ? { list: src.prepaid.list, net: -src.prepaid.net, vat: -src.prepaid.vat, gross: -src.prepaid.gross }
      : null;
    const r = run(
      `INSERT INTO documents(type, number, status, customer_id, source_id, ref_id, date, service_period, due_date,
        payment_days, subject, project, site_address, customer_ref, intro, outro, tax_mode, show_35a, discount_percent,
        customer_snapshot, prepaid_json, finalized_at, created_by)
       VALUES('storno', ?, 'storniert', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), ?)`,
      number, src.customer_id, src.source_id, src.id, date, src.service_period, date,
      `Storno zu ${TYPE_LABEL[src.type]} ${src.number}`, src.project, src.site_address, src.customer_ref,
      texts.storno_intro, texts.storno_outro, src.tax_mode, src.show_35a, src.discount_percent,
      src.customer_snapshot, prepaid ? JSON.stringify(prepaid) : null, user?.id ?? null
    );
    const newId = Number(r.lastInsertRowid);
    writeItems(newId, copyItems(src.items).map((i) => (i.kind === 'item' ? { ...i, qty: -i.qty } : i)));
    // prepaid_json wird bei Storno einer Schlussrechnung genutzt – type ist 'storno', daher manuell rechnen
    const t = calc.totals(src, itemsOf(newId), prepaid || undefined);
    run('UPDATE documents SET net=?, vat=?, gross=?, prepaid_gross=?, prepaid_net=?, labor=? WHERE id=?', t.net, t.vat, t.gross, t.prepaidGross, t.prepaidNet, t.labor, newId);
    run("UPDATE documents SET status = 'storniert' WHERE id = ?", src.id);
    if (src.source_id && ['rechnung', 'schluss'].includes(src.type)) {
      run("UPDATE documents SET status = 'angenommen' WHERE id = ? AND status = 'abgerechnet'", src.source_id);
    }
    logActivity(user?.id, 'document', src.id, 'storniert', `Storno ${number}`);
    return newId;
  });
}

/* ---------------- Status Angebot ---------------- */
function setOfferStatus(id, status, user) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  if (!doc || doc.type !== 'angebot') throw new HttpError(404, 'Angebot nicht gefunden.');
  if (!['entwurf', 'versendet', 'angenommen', 'abgelehnt'].includes(status)) throw new HttpError(400, 'Ungültiger Status.');
  run("UPDATE documents SET status = ?, decided_at = CASE WHEN ? IN ('angenommen','abgelehnt') THEN datetime('now','localtime') ELSE decided_at END WHERE id = ?", status, status, id);
  logActivity(user?.id, 'document', id, `Status: ${status}`);
}

function markSent(id) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  run("UPDATE documents SET sent_at = datetime('now','localtime') WHERE id = ?", id);
  if (doc.type === 'angebot' && doc.status === 'entwurf') run("UPDATE documents SET status = 'versendet' WHERE id = ?", id);
}

/* ---------------- Zahlungen ---------------- */
function updatePaymentStatus(id) {
  const doc = loadDocument(id);
  if (doc.status === 'storniert' || !doc.finalized_at) return;
  let status = 'offen';
  if (doc.paid > 0) status = doc.paid >= doc.totals.payable ? 'bezahlt' : 'teilbezahlt';
  run(
    "UPDATE documents SET status = ?, paid_at = CASE WHEN ? = 'bezahlt' THEN COALESCE(paid_at, datetime('now','localtime')) ELSE NULL END WHERE id = ?",
    status, status, id
  );
}

function addPayment(id, data, user) {
  const doc = get('SELECT * FROM documents WHERE id = ?', id);
  if (!doc || !doc.finalized_at) throw new HttpError(400, 'Zahlungen nur für festgeschriebene Rechnungen.');
  if (doc.status === 'storniert') throw new HttpError(400, 'Rechnung ist storniert.');
  const amount = Math.round(Number(data.amount) || 0);
  if (!amount) throw new HttpError(400, 'Bitte einen Betrag angeben.');
  run('INSERT INTO payments(document_id, date, amount, method, note) VALUES(?,?,?,?,?)', id, data.date || today(), amount, data.method || 'Überweisung', data.note || '');
  updatePaymentStatus(id);
  logActivity(user?.id, 'document', id, 'Zahlung erfasst', calc.formatMoney(amount));
}

function deletePayment(id, paymentId, user) {
  run('DELETE FROM payments WHERE id = ? AND document_id = ?', paymentId, id);
  updatePaymentStatus(id);
  logActivity(user?.id, 'document', id, 'Zahlung gelöscht');
}

/* ---------------- Mahnungen ---------------- */
function createReminder(id, user) {
  const doc = loadDocument(id);
  if (!doc.finalized_at || doc.open <= 0 || doc.status === 'storniert') throw new HttpError(400, 'Für diese Rechnung ist keine Mahnung möglich.');
  const cfg = getSetting('dunning');
  const level = (doc.reminders.at(-1)?.level ?? 0) + 1;
  if (level > 3) throw new HttpError(400, 'Die höchste Mahnstufe ist bereits erreicht. Bitte gerichtliches Mahnverfahren einleiten.');
  const fee = Math.round((Number(cfg.fees[level - 1]) || 0) * 100);
  const date = today();
  const r = run(
    'INSERT INTO reminders(document_id, level, date, due_date, fee, open_amount) VALUES(?,?,?,?,?,?)',
    id, level, date, addDays(date, cfg.days || 10), fee, doc.open
  );
  logActivity(user?.id, 'document', id, `${cfg.titles[level - 1]} erstellt`);
  return Number(r.lastInsertRowid);
}

/* ---------------- Listen ---------------- */
function listDocuments({ kind, status, q, customer_id, year } = {}) {
  const where = [];
  const params = [];
  if (kind === 'angebote') where.push("d.type = 'angebot'");
  else if (kind === 'rechnungen') where.push("d.type <> 'angebot'");
  if (customer_id) {
    where.push('d.customer_id = ?');
    params.push(customer_id);
  }
  if (year) {
    where.push("substr(d.date,1,4) = ?");
    params.push(String(year));
  }
  if (q) {
    where.push('(d.number LIKE ? OR d.subject LIKE ? OR d.project LIKE ? OR c.company LIKE ? OR c.last_name LIKE ? OR c.first_name LIKE ? OR c.number LIKE ?)');
    for (let i = 0; i < 7; i++) params.push(`%${q}%`);
  }
  const rows = all(
    `SELECT d.id, d.type, d.number, d.status, d.date, d.due_date, d.valid_until, d.subject, d.project, d.net, d.gross,
            d.prepaid_gross, d.prepaid_net, d.finalized_at, d.sent_at, d.customer_id, d.source_id,
            c.number AS customer_number, c.company, c.first_name, c.last_name, c.salutation,
            (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.document_id = d.id) AS paid,
            (SELECT MAX(level) FROM reminders r WHERE r.document_id = d.id) AS reminder_level
     FROM documents d LEFT JOIN customers c ON c.id = d.customer_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY d.date DESC, d.id DESC`,
    ...params
  );
  const out = rows.map((r) => {
    const s = displayStatus(r);
    return {
      ...r,
      customer_name: r.company || [r.first_name, r.last_name].filter(Boolean).join(' '),
      display_status: s,
      open: INVOICE_TYPES.includes(r.type) && r.finalized_at && r.status !== 'storniert' ? r.gross - r.prepaid_gross - r.paid : 0,
      label: TYPE_LABEL[r.type],
    };
  });
  return status ? out.filter((r) => r.display_status === status || r.status === status) : out;
}

module.exports = {
  HttpError,
  TYPE_LABEL,
  INVOICE_TYPES,
  today,
  addDays,
  formatDate,
  customerSnapshot,
  customerDisplayName,
  letterSalutation,
  loadDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  finalizeDocument,
  deriveDocument,
  cancelDocument,
  setOfferStatus,
  markSent,
  addPayment,
  deletePayment,
  createReminder,
  listDocuments,
  defaultsFor,
};
