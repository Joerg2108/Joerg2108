/* Back Office – Client-Skripte (ohne Framework, CSP-konform: keine Inline-Skripte) */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const csrf = () => ($('input[name="_csrf"]') || {}).value || '';
  const eur = (cents) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
  const parseNum = (v) => {
    let s = String(v || '').trim().replace(/[€\s]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // ---------- Theme (hell/dunkel) ----------
  try {
    const t = localStorage.getItem('theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) { /* Speicher evtl. blockiert */ }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (err) { /* ignorieren */ }
  });

  // ---------- Mobile Navigation ----------
  document.addEventListener('click', (e) => {
    const sb = $('#sidebar');
    if (e.target.closest('[data-toggle="sidebar"]')) { sb.classList.toggle('open'); return; }
    if (sb && sb.classList.contains('open') && !e.target.closest('#sidebar')) sb.classList.remove('open');
    // Offene Menüs schließen, wenn außerhalb geklickt wird
    $$('details.menu[open], details.dropdown[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  // ---------- Sicherheitsabfragen ----------
  document.addEventListener('submit', (e) => {
    const msg = e.target.dataset.confirm;
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // ---------- Klickbare Tabellenzeilen ----------
  document.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a, button, input, form, select, label')) location.href = row.dataset.href;
  });

  // ---------- Live-Suche ----------
  const search = $('[data-live-search]');
  if (search) {
    const box = search.parentElement.querySelector('.search-results');
    let timer;
    let sel = -1;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      const q = search.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      timer = setTimeout(async () => {
        const res = await fetch('/suche?format=json&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const items = await res.json();
        sel = -1;
        box.innerHTML = '';
        if (!items.length) {
          box.innerHTML = '<div class="empty">Keine Treffer</div>';
        }
        for (const it of items) {
          const a = document.createElement('a');
          a.href = it.url;
          const strong = document.createElement('strong');
          strong.textContent = it.title;
          const small = document.createElement('small');
          small.textContent = `${it.type} · ${it.sub || ''}`;
          a.append(strong, small);
          box.append(a);
        }
        box.hidden = false;
      }, 200);
    });
    search.addEventListener('keydown', (e) => {
      const links = $$('a', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle('sel', i === sel));
      } else if (e.key === 'Enter' && sel >= 0 && links[sel]) {
        e.preventDefault();
        location.href = links[sel].href;
      } else if (e.key === 'Escape') box.hidden = true;
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.focus(); search.select(); }
    });
  }

  // ---------- Laufende Stoppuhr ----------
  const timerEl = $('[data-timer-start]');
  if (timerEl) {
    const start = new Date(timerEl.dataset.timerStart).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
      timerEl.textContent = `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------- Belegeditor: Positionen & Summen ----------
  const editor = $('[data-items-editor]');
  if (editor) {
    const tbody = $('tbody', editor);
    const tpl = $('#item-template');
    const small = editor.dataset.smallBusiness === '1';
    const products = JSON.parse(($('#products-data') || {}).textContent || '[]');
    const renumber = () => $$('tr', tbody).forEach((tr, i) => { $('.col-pos', tr).textContent = i + 1; });
    const recalc = () => {
      const groups = {};
      let net = 0;
      $$('tr', tbody).forEach((tr) => {
        const qty = parseNum($('[name="item_quantity"]', tr).value);
        const price = Math.round(parseNum($('[name="item_price"]', tr).value) * 100);
        const disc = parseNum($('[name="item_discount"]', tr).value);
        const rate = small ? 0 : parseNum($('[name="item_tax"]', tr).value);
        const line = Math.round(qty * price * (1 - disc / 100));
        $('.col-total', tr).textContent = eur(line);
        net += line;
        groups[rate] = (groups[rate] || 0) + line;
      });
      const box = $('[data-totals]');
      if (!box) return;
      let tax = 0;
      let html = `<div><span>Summe netto</span><span>${eur(net)}</span></div>`;
      Object.keys(groups).map(Number).sort((a, b) => b - a).forEach((r) => {
        const t = Math.round(groups[r] * r / 100);
        tax += t;
        if (!small) html += `<div><span>zzgl. ${String(r).replace('.', ',')} % USt</span><span>${eur(t)}</span></div>`;
      });
      html += `<div class="grand"><span>Gesamt</span><span>${eur(net + tax)}</span></div>`;
      box.innerHTML = html;
    };
    const addRow = (data) => {
      const tr = tpl.content.firstElementChild.cloneNode(true);
      tbody.append(tr);
      if (data) {
        $('[name="item_name"]', tr).value = data.name || '';
        $('[name="item_description"]', tr).value = data.description || '';
        $('[name="item_unit"]', tr).value = data.unit || 'Stk.';
        $('[name="item_price"]', tr).value = ((data.price || 0) / 100).toFixed(2).replace('.', ',');
        $('[name="item_tax"]', tr).value = String(data.tax_rate ?? 19);
        $('[name="item_product_id"]', tr).value = data.id || '';
      }
      renumber();
      recalc();
      $('[name="item_name"]', tr).focus();
    };
    editor.addEventListener('input', recalc);
    editor.addEventListener('change', recalc);
    editor.addEventListener('click', (e) => {
      if (e.target.closest('[data-del-row]')) {
        if ($$('tr', tbody).length > 1) e.target.closest('tr').remove();
        renumber();
        recalc();
      }
      if (e.target.closest('[data-move-up]')) {
        const tr = e.target.closest('tr');
        if (tr.previousElementSibling) tr.parentNode.insertBefore(tr, tr.previousElementSibling);
        renumber();
      }
    });
    $$('[data-add-row]').forEach((b) => b.addEventListener('click', () => addRow()));
    const pick = $('[data-product-pick]');
    if (pick) {
      pick.addEventListener('change', () => {
        const p = products.find((x) => String(x.id) === pick.value);
        if (p) {
          // Leere erste Zeile überschreiben statt neue anlegen
          const rows = $$('tr', tbody);
          const last = rows[rows.length - 1];
          if (last && !$('[name="item_name"]', last).value) last.remove();
          addRow(p);
        }
        pick.value = '';
      });
    }
    // Zahlungsziel aus Kundenstamm übernehmen
    const cust = $('[name="customer_id"]');
    const due = $('[name="due_date"]');
    const issue = $('[name="issue_date"]');
    if (cust && due && issue) {
      cust.addEventListener('change', () => {
        const opt = cust.selectedOptions[0];
        const days = opt && opt.dataset.terms;
        if (days !== undefined && days !== '' && issue.value) {
          const d = new Date(issue.value + 'T12:00:00Z');
          d.setUTCDate(d.getUTCDate() + Number(days));
          due.value = d.toISOString().slice(0, 10);
        }
      });
    }
    recalc();
  }

  // ---------- Kanban: Drag & Drop ----------
  $$('[data-board]').forEach((board) => {
    const url = board.dataset.board; // z. B. /anfragen/{id}/status
    let dragged = null;
    board.addEventListener('dragstart', (e) => {
      dragged = e.target.closest('[data-id]');
      if (dragged) dragged.classList.add('dragging');
    });
    board.addEventListener('dragend', () => { if (dragged) dragged.classList.remove('dragging'); $$('.column', board).forEach((c) => c.classList.remove('drop')); });
    $$('.column', board).forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop'); });
      col.addEventListener('dragleave', () => col.classList.remove('drop'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drop');
        if (!dragged) return;
        $('.col-items', col).append(dragged);
        const body = new URLSearchParams({ status: col.dataset.status, _csrf: csrf() });
        const res = await fetch(url.replace('{id}', dragged.dataset.id), { method: 'POST', body, headers: { Accept: 'application/json' } });
        if (!res.ok) location.reload();
        $$('.column', board).forEach((c) => { const n = $('.col-count', c); if (n) n.textContent = $$('[data-id]', c).length; });
      });
    });
  });

  // ---------- Kopieren-Buttons ----------
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const el = document.getElementById(b.dataset.copy);
    try {
      await navigator.clipboard.writeText(el.value || el.textContent);
      const old = b.textContent;
      b.textContent = 'Kopiert ✓';
      setTimeout(() => { b.textContent = old; }, 1500);
    } catch (err) { /* Zwischenablage nicht verfügbar */ }
  });

  // ---------- Ganztägig-Schalter im Terminformular ----------
  const allDay = $('[name="all_day"]');
  if (allDay) {
    const toggle = () => $$('[data-time-field]').forEach((el) => { el.type = allDay.checked ? 'date' : 'datetime-local'; if (allDay.checked) el.value = el.value.slice(0, 10); else if (el.value.length === 10) el.value += 'T09:00'; });
    allDay.addEventListener('change', toggle);
    if (allDay.checked) toggle();
  }
})();
