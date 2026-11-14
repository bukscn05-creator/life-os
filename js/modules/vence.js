import { pageHeader, esc, fmtEUR, fmtDate, daysUntil, statusPill, emptyState, getIcon } from '../ui/components.js';
import { openSheet, toast, toastUndo } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD, addDaysYMD } from '../core/dates.js';
import { RECURRENCES, normalizeRecurrence, occurrencesInRange, nextOccurrenceOnOrAfter } from '../core/recurrence.js';

export function renderVence(state) {
  const items = (state.deadlines || []).filter(d => !d.deletedAt).map(d => {
    const days = daysUntil(d.dueDate || d.date);
    return {...d, days};
  });
  
  // Expand recurring deadlines for display
  const today = todayYMD();
  const nextWeek = addDaysYMD(today, 7);
  const expanded = [];
  for (const d of items) {
    const rule = normalizeRecurrence(d.recurrence);
    const exc = d.exceptions || [];
    if (rule === 'nunca') {
      expanded.push(d);
    } else {
      const occs = occurrencesInRange(d.dueDate || d.date, rule, today, nextWeek, exc, 50);
      for (const occ of occs) {
        expanded.push({...d, id: d.id + '_' + occ, dueDate: occ, _recurring: true, _baseId: d.id});
      }
    }
  }
  
  const groups = [
    ['Vencidos', expanded.filter(d => !d.completed && d.days != null && d.days < 0)],
    ['Hoy', expanded.filter(d => !d.completed && d.days === 0)],
    ['Próximos 7 días', expanded.filter(d => !d.completed && d.days != null && d.days > 0 && d.days <= 7)],
    ['Más adelante', expanded.filter(d => !d.completed && (d.days == null || d.days > 7))],
    ['Completados', expanded.filter(d => d.completed)]
  ];
  const sections = groups.map(([title, list]) => {
    if (!list.length) return '';
    const rows = list.sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||'')).map(d => {
      const tone = d.completed ? 'neutral' : (d.days < 0 || d.days === 0) ? 'danger' : d.days <= 3 ? 'warn' : 'neutral';
      const label = d.completed ? 'Completado' : d.days < 0 ? 'Vencido' : d.days === 0 ? 'Hoy' : `${d.days} días`;
      const cents = d.amountCents ?? (d.amount != null ? Math.round(Number(d.amount) * 100) : null);
      const recurrenceIcon = d._recurring ? getIcon('repeat') : '';
      return `<li class="row-item"><button class="row-tap" data-deadline-id="${esc(d._baseId || d.id)}"><span class="row-icon" aria-hidden="true">${recurrenceIcon}</span><span class="row-main"><span class="row-title">${esc(d.title)}${d._recurring ? ' <span class="badge recur-badge">Recurrente</span>' : ''}</span><span class="row-sub">${esc(fmtDate(d.dueDate||d.date))}${cents!=null? ' · '+fmtEUR(cents):''}</span></span><span>${statusPill(label,tone)}</span></button></li>`;
    }).join('');
    return `<section class="section"><h2 class="section-title">${esc(title)}</h2><ul class="row-list">${rows}</ul></section>`;
  }).join('');
  return `${pageHeader('Lo que vence', expanded.filter(i=>!i.completed).length ? 'Vencimientos pendientes' : 'Sin pendientes', `<button class="btn primary" data-deadline-add>Añadir</button>`)}
  ${sections || emptyState('Sin vencimientos', 'Añade fechas límite para llevarlas al día.')}`;
}

export function bindVence(root, ctx) {
  root.querySelectorAll('[data-deadline-add]').forEach(b=>b.addEventListener('click', ()=> openEditor(ctx)));
  root.querySelectorAll('[data-deadline-id]').forEach(b=>b.addEventListener('click', ()=>{ const d=(ctx.state.deadlines||[]).find(x=>x.id===b.dataset.deadlineId); if(d) openDetail(ctx,d); }));
}

function openEditor(ctx, d=null) {
  const isEdit = !!d?.id;
  const cents = d?.amountCents ?? (d?.amount != null ? Math.round(Number(d.amount) * 100) : null);
  const recurrence = normalizeRecurrence(d?.recurrence);
  const exc = d?.exceptions || [];
  const content = `<div class="form-grid">
    <div class="field"><label for="d-title">Título</label><input id="d-title" value="${esc(d?.title||'')}"></div>
    <div class="field"><label for="d-date">Fecha límite</label><input id="d-date" type="date" value="${esc(d?.dueDate||d?.date||todayYMD())}"></div>
    <div class="field"><label for="d-recurrence">Repetir</label><select id="d-recurrence">${RECURRENCES.map(r=>`<option value="${r}" ${r===recurrence?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}</select></div>
    <div class="field"><label for="d-exceptions">Excepciones (fechas separadas por comas)</label><input id="d-exceptions" type="text" placeholder="2026-01-01, 2026-12-25" value="${esc(exc.join(', '))}"></div>
    <div class="field"><label for="d-amount">Importe (opcional)</label><input id="d-amount" inputmode="decimal" placeholder="0,00" value="${cents!=null?esc(String(cents/100).replace('.',',')):''}"></div>
    <div class="field"><label for="d-notes">Notas</label><textarea id="d-notes" rows="3">${esc(d?.notes||'')}</textarea></div>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit?'Editar vencimiento':'Nuevo vencimiento', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async ()=>{
    const title = sh.el.querySelector('#d-title').value.trim();
    const dueDate = sh.el.querySelector('#d-date').value;
    if (!title || !dueDate) { toast('Añade título y fecha'); return; }
    const amtRaw = sh.el.querySelector('#d-amount').value.trim().replace(/\./g,'').replace(',','.');
    const amount = amtRaw ? Number(amtRaw) : null;
    const rec = sh.el.querySelector('#d-recurrence').value;
    const excRaw = sh.el.querySelector('#d-exceptions').value.trim();
    const exceptions = excRaw ? excRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const item = { ...(d||{}), id: d?.id||uid('d'), title, dueDate, recurrence: rec, exceptions: exceptions.length ? exceptions : undefined, amount: (amount!=null && !Number.isNaN(amount))?amount:null, amountCents: (amount!=null && !Number.isNaN(amount))?Math.round(amount*100):null, completed: d?.completed||false, notes: sh.el.querySelector('#d-notes').value.trim(), updatedAt:new Date().toISOString(), createdAt:d?.createdAt||new Date().toISOString() };
    try { await ctx.save('deadlines', item); toast('Vencimiento guardado'); sh.close(); await ctx.rerender(); } catch(_e){ toast('No se pudo guardar'); }
  };
}

function openDetail(ctx, d) {
  const cents = d.amountCents ?? (d.amount != null ? Math.round(Number(d.amount) * 100) : null);
  const rec = normalizeRecurrence(d?.recurrence);
  const exc = d?.exceptions || [];
  const isRecurring = rec !== 'nunca';
  const content = `<div class="stack"><div class="kv"><div class="kv-row"><span>Fecha</span><strong>${esc(fmtDate(d.dueDate||d.date))}</strong></div>${isRecurring?`<div class="kv-row"><span>Repetición</span><strong>${rec.charAt(0).toUpperCase()+rec.slice(1)}</strong></div>${exc.length?`<div class="kv-row"><span>Excepciones</span><strong>${esc(exc.join(', '))}</strong></div>`:''}`:''}${cents!=null?`<div class="kv-row"><span>Importe</span><strong>${fmtEUR(cents)}</strong></div>`:''}</div>${d.notes?`<p style="margin:0">${esc(d.notes)}</p>`:''}
  <div class="inline-actions">${isRecurring ? `<button class="btn" data-del-this>Solo este</button><button class="btn danger" data-del-all>Toda la serie</button>` : ''}<button class="btn primary" data-complete>${d.completed?'Marcar pendiente':'Completar'}</button><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>${isRecurring ? 'Eliminar base' : 'Eliminar'}</button></div></div>`;
  const sh = openSheet({ title: d.title, content });
  sh.el.querySelector('[data-complete]').onclick = async ()=>{ try{ await ctx.save('deadlines',{...d,completed:!d.completed, updatedAt:new Date().toISOString()}); toast(d.completed?'Marcado como pendiente':'Completado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo actualizar'); } };
  sh.el.querySelector('[data-edit]').onclick = ()=>{ sh.close(); openEditor(ctx,d); };
  sh.el.querySelector('[data-del]').onclick = async ()=>{ const ok=window.confirm('¿Eliminar este vencimiento?'); if(!ok) return; try{ await ctx.del('deadlines', d.id); toast('Vencimiento eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
  if (isRecurring) {
    const btnThis = sh.el.querySelector('[data-del-this]');
    const btnAll = sh.el.querySelector('[data-del-all]');
    if (btnThis) btnThis.onclick = async ()=>{ const ok=window.confirm('¿Eliminar solo esta ocurrencia? Se añadirá a excepciones.'); if(!ok) return; try{ const excNew = [...exc, d.dueDate]; await ctx.save('deadlines',{...d,exceptions:excNew, updatedAt:new Date().toISOString()}); toast('Ocurrencia omitida'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo actualizar'); } };
    if (btnAll) btnAll.onclick = async ()=>{ const ok=window.confirm('¿Eliminar TODA la serie de repetición?'); if(!ok) return; try{ await ctx.del('deadlines', d.id); toast('Serie eliminada'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
  }
}