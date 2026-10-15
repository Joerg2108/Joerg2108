import {
  esc, icon, GET, POST, PUT, DEL, money, date, statusBadge, ok, attempt, formDialog, field, input, textarea, select,
  checkbox, confirmDialog, debounce, emptyState, CUSTOMER_TYPE, initials, navigate, qty, C, modal, fail,
} from '../core.js';

/* ---------------- Dialog: Kunde anlegen / bearbeiten ---------------- */
export async function customerDialog(c = {}) {
  const isNew = !c.id;
  const data = await formDialog({
    title: isNew ? 'Neuer Kunde' : `Kunde ${c.number} bearbeiten`,
    size: 'wide',
    okText: isNew ? 'Kunde anlegen' : 'Speichern',
    body: `
      <div class="form-grid">
        ${field('Kundenart', select('type', { privat: 'Privatkunde', gewerblich: 'Gewerbekunde / Bauunternehmen', oeffentlich: 'Öffentlicher Auftraggeber' }, c.type || 'privat'), 'c4')}
        ${field('Anrede', select('salutation', { '': '–', Herr: 'Herr', Frau: 'Frau', Familie: 'Familie', Firma: 'Firma' }, c.salutation ?? 'Herr'), 'c2')}
        ${field('Titel', input('title', c.title, 'placeholder="Dr."'), 'c2')}
        ${field('Vorname', input('first_name', c.first_name), 'c4')}
        ${field('Nachname', input('last_name', c.last_name), 'c6')}
        ${field('Firma', input('company', c.company, 'placeholder="nur bei Firmenkunden"'), 'c6')}
        ${field('Ansprechpartner', input('contact_person', c.contact_person, 'placeholder="z. B. Herr Schulze"'), 'c6', 'Erscheint als „z. Hd.“ und in der Briefanrede')}
        ${field('Adresszusatz', input('address_extra', c.address_extra), 'c6')}
        ${field('Straße, Hausnummer', input('street', c.street), 'c6')}
        ${field('PLZ', input('zip', c.zip, 'inputmode="numeric"'), 'c2')}
        ${field('Ort', input('city', c.city), 'c3')}
        ${field('Land', input('country', c.country || 'DE', 'maxlength="2"'), 'c1')}
        <div class="form-sep">Kontakt</div>
        ${field('E-Mail', input('email', c.email, 'type="email"'), 'c6', 'Für Angebots- und Rechnungsversand')}
        ${field('E-Mail (Kopie / Buchhaltung)', input('email_cc', c.email_cc), 'c6')}
        ${field('Telefon', input('phone', c.phone), 'c6')}
        ${field('Mobil', input('mobile', c.mobile), 'c6')}
        <div class="form-sep">Konditionen &amp; Steuer</div>
        ${field('Zahlungsziel', `<div class="input-suffix">${input('payment_days', c.payment_days ?? '', 'type="number" min="0" placeholder="Standard"')}<span>Tage</span></div>`, 'c3')}
        ${field('Kundenrabatt', `<div class="input-suffix">${input('discount', qty(c.discount || 0))}<span>%</span></div>`, 'c3')}
        ${field('USt-IdNr.', input('vat_id', c.vat_id, 'placeholder="DE123456789"'), 'c3')}
        ${field('Leitweg-ID', input('leitweg_id', c.leitweg_id, 'placeholder="nur öffentl. AG"'), 'c3', 'Für XRechnung an Behörden')}
        <div class="c12">${checkbox('reverse_charge', c.reverse_charge, 'Kunde ist Bauunternehmer → Rechnungen nach § 13b UStG (Reverse Charge, ohne USt)')}</div>
        ${field('Notizen', textarea('notes', c.notes, 'rows="3" placeholder="Interne Notizen, z. B. Zufahrt, Schlüssel, Besonderheiten"'), 'c12')}
      </div>`,
    validate: (d) => (!d.company && !d.last_name ? 'Bitte Nachname oder Firma angeben.' : d.reverse_charge && d.type === 'privat' ? '§ 13b ist bei Privatkunden nicht zulässig.' : null),
    onOpen: (m) => {
      const t = m.querySelector('[name=type]');
      const sal = m.querySelector('[name=salutation]');
      t.addEventListener('change', () => {
        if (t.value !== 'privat' && !sal.value) sal.value = 'Firma';
      });
    },
  });
  if (!data) return null;
  data.discount = C.parseNumber(data.discount);
  try {
    if (isNew) {
      const r = await POST('/customers', data);
      ok('Kunde angelegt.');
      return r.id;
    }
    await PUT(`/customers/${c.id}`, data);
    ok('Kunde gespeichert.');
    return c.id;
  } catch (e) {
    fail(e);
    return null;
  }
}

/* ---------------- Liste ---------------- */
const prefs = { q: '', archived: false, type: '' };

export async function customerListView(params, view) {
  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div class="titles"><h1>Kunden</h1><p>Kundenstamm mit Konditionen, Umsätzen und allen Belegen.</p></div>
      <button class="btn" id="imp">${icon('upload')} Import</button>
      <a class="btn" href="/api/customers/export.csv">${icon('download')} Export</a>
      <button class="btn primary" id="new">${icon('plus')} Neuer Kunde</button>
    </div>
    <div class="toolbar">
      <div class="search-box">${icon('search')}<input id="q" placeholder="Name, Firma, Ort, Telefon, Kundennr. …" value="${esc(prefs.q)}"></div>
      <select id="type" style="width:auto"><option value="">Alle Kundenarten</option>${Object.entries(CUSTOMER_TYPE).map(([k, v]) => `<option value="${k}" ${prefs.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" id="arch" ${prefs.archived ? 'checked' : ''}> Archivierte anzeigen</label>
      <div style="flex:1"></div><span class="muted small" id="count"></span>
    </div>
    <div class="card"><div class="table-wrap" id="list"></div></div>
  </div>`;

  const load = async () => {
    let rows = await GET(`/customers?q=${encodeURIComponent(prefs.q)}${prefs.archived ? '&archived=1' : ''}`);
    if (prefs.type) rows = rows.filter((r) => r.type === prefs.type);
    view.querySelector('#count').textContent = `${rows.length} Kunde(n)`;
    view.querySelector('#list').innerHTML = rows.length
      ? `<table class="table"><thead><tr><th>Kunde</th><th>Nr.</th><th>Adresse</th><th>Kontakt</th><th>Art</th><th class="num">Umsatz netto</th><th>Letzte Aktivität</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr class="click" data-id="${r.id}">
            <td><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="width:30px;height:30px;font-size:12px;background:${r.company ? 'var(--brand)' : '#7a68c4'}">${esc(initials(r.display_name))}</div>
              <div><b>${esc(r.display_name)}</b>${r.company && (r.last_name || r.contact_person) ? `<div class="sub">${esc(r.contact_person || [r.first_name, r.last_name].join(' '))}</div>` : ''}</div></div></td>
            <td class="mono">${esc(r.number)}</td>
            <td>${esc(r.street)}<div class="sub">${esc([r.zip, r.city].filter(Boolean).join(' '))}</div></td>
            <td>${esc(r.phone || r.mobile || '')}<div class="sub">${esc(r.email)}</div></td>
            <td><span class="badge t-${r.type} plain">${CUSTOMER_TYPE[r.type]}</span>${r.reverse_charge ? ' <span class="badge rc plain">§ 13b</span>' : ''}</td>
            <td class="num">${r.revenue ? money(r.revenue) : '–'}</td>
            <td>${r.last_activity ? date(r.last_activity) : '<span class="muted">–</span>'}<div class="sub">${r.doc_count} Beleg(e)</div></td>
          </tr>`).join('')}</tbody></table>`
      : emptyState(prefs.q ? 'Keine Kunden gefunden.' : 'Noch keine Kunden angelegt.', 'users');
  };

  view.querySelector('#q').addEventListener('input', debounce((e) => { prefs.q = e.target.value.trim(); load(); }, 200));
  view.querySelector('#type').addEventListener('change', (e) => { prefs.type = e.target.value; load(); });
  view.querySelector('#arch').addEventListener('change', (e) => { prefs.archived = e.target.checked; load(); });
  view.querySelector('#list').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/kunden/${tr.dataset.id}`);
  });
  view.querySelector('#new').addEventListener('click', async () => {
    const id = await customerDialog();
    if (id) navigate(`#/kunden/${id}`);
  });
  view.querySelector('#imp').addEventListener('click', () => importDialog('/customers/import', 'Kunden importieren',
    'CSV-Datei mit Semikolon als Trennzeichen. Erste Zeile = Spaltennamen, z. B.: <code>type;salutation;first_name;last_name;company;street;zip;city;email;phone</code>. Am einfachsten: zuerst exportieren und die Datei als Vorlage nutzen.', load));
  await load();
}

export async function importDialog(url, title, help, after) {
  await modal({
    title,
    body: `<p class="small" style="margin-top:0">${help}</p><input type="file" accept=".csv,text/csv" id="file">`,
    foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" id="go">${icon('upload')} Importieren</button>`,
    onOpen: (m, close) => {
      m.querySelector('#go').addEventListener('click', (e) => attempt(async () => {
        const f = m.querySelector('#file').files[0];
        if (!f) throw new Error('Bitte eine Datei auswählen.');
        const fd = new FormData();
        fd.append('file', f);
        const r = await POST(url, fd);
        ok(`${r.imported} Datensätze importiert.`);
        close(true);
        after?.();
      }, e.currentTarget));
    },
  });
}

/* ---------------- Detail ---------------- */
export async function customerDetailView(params, view) {
  const c = await GET(`/customers/${params.id}`);
  const offers = c.documents.filter((d) => d.type === 'angebot');
  const invoices = c.documents.filter((d) => d.type !== 'angebot');
  const rate = c.stats.offers ? Math.round((c.stats.offers_won / c.stats.offers) * 100) : null;
  const addr = [c.address_extra, c.street, [c.zip, c.city].filter(Boolean).join(' '), c.country !== 'DE' ? c.country : ''].filter(Boolean);
  const mapsQ = encodeURIComponent([c.street, c.zip, c.city].join(' '));

  const docTable = (list, isOffer) => list.length ? `
    <table class="table compact"><thead><tr><th>Nummer</th><th>Bauvorhaben</th><th>Datum</th><th class="num">Betrag</th>${isOffer ? '' : '<th class="num">Offen</th>'}<th>Status</th></tr></thead>
    <tbody>${list.map((d) => `<tr class="click" data-doc="${d.id}"><td><b>${esc(d.number || 'Entwurf')}</b>${d.type !== 'angebot' && d.type !== 'rechnung' ? `<div class="sub">${esc(d.label)}</div>` : ''}</td>
      <td>${esc(d.project || d.subject || '')}</td><td>${date(d.date)}</td><td class="num">${money(d.gross - (d.prepaid_gross || 0))}</td>
      ${isOffer ? '' : `<td class="num">${d.open > 0 ? money(d.open) : '–'}</td>`}<td>${statusBadge(d.display_status)}</td></tr>`).join('')}</tbody></table>`
    : emptyState(isOffer ? 'Noch keine Angebote' : 'Noch keine Rechnungen', isOffer ? 'offer' : 'invoice');

  view.innerHTML = `
  <div class="page">
    <div class="crumb"><a href="#/kunden">Kunden</a> / ${esc(c.number)}</div>
    <div class="page-head">
      <div class="titles customer-head">
        <div class="avatar" style="background:${c.company ? 'var(--brand)' : '#7a68c4'}">${esc(initials(c.display_name))}</div>
        <div><h1>${esc(c.display_name)}</h1>
          <p><span class="mono">${esc(c.number)}</span> · <span class="badge t-${c.type} plain">${CUSTOMER_TYPE[c.type]}</span>
          ${c.reverse_charge ? '<span class="badge rc plain">§ 13b Reverse Charge</span>' : ''}${c.archived ? ' <span class="badge">Archiviert</span>' : ''}</p></div>
      </div>
      <button class="btn" id="edit">${icon('edit')} Bearbeiten</button>
      <button class="btn icon" id="more">${icon('more')}</button>
      <a class="btn" href="#/neu/rechnung/${c.id}">${icon('invoice')} Rechnung</a>
      <a class="btn primary" href="#/neu/angebot/${c.id}">${icon('plus')} Neues Angebot</a>
    </div>

    <div class="grid kpis" style="margin-bottom:16px">
      <div class="card kpi"><div class="ic">${icon('trend')}</div><div class="label">Umsatz gesamt (netto)</div><div class="value">${money(c.stats.revenue)}</div></div>
      <div class="card kpi ${c.stats.open ? 'is-alert' : 'good'}"><div class="ic">${icon('euro')}</div><div class="label">Offene Posten</div><div class="value">${money(c.stats.open)}</div></div>
      <div class="card kpi"><div class="ic">${icon('offer')}</div><div class="label">Angebote</div><div class="value">${c.stats.offers}</div><div class="hint">Auftragsquote ${rate === null ? '–' : rate + ' %'}</div></div>
    </div>

    <div class="grid" style="grid-template-columns: 1fr 2fr; align-items:start">
      <div class="card">
        <div class="card-head"><h2>Stammdaten</h2></div>
        <div class="card-body">
          <dl class="kv">
            ${c.company && c.contact_person ? `<dt>Ansprechpartner</dt><dd>${esc(c.contact_person)}</dd>` : ''}
            ${c.company && c.last_name ? `<dt>Person</dt><dd>${esc([c.salutation, c.title, c.first_name, c.last_name].filter(Boolean).join(' '))}</dd>` : ''}
            <dt>Anschrift</dt><dd>${addr.map(esc).join('<br>') || '–'}${c.street ? `<br><a class="small" href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">${icon('map')} Karte</a>` : ''}</dd>
            <dt>E-Mail</dt><dd>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '–'}${c.email_cc ? `<br><span class="small muted">CC: ${esc(c.email_cc)}</span>` : ''}</dd>
            <dt>Telefon</dt><dd>${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '–'}</dd>
            ${c.mobile ? `<dt>Mobil</dt><dd><a href="tel:${esc(c.mobile)}">${esc(c.mobile)}</a></dd>` : ''}
            <dt>Zahlungsziel</dt><dd>${c.payment_days != null ? `${c.payment_days} Tage` : 'Standard'}</dd>
            ${c.discount ? `<dt>Kundenrabatt</dt><dd>${qty(c.discount)} %</dd>` : ''}
            ${c.vat_id ? `<dt>USt-IdNr.</dt><dd>${esc(c.vat_id)}</dd>` : ''}
            ${c.leitweg_id ? `<dt>Leitweg-ID</dt><dd>${esc(c.leitweg_id)}</dd>` : ''}
            <dt>Kunde seit</dt><dd>${date(c.created_at)}</dd>
          </dl>
          ${c.notes ? `<div class="alert" style="margin-top:14px">${icon('edit')}<div style="white-space:pre-line">${esc(c.notes)}</div></div>` : ''}
        </div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h2>Angebote</h2><span class="muted small">${offers.length}</span></div><div class="table-wrap">${docTable(offers, true)}</div></div>
        <div class="card"><div class="card-head"><h2>Rechnungen</h2><span class="muted small">${invoices.length}</span></div><div class="table-wrap">${docTable(invoices, false)}</div></div>
      </div>
    </div>
  </div>`;

  view.querySelectorAll('[data-doc]').forEach((tr) => tr.addEventListener('click', () => navigate(`#/beleg/${tr.dataset.doc}`)));
  view.querySelector('#edit').addEventListener('click', async () => {
    if (await customerDialog(c)) customerDetailView(params, view);
  });
  view.querySelector('#more').addEventListener('click', (e) => {
    import('../core.js').then(({ dropdown }) => dropdown(e.currentTarget, [
      c.archived
        ? { label: 'Wiederherstellen', icon: 'refresh', action: () => attempt(async () => { await PUT(`/customers/${c.id}`, { archived: 0 }); customerDetailView(params, view); }) }
        : { label: 'Archivieren', icon: 'layers', action: () => attempt(async () => { await PUT(`/customers/${c.id}`, { archived: 1 }); ok('Archiviert.'); customerDetailView(params, view); }) },
      '-',
      { label: 'Kunde löschen', icon: 'trash', danger: true, action: async () => {
        if (!(await confirmDialog(c.documents.length ? 'Der Kunde hat Belege und wird daher archiviert statt gelöscht.' : 'Kunde endgültig löschen?', { danger: true, okText: 'Fortfahren' }))) return;
        attempt(async () => {
          const r = await DEL(`/customers/${c.id}`);
          ok(r.archived ? 'Kunde archiviert.' : 'Kunde gelöscht.');
          navigate('#/kunden');
        });
      } },
    ]));
  });
}
