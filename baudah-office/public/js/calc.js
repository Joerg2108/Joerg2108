/*
 * BauDaH Office – gemeinsame Rechenlogik (Browser + Server).
 * Alle Geldbeträge in Cent (Integer), Mengen als Dezimalzahl.
 */
(function (root) {
  'use strict';

  const round = (n) => Math.round(n + Number.EPSILON * Math.sign(n || 0));

  /** Gesamtpreis einer Position in Cent (vor Belegrabatt). */
  function lineTotal(item) {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const disc = Number(item.discount) || 0;
    return round(qty * price * (1 - disc / 100));
  }

  /**
   * Nummeriert Positionen (1, 2 ... bzw. 1.1, 1.2 bei Titeln) und
   * berechnet Titelsummen. Gibt ein neues Array zurück.
   */
  function numberItems(items) {
    let title = 0;
    let pos = 0;
    let currentTitle = null;
    const hasTitles = items.some((i) => i.kind === 'title');
    const out = items.map((it) => ({ ...it }));
    for (const it of out) {
      if (it.kind === 'title') {
        title += 1;
        pos = 0;
        it.posnr = String(title);
        it.titleSum = 0;
        currentTitle = it;
      } else if (it.kind === 'item') {
        pos += 1;
        it.posnr = hasTitles ? `${title || 0}.${pos}` : String(pos);
        it.total = lineTotal(it);
        if (currentTitle && !it.optional) currentTitle.titleSum += it.total;
      }
    }
    return out;
  }

  /**
   * Berechnet die Summen eines Belegs.
   * @param {object} doc   tax_mode ('standard' | '13b'), discount_percent
   * @param {Array} items  Positionen
   * @param {object} [prepaid] { net, vat, gross } bereits abgerechnete Abschläge
   */
  function totals(doc, items, prepaid) {
    const reverse = doc.tax_mode === '13b';
    const docDisc = Number(doc.discount_percent) || 0;
    let subtotal = 0;
    let cost = 0;
    let laborNetRaw = 0;
    const byRate = new Map();

    for (const it of items) {
      if (it.kind !== 'item' || it.optional) continue;
      const t = lineTotal(it);
      subtotal += t;
      cost += round((Number(it.qty) || 0) * (Number(it.cost) || 0));
      const rate = reverse ? 0 : Number(it.vat_rate ?? 19);
      byRate.set(rate, (byRate.get(rate) || 0) + t);
      laborNetRaw += t * ((Number(it.labor_percent) || 0) / 100) * (1 + rate / 100);
    }

    const discount = round(subtotal * docDisc / 100);
    const net = subtotal - discount;

    // Rabatt anteilig auf Steuersätze verteilen
    const vatGroups = [];
    let distributed = 0;
    const rates = [...byRate.keys()].sort((a, b) => b - a);
    rates.forEach((rate, idx) => {
      const base = byRate.get(rate);
      let share = subtotal ? round(discount * base / subtotal) : 0;
      if (idx === rates.length - 1) share = discount - distributed;
      distributed += share;
      const groupNet = base - share;
      vatGroups.push({ rate, net: groupNet, vat: reverse ? 0 : round(groupNet * rate / 100) });
    });

    const vat = vatGroups.reduce((s, g) => s + g.vat, 0);
    const gross = net + vat;
    const labor = round(laborNetRaw * (1 - docDisc / 100));

    const pre = prepaid || { net: 0, vat: 0, gross: 0 };
    return {
      subtotal,
      discount,
      net,
      vatGroups,
      vat,
      gross,
      labor,
      cost,
      margin: net - cost,
      marginPercent: net ? ((net - cost) / net) * 100 : 0,
      prepaidNet: pre.net || 0,
      prepaidVat: pre.vat || 0,
      prepaidGross: pre.gross || 0,
      payable: gross - (pre.gross || 0),
    };
  }

  function formatMoney(cents, withSymbol = true) {
    const v = (Number(cents) || 0) / 100;
    const s = v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return withSymbol ? `${s} €` : s;
  }

  function formatQty(q) {
    const n = Number(q) || 0;
    return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }

  /** "1.234,56" / "1234.56" / "1234,5" -> Cent */
  function parseMoney(str) {
    if (typeof str === 'number') return round(str * 100);
    let s = String(str || '').replace(/[€\s]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? round(n * 100) : 0;
  }

  function parseNumber(str) {
    if (typeof str === 'number') return str;
    let s = String(str || '').replace(/\s/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  const api = { lineTotal, numberItems, totals, formatMoney, formatQty, parseMoney, parseNumber, round };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BauCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
