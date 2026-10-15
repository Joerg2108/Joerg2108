import {
  esc, icon, GET, POST, PUT, DEL, money, moneyIn, qty, ok, attempt, formDialog, field, input, textarea, select,
  checkbox, confirmDialog, debounce, emptyState, C, UNITS, fail, state,
} from '../core.js';
import { importDialog } from './customers.js';

/* ---------------- Dialog ---------------- */
export async function articleDialog(a = {}, forceNew = false) {
  const isNew = forceNew || !a.id;
  const cats = await GET('/articles/categories');
  const data = await formDialog({
    title: isNew ? 'Neue Leistung' : `Leistung bearbeiten`,
    size: 'wide',
    okText: isNew ? 'Anlegen' : 'Speichern',
    body: `
      <div class="form-grid">
        ${field('Leistungs-Nr.', input('number', a.number, 'placeholder="z. B. 210"'), 'c3')}
        ${field('Kategorie / Gewerk', `${input('category', a.category, 'list="cats" placeholder="z. B. Maurerarbeiten"')}<datalist id="cats">${cats.map((c) => `<option value="${esc(c.category)}">`).join('')}</datalist>`, 'c5')}
        ${field('Einheit', `${input('unit', a.unit || 'm²', 'list="units2"')}<datalist id="units2">${UNITS.map((u) => `<option value="${u}">`).join('')}</datalist>`, 'c2')}
        ${field('MwSt', select('vat_rate', { 19: '19 %', 7: '7 %', 0: '0 %' }, a.vat_rate ?? 19), 'c2')}
        ${field('Bezeichnung (Kurztext)', input('name', a.name, 'required'), 'c12')}
        ${field('Leistungsbeschreibung (Langtext)', textarea('description', a.description, 'rows="5"'), 'c12', 'Erscheint im Angebot unter der Bezeichnung.')}
        ${field('Verkaufspreis netto', `<div class="input-suffix">${input('price', moneyIn(a.price || 0))}<span>€</span></div>`, 'c3')}
        ${field('Einkauf / Material netto', `<div class="input-suffix">${input('cost', moneyIn(a.cost || 0))}<span>€</span></div>`, 'c3', 'Für Margen-Kalkulation')}
        ${field('Lohnanteil', `<div class="input-suffix">${input('labor_percent', qty(a.labor_percent || 0))}<span>%</span></div>`, 'c3', 'für § 35a EStG')}
        <div class="c3"><div class="small muted" style="font-weight:600">Rohertrag je Einheit</div><div id="marg" style="font-size:18px;font-weight:700;margin-top:6px"></div></div>
        <div class="c12" style="display:flex;justify-content:space-between;align-items:center">${checkbox('active', a.active ?? 1, 'Aktiv (in der Auswahl sichtbar)')}
          ${!isNew ? `<button type="button" class="btn sm danger" id="adel">${icon('trash')} Leistung löschen</button>` : ''}</div>
      </div>`,
    validate: (d) => (!d.name.trim() ? 'Bitte eine Bezeichnung angeben.' : null),
    onOpen: (m, close) => {
      m.querySelector('#adel')?.addEventListener('click', async () => {
        if (!(await confirmDialog('Leistung aus dem Katalog löschen? Bestehende Belege bleiben unverändert.', { danger: true, okText: 'Löschen' }))) return;
        await attempt(async () => {
          await DEL(`/articles/${a.id}`);
          ok('Leistung gelöscht.');
          close({ __deleted: true });
        });
      });
      const upd = () => {
        const p = C.parseMoney(m.querySelector('[name=price]').value);
        const c = C.parseMoney(m.querySelector('[name=cost]').value);
        const el = m.querySelector('#marg');
        el.textContent = `${money(p - c)}${p ? ` · ${Math.round(((p - c) / p) * 100)} %` : ''}`;
        el.style.color = p - c < 0 ? 'var(--danger)' : 'var(--ok)';
      };
      m.querySelectorAll('[name=price],[name=cost]').forEach((e) => e.addEventListener('input', upd));
      upd();
    },
  });
  if (!data) return null;
  if (data.__deleted) return 'deleted';
  const body = { ...data, price: C.parseMoney(data.price), cost: C.parseMoney(data.cost), labor_percent: C.parseNumber(data.labor_percent), vat_rate: Number(data.vat_rate) };
  try {
    if (isNew) {
      const r = await POST('/articles', body);
      ok('Leistung angelegt.');
      return r.id;
    }
    await PUT(`/articles/${a.id}`, body);
    ok('Leistung gespeichert.');
    return a.id;
  } catch (e) {
    fail(e);
    return null;
  }
}

/* ---------------- Liste ---------------- */
const prefs = { q: '', cat: '', all: false };

export async function articleListView(params, view) {
  const admin = state.user?.role === 'admin';
  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div class="titles"><h1>Leistungskatalog</h1><p>Leistungen mit Kurz- und Langtext, Preisen, Einkauf und Lohnanteil – die Basis für Angebote und Rechnungen.</p></div>
      ${admin ? `<button class="btn" id="adj">${icon('percent')} Preisanpassung</button>` : ''}
      <button class="btn" id="imp">${icon('upload')} Import</button>
      <a class="btn" href="/api/articles/export.csv">${icon('download')} Export</a>
      <button class="btn primary" id="new">${icon('plus')} Neue Leistung</button>
    </div>
    <div class="grid" style="grid-template-columns:230px 1fr;align-items:start">
      <div class="card" style="padding:8px"><div class="cat-list" id="cats"></div></div>
      <div>
        <div class="toolbar">
          <div class="search-box">${icon('search')}<input id="q" placeholder="Leistung suchen …" value="${esc(prefs.q)}"></div>
          <label class="check"><input type="checkbox" id="all" ${prefs.all ? 'checked' : ''}> Inaktive anzeigen</label>
          <div style="flex:1"></div><span class="muted small" id="count"></span>
        </div>
        <div class="card"><div class="table-wrap" id="list"></div></div>
      </div>
    </div>
  </div>`;

  const load = async () => {
    const rows = await GET(`/articles?${prefs.all ? 'all=1&' : ''}q=${encodeURIComponent(prefs.q)}`);
    const cats = [...new Set(rows.map((r) => r.category || 'Ohne Kategorie'))];
    view.querySelector('#cats').innerHTML = [['', 'Alle Gewerke', rows.length], ...cats.map((c) => [c, c, rows.filter((r) => (r.category || 'Ohne Kategorie') === c).length])]
      .map(([k, l, n]) => `<button data-cat="${esc(k)}" class="${prefs.cat === k ? 'active' : ''}"><span>${esc(l)}</span><span class="muted">${n}</span></button>`).join('');
    const list = prefs.cat ? rows.filter((r) => (r.category || 'Ohne Kategorie') === prefs.cat) : rows;
    view.querySelector('#count').textContent = `${list.length} Leistung(en)`;
    if (!list.length) {
      view.querySelector('#list').innerHTML = emptyState('Keine Leistungen gefunden.', 'catalog');
      return;
    }
    let lastCat = null;
    const body = list.map((r) => {
      const cat = r.category || 'Ohne Kategorie';
      const head = cat !== lastCat && !prefs.cat ? `<tr><td colspan="7" style="background:var(--brand-50);color:var(--brand-700);font-weight:700;font-size:12.5px;text-transform:uppercase;letter-spacing:.06em">${esc(cat)}</td></tr>` : '';
      lastCat = cat;
      const m = r.price - r.cost;
      const mp = r.price ? Math.round((m / r.price) * 100) : 0;
      return `${head}<tr class="click" data-id="${r.id}" style="${r.active ? '' : 'opacity:.5'}">
        <td class="mono">${esc(r.number)}</td>
        <td><b>${esc(r.name)}</b><div class="sub" style="max-width:560px">${esc(r.description.slice(0, 140))}${r.description.length > 140 ? '…' : ''}</div></td>
        <td>${esc(r.unit)}</td>
        <td class="num"><b>${money(r.price)}</b></td>
        <td class="num">${r.cost ? money(r.cost) : '–'}<div class="sub" style="color:${mp < 20 ? 'var(--warn)' : 'var(--ok)'}">${r.cost ? `${mp} % Marge` : ''}</div></td>
        <td class="num">${qty(r.labor_percent)} %</td>
        <td class="num"><span class="muted small" title="In Belegen verwendet">${r.usage}×</span></td>
      </tr>`;
    }).join('');
    view.querySelector('#list').innerHTML = `<table class="table"><thead><tr><th>Nr.</th><th>Leistung</th><th>Einheit</th><th class="num">VK netto</th><th class="num">EK netto</th><th class="num">Lohn</th><th class="num">Nutzung</th></tr></thead><tbody>${body}</tbody></table>`;
  };

  view.querySelector('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    prefs.cat = b.dataset.cat;
    load();
  });
  view.querySelector('#q').addEventListener('input', debounce((e) => { prefs.q = e.target.value.trim(); load(); }, 200));
  view.querySelector('#all').addEventListener('change', (e) => { prefs.all = e.target.checked; load(); });
  view.querySelector('#list').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const rows = await GET(`/articles?all=1`);
    const a = rows.find((r) => r.id === Number(tr.dataset.id));
    await editWithDelete(a, load);
  });
  view.querySelector('#new').addEventListener('click', async () => {
    if (await articleDialog({ category: prefs.cat || '' })) load();
  });
  view.querySelector('#imp').addEventListener('click', () => importDialog('/articles/import', 'Leistungskatalog importieren',
    'CSV mit Semikolon: <code>Nummer;Kategorie;Bezeichnung;Beschreibung;Einheit;VK netto;EK netto;Lohnanteil %;MwSt %;Aktiv</code>. Vorhandene Nummern werden aktualisiert. Tipp: zuerst exportieren, in Excel bearbeiten, wieder importieren.', load));
  view.querySelector('#adj')?.addEventListener('click', () => adjustDialog(load));
  await load();
}

async function editWithDelete(a, after) {
  if (await articleDialog(a)) after();
}

async function adjustDialog(after) {
  const cats = await GET('/articles/categories');
  const data = await formDialog({
    title: 'Preisanpassung',
    okText: 'Preise anpassen',
    body: `
      <div class="alert warn" style="margin-bottom:14px">${icon('alert')}<div>Ändert die Verkaufspreise im Katalog. Bestehende Angebote und Rechnungen bleiben unverändert. Vorher wird automatisch eine Datensicherung empfohlen.</div></div>
      <div class="form-grid">
        ${field('Änderung', `<div class="input-suffix">${input('percent', '3', 'autofocus')}<span>%</span></div>`, 'c4', 'negativ = Preissenkung')}
        ${field('Gewerk', select('category', { '': 'Alle Gewerke', ...Object.fromEntries(cats.map((c) => [c.category, c.category])) }, ''), 'c5')}
        ${field('Runden auf', select('round_to', { 1: '1 Cent', 10: '10 Cent', 50: '50 Cent', 100: '1 Euro' }, '10'), 'c3')}
      </div>`,
  });
  if (!data) return;
  if (!(await confirmDialog(`Verkaufspreise ${data.category ? `im Gewerk „${data.category}“` : 'aller Leistungen'} um ${data.percent} % anpassen?`, { okText: 'Anpassen' }))) return;
  await attempt(async () => {
    await POST('/backups');
    const r = await POST('/articles/adjust-prices', { percent: C.parseNumber(data.percent), category: data.category, round_to: Number(data.round_to) });
    ok(`${r.updated} Preise angepasst (Sicherung wurde erstellt).`);
    after();
  });
}
