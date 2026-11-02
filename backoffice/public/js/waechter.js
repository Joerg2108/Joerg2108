'use strict';
// Wächter-App: Service-Worker registrieren (installierbar/Offline-Hülle).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/waechter/sw.js', { scope: '/waechter/' }).catch(function () {});
  });
}
