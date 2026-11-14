import { pageHeader, esc, fmtEUR, emptyState, progressBar } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';

export function renderObjetivos(state){
  const goals = (state.goals||[]).filter(g=>!g.deletedAt);
  const rows = goals.map(g=>{
    const curCents=g.currentCents??Math.round(Number(g.current||0)*100);
    const targetCents=g.targetCents??Math.round(Number(g.target||0)*100);
    const pct = targetCents>0?Math.min(100, Math.round(curCents/targetCents*100)):0;
    const unit = g.unit || '';
    const val = unit==='€' ? `${fmtEUR(curCents)} de ${fmtEUR(targetCents)}` : `${curCents/100} de ${targetCents/100} ${esc(unit)}`.trim();
    return `<li class="row-item"><button class="row-tap" data-goal-id="${esc(g.id)}"><span class="row-icon"></span><span class="row-main"><span class="row-title">${esc(g.title)}</span><span class="row-sub">${val}</span>${targetCents?progressBar(pct,'ok'):''}</span></button></li>`;
  }).join('');
  return `${pageHeader('Objetivos', goals.length?`${goals.length} objetivos`:'Metas personales', `<button class="btn primary" data-goal-add>Añadir</button>`)}
  ${rows?`<ul class="row-list">${rows}</ul>`:emptyState('Sin objetivos','Define metas y sigue tu progreso.')}`;
}

export function bindObjetivos(root, ctx){
  root.querySelectorAll('[data-goal-add]').forEach(b=>b.addEventListener('click',()=>openEditor(ctx)));
  root.querySelectorAll('[data-goal-id]').forEach(b=>b.addEventListener('click',()=>{ const g=(ctx.state.goals||[]).find(x=>x.id===b.dataset.goalId); if(g) openDetail(ctx,g); }));
}
function openEditor(ctx,g=null){
  const isEdit=!!g?.id;
  const curCents=g.currentCents??Math.round(Number(g.current||0)*100);
  const targetCents=g.targetCents??Math.round(Number(g.target||0)*100);
  const content=`<div class="form-grid"><div class="field"><label>Título</label><input id="g-title" value="${esc(g?.title||'')}"></div>
  <div class="grid-2"><div class="field"><label>Actual</label><input id="g-current" inputmode="decimal" value="${curCents?esc(String(curCents/100).replace('.',',')):'0'}"></div><div class="field"><label>Meta</label><input id="g-target" inputmode="decimal" value="${targetCents?esc(String(targetCents/100).replace('.',',')):''}"></div></div>
  <div class="field"><label>Unidad</label><input id="g-unit" value="${esc(g?.unit||'')}" placeholder="€, libros, km…"></div></div>`;
  const footer=`<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh=openSheet({title:isEdit?'Editar objetivo':'Nuevo objetivo',content,footer});
  sh.el.querySelector('[data-close]').onclick=sh.close;
  sh.el.querySelector('[data-save]').onclick=async()=>{
    const title=sh.el.querySelector('#g-title').value.trim(); if(!title){ toast('Introduce un título'); return; }
    const p=(v)=>{v=v.trim().replace(/\./g,'').replace(',','.'); if(!v) return 0; const n=Number(v); return Number.isNaN(n)?0:n;};
    const current = p(sh.el.querySelector('#g-current').value);
    const target = p(sh.el.querySelector('#g-target').value);
    const item={...(g||{}),id:g?.id||uid('g'),title,current,currentCents:Math.round(current*100),target,targetCents:Math.round(target*100),unit:sh.el.querySelector('#g-unit').value.trim(),updatedAt:new Date().toISOString(),createdAt:g?.createdAt||new Date().toISOString()};
    try{ await ctx.save('goals',item); toast('Objetivo guardado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo guardar'); }
  };
}
function openDetail(ctx,g){
  const curCents=g.currentCents??Math.round(Number(g.current||0)*100);
  const targetCents=g.targetCents??Math.round(Number(g.target||0)*100);
  const content=`<div class="stack"><div class="kv"><div class="kv-row"><span>Actual</span><strong>${g.unit==='€'?fmtEUR(curCents):(curCents/100)}</strong></div><div class="kv-row"><span>Meta</span><strong>${g.unit==='€'?fmtEUR(targetCents):(targetCents/100)}</strong></div></div><div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh=openSheet({title:g.title,content});
  sh.el.querySelector('[data-edit]').onclick=()=>{sh.close();openEditor(ctx,g);};
  sh.el.querySelector('[data-del]').onclick=async()=>{const ok=window.confirm('¿Eliminar este objetivo?'); if(!ok) return; try{ await ctx.del('goals',g.id); toast('Objetivo eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); }};
}