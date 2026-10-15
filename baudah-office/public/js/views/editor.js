import {
  C, esc, icon, GET, POST, PUT, DEL, money, moneyIn, qty, date, dateTime, today, addDays, statusBadge, toast, ok, fail,
  attempt, modal, confirmDialog, formDialog, field, input, textarea, select, checkbox, dropdown, guard, navigate,
  customerName, openPdf, UNITS, TYPE, CUSTOMER_TYPE, debounce, state,
} from '../core.js';
import { customerDialog } from './customers.js';
import { articleDialog } from './articles.js';

const INVOICE_TYPES = ['rechnung', 'abschlag', 'schluss', 'storno'];
let articlesCache = null;
async function articles(force) {
  if (!articlesCache || force) articlesCache = await GET('/articles');
  return articlesCache;
}

/* ================================================================== */
/* Einstieg                                                            */
/* ================================================================== */
export async function newDocument(type, view, customerId) {
  if (!['angebot', 'rechnung'].includes(type)) throw new Error('Unbekannter Belegtyp');
  const [defaults, customer] = await Promise.all([
    GET(`/documents/defaults?type=${type}${customerId ? `&customer_id=${customerId}` : ''}`),
    customerId ? GET(`/customers/${customerId}`) : null,
  ]);
  const doc = {
    id: null, type, number: null, status: 'entwurf', display_status: 'entwurf', label: TYPE[type],
    customer_id: customer?.id || null, customer, subject: '', project: '', site_address: '', customer_ref: '',
    service_period: '', items: [], payments: [], reminders: [], emails: [], children: [], prepaid: { list: [], net: 0, vat: 0, gross: 0 },
    ...defaults,
  };
  if (type === 'angebot') doc.items = [{ kind: 'item', name: '', description: '', qty: 1, unit: 'psch', price: 0, cost: 0, labor_percent: 0, vat_rate: 19 }];
  render(view || document.getElementById('view'), doc);
}

export async function editorView(params, view) {
  const doc = await GET(`/documents/${params.id}`);
  render(view, doc);
}

/* ================================================================== */
/* Editor                                                              */
/* ================================================================== */
function render(view, doc) {
  guard.dirty = false;
  const E = { view, doc, items: doc.items.map((i) => ({ ...i })), open: new Set(), locked: !!doc.locked };
  const isOffer = doc.type === 'angebot';
  const isInvoice = INVOICE_TYPES.includes(doc.type);
  const dis = E.locked ? 'disabled' : '';

  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <div class="crumb"><a href="#/${isOffer ? 'angebote' : 'rechnungen'}">${isOffer ? 'Angebote' : 'Rechnungen'}</a> / ${esc(doc.number || 'Neu')}</div>
        <div class="doc-title"><span class="type-chip">${esc(doc.label || TYPE[doc.type])}${doc.abschlag_no ? ` Nr. ${doc.abschlag_no}` : ''}</span>
          <h1>${esc(doc.number || (isOffer ? 'Neues Angebot' : 'Rechnungsentwurf'))}</h1>${statusBadge(doc.display_status)}
          <span id="dirty" class="badge s-teilbezahlt hidden">Ungespeichert</span></div>
      </div>
      <div class="btn-row">
        ${E.locked ? '' : `<button class="btn primary" id="save">${icon('save')} Speichern</button>`}
        <button class="btn" id="pdf" ${doc.id ? '' : 'disabled'}>${icon('pdf')} PDF</button>
        <button class="btn" id="mail" ${doc.id ? '' : 'disabled'}>${icon('mail')} Per E-Mail</button>
        <button class="btn icon" id="more" ${doc.id ? '' : 'disabled'} title="Weitere Aktionen">${icon('more')}</button>
      </div>
    </div>

    ${E.locked ? `<div class="locked-banner">${icon('lock')}<div>${doc.type === 'storno' ? 'Stornorechnung' : 'Diese Rechnung'} wurde am ${dateTime(doc.finalized_at)} festgeschrieben und ist GoBD-konform unveränderbar. Korrekturen erfolgen über <b>Stornieren</b> und eine neue Rechnung.</div></div>` : ''}
    ${isInvoice && !E.locked && doc.id ? `<div class="alert" style="margin-bottom:14px">${icon('bell')}<div>Entwurf ohne Rechnungsnummer. Die fortlaufende Nummer wird beim <b>Festschreiben</b> bzw. beim E-Mail-Versand vergeben.</div></div>` : ''}

    <div class="editor">
      <div class="maincol">
        <div class="card">
          <div class="card-head"><h2>Kunde &amp; Bauvorhaben</h2></div>
          <div class="card-body">
            <div class="form-grid" id="head">
              <div class="c6"><div class="f" style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-bottom:5px">Kunde</div><div class="cust-picker" id="cust"></div></div>
              <div class="c6 form-grid" style="gap:12px;align-content:start">
                ${field(isOffer ? 'Angebotsdatum' : 'Rechnungsdatum', input('date', doc.date, `type="date" ${dis}`), 'c6')}
                ${isOffer
                  ? field('Gültig bis', input('valid_until', doc.valid_until || '', `type="date" ${dis}`), 'c6')
                  : field('Zahlungsziel', `<div class="input-suffix">${input('payment_days', doc.payment_days ?? 14, `type="number" min="0" ${dis}`)}<span>Tage</span></div>`, 'c6', doc.due_date ? `fällig am ${date(doc.due_date)}` : '')}
                ${!isOffer ? field('Leistungszeitraum / -datum *', input('service_period', doc.service_period, `placeholder="z. B. 01.–15.10.2026" ${dis}`), 'c12', 'Pflichtangabe nach § 14 UStG') : ''}
                ${field('Ihr Zeichen / Bestell-Nr.', input('customer_ref', doc.customer_ref, dis), 'c12')}
              </div>
              ${field('Bauvorhaben', input('project', doc.project, `placeholder="z. B. Fassadensanierung EFH Müller" ${dis}`), 'c6')}
              ${field('Baustelle (Adresse)', input('site_address', doc.site_address, `placeholder="Straße, PLZ Ort" ${dis}`), 'c6')}
              ${field('Betreff', input('subject', doc.subject, `placeholder="Kurzbeschreibung der Leistung" ${dis}`), 'c12')}
              <div class="form-sep">Steuer</div>
              ${field('Umsatzsteuer', select('tax_mode', { standard: 'Regelbesteuerung (19 % / 7 %)', '13b': '§ 13b UStG – Reverse Charge (Bauleistung an Bauunternehmer)' }, doc.tax_mode, dis), 'c8')}
              <div class="c4" style="display:flex;align-items:flex-end;padding-bottom:8px">${checkbox('show_35a', doc.show_35a, '§ 35a EStG Lohnanteil ausweisen')}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>Positionen</h2><span class="muted small" id="poscount"></span></div>
          <div class="table-wrap">
            <table class="items">
              <thead><tr><th></th><th>Pos.</th><th class="lc">Leistung</th><th style="width:96px" class="right">Menge</th><th style="width:78px">Einheit</th><th style="width:112px" class="right">EP netto</th><th class="right">Gesamt</th><th></th></tr></thead>
              <tbody id="items"></tbody>
            </table>
          </div>
          ${E.locked ? '' : `
          <div class="add-bar">
            <button class="btn primary sm" data-add="catalog">${icon('catalog')} Aus Leistungskatalog</button>
            <button class="btn sm" data-add="item">${icon('plus')} Freie Position</button>
            <button class="btn sm" data-add="title">${icon('title')} Titel</button>
            <button class="btn sm" data-add="text">${icon('text')} Textzeile</button>
            <button class="btn sm" data-add="pagebreak">${icon('break')} Seitenumbruch</button>
          </div>`}
        </div>

        <div class="card">
          <div class="card-head"><h2>Texte &amp; Konditionen</h2></div>
          <div class="card-body form-grid" id="texts">
            ${field('Einleitungstext', textarea('intro', doc.intro, `rows="3" ${dis}`), 'c12', 'Steht nach der Anrede („Sehr geehrter Herr …“) vor den Positionen.')}
            ${field('Schlusstext', textarea('outro', doc.outro, `rows="4" ${dis}`), 'c12')}
            ${field('Gesamtrabatt', `<div class="input-suffix">${input('discount_percent', qty(doc.discount_percent || 0), dis)}<span>%</span></div>`, 'c4')}
            ${!isOffer ? field('Skonto', `<div class="input-suffix">${input('skonto_percent', qty(doc.skonto_percent || 0), dis)}<span>%</span></div>`, 'c4') : ''}
            ${!isOffer ? field('Skonto-Frist', `<div class="input-suffix">${input('skonto_days', doc.skonto_days || 0, `type="number" min="0" ${dis}`)}<span>Tage</span></div>`, 'c4') : ''}
          </div>
        </div>
      </div>

      <aside class="side" id="side"></aside>
    </div>
  </div>`;

  E.$ = (s) => view.querySelector(s);
  renderCustomer(E);
  renderItems(E);
  renderSide(E);
  bindHeader(E);
  bindItems(E);
  bindActions(E);
}

/* ---------------- Dirty-Tracking ---------------- */
function markDirty(E) {
  if (E.locked) return;
  guard.dirty = true;
  E.$('#dirty')?.classList.remove('hidden');
}

/* ================================================================== */
/* Kunde                                                               */
/* ================================================================== */
function renderCustomer(E) {
  const box = E.$('#cust');
  const c = E.doc.customer;
  const snap = E.locked ? E.doc.snapshot : null;
  if (c || snap) {
    const lines = snap?.lines || addressLines(c);
    box.innerHTML = `
      <div class="picked">
        <div class="avatar">${esc((customerName(c) || snap?.name || '?').slice(0, 1))}</div>
        <div class="addr">${lines.map((l, i) => (i === 0 ? `<b>${esc(l)}</b>` : esc(l))).join('<br>')}
          <div class="small muted" style="margin-top:4px">${esc(c?.number || snap?.number || '')}
          ${c ? `· <span class="badge t-${c.type} plain">${CUSTOMER_TYPE[c.type]}</span>` : ''}
          ${c?.reverse_charge ? '<span class="badge rc plain">§ 13b</span>' : ''}
          ${c?.email ? `<br>${esc(c.email)}` : '<br><span style="color:var(--warn)">keine E-Mail hinterlegt</span>'}</div>
        </div>
        <div class="btn-row" style="flex-direction:column;align-items:stretch">
          ${E.locked ? `<a class="btn sm" href="#/kunden/${c?.id || snap?.id}">Öffnen</a>` : `
          <button class="btn sm" data-c="change">Ändern</button>
          <button class="btn sm ghost" data-c="edit">Bearbeiten</button>`}
        </div>
      </div>`;
  } else {
    box.innerHTML = `
      <div style="position:relative">
        <input id="cust-q" placeholder="Kunde suchen: Name, Firma, Ort, Kundennr. …" autocomplete="off" ${E.locked ? 'disabled' : ''}>
        <div class="suggest hidden" id="cust-s"></div>
      </div>
      <button class="btn sm ghost" style="margin-top:8px" data-c="new">${icon('plus')} Neuen Kunden anlegen</button>`;
    const q = box.querySelector('#cust-q');
    const s = box.querySelector('#cust-s');
    let results = [];
    let sel = 0;
    const search = debounce(async () => {
      results = await GET(`/customers?q=${encodeURIComponent(q.value.trim())}`);
      sel = 0;
      s.innerHTML = results.slice(0, 12).map((r, i) => `<button type="button" data-id="${r.id}" class="${i === sel ? 'sel' : ''}">${icon(r.company ? 'building' : 'user')}<span><b>${esc(r.display_name)}</b><br><span class="small muted">${esc([r.street, [r.zip, r.city].join(' ')].filter((x) => x.trim()).join(', '))}</span></span><span class="meta">${esc(r.number)}</span></button>`).join('')
        || `<div class="empty" style="padding:14px">Kein Kunde gefunden. <a href="#" data-c="new">Neu anlegen</a></div>`;
      s.classList.remove('hidden');
    }, 150);
    q.addEventListener('focus', search);
    q.addEventListener('input', search);
    q.addEventListener('keydown', (e) => {
      const btns = [...s.querySelectorAll('button')];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = Math.max(0, Math.min(btns.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
        btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        btns[sel]?.click();
      }
    });
    s.addEventListener('mousedown', (e) => {
      const b = e.target.closest('button[data-id]');
      if (b) pickCustomer(E, Number(b.dataset.id));
    });
    q.addEventListener('blur', () => setTimeout(() => s.classList.add('hidden'), 150));
  }
  box.onclick = async (e) => {
    const a = e.target.closest('[data-c]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.c === 'change') {
      E.doc.customer = null;
      E.doc.customer_id = null;
      markDirty(E);
      renderCustomer(E);
      E.$('#cust-q')?.focus();
    } else if (a.dataset.c === 'edit') {
      const id = await customerDialog(E.doc.customer);
      if (id) pickCustomer(E, id, false);
    } else if (a.dataset.c === 'new') {
      const id = await customerDialog();
      if (id) pickCustomer(E, id);
    }
  };
}

function addressLines(c) {
  if (!c) return [];
  const name = c.company || [c.salutation === 'Firma' ? '' : c.salutation, c.title, c.first_name, c.last_name].filter(Boolean).join(' ');
  return [name, c.company && c.contact_person ? `z. Hd. ${c.contact_person}` : '', c.address_extra, c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean);
}

async function pickCustomer(E, id, applyTerms = true) {
  const c = await GET(`/customers/${id}`);
  E.doc.customer = c;
  E.doc.customer_id = c.id;
  if (applyTerms) {
    const d = await GET(`/documents/defaults?type=${E.doc.type}&customer_id=${c.id}`);
    const head = E.$('#head');
    head.querySelector('[name=tax_mode]').value = d.tax_mode;
    head.querySelector('[name=show_35a]').checked = !!d.show_35a;
    const pd = head.querySelector('[name=payment_days]');
    if (pd) pd.value = d.payment_days;
    E.$('#texts [name=discount_percent]').value = qty(d.discount_percent || 0);
    const notes = [];
    if (d.tax_mode === '13b') notes.push('§ 13b Reverse Charge aktiviert');
    if (d.show_35a) notes.push('§ 35a-Ausweis aktiviert');
    if (d.discount_percent) notes.push(`${qty(d.discount_percent)} % Kundenrabatt`);
    if (notes.length) toast(`Konditionen übernommen: ${notes.join(', ')}`);
  }
  markDirty(E);
  renderCustomer(E);
  renderSide(E);
}

/* ================================================================== */
/* Positionen                                                          */
/* ================================================================== */
function renderItems(E) {
  const numbered = C.numberItems(E.items);
  const dis = E.locked ? 'disabled' : '';
  const rows = numbered.map((it, i) => {
    const handle = E.locked ? '<td></td>' : `<td class="handle" title="Ziehen zum Verschieben">${icon('grip')}</td>`;
    const actions = E.locked ? '<td></td>' : `<td><div class="row-actions">
        ${it.kind === 'item' ? `<button class="btn ghost sm icon" data-act="details" title="Details: Rabatt, Lohnanteil, EK …">${icon('sliders')}</button>` : ''}
        <button class="btn ghost sm icon" data-act="menu" title="Mehr">${icon('more')}</button></div></td>`;
    if (it.kind === 'title') {
      return `<tr class="title-row" data-i="${i}">${handle}<td class="pos"><b>${esc(it.posnr)}</b></td>
        <td colspan="4"><input class="name-in" data-f="name" value="${esc(it.name)}" placeholder="Titel, z. B. Maurerarbeiten" ${dis}>
        <textarea data-f="description" rows="1" placeholder="Optionale Beschreibung zum Titel" ${dis}>${esc(it.description)}</textarea></td>
        <td class="total title-sum" data-total>${money(it.titleSum)}</td>${actions}</tr>`;
    }
    if (it.kind === 'text') {
      return `<tr class="text-row" data-i="${i}">${handle}<td class="pos">${icon('text')}</td>
        <td colspan="5"><input class="name-in" data-f="name" value="${esc(it.name)}" placeholder="Überschrift (optional)" ${dis}>
        <textarea data-f="description" rows="2" placeholder="Freitext, z. B. Hinweise zur Ausführung" ${dis}>${esc(it.description)}</textarea></td>${actions}</tr>`;
    }
    if (it.kind === 'pagebreak') {
      return `<tr class="break-row" data-i="${i}">${handle}<td colspan="6">— Seitenumbruch im PDF —</td>${actions}</tr>`;
    }
    const details = E.open.has(i) ? detailsRow(it, i, dis) : '';
    return `<tr class="item-row ${it.optional ? 'optional' : ''}" data-i="${i}">${handle}
      <td class="pos">${esc(it.posnr)}</td>
      <td style="position:relative"><input class="name-in" data-f="name" value="${esc(it.name)}" placeholder="Leistung eingeben oder aus Katalog suchen …" autocomplete="off" ${dis}>
        <textarea data-f="description" rows="1" placeholder="Leistungsbeschreibung" ${dis}>${esc(it.description)}</textarea>
        ${it.optional ? '<span class="badge s-teilbezahlt plain" style="margin-top:4px">Eventualposition – nicht in Summe</span>' : ''}
        ${it.discount ? `<span class="badge plain" style="margin-top:4px">−${qty(it.discount)} % Nachlass</span>` : ''}</td>
      <td><input class="right" data-f="qty" value="${qty(it.qty)}" inputmode="decimal" ${dis}></td>
      <td><input data-f="unit" value="${esc(it.unit)}" list="units" ${dis}></td>
      <td><input class="right" data-f="price" value="${moneyIn(it.price)}" inputmode="decimal" ${dis}></td>
      <td class="total" data-total>${it.optional ? '<span class="muted">nur EP</span>' : money(it.total)}</td>
      ${actions}</tr>${details}`;
  });
  E.$('#items').innerHTML = (rows.join('') || `<tr><td colspan="8">${'<div class="empty">Noch keine Positionen. Fügen Sie Leistungen aus dem Katalog hinzu.</div>'}</td></tr>`) +
    `<datalist id="units">${UNITS.map((u) => `<option value="${u}">`).join('')}</datalist>`;
  E.$('#poscount').textContent = `${E.items.filter((i) => i.kind === 'item').length} Position(en)`;
  E.$('#items').querySelectorAll('textarea').forEach(autoGrow);
}

function detailsRow(it, i, dis) {
  const t = C.lineTotal(it);
  const margin = t - Math.round((Number(it.qty) || 0) * (it.cost || 0));
  return `<tr class="details" data-for="${i}"><td></td><td colspan="7">
    <div class="form-grid">
      ${field('Nachlass', `<div class="input-suffix"><input data-f="discount" value="${qty(it.discount || 0)}" ${dis}><span>%</span></div>`, 'c2')}
      ${field('Lohnanteil', `<div class="input-suffix"><input data-f="labor_percent" value="${qty(it.labor_percent || 0)}" ${dis}><span>%</span></div>`, 'c2', '§ 35a EStG')}
      ${field('MwSt', `<select data-f="vat_rate" ${dis}>${[19, 7, 0].map((r) => `<option value="${r}" ${Number(it.vat_rate) === r ? 'selected' : ''}>${r} %</option>`).join('')}</select>`, 'c2')}
      ${field('EK netto / Einheit', `<input data-f="cost" value="${moneyIn(it.cost || 0)}" ${dis}>`, 'c2', 'Material + Fremdleistung')}
      <div class="c2"><div class="small muted" style="font-weight:600">Rohertrag</div><div style="font-weight:650;margin-top:8px;color:${margin < 0 ? 'var(--danger)' : 'var(--ok)'}" data-margin>${money(margin)}</div></div>
      <div class="c2" style="display:flex;flex-direction:column;gap:6px;justify-content:flex-end">
        <label class="check"><input type="checkbox" data-f="optional" ${it.optional ? 'checked' : ''} ${dis}> Eventualposition</label>
      </div>
    </div></td></tr>`;
}

function autoGrow(t) {
  t.style.height = 'auto';
  t.style.height = `${Math.max(34, t.scrollHeight + 2)}px`;
}

function bindItems(E) {
  const tbody = E.$('#items');
  if (E.locked) return;

  tbody.addEventListener('input', (e) => {
    const el = e.target;
    const f = el.dataset.f;
    if (!f) return;
    const tr = el.closest('tr');
    const i = Number(tr.dataset.i ?? tr.dataset.for);
    const it = E.items[i];
    if (f === 'qty' || f === 'discount' || f === 'labor_percent') it[f] = C.parseNumber(el.value);
    else if (f === 'price' || f === 'cost') it[f] = C.parseMoney(el.value);
    else if (f === 'vat_rate') it[f] = Number(el.value);
    else if (f === 'optional') {
      it.optional = el.checked ? 1 : 0;
      renderItems(E);
    } else it[f] = el.value;
    if (el.tagName === 'TEXTAREA') autoGrow(el);
    if (f === 'name' && it.kind === 'item') suggestArticles(E, el, i);
    markDirty(E);
    refreshTotals(E);
  });
  tbody.addEventListener('change', (e) => {
    const f = e.target.dataset.f;
    if (f === 'vat_rate') e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });
  tbody.addEventListener('focusout', (e) => {
    const el = e.target;
    const tr = el.closest('tr');
    if (!tr) return;
    const i = Number(tr.dataset.i ?? tr.dataset.for);
    const it = E.items[i];
    if (!it) return;
    if (el.dataset.f === 'price' || el.dataset.f === 'cost') el.value = moneyIn(it[el.dataset.f]);
    if (el.dataset.f === 'qty') el.value = qty(it.qty);
    if (['discount', 'optional'].includes(el.dataset.f)) renderItems(E);
  });
  tbody.addEventListener('keydown', (e) => {
    // Enter in Mengen/Preis-Feld: zur nächsten Zeile springen
    if (e.key === 'Enter' && ['qty', 'price', 'unit'].includes(e.target.dataset.f)) {
      e.preventDefault();
      const rows = [...tbody.querySelectorAll('tr.item-row')];
      const idx = rows.indexOf(e.target.closest('tr'));
      const next = rows[idx + 1]?.querySelector(`[data-f="${e.target.dataset.f}"]`);
      if (next) next.focus();
      else addItem(E, { kind: 'item' });
    }
  });
  tbody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = Number(b.closest('tr').dataset.i);
    if (b.dataset.act === 'details') {
      E.open.has(i) ? E.open.delete(i) : E.open.add(i);
      renderItems(E);
    } else if (b.dataset.act === 'menu') {
      const it = E.items[i];
      dropdown(b, [
        { label: 'Nach oben', icon: 'arrow', action: () => move(E, i, i - 1), disabled: i === 0 },
        { label: 'Nach unten', icon: 'arrow', action: () => move(E, i, i + 1), disabled: i === E.items.length - 1 },
        { label: 'Duplizieren', icon: 'copy', action: () => { E.items.splice(i + 1, 0, { ...it, id: undefined }); E.open.clear(); markDirty(E); renderItems(E); refreshTotals(E); } },
        ...(it.kind === 'item' ? [
          { label: it.optional ? 'Als normale Position' : 'Als Eventualposition', icon: 'layers', action: () => { it.optional = it.optional ? 0 : 1; markDirty(E); renderItems(E); refreshTotals(E); } },
          { label: 'In Leistungskatalog übernehmen', icon: 'catalog', action: () => saveToCatalog(it) },
        ] : []),
        '-',
        { label: 'Löschen', icon: 'trash', danger: true, action: () => { E.items.splice(i, 1); E.open.clear(); markDirty(E); renderItems(E); refreshTotals(E); } },
      ]);
    }
  });

  // Drag & Drop
  let dragFrom = null;
  tbody.addEventListener('mousedown', (e) => {
    const h = e.target.closest('.handle');
    if (h) h.closest('tr').draggable = true;
  });
  tbody.addEventListener('dragstart', (e) => {
    const tr = e.target.closest('tr[data-i]');
    dragFrom = Number(tr.dataset.i);
    tr.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFrom));
  });
  tbody.addEventListener('dragover', (e) => {
    if (dragFrom === null) return;
    e.preventDefault();
    tbody.querySelectorAll('.drop-above').forEach((r) => r.classList.remove('drop-above'));
    e.target.closest('tr[data-i]')?.classList.add('drop-above');
  });
  tbody.addEventListener('drop', (e) => {
    e.preventDefault();
    const tr = e.target.closest('tr[data-i]');
    if (tr && dragFrom !== null) {
      const to = Number(tr.dataset.i);
      move(E, dragFrom, dragFrom < to ? to - 1 : to);
    }
    dragFrom = null;
  });
  tbody.addEventListener('dragend', () => {
    dragFrom = null;
    tbody.querySelectorAll('tr').forEach((r) => { r.draggable = false; r.classList.remove('dragging', 'drop-above'); });
  });

  E.$('.add-bar')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    if (b.dataset.add === 'catalog') return catalogPicker(E);
    addItem(E, { kind: b.dataset.add });
  });
}

function move(E, from, to) {
  if (to < 0 || to >= E.items.length || from === to) return;
  const [it] = E.items.splice(from, 1);
  E.items.splice(to, 0, it);
  E.open.clear();
  markDirty(E);
  renderItems(E);
  refreshTotals(E);
}

function addItem(E, partial) {
  const base = { kind: 'item', name: '', description: '', qty: 1, unit: 'Stk', price: 0, cost: 0, labor_percent: 0, discount: 0, vat_rate: 19, optional: 0 };
  E.items.push({ ...base, ...partial });
  markDirty(E);
  renderItems(E);
  refreshTotals(E);
  const rows = E.$('#items').querySelectorAll('tr[data-i]');
  rows[rows.length - 1]?.querySelector('.name-in')?.focus();
}

function itemFromArticle(a, q = 1) {
  return {
    kind: 'item', article_id: a.id, name: a.name, description: a.description, qty: q, unit: a.unit,
    price: a.price, cost: a.cost, labor_percent: a.labor_percent, vat_rate: a.vat_rate, discount: 0, optional: 0,
  };
}

/* Autovervollständigung aus Leistungskatalog */
async function suggestArticles(E, inputEl, i) {
  const q = inputEl.value.trim().toLowerCase();
  document.querySelectorAll('.suggest.art').forEach((s) => s.remove());
  if (q.length < 2) return;
  const list = (await articles()).filter((a) => `${a.number} ${a.name} ${a.category}`.toLowerCase().includes(q)).slice(0, 8);
  if (!list.length) return;
  const box = document.createElement('div');
  box.className = 'suggest art';
  box.innerHTML = list.map((a, k) => `<button type="button" data-k="${k}" class="${k === 0 ? 'sel' : ''}"><span><b>${esc(a.name)}</b><br><span class="small muted">${esc(a.category)} · ${esc(a.number)}</span></span><span class="meta">${money(a.price)} / ${esc(a.unit)}</span></button>`).join('');
  inputEl.parentElement.appendChild(box);
  let sel = 0;
  const choose = (k) => {
    const keepQty = E.items[i].qty;
    E.items[i] = { ...itemFromArticle(list[k], keepQty || 1) };
    box.remove();
    markDirty(E);
    renderItems(E);
    refreshTotals(E);
    E.$(`#items tr[data-i="${i}"] [data-f="qty"]`)?.select();
  };
  box.addEventListener('mousedown', (e) => {
    const b = e.target.closest('button');
    if (b) { e.preventDefault(); choose(Number(b.dataset.k)); }
  });
  const onKey = (e) => {
    if (!box.isConnected) return inputEl.removeEventListener('keydown', onKey);
    const btns = [...box.querySelectorAll('button')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = Math.max(0, Math.min(btns.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      btns.forEach((b, k) => b.classList.toggle('sel', k === sel));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(sel);
    } else if (e.key === 'Escape') box.remove();
  };
  inputEl.addEventListener('keydown', onKey);
  inputEl.addEventListener('blur', () => setTimeout(() => box.remove(), 150), { once: true });
}

async function saveToCatalog(it) {
  const id = await articleDialog({
    name: it.name, description: it.description, unit: it.unit, price: it.price, cost: it.cost,
    labor_percent: it.labor_percent, vat_rate: it.vat_rate, category: '', number: '',
  }, true);
  if (id) {
    it.article_id = id;
    articlesCache = null;
    ok('In den Leistungskatalog übernommen.');
  }
}

/* Katalog-Auswahl (Mehrfachauswahl mit Mengen) */
async function catalogPicker(E) {
  const list = await articles(true);
  const cats = [...new Set(list.map((a) => a.category || 'Ohne Kategorie'))];
  const chosen = new Map();
  let cat = '';
  let q = '';
  await modal({
    title: 'Leistungen aus Katalog übernehmen',
    size: 'xl',
    body: `
      <div class="picker-layout">
        <div><div class="cat-list" id="cats"></div></div>
        <div>
          <div class="toolbar"><div class="search-box" style="max-width:none">${icon('search')}<input id="pq" placeholder="Leistung suchen …" autofocus></div>
          <label class="check"><input type="checkbox" id="astitle" checked> Kategorien als Titel einfügen</label></div>
          <div class="table-wrap" style="max-height:52vh;overflow:auto;border:1px solid var(--line);border-radius:9px"><table class="table compact"><thead><tr><th></th><th>Leistung</th><th>Einheit</th><th class="num">EP netto</th><th>Menge</th></tr></thead><tbody id="plist"></tbody></table></div>
        </div>
      </div>`,
    foot: `<span class="left muted" id="psum">Nichts ausgewählt</span><button class="btn" data-close>Abbrechen</button><button class="btn primary" id="take">${icon('plus')} Übernehmen</button>`,
    onOpen: (m, close) => {
      const drawCats = () => {
        m.querySelector('#cats').innerHTML = [['', 'Alle Leistungen', list.length], ...cats.map((c) => [c, c, list.filter((a) => (a.category || 'Ohne Kategorie') === c).length])]
          .map(([k, l, n]) => `<button data-cat="${esc(k)}" class="${cat === k ? 'active' : ''}"><span>${esc(l)}</span><span class="muted">${n}</span></button>`).join('');
      };
      const drawList = () => {
        const rows = list.filter((a) => (!cat || (a.category || 'Ohne Kategorie') === cat) && (!q || `${a.number} ${a.name} ${a.description}`.toLowerCase().includes(q)));
        m.querySelector('#plist').innerHTML = rows.map((a) => `
          <tr data-id="${a.id}" class="${chosen.has(a.id) ? 'sel' : ''}">
            <td><input type="checkbox" ${chosen.has(a.id) ? 'checked' : ''}></td>
            <td><b>${esc(a.name)}</b><div class="sub" style="max-width:520px">${esc(a.number)} · ${esc(a.description.slice(0, 110))}${a.description.length > 110 ? '…' : ''}</div></td>
            <td>${esc(a.unit)}</td><td class="num">${money(a.price)}</td>
            <td><input class="right" data-q value="${qty(chosen.get(a.id) ?? 1)}"></td>
          </tr>`).join('') || `<tr><td colspan="5"><div class="empty">Keine Leistungen gefunden</div></td></tr>`;
      };
      const sum = () => {
        let s = 0;
        for (const [id, n] of chosen) s += Math.round(n * list.find((a) => a.id === id).price);
        m.querySelector('#psum').textContent = chosen.size ? `${chosen.size} ausgewählt · ${money(s)} netto` : 'Nichts ausgewählt';
      };
      drawCats();
      drawList();
      m.querySelector('#cats').addEventListener('click', (e) => {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        cat = b.dataset.cat;
        drawCats();
        drawList();
      });
      m.querySelector('#pq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); drawList(); });
      m.querySelector('#plist').addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-id]');
        if (!tr || e.target.matches('[data-q]')) return;
        const id = Number(tr.dataset.id);
        if (chosen.has(id)) chosen.delete(id);
        else chosen.set(id, C.parseNumber(tr.querySelector('[data-q]').value) || 1);
        tr.classList.toggle('sel', chosen.has(id));
        tr.querySelector('input[type=checkbox]').checked = chosen.has(id);
        sum();
      });
      m.querySelector('#plist').addEventListener('input', (e) => {
        if (!e.target.matches('[data-q]')) return;
        const id = Number(e.target.closest('tr').dataset.id);
        const n = C.parseNumber(e.target.value);
        if (n) chosen.set(id, n);
        e.target.closest('tr').classList.add('sel');
        e.target.closest('tr').querySelector('input[type=checkbox]').checked = true;
        sum();
      });
      m.querySelector('#take').addEventListener('click', () => {
        if (!chosen.size) return toast('Bitte mindestens eine Leistung auswählen.');
        const asTitle = m.querySelector('#astitle').checked;
        // leere Startzeile entfernen
        if (E.items.length === 1 && E.items[0].kind === 'item' && !E.items[0].name && !E.items[0].price) E.items = [];
        const selected = list.filter((a) => chosen.has(a.id));
        const existingTitles = new Set(E.items.filter((i) => i.kind === 'title').map((i) => i.name));
        const groups = new Map();
        for (const a of selected) {
          const k = a.category || 'Weitere Leistungen';
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(a);
        }
        for (const [k, arr] of groups) {
          if (asTitle && existingTitles.has(k)) {
            // hinter den vorhandenen Titelblock einsortieren
            let idx = E.items.findIndex((i) => i.kind === 'title' && i.name === k) + 1;
            while (idx < E.items.length && E.items[idx].kind !== 'title') idx++;
            E.items.splice(idx, 0, ...arr.map((a) => itemFromArticle(a, chosen.get(a.id))));
            continue;
          }
          if (asTitle) E.items.push({ kind: 'title', name: k, description: '' });
          for (const a of arr) E.items.push(itemFromArticle(a, chosen.get(a.id)));
        }
        markDirty(E);
        renderItems(E);
        refreshTotals(E);
        close(true);
        ok(`${chosen.size} Leistung(en) übernommen.`);
      });
    },
  });
}

/* ================================================================== */
/* Summen & Seitenleiste                                               */
/* ================================================================== */
function headerValues(E) {
  const v = {};
  E.view.querySelectorAll('#head [name], #texts [name]').forEach((el) => {
    v[el.name] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
  });
  v.discount_percent = C.parseNumber(v.discount_percent);
  if (v.skonto_percent !== undefined) v.skonto_percent = C.parseNumber(v.skonto_percent);
  if (v.skonto_days !== undefined) v.skonto_days = Number(v.skonto_days) || 0;
  if (v.payment_days !== undefined) v.payment_days = Number(v.payment_days) || 0;
  return v;
}

function currentTotals(E) {
  const h = E.locked ? E.doc : { ...E.doc, ...headerValues(E) };
  return C.totals(h, E.items, E.doc.prepaid);
}

function refreshTotals(E) {
  const numbered = C.numberItems(E.items);
  E.$('#items').querySelectorAll('tr[data-i]').forEach((tr) => {
    const it = numbered[Number(tr.dataset.i)];
    const cell = tr.querySelector('[data-total]');
    if (!cell || !it) return;
    if (it.kind === 'title') cell.textContent = money(it.titleSum);
    else if (it.kind === 'item') cell.innerHTML = it.optional ? '<span class="muted">nur EP</span>' : money(it.total);
    const pos = tr.querySelector('.pos');
    if (pos && it.posnr) pos.innerHTML = it.kind === 'title' ? `<b>${esc(it.posnr)}</b>` : esc(it.posnr);
  });
  E.$('#items').querySelectorAll('tr.details').forEach((tr) => {
    const it = E.items[Number(tr.dataset.for)];
    const margin = C.lineTotal(it) - Math.round((Number(it.qty) || 0) * (it.cost || 0));
    const el = tr.querySelector('[data-margin]');
    el.textContent = money(margin);
    el.style.color = margin < 0 ? 'var(--danger)' : 'var(--ok)';
  });
  renderTotalsCard(E);
}

function renderTotalsCard(E) {
  const t = currentTotals(E);
  const h = E.locked ? E.doc : { ...E.doc, ...headerValues(E) };
  const box = E.$('#totals');
  if (!box) return;
  const rows = [];
  if (t.discount) {
    rows.push(['Zwischensumme', money(t.subtotal)]);
    rows.push([`Rabatt ${qty(h.discount_percent)} %`, money(-t.discount)]);
  }
  rows.push(['<b>Summe netto</b>', `<b>${money(t.net)}</b>`]);
  if (h.tax_mode === '13b') rows.push(['USt (§ 13b – Reverse Charge)', money(0)]);
  else t.vatGroups.forEach((g) => rows.push([`zzgl. ${qty(g.rate)} % USt`, money(g.vat)]));
  const prepaid = E.doc.prepaid?.list || [];
  const marginPct = Math.round(t.marginPercent);
  box.innerHTML = `
    <div class="totals">
      ${rows.map(([a, b]) => `<div class="row"><span>${a}</span><span>${b}</span></div>`).join('')}
      ${prepaid.length ? `<div class="row"><span><b>Gesamtleistung brutto</b></span><span><b>${money(t.gross)}</b></span></div>
        ${prepaid.map((p) => `<div class="row small"><span>abzgl. ${esc(p.number)}</span><span>${money(-p.gross)}</span></div>`).join('')}` : ''}
      <div class="row grand"><span>${prepaid.length ? 'Zahlbetrag' : E.doc.type === 'angebot' ? 'Angebotssumme' : 'Gesamtbetrag'}</span><span>${money(t.payable)}</span></div>
      ${h.show_35a && t.labor ? `<div class="row small muted"><span>davon Lohnanteil § 35a (brutto)</span><span>${money(t.labor)}</span></div>` : ''}
      ${t.cost ? `<div class="sep"></div>
        <div class="row small"><span>Rohertrag (Netto − EK)</span><span style="color:${t.margin < 0 ? 'var(--danger)' : 'var(--ok)'};font-weight:650">${money(t.margin)} · ${marginPct} %</span></div>
        <div class="meter" title="Marge"><i style="width:${Math.max(0, Math.min(100, marginPct))}%;background:${marginPct < 15 ? 'var(--danger)' : marginPct < 30 ? 'var(--warn)' : 'var(--ok)'}"></i></div>` : ''}
    </div>`;
}

function renderSide(E) {
  const d = E.doc;
  const isOffer = d.type === 'angebot';
  const isInvoice = INVOICE_TYPES.includes(d.type);
  const parts = [`<div class="card"><div class="card-head"><h2>Summe</h2></div><div class="card-body" id="totals"></div></div>`];

  // Nächste Schritte
  const steps = [];
  if (!d.id) steps.push(`<div class="small muted">Speichern Sie den Beleg, um PDF und E-Mail-Versand zu nutzen.</div>`);
  else if (isOffer && d.status !== 'abgerechnet' && d.status !== 'abgelehnt') {
    steps.push(`<button class="btn block primary" data-step="mail">${icon('send')} Angebot versenden</button>`);
    steps.push(`<button class="btn block" data-step="rechnung">${icon('invoice')} In Rechnung umwandeln</button>`);
    steps.push(`<div class="btn-row"><button class="btn sm" style="flex:1" data-step="abschlag">Abschlag</button><button class="btn sm" style="flex:1" data-step="schluss">Schlussrechnung</button></div>`);
    if (d.status !== 'angenommen') steps.push(`<div class="btn-row"><button class="btn sm success" style="flex:1" data-step="angenommen">${icon('check')} Angenommen</button><button class="btn sm danger" style="flex:1" data-step="abgelehnt">${icon('x')} Abgelehnt</button></div>`);
  } else if (isInvoice && !d.locked) {
    steps.push(`<button class="btn block primary" data-step="mail">${icon('send')} Festschreiben &amp; senden</button>`);
    steps.push(`<button class="btn block" data-step="finalize">${icon('lock')} Nur festschreiben</button>`);
  } else if (isInvoice && d.status !== 'storniert' && d.open > 0) {
    steps.push(`<button class="btn block primary" data-step="payment">${icon('euro')} Zahlung erfassen</button>`);
    if (d.due_date && d.due_date < today()) steps.push(`<button class="btn block accent" data-step="reminder">${icon('bell')} ${d.reminders.length ? `${d.reminders.length + 1}. Mahnstufe erstellen` : 'Zahlungserinnerung erstellen'}</button>`);
  }
  if (steps.length) parts.push(`<div class="card"><div class="card-head"><h2>Nächste Schritte</h2></div><div class="card-body" style="display:grid;gap:8px">${steps.join('')}</div></div>`);

  // Zahlungen
  if (isInvoice && d.locked && d.type !== 'storno') {
    const pct = d.totals.payable ? Math.round((d.paid / d.totals.payable) * 100) : 0;
    parts.push(`<div class="card"><div class="card-head"><h2>Zahlungen</h2>${d.status !== 'storniert' ? `<button class="btn sm" data-step="payment">${icon('plus')}</button>` : ''}</div>
      <div class="card-body">
        <div class="totals"><div class="row"><span>Bezahlt</span><span>${money(d.paid)} von ${money(d.totals.payable)}</span></div>
        <div class="meter"><i style="width:${Math.min(100, pct)}%"></i></div>
        <div class="row" style="margin-top:4px"><span><b>Offen</b></span><span><b style="color:${d.open > 0 ? 'var(--danger)' : 'var(--ok)'}">${money(Math.max(0, d.open))}</b></span></div></div>
        ${d.payments.length ? `<ul class="timeline" style="margin-top:12px">${d.payments.map((p) => `<li><span class="dot" style="background:var(--ok)"></span><div style="flex:1">${money(p.amount)} · ${esc(p.method)}<div class="small muted">${date(p.date)}${p.note ? ` · ${esc(p.note)}` : ''}</div></div><button class="btn ghost sm icon" data-delpay="${p.id}" title="Löschen">${icon('trash')}</button></li>`).join('')}</ul>` : ''}
      </div></div>`);
  }

  // Mahnungen
  if (d.reminders?.length) {
    const titles = state.settings?.dunning?.titles || [];
    parts.push(`<div class="card"><div class="card-head"><h2>Mahnwesen</h2></div><div class="card-body"><ul class="timeline">${d.reminders.map((r, idx) => `
      <li><span class="dot" style="background:var(--accent)"></span><div style="flex:1"><b>${esc(titles[r.level - 1] || `Stufe ${r.level}`)}</b><div class="small muted">${date(r.date)} · Frist ${date(r.due_date)}${r.fee ? ` · Gebühr ${money(r.fee)}` : ''}${r.sent_at ? ' · versendet' : ''}</div>
      <div class="btn-row" style="margin-top:6px"><button class="btn sm" data-rpdf="${r.id}">${icon('pdf')} PDF</button><button class="btn sm" data-rmail="${r.id}">${icon('mail')} Senden</button>${idx === d.reminders.length - 1 ? `<button class="btn sm ghost icon" data-rdel="${r.id}" title="Löschen">${icon('trash')}</button>` : ''}</div></div></li>`).join('')}</ul></div></div>`);
  }

  // Verknüpfungen
  const links = [];
  if (d.source) links.push(`<li><span class="dot"></span><div>Erstellt aus <a href="#/beleg/${d.source.id}">${esc(TYPE[d.source.type])} ${esc(d.source.number || '')}</a></div></li>`);
  if (d.ref) links.push(`<li><span class="dot"></span><div>Storno zu <a href="#/beleg/${d.ref.id}">${esc(TYPE[d.ref.type])} ${esc(d.ref.number)}</a></div></li>`);
  for (const c of d.children || []) links.push(`<li><span class="dot"></span><div><a href="#/beleg/${c.id}">${esc(TYPE[c.type])} ${esc(c.number || '(Entwurf)')}</a><div class="small muted">${date(c.date)} · ${money(c.gross)} · ${esc(c.status)}</div></div></li>`);
  if (links.length) parts.push(`<div class="card"><div class="card-head"><h2>Verknüpfte Belege</h2></div><div class="card-body"><ul class="timeline">${links.join('')}</ul></div></div>`);

  // XRechnung-Prüfung
  if (isInvoice && d.xrechnung_issues?.length && d.locked) {
    parts.push(`<div class="alert warn">${icon('xml')}<div><b>Hinweise zur E-Rechnung</b><ul>${d.xrechnung_issues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`);
  }

  // Verlauf
  if (d.emails?.length || d.id) {
    const hist = [];
    for (const m of d.emails || []) hist.push(`<li><span class="dot" style="background:${m.status === 'gesendet' ? 'var(--ok)' : 'var(--danger)'}"></span><div><b style="font-weight:550">E-Mail an ${esc(m.to_addr)}</b><div class="small muted">${dateTime(m.created_at)} · ${m.status === 'gesendet' ? 'gesendet' : `Fehler: ${esc(m.error)}`}</div></div></li>`);
    if (d.finalized_at) hist.push(`<li><span class="dot"></span><div>Festgeschrieben<div class="small muted">${dateTime(d.finalized_at)}</div></div></li>`);
    if (d.created_at) hist.push(`<li><span class="dot"></span><div>Erstellt<div class="small muted">${dateTime(d.created_at)}</div></div></li>`);
    parts.push(`<div class="card"><div class="card-head"><h2>Verlauf</h2></div><div class="card-body"><ul class="timeline">${hist.join('')}</ul></div></div>`);
  }

  E.$('#side').innerHTML = parts.join('');
  renderTotalsCard(E);
}

function bindHeader(E) {
  if (E.locked) return;
  const on = () => {
    markDirty(E);
    renderTotalsCard(E);
  };
  E.view.querySelectorAll('#head [name], #texts [name]').forEach((el) => {
    el.addEventListener('input', on);
    el.addEventListener('change', on);
  });
  E.view.querySelectorAll('#texts textarea').forEach((t) => {
    autoGrow(t);
    t.addEventListener('input', () => autoGrow(t));
  });
}

/* ================================================================== */
/* Aktionen                                                            */
/* ================================================================== */
function payload(E) {
  const h = headerValues(E);
  return {
    ...h,
    type: E.doc.type,
    customer_id: E.doc.customer_id || null,
    items: E.items.map(({ id, document_id, posnr, total, titleSum, ...rest }) => rest),
  };
}

async function save(E, { silent = false } = {}) {
  if (E.locked) return E.doc.id;
  const body = payload(E);
  if (E.doc.type !== 'angebot' && !body.customer_id && !silent) toast('Hinweis: Noch kein Kunde ausgewählt.');
  if (!E.doc.id) {
    const { id } = await POST('/documents', body);
    guard.dirty = false;
    history.replaceState(null, '', `#/beleg/${id}`);
    const doc = await GET(`/documents/${id}`);
    render(E.view, doc);
    if (!silent) ok(`${doc.label} ${doc.number || ''} gespeichert.`);
    return id;
  }
  await PUT(`/documents/${E.doc.id}`, body);
  guard.dirty = false;
  const y = window.scrollY;
  const doc = await GET(`/documents/${E.doc.id}`);
  render(E.view, doc);
  window.scrollTo(0, y);
  if (!silent) ok('Gespeichert.');
  return E.doc.id;
}

async function saveIfDirty(E) {
  if (guard.dirty || !E.doc.id) return save(E, { silent: true });
  return E.doc.id;
}

async function reload(E) {
  const y = window.scrollY;
  render(E.view, await GET(`/documents/${E.doc.id}`));
  window.scrollTo(0, y);
}

function bindActions(E) {
  const d = E.doc;
  const isOffer = d.type === 'angebot';
  const isInvoice = INVOICE_TYPES.includes(d.type);

  E.$('#save')?.addEventListener('click', (e) => attempt(() => save(E), e.currentTarget));
  E.view.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      attempt(() => save(E));
    }
  });
  E.$('#pdf').addEventListener('click', () => attempt(async () => {
    const id = await saveIfDirty(E);
    openPdf(`/api/documents/${id}/pdf`);
  }));
  E.$('#mail').addEventListener('click', () => attempt(() => mailDialog(E)));

  E.$('#more').addEventListener('click', (ev) => {
    const items = [
      { label: 'PDF herunterladen', icon: 'download', action: () => (location.href = `/api/documents/${d.id}/pdf?download=1`) },
      ...(isInvoice && d.locked ? [{ label: 'XRechnung (XML) herunterladen', icon: 'xml', action: () => (location.href = `/api/documents/${d.id}/xml`) }] : []),
      { label: 'Duplizieren', icon: 'copy', action: () => derive(E, 'duplikat') },
      '-',
    ];
    if (isOffer) {
      items.push(
        { label: 'In Rechnung umwandeln', icon: 'invoice', action: () => derive(E, 'rechnung') },
        { label: 'Abschlagsrechnung erstellen', icon: 'percent', action: () => abschlagDialog(E) },
        { label: 'Schlussrechnung erstellen', icon: 'layers', action: () => derive(E, 'schluss') },
        '-',
        { label: 'Als versendet markieren', icon: 'send', action: () => setStatus(E, 'versendet') },
        { label: 'Als angenommen markieren', icon: 'check', action: () => setStatus(E, 'angenommen') },
        { label: 'Als abgelehnt markieren', icon: 'x', action: () => setStatus(E, 'abgelehnt') },
        '-',
        { label: 'Angebot löschen', icon: 'trash', danger: true, action: () => remove(E) },
      );
    } else if (!d.locked) {
      items.push(
        { label: 'Festschreiben (Nummer vergeben)', icon: 'lock', action: () => finalize(E) },
        '-',
        { label: 'Entwurf löschen', icon: 'trash', danger: true, action: () => remove(E) },
      );
    } else {
      if (d.type !== 'storno' && d.status !== 'storniert') {
        items.push(
          { label: 'Zahlung erfassen', icon: 'euro', action: () => paymentDialog(E), disabled: d.open <= 0 },
          { label: 'Mahnung erstellen', icon: 'bell', action: () => createReminder(E), disabled: d.open <= 0 },
          { label: 'Als versendet markieren (z. B. Post)', icon: 'send', action: () => attempt(async () => { await POST(`/documents/${d.id}/mark-sent`); ok('Als versendet markiert.'); reload(E); }) },
          '-',
          { label: 'Rechnung stornieren', icon: 'ban', danger: true, action: () => cancel(E) },
        );
      }
    }
    dropdown(ev.currentTarget, items);
  });

  E.$('#side').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = b.dataset.step;
    if (s === 'mail') return attempt(() => mailDialog(E));
    if (s === 'rechnung' || s === 'schluss') return derive(E, s);
    if (s === 'abschlag') return abschlagDialog(E);
    if (s === 'angenommen' || s === 'abgelehnt') return setStatus(E, s);
    if (s === 'finalize') return finalize(E);
    if (s === 'payment') return paymentDialog(E);
    if (s === 'reminder') return createReminder(E);
    if (b.dataset.delpay) return attempt(async () => {
      if (!(await confirmDialog('Diese Zahlung wirklich löschen?', { danger: true, okText: 'Löschen' }))) return;
      await DEL(`/documents/${d.id}/payments/${b.dataset.delpay}`);
      reload(E);
    });
    if (b.dataset.rpdf) return openPdf(`/api/documents/${d.id}/reminders/${b.dataset.rpdf}/pdf`);
    if (b.dataset.rmail) return attempt(() => mailDialog(E, Number(b.dataset.rmail)));
    if (b.dataset.rdel) return attempt(async () => {
      if (!(await confirmDialog('Diese Mahnstufe löschen?', { danger: true, okText: 'Löschen' }))) return;
      await DEL(`/documents/${d.id}/reminders/${b.dataset.rdel}`);
      reload(E);
    });
  });
}

async function derive(E, target, extra = {}) {
  await attempt(async () => {
    await saveIfDirty(E);
    const labels = { rechnung: 'Rechnung', schluss: 'Schlussrechnung', duplikat: 'Kopie', abschlag: 'Abschlagsrechnung' };
    if (target === 'schluss' && !(E.doc.children || []).some((c) => c.type === 'abschlag' && c.finalized_at)) {
      if (!(await confirmDialog('Zu diesem Angebot gibt es noch keine festgeschriebenen Abschlagsrechnungen. Trotzdem eine Schlussrechnung erstellen? (Sonst besser „In Rechnung umwandeln“.)'))) return;
    }
    const { id } = await POST(`/documents/${E.doc.id}/derive`, { target, ...extra });
    guard.dirty = false;
    ok(`${labels[target]} erstellt – bitte prüfen und festschreiben.`);
    navigate(`#/beleg/${id}`);
  });
}

async function abschlagDialog(E) {
  const net = currentTotals(E).net;
  const prev = (E.doc.children || []).filter((c) => c.type === 'abschlag' && c.status !== 'storniert');
  const data = await formDialog({
    title: 'Abschlagsrechnung erstellen',
    okText: 'Erstellen',
    body: `
      <div class="alert" style="margin-bottom:14px">${icon('bell')}<div>Angebotssumme netto: <b>${money(net)}</b>${prev.length ? `<br>Bisherige Abschläge: ${prev.map((p) => `${esc(p.number || 'Entwurf')} (${money(p.gross)} brutto)`).join(', ')}` : ''}</div></div>
      <div class="form-grid">
        <div class="c12 btn-row"><label class="check"><input type="radio" name="mode" value="percent" checked> Prozent der Angebotssumme</label><label class="check"><input type="radio" name="mode" value="amount"> Fester Betrag (netto)</label></div>
        ${field('Prozentsatz', `<div class="input-suffix">${input('percent', '30')}<span>%</span></div>`, 'c6')}
        ${field('Betrag netto', `<div class="input-suffix">${input('amount', '')}<span>€</span></div>`, 'c6')}
        ${field('Leistungsstand (optional)', input('description', '', 'placeholder="z. B. Rohbau Erdgeschoss fertiggestellt"'), 'c12')}
      </div>`,
  });
  if (!data) return;
  derive(E, 'abschlag', { mode: data.mode, percent: C.parseNumber(data.percent), amount: C.parseMoney(data.amount), description: data.description });
}

async function setStatus(E, status) {
  await attempt(async () => {
    await saveIfDirty(E);
    await POST(`/documents/${E.doc.id}/status`, { status });
    ok('Status aktualisiert.');
    reload(E);
  });
}

async function finalize(E) {
  if (!(await confirmDialog('Die Rechnung erhält jetzt ihre fortlaufende Rechnungsnummer und kann danach nicht mehr geändert werden (GoBD).\n\nKorrekturen sind anschließend nur noch per Storno möglich.', { title: 'Rechnung festschreiben?', okText: 'Festschreiben' }))) return;
  await attempt(async () => {
    await saveIfDirty(E);
    await POST(`/documents/${E.doc.id}/finalize`);
    guard.dirty = false;
    ok('Rechnung festgeschrieben.');
    reload(E);
  });
}

async function cancel(E) {
  if (!(await confirmDialog(`Zur Rechnung ${E.doc.number} wird eine Stornorechnung mit eigener Nummer erzeugt. Die Original-Rechnung bleibt archiviert.`, { title: 'Rechnung stornieren?', okText: 'Stornieren', danger: true }))) return;
  await attempt(async () => {
    const { id } = await POST(`/documents/${E.doc.id}/cancel`);
    ok('Stornorechnung erstellt.');
    navigate(`#/beleg/${id}`);
  });
}

async function remove(E) {
  if (!(await confirmDialog('Diesen Beleg endgültig löschen?', { danger: true, okText: 'Löschen' }))) return;
  await attempt(async () => {
    await DEL(`/documents/${E.doc.id}`);
    guard.dirty = false;
    ok('Gelöscht.');
    navigate(E.doc.type === 'angebot' ? '#/angebote' : '#/rechnungen');
  });
}

async function paymentDialog(E) {
  const data = await formDialog({
    title: `Zahlung zu ${E.doc.number}`,
    okText: 'Zahlung buchen',
    body: `<div class="form-grid">
      ${field('Betrag', `<div class="input-suffix">${input('amount', moneyIn(Math.max(0, E.doc.open)), 'autofocus')}<span>€</span></div>`, 'c6', `offen: ${money(E.doc.open)}`)}
      ${field('Datum', input('date', today(), 'type="date"'), 'c6')}
      ${field('Zahlungsart', select('method', { 'Überweisung': 'Überweisung', Bar: 'Bar', 'EC-Karte': 'EC-Karte', Skonto: 'Skontoabzug', Verrechnung: 'Verrechnung', Sonstiges: 'Sonstiges' }, 'Überweisung'), 'c6')}
      ${field('Notiz', input('note', ''), 'c6')}
    </div>`,
    validate: (d) => (!C.parseMoney(d.amount) ? 'Bitte einen Betrag angeben.' : null),
  });
  if (!data) return;
  await attempt(async () => {
    await POST(`/documents/${E.doc.id}/payments`, { ...data, amount: C.parseMoney(data.amount) });
    ok('Zahlung gebucht.');
    reload(E);
  });
}

async function createReminder(E) {
  const titles = state.settings?.dunning?.titles || [];
  const level = (E.doc.reminders?.length || 0) + 1;
  if (!(await confirmDialog(`${titles[level - 1] || `Mahnstufe ${level}`} für Rechnung ${E.doc.number} erstellen?\nOffener Betrag: ${money(E.doc.open)}`, { okText: 'Erstellen' }))) return;
  await attempt(async () => {
    const r = await POST(`/documents/${E.doc.id}/reminders`);
    E.doc = r.doc;
    ok('Mahnung erstellt.');
    await mailDialog(E, r.id);
    reload(E);
  });
}

/* ---------------- E-Mail ---------------- */
async function mailDialog(E, reminderId) {
  const id = await saveIfDirty(E);
  const base = reminderId ? `/documents/${id}/reminders/${reminderId}` : `/documents/${id}`;
  const draft = await GET(`${base}/mail-draft`);
  const doc = E.doc.id === id ? E.doc : await GET(`/documents/${id}`);
  const isInvoiceDraft = !reminderId && INVOICE_TYPES.includes(doc.type) && !doc.locked;
  const business = ['gewerblich', 'oeffentlich'].includes(doc.customer?.type);
  const sent = await modal({
    title: reminderId ? 'Mahnung per E-Mail senden' : `${doc.label} per E-Mail senden`,
    size: 'wide',
    body: `
      ${isInvoiceDraft ? `<div class="alert warn" style="margin-bottom:14px">${icon('lock')}<div>Beim Versand wird die Rechnung <b>festgeschrieben</b> und erhält ihre fortlaufende Nummer. Das Wort „Entwurf“ in Betreff und Text wird dabei automatisch durch die Rechnungsnummer ersetzt.</div></div>` : ''}
      ${!state.settings?.mail?.user ? `<div class="alert danger" style="margin-bottom:14px">${icon('alert')}<div>Der E-Mail-Versand ist noch nicht eingerichtet. <a href="#/einstellungen/email">Jetzt einrichten</a></div></div>` : ''}
      <form class="form-grid" id="mf">
        ${field('An', input('to', draft.to, 'type="email" multiple required placeholder="kunde@example.de"'), 'c6')}
        ${field('CC', input('cc', draft.cc, 'placeholder="optional"'), 'c6')}
        ${field('Betreff', input('subject', draft.subject), 'c12')}
        ${field('Nachricht', textarea('body', draft.body, 'rows="13"'), 'c12')}
        <div class="c12" style="display:flex;gap:18px;flex-wrap:wrap;align-items:center">
          <span class="small muted">Anhänge:</span>
          <label class="check"><input type="checkbox" name="attach_pdf" checked ${reminderId ? 'disabled' : ''}> ${icon('pdf')} ${esc(draft.pdf_name)}</label>
          ${draft.can_xml ? `<label class="check"><input type="checkbox" name="attach_xml" ${business ? 'checked' : ''}> ${icon('xml')} XRechnung (E-Rechnung, XML)</label>` : ''}
          ${reminderId ? `<label class="check"><input type="checkbox" name="attach_invoice"> Rechnungskopie beifügen</label>` : ''}
        </div>
      </form>`,
    foot: `<button class="btn left" id="mprev">${icon('pdf')} Vorschau</button><button class="btn" data-close>Abbrechen</button><button class="btn primary" id="msend">${icon('send')} Jetzt senden</button>`,
    onOpen: (m, close) => {
      m.querySelector('#mprev').addEventListener('click', () => openPdf(`/api${base}/pdf`));
      m.querySelector('#msend').addEventListener('click', async (e) => {
        const f = m.querySelector('#mf');
        const body = {
          to: f.to.value, cc: f.cc.value, subject: f.subject.value, body: f.body.value,
          attach_pdf: true, attach_xml: !!f.attach_xml?.checked, attach_invoice: !!f.attach_invoice?.checked,
        };
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = `${icon('refresh')} Wird gesendet …`;
        try {
          await POST(`${base}/send`, body);
          close(true);
        } catch (err) {
          fail(err);
          btn.disabled = false;
          btn.innerHTML = `${icon('send')} Jetzt senden`;
        }
      });
    },
  });
  if (sent) {
    ok('E-Mail wurde versendet.');
    guard.dirty = false;
    reload(E);
  }
}
