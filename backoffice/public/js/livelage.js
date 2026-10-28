'use strict';
// Live-Lage: lädt die Seite periodisch neu und tauscht nur den Live-Bereich aus.
(function () {
  var host = document.getElementById('lage-live');
  if (!host) return;
  var url = host.getAttribute('data-poll') || location.pathname;
  var stamp = document.getElementById('live-stamp');
  var state = document.getElementById('live-state');
  var busy = false;

  function tick() {
    if (busy || document.hidden) return;
    busy = true;
    fetch(url, { headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (html) {
        var fresh = new DOMParser().parseFromString(html, 'text/html').getElementById('lage-live');
        if (fresh) host.innerHTML = fresh.innerHTML;
        if (stamp) stamp.textContent = 'Stand ' + new Date().toLocaleTimeString('de-DE');
        if (state) state.classList.remove('grey');
      })
      .catch(function () { if (state) state.classList.add('grey'); })
      .then(function () { busy = false; });
  }

  setInterval(tick, 12000);
})();
