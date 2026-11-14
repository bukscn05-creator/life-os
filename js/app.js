import { getRoute, onRouteChange } from './router.js';
import { renderModule, toast, openSheet, closeSheet, toastUndo } from './ui/render.js';
import { initDb, exportAll, importAll, STORES } from './db.js';
import { loadAllState, saveRecord, softDelete, deleteWithIntegrityCheck, exportBackup as storageExportBackup, importBackup as storageImportBackup, setExternalRefreshCallback } from './core/storage.js';
import { initIntegrations } from './integrations/registry.js';
import { renderHoy, bindHoy } from './modules/hoy.js';
import { renderCalendario, bindCalendario } from './modules/calendario.js';
import { renderVence, bindVence } from './modules/vence.js';
import { renderDinero, bindDinero } from './modules/dinero.js';
import { renderSuscripciones, bindSuscripciones } from './modules/suscripciones.js';
import { renderHabitos, bindHabitos } from './modules/habitos.js';
import { renderSalud, bindSalud } from './modules/salud.js';
import { renderObjetivos, bindObjetivos } from './modules/objetivos.js';
import { renderGente, bindGente } from './modules/gente.js';
import { renderHuchas, bindHuchas } from './modules/huchas.js';
import { renderInsights } from './modules/insights.js';
import { renderProyectos, bindProyectos } from './modules/proyectos.js';
import { renderNotas, bindNotas } from './modules/notas.js';
import { renderAjustes, bindAjustes } from './modules/ajustes.js';
import { renderAgente, bindAgente } from './modules/agente.js';
import { renderAutomaciones, bindAutomaciones } from './modules/automaciones.js';
import { renderIntegraciones, bindIntegraciones } from './modules/integraciones.js';
import { formatTopbarDateTime } from './core/dates.js';
import { esc } from './ui/components.js';

// Importar AgentManager para AGENTIC OS (cargado de forma tolerante a fallos)
import { AgentManager } from './agents/agent-manager.js';

const routes = {
  hoy: { title: 'Hoy', desc: 'Tu día, de un vistazo.', render: renderHoy, bind: bindHoy },
  calendario: { title: 'Agenda', desc: 'Eventos y planificación.', render: renderCalendario, bind: bindCalendario },
  vence: { title: 'Lo que vence', desc: 'Vencimientos y fechas límite.', render: renderVence, bind: bindVence },
  dinero: { title: 'Dinero', desc: 'Presupuesto, movimientos y balance.', render: renderDinero, bind: bindDinero },
  suscripciones: { title: 'Suscripciones', desc: 'Cobros recurrentes y próximos pagos.', render: renderSuscripciones, bind: bindSuscripciones },
  habitos: { title: 'Hábitos', desc: 'Seguimiento y constancia.', render: renderHabitos, bind: bindHabitos },
  salud: { title: 'Salud', desc: 'Citas y registros.', render: renderSalud, bind: bindSalud },
  objetivos: { title: 'Objetivos', desc: 'Metas y progreso.', render: renderObjetivos, bind: bindObjetivos },
  gente: { title: 'Gente', desc: 'Personas importantes.', render: renderGente, bind: bindGente },
  huchas: { title: 'Huchas', desc: 'Ahorro por objetivos.', render: renderHuchas, bind: bindHuchas },
  insights: { title: 'Insights', desc: 'Señales útiles basadas en tus datos.', render: renderInsights },
  notas: { title: 'Notas', desc: 'Apuntes rápidos.', render: renderNotas, bind: bindNotas },
  ajustes: { title: 'Ajustes', desc: 'Apariencia, datos y sistema.', render: renderAjustes, bind: bindAjustes },
  agente: { title: 'Agentic OS', desc: 'Agentes especializados y orquestación.', render: renderAgente, bind: bindAgente },
  proyectos: { title: 'Proyectos', desc: 'Gestión de proyectos con etapas y progreso.', render: renderProyectos, bind: bindProyectos },
  automaciones: { title: 'Automatizaciones', desc: 'Triggers, condiciones y acciones.', render: renderAutomaciones, bind: bindAutomaciones },
  integraciones: { title: 'Integraciones', desc: 'Conexiones con servicios externos.', render: renderIntegraciones, bind: bindIntegraciones }
};

const uiState = { calView: 'mes', calRef: new Date().toISOString().slice(0,10) };
let state = {};
let agentManager = null;

async function loadState() {
  const result = await loadAllState();
  if (!result.ok) throw result.error;
  state = result.state;
  applyThemeFromPrefs();
}

async function refreshState() {
  const result = await loadAllState();
  if (!result.ok) throw result.error;
  state = result.state;
  return state;
}

function applyThemeFromPrefs() {
  try {
    const prefs = (state.preferences || [])[0] || {};
    const mode = prefs.themeMode || localStorage.getItem('lifeos_theme_mode') || 'auto';
    const accent = prefs.themeAccent || localStorage.getItem('lifeos_theme_accent') || 'teal';
    const root = document.documentElement;
    if (mode === 'light' || mode === 'dark' || mode === 'oled') root.setAttribute('data-mode', mode);
    else root.removeAttribute('data-mode');
    root.setAttribute('data-accent', accent);
    const meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#F5F3EE');
  } catch(_e){}
}

async function saveItem(store, item) {
  await saveRecord(store, item);
  await refreshState();
  return item;
}

async function deleteItem(store, id) {
  const result = await deleteWithIntegrityCheck(store, id, state);
  if (!result.ok) {
    const confirmForce = window.confirm(`${result.message}\n\nPulsa Aceptar para forzar eliminación, Cancelar para mantener.`);
    if (!confirmForce) return;
    await softDelete(store, id);
  }
  await refreshState();
}

function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach(a => {
    const active = a.dataset.route === route;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  // mobile more button active if route is in "more"
  const moreBtn = document.getElementById('mobile-more-btn');
  if (moreBtn) {
    const primary = ['hoy','calendario','dinero','habitos'];
    const active = !primary.includes(route);
    moreBtn.classList.toggle('active', active);
  }
}

async function render() {
  try {
    applyThemeFromPrefs();
    const route = getRoute();
    const mod = routes[route] || routes.hoy;
    const root = document.getElementById('module-root');
    setActiveNav(routes[route] ? route : 'hoy');
    const content = mod.render(state, uiState);
    renderModule(root, { title: mod.title, description: mod.desc, content, headerHtml: '' });
    const ctx = {
      state, ui: uiState, routes,
      rerender: render, refreshState,
      save: saveItem, del: deleteItem,
      openSheet, closeSheet, toast,
      navigate: (r) => { location.hash = '#' + r; },
      exportBackup: async () => {
        try {
          const data = await storageExportBackup();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const fileName = `lifeos-copia-${new Date().toISOString().slice(0,10)}.json`;
          const file = new File([blob], fileName, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: 'Copia LIFE OS' }); toast('Copia lista para compartir'); return; } catch(_e){}
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = fileName;
          document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
          toast('Copia de seguridad exportada');
        } catch (_e) { toast('No se pudo exportar la copia'); }
      },
      importBackup: async (file) => {
        try {
          if (!file) return;
          const text = await file.text();
          const payload = JSON.parse(text);
          const mode = window.confirm('¿Importar en modo "Combinar" (mantiene lo más reciente)?\n\nPulsa Cancelar para "Reemplazar todo".') ? 'merge' : 'replace';
          await storageImportBackup(payload, { mode });
          await refreshState();
          await render();
          toast('Copia restaurada correctamente');
        } catch (_e) { toast('No se pudo restaurar: archivo inválido'); }
      },
      resetAll: async () => {
        try {
          const ok = window.confirm('¿RESTABLECER TODOS LOS DATOS?\n\nEsta acción borra todo irreversiblemente. Se hará una copia de seguridad automática antes.');
          if (!ok) return;
          await storageExportBackup();
          const empty = { app: 'LIFE_OS', schemaVersion: 2, stores: {} };
          for (const s of STORES) { if (s !== 'migrationBackups') empty.stores[s] = []; }
          await importAll(empty, { overwrite: true });
          await refreshState();
          await render();
          toast('Datos restablecidos');
        } catch(_e){ toast('No se pudo restablecer'); }
      }
    };
    if (mod.bind) mod.bind(root, ctx);
    const heading = root.querySelector('.page-title');
    if (heading) { if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex','-1'); try { heading.focus({ preventScroll: true }); } catch(_e){ heading.focus(); } }
  } catch (_e) {
    const root = document.getElementById('module-root');
    if (root) root.innerHTML = `<div class="surface"><h1 class="page-title" tabindex="-1">No se pudo cargar</h1><p class="muted">Ha ocurrido un error al mostrar esta sección.</p></div>`;
  }
}

function setupShell() {
  const collapse = document.getElementById('sidebar-collapse');
  const shell = document.getElementById('app-shell');
  if (collapse && shell) {
    const saved = localStorage.getItem('lifeos_sidebar') === 'collapsed';
    if (saved) { shell.classList.add('sidebar-collapsed'); collapse.setAttribute('aria-expanded','false'); }
    collapse.addEventListener('click', () => {
      const c = shell.classList.toggle('sidebar-collapsed');
      collapse.setAttribute('aria-expanded', String(!c));
      try { localStorage.setItem('lifeos_sidebar', c ? 'collapsed' : 'expanded'); } catch(_e){}
    });
  }
  const moreBtn = document.getElementById('mobile-more-btn');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => openMoreSheet());
  }
  const fab = document.getElementById('fab-add');
  if (fab) fab.addEventListener('click', () => openQuickCapture());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'n' || e.key === 'N') {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      openQuickCapture();
    }
  });
}

function openMoreSheet() {
  const more = [
    ['vence','Lo que vence'],['suscripciones','Suscripciones'],['huchas','Huchas'],
    ['salud','Salud'],['objetivos','Objetivos'],['gente','Gente'],
    ['notas','Notas'],['insights','Insights'],['ajustes','Ajustes'],['agente','Agentic OS'],['proyectos','Proyectos'],['automaciones','Automatizaciones'],['integraciones','Integraciones']
  ];
  const items = more.map(([r,l]) => `<li class="row-item"><a class="row-tap" href="#${r}" data-more-route="${r}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(l)}</span></span><span class="row-chevron">›</span></a></li>`).join('');
  openSheet({ title: 'Más', content: `<ul class="row-list">${items}</ul>` });
  document.querySelectorAll('[data-more-route]').forEach(a => a.addEventListener('click', () => closeSheet()));
}

function openQuickCapture() {
  const opts = [
    ['gasto','Gasto'],['ingreso','Ingreso'],['evento','Evento'],['nota','Nota'],['vencimiento','Vencimiento']
  ];
  const items = opts.map(([k,l]) => `<li class="row-item"><button type="button" class="row-tap" data-quick="${k}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(l)}</span></span><span class="row-chevron">›</span></button></li>`).join('');
  openSheet({ title: 'Añadir', content: `<ul class="row-list">${items}</ul><p class="field-help" style="margin-top:12px">Acceso rápido. Puedes completar los detalles en cada sección.</p>` });
  document.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.quick;
    closeSheet();
    if (k === 'gasto' || k === 'ingreso') location.hash = '#dinero';
    else if (k === 'evento') location.hash = '#calendario';
    else if (k === 'nota') location.hash = '#notas';
    else if (k === 'vencimiento') location.hash = '#vence';
  }));
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateToast();
          }
        });
      }
    });
    
    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
        showUpdateToast();
      }
    });
  } catch(_e){}
}

function showUpdateToast() {
  toastUndo('Nueva versión disponible', {
    undoLabel: 'Actualizar',
    onUndo: () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    duration: 30000
  });
}

async function boot() {
  try {
    setupShell();
    setExternalRefreshCallback(async () => {
      try {
        await refreshState();
        if (agentManager) await agentManager.loadState(state);
        await render();
      } catch (_e) {}
    });
    await loadState();
    try { await initIntegrations(); } catch(_e){}
    
    // Inicializar AGENTIC OS de forma tolerante a fallos
    // La aplicación debe seguir funcionando aunque AGENTIC OS falle
    try {
      agentManager = new AgentManager();
      await agentManager.boot();
      await agentManager.loadState(state);
    } catch (agentError) {
    }
    
    await render();
    onRouteChange(render);
    registerSW();
  } catch (_e) {
    toast('Error al iniciar LIFE OS');
    const root = document.getElementById('module-root');
    if (root) root.innerHTML = `<div class="surface"><h1 class="page-title">No se pudo iniciar</h1><p class="muted">Comprueba que el almacenamiento local esté disponible.</p></div>`;
  }
}

boot();
