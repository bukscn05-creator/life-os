/* Service Worker - cache versionada */
const CACHE_VERSION = 'lifeos-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/theme-init.js',
  './js/app.js',
  './js/router.js',
  './js/db.js',
  './js/ui/render.js',
  './js/ui/components.js',
  './js/core/dates.js',
  './js/core/money.js',
  './js/core/plural.js',
  './js/core/ids.js',
  './js/core/recurrence.js',
  './js/core/budget.js',
  './js/core/storage.js',
  './js/core/habits.js',
  './js/modules/mock-data.js',
  './js/modules/logic.js',
  './js/modules/hoy.js',
  './js/modules/calendario.js',
  './js/modules/vence.js',
  './js/modules/dinero.js',
  './js/modules/suscripciones.js',
  './js/modules/habitos.js',
  './js/modules/salud.js',
  './js/modules/objetivos.js',
  './js/modules/gente.js',
  './js/modules/huchas.js',
  './js/modules/insights.js',
  './js/modules/notas.js',
  './js/modules/ajustes.js',
  './js/integrations/registry.js',
  './js/integrations/calendar.js',
  './js/integrations/sync.js',
  './js/integrations/backup-cloud.js',
  './js/agents/agent-types.js',
  './js/agents/tool-types.js',
  './js/agents/skill-types.js',
  './js/agents/execution-engine.js',
  './js/agents/automation-engine.js',
  './js/agents/execution-logger.js',
  './js/agents/agent-config.js',
  './js/agents/agent-manager.js',
  './js/agents/agent-implementations.js',
  './js/modules/proyectos.js',
  './js/modules/automaciones.js',
  './js/modules/integraciones.js',
  './js/modules/agente.js',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './assets/fonts/Figtree-Regular.ttf',
  './assets/fonts/Figtree-Medium.ttf',
  './assets/fonts/Figtree-SemiBold.ttf',
  './assets/fonts/Figtree-Bold.ttf',
  './assets/fonts/Inter-Regular.ttf',
  './assets/fonts/Inter-Medium.ttf',
  './assets/fonts/Inter-SemiBold.ttf',
  './assets/fonts/Inter-Bold.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Notify clients when a new SW is ready
function notifyClients() {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
    });
  });
}

// Listen for controller change to trigger reload
self.addEventListener('controllerchange', () => {
  // This fires when the SW takes control
});