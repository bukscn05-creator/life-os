// INTEGRACIONES — Plugin & Integration OS UI
// Gestión de integraciones con servicios externos (Gmail, Google Calendar, GitHub, Notion, etc.)

import { pageHeader, esc, emptyState, statusPill } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import {
  listIntegrations,
  getIntegration,
  connectIntegration,
  disconnectIntegration,
  syncIntegration
} from '../integrations/registry.js';

const CATEGORY_LABELS = {
  comunicacion: 'Comunicación',
  calendario: 'Calendario',
  desarrollo: 'Desarrollo',
  conocimiento: 'Conocimiento',
  finanzas: 'Finanzas',
  ia: 'Inteligencia Artificial',
  productividad: 'Productividad',
  sistema: 'Sistema'
};

const CATEGORY_ICONS = {
  comunicacion: '📧',
  calendario: '📅',
  desarrollo: '💻',
  conocimiento: '📚',
  finanzas: '💰',
  ia: '🤖',
  productividad: '✅',
  sistema: '⚙️'
};

const STATUS_LABELS = {
  connected: 'Conectada',
  disconnected: 'Desconectada',
  error: 'Error',
  planned: 'Planificada'
};

const STATUS_TONES = {
  connected: 'ok',
  disconnected: 'neutral',
  error: 'danger',
  planned: 'neutral'
};

function integrationCard(int) {
  const categoryLabel = CATEGORY_LABELS[int.category] || int.category;
  const categoryIcon = CATEGORY_ICONS[int.category] || '⚙️';
  const statusLabel = STATUS_LABELS[int.status] || int.status;
  const statusTone = STATUS_TONES[int.status] || 'neutral';
  const lastSync = int.lastSync ? new Date(int.lastSync).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
  const capabilities = (int.capabilities || []).join(', ');
  const permissions = (int.permissions || []).join(', ');
  const authType = int.authType || '—';
  const requiresAuth = int.requiresAuth ? 'Sí' : 'No';

  return `
    <div class="surface stack integration-card" data-int-id="${esc(int.id)}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="font-size:24px">${categoryIcon}</div>
        ${statusPill(statusLabel, statusTone)}
      </div>
      <h3 style="margin:4px 0 2px 0;font-size:16px;color:var(--ink)">${esc(int.name)}</h3>
      <p style="margin:0 0 10px 0;font-size:13px;color:var(--ink-3)">${esc(int.description)}</p>
      <div class="kv" style="margin-bottom:10px">
        <div class="kv-row"><span>Categoría</span><strong>${esc(categoryLabel)}</strong></div>
        <div class="kv-row"><span>Estado</span><strong>${statusLabel}</strong></div>
        <div class="kv-row"><span>Última sincronización</span><strong>${lastSync}</strong></div>
        <div class="kv-row"><span>Requiere auth</span><strong>${requiresAuth}</strong></div>
        <div class="kv-row"><span>Tipo auth</span><strong>${esc(authType)}</strong></div>
      </div>
      <div style="margin-bottom:10px">
        <p style="margin:0 0 4px 0;font-size:12px;color:var(--ink-3)">Capacidades</p>
        <p style="margin:0;font-size:12px;color:var(--ink-2)">${esc(capabilities)}</p>
      </div>
      <div style="margin-bottom:10px">
        <p style="margin:0 0 4px 0;font-size:12px;color:var(--ink-3)">Permisos</p>
        <p style="margin:0;font-size:12px;color:var(--ink-2)">${esc(permissions)}</p>
      </div>
      <div class="inline-actions" style="margin-top:10px">
        ${int.connected
          ? `<button class="btn" data-int-sync="${esc(int.id)}">Sincronizar</button>
             <button class="btn" data-int-disconnect="${esc(int.id)}">Desconectar</button>`
          : `<button class="btn primary" data-int-connect="${esc(int.id)}">Conectar</button>`}
      </div>
      ${int.errors ? `<p style="margin:8px 0 0 0;font-size:12px;color:var(--danger)">${esc(int.errors)}</p>` : ''}
    </div>
  `;
}

export function renderIntegraciones(state) {
  const integrations = listIntegrations();
  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;

  return `${pageHeader('Plugin & Integration OS', `${connectedCount}/${totalCount} conectadas`, '')}
  <section class="section">
    <h2 class="section-title">Integraciones disponibles</h2>
    <div class="stack" style="gap:10px">
      ${integrations.map(integrationCard).join('')}
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">Información de seguridad</h2>
    <div class="surface stack">
      <ul class="row-list">
        <li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">🔒</span><span class="row-main"><span class="row-title">Sin credenciales en texto plano</span><span class="row-sub">Los secretos nunca se almacenan sin cifrar</span></span></div></li>
        <li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">🚫</span><span class="row-main"><span class="row-title">Sin conexiones bancarias reales</span><span class="row-sub">Los servicios financieros son solo de consulta (solo lectura)</span></span></div></li>
        <li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">⚠️</span><span class="row-main"><span class="row-title">Autorización explícita requerida</span><span class="row-sub">Ninguna integración se conecta sin tu permiso</span></span></div></li>
        <li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">📡</span><span class="row-main"><span class="row-title">Modo simulado</span><span class="row-sub">Las integraciones están en modo de demostración. No se establecen conexiones reales a servicios externos</span></span></div></li>
      </ul>
    </div>
  </section>`;
}

export function bindIntegraciones(root, ctx) {
  root.querySelectorAll('[data-int-connect]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.intConnect;
      try {
        const result = await connectIntegration(id);
        toast(`${result.name} conectada`);
        await ctx.rerender();
      } catch (_e) { toast('No se pudo conectar'); }
    });
  });

  root.querySelectorAll('[data-int-disconnect]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.intDisconnect;
      try {
        const result = await disconnectIntegration(id);
        toast(`${result.name} desconectada`);
        await ctx.rerender();
      } catch (_e) { toast('No se pudo desconectar'); }
    });
  });

  root.querySelectorAll('[data-int-sync]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.intSync;
      try {
        const result = await syncIntegration(id);
        toast(`${result.name} sincronizada`);
        await ctx.rerender();
      } catch (_e) { toast('No se pudo sincronizar'); }
    });
  });
}