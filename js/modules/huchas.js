import { pageHeader, esc, fmtEUR, emptyState, progressBar, getIcon } from '../ui/components.js';
import { openSheet, toast, toastUndo } from '../ui/render.js';
import { uid } from '../core/ids.js';

export function renderHuchas(state) {
  const pots = (state.savingsPots || []).filter(p => !p.deletedAt);
  const totalCents = pots.reduce((s, p) => s + (Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100)), 0);
  const rows = pots.map(p => {
    const curCents = Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100);
    const targetCents = Number.isInteger(p.targetCents) ? p.targetCents : Math.round(Number(p.target || 0) * 100);
    const monthlyCents = Number.isInteger(p.monthlyCents) ? p.monthlyCents : (p.monthlyContribution != null ? Math.round(Number(p.monthlyContribution) * 100) : 0);
    const pct = targetCents > 0 ? Math.min(100, Math.round(curCents / targetCents * 100)) : 0;
    const monthlyStr = monthlyCents > 0 ? ` · ${fmtEUR(monthlyCents)}/mes` : '';
    return `<li class="row-item"><button class="row-tap" data-pot-id="${esc(p.id)}"><span class="row-icon" aria-hidden="true">${getIcon('huchas')}</span><span class="row-main"><span class="row-title">${esc(p.name)}</span><span class="row-sub">${fmtEUR(curCents)}${targetCents ? ` de ${fmtEUR(targetCents)}` : ''}${monthlyStr}</span>${targetCents ? progressBar(pct, 'ok') : ''}</span></button></li>`;
  }).join('');
  return `${pageHeader('Huchas', pots.length ? `Ahorro total ${fmtEUR(totalCents)}` : 'Sin huchas', `<button class="btn primary" data-pot-add>Añadir</button>`)}
  ${rows ? `<ul class="row-list">${rows}</ul>` : emptyState('Sin huchas', 'Crea una hucha para separar tu ahorro.')}`;
}

export function bindHuchas(root, ctx) {
  root.querySelectorAll('[data-pot-add]').forEach(b => b.addEventListener('click', () => openEditor(ctx)));
  root.querySelectorAll('[data-pot-id]').forEach(b => b.addEventListener('click', () => { const p = (ctx.state.savingsPots || []).find(x => x.id === b.dataset.potId); if (p) openDetail(ctx, p); }));
}

function openEditor(ctx, p = null) {
  const isEdit = !!p?.id;
  const currentCents = Number.isInteger(p?.currentCents) ? p.currentCents : Math.round(Number(p?.current || 0) * 100);
  const targetCents = Number.isInteger(p?.targetCents) ? p.targetCents : (p?.target != null ? Math.round(Number(p.target) * 100) : 0);
  const monthlyCents = Number.isInteger(p?.monthlyCents) ? p.monthlyCents : (p?.monthlyContribution != null ? Math.round(Number(p.monthlyContribution) * 100) : 0);
  const displayCurrent = currentCents ? String(currentCents / 100).replace('.', ',') : '0,00';
  const displayTarget = targetCents ? String(targetCents / 100).replace('.', ',') : '';
  const displayMonthly = monthlyCents ? String(monthlyCents / 100).replace('.', ',') : '';
  const content = `<div class="form-grid">
    <div class="field"><label>Nombre</label><input id="p-name" value="${esc(p?.name || '')}"></div>
    <div class="field"><label>Objetivo (opcional)</label><input id="p-target" inputmode="decimal" value="${esc(displayTarget)}"></div>
    <div class="field"><label>Ahorro actual</label><input id="p-current" inputmode="decimal" value="${esc(displayCurrent)}"></div>
    <div class="field"><label>Aportación mensual (opcional)</label><input id="p-monthly" inputmode="decimal" value="${esc(displayMonthly)}"></div>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit ? 'Editar hucha' : 'Nueva hucha', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async () => {
    const name = sh.el.querySelector('#p-name').value.trim();
    if (!name) { toast('Introduce un nombre'); return; }
    const parse = (v) => { v = v.trim().replace(/\./g, '').replace(',', '.'); if (!v) return null; const n = Number(v); return Number.isNaN(n) ? null : n; };
    const target = parse(sh.el.querySelector('#p-target').value);
    const current = parse(sh.el.querySelector('#p-current').value) ?? 0;
    const monthly = parse(sh.el.querySelector('#p-monthly').value);
    if (current < 0) { toast('El ahorro no puede ser negativo'); return; }
    const item = { ...(p || {}), id: p?.id || uid('sp'), name, targetCents: target ? Math.round(target * 100) : 0, currentCents: Math.round(current * 100), monthlyCents: monthly ? Math.round(monthly * 100) : 0, updatedAt: new Date().toISOString(), createdAt: p?.createdAt || new Date().toISOString() };
    try { await ctx.save('savingsPots', item); toast('Hucha guardada'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo guardar'); }
  };
}

function openDetail(ctx, p) {
  const curCents = Number.isInteger(p.currentCents) ? p.currentCents : Math.round(Number(p.current || 0) * 100);
  const targetCents = Number.isInteger(p.targetCents) ? p.targetCents : Math.round(Number(p.target || 0) * 100);
  const monthlyCents = Number.isInteger(p.monthlyCents) ? p.monthlyCents : (p.monthlyContribution != null ? Math.round(Number(p.monthlyContribution) * 100) : 0);
  const content = `<div class="stack"><div class="kv"><div class="kv-row"><span>Ahorro actual</span><strong>${fmtEUR(curCents)}</strong></div>${targetCents ? `<div class="kv-row"><span>Objetivo</span><strong>${fmtEUR(targetCents)}</strong></div>` : ''}${monthlyCents > 0 ? `<div class="kv-row"><span>Aportación mensual</span><strong>${fmtEUR(monthlyCents)}</strong></div>` : ''}</div>
  <div class="inline-actions"><button class="btn primary" data-add>Aportar</button><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh = openSheet({ title: p.name, content });
  sh.el.querySelector('[data-add]').onclick = async () => {
    const val = window.prompt('Cantidad a aportar (€):', '');
    if (val == null) return;
    const n = Number(String(val).replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(n) || n <= 0) { toast('Cantidad no válida'); return; }
    try { await ctx.save('savingsPots', { ...p, currentCents: curCents + Math.round(n * 100), updatedAt: new Date().toISOString() }); toast('Aportación registrada'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo aportar'); }
  };
  sh.el.querySelector('[data-edit]').onclick = () => { sh.close(); openEditor(ctx, p); };
  sh.el.querySelector('[data-del]').onclick = async () => {
    const name = p.name;
    try {
      await ctx.del('savingsPots', p.id);
      toastUndo(`Hucha "${name}" eliminada`, {
        onUndo: async () => {
          await ctx.save('savingsPots', p);
        }
      });
      sh.close();
      await ctx.rerender();
    } catch (_e) {
      toast('No se pudo eliminar');
    }
  };
}