import { pageHeader, esc, fmtEUR, fmtDate, emptyState, statCard } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD, currentMonthYM, addMonthsYM } from '../core/dates.js';
import { getFinanceSummary } from './logic.js';
import { txCents, isExpense, isIncome, monthOfDate } from '../core/budget.js';

export function renderDinero(state, ui) {
  const month = ui.moneyMonth || currentMonthYM();
  ui.moneyMonth = month;
  const txs = (state.transactions||[]).filter(t=>!t.deletedAt && (t.date||'').startsWith(month));
  const income = txs.filter(isIncome).reduce((s,t)=>s+txCents(t),0);
  const spent = txs.filter(isExpense).reduce((s,t)=>s+txCents(t),0);
  const budget = (state.budgets||[]).find(b=>b.month===month) || {totalCents:0};
  const budgetTotal = budget.totalCents ?? Math.round(Number(budget.total || 0) * 100);
  const base = income>0?income:budgetTotal;
  const financeAll = getFinanceSummary(state);
  const committed = month===currentMonthYM() ? (financeAll.committed||0) : 0;
  const libre = base - spent - committed;
  const label = new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(Number(month.slice(0,4)), Number(month.slice(5,7))-1, 1));
  const rows = txs.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(t=>{
    const cents = txCents(t);
    const isNeg = isExpense(t);
    return `<li class="row-item"><button class="row-tap" data-tx-id="${esc(t.id)}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(t.description||t.category||'Movimiento')}</span><span class="row-sub">${esc(fmtDate(t.date))}${t.category?' · '+esc(t.category):''}</span></span><span class="row-value" style="color:${isNeg?'var(--ink)':'var(--ok)'}">${isNeg?'-':'+'}${fmtEUR(Math.abs(cents))}</span></button></li>`;
  }).join('');
  return `${pageHeader('Dinero', label, `<button class="btn" data-money-prev>‹</button><button class="btn" data-money-next>›</button><button class="btn primary" data-tx-add>Añadir movimiento</button>`)}
  <section class="grid-2">${statCard('Libre tras compromisos', fmtEUR(libre), month===currentMonthYM()?'Presupuesto/ingresos menos gastado y comprometido':'Estimación del mes')}${statCard('Gastado', fmtEUR(spent), `Ingresos: ${fmtEUR(income)}`)}</section>
  <section class="section"><h2 class="section-title">Movimientos</h2>${rows?`<ul class="row-list">${rows}</ul>`:emptyState('Sin movimientos', 'Registra gastos e ingresos para ver tu resumen.')}</section>`;
}

export function bindDinero(root, ctx) {
  root.querySelector('[data-money-prev]')?.addEventListener('click', ()=>{ ctx.ui.moneyMonth = addMonthsYM(ctx.ui.moneyMonth||currentMonthYM(), -1); ctx.rerender(); });
  root.querySelector('[data-money-next]')?.addEventListener('click', ()=>{ ctx.ui.moneyMonth = addMonthsYM(ctx.ui.moneyMonth||currentMonthYM(), 1); ctx.rerender(); });
  root.querySelectorAll('[data-tx-add]').forEach(b=>b.addEventListener('click', ()=> openTxEditor(ctx)));
  root.querySelectorAll('[data-tx-id]').forEach(b=>b.addEventListener('click', ()=>{ const t=(ctx.state.transactions||[]).find(x=>x.id===b.dataset.txId); if(t) openTxDetail(ctx,t); }));
}

function openTxEditor(ctx, t=null) {
  const isEdit=!!t?.id;
  const cents = t ? Math.abs(txCents(t)) : '';
  const type = t ? (t.type || (txCents(t)<0?'gasto':'ingreso')) : 'gasto';
  const content = `<div class="form-grid">
    <div class="field"><label for="tx-type">Tipo</label><select id="tx-type"><option value="gasto" ${type==='gasto'?'selected':''}>Gasto</option><option value="ingreso" ${type==='ingreso'?'selected':''}>Ingreso</option></select></div>
    <div class="field"><label for="tx-amount">Importe</label><input id="tx-amount" inputmode="decimal" placeholder="0,00" value="${cents!==''?esc(String(cents/100).replace('.',',')):''}"></div>
    <div class="field"><label for="tx-date">Fecha</label><input id="tx-date" type="date" value="${esc(t?.date||todayYMD())}"></div>
    <div class="field"><label for="tx-cat">Categoría</label><input id="tx-cat" value="${esc(t?.category||'')}"></div>
    <div class="field"><label for="tx-desc">Descripción</label><input id="tx-desc" value="${esc(t?.description||'')}"></div>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit?'Editar movimiento':'Nuevo movimiento', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async ()=>{
    const typeV = sh.el.querySelector('#tx-type').value;
    const raw = sh.el.querySelector('#tx-amount').value.trim().replace(/\./g,'').replace(',','.');
    const val = Number(raw);
    const date = sh.el.querySelector('#tx-date').value;
    if (!raw || Number.isNaN(val) || val <= 0 || !date) { toast('Introduce un importe y fecha válidos'); return; }
    const cents = Math.round(val * 100);
    const amount = typeV==='gasto' ? -cents : cents;
    const item = { ...(t||{}), id: t?.id||uid('t'), type: typeV, amount: amount/100, amountCents: amount, date, category: sh.el.querySelector('#tx-cat').value.trim(), description: sh.el.querySelector('#tx-desc').value.trim(), updatedAt:new Date().toISOString(), createdAt:t?.createdAt||new Date().toISOString() };
    try { await ctx.save('transactions', item); toast('Movimiento guardado'); sh.close(); await ctx.rerender(); } catch(_e){ toast('No se pudo guardar'); }
  };
}
function openTxDetail(ctx,t){
  const cents = txCents(t);
  const isNeg = isExpense(t);
  const content = `<div class="stack"><div class="kv"><div class="kv-row"><span>Importe</span><strong>${isNeg?'-':'+'}${fmtEUR(Math.abs(cents))}</strong></div><div class="kv-row"><span>Fecha</span><strong>${esc(fmtDate(t.date))}</strong></div>${t.category?`<div class="kv-row"><span>Categoría</span><strong>${esc(t.category)}</strong></div>`:''}</div>${t.description?`<p style="margin:0">${esc(t.description)}</p>`:''}
  <div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh = openSheet({ title: 'Movimiento', content });
  sh.el.querySelector('[data-edit]').onclick = ()=>{ sh.close(); openTxEditor(ctx,t); };
  sh.el.querySelector('[data-del]').onclick = async ()=>{ const ok=window.confirm('¿Eliminar este movimiento?'); if(!ok) return; try{ await ctx.del('transactions', t.id); toast('Movimiento eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
}