// AUTOMATIZACIONES — Automation OS UI
// Gestión de automatizaciones con triggers, condiciones y acciones

import { pageHeader, esc, emptyState, statusPill } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';

function automationStatusBadge(enabled) {
  return statusPill(enabled ? 'Activa' : 'Inactiva', enabled ? 'ok' : 'neutral');
}

function triggerLabel(trigger) {
  if (!trigger) return 'Sin disparador';
  const labels = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    on_weekday: 'Días de semana',
    if_amount: 'Si monto supera',
    on_date: 'Fecha específica'
  };
  return labels[trigger.type] || trigger.type;
}

function conditionLabel(condition) {
  if (!condition) return 'Sin condiciones';
  const labels = {
    daily: 'Diario',
    on_weekday: 'En días de semana',
    if_amount: 'Si monto supera umbral',
    on_date: 'En fecha específica'
  };
  return labels[condition.type] || condition.type;
}

function actionLabel(action) {
  if (!action) return 'Sin acción';
  const labels = {
    send_notification: 'Enviar notificación',
    record_transaction: 'Registrar transacción',
    create_task: 'Crear tarea',
    create_event: 'Crear evento',
    update_budget: 'Actualizar presupuesto'
  };
  return labels[action.type] || action.type;
}

export function renderAutomaciones(state) {
  const automations = (state.automations || []).filter(a => !a.deletedAt);
  const activeCount = automations.filter(a => a.enabled !== false).length;
  const rows = automations.map(a => {
    const lastExec = a.lastExecution ? new Date(a.lastExecution).toLocaleDateString('es-ES') : '—';
    return `
      <li class="row-item"><button class="row-tap" data-auto-id="${esc(a.id)}">
        <span class="row-icon" aria-hidden="true">⚡</span>
        <span class="row-main">
          <span class="row-title">${esc(a.name)}</span>
          <span class="row-sub">${esc(a.description || '')} · ${triggerLabel(a.trigger)} → ${actionLabel(a.actions && a.actions[0] || {})}</span>
        </span>
        <span>${automationStatusBadge(a.enabled !== false)}</span>
      </button></li>
    `;
  }).join('');
  return `${pageHeader('Automation OS', `${automations.length} automatizaciones · ${activeCount} activas`, `<button class="btn primary" data-auto-add>Nueva automatización</button>`)}
  <section class="section"><h2 class="section-title">Tus automatizaciones</h2>${rows ? `<ul class="row-list">${rows}</ul>` : emptyState('Sin automatizaciones', 'Crea flujos de trabajo que se ejecuten automáticamente según condiciones.')}</section>

  <section class="section">
    <h2 class="section-title">Ejemplos de automatizaciones</h2>
    <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
      <div class="surface stack"><p style="margin:0;font-size:13px;color:var(--ink-2)"><strong>💰 Presupuesto:</strong> Si gasto mensual supera 80% del presupuesto, enviar alerta</p></div>
      <div class="surface stack"><p style="margin:0;font-size:13px;color:var(--ink-2)"><strong>📅 Tareas vencidas:</strong> Cada día a las 09:00, detectar tareas vencidas y crear recordatorio</p></div>
      <div class="surface stack"><p style="margin:0;font-size:13px;color:var(--ink-2)"><strong>🎯 Objetivos:</strong> Cada domingo, preparar resumen semanal de progreso</p></div>
      <div class="surface stack"><p style="margin:0;font-size:13px;color:var(--ink-2)"><strong>🔄 Suscripciones:</strong> Día antes del cobro, notificar próximo pago</p></div>
    </div>
  </section>`;
}

export function bindAutomaciones(root, ctx) {
  root.querySelectorAll('[data-auto-add]').forEach(b => b.addEventListener('click', () => openEditor(ctx)));
  root.querySelectorAll('[data-auto-id]').forEach(b => b.addEventListener('click', () => {
    const a = (stateAutos(ctx) || []).find(x => x.id === b.dataset.autoId);
    if (a) openDetail(ctx, a);
  }));
}

function stateAutos(ctx) {
  return (ctx.state.automations || []).filter(a => !a.deletedAt);
}

function openEditor(ctx, a = null) {
  const isEdit = !!a?.id;
  const displayDesc = esc(a?.description || '');
  const content = `
    <div class="form-grid">
      <div class="field"><label>Nombre</label><input id="at-name" value="${esc(a?.name || '')}"></div>
      <div class="field"><label>Descripción</label><textarea id="at-desc" rows="3">${displayDesc}</textarea></div>
      <div class="field">
        <label>Disparador (Trigger)</label>
        <select id="at-trigger">
          <option value="daily" ${(a?.trigger?.type || 'daily') === 'daily' ? 'selected' : ''}>Diario</option>
          <option value="weekly" ${a?.trigger?.type === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="monthly" ${a?.trigger?.type === 'monthly' ? 'selected' : ''}>Mensual</option>
          <option value="on_weekday" ${a?.trigger?.type === 'on_weekday' ? 'selected' : ''}>Días de semana</option>
          <option value="if_amount" ${a?.trigger?.type === 'if_amount' ? 'selected' : ''}>Si monto supera umbral</option>
        </select>
      </div>
      <div class="field"><label>Hora (HH:MM)</label><input id="at-time" type="time" value="${esc(a?.trigger?.time || '09:00')}"></div>
      <div class="field"><label>Umbral (€)</label><input id="at-threshold" inputmode="decimal" value="${esc(a?.trigger?.threshold || '')}"></div>
      <div class="field">
        <label>Acción</label>
        <select id="at-action">
          <option value="send_notification" ${(a?.actions && a.actions[0]?.type || 'send_notification') === 'send_notification' ? 'selected' : ''}>Enviar notificación</option>
          <option value="record_transaction" ${a?.actions && a.actions[0]?.type === 'record_transaction' ? 'selected' : ''}>Registrar transacción</option>
          <option value="create_task" ${a?.actions && a.actions[0]?.type === 'create_task' ? 'selected' : ''}>Crear tarea</option>
          <option value="create_event" ${a?.actions && a.actions[0]?.type === 'create_event' ? 'selected' : ''}>Crear evento</option>
        </select>
      </div>
      <div class="field"><label>Mensaje de notificación</label><input id="at-message" value="${esc(a?.actions && a.actions[0]?.message || '')}"></div>
      <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="at-enabled" ${a?.enabled !== false ? 'checked' : ''}> <span>Activada</span></label>
    </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit ? 'Editar automatización' : 'Nueva automatización', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async () => {
    const name = sh.el.querySelector('#at-name').value.trim();
    if (!name) { toast('Introduce un nombre'); return; }
    const triggerType = sh.el.querySelector('#at-trigger').value;
    const trigger = { type: triggerType, time: sh.el.querySelector('#at-time').value };
    if (triggerType === 'if_amount') {
      const thr = Number(sh.el.querySelector('#at-threshold').value);
      if (!Number.isNaN(thr)) trigger.threshold = thr;
    }
    const actionType = sh.el.querySelector('#at-action').value;
    const actions = [{ type: actionType, message: sh.el.querySelector('#at-message').value.trim() }];
    const item = {
      ...(a || {}),
      id: a?.id || uid('auto'),
      name,
      description: sh.el.querySelector('#at-desc').value.trim(),
      trigger,
      conditions: [],
      actions,
      enabled: sh.el.querySelector('#at-enabled').checked,
      updatedAt: new Date().toISOString(),
      createdAt: a?.createdAt || new Date().toISOString()
    };
    try {
      if (ctx.agentManager && ctx.agentManager.automationEngine) {
        await ctx.agentManager.automationEngine.createAutomation(item);
      } else {
        await ctx.save('automations', item);
      }
      toast('Automatización guardada');
      sh.close();
      await ctx.rerender();
    } catch (_e) { toast('No se pudo guardar'); }
  };
}

function openDetail(ctx, a) {
  const lastExec = a.lastExecution ? new Date(a.lastExecution).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
  const content = `
    <div class="stack">
      <div class="kv">
        <div class="kv-row"><span>Disparador</span><strong>${triggerLabel(a.trigger)}</strong></div>
        ${a.trigger.time ? `<div class="kv-row"><span>Hora</span><strong>${esc(a.trigger.time)}</strong></div>` : ''}
        ${a.trigger.threshold != null ? `<div class="kv-row"><span>Umbral</span><strong>${esc(a.trigger.threshold)} €</strong></div>` : ''}
        <div class="kv-row"><span>Acción</span><strong>${actionLabel(a.actions && a.actions[0] || {})}</strong></div>
        <div class="kv-row"><span>Estado</span><strong>${automationStatusBadge(a.enabled !== false)}</strong></div>
        <div class="kv-row"><span>Última ejecución</span><strong>${lastExec}</strong></div>
        <div class="kv-row"><span>Veces ejecutada</span><strong>${esc(a.executionCount || 0)}</strong></div>
        ${a.description ? `<div class="kv-row"><span>Descripción</span><strong>${esc(a.description)}</strong></div>` : ''}
      </div>
      <div class="inline-actions" style="margin-top:12px">
        <button class="btn" data-auto-toggle>${a.enabled !== false ? 'Desactivar' : 'Activar'}</button>
        <button class="btn" data-auto-run>Ejecutar ahora</button>
        <button class="btn" data-auto-edit>Editar</button>
        <button class="btn danger" data-auto-del>Eliminar</button>
      </div>
    </div>`;
  const sh = openSheet({ title: a.name, content });
  sh.el.querySelector('[data-auto-toggle]').onclick = async () => {
    try {
      if (ctx.agentManager && ctx.agentManager.automationEngine) {
        // toggle via engine not implemented directly; save enabled flag
      }
      await ctx.save('automations', { ...a, enabled: !(a.enabled !== false), updatedAt: new Date().toISOString() });
      toast(`Automatización ${a.enabled !== false ? 'desactivada' : 'activada'}`);
      sh.close();
      await ctx.rerender();
    } catch (_e) { toast('No se pudo cambiar estado'); }
  };
  sh.el.querySelector('[data-auto-run]').onclick = async () => {
    try {
      if (ctx.agentManager && ctx.agentManager.automationEngine) {
        await ctx.agentManager.automationEngine.executeAutomation(a.id, { date: todayYMD(), finance: {} });
        toast('Automatización ejecutada');
      } else {
        toast('Motor de automatizaciones no disponible');
      }
      sh.close();
    } catch (_e) { toast('No se pudo ejecutar'); }
  };
  sh.el.querySelector('[data-auto-edit]').onclick = () => { sh.close(); openEditor(ctx, a); };
  sh.el.querySelector('[data-auto-del]').onclick = async () => {
    const name = a.name;
    try {
      await ctx.del('automations', a.id);
      toastUndo(`Automatización "${name}" eliminada`, {
        onUndo: async () => { await ctx.save('automations', a); }
      });
      sh.close();
      await ctx.rerender();
    } catch (_e) { toast('No se pudo eliminar'); }
  };
}