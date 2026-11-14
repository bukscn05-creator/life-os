import { pageHeader, esc, emptyState, fmtDate, getIcon } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD, currentMonthYM, addMonthsYM, monthGrid, parseYMD, addDaysYMD, toYMD, startOfWeekMonday, daysInMonth } from '../core/dates.js';
import { RECURRENCES, normalizeRecurrence, occurrencesInRange } from '../core/recurrence.js';

export function renderCalendario(state, ui) {
  const view = ui.calView || 'mes';
  const ref = (ui.calRef && /^\d{4}-\d{2}(-\d{2})?$/.test(ui.calRef)) ? ui.calRef : todayYMD();
  const events = (state.events || []).filter(e => !e.deletedAt);
  if (view === 'semana') return renderWeek(ref, events);
  return renderMonth(ref.slice(0,7), events);
}

function header(view, label, ref) {
  const actions = `<div class="segmented" role="tablist" aria-label="Vista"><button class="seg-btn ${view==='semana'?'active':''}" data-cal-view="semana" role="tab" aria-selected="${view==='semana'}">Semana</button><button class="seg-btn ${view==='mes'?'active':''}" data-cal-view="mes" role="tab" aria-selected="${view==='mes'}">Mes</button></div>
  <button class="btn primary" type="button" data-cal-add>Añadir evento</button>`;
  const nav = `<div class="inline-actions" style="margin-top:4px"><button class="btn" data-cal-prev aria-label="Anterior">‹</button><button class="btn" data-cal-today>Hoy</button><button class="btn" data-cal-next aria-label="Siguiente">›</button></div>`;
  return pageHeader('Agenda', label, actions) + nav;
}

function expandRecurringEvents(events, fromYMD, toYMD) {
  const expanded = [];
  for (const e of events) {
    const rule = normalizeRecurrence(e.recurrence);
    const exc = e.exceptions || [];
    if (rule === 'nunca') {
      expanded.push(e);
    } else {
      const occs = occurrencesInRange(e.date, rule, fromYMD, toYMD, exc, 200);
      for (const occ of occs) {
        expanded.push({...e, id: e.id + '_' + occ, date: occ, _recurring: true, _baseId: e.id});
      }
    }
  }
  return expanded;
}

function renderMonth(ym, events) {
  const label = new Intl.DateTimeFormat('es-ES', { month:'long', year:'numeric' }).format(new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7))-1, 1));
  const days = monthGrid(ym);
  const today = todayYMD();
  const monthStart = ym + '-01';
  const monthEnd = ym + '-' + daysInMonth(Number(ym.slice(0,4)), Number(ym.slice(5,7)));
  const expandedEvents = expandRecurringEvents(events, monthStart, monthEnd);
  const byDay = groupByDay(expandedEvents);
  const cells = days.map(d => {
    const ev = (byDay[d.ymd] || []);
    const chips = ev.slice(0,2).map(e=>`<div class="cal-chip${e._recurring ? ' recur' : ''}">${esc(e.title)}${e._recurring ? ' ' + getIcon('repeat') : ''}</div>`).join('');
    const more = ev.length > 2 ? `<div class="cal-chip">+${ev.length-2}</div>` : '';
    return `<div class="cal-cell ${d.inMonth?'':'muted-day'} ${d.ymd===today?'today':''}" data-cal-day="${d.ymd}">
      <div class="cal-daynum">${d.day}</div>${chips}${more}
    </div>`;
  }).join('');
  const grid = `<div class="cal-grid" role="grid" aria-label="Calendario mensual">
    ${['L','M','X','J','V','S','D'].map(d=>`<div class="cal-head">${d}</div>`).join('')}${cells}
  </div>`;
  return `${header('mes', label, ym)}<section class="section" data-cal-ref="${ym}">${grid}</section>`;
}

function renderWeek(refYMD, events) {
  const start = startOfWeekMonday(refYMD.length===7?refYMD+'-01':refYMD) || refYMD;
  const days = []; for(let i=0;i<7;i++) days.push(addDaysYMD(start,i));
  const today = todayYMD();
  const weekStart = days[0];
  const weekEnd = days[6];
  const expandedEvents = expandRecurringEvents(events, weekStart, weekEnd);
  const byDay = groupByDay(expandedEvents);
  const label = `${fmtDate(days[0])} – ${fmtDate(days[6])}`;
  const cols = days.map(d => {
    const ev = (byDay[d]||[]).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
    const list = ev.length ? ev.map(e=>`<li class="row-item"><button class="row-tap" data-event-id="${esc(e._baseId || e.id)}"><span class="row-main"><span class="row-title">${esc(e.title)}${e._recurring ? ' ' + getIcon('repeat') : ''}</span><span class="row-sub">${esc(e.start||'Todo el día')}${e.end?'–'+esc(e.end):''}</span></span></button></li>`).join('') : `<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-main"><span class="row-sub">Sin eventos</span></span></div></li>`;
    return `<div class="surface" style="padding:10px"><div style="font-weight:600;margin-bottom:8px;${d===today?'color:var(--accent)':''}">${esc(new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric'}).format(parseToDate(d)).replace('.',''))}</div><ul class="row-list" style="border:none;border-radius:0">${list}</ul></div>`;
  }).join('');
  const grid = `<div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px" data-cal-ref="${start}">${cols}</div>`;
  return `${header('semana', label, start)}<section class="section">${grid}</section>`;
}

function groupByDay(events) {
  const m = {};
  for (const e of events) { if (!e.date) continue; (m[e.date] ||= []).push(e); }
  return m;
}
function parseToDate(ymd){ const p=parseYMD(ymd); return p?new Date(p.y,p.mo-1,p.d):new Date(); }

export function bindCalendario(root, ctx) {
  const refEl = root.querySelector('[data-cal-ref]');
  const ref = refEl ? refEl.dataset.calRef : todayYMD();
  root.querySelectorAll('[data-cal-view]').forEach(b=>b.addEventListener('click', ()=>{ ctx.ui.calView = b.dataset.calView; ctx.rerender(); }));
  root.querySelector('[data-cal-prev]')?.addEventListener('click', ()=>{ ctx.ui.calRef = ctx.ui.calView==='semana' ? addDaysYMD(ref, -7) : addMonthsYM(ref.slice(0,7), -1); ctx.rerender(); });
  root.querySelector('[data-cal-next]')?.addEventListener('click', ()=>{ ctx.ui.calRef = ctx.ui.calView==='semana' ? addDaysYMD(ref, 7) : addMonthsYM(ref.slice(0,7), 1); ctx.rerender(); });
  root.querySelector('[data-cal-today]')?.addEventListener('click', ()=>{ ctx.ui.calRef = ctx.ui.calView==='semana' ? todayYMD() : currentMonthYM(); ctx.rerender(); });
  root.querySelectorAll('[data-cal-add]').forEach(b=>b.addEventListener('click', ()=> openEventEditor(ctx, { date: todayYMD() })));
  root.querySelectorAll('[data-cal-day]').forEach(c=>c.addEventListener('click', ()=> openEventEditor(ctx, { date: c.dataset.calDay })));
  root.querySelectorAll('[data-event-id]').forEach(b=>b.addEventListener('click', ()=>{ const e=(ctx.state.events||[]).find(x=>x.id===b.dataset.eventId); if(e) openEventDetail(ctx,e); }));
}

function openEventEditor(ctx, ev=null) {
  const d = ev?.date || todayYMD();
  const recurrence = normalizeRecurrence(ev?.recurrence);
  const exc = ev?.exceptions || [];
  const content = `<div class="form-grid">
    <div class="field"><label for="ev-title">Título</label><input id="ev-title" value="${esc(ev?.title||'')}"></div>
    <div class="field"><label for="ev-date">Fecha</label><input id="ev-date" type="date" value="${esc(ev?.date||d)}"></div>
    <div class="field"><label for="ev-recurrence">Repetir</label><select id="ev-recurrence">${RECURRENCES.map(r=>`<option value="${r}" ${r===recurrence?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}</select></div>
    <div class="field"><label for="ev-exceptions">Excepciones (fechas separadas por comas)</label><input id="ev-exceptions" type="text" placeholder="2026-01-01, 2026-12-25" value="${esc(exc.join(', '))}"></div>
    <div class="grid-2"><div class="field"><label for="ev-start">Inicio</label><input id="ev-start" type="time" value="${esc(ev?.start||'')}"></div><div class="field"><label for="ev-end">Fin</label><input id="ev-end" type="time" value="${esc(ev?.end||'')}"></div></div>
    <div class="field"><label for="ev-loc">Lugar</label><input id="ev-loc" value="${esc(ev?.location||'')}"></div>
    <div class="field"><label for="ev-notes">Notas</label><textarea id="ev-notes" rows="3">${esc(ev?.notes||'')}</textarea></div>
  </div>`;
  const isEdit = !!ev?.id;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title: isEdit?'Editar evento':'Nuevo evento', content, footer });
  sh.el.querySelector('[data-close]').onclick = sh.close;
  sh.el.querySelector('[data-save]').onclick = async ()=>{
    const title = sh.el.querySelector('#ev-title').value.trim();
    const date = sh.el.querySelector('#ev-date').value;
    if (!title || !date) { toast('Añade título y fecha'); return; }
    const rec = sh.el.querySelector('#ev-recurrence').value;
    const excRaw = sh.el.querySelector('#ev-exceptions').value.trim();
    const exceptions = excRaw ? excRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const item = { ...(ev||{}), id: ev?.id || uid('e'), title, date, recurrence: rec, exceptions: exceptions.length ? exceptions : undefined, start: sh.el.querySelector('#ev-start').value, end: sh.el.querySelector('#ev-end').value, location: sh.el.querySelector('#ev-loc').value.trim(), notes: sh.el.querySelector('#ev-notes').value.trim(), updatedAt: new Date().toISOString(), createdAt: ev?.createdAt || new Date().toISOString() };
    try { await ctx.save('events', item); toast('Evento guardado'); sh.close(); await ctx.rerender(); } catch(_e){ toast('No se pudo guardar'); }
  };
}

function openEventDetail(ctx, ev) {
  const rec = normalizeRecurrence(ev?.recurrence);
  const exc = ev?.exceptions || [];
  const isRecurring = rec !== 'nunca';
  const content = `<div class="stack"><div class="kv"><div class="kv-row"><span>Fecha</span><strong>${esc(fmtDate(ev.date))}</strong></div>${isRecurring?`<div class="kv-row"><span>Repetición</span><strong>${rec.charAt(0).toUpperCase()+rec.slice(1)}</strong></div>${exc.length?`<div class="kv-row"><span>Excepciones</span><strong>${esc(exc.join(', '))}</strong></div>`:''}`:''}${ev.start?`<div class="kv-row"><span>Hora</span><strong>${esc(ev.start)}${ev.end?'–'+esc(ev.end):''}</strong></div>`:''}${ev.location?`<div class="kv-row"><span>Lugar</span><strong>${esc(ev.location)}</strong></div>`:''}</div>${ev.notes?`<p style="margin:0">${esc(ev.notes)}</p>`:''}
  <div class="inline-actions">${isRecurring ? `<button class="btn" data-del-this>Solo este</button><button class="btn danger" data-del-all>Toda la serie</button>` : ''}<button class="btn" data-edit>Editar</button><button class="btn danger" data-del>${isRecurring ? 'Eliminar base' : 'Eliminar'}</button></div></div>`;
  const sh = openSheet({ title: ev.title, content });
  sh.el.querySelector('[data-edit]').onclick = ()=>{ sh.close(); openEventEditor(ctx, ev); };
  sh.el.querySelector('[data-del]').onclick = async ()=>{ const ok=window.confirm('¿Eliminar este evento?'); if(!ok) return; try{ await ctx.del('events', ev.id); toast('Evento eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
  if (isRecurring) {
    const btnThis = sh.el.querySelector('[data-del-this]');
    const btnAll = sh.el.querySelector('[data-del-all]');
    if (btnThis) btnThis.onclick = async ()=>{ const ok=window.confirm('¿Eliminar solo esta ocurrencia? Se añadirá a excepciones.'); if(!ok) return; try{ const excNew = [...exc, ev.date]; await ctx.save('events',{...ev,exceptions:excNew, updatedAt:new Date().toISOString()}); toast('Ocurrencia omitida'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo actualizar'); } };
    if (btnAll) btnAll.onclick = async ()=>{ const ok=window.confirm('¿Eliminar TODA la serie de repetición?'); if(!ok) return; try{ await ctx.del('events', ev.id); toast('Serie eliminada'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
  }
}
