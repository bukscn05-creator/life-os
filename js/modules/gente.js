import { pageHeader, esc, fmtDate, emptyState } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';

export function renderGente(state){
  const people = (state.people||[]).filter(p=>!p.deletedAt).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const rows = people.map(p=>`<li class="row-item"><button class="row-tap" data-person-id="${esc(p.id)}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(p.name)}</span><span class="row-sub">${p.birthday?('Cumpleaños: '+fmtDate(p.birthday)):''}${p.lastContact? (p.birthday?' · ':'')+'Último contacto: '+fmtDate(p.lastContact):''}</span></span></button></li>`).join('');
  return `${pageHeader('Gente','Personas importantes', `<button class="btn primary" data-person-add>Añadir</button>`)}
  ${rows?`<ul class="row-list">${rows}</ul>`:emptyState('Sin contactos','Añade personas para recordar fechas y contactos.')}`;
}

export function bindGente(root, ctx){
  root.querySelectorAll('[data-person-add]').forEach(b=>b.addEventListener('click',()=>openEditor(ctx)));
  root.querySelectorAll('[data-person-id]').forEach(b=>b.addEventListener('click',()=>{ const p=(ctx.state.people||[]).find(x=>x.id===b.dataset.personId); if(p) openDetail(ctx,p); }));
}
function openEditor(ctx,p=null){
  const isEdit=!!p?.id;
  const content=`<div class="form-grid"><div class="field"><label>Nombre</label><input id="p-name" value="${esc(p?.name||'')}"></div><div class="field"><label>Cumpleaños</label><input id="p-bday" type="date" value="${esc(p?.birthday||'')}"></div><div class="field"><label>Último contacto</label><input id="p-last" type="date" value="${esc(p?.lastContact||'')}"></div><div class="field"><label>Notas</label><textarea id="p-notes" rows="3">${esc(p?.notes||'')}</textarea></div></div>`;
  const footer=`<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh=openSheet({title:isEdit?'Editar persona':'Nueva persona',content,footer});
  sh.el.querySelector('[data-close]').onclick=sh.close;
  sh.el.querySelector('[data-save]').onclick=async()=>{
    const name=sh.el.querySelector('#p-name').value.trim(); if(!name){ toast('Introduce un nombre'); return; }
    const item={...(p||{}),id:p?.id||uid('p'),name,birthday:sh.el.querySelector('#p-bday').value,lastContact:sh.el.querySelector('#p-last').value,notes:sh.el.querySelector('#p-notes').value.trim(),updatedAt:new Date().toISOString(),createdAt:p?.createdAt||new Date().toISOString()};
    try{ await ctx.save('people',item); toast('Guardado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo guardar'); }
  };
}
function openDetail(ctx,p){
  const content=`<div class="stack">${p.notes?`<p style="margin:0">${esc(p.notes)}</p>`:''}<div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh=openSheet({title:p.name,content});
  sh.el.querySelector('[data-edit]').onclick=()=>{sh.close();openEditor(ctx,p);};
  sh.el.querySelector('[data-del]').onclick=async()=>{const ok=window.confirm('¿Eliminar este contacto?'); if(!ok) return; try{ await ctx.del('people',p.id); toast('Eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); }};
}
