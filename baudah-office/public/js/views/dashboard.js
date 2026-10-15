import { esc, icon, GET, POST, money, date, statusBadge, state, emptyState, dateTime, attempt, ok, confirmDialog } from '../core.js';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function barChart(months) {
  const W = 760;
  const H = 240;
  const pad = { l: 56, r: 10, t: 14, b: 26 };
  const max = Math.max(1, ...months.map((m) => Math.max(m.invoiced, m.offers, m.paid)));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const cw = (W - pad.l - pad.r) / 12;
  const bw = Math.min(16, cw / 4);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const grid = [];
  for (let v = 0; v <= top; v += step) {
    grid.push(`<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e8ef"/>`);
    grid.push(`<text x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${(v / 100).toLocaleString('de-DE', { notation: 'compact', maximumFractionDigits: 1 })} €</text>`);
  }
  const bars = months.map((m, i) => {
    const x = pad.l + i * cw + cw / 2;
    const bar = (v, dx, color, label) =>
      v > 0
        ? `<rect x="${x + dx - bw / 2}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="3" fill="${color}"><title>${label} ${MONTHS[i]}: ${money(v)}</title></rect>`
        : '';
    return (
      bar(m.offers, -bw - 2, '#c9d7ee', 'Angebote') +
      bar(m.invoiced, 0, 'var(--brand)', 'Berechnet') +
      bar(m.paid, bw + 2, 'var(--ok)', 'Zahlungseingang') +
      `<text x="${x}" y="${H - 8}" text-anchor="middle">${MONTHS[i]}</text>`
    );
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid.join('')}${bars.join('')}</svg>`;
}

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const docRow = (d, right) => `
  <li class="click" data-href="#/beleg/${d.id}">
    <div class="grow"><b>${esc(d.customer_name || '—')}</b><span class="muted small">${esc(d.label)} ${esc(d.number || 'Entwurf')} · ${esc(d.project || d.subject || '')}</span></div>
    ${right}
  </li>`;

export async function dashboardView(params, view, year) {
  const d = await GET(`/dashboard${year ? `?year=${year}` : ''}`);
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const years = [...new Set([new Date().getFullYear(), ...d.years])].sort((a, b) => b - a);
  const cfgWarn = [];
  const c = state.settings?.company || {};
  if (!c.tax_number && !c.vat_id) cfgWarn.push('Steuernummer / USt-IdNr.');
  if (!c.iban) cfgWarn.push('Bankverbindung (IBAN)');
  if (!state.settings?.mail?.user) cfgWarn.push('E-Mail-Zugang (SMTP)');

  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div class="titles"><h1>${greet}, ${esc((state.user.name || '').split(' ')[0] || state.user.username)}</h1>
        <p>${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <select id="year" style="width:auto">${years.map((y) => `<option ${y === d.year ? 'selected' : ''}>${y}</option>`).join('')}</select>
      <a class="btn" href="#/neu/rechnung">${icon('invoice')} Rechnung</a>
      <a class="btn primary" href="#/neu/angebot">${icon('plus')} Neues Angebot</a>
    </div>

    ${d.empty ? `
    <div class="card" style="margin-bottom:16px;overflow:hidden">
      <div class="card-body" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:linear-gradient(120deg,var(--brand-50),#fff 70%)">
        <div style="flex:1;min-width:280px">
          <h2 style="font-size:19px">Willkommen bei BauDaH Office 👷</h2>
          <p class="muted" style="margin:6px 0 0">Das System ist noch leer. Laden Sie Beispieldaten, um alle Funktionen auszuprobieren – oder legen Sie direkt Ihren ersten Kunden an. Die Demo-Daten lassen sich später mit einem Klick wieder entfernen.</p>
        </div>
        <div class="btn-row">
          ${state.user.role === 'admin' ? `<button class="btn primary" id="demo">${icon('layers')} Demo-Daten laden</button>` : ''}
          <a class="btn" href="#/kunden">${icon('user')} Ersten Kunden anlegen</a>
        </div>
      </div>
    </div>` : ''}
    ${d.demo ? `<div class="alert" style="margin-bottom:16px">${icon('layers')}<div><b>Demo-Modus:</b> Es sind Beispieldaten geladen. Vor dem Echtbetrieb unter <a href="#/einstellungen/sicherung">Einstellungen → Datensicherung → Neustart</a> alles entfernen, damit die Rechnungsnummern bei 0001 beginnen.</div></div>` : ''}

    ${cfgWarn.length && !d.empty ? `<div class="alert warn" style="margin-bottom:16px">${icon('alert')}<div><b>Einrichtung unvollständig:</b> Bitte ergänzen Sie ${esc(cfgWarn.join(', '))} unter <a href="#/einstellungen/firma">Einstellungen</a> – sonst können Rechnungen nicht rechtssicher erstellt bzw. versendet werden.</div></div>` : ''}

    <div class="grid kpis">
      <div class="card kpi"><div class="ic">${icon('trend')}</div><div class="label">Umsatz ${d.year} (netto)</div><div class="value">${money(d.revenue.net)}</div><div class="hint">${money(d.revenue.gross)} brutto berechnet</div></div>
      <div class="card kpi"><div class="ic">${icon('euro')}</div><div class="label">Offene Forderungen</div><div class="value">${money(d.open.sum)}</div><div class="hint">${d.open.count} Rechnung(en) offen</div></div>
      <div class="card kpi ${d.overdue.count ? 'is-alert' : 'good'}"><div class="ic">${icon(d.overdue.count ? 'alert' : 'check')}</div><div class="label">Überfällig</div><div class="value">${money(d.overdue.sum)}</div><div class="hint">${d.overdue.count ? `${d.overdue.count} Rechnung(en) – Mahnung prüfen` : 'Alles im grünen Bereich'}</div></div>
      <div class="card kpi"><div class="ic">${icon('offer')}</div><div class="label">Offene Angebote</div><div class="value">${money(d.offers.pending_sum)}</div><div class="hint">${d.offers.pending_count} Angebot(e) · Auftragsquote ${d.offers.rate === null ? '–' : Math.round(d.offers.rate) + ' %'}</div></div>
    </div>

    <div class="grid" style="grid-template-columns: 2fr 1fr; margin-top:16px">
      <div class="card">
        <div class="card-head"><h2>Monatsübersicht ${d.year}</h2>
          <div class="legend"><span><i style="background:#c9d7ee"></i>Angebote</span><span><i style="background:var(--brand)"></i>Berechnet</span><span><i style="background:var(--ok)"></i>Zahlungseingang</span></div>
        </div>
        <div class="card-body">${barChart(d.months)}</div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Top-Kunden ${d.year}</h2></div>
        ${d.top_customers.length ? `<ul class="list">${d.top_customers.map((t, i) => `
          <li class="click" data-href="#/kunden/${t.id}"><div class="avatar" style="width:28px;height:28px;font-size:12px;background:${i ? '#7a8ab0' : 'var(--brand)'}">${i + 1}</div>
          <div class="grow"><b>${esc(t.name)}</b></div><span class="num">${money(t.revenue)}</span></li>`).join('')}</ul>` : emptyState('Noch keine Umsätze in diesem Jahr', 'users')}
      </div>
    </div>

    <div class="grid three" style="margin-top:16px">
      <div class="card">
        <div class="card-head"><h2>Überfällige Rechnungen</h2><a href="#/rechnungen" class="small">Alle</a></div>
        ${d.overdue.list.length ? `<ul class="list">${d.overdue.list.map((x) => docRow(x, `<div class="right"><div class="num" style="color:var(--danger);font-weight:650">${money(x.open)}</div><div class="small muted">fällig ${date(x.due_date)}${x.reminder_level ? ` · ${x.reminder_level}. Stufe` : ''}</div></div>`)).join('')}</ul>` : emptyState('Keine überfälligen Rechnungen', 'check')}
      </div>
      <div class="card">
        <div class="card-head"><h2>Angebote nachfassen</h2><a href="#/angebote" class="small">Alle</a></div>
        ${d.offers.followup.length ? `<ul class="list">${d.offers.followup.map((x) => docRow(x, `<div class="right"><div class="num">${money(x.net)}</div><div class="small muted">${x.valid_until ? `gültig bis ${date(x.valid_until)}` : date(x.date)}</div></div>`)).join('')}</ul>` : emptyState('Keine versendeten, offenen Angebote', 'offer')}
      </div>
      <div class="card">
        <div class="card-head"><h2>Letzte Aktivitäten</h2></div>
        ${d.activity.length ? `<ul class="list activity">${d.activity.map((a) => `
          <li ${a.entity === 'document' && a.entity_id ? `class="click" data-href="#/beleg/${a.entity_id}"` : a.entity === 'customer' && a.entity_id ? `class="click" data-href="#/kunden/${a.entity_id}"` : ''}><span class="dot"></span><div class="grow"><b style="font-weight:550">${esc(a.action)} ${esc(a.details)}</b><span class="small muted">${dateTime(a.created_at)}${a.user_name ? ` · ${esc(a.user_name)}` : ''}</span></div></li>`).join('')}</ul>` : emptyState('Noch keine Aktivitäten', 'clock')}
      </div>
    </div>

    ${d.drafts.length ? `
    <div class="card" style="margin-top:16px">
      <div class="card-head"><h2>Rechnungsentwürfe – noch nicht festgeschrieben</h2></div>
      <ul class="list">${d.drafts.map((x) => docRow(x, `<div class="num">${money(x.gross)}</div>${statusBadge('entwurf')}`)).join('')}</ul>
    </div>` : ''}
  </div>`;

  view.querySelector('#demo')?.addEventListener('click', (e) => attempt(async () => {
    if (!(await confirmDialog('Es werden 8 Beispielkunden sowie Angebote, Rechnungen, Zahlungen und eine Mahnung der letzten Monate angelegt.', { title: 'Demo-Daten laden?', okText: 'Laden' }))) return;
    const r = await POST('/demo/load');
    state.settings = await GET('/settings');
    ok(`Demo geladen: ${r.customers} Kunden, ${r.documents} Belege.`);
    dashboardView(params, view, year);
  }, e.currentTarget));
  view.querySelector('#year').addEventListener('change', (e) => dashboardView(params, view, e.target.value));
  view.querySelectorAll('[data-href]').forEach((li) => li.addEventListener('click', () => (location.hash = li.dataset.href)));
}
