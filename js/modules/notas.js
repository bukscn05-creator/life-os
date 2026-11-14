import { pageHeader, esc, emptyState, fmtDate } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';
import { todayYMD } from '../core/dates.js';

export function renderNotas(state) {
  const notes = (state.notes || []).filter(n => !n.deletedAt).sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0) || (b.date||'').localeCompare(a.date||'') || (b.updatedAt||'').localeCompare(a.updatedAt||''));
  const rows = notes.map(n => `<li class="row-item"><button type="button" class="row-tap" data-note-id="${esc(n.id)}">
    <span class="row-icon" aria-hidden="true">${n.pinned ? '★' : '•'}</span>
    <span class="row-main"><span class="row-title">${esc((n.text||'Nota').slice(0,60))}${(n.text||'').length>60?'…':''}</span><span class="row-sub">${esc(n.date ? fmtDate(n.date) : '')}${n.pinned ? ' · Fijada' : ''}</span></span>
    <span class="row-chevron">›</span>
  </button></li>`).join('');
  const list = rows ? `<ul class="row-list">${rows}</ul>` : emptyState('Sin notas', 'Guarda ideas o recordatorios rápidos.', `<button class="btn primary" type="button" data-note-add>Crear nota</button>`);
  return `${pageHeader('Notas', notes.length ? `${notes.length} notas` : 'Apuntes rápidos', `<button class="btn primary" type="button" data-note-add>Nueva nota</button>`)}
  <section class="section">${list}</section>`;
}

export function bindNotas(root, ctx) {
  root.querySelectorAll('[data-note-add]').forEach(b=>b.addEventListener('click', ()=> openEditor(ctx)));
  root.querySelectorAll('[data-note-id]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.dataset.noteId;
    const note = (ctx.state.notes||[]).find(n=>n.id===id);
    if (note) openDetail(ctx, note);
  }));
}

function openEditor(ctx, note=null) {
  const isEdit = !!note;
  const content = `<div class="form-grid">
    <div class="field"><label for="note-text">Nota</label><textarea id="note-text" rows="6" style="min-height:140px;resize:vertical">${esc(note?.text||'')}</textarea></div>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="note-pinned" ${note?.pinned?'checked':''}> <span>Fijar nota</span></label>
  </div>`;
  const footer = `<button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="button" data-save>${isEdit?'Guardar':'Crear'}</button>`;
  const sh = openSheet({ title: isEdit?'Editar nota':'Nueva nota', content, footer });
  sh.el.querySelector('[data-close]')?.addEventListener('click', sh.close);
  sh.el.querySelector('[data-save]')?.addEventListener('click', async ()=>{
    const text = sh.el.querySelector('#note-text').value.trim();
    if (!text) { toast('Escribe una nota'); return; }
    const item = { ...(note||{}), id: note?.id || uid('n'), text, pinned: sh.el.querySelector('#note-pinned').checked, date: note?.date || todayYMD(), updatedAt: new Date().toISOString(), createdAt: note?.createdAt || new Date().toISOString() };
    try { await ctx.save('notes', item); toast(isEdit?'Nota guardada':'Nota creada'); sh.close(); await ctx.rerender(); } catch(_e){ toast('No se pudo guardar'); }
  });
}

function openDetail(ctx, note) {
  const content = `<div class="stack"><p class="note-text" style="white-space:pre-wrap;margin:0">${esc(note.text||'')}</p><p class="muted" style="margin:0;font-size:14px">${note.date?fmtDate(note.date):''}${note.pinned?' · Fijada':''}</p>
  <div class="inline-actions"><button class="btn" data-edit>Editar</button><button class="btn danger" data-del>Eliminar</button></div></div>`;
  const sh = openSheet({ title: 'Nota', content });
  sh.el.querySelector('[data-edit]')?.addEventListener('click', ()=>{ sh.close(); openEditor(ctx, note); });
  sh.el.querySelector('[data-del]')?.addEventListener('click', async ()=>{
    const ok = window.confirm('¿Eliminar esta nota?');
    if (!ok) return;
    try { await ctx.del('notes', note.id); toast('Nota eliminada'); sh.close(); await ctx.rerender(); } catch(_e){ toast('No se pudo eliminar'); }
  });
}
