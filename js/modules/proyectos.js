// PROYECTOS — Projects OS
// Gestión de proyectos con etapas, tareas, progreso y colaboración de agentes

import { pageHeader, esc, fmtEUR, emptyState, progressBar, statusPill, getIcon } from '../ui/components.js';
import { openSheet, toast, toastUndo } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';

const PROJECT_STATUSES = [
  ['planning', 'Planificación'],
  ['active', 'Activo'],
  ['paused', 'Pausado'],
  ['completed', 'Completado'],
  ['cancelled', 'Cancelado']
];

function statusBadge(status) {
  const labels = { planning: 'Planificación', active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado' };
  const tones = { planning: 'neutral', active: 'blue', paused: 'orange', completed: 'ok', cancelled: 'danger' };
  return statusPill(labels[status] || status, tones[status] || 'neutral');
}

export function renderProyectos(state) {
  const projects = (state.projects || []).filter(p => !p.deletedAt);
  const rows = projects.map(p => {
    const curCents = Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100);
    const targetCents = Number.isInteger(p.targetCents) ? p.targetCents : Math.round(Number(p.target || 0) * 100);
    const pct = targetCents > 0 ? Math.min(100, Math.round(curCents / targetCents * 100)) : 0;
    const taskCount = p.taskCount || 0;
    const doneCount = p.doneCount || 0;
    const taskPct = taskCount > 0 ? Math.round(doneCount / taskCount * 100) : 0;
    return `
      <li class="row-item"><button class="row-tap" data-project-id="${esc(p.id)}">
        <span class="row-icon" aria-hidden="true">${getIcon('proyectos')}</span>
        <span class="row-main">
          <span class="row-title">${esc(p.title)}</span>
          <span class="row-sub">${esc(p.description || '')}${p.deadline ? ' · vence ' + esc(p.deadline) : ''}</span>
          ${targetCents ? `<div style="margin-top:4px">${progressBar(pct, pct>=80?'ok':pct>=40?'warn':'')}</div>` : ''}
          <div style="margin-top:4px;font-size:12px;color:var(--ink-3)">Tareas: ${doneCount}/${taskCount} (${taskPct}%) · ${statusBadge(p.status || 'planning')}</div>
        </span>
      </button></li>
    `;
  }).join('');
  const totalCents = projects.reduce((s, p) => s + (Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100)), 0);
  const activeCount = projects.filter(p => p.status === 'active').length;
  return `${pageHeader('Projects OS', `${projects.length} proyectos · ${activeCount} activos · ahorro ${fmtEUR(totalCents)}`, `<button class="btn primary" data-project-add>Nuevo proyecto</button>`)}
  <section class="section"><h2 class="section-title">Todos los proyectos</h2>${rows ? `<ul class="row-list">${rows}</ul>` : emptyState('Sin proyectos', 'Crea tu primer proyecto para organizar tareas y metas.')}</section>`;
}

export function bindProyectos(root, ctx) {
  root.querySelectorAll('[data-project-add]').forEach(b => b.addEventListener('click', () => openEditor(ctx)));
  root.querySelectorAll('[data-project-id]').forEach(b => b.addEventListener('click', () => {
    const p = (stateProjects(ctx) || []).find(x => x.id === b.dataset.projectId);
    if (p) openDetail(ctx, p);
  }));
}

function stateProjects(ctx) {
  return (ctx.state.projects || []).filter(p => !p.deletedAt);
}

function openEditor(ctx, p = null) {
  const isEdit = !!p?.id;
  const currentCents = Number.isInteger(p?.currentCents) ? p.currentCents : Math.round(Number(p?.current || 0) * 100);
  const targetCents = Number.isInteger(p?.targetCents) ? p.targetCents : (p?.target != null ? Math.round(Number(p.target) * 100) : 0);
  const statusOpts = PROJECT_STATUSES.map(([v, l]) => `<option value="${v}" ${(p?.status || 'planning') === v ? 'selected' : ''}>${l}</option>`).join('');
  const displayCurrent = currentCents ? String(currentCents / 100).replace('.', ',') : '0,00';
  const displayTarget = targetCents ? String(targetCents / 100).replace('.', ',') : '';
  const content = `<div class="form-grid">
    <div class="field"><label>Título</label><input id="pr-title" value="${esc(p?.title || '')}"></div>
    <div class="field"><label>Descripción</label><textarea id="pr-desc" rows="3">${esc(p?.description || '')}</textarea></div>
    <div class="field"><label>Estado</label><select id="pr-status">${statusOpts}</select></div>
    <div class="grid-2">
      <div class="field"><label>Fecha límite</label><input id="pr-deadline" type="date" value="${esc(p?.deadline || '')}"></div>
      <div class="field"><label>Prioridad</label><select id="pr-priority"><option value="baja">Baja</option><option value="media" ${(p?.priority || 'media') === 'media' ? 'selected' : ''}>Media</option><option value="alta">Alta</option></select></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Avance actual (€)</label><input id="pr-current" inputmode="decimal" value="${esc(displayCurrent)}"></div>
      <div class="field"><label>Meta objetivo (€)</label><input id="pr-target" inputmode="decimal" value="${esc(displayTarget)}"></div>
    </div>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit ? 'Editar proyecto' : 'Nuevo proyecto', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async () => {
    const title = sh.el.querySelector('#pr-title').value.trim();
    if (!title) { toast('Introduce un título'); return; }
    const parse = (v) => { v = v.trim().replace(/\./g, '').replace(',', '.'); if (!v) return null; const n = Number(v); return Number.isNaN(n) ? null : n; };
    const target = parse(sh.el.querySelector('#pr-target').value);
    const current = parse(sh.el.querySelector('#pr-current').value) ?? 0;
    if (current < 0) { toast('El avance no puede ser negativo'); return; }
    const item = {
      ...(p || {}),
      id: p?.id || uid('pr'),
      title,
      description: sh.el.querySelector('#pr-desc').value.trim(),
      status: sh.el.querySelector('#pr-status').value,
      deadline: sh.el.querySelector('#pr-deadline').value,
      priority: sh.el.querySelector('#pr-priority').value,
      targetCents: target ? Math.round(target * 100) : 0,
      currentCents: Math.round(current * 100),
      updatedAt: new Date().toISOString(),
      createdAt: p?.createdAt || new Date().toISOString()
    };
    try { await ctx.save('projects', item); toast('Proyecto guardado'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo guardar'); }
  };
}

function openDetail(ctx, p) {
  const curCents = Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100);
  const targetCents = Number.isInteger(p.targetCents) ? p.targetCents : Math.round(Number(p.target || 0) * 100);
  const pct = targetCents > 0 ? Math.min(100, Math.round(curCents / targetCents * 100)) : 0;
  const content = `
    <div class="stack">
      <div class="kv">
        <div class="kv-row"><span>Estado</span><strong>${statusBadge(p.status || 'planning')}</strong></div>
        <div class="kv-row"><span>Prioridad</span><strong>${esc(p.priority || 'media')}</strong></div>
        ${p.deadline ? `<div class="kv-row"><span>Fecha límite</span><strong>${esc(p.deadline)}</strong></div>` : ''}
        ${targetCents ? `<div class="kv-row"><span>Meta</span><strong>${fmtEUR(targetCents)}</strong></div>` : ''}
        <div class="kv-row"><span>Avance</span><strong>${fmtEUR(curCents)} ${targetCents ? `de ${fmtEUR(targetCents)}` : ''} (${pct}%)</strong></div>
        ${p.description ? `<div class="kv-row"><span>Descripción</span><strong>${esc(p.description)}</strong></div>` : ''}
      </div>
      ${pct > 0 ? `<div style="margin-top:8px">${progressBar(pct, pct>=80?'ok':pct>=40?'warn':'')}</div>` : ''}
      <div class="inline-actions" style="margin-top:12px">
        <button class="btn" data-proj-add>+ Añadir avance</button>
        <button class="btn" data-proj-edit>Editar</button>
        <button class="btn ${(p.status || 'planning') === 'completed' ? '' : 'primary'}" data-proj-complete>${(p.status || 'planning') === 'completed' ? 'Reabrir' : 'Completar'}</button>
        <button class="btn danger" data-proj-del>Eliminar</button>
      </div>
    </div>`;
  const sh = openSheet({ title: p.title, content });
  sh.el.querySelector('[data-proj-add]').onclick = async () => {
    const val = window.prompt('Cuánto añadir al avance (€):', '');
    if (val == null) return;
    const n = Number(String(val).replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(n) || n < 0) { toast('Cantidad no válida'); return; }
    try { await ctx.save('projects', { ...p, currentCents: curCents + Math.round(n * 100), updatedAt: new Date().toISOString() }); toast('Avance registrado'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo registrar'); }
  };
  sh.el.querySelector('[data-proj-edit]').onclick = () => { sh.close(); openEditor(ctx, p); };
  sh.el.querySelector('[data-proj-complete]').onclick = async () => {
    const newStatus = (p.status || 'planning') === 'completed' ? 'active' : 'completed';
    try { await ctx.save('projects', { ...p, status: newStatus, updatedAt: new Date().toISOString() }); toast(`Proyecto ${newStatus === 'completed' ? 'completado' : 'reabierto'}`); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo actualizar'); }
  };
  sh.el.querySelector('[data-proj-del]').onclick = async () => {
    const name = p.name || p.title;
    try {
      await ctx.del('projects', p.id);
      toastUndo(`Proyecto "${name}" eliminado`, {
        onUndo: async () => { await ctx.save('projects', p); }
      });
      sh.close();
      await ctx.rerender();
    } catch (_e) { toast('No se pudo eliminar'); }
  };
}