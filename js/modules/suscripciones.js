import { pageHeader, esc, fmtEUR, fmtDate, emptyState, statusPill, getIcon } from '../ui/components.js';
import { openSheet, toast, toastUndo } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';
import { subAmountCents, subscriptionMonthlyCents, subscriptionYearlyCents } from '../core/budget.js';

export function renderSuscripciones(state) {
  const subs = (state.subscriptions || []).filter(s => !s.deletedAt);
  const active = subs.filter(s => s.active !== false);
  const monthly = active.reduce((s, x) => s + subscriptionMonthlyCents(x), 0);
  const yearly = active.reduce((s, x) => s + subscriptionYearlyCents(x), 0);
  const rows = subs.map(s => {
    const paused = s.active === false;
    const sub = paused ? 'Pausada' : `${s.period || 'mensual'}${s.nextCharge ? ' · próximo ' + fmtDate(s.nextCharge) : ''}`;
    const cents = s.amountCents ?? Math.round(Number(s.amount || 0) * 100);
    return `<li class="row-item"><button class="row-tap" data-sub-id="${esc(s.id)}"><span class="row-icon" aria-hidden="true">${getIcon('suscripciones')}</span><span class="row-main"><span class="row-title">${esc(s.name)}</span><span class="row-sub">${esc(sub)}</span></span><span class="row-value">${fmtEUR(cents)}</span></button></li>`;
  }).join('');
  return `${pageHeader('Suscripciones', active.length ? `Total mensual ${fmtEUR(monthly)} · anual ${fmtEUR(yearly)}` : 'Sin suscripciones activas', `<button class="btn primary" data-sub-add>Añadir</button>`)}
  ${rows ? `<ul class="row-list">${rows}</ul>` : emptyState('Sin suscripciones', 'Registra tus cobros recurrentes.')}`;
}

export function bindSuscripciones(root, ctx) {
  root.querySelectorAll('[data-sub-add]').forEach(b => b.addEventListener('click', () => openEditor(ctx)));
  root.querySelectorAll('[data-sub-id]').forEach(b => b.addEventListener('click', () => { const s = (ctx.state.subscriptions || []).find(x => x.id === b.dataset.subId); if (s) openDetail(ctx, s); }));
}

function openEditor(ctx, s = null) {
  const isEdit = !!s?.id;
  const cents = s?.amountCents ?? Math.round(Number(s?.amount || 0) * 100);
  const displayAmount = cents ? String(cents / 100).replace('.', ',') : '';
  const content = `<div class="form-grid">
    <div class="field"><label>Nombre</label><input id="s-name" value="${esc(s?.name || '')}"></div>
    <div class="field"><label>Importe</label><input id="s-amount" inputmode="decimal" value="${esc(displayAmount)}"></div>
    <div class="field"><label>Periodicidad</label><select id="s-period"><option value="mensual" ${!s || s.period === 'mensual' ? 'selected' : ''}>Mensual</option><option value="anual" ${s?.period === 'anual' ? 'selected' : ''}>Anual</option><option value="semanal" ${s?.period === 'semanal' ? 'selected' : ''}>Semanal</option></select></div>
    <div class="field"><label>Próximo cobro</label><input id="s-next" type="date" value="${esc(s?.nextCharge || todayYMD())}"></div>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="s-active" ${s?.active === false ? '' : 'checked'}> <span>Activa</span></label>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit ? 'Editar suscripción' : 'Nueva suscripción', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async () => {
    const name = sh.el.querySelector('#s-name').value.trim();
    const raw = sh.el.querySelector('#s-amount').value.trim().replace(/\./g, '').replace(',', '.');
    const val = Number(raw);
    if (!name || !raw || Number.isNaN(val) || val <= 0) { toast('Introduce nombre e importe válido'); return; }
    const amountCents = Math.round(val * 100);
    const item = { ...(s || {}), id: s?.id || uid('s'), name, amountCents, period: sh.el.querySelector('#s-period').value, nextCharge: sh.el.querySelector('#s-next').value, active: sh.el.querySelector('#s-active').checked, updatedAt: new Date().toISOString(), createdAt: s?.createdAt || new Date().toISOString() };
    try { await ctx.save('subscriptions', item); toast('Suscripción guardada'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo guardar'); }
  };
}

function openDetail(ctx, s) {
  const cents = s.amountCents ?? Math.round(Number(s.amount || 0) * 100);
  const monthly = subscriptionMonthlyCents(s);
  const yearly = subscriptionYearlyCents(s);
  const content = `<div class="stack"><div class="kv"><div class="kv-row"><span>Importe</span><strong>${fmtEUR(cents)}</strong></div><div class="kv-row"><span>Mensual / Anual</span><strong>${fmtEUR(monthly)} / ${fmtEUR(yearly)}</strong></div><div class="kv-row"><span>Periodicidad</span><strong>${esc(s.period || 'mensual')}</strong></div><div class="kv-row"><span>Estado</span><strong>${s.active === false ? 'Pausada' : 'Activa'}</strong></div>${s.nextCharge && s.active !== false ? `<div class="kv-row"><span>Próximo cobro</span><strong>${esc(fmtDate(s.nextCharge))}</strong></div>` : ''}</div>
  <div class="inline-actions"><button class="btn" data-toggle>${s.active === false ? 'Activar' : 'Pausar'}</button><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh = openSheet({ title: s.name, content });
  sh.el.querySelector('[data-toggle]').onclick = async () => { try { await ctx.save('subscriptions', { ...s, active: s.active === false, updatedAt: new Date().toISOString() }); toast('Estado actualizado'); sh.close(); await ctx.rerender(); } catch (_e) { toast('No se pudo actualizar'); } };
  sh.el.querySelector('[data-edit]').onclick = () => { sh.close(); openEditor(ctx, s); };
  sh.el.querySelector('[data-del]').onclick = async () => {
    const name = s.name;
    try {
      await ctx.del('subscriptions', s.id);
      toastUndo(`Suscripción "${name}" eliminada`, {
        onUndo: async () => {
          await ctx.save('subscriptions', s);
        }
      });
      sh.close();
      await ctx.rerender();
    } catch (_e) {
      toast('No se pudo eliminar');
    }
  };
}