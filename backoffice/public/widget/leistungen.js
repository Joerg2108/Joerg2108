/*
 * Leistungskatalog-Widget für die Website
 *
 * Einbau:
 *   <div id="leistungen-widget"></div>     (ältere Einbauten mit id="noack-leistungen" funktionieren weiter)
 *   <script src="https://office.ihre-firma.de/api/public/leistungen.js" defer></script>
 *
 * Optionen (data-Attribute am <div>):
 *   data-kategorie="Digital & Marketing"   nur diese Kategorie(n) anzeigen, mehrere mit | trennen
 *   data-filter="nein"                      Kategorie-Schaltflächen ausblenden
 *   data-farbe="#1d4ed8"                    Akzentfarbe
 *   data-kontakt="/kontakt"                 Ziel des Buttons „Anfrage stellen“ (Standard: aus dem Back Office)
 *   data-intro="nein"                       Einleitungstext ausblenden
 *
 * Auf der Kontaktseite füllt dasselbe Skript das Feld "subject" automatisch aus ?betreff=… vor.
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var base = script ? script.src.replace(/\/api\/public\/leistungen\.js.*$/, '') : '';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function money(v) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
  }

  function loadCss() {
    if (document.querySelector('link[data-noack-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + '/api/public/leistungen.css';
    link.setAttribute('data-noack-css', '');
    document.head.appendChild(link);
  }

  // Strukturierte Daten für Suchmaschinen (Schema.org OfferCatalog)
  function jsonLd(data) {
    if (document.querySelector('script[data-noack-ld]')) return;
    var ld = {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: 'Leistungen ' + data.company,
      itemListElement: data.categories.map(function (c) {
        return {
          '@type': 'OfferCatalog',
          name: c.name,
          itemListElement: c.items.map(function (i) {
            var offer = { '@type': 'Offer', itemOffered: { '@type': 'Service', name: i.name, description: i.description, provider: { '@type': 'Organization', name: data.company, url: data.website } } };
            if (i.price != null) offer.priceSpecification = { '@type': 'UnitPriceSpecification', price: i.price, priceCurrency: 'EUR', unitText: i.unit, valueAddedTaxIncluded: false };
            return offer;
          }),
        };
      }),
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-noack-ld', '');
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  function contactLink(url, item) {
    var u = url || '#';
    return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'betreff=' + encodeURIComponent('Anfrage: ' + item.name);
  }

  function render(root, data) {
    var only = (root.getAttribute('data-kategorie') || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    var cats = data.categories.filter(function (c) { return !only.length || only.indexOf(c.name) >= 0; });
    var contact = root.getAttribute('data-kontakt') || data.contact_url;
    var color = root.getAttribute('data-farbe');
    root.textContent = '';
    root.classList.add('nl-root');
    if (color) root.style.setProperty('--nl-accent', color);

    if (data.intro && root.getAttribute('data-intro') !== 'nein') root.appendChild(el('p', 'nl-intro', data.intro));

    var sections = [];
    if (cats.length > 1 && root.getAttribute('data-filter') !== 'nein') {
      var bar = el('div', 'nl-filter');
      bar.setAttribute('role', 'tablist');
      var all = el('button', 'nl-chip nl-active', 'Alle');
      all.type = 'button';
      bar.appendChild(all);
      cats.forEach(function (c) {
        var b = el('button', 'nl-chip', c.name);
        b.type = 'button';
        b.setAttribute('data-cat', c.name);
        bar.appendChild(b);
      });
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        Array.prototype.forEach.call(bar.children, function (x) { x.classList.toggle('nl-active', x === b); });
        var cat = b.getAttribute('data-cat');
        sections.forEach(function (s) { s.hidden = !!cat && s.getAttribute('data-cat') !== cat; });
      });
      root.appendChild(bar);
    }

    cats.forEach(function (c) {
      var sec = el('section', 'nl-section');
      sec.setAttribute('data-cat', c.name);
      sec.appendChild(el('h3', 'nl-cat', c.name));
      var grid = el('div', 'nl-grid');
      c.items.forEach(function (i) {
        var card = el('article', 'nl-card');
        card.appendChild(el('h4', 'nl-name', i.name));
        if (i.description) card.appendChild(el('p', 'nl-desc', i.description));
        var foot = el('div', 'nl-foot');
        if (i.price != null) {
          var price = el('span', 'nl-price', 'ab ' + money(i.price) + ' / ' + i.unit);
          price.appendChild(el('small', null, ' ' + (i.price_note || '')));
          foot.appendChild(price);
        } else {
          foot.appendChild(el('span', 'nl-price nl-onrequest', 'Preis auf Anfrage'));
        }
        if (contact) {
          var a = el('a', 'nl-btn', 'Anfrage stellen');
          a.href = contactLink(contact, i);
          foot.appendChild(a);
        }
        card.appendChild(foot);
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      sections.push(sec);
      root.appendChild(sec);
    });
    jsonLd(data);
  }

  // Kontaktseite: Betreff aus ?betreff=… übernehmen
  function prefillContactForm() {
    var subject = new URLSearchParams(location.search).get('betreff');
    if (!subject) return;
    var field = document.querySelector('form[action*="/api/public/kontakt"] [name="subject"], form[action*="/api/public/kontakt"] [name="betreff"]');
    if (field && !field.value) field.value = subject;
  }

  function init() {
    prefillContactForm();
    var roots = document.querySelectorAll('#leistungen-widget, [data-leistungen-widget], #noack-leistungen, [data-noack-leistungen]');
    if (!roots.length) return;
    loadCss();
    fetch(base + '/api/public/leistungen', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { Array.prototype.forEach.call(roots, function (root) { render(root, data); }); })
      .catch(function () {
        Array.prototype.forEach.call(roots, function (root) {
          root.textContent = 'Unsere Leistungen können gerade nicht geladen werden. Bitte kontaktieren Sie uns direkt.';
        });
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
