import { pageHeader, esc, fmtDate, emptyState } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';

export function renderSalud(state){
  const appts = (state.appointments||[]).filter(a=>!a.deletedAt).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const entries = (state.healthEntries||[]).filter(e=>!e.deletedAt).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const apptRows = appts.map(a=>`<li class="row-item"><button class="row-tap" data-appt-id="${esc(a.id)}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(a.title)}</span><span class="row-sub">${esc(fmtDate(a.date))}${a.time?' · '+esc(a.time):''}${a.place?' · '+esc(a.place):''}</span></span></button></li>`).join('');
  const entryRows = entries.map(e=>`<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(e.type||'Registro')}</span><span class="row-sub">${esc(fmtDate(e.date))}</span></span><span class="row-value">${esc(e.value||'')}${e.unit?' '+esc(e.unit):''}</span></div></li>`).join('');
  return `${pageHeader('Salud','Citas y registros', `<button class="btn" data-appt-add>Nueva cita</button><button class="btn primary" data-entry-add>Nuevo registro</button>`)}
  <section class="section"><h2 class="section-title">Citas</h2>${apptRows?`<ul class="row-list">${apptRows}</ul>`:emptyState('Sin citas','Añade tus próximas citas.')}</section>
  <section class="section"><h2 class="section-title">Registros</h2>${entryRows?`<ul class="row-list">${entryRows}</ul>`:emptyState('Sin registros','Guarda datos como peso o sueño para hacer seguimiento.')}</section>`;
}

export function bindSalud(root, ctx){
  root.querySelectorAll('[data-appt-add]').forEach(b=>b.addEventListener('click',()=>openAppt(ctx)));
  root.querySelectorAll('[data-entry-add]').forEach(b=>b.addEventListener('click',()=>openEntry(ctx)));
  root.querySelectorAll('[data-appt-id]').forEach(b=>b.addEventListener('click',()=>{ const a=(ctx.state.appointments||[]).find(x=>x.id===b.dataset.apptId); if(a) openApptDetail(ctx,a); }));
}

function openAppt(ctx,a=null){
  const isEdit=!!a?.id;
  const content = `<div class="form-grid">
    <div class="field"><label>Título</label><input id="a-title" value="${esc(a?.title||'')}"></div>
    <div class="field"><label>Fecha</label><input id="a-date" type="date" value="${esc(a?.date||todayYMD())}"></div>
    <div class="field"><label>Hora</label><input id="a-time" type="time" value="${esc(a?.time||'')}"></div>
    <div class="field"><label>Lugar</label><input id="a-place" value="${esc(a?.place||'')}"></div>
  </div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh=openSheet({title:isEdit?'Editar cita':'Nueva cita',content,footer});
  sh.el.querySelector('[data-close]').onclick=sh.close;
  sh.el.querySelector('[data-save]').onclick=async()=>{
    const title=sh.el.querySelector('#a-title').value.trim(); const date=sh.el.querySelector('#a-date').value;
    if(!title||!date){ toast('Añade título y fecha'); return; }
    const item={...(a||{}),id:a?.id||uid('a'),title,date,time:sh.el.querySelector('#a-time').value,place:sh.el.querySelector('#a-place').value.trim(),updatedAt:new Date().toISOString(),createdAt:a?.createdAt||new Date().toISOString()};
    try{ await ctx.save('appointments',item); toast('Cita guardada'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo guardar'); }
  };
}
function openApptDetail(ctx,a){
  const content=`<div class="stack"><div class="kv"><div class="kv-row"><span>Fecha</span><strong>${esc(fmtDate(a.date))}</strong></div>${a.time?`<div class="kv-row"><span>Hora</span><strong>${esc(a.time)}</strong></div>`:''}${a.place?`<div class="kv-row"><span>Lugar</span><strong>${esc(a.place)}</strong></div>`:''}</div><div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh=openSheet({title:a.title,content});
  sh.el.querySelector('[data-edit]').onclick=()=>{sh.close();openAppt(ctx,a);};
  sh.el.querySelector('[data-del]').onclick=async()=>{const ok=window.confirm('¿Eliminar esta cita?'); if(!ok) return; try{ await ctx.del('appointments',a.id); toast('Cita eliminada'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); }};
}
function openEntry(ctx){
  const content=`<div class="form-grid"><div class="field"><label>Tipo</label><input id="e-type" placeholder="Peso, sueño…"></div><div class="field"><label>Fecha</label><input id="e-date" type="date" value="${todayYMD()}"></div><div class="grid-2"><div class="field"><label>Valor</label><input id="e-value"></div><div class="field"><label>Unidad</label><input id="e-unit" placeholder="kg, h…"></div></div></div>`;
  const footer=`<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh=openSheet({title:'Nuevo registro',content,footer});
  sh.el.querySelector('[data-close]').onclick=sh.close;
  sh.el.querySelector('[data-save]').onclick=async()=>{
    const type=sh.el.querySelector('#e-type').value.trim(); const date=sh.el.querySelector('#e-date').value;
    if(!type||!date){ toast('Añade tipo y fecha'); return; }
    const item={id:uid('he'),type,date,value:sh.el.querySelector('#e-value').value.trim(),unit:sh.el.querySelector('#e-unit').value.trim(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    try{ await ctx.save('healthEntries',item); toast('Registro guardado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo guardar'); }
  };
}
