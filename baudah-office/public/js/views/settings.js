import {
  esc, icon, GET, POST, PUT, DEL, ok, attempt, field, input, textarea, select, checkbox, readForm, formDialog,
  confirmDialog, state, dateTime, emptyState, navigate, qty, C, modal,
} from '../core.js';

const TABS = [
  ['firma', 'building', 'Firma & Logo'],
  ['bank', 'euro', 'Bank & Steuer'],
  ['nummern', 'hash', 'Nummernkreise'],
  ['vorgaben', 'sliders', 'Vorgaben'],
  ['texte', 'text', 'Textbausteine'],
  ['email', 'mail', 'E-Mail-Versand'],
  ['mahnwesen', 'bell', 'Mahnwesen'],
  ['benutzer', 'users', 'Benutzer'],
  ['datev', 'download', 'DATEV-Export'],
  ['sicherung', 'db', 'Datensicherung'],
  ['protokoll', 'clock', 'Protokoll'],
];

export async function settingsView(params, view) {
  const tab = params.tab || 'firma';
  const s = await GET('/settings');
  state.settings = s;
  const admin = state.user.role === 'admin';
  view.innerHTML = `
  <div class="page">
    <div class="page-head"><div class="titles"><h1>Einstellungen</h1><p>Firmendaten, Briefbogen, Nummernkreise, E-Mail-Versand und Datensicherung.</p></div></div>
    ${!admin ? `<div class="alert warn" style="margin-bottom:14px">${icon('lock')}<div>Nur Administratoren können Einstellungen ändern.</div></div>` : ''}
    <div class="settings">
      <nav>${TABS.map(([k, ic, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${icon(ic)}${l}</button>`).join('')}</nav>
      <div id="pane"></div>
    </div>
  </div>`;
  view.querySelector('nav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) navigate(`#/einstellungen/${b.dataset.tab}`);
  });
  const pane = view.querySelector('#pane');
  const fn = PANES[tab] || PANES.firma;
  await fn(pane, s, () => settingsView(params, view));
}

/** Formular-Karte mit Speichern-Button */
function formCard(title, inner, { desc = '', saveLabel = 'Speichern' } = {}) {
  return `<form class="card" data-form>
    <div class="card-head"><h2>${esc(title)}</h2></div>
    <div class="card-body">${desc ? `<p class="muted" style="margin:0 0 16px">${desc}</p>` : ''}<div class="form-grid">${inner}</div></div>
    <div class="modal-foot" style="border-radius:0 0 var(--radius) var(--radius)"><button class="btn primary">${icon('save')} ${esc(saveLabel)}</button></div>
  </form>`;
}

function bindForm(pane, key, base, transform = (d) => d, after) {
  pane.querySelectorAll('form[data-form]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      attempt(async () => {
        const data = transform(readForm(f));
        await PUT(`/settings/${key}`, { ...base, ...data });
        state.settings = await GET('/settings');
        ok('Einstellungen gespeichert.');
        after?.();
      }, f.querySelector('button.primary'));
    })
  );
}

const PANES = {
  /* ---------------- Firma ---------------- */
  async firma(pane, s, refresh) {
    const c = s.company;
    pane.innerHTML = formCard('Firmendaten', `
      ${field('Firmenname', input('name', c.name), 'c8')}
      ${field('Kurzname / Wortmarke', input('short', c.short), 'c4', 'Wird als Logo genutzt, wenn kein Bild hochgeladen ist')}
      ${field('Zusatz', input('claim', c.claim), 'c4')}
      ${field('Inhaber', input('owner', c.owner), 'c4')}
      ${field('Titel des Inhabers', input('owner_title', c.owner_title), 'c4')}
      ${field('Straße, Nr.', input('street', c.street), 'c6')}
      ${field('PLZ', input('zip', c.zip), 'c2')}
      ${field('Ort', input('city', c.city), 'c4')}
      ${field('Telefon', input('phone', c.phone), 'c4')}
      ${field('Mobil', input('mobile', c.mobile), 'c4')}
      ${field('E-Mail', input('email', c.email), 'c4')}
      ${field('Webseite', input('web', c.web), 'c4')}
      ${field('Handwerkskammer', input('chamber', c.chamber), 'c5')}
      ${field('Betriebsnummer / Eintrag Handwerksrolle', input('chamber_no', c.chamber_no), 'c3')}
      <div class="form-sep">Farben im Briefbogen</div>
      ${field('Hauptfarbe', input('brand_color', c.brand_color, 'type="color"'), 'c2')}
      ${field('Akzentfarbe', input('accent_color', c.accent_color, 'type="color"'), 'c2')}
    `, { desc: 'Diese Angaben erscheinen im Briefkopf und in der Fußzeile aller Angebote und Rechnungen.' }) + `
    <div class="card"><div class="card-head"><h2>Logo</h2></div><div class="card-body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
      <div class="logo-preview">${s.has_logo ? `<img src="/api/logo?${Date.now()}" alt="Logo">` : `<span style="font-family:'Arial Black',Arial;font-size:28px;font-weight:900;color:${esc(c.brand_color)}">${esc(c.short || 'Logo')}</span>`}</div>
      <div style="display:grid;gap:8px">
        <p class="muted small" style="margin:0">PNG oder JPG, am besten mit transparentem Hintergrund, max. 3 MB.<br>Ohne Logo wird die Wortmarke „${esc(c.short)}“ im Stil der Visitenkarte verwendet.</p>
        <div class="btn-row"><label class="btn">${icon('upload')} Logo hochladen<input type="file" accept="image/png,image/jpeg" id="logo" hidden></label>
        ${s.has_logo ? `<button class="btn danger" id="dellogo">${icon('trash')} Entfernen</button>` : ''}</div>
      </div>
    </div></div>
    <div class="card"><div class="card-head"><h2>Briefbogen testen</h2></div><div class="card-body"><p class="muted" style="margin-top:0">Erstellen Sie ein Angebot und öffnen Sie die PDF-Vorschau, um das Ergebnis zu prüfen.</p><a class="btn" href="#/neu/angebot">${icon('offer')} Test-Angebot anlegen</a></div></div>`;
    bindForm(pane, 'company', c);
    pane.querySelector('#logo').addEventListener('change', (e) => attempt(async () => {
      const fd = new FormData();
      fd.append('logo', e.target.files[0]);
      await POST('/settings/logo', fd);
      ok('Logo hochgeladen.');
      refresh();
    }));
    pane.querySelector('#dellogo')?.addEventListener('click', () => attempt(async () => {
      await DEL('/settings/logo');
      refresh();
    }));
  },

  /* ---------------- Bank & Steuer ---------------- */
  async bank(pane, s) {
    const c = s.company;
    pane.innerHTML = formCard('Bankverbindung & Steuer', `
      <div class="form-sep">Steuer (Pflichtangaben § 14 UStG)</div>
      ${field('Steuernummer', input('tax_number', c.tax_number, 'placeholder="z. B. 235/123/45678"'), 'c6', 'vom Finanzamt Grimma')}
      ${field('USt-IdNr.', input('vat_id', c.vat_id, 'placeholder="DE…"'), 'c6', 'falls vorhanden')}
      <div class="form-sep">Bankverbindung</div>
      ${field('Bank', input('bank_name', c.bank_name, 'placeholder="z. B. Sparkasse Muldental"'), 'c6')}
      ${field('Kontoinhaber', input('account_holder', c.account_holder), 'c6')}
      ${field('IBAN', input('iban', c.iban, 'placeholder="DE00 0000 0000 0000 0000 00"'), 'c8')}
      ${field('BIC', input('bic', c.bic), 'c4')}
    `, { desc: 'Ohne Steuernummer bzw. USt-IdNr. lassen sich Rechnungen nicht festschreiben – das schützt vor formell fehlerhaften Rechnungen.' });
    bindForm(pane, 'company', c, (d) => {
      const iban = d.iban.replace(/\s/g, '').toUpperCase();
      if (iban && !validIban(iban)) throw new Error('Die IBAN ist ungültig (Prüfziffer stimmt nicht).');
      return { ...d, iban };
    });
  },

  /* ---------------- Nummernkreise ---------------- */
  async nummern(pane, s) {
    const n = s.numbering;
    const ex = (p) => p.replace(/\{JJJJ\}/g, new Date().getFullYear()).replace(/\{JJ\}/g, String(new Date().getFullYear()).slice(2)).replace(/\{MM\}/g, String(new Date().getMonth() + 1).padStart(2, '0')).replace(/\{NR\}/g, '1'.padStart(n.padding, '0'));
    pane.innerHTML = formCard('Nummernkreise', `
      ${field('Angebote', input('angebot', n.angebot), 'c6', `Beispiel: ${ex(n.angebot)}`)}
      ${field('Rechnungen (alle Arten)', input('rechnung', n.rechnung), 'c6', `Beispiel: ${ex(n.rechnung)}`)}
      ${field('Stellen der laufenden Nummer', input('padding', n.padding, 'type="number" min="1" max="8"'), 'c4')}
      ${field('Kundennummern ab', input('customer_start', n.customer_start, 'type="number"'), 'c4')}
      ${field('Kundennummer-Format', input('kunde', n.kunde), 'c4')}
      <div class="c12"><div class="placeholders"><code>{JJJJ}</code> Jahr <code>{JJ}</code> Jahr kurz <code>{MM}</code> Monat <code>{NR}</code> laufende Nummer</div>
      <p class="small muted">Enthält das Muster ein Jahr, beginnt die Zählung jedes Jahr neu bei 1. Rechnungs-, Abschlags-, Schluss- und Stornorechnungen teilen sich einen lückenlosen Nummernkreis (GoBD).</p></div>
    `);
    bindForm(pane, 'numbering', n, (d) => ({ ...d, padding: Number(d.padding) || 4, customer_start: Number(d.customer_start) || 10001 }));
  },

  /* ---------------- Vorgaben ---------------- */
  async vorgaben(pane, s) {
    const d = s.defaults;
    pane.innerHTML = formCard('Standardwerte für neue Belege', `
      ${field('Zahlungsziel', `<div class="input-suffix">${input('payment_days', d.payment_days, 'type="number"')}<span>Tage</span></div>`, 'c4')}
      ${field('Angebot gültig', `<div class="input-suffix">${input('valid_days', d.valid_days, 'type="number"')}<span>Tage</span></div>`, 'c4')}
      ${field('Standard-MwSt', select('vat_rate', { 19: '19 %', 7: '7 %' }, d.vat_rate), 'c4')}
      ${field('Skonto', `<div class="input-suffix">${input('skonto_percent', qty(d.skonto_percent))}<span>%</span></div>`, 'c4')}
      ${field('Skonto-Frist', `<div class="input-suffix">${input('skonto_days', d.skonto_days, 'type="number"')}<span>Tage</span></div>`, 'c4')}
      <div class="c12">${checkbox('show_35a_private', d.show_35a_private, 'Bei Privatkunden automatisch Lohnanteil nach § 35a EStG ausweisen (Steuerbonus für Handwerkerleistungen)')}</div>
    `);
    bindForm(pane, 'defaults', d, (x) => ({ ...x, payment_days: Number(x.payment_days), valid_days: Number(x.valid_days), vat_rate: Number(x.vat_rate), skonto_percent: C.parseNumber(x.skonto_percent), skonto_days: Number(x.skonto_days) }));
  },

  /* ---------------- Texte ---------------- */
  async texte(pane, s) {
    const t = s.texts;
    const ta = (k, l, rows = 3, hint = '') => field(l, textarea(k, t[k], `rows="${rows}"`), 'c12', hint);
    pane.innerHTML = formCard('Textbausteine', `
      <div class="form-sep">Angebot</div>${ta('angebot_intro', 'Einleitung')}${ta('angebot_outro', 'Schluss', 4)}${ta('validity', 'Gültigkeitshinweis', 1, 'Platzhalter: {gueltig}')}
      <div class="form-sep">Rechnung</div>${ta('rechnung_intro', 'Einleitung')}${ta('rechnung_outro', 'Schluss')}
      ${ta('payment', 'Zahlungshinweis', 2, 'Platzhalter: {faellig} {nummer}')}${ta('payment_skonto', 'Skontohinweis', 2, 'Platzhalter: {skonto_tage} {skonto_prozent} {skonto_betrag} {faellig}')}
      <div class="form-sep">Abschlags- &amp; Schlussrechnung</div>${ta('abschlag_intro', 'Abschlag – Einleitung', 2)}${ta('schluss_intro', 'Schlussrechnung – Einleitung', 2)}${ta('schluss_outro', 'Schlussrechnung – Schluss', 3)}
      <div class="form-sep">Rechtliche Hinweise</div>${ta('reverse_charge', '§ 13b UStG (Reverse Charge)', 3)}${ta('private_note', 'Aufbewahrungspflicht Privatkunden (§ 14 Abs. 4 Nr. 9 UStG)', 2)}
    `);
    bindForm(pane, 'texts', t);
  },

  /* ---------------- E-Mail ---------------- */
  async email(pane, s) {
    const m = s.mail;
    const tpl = s.mail_templates;
    const ph = ['anrede', 'kunde', 'nummer', 'belegart', 'datum', 'betrag', 'netto', 'faellig', 'gueltig', 'bauvorhaben', 'offen', 'mahnstufe', 'firma', 'signatur'];
    pane.innerHTML = formCard('E-Mail-Postausgang (SMTP)', `
      <div class="c12 alert">${icon('mail')}<div><b>GMX:</b> Server <code>mail.gmx.net</code>, Port <code>587</code>, STARTTLS. Benutzername ist die volle E-Mail-Adresse. Wichtig: Im GMX-Postfach unter <i>E-Mail → Einstellungen → POP3/IMAP Abruf</i> den Haken „Zugriff über POP3/IMAP/SMTP erlauben“ setzen.</div></div>
      ${field('SMTP-Server', input('host', m.host), 'c6')}
      ${field('Port', input('port', m.port, 'type="number"'), 'c2')}
      <div class="c4" style="display:flex;align-items:flex-end;padding-bottom:8px">${checkbox('secure', m.secure, 'SSL/TLS (Port 465)')}</div>
      ${field('Benutzername', input('user', m.user, 'autocomplete="off"'), 'c6')}
      ${field('Passwort', input('pass', m.pass, 'type="password" autocomplete="new-password"'), 'c6', 'wird verschlüsselt gespeichert')}
      ${field('Absendername', input('from_name', m.from_name), 'c6')}
      ${field('Absenderadresse', input('from_email', m.from_email), 'c6')}
      <div class="c12">${checkbox('bcc_self', m.bcc_self, 'Kopie (BCC) jeder gesendeten E-Mail an mich selbst – so liegt alles auch im Postfach')}</div>
      ${field('E-Mail-Signatur', textarea('signature', m.signature, 'rows="7"'), 'c12', 'Platzhalter {signatur} in den Vorlagen')}
    `, { saveLabel: 'Zugang speichern' }) + `
    <div class="card"><div class="card-head"><h2>Verbindung testen</h2></div><div class="card-body btn-row">
      <input id="testto" placeholder="Testempfänger" value="${esc(m.from_email)}" style="max-width:320px"><button class="btn" id="test">${icon('send')} Testmail senden</button></div></div>
    <form class="card" id="tpl"><div class="card-head"><h2>E-Mail-Vorlagen</h2></div><div class="card-body">
      <div class="placeholders" style="margin-bottom:14px">${ph.map((p) => `<code title="Klicken zum Einfügen">{${p}}</code>`).join('')}</div>
      <div class="form-grid">
        ${['angebot', 'rechnung', 'mahnung'].map((k) => `<div class="form-sep">${{ angebot: 'Angebot', rechnung: 'Rechnung (alle Arten)', mahnung: 'Mahnung' }[k]}</div>
          ${field('Betreff', input(`${k}.subject`, tpl[k].subject), 'c12')}${field('Text', textarea(`${k}.body`, tpl[k].body, 'rows="8"'), 'c12')}`).join('')}
      </div></div>
      <div class="modal-foot" style="border-radius:0 0 var(--radius) var(--radius)"><button class="btn primary">${icon('save')} Vorlagen speichern</button></div></form>`;
    bindForm(pane, 'mail', m, (d) => ({ ...d, port: Number(d.port) }));
    let lastField = null;
    pane.querySelectorAll('#tpl input, #tpl textarea').forEach((el) => el.addEventListener('focus', () => (lastField = el)));
    pane.querySelector('.placeholders').addEventListener('click', (e) => {
      const code = e.target.closest('code');
      if (!code || !lastField) return;
      const { selectionStart: a, selectionEnd: b, value } = lastField;
      lastField.value = value.slice(0, a) + code.textContent + value.slice(b);
      lastField.focus();
    });
    pane.querySelector('#tpl').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = readForm(e.target);
      const out = {};
      for (const [k, v] of Object.entries(d)) {
        const [a, b] = k.split('.');
        (out[a] ||= {})[b] = v;
      }
      attempt(async () => {
        await PUT('/settings/mail_templates', out);
        ok('Vorlagen gespeichert.');
      });
    });
    pane.querySelector('#test').addEventListener('click', (e) => attempt(async () => {
      await POST('/mail/test', { to: pane.querySelector('#testto').value });
      ok('Testmail wurde versendet – bitte Postfach prüfen.');
    }, e.currentTarget));
  },

  /* ---------------- Mahnwesen ---------------- */
  async mahnwesen(pane, s) {
    const d = s.dunning;
    pane.innerHTML = formCard('Mahnwesen', `
      ${field('Zahlungsfrist je Mahnstufe', `<div class="input-suffix">${input('days', d.days, 'type="number"')}<span>Tage</span></div>`, 'c4')}
      ${[0, 1, 2].map((i) => `<div class="form-sep">Stufe ${i + 1}</div>
        ${field('Bezeichnung', input(`title${i}`, d.titles[i]), 'c8')}
        ${field('Gebühr', `<div class="input-suffix">${input(`fee${i}`, qty(d.fees[i] || 0))}<span>€</span></div>`, 'c4')}
        ${field('Text', textarea(`text${i}`, d.texts[i], 'rows="4"'), 'c12', 'Platzhalter: {faellig} {nummer}')}`).join('')}
    `, { desc: 'Rechtlicher Hinweis: Mahngebühren dürfen nur den tatsächlichen Aufwand (Porto, Material) abdecken – üblich sind 2,50 € bis 5 € je Mahnung. Verzugszinsen: Privat 5 %, Gewerbe 9 % über Basiszins (§ 288 BGB).' });
    bindForm(pane, 'dunning', d, (x) => ({
      days: Number(x.days) || 10,
      titles: [x.title0, x.title1, x.title2],
      fees: [C.parseNumber(x.fee0), C.parseNumber(x.fee1), C.parseNumber(x.fee2)],
      texts: [x.text0, x.text1, x.text2],
    }));
  },

  /* ---------------- Benutzer ---------------- */
  async benutzer(pane) {
    const admin = state.user.role === 'admin';
    const users = admin ? await GET('/users') : [];
    pane.innerHTML = `
      ${admin ? `<div class="card"><div class="card-head"><h2>Benutzer</h2><button class="btn sm primary" id="nu">${icon('plus')} Benutzer</button></div>
        <table class="table"><thead><tr><th>Name</th><th>Benutzername</th><th>Rolle</th><th>Status</th><th></th></tr></thead><tbody>
        ${users.map((u) => `<tr><td><b>${esc(u.name)}</b><div class="sub">${esc(u.email)}</div></td><td class="mono">${esc(u.username)}</td>
          <td>${u.role === 'admin' ? 'Administrator' : 'Benutzer'}</td><td>${u.active ? '<span class="badge s-bezahlt">aktiv</span>' : '<span class="badge">gesperrt</span>'}</td>
          <td class="right"><button class="btn sm" data-u="${u.id}">Bearbeiten</button></td></tr>`).join('')}
        </tbody></table></div>` : ''}
      <form class="card" id="pw"><div class="card-head"><h2>Eigenes Passwort ändern</h2></div><div class="card-body form-grid">
        ${field('Aktuelles Passwort', input('current', '', 'type="password" autocomplete="current-password"'), 'c4')}
        ${field('Neues Passwort', input('password', '', 'type="password" minlength="8" autocomplete="new-password"'), 'c4')}
        ${field('Wiederholen', input('password2', '', 'type="password" autocomplete="new-password"'), 'c4')}
      </div><div class="modal-foot" style="border-radius:0 0 var(--radius) var(--radius)"><button class="btn primary">Passwort ändern</button></div></form>`;
    pane.querySelector('#pw').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = readForm(e.target);
      attempt(async () => {
        if (d.password !== d.password2) throw new Error('Die Passwörter stimmen nicht überein.');
        await PUT('/me/password', d);
        e.target.reset();
        ok('Passwort geändert.');
      });
    });
    const dlg = async (u = {}) => {
      const d = await formDialog({
        title: u.id ? 'Benutzer bearbeiten' : 'Neuer Benutzer',
        body: `<div class="form-grid">
          ${field('Name', input('name', u.name), 'c6')}${field('E-Mail', input('email', u.email), 'c6')}
          ${field('Benutzername', input('username', u.username, u.id ? 'disabled' : ''), 'c6')}
          ${field('Rolle', select('role', { user: 'Benutzer (Büro)', admin: 'Administrator' }, u.role || 'user'), 'c6')}
          ${field(u.id ? 'Neues Passwort (optional)' : 'Passwort', input('password', '', 'type="password" autocomplete="new-password"'), 'c12', 'mindestens 8 Zeichen')}
          ${u.id ? `<div class="c12">${checkbox('active', u.active, 'Aktiv')}</div>` : ''}</div>`,
      });
      if (!d) return;
      await attempt(async () => {
        if (u.id) await PUT(`/users/${u.id}`, { ...d, password: d.password || undefined });
        else await POST('/users', d);
        ok('Gespeichert.');
        PANES.benutzer(pane);
      });
    };
    pane.querySelector('#nu')?.addEventListener('click', () => dlg());
    pane.querySelectorAll('[data-u]').forEach((b) => b.addEventListener('click', () => dlg(users.find((u) => u.id === Number(b.dataset.u)))));
  },

  /* ---------------- DATEV ---------------- */
  async datev(pane, s) {
    const d = s.datev;
    const presets = await GET('/datev/presets');
    const y = new Date().getFullYear();
    const m = new Date().getMonth();
    const lastMonthStart = new Date(y, m - 1, 1);
    const lastMonthEnd = new Date(y, m, 0);
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const acc = (k, l, hint = '') => field(l, input(k, d[k], 'type="number"'), 'c3', hint);
    pane.innerHTML = `
    <div class="card"><div class="card-head"><h2>Export für den Steuerberater</h2></div><div class="card-body">
      <p class="muted" style="margin-top:0">Erzeugt einen <b>DATEV-Buchungsstapel</b> (Format EXTF 700) mit allen festgeschriebenen Rechnungen und Zahlungseingängen. Den kann der Steuerberater direkt in DATEV Kanzlei-Rechnungswesen einlesen.</p>
      <div class="form-grid" id="dx">
        ${field('Von', input('from', iso(lastMonthStart), 'type="date"'), 'c3')}
        ${field('Bis', input('to', iso(lastMonthEnd), 'type="date"'), 'c3')}
        <div class="c6 btn-row" style="align-items:flex-end">
          <button type="button" class="btn sm" data-r="month">Letzter Monat</button>
          <button type="button" class="btn sm" data-r="quarter">Letztes Quartal</button>
          <button type="button" class="btn sm" data-r="year">Dieses Jahr</button>
        </div>
        <div class="c12">${checkbox('payments', true, 'Zahlungseingänge mit exportieren (Bank/Kasse an Debitor)')}</div>
      </div>
      <div class="btn-row" style="margin-top:14px"><button class="btn" id="dprev">${icon('search')} Vorschau</button><button class="btn primary" id="dexp">${icon('download')} DATEV-Datei herunterladen</button></div>
      <div id="dout" style="margin-top:14px"></div>
    </div></div>
    ${formCard('DATEV-Einstellungen', `
      ${field('Beraternummer', input('consultant', d.consultant, 'inputmode="numeric" placeholder="vom Steuerberater"'), 'c3')}
      ${field('Mandantennummer', input('client', d.client, 'inputmode="numeric"'), 'c3')}
      ${field('Kontenrahmen', select('skr', { '03': 'SKR 03', '04': 'SKR 04' }, d.skr), 'c3')}
      ${field('Sachkontenlänge', select('account_length', { 4: '4-stellig', 5: '5-stellig', 6: '6-stellig' }, d.account_length), 'c3')}
      ${field('Wirtschaftsjahr beginnt (MM-TT)', input('fiscal_start', d.fiscal_start), 'c3')}
      ${field('Debitoren', select('debitor_mode', { einzeln: 'Je Kunde (Kundennr. = Debitor)', sammel: 'Ein Sammeldebitor' }, d.debitor_mode), 'c5')}
      ${field('Sammeldebitor', input('collective_debitor', d.collective_debitor, 'type="number"'), 'c4', 'auch für Kunden ohne passende Nummer')}
      <div class="form-sep">Konten <button type="button" class="btn sm" id="preset" style="margin-left:10px">Standardkonten für gewählten Kontenrahmen</button></div>
      ${acc('revenue_19', 'Erlöse 19 %')}${acc('revenue_7', 'Erlöse 7 %')}${acc('revenue_0', 'Erlöse steuerfrei')}${acc('revenue_13b', 'Erlöse § 13b UStG')}
      ${acc('bank', 'Bank')}${acc('cash', 'Kasse')}${acc('skonto', 'Gewährte Skonti')}
      <div class="c12 alert warn">${icon('alert')}<div>Kontenzuordnung bitte einmal mit dem Steuerberater abstimmen. Abschlagsrechnungen werden sofort als Erlös gebucht, Schlussrechnungen nur mit dem Restbetrag – die übliche Variante bei Ist-Versteuerung.</div></div>
    `, { saveLabel: 'DATEV-Einstellungen speichern' })}`;
    const nums = ['account_length', 'collective_debitor', 'revenue_19', 'revenue_7', 'revenue_0', 'revenue_13b', 'bank', 'cash', 'skonto'];
    bindForm(pane, 'datev', d, (x) => {
      for (const k of nums) x[k] = Number(x[k]);
      return x;
    });
    pane.querySelector('#preset').addEventListener('click', () => {
      const p = presets[pane.querySelector('[name=skr]').value];
      for (const [k, v] of Object.entries(p)) pane.querySelector(`[name=${k}]`).value = v;
      ok('Standardkonten eingetragen – bitte speichern.');
    });
    const dx = pane.querySelector('#dx');
    dx.addEventListener('click', (e) => {
      const r = e.target.closest('[data-r]')?.dataset.r;
      if (!r) return;
      let a;
      let b;
      if (r === 'month') { a = lastMonthStart; b = lastMonthEnd; }
      if (r === 'quarter') { const qs = Math.floor(m / 3) * 3 - 3; a = new Date(y, qs, 1); b = new Date(y, qs + 3, 0); }
      if (r === 'year') { a = new Date(y, 0, 1); b = new Date(y, 11, 31); }
      dx.querySelector('[name=from]').value = iso(a);
      dx.querySelector('[name=to]').value = iso(b);
    });
    const qs = () => { const f = readForm(dx); return `from=${f.from}&to=${f.to}&payments=${f.payments ? 1 : 0}`; };
    pane.querySelector('#dprev').addEventListener('click', (e) => attempt(async () => {
      const r = await GET(`/datev/preview?${qs()}`);
      pane.querySelector('#dout').innerHTML = r.count ? `
        <div class="table-wrap" style="max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:9px"><table class="table compact">
        <thead><tr><th>Datum</th><th>Beleg</th><th>Text</th><th class="num">Betrag</th><th>S/H</th><th>Konto</th><th>Gegenkonto</th></tr></thead>
        <tbody>${r.rows.map((x) => `<tr><td>${x.date.split('-').reverse().join('.')}</td><td>${esc(x.doc)}</td><td>${esc(x.text)}</td><td class="num">${(Math.abs(x.amount) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td><td>${x.sh}</td><td class="mono">${x.account}</td><td class="mono">${x.contra}</td></tr>`).join('')}</tbody></table></div>
        <p class="small muted">${r.count} Buchung(en)</p>` : emptyState('Keine Buchungen im gewählten Zeitraum', 'invoice');
    }, e.currentTarget));
    pane.querySelector('#dexp').addEventListener('click', () => {
      if (!state.settings.datev?.consultant || !state.settings.datev?.client) return attempt(async () => { throw new Error('Bitte zuerst Berater- und Mandantennummer eintragen und speichern.'); });
      location.href = `/api/datev/export?${qs()}`;
    });
  },

  /* ---------------- Sicherung ---------------- */
  async sicherung(pane) {
    const list = await GET('/backups');
    const size = (b) => `${(b / 1024).toFixed(0)} KB`;
    pane.innerHTML = `
      <div class="card"><div class="card-head"><h2>Datensicherung</h2>
        <button class="btn sm" id="mk">${icon('db')} Jetzt sichern</button>
        <a class="btn sm primary" href="/api/backup/download">${icon('download')} Sicherung herunterladen</a></div>
        <div class="card-body">
          <div class="alert ok" style="margin-bottom:14px">${icon('shield')}<div>Das System erstellt <b>täglich automatisch</b> eine Sicherung im Ordner <code>data/backups</code> (die letzten 30 werden aufbewahrt). Laden Sie zusätzlich regelmäßig eine Sicherung herunter und speichern Sie sie extern (USB-Stick, Cloud) – Rechnungen müssen 8 Jahre aufbewahrt werden (§ 147 AO).</div></div>
          <p class="small muted">Wiederherstellen: Programm beenden, gewünschte Datei nach <code>data/baudah.sqlite</code> kopieren, Programm starten.</p>
        </div>
        ${list.length ? `<table class="table compact"><thead><tr><th>Datei</th><th>Erstellt</th><th class="num">Größe</th><th></th></tr></thead><tbody>
          ${list.map((b) => `<tr><td class="mono">${esc(b.name)}</td><td>${new Date(b.created).toLocaleString('de-DE')}</td><td class="num">${size(b.size)}</td><td class="right"><a class="btn sm" href="/api/backups/${encodeURIComponent(b.name)}">${icon('download')}</a></td></tr>`).join('')}
        </tbody></table>` : emptyState('Noch keine Sicherungen', 'db')}
      </div>`;
    pane.querySelector('#mk').addEventListener('click', (e) => attempt(async () => {
      await POST('/backups');
      ok('Sicherung erstellt.');
      PANES.sicherung(pane);
    }, e.currentTarget));
  },

  /* ---------------- Protokoll ---------------- */
  async protokoll(pane) {
    const [mails, act] = await Promise.all([GET('/mail/log'), GET('/activity')]);
    pane.innerHTML = `
      <div class="card"><div class="card-head"><h2>E-Mail-Protokoll</h2></div>
        ${mails.length ? `<div class="table-wrap"><table class="table compact"><thead><tr><th>Zeit</th><th>Beleg</th><th>Empfänger</th><th>Betreff</th><th>Status</th></tr></thead><tbody>
        ${mails.map((m) => `<tr ${m.document_id ? `class="click" data-doc="${m.document_id}"` : ''}><td class="nowrap">${dateTime(m.created_at)}</td><td>${esc(m.number || '–')}</td><td>${esc(m.to_addr)}</td><td>${esc(m.subject)}<div class="sub">${esc(m.attachments)}</div></td>
          <td>${m.status === 'gesendet' ? '<span class="badge s-bezahlt">gesendet</span>' : `<span class="badge s-ueberfaellig" title="${esc(m.error)}">Fehler</span>`}</td></tr>`).join('')}
        </tbody></table></div>` : emptyState('Noch keine E-Mails versendet', 'mail')}</div>
      <div class="card"><div class="card-head"><h2>Änderungsprotokoll</h2></div>
        <div class="table-wrap"><table class="table compact"><thead><tr><th>Zeit</th><th>Benutzer</th><th>Aktion</th></tr></thead><tbody>
        ${act.map((a) => `<tr><td class="nowrap">${dateTime(a.created_at)}</td><td>${esc(a.user_name || '–')}</td><td>${esc(a.action)} ${esc(a.details)}</td></tr>`).join('')}
        </tbody></table></div></div>`;
    pane.querySelectorAll('[data-doc]').forEach((tr) => tr.addEventListener('click', () => navigate(`#/beleg/${tr.dataset.doc}`)));
  },
};

function validIban(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const r = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let m = 0;
  for (const d of r) m = (m * 10 + Number(d)) % 97;
  return m === 1;
}
