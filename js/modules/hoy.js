// HOY — COMMAND CENTER (Centro de Mando)
// Dashboard principal con resumen unificado de todos los módulos de LIFE OS

import { pageHeader, esc, fmtEUR, fmtDate, daysUntil, emptyState, progressBar, statusPill, getIcon } from '../ui/components.js';
import { getFinanceSummary, getAttentionItems, getTodayHabits, getNextAction, todayISO } from './logic.js';
import { greetingForDate, formatDateLong, todayYMD } from '../core/dates.js';
import { openSheet, toast } from '../ui/render.js';
import { uid } from '../core/ids.js';

function metricCard(label, value, subtitle, tone = 'neutral') {
  return `
    <div class="surface stack metric-card" style="padding:16px;border-radius:16px">
      <p class="metric-label" style="margin:0 0 8px 0;font-size:13px;color:var(--ink-3)">${esc(label)}</p>
      <p class="metric-big tabular" style="margin:0 0 4px 0;font-size:22px;font-weight:600;color:var(--ink)">${esc(value)}</p>
      <p class="muted" style="margin:0;font-size:12px;color:var(--ink-3)">${esc(subtitle)}</p>
    </div>
  `;
}

function quickActionCard(title, subtitle, icon, onClickAttr) {
  return `
    <button class="surface stack quick-action" type="button" ${onClickAttr} style="padding:16px;border-radius:16px;display:flex;align-items:center;gap:12px;cursor:pointer;border:none;background:var(--surface-2);border:1px solid var(--border)">
      <span style="font-size:20px">${esc(icon)}</span>
      <div>
        <p style="margin:0;font-size:15px;font-weight:600;color:var(--ink)">${esc(title)}</p>
        <p style="margin:2px 0 0;font-size:13px;color:var(--ink-3)">${esc(subtitle)}</p>
      </div>
    </button>
  `;
}

export function renderHoy(state) {
  const now = new Date();
  const today = todayYMD(now);
  const greeting = `${greetingForDate(now)} · ${formatDateLong(today)}`;
  const finance = getFinanceSummary(state);
  const attention = getAttentionItems(state);
  const urgentAttention = attention.filter(a => a.tone === 'red' || a.label === 'Vencido' || a.label === 'Hoy');
  const upcomingAttention = attention.filter(a => a.tone === 'orange' || (a.label.match(/(\d+)/) && Number(a.label.match(/(\d+)/)[1]) <= 3));
  const habits = getTodayHabits(state);
  const next = getNextAction(state);
  const events = (state.events || []).filter(e => e.date === todayISO() && !e.deletedAt).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  const goals = (state.goals || []).filter(g => !g.deletedAt && !g.deletedAt);
  const activeGoals = goals.filter(g => {
    const current = g.currentCents ?? g.current ?? 0;
    const target = g.targetCents ?? g.target ?? 0;
    return target > 0 && current < target;
  }).slice(0, 5);
  const recentActivity = (state.notes || []).filter(n => !n.deletedAt).slice(0, 5);
  const pct = habits.total ? Math.round((habits.done / habits.total) * 100) : 0;

  // Resumen inteligente
  const intelligence = {
    needsAttention: urgentAttention.length,
    upcomingDeadlines: upcomingAttention.length,
    goalsOnTrack: activeGoals.length,
    financeHealth: finance.estimatedFreeAfterCommitments >= 0 ? 'positiva' : 'negativa',
    habitsProgress: habits.total ? Math.round((habits.done / habits.total) * 100) : 0
  };

  const greetingCard = `<section class="surface stack"><h1 style="margin:0;font-size:28px;color:var(--ink)">${esc(greeting.split(' · ')[0])}</h1><p style="margin:4px 0 0;color:var(--ink-2)">${esc(greeting.split(' · ')[1] || '')}</p></section>`;

  const intelligenceCards = `
    <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px">
      ${metricCard('Requiere atención', intelligence.needsAttention, 'Vencidos y vencen hoy', intelligence.needsAttention > 0 ? 'danger' : 'ok')}
      ${metricCard('Próximos 3 días', intelligence.upcomingDeadlines, 'Compromisos próximos', intelligence.upcomingDeadlines > 0 ? 'warn' : 'ok')}
      ${metricCard('Objetivos activos', intelligence.goalsOnTrack, 'En progreso', intelligence.goalsOnTrack > 0 ? 'ok' : 'neutral')}
      ${metricCard('Salud financiera', intelligence.financeHealth === 'positiva' ? 'Positiva' : 'Negativa', `Libre: ${fmtEUR(finance.estimatedFreeAfterCommitments || 0)}`, intelligence.financeHealth === 'positiva' ? 'ok' : 'danger')}
    </div>
  `;

  const nextCard = `<section class="surface stack"><h2 class="section-title">Lo siguiente</h2>
    <div><p style="margin:0;font-size:22px;font-weight:600;color:var(--ink)">${esc(next.text || 'Sin próximos elementos')}</p>
    <p style="margin:6px 0 0;color:var(--ink-2)">${esc(next.meta || '')}</p></div></section>`;

  const attentionHtml = urgentAttention.length ? `<ul class="row-list">${urgentAttention.map(a=>`<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">${getIcon(a.kind === 'deadline' ? 'vence' : a.kind === 'subscription' ? 'suscripciones' : a.kind === 'appointment' ? 'calendario' : a.kind === 'birthday' ? 'gente' : 'alert')}</span><span class="row-main"><span class="row-title">${esc(a.title)}</span><span class="row-sub">${esc(a.meta||'')}</span></span><span>${statusPill(a.label, a.tone==='red'?'danger':a.tone==='orange'?'warn':'neutral')}</span></div></li>`).join('')}</ul>` : emptyState('Nada urgente', 'No hay elementos críticos que requieran atención.');

  const upcomingHtml = upcomingAttention.length ? `<ul class="row-list">${upcomingAttention.map(a=>`<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">${getIcon(a.kind === 'deadline' ? 'vence' : a.kind === 'subscription' ? 'suscripciones' : a.kind === 'appointment' ? 'calendario' : a.kind === 'birthday' ? 'gente' : 'alert')}</span><span class="row-main"><span class="row-title">${esc(a.title)}</span><span class="row-sub">${esc(a.meta||'')}</span></span><span>${statusPill(a.label, 'neutral')}</span></div></li>`).join('')}</ul>` : '';

  const habitRows = habits.total ? habits.habits.slice(0,6).map(h=>{
    const done = habits.doneSet.has(h.id);
    return `<li class="row-item"><button type="button" class="row-tap" data-habit-toggle="${esc(h.id)}" aria-pressed="${done?'true':'false'}"><span class="row-icon" aria-hidden="true">${done ? getIcon('check') : ''}</span><span class="row-main"><span class="row-title">${esc(h.name)}</span><span class="row-sub">${done?'Hecho hoy':'Pendiente'}</span></span></button></li>`;
  }).join('') : '';
  const habitsHtml = habits.total ? `<ul class="row-list">${habitRows}</ul><div style="margin-top:10px">${progressBar(pct, pct>=80?'ok':pct>=40?'warn':'')}<p class="muted" style="margin:6px 0 0;font-size:14px">${habits.done} de ${habits.total} hábitos hoy</p></div>` : emptyState('Sin hábitos', 'Añade hábitos para ver tu progreso diario.');

  const moneyHtml = `<div class="stack"><div><p class="metric-label">Libre tras compromisos</p><p class="metric-big tabular">${fmtEUR(finance.estimatedFreeAfterCommitments || 0)}</p></div>
    <div class="stacked-bar" aria-label="Gastado, comprometido y libre"><span style="width:${Math.min(100, finance.budgetTotal? (finance.spent/finance.budgetTotal*100):0)}%;background:var(--danger)"></span><span style="width:${Math.min(100, finance.budgetTotal? (finance.committed/finance.budgetTotal*100):0)}%;background:var(--warn)"></span></div>
    <div class="kv"><div class="kv-row"><span>Gastado</span><strong>${fmtEUR(finance.spent)}</strong></div><div class="kv-row"><span>Comprometido</span><strong>${fmtEUR(finance.committed||0)}</strong></div></div></div>`;

  const agendaHtml = events.length ? `<ul class="row-list">${events.map(e=>`<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">${getIcon('evento')}</span><span class="row-main"><span class="row-title">${esc(e.title)}</span><span class="row-sub">${esc(e.start||'Todo el día')}${e.end?'–'+esc(e.end):''}${e.location?' · '+esc(e.location):''}</span></span></div></li>`).join('')}</ul>` : emptyState('Sin eventos hoy', 'Tu agenda de hoy está libre.');

  const goalsHtml = activeGoals.length ? `<ul class="row-list">${activeGoals.map(g=>{
    const current = g.currentCents ?? g.current ?? 0;
    const target = g.targetCents ?? g.target ?? 0;
    const pctG = target > 0 ? Math.round((current / target) * 100) : 0;
    return `<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">🎯</span><span class="row-main"><span class="row-title">${esc(g.title)}</span><span class="row-sub">${fmtEUR(current)} de ${fmtEUR(target)}</span></span><span>${progressBar(pctG, pctG>=80?'ok':pctG>=40?'warn':'')}</span></div></li>`;
  }).join('')}</ul>` : emptyState('Sin objetivos activos', 'Crea objetivos para hacer seguimiento de tu progreso.');

  const activityHtml = recentActivity.length ? `<ul class="row-list">${recentActivity.map(n=>`<li class="row-item"><div class="row-tap" style="cursor:default"><span class="row-icon" aria-hidden="true">📝</span><span class="row-main"><span class="row-title">${esc(n.text)}</span><span class="row-sub">${esc(fmtDate(n.date))}</span></span></div></li>`).join('')}</ul>` : emptyState('Sin actividad reciente', 'Tus notas y actividades aparecerán aquí.');

  const quickActions = `
    <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
      ${quickActionCard('Crear tarea', 'Añadir nueva tarea', '✅', 'data-quick-action="create_task"')}
      ${quickActionCard('Crear evento', 'Agregar a calendario', '📅', 'data-quick-action="create_event"')}
      ${quickActionCard('Registrar gasto', 'Movimiento de dinero', '💸', 'data-quick-action="record_expense"')}
      ${quickActionCard('Registrar ingreso', 'Entrada de dinero', '💰', 'data-quick-action="record_income"')}
      ${quickActionCard('Crear objetivo', 'Nueva meta', '🎯', 'data-quick-action="create_goal"')}
      ${quickActionCard('Crear proyecto', 'Nuevo proyecto', '📁', 'data-quick-action="create_project"')}
      ${quickActionCard('Consultar asistente', 'Preguntar al agente', '🤖', 'data-quick-action="ask_assistant"')}
      ${quickActionCard('Ejecutar automatización', 'Flujo automático', '⚡', 'data-quick-action="run_automation"')}
    </div>
  `;

  return `${pageHeader('Command Center', 'Tu vida, organizada en un solo lugar', `
    <button class="btn primary" type="button" data-agent-new-request>Asistente</button>
  `)}
  
  ${greetingCard}
  ${intelligenceCards}
  
  <div class="grid-2">
    <div class="stack">
      ${nextCard}
      <section class="section"><h2 class="section-title">Requiere atención</h2>${attentionHtml}</section>
      ${upcomingHtml ? `<section class="section"><h2 class="section-title">Próximos 3 días</h2>${upcomingHtml}</section>` : ''}
      <section class="section"><h2 class="section-title">Hábitos de hoy</h2>${habitsHtml}</section>
    </div>
    <div class="stack">
      <section class="surface stack"><h2 class="section-title">Dinero del mes</h2>${moneyHtml}</section>
      <section class="section"><h2 class="section-title">Agenda de hoy</h2>${agendaHtml}</section>
      <section class="section"><h2 class="section-title">Objetivos activos</h2>${goalsHtml}</section>
      <section class="section"><h2 class="section-title">Actividad reciente</h2>${activityHtml}</section>
    </div>
  </div>
  
  <section class="section"><h2 class="section-title">Acciones rápidas</h2>${quickActions}</section>`;
}

export function bindHoy(root, ctx) {
  // Hábitos toggle
  root.querySelectorAll('[data-habit-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const hid = btn.dataset.habitToggle;
      const today = todayYMD();
      const existing = (ctx.state.habitEntries||[]).find(e => e.habitId===hid && e.date===today && !e.deletedAt);
      try {
        if (existing) {
          if (existing.done) { await ctx.del('habitEntries', existing.id); }
          else { await ctx.save('habitEntries', { ...existing, done: true }); }
        } else {
          await ctx.save('habitEntries', { id: uid('he'), habitId: hid, date: today, done: true });
        }
        toast('Hábito actualizado');
        await ctx.rerender();
      } catch(_e){ toast('No se pudo actualizar'); }
    });
  });

  // Asistente
  root.querySelector('[data-agent-new-request]')?.addEventListener('click', () => {
    if (ctx.agentManager) {
      // Open agent chat - delegate to agente module's openAgentChat if available
      const event = new CustomEvent('open-agent-chat', { detail: { agentId: null }, bubbles: true });
      root.dispatchEvent(event);
    } else {
      toast('Agentic OS no disponible');
    }
  });

  // Acciones rápidas
  root.querySelectorAll('[data-quick-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.quickAction;
      if (!ctx.agentManager) {
        toast('Agentic OS no disponible');
        return;
      }

      const intentMap = {
        'create_task': 'Crear una tarea nueva',
        'create_event': 'Crear un evento en el calendario',
        'record_expense': 'Registrar un gasto',
        'record_income': 'Registrar un ingreso',
        'create_goal': 'Crear un objetivo nuevo',
        'create_project': 'Crear un proyecto nuevo',
        'ask_assistant': 'Consultar al asistente personal',
        'run_automation': 'Ejecutar una automatización'
      };

      const prompt = intentMap[action] || action;
      const result = await ctx.agentManager.receiveUserRequest(prompt);

      if (result.success) {
        toast(`✓ ${result.result?.message || 'Completado'} (por ${result.agentName})`);
        await ctx.rerender();
      } else {
        toast(result.error || 'Error al ejecutar');
      }
    });
  });
}