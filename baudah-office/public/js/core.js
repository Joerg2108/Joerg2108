/* BauDaH Office – Frontend-Kern: API, Formatierung, Dialoge, Router */
export const C = window.BauCalc;

/* ---------------- Escaping & Formatierung ---------------- */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const money = (c) => C.formatMoney(c);
export const moneyIn = (c) => C.formatMoney(c, false);
export const qty = (q) => C.formatQty(q);
export const date = (s) => (s ? String(s).slice(0, 10).split('-').reverse().join('.') : '');
export const dateTime = (s) => (s ? `${date(s)} ${String(s).slice(11, 16)}` : '');
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const addDays = (s, n) => {
  const d = new Date(`${s || today()}T12:00:00`);
  d.setDate(d.getDate() + Number(n || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const initials = (s) =>
  String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const debounce = (fn, ms = 250) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

export const STATUS = {
  entwurf: 'Entwurf', versendet: 'Versendet', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt',
  abgerechnet: 'Abgerechnet', abgelaufen: 'Abgelaufen', offen: 'Offen', teilbezahlt: 'Teilbezahlt',
  bezahlt: 'Bezahlt', ueberfaellig: 'Überfällig', storniert: 'Storniert',
};
export const TYPE = { angebot: 'Angebot', rechnung: 'Rechnung', abschlag: 'Abschlagsrechnung', schluss: 'Schlussrechnung', storno: 'Stornorechnung' };
export const CUSTOMER_TYPE = { privat: 'Privat', gewerblich: 'Gewerblich', oeffentlich: 'Öffentlich' };
export const statusBadge = (s) => `<span class="badge s-${esc(s)}">${esc(STATUS[s] || s)}</span>`;
export const UNITS = ['Stk', 'm²', 'm³', 'lfm', 'm', 'Std', 'psch', 'kg', 't', 'l', 'Tag', 'Sack', 'Pal'];

/* ---------------- Icons (Lucide-Stil, inline) ---------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  offer: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  invoice: '<path d="M4 3h16v18l-3-2-2.5 2L12 19l-2.5 2L7 19l-3 2z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  catalog: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 15h6M12 12v6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  euro: '<path d="M18 7a7 7 0 1 0 0 10"/><path d="M4 10h10M4 14h10"/>',
  alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  title: '<path d="M4 6h16M4 12h10M4 18h6"/>',
  text: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
  break: '<path d="M3 12h4M10 12h4M17 12h4"/><path d="M6 4v4h12V4M6 20v-4h12v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  map: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
  hash: '<path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  xml: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
};
export const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

/* ---------------- API ---------------- */
export async function api(method, url, body, opts = {}) {
  const init = { method, headers: {}, credentials: 'same-origin' };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`/api${url}`, init);
  if (res.status === 401 && !opts.allow401) {
    location.hash = '#/login';
    throw new Error('Bitte melden Sie sich an.');
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `Fehler ${res.status}`);
  return data;
}
export const GET = (u, o) => api('GET', u, undefined, o);
export const POST = (u, b, o) => api('POST', u, b ?? {}, o);
export const PUT = (u, b) => api('PUT', u, b ?? {});
export const DEL = (u) => api('DELETE', u);

/* ---------------- Toasts ---------------- */
export function toast(msg, type = 'info', ms = 3800) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : type === 'ok' ? 'check' : 'bell')}<div>${esc(msg)}</div>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}
export const ok = (m) => toast(m, 'ok');
export const fail = (e) => toast(e?.message || String(e), 'error', 6000);

/** Führt eine Aktion aus und zeigt Fehler als Toast */
export async function attempt(fn, btn) {
  if (btn) btn.disabled = true;
  try {
    return await fn();
  } catch (e) {
    fail(e);
    return undefined;
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ---------------- Modal ---------------- */
export function modal({ title, body, foot, size = '', onOpen, closeOnBackdrop = true }) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${size}" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="btn ghost icon sm" data-close>${icon('x')}</button></div>
        <div class="modal-body">${body}</div>
        ${foot !== null ? `<div class="modal-foot">${foot ?? '<button class="btn" data-close>Schließen</button>'}</div>` : ''}
      </div>`;
    root.appendChild(wrap);
    const m = wrap.querySelector('.modal');
    let done = false;
    const close = (v) => {
      if (done) return;
      done = true;
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === 'Escape' && root.lastElementChild === wrap) close(undefined);
    };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap && closeOnBackdrop) close(undefined);
    });
    m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(undefined)));
    onOpen?.(m, close);
    setTimeout(() => m.querySelector('[autofocus], input:not([type=hidden]):not([disabled]), textarea, select')?.focus(), 30);
  });
}

export function confirmDialog(text, { title = 'Bitte bestätigen', okText = 'OK', danger = false } = {}) {
  return modal({
    title,
    body: `<p style="margin:0;white-space:pre-line">${esc(text)}</p>`,
    foot: `<button class="btn" data-close>Abbrechen</button><button class="btn ${danger ? 'accent' : 'primary'}" data-ok>${esc(okText)}</button>`,
    onOpen: (m, close) => m.querySelector('[data-ok]').addEventListener('click', () => close(true)),
  }).then((v) => !!v);
}

/** Formular-Dialog: liefert Objekt mit Feldwerten oder undefined */
export function formDialog({ title, body, okText = 'Speichern', size, onOpen, validate }) {
  return modal({
    title,
    size,
    body: `<form class="dlg-form" autocomplete="off">${body}<button type="submit" hidden></button></form>`,
    foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>${esc(okText)}</button>`,
    onOpen: (m, close) => {
      const form = m.querySelector('form');
      const submit = async (e) => {
        e?.preventDefault();
        const data = readForm(form);
        if (validate) {
          const err = await validate(data, form);
          if (err) return toast(err, 'error');
        }
        close(data);
      };
      form.addEventListener('submit', submit);
      m.querySelector('[data-ok]').addEventListener('click', submit);
      onOpen?.(m, close);
    },
  });
}

export function readForm(form) {
  const out = {};
  form.querySelectorAll('[name]').forEach((el) => {
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') {
      if (el.checked) out[el.name] = el.value;
    } else if (el.type === 'file') out[el.name] = el.files[0];
    else out[el.name] = el.value;
  });
  return out;
}

/* ---------------- Formular-Bausteine ---------------- */
export const field = (label, inner, cls = 'c6', hint = '') =>
  `<label class="f ${cls}">${esc(label)}${inner}${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</label>`;
export const input = (name, value = '', attrs = '') => `<input name="${name}" value="${esc(value ?? '')}" ${attrs}>`;
export const textarea = (name, value = '', attrs = '') => `<textarea name="${name}" ${attrs}>${esc(value ?? '')}</textarea>`;
export const select = (name, options, value, attrs = '') =>
  `<select name="${name}" ${attrs}>${Object.entries(options)
    .map(([k, v]) => `<option value="${esc(k)}" ${String(k) === String(value ?? '') ? 'selected' : ''}>${esc(v)}</option>`)
    .join('')}</select>`;
export const checkbox = (name, checked, label) =>
  `<label class="check"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}> ${esc(label)}</label>`;

/* ---------------- Dropdown-Menüs ---------------- */
export function dropdown(btn, items) {
  document.querySelectorAll('.dropdown-menu').forEach((m) => m.remove());
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.innerHTML = items
    .map((it, i) =>
      it === '-' ? '<hr>' : `<button data-i="${i}" class="${it.danger ? 'danger' : ''}" ${it.disabled ? 'disabled style="opacity:.45"' : ''}>${it.icon ? icon(it.icon) : ''}${esc(it.label)}</button>`
    )
    .join('');
  const r = btn.getBoundingClientRect();
  Object.assign(menu.style, { position: 'fixed', top: `${r.bottom + 6}px`, right: `${window.innerWidth - r.right}px` });
  document.body.appendChild(menu);
  const mb = menu.getBoundingClientRect();
  if (mb.bottom > window.innerHeight - 10) menu.style.top = `${Math.max(10, r.top - mb.height - 6)}px`;
  const close = () => {
    menu.remove();
    document.removeEventListener('mousedown', outside, true);
  };
  const outside = (e) => {
    if (!menu.contains(e.target)) close();
  };
  setTimeout(() => document.addEventListener('mousedown', outside, true));
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b || b.disabled) return;
    close();
    items[Number(b.dataset.i)].action?.();
  });
}

/* ---------------- Router ---------------- */
const routes = [];
export function route(pattern, handler) {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)'))}$`);
  routes.push({ re, keys, handler });
}
export function navigate(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
export function matchRoute(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { handler: r.handler, params };
    }
  }
  return null;
}

/** Unsaved-Changes-Schutz */
export const guard = { dirty: false, message: 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?' };
window.addEventListener('beforeunload', (e) => {
  if (guard.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

export const state = { user: null, settings: null };

export function customerName(c) {
  if (!c) return '';
  return c.company || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.display_name || '';
}

export function openPdf(url) {
  window.open(url, '_blank', 'noopener');
}

export function emptyState(text, ic = 'file') {
  return `<div class="empty">${icon(ic)}<div>${esc(text)}</div></div>`;
}
