import { esc, icon, GET, money, date, statusBadge, debounce, emptyState } from '../core.js';

const TABS = {
  angebote: [
    ['', 'Alle'], ['entwurf', 'Entwurf'], ['versendet', 'Versendet'], ['abgelaufen', 'Abgelaufen'],
    ['angenommen', 'Angenommen'], ['abgerechnet', 'Abgerechnet'], ['abgelehnt', 'Abgelehnt'],
  ],
  rechnungen: [
    ['', 'Alle'], ['entwurf', 'Entwurf'], ['offen', 'Offen'], ['ueberfaellig', 'Überfällig'],
    ['teilbezahlt', 'Teilbezahlt'], ['bezahlt', 'Bezahlt'], ['storniert', 'Storniert'],
  ],
};

const prefs = {};

export async function documentListView({ kind }, view) {
  const isOffer = kind === 'angebote';
  const p = (prefs[kind] ||= { status: '', q: '', year: '' });
  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div class="titles"><h1>${isOffer ? 'Angebote' : 'Rechnungen'}</h1>
        <p>${isOffer ? 'Angebote erstellen, versenden und per Klick in Rechnungen umwandeln.' : 'Rechnungen, Abschlags-, Schluss- und Stornorechnungen inkl. Zahlungseingang und Mahnwesen.'}</p></div>
      <a class="btn primary" href="#/neu/${isOffer ? 'angebot' : 'rechnung'}">${icon('plus')} ${isOffer ? 'Neues Angebot' : 'Neue Rechnung'}</a>
    </div>
    <div class="tabs" id="tabs"></div>
    <div class="toolbar">
      <div class="search-box">${icon('search')}<input id="q" placeholder="Nummer, Kunde, Bauvorhaben …" value="${esc(p.q)}"></div>
      <select id="year" style="width:auto"><option value="">Alle Jahre</option></select>
      <div style="flex:1"></div>
      <span class="muted small" id="count"></span>
    </div>
    <div class="card"><div class="table-wrap" id="list"></div></div>
  </div>`;

  let rows = [];
  const load = async () => {
    rows = await GET(`/documents?kind=${kind}${p.q ? `&q=${encodeURIComponent(p.q)}` : ''}${p.year ? `&year=${p.year}` : ''}`);
    const years = [...new Set(rows.map((r) => r.date.slice(0, 4)))];
    const ys = view.querySelector('#year');
    if (ys.options.length === 1) {
      const all = [...new Set([String(new Date().getFullYear()), ...years])].sort().reverse();
      ys.insertAdjacentHTML('beforeend', all.map((y) => `<option ${y === p.year ? 'selected' : ''}>${y}</option>`).join(''));
    }
    draw();
  };

  const draw = () => {
    const counts = {};
    for (const r of rows) {
      counts[r.display_status] = (counts[r.display_status] || 0) + 1;
      if (r.display_status !== r.status) counts[r.status] = (counts[r.status] || 0) + 1;
    }
    view.querySelector('#tabs').innerHTML = TABS[kind]
      .map(([k, l]) => `<button data-s="${k}" class="${p.status === k ? 'active' : ''}">${l}<span class="count">${k ? counts[k] || 0 : rows.length}</span></button>`)
      .join('');
    const list = p.status ? rows.filter((r) => r.display_status === p.status || r.status === p.status) : rows;
    view.querySelector('#count').textContent = `${list.length} ${isOffer ? 'Angebot(e)' : 'Beleg(e)'}`;
    if (!list.length) {
      view.querySelector('#list').innerHTML = emptyState(rows.length ? 'Keine Belege mit diesem Status' : isOffer ? 'Noch keine Angebote – legen Sie Ihr erstes Angebot an.' : 'Noch keine Rechnungen vorhanden.', isOffer ? 'offer' : 'invoice');
      return;
    }
    const sumNet = list.reduce((s, r) => s + (r.type === 'storno' || r.status === 'storniert' ? 0 : r.net - (r.prepaid_net || 0)), 0);
    const sumOpen = list.reduce((s, r) => s + Math.max(0, r.open), 0);
    view.querySelector('#list').innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Nummer</th><th>Kunde</th><th>Bauvorhaben / Betreff</th><th>Datum</th>
          <th>${isOffer ? 'Gültig bis' : 'Fällig'}</th><th class="num">Netto</th><th class="num">Brutto</th>
          ${isOffer ? '' : '<th class="num">Offen</th>'}<th>Status</th>
        </tr></thead>
        <tbody>${list.map((r) => `
          <tr class="click" data-id="${r.id}">
            <td><b>${esc(r.number || '—')}</b>${!isOffer && r.type !== 'rechnung' ? `<div class="sub">${esc(r.label)}</div>` : ''}</td>
            <td>${esc(r.customer_name || '—')}<div class="sub">${esc(r.customer_number || '')}</div></td>
            <td style="max-width:300px">${esc(r.project || r.subject || '')}${r.project && r.subject ? `<div class="sub">${esc(r.subject)}</div>` : ''}</td>
            <td class="nowrap">${date(r.date)}</td>
            <td class="nowrap">${date(isOffer ? r.valid_until : r.due_date)}</td>
            <td class="num">${money(r.net)}</td>
            <td class="num">${money(r.gross - (r.prepaid_gross || 0))}</td>
            ${isOffer ? '' : `<td class="num" style="${r.open > 0 && r.display_status === 'ueberfaellig' ? 'color:var(--danger);font-weight:650' : ''}">${r.open > 0 ? money(r.open) : '–'}</td>`}
            <td>${statusBadge(r.display_status)}${r.reminder_level ? ` <span class="badge plain" title="Mahnstufe">${icon('bell')} ${r.reminder_level}</span>` : ''}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr><td colspan="5">Summe${p.status ? ` (${esc(TABS[kind].find((t) => t[0] === p.status)?.[1] || '')})` : ''}</td>
          <td class="num">${money(sumNet)}</td><td></td>${isOffer ? '' : `<td class="num">${money(sumOpen)}</td>`}<td></td></tr></tfoot>
      </table>`;
  };

  view.querySelector('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    p.status = b.dataset.s;
    draw();
  });
  view.querySelector('#q').addEventListener('input', debounce((e) => { p.q = e.target.value.trim(); load(); }, 250));
  view.querySelector('#year').addEventListener('change', (e) => { p.year = e.target.value; load(); });
  view.querySelector('#list').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.hash = `#/beleg/${tr.dataset.id}`;
  });
  await load();
}
