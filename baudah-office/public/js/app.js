import { esc, icon, GET, POST, route, matchRoute, navigate, state, guard, fail, debounce, money, date, statusBadge, initials, dropdown } from './core.js';
import { dashboardView } from './views/dashboard.js';
import { documentListView } from './views/documents.js';
import { editorView, newDocument } from './views/editor.js';
import { customerListView, customerDetailView, customerDialog } from './views/customers.js';
import { articleListView } from './views/articles.js';
import { settingsView } from './views/settings.js';

const app = document.getElementById('app');

/* ---------------- Routen ---------------- */
route('/', dashboardView);
route('/angebote', (p, v) => documentListView({ kind: 'angebote' }, v));
route('/rechnungen', (p, v) => documentListView({ kind: 'rechnungen' }, v));
route('/beleg/:id', editorView);
route('/neu/:type', (p, v) => newDocument(p.type, v));
route('/neu/:type/:customer', (p, v) => newDocument(p.type, v, p.customer));
route('/kunden', customerListView);
route('/kunden/:id', customerDetailView);
route('/leistungen', articleListView);
route('/einstellungen', settingsView);
route('/einstellungen/:tab', settingsView);

/* ---------------- Login & Setup ---------------- */
const FEATURES = [
  'Angebote im Bau-LV-Stil mit Titeln & Eventualpositionen',
  'Rechnung, Abschlags- & Schlussrechnung per Klick',
  'E-Mail-Versand mit PDF & XRechnung',
  '§ 13b UStG und § 35a EStG automatisch',
  'Kundenstamm, Leistungskatalog & Mahnwesen',
];

function authLayout(inner, company) {
  return `
  <div class="auth">
    <div class="hero">
      <div>
        <div class="name">BauDaH</div>
        <div class="claim">Office · Meisterbetrieb</div>
        <ul>${FEATURES.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
      </div>
      <div style="opacity:.7;font-size:13px;position:relative;z-index:1">${esc(company || 'BauDaH Bauunternehmen')} · Naunhof</div>
    </div>
    <div class="panel">${inner}</div>
  </div>`;
}

function loginView(status) {
  app.innerHTML = authLayout(
    `<form id="login">
      <div><h1>${status.demo ? 'BauDaH Office testen' : 'Willkommen zurück'}</h1><p class="muted" style="margin:6px 0 0">${status.demo ? 'Die Bürosoftware für Handwerksbetriebe – kostenlos und unverbindlich ausprobieren.' : 'Bitte melden Sie sich an.'}</p></div>
      ${status.demo ? `<div class="alert ok">${icon('check')}<div><b>Online-Demo</b> – einfach auf „Anmelden“ klicken.<br>Benutzer <code>${esc(status.demo.user)}</code> · Passwort <code>${esc(status.demo.password)}</code></div></div>` : ''}
      <label class="f">Benutzername<input name="username" autocomplete="username" autofocus required value="${esc(status.demo?.user || '')}"></label>
      <label class="f">Passwort<input name="password" type="password" autocomplete="current-password" required value="${esc(status.demo?.password || '')}"></label>
      <button class="btn primary block" style="height:42px">Anmelden</button>
    </form>`,
    status.company
  );
  const f = document.getElementById('login');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await POST('/login', { username: f.username.value, password: f.password.value }, { allow401: true });
      location.hash = '#/';
      boot();
    } catch (err) {
      fail(err);
    }
  });
}

function setupView() {
  app.innerHTML = authLayout(`
    <form id="setup" style="width:min(460px,100%)">
      <div><h1>Ersteinrichtung</h1><p class="muted" style="margin:6px 0 0">Legen Sie das Administrator-Konto an. Firmendaten sind bereits von der Visitenkarte übernommen und können später unter „Einstellungen“ ergänzt werden.</p></div>
      <label class="f">Ihr Name<input name="name" value="Daniel Hönemann" required></label>
      <label class="f">Benutzername<input name="username" value="daniel" required autocomplete="username"></label>
      <label class="f">Passwort <span class="hint">mindestens 8 Zeichen</span><input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
      <label class="f">Passwort wiederholen<input name="password2" type="password" minlength="8" required autocomplete="new-password"></label>
      <button class="btn primary block" style="height:42px">Einrichtung abschließen</button>
    </form>`);
  const f = document.getElementById('setup');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (f.password.value !== f.password2.value) return fail(new Error('Die Passwörter stimmen nicht überein.'));
    try {
      await POST('/setup', { name: f.name.value, username: f.username.value, password: f.password.value });
      location.hash = '#/einstellungen/firma';
      boot();
    } catch (err) {
      fail(err);
    }
  });
}

/* ---------------- Shell ---------------- */
const NAV = [
  ['#/', 'home', 'Übersicht'],
  ['group', 'Verkauf'],
  ['#/angebote', 'offer', 'Angebote'],
  ['#/rechnungen', 'invoice', 'Rechnungen', 'overdue'],
  ['group', 'Stammdaten'],
  ['#/kunden', 'users', 'Kunden'],
  ['#/leistungen', 'catalog', 'Leistungskatalog'],
  ['group', 'System'],
  ['#/einstellungen', 'settings', 'Einstellungen'],
];

function renderShell() {
  const u = state.user;
  app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brandmark"><div class="name">BauDaH</div><div class="sub">Office · Meisterbetrieb</div></div>
      <nav class="nav">
        ${NAV.map((n) => (n[0] === 'group' ? `<div class="group">${n[1]}</div>` : `<a href="${n[0]}" data-nav="${n[0]}">${icon(n[1])}<span>${n[2]}</span>${n[3] ? `<span class="badge hidden" id="nav-${n[3]}"></span>` : ''}</a>`)).join('')}
      </nav>
      <div class="me">
        <div class="avatar">${esc(initials(u.name || u.username))}</div>
        <div class="who"><b>${esc(u.name || u.username)}</b><span class="muted">${u.role === 'admin' ? 'Administrator' : 'Benutzer'}</span></div>
        <button title="Abmelden" id="logout">${icon('logout')}</button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="search">
          ${icon('search')}
          <input id="gsearch" placeholder="Suchen: Kunde, Angebot, Rechnung, Bauvorhaben …" autocomplete="off">
          <kbd>Strg K</kbd>
          <div class="search-results hidden" id="gresults"></div>
        </div>
        <div class="spacer"></div>
        <button class="btn primary" id="new-btn">${icon('plus')} Neu</button>
      </header>
      <main id="view"></main>
    </div>
  </div>`;

  document.getElementById('logout').addEventListener('click', async () => {
    await POST('/logout');
    state.user = null;
    location.hash = '#/login';
    boot();
  });
  document.getElementById('new-btn').addEventListener('click', (e) =>
    dropdown(e.currentTarget, [
      { label: 'Neues Angebot', icon: 'offer', action: () => navigate('#/neu/angebot') },
      { label: 'Neue Rechnung', icon: 'invoice', action: () => navigate('#/neu/rechnung') },
      '-',
      { label: 'Neuer Kunde', icon: 'user', action: async () => {
        const id = await customerDialog();
        if (id) navigate(`#/kunden/${id}`);
      } },
    ])
  );
  initSearch();
}

function initSearch() {
  const inp = document.getElementById('gsearch');
  const box = document.getElementById('gresults');
  let sel = -1;
  const run = debounce(async () => {
    const q = inp.value.trim();
    if (q.length < 2) return box.classList.add('hidden');
    try {
      const r = await GET(`/search?q=${encodeURIComponent(q)}`);
      const html = [];
      if (r.customers.length) {
        html.push('<div class="sec">Kunden</div>');
        for (const c of r.customers) html.push(`<a href="#/kunden/${c.id}">${icon('user')}<span><b>${esc(c.display_name)}</b> <span class="muted">· ${esc(c.number)} · ${esc(c.city || '')}</span></span></a>`);
      }
      if (r.documents.length) {
        html.push('<div class="sec">Belege</div>');
        for (const d of r.documents) html.push(`<a href="#/beleg/${d.id}">${icon(d.type === 'angebot' ? 'offer' : 'invoice')}<span style="flex:1"><b>${esc(d.label)} ${esc(d.number || 'Entwurf')}</b> <span class="muted">· ${esc(d.customer_name)} · ${esc(d.project || d.subject || '')}</span></span>${statusBadge(d.display_status)}</a>`);
      }
      box.innerHTML = html.join('') || '<div class="empty" style="padding:18px">Keine Treffer</div>';
      box.classList.remove('hidden');
      sel = -1;
    } catch (e) {
      /* still */
    }
  }, 200);
  inp.addEventListener('input', run);
  inp.addEventListener('keydown', (e) => {
    const links = [...box.querySelectorAll('a')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = Math.max(0, Math.min(links.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      links.forEach((l, i) => l.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter' && links[Math.max(0, sel)]) {
      location.hash = links[Math.max(0, sel)].getAttribute('href');
      box.classList.add('hidden');
      inp.value = '';
      inp.blur();
    } else if (e.key === 'Escape') {
      box.classList.add('hidden');
      inp.blur();
    }
  });
  box.addEventListener('click', () => {
    box.classList.add('hidden');
    inp.value = '';
  });
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.search')) box.classList.add('hidden');
  });
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('gsearch')?.focus();
  }
});

async function updateBadges() {
  try {
    const d = await GET('/dashboard');
    const b = document.getElementById('nav-overdue');
    if (b) {
      b.textContent = d.overdue.count;
      b.classList.toggle('hidden', !d.overdue.count);
      b.title = `${d.overdue.count} überfällige Rechnung(en)`;
    }
  } catch {
    /* ignorieren */
  }
}

/* ---------------- Navigation ---------------- */
let lastHash = location.hash;
async function render() {
  const path = (location.hash || '#/').slice(1) || '/';
  if (guard.dirty && location.hash !== lastHash) {
    if (!window.confirm(guard.message)) {
      history.replaceState(null, '', lastHash);
      return;
    }
    guard.dirty = false;
  }
  lastHash = location.hash;
  if (!state.user) return boot();
  if (!document.getElementById('view')) renderShell();
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const href = a.dataset.nav.slice(1);
    const active = href === '/' ? path === '/' : path.startsWith(href) ||
      (href === '/angebote' && /^\/(neu\/angebot)/.test(path)) || (href === '/rechnungen' && /^\/neu\/rechnung/.test(path));
    a.classList.toggle('active', active);
  });
  const m = matchRoute(path);
  const view = document.getElementById('view');
  window.scrollTo(0, 0);
  if (!m) {
    view.innerHTML = '<div class="page"><h1>Seite nicht gefunden</h1></div>';
    return;
  }
  try {
    await m.handler(m.params, view);
  } catch (e) {
    view.innerHTML = `<div class="page"><div class="alert danger">${icon('alert')}<div>${esc(e.message)}</div></div></div>`;
  }
  updateBadges();
}
window.addEventListener('hashchange', render);

async function boot() {
  try {
    const s = await GET('/status', { allow401: true });
    if (s.setup) return setupView();
    if (!s.user) return loginView(s);
    state.user = s.user;
    state.demo = s.demo;
    state.settings = await GET('/settings');
    if (location.hash === '#/login' || !location.hash) location.hash = '#/';
    document.getElementById('view') ? render() : (renderShell(), render());
  } catch (e) {
    app.innerHTML = `<div class="boot">Server nicht erreichbar: ${esc(e.message)}</div>`;
  }
}

// Kleine Helfer global für Debugging im Browser
window.BauDaH = { money, date };
boot();
