import { pageHeader, esc, emptyState, progressBar } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD, weekRangeFor } from '../core/dates.js';
import { weeklyStats, streak, DAY_LETTERS } from '../core/habits.js';

export function renderHabitos(state) {
  const habits = (state.habits||[]).filter(h=>!h.deletedAt);
  const today = todayYMD();
  const rows = habits.map(h=>{
    const st = weeklyStats(h, state, today);
    const wk = weekRangeFor(today);
    const daysHtml = wk.days.map((d,i)=>{
      const due = h.frequency==='semanal' ? true : true; // simplify visual
      const done = st.set && st.set.has(d);
      const future = d > today;
      return `<button class="habit-day ${done?'done':''} ${future?'future':''}" data-habit-day="${esc(h.id)}" data-day="${d}" aria-label="${DAY_LETTERS[i]} ${d}: ${done?'hecho':'pendiente'}" aria-pressed="${done?'true':'false'}" ${future?'disabled':''}>${DAY_LETTERS[i]}</button>`;
    }).join('');
    const sk = streak(h, state, today);
    return `<li class="row-item" style="align-items:flex-start;flex-direction:column"><div style="display:flex;justify-content:space-between;gap:12px;width:100%"><button class="row-tap" data-habit-id="${esc(h.id)}" style="padding:0;min-height:auto"><span class="row-main"><span class="row-title">${esc(h.name)}</span><span class="row-sub">${st.doneSoFar}/${st.dueSoFar||st.dueTotal||0} esta semana · racha ${sk}</span></span></button></div><div class="habit-week" style="width:100%;margin-top:8px">${daysHtml}</div><div style="width:100%;margin-top:8px">${progressBar(st.pct || 0, (st.pct||0)>=80?'ok':(st.pct||0)>=40?'warn':'')}</div></li>`;
  }).join('');
  return `${pageHeader('Hábitos', habits.length?`${habits.length} hábitos`:'Seguimiento diario', `<button class="btn primary" data-habit-add>Añadir</button>`)}
  ${rows?`<ul class="row-list">${rows}</ul>`:emptyState('Sin hábitos', 'Crea hábitos para hacer seguimiento de tu rutina.')}`;
}

export function bindHabitos(root, ctx){
  root.querySelectorAll('[data-habit-add]').forEach(b=>b.addEventListener('click',()=>openEditor(ctx)));
  root.querySelectorAll('[data-habit-id]').forEach(b=>b.addEventListener('click',()=>{ const h=(ctx.state.habits||[]).find(x=>x.id===b.dataset.habitId); if(h) openDetail(ctx,h); }));
  root.querySelectorAll('[data-habit-day]').forEach(b=>b.addEventListener('click', async ()=>{
    const hid=b.dataset.habitDay, day=b.dataset.day;
    const existing = (ctx.state.habitEntries||[]).find(e=>e.habitId===hid && e.date===day && !e.deletedAt);
    try{
      if (existing && existing.done) await ctx.del('habitEntries', existing.id);
      else if (existing) await ctx.save('habitEntries',{...existing,done:true,updatedAt:new Date().toISOString()});
      else await ctx.save('habitEntries',{id:uid('he'),habitId:hid,date:day,done:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      await ctx.rerender();
    }catch(_e){ toast('No se pudo actualizar'); }
  }));
}

function openEditor(ctx,h=null){
  const isEdit=!!h?.id;
  const content = `<div class="form-grid"><div class="field"><label>Nombre</label><input id="h-name" value="${esc(h?.name||'')}"></div></div>`;
  const footer = `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`;
  const sh = openSheet({ title:isEdit?'Editar hábito':'Nuevo hábito', content, footer });
  sh.el.querySelector('[data-close]').onclick=sh.close;
  sh.el.querySelector('[data-save]').onclick = async ()=>{
    const name = sh.el.querySelector('#h-name').value.trim();
    if(!name){ toast('Introduce un nombre'); return; }
    const item = { ...(h||{}), id:h?.id||uid('h'), name, active:h?.active!==false, frequency:h?.frequency||'diario', updatedAt:new Date().toISOString(), createdAt:h?.createdAt||new Date().toISOString() };
    try{ await ctx.save('habits', item); toast('Hábito guardado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo guardar'); }
  };
}
function openDetail(ctx,h){
  const content = `<div class="stack"><p class="muted" style="margin:0">Seguimiento semanal de lunes a domingo.</p><div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh = openSheet({ title:h.name, content });
  sh.el.querySelector('[data-edit]').onclick = ()=>{ sh.close(); openEditor(ctx,h); };
  sh.el.querySelector('[data-del]').onclick = async ()=>{ const ok=window.confirm('¿Eliminar este hábito?'); if(!ok) return; try{ await ctx.del('habits', h.id); toast('Hábito eliminado'); sh.close(); await ctx.rerender(); }catch(_e){ toast('No se pudo eliminar'); } };
}
