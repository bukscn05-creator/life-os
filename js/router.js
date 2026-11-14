export function getRoute() {
  const hash = location.hash.replace('#','').trim();
  return hash || 'hoy';
}

export function onRouteChange(handler) {
  window.addEventListener('hashchange', handler);
}
