import { pageHeader, esc } from '../ui/components.js';
import { openSheet } from '../ui/render.js';
import { todayYMD } from '../core/dates.js';

const APP_VERSION = '1.0.0';

function section(title, body) {
  return `<section class="section"><h2 class="section-title">${esc(title)}</h2><div class="surface stack">${body}</div></section>`;
}

export function renderAjustes(state) {
  const prefs = (state.preferences && state.preferences[0]) || {};
  const mode = prefs.themeMode || localStorage.getItem('lifeos_theme_mode') || 'auto';
  const accent = prefs.themeAccent || localStorage.getItem('lifeos_theme_accent') || 'teal';
  const modeOpts = [['auto','Automático según el sistema'],['light','Claro'],['dark','Oscuro'],['oled','Negro OLED']];
  const accentOpts = [['teal','Verde azulado'],['indigo','Índigo'],['plum','Ciruela'],['orange','Naranja'],['graphite','Grafito']];
  const radio = (name, opts, val) => opts.map(([v,l])=>`<label style="display:flex;align-items:center;gap:10px;min-height:36px"><input type="radio" name="${name}" value="${v}" ${val===v?'checked':''}> <span>${esc(l)}</span></label>`).join('');
  return `
    ${pageHeader('Ajustes', 'Apariencia, datos y sistema')}
    <div class="stack">
      ${section('Apariencia', `
        <div class="field"><label>Modo</label><div class="stack" style="gap:4px" id="theme-mode-group">${radio('theme-mode', modeOpts, mode)}</div></div>
        <div class="field"><label>Color de acento</label><div class="stack" style="gap:4px" id="theme-accent-group">${radio('theme-accent', accentOpts, accent)}</div></div>
      `)}
      ${section('Datos', `
        <p class="muted" style="margin:0;font-size:14px">Tus datos se guardan solo en este dispositivo.</p>
        <div class="inline-actions">
          <button class="btn" type="button" data-action="export">Exportar copia</button>
          <button class="btn" type="button" data-action="import">Importar copia</button>
          <button class="btn danger" type="button" data-action="reset">Restablecer todo</button>
        </div>
        <p class="field-help">Importar puede reemplazar o combinar datos según la opción elegida. Se recomienda exportar antes.</p>
        <input type="file" id="import-file" accept="application/json" hidden>
      `)}
      ${section('Privacidad', `<p style="margin:0">LIFE OS funciona de forma local y sin conexión. No envía datos a otros servicios ni usa analítica. Tus datos permanecen en este dispositivo.</p>`)}
      ${section('Diagnóstico', `
        <div class="kv">
          <div class="kv-row"><span>Versión</span><strong>${APP_VERSION}</strong></div>
          <div class="kv-row"><span>Zona horaria</span><strong>Europe/Berlin</strong></div>
          <div class="kv-row"><span>Moneda</span><strong>EUR</strong></div>
          <div class="kv-row"><span>Fecha local</span><strong>${esc(todayYMD())}</strong></div>
        </div>
        <div class="inline-actions"><button class="btn" type="button" data-action="copy-diag">Copiar diagnóstico</button></div>
      `)}
      ${section('Instalar', `<p style="margin:0;font-size:14px;color:var(--ink-2)">En iPhone (Safari): Compartir → “Añadir a pantalla de inicio”. En Chromebook/Chrome: usa la opción “Instalar app” del navegador cuando esté disponible. Los datos de la app instalada son independientes del navegador.</p>`)}
    </div>`;
}

function applyTheme(mode, accent) {
  const root = document.documentElement;
  try {
    localStorage.setItem('lifeos_theme_mode', mode);
    localStorage.setItem('lifeos_theme_accent', accent);
  } catch(_e){}
  if (mode === 'light' || mode === 'dark' || mode === 'oled') root.setAttribute('data-mode', mode);
  else root.removeAttribute('data-mode');
  root.setAttribute('data-accent', accent || 'teal');
  const meta = document.getElementById('meta-theme-color');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#F5F3EE';
    meta.setAttribute('content', bg);
  }
}

export function bindAjustes(root, ctx) {
  if (!root) return;
  root.querySelectorAll('input[name="theme-mode"]').forEach(r => r.addEventListener('change', async () => {
    const mode = root.querySelector('input[name="theme-mode"]:checked')?.value || 'auto';
    const accent = root.querySelector('input[name="theme-accent"]:checked')?.value || 'teal';
    applyTheme(mode, accent);
    try { const prefs = (ctx.state.preferences||[])[0] || {id:'pref'}; await ctx.save('preferences', { ...prefs, id:'pref', themeMode: mode, themeAccent: accent }); } catch(_e){}
  }));
  root.querySelectorAll('input[name="theme-accent"]').forEach(r => r.addEventListener('change', async () => {
    const mode = root.querySelector('input[name="theme-mode"]:checked')?.value || 'auto';
    const accent = root.querySelector('input[name="theme-accent"]:checked')?.value || 'teal';
    applyTheme(mode, accent);
    try { const prefs = (ctx.state.preferences||[])[0] || {id:'pref'}; await ctx.save('preferences', { ...prefs, id:'pref', themeMode: mode, themeAccent: accent }); } catch(_e){}
  }));
  root.querySelector('[data-action="export"]')?.addEventListener('click', () => ctx.exportBackup && ctx.exportBackup());
  const file = root.querySelector('#import-file');
  root.querySelector('[data-action="import"]')?.addEventListener('click', () => file && file.click());
  file?.addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f && ctx.importBackup) ctx.importBackup(f); e.target.value=''; });
  root.querySelector('[data-action="reset"]')?.addEventListener('click', async () => {
    const ok = window.confirm('Esto borrará todos los datos locales de esta app en este dispositivo. Esta acción no se puede deshacer. ¿Continuar?');
    if (!ok) return;
    try { if (ctx.resetAll) await ctx.resetAll(); } catch(_e){}
  });
  root.querySelector('[data-action="copy-diag"]')?.addEventListener('click', async () => {
    const info = { app:'LIFE OS', version: APP_VERSION, tz:'Europe/Berlin', date: todayYMD(), ua: navigator.userAgent };
    const text = JSON.stringify(info, null, 2);
    try { await navigator.clipboard.writeText(text); } catch(_e){}
  });
}
