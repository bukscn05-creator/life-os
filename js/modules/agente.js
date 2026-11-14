// MÓDULO AGENTIC OS — Interfaz de usuario para agentes
// Permite ver agentes, enviar solicitudes y consultar historial de ejecuciones

import { pageHeader, esc, emptyState, statusPill } from '../ui/components.js';
import { openSheet, toast } from '../ui/render.js';

function agentStatusBadge(status) {
  const toneMap = {
    idle: 'neutral',
    running: 'blue',
    waiting: 'orange',
    completed: 'ok',
    failed: 'danger',
    paused: 'neutral'
  };
  const labelMap = {
    idle: 'Inactivo',
    running: 'Ejecutando',
    waiting: 'Esperando',
    completed: 'Completado',
    failed: 'Falló',
    paused: 'Pausado'
  };
  return statusPill(labelMap[status] || status, toneMap[status] || 'neutral');
}

function agentCard(agent) {
  return `
    <div class="surface stack agent-card" data-agent-id="${esc(agent.id)}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <h3 style="margin:0;font-size:17px;color:var(--ink)">${esc(agent.name)}</h3>
          <p style="margin:2px 0 0;font-size:13px;color:var(--ink-3)">${esc(agent.description)}</p>
        </div>
        ${agentStatusBadge(agent.status)}
      </div>
      <div class="kv" style="margin-top:8px">
        <div class="kv-row"><span>Tipo</span><strong>${esc(agent.type)}</strong></div>
        <div class="kv-row"><span>Herramientas</span><strong>${agent.tools ? agent.tools.join(', ') : '—'}</strong></div>
        <div class="kv-row"><span>Skills</span><strong>${agent.skills ? agent.skills.join(', ') : '—'}</strong></div>
        <div class="kv-row"><span>Ejecuciones</span><strong>${agent.executionCount || 0}</strong></div>
        <div class="kv-row"><span>Errores</span><strong style="color:${agent.errorCount > 0 ? 'var(--danger)' : 'var(--ink-2)'}">${agent.errorCount || 0}</strong></div>
      </div>
      <div class="inline-actions" style="margin-top:12px">
        <button class="btn" type="button" data-agent-chat="${esc(agent.id)}">Conversar</button>
        <button class="btn" type="button" data-agent-status="${esc(agent.id)}">Estado</button>
      </div>
    </div>
  `;
}

function executionItem(exec) {
  const tone = exec.status === 'completed' ? 'ok' : exec.status === 'failed' ? 'danger' : 'neutral';
  return `
    <li class="row-item execution-item" data-exec-id="${esc(exec.id)}">
      <div class="row-tap" style="cursor:default">
        <span class="row-icon" aria-hidden="true">${exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✗' : '○'}</span>
        <span class="row-main">
          <span class="row-title">${esc(exec.task?.description || exec.task?.type || 'Tarea')}</span>
          <span class="row-sub">${esc(exec.agentId || '')} · ${new Date(exec.timestamp).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </span>
        <span>${statusPill(exec.status, tone)}</span>
      </div>
    </li>
  `;
}

export function renderAgente(state, ui) {
  const agents = state?.agents || [];
  const executions = state?.agentExecutions || [];
  const recentExecutions = executions.slice(0, 10);

  return `
    ${pageHeader('Agentic OS', 'Agentes especializados y orquestación de tareas', `
      <button class="btn primary" type="button" data-agent-new-request>Nueva solicitud</button>
    `)}
    
    <section class="section">
      <h2 class="section-title">Agentes disponibles</h2>
      <div class="stack" style="gap:10px">
        ${agents.length ? agents.map(agentCard).join('') : emptyState('Sin agentes', 'No hay agentes configurados.')}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title>Historial de ejecuciones recientes</h2>
      <div class="surface stack">
        ${recentExecutions.length ? `
          <ul class="row-list">${recentExecutions.map(executionItem).join('')}</ul>
          <p class="field-help" style="margin-top:8px">${executions.length} ejecución(es) total(es)</p>
        ` : emptyState('Sin ejecuciones', 'Las ejecuciones de agentes aparecerán aquí.')}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Acciones rápidas</h2>
      <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
        <button class="btn" type="button" data-quick-action="finance_summary">Resumen financiero</button>
        <button class="btn" type="button" data-quick-action="daily_briefing">Briefing diario</button>
        <button class="btn" type="button" data-quick-action="attention_items">Elementos de atención</button>
        <button class="btn" type="button" data-quick-action="events_today">Eventos de hoy</button>
      </div>
    </section>
  `;
}

export function bindAgente(root, ctx) {
  // Conversar con agente específico
  root.querySelectorAll('[data-agent-chat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.dataset.agentChat;
      openAgentChat(ctx, agentId);
    });
  });

  // Ver estado de agente
  root.querySelectorAll('[data-agent-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.dataset.agentStatus;
      const agent = (ctx.state.agents || []).find(a => a.id === agentId);
      if (agent) {
        toast(`${agent.name}: ${agent.status}`);
      }
    });
  });

  // Nueva solicitud general
  root.querySelector('[data-agent-new-request]')?.addEventListener('click', () => {
    openAgentChat(ctx, null);
  });

  // Acciones rápidas
  root.querySelectorAll('[data-quick-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.quickAction;
      const intentMap = {
        'finance_summary': 'get_finance_summary',
        'daily_briefing': 'get_daily_briefing',
        'attention_items': 'get_attention_items',
        'events_today': 'get_events_today'
      };
      await sendAgentRequest(ctx, intentMap[action], {});
    });
  });
}

async function sendAgentRequest(ctx, intent, parameters = {}) {
  if (!ctx.agentManager) {
    toast('Agentic OS no disponible');
    return;
  }

  const result = await ctx.agentManager.receiveUserRequest(
    intent === 'get_finance_summary' ? '¿Cuál es mi resumen financiero?' :
    intent === 'get_daily_briefing' ? 'Dame el briefing diario' :
    intent === 'get_attention_items' ? '¿Qué elementos requieren atención?' :
    intent === 'get_events_today' ? '¿Qué eventos tengo hoy?' :
    ''
  );

  if (result.success) {
    toast(`Completado por ${result.agentName}`);
    await ctx.rerender();
  } else {
    toast(result.error || 'Error');
  }
}

function openAgentChat(ctx, agentId = null) {
  const agents = (ctx.state.agents || []).filter(a => a.status !== 'failed' && a.status !== 'paused');
  
  const agentOptions = agents.map(a => 
    `<option value="${esc(a.id)}">${esc(a.name)} (${esc(a.type)})</option>`
  ).join('');

  const defaultAgent = agentId ? agentId : (agents[0] ? agents[0].id : '');

  const content = `
    <div class="form-grid">
      <div class="field">
        <label>Agente</label>
        <select id="chat-agent">${agentOptions}</select>
      </div>
      <div class="field">
        <label>Solicitud</label>
        <textarea id="chat-input" rows="4" placeholder="Escribe tu solicitud en lenguaje natural..."></textarea>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn" type="button" data-chat-cancel>Cancelar</button>
    <button class="btn primary" type="button" data-chat-send>Enviar</button>
  `;

  const sh = openSheet({
    title: agentId ? 'Conversar con agente' : 'Nueva solicitud a agente',
    content,
    footer
  });

  sh.el.querySelector('[data-chat-cancel]').onclick = sh.close;
  sh.el.querySelector('#chat-agent').value = defaultAgent;

  sh.el.querySelector('[data-chat-send]').onclick = async () => {
    const input = sh.el.querySelector('#chat-input').value.trim();
    if (!input) {
      toast('Escribe una solicitud');
      return;
    }

    const selectedAgentId = sh.el.querySelector('#chat-agent').value;
    const agent = (ctx.state.agents || []).find(a => a.id === selectedAgentId);

    if (!ctx.agentManager) {
      toast('Agentic OS no disponible');
      return;
    }

    try {
      toast('Procesando solicitud...');
      const result = await ctx.agentManager.receiveUserRequest(input);
      
      if (result.success) {
        const results = result.result || {};
        let message = '';
        
        if (results.message) {
          message = results.message;
        } else if (results.summary) {
          message = results.summary;
        } else if (results.parsed) {
          message = `Transacción parseada: ${formatAmount(results.parsed.amountCents)} ${results.parsed.category}`;
        } else if (results.event) {
          message = `Evento creado: ${results.event.title}`;
        } else if (results.task) {
          message = `Tarea creada: ${results.task.title}`;
        } else if (results.note) {
          message = `Nota guardada: ${results.note.text}`;
        } else if (results.project) {
          message = `Proyecto creado: ${results.project.title}`;
        } else {
          message = `Completado por ${result.agentName}`;
        }

        toast(message);
        sh.close();
        await ctx.rerender();
      } else {
        toast(result.error || 'Error procesando solicitud');
      }
    } catch (e) {
      toast('Error al procesar');
    }
  };
}

function formatAmount(cents) {
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const centimos = abs % 100;
  return `${euros},${centimos.toString().padStart(2, '0')} €`;
}