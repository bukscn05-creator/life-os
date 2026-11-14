// INSIGHTS OS — Análisis de datos reales
// Sistema de análisis con: hechos, estimaciones, predicciones, recomendaciones

import { pageHeader, esc, emptyState, fmtEUR, statusPill, getIcon } from '../ui/components.js';
import { getFinanceSummary, getAttentionItems, getTodayHabits, getNextAction } from './logic.js';
import { todayYMD, addDaysYMD } from '../core/dates.js';

// ============================================================
// TIPOS DE INSIGHT
// ============================================================
const INSIGHT_TYPES = {
  FACT: 'fact',           // Hecho verificado (dato real)
  ESTIMATE: 'estimate',   // Estimación (cálculo basado en datos actuales)
  PREDICTION: 'prediction', // Predicción (proyección, NO es hecho)
  RECOMMENDATION: 'recommendation', // Recomendación (acción sugerida)
  ALERT: 'alert',         // Alerta (requiere atención)
  TREND: 'trend'          // Tendencia (evolución a lo largo del tiempo)
};

const TYPE_LABELS = {
  fact: 'Hecho verificado',
  estimate: 'Estimación',
  prediction: 'Predicción',
  recommendation: 'Recomendación',
  alert: 'Alerta',
  trend: 'Tendencia'
};

const TYPE_TONES = {
  fact: 'neutral',
  estimate: 'blue',
  prediction: 'orange',
  recommendation: 'green',
  alert: 'danger',
  trend: 'indigo'
};

// ============================================================
// FUNCIONES DE ANÁLISIS
// ============================================================

function analyzeFinanceTrends(state) {
  const finance = getFinanceSummary(state);
  const transactions = (state.transactions || []).filter(t => !t.deletedAt);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const lastMonth = addDaysYMD(todayYMD(), -30).slice(0, 7);

  const currentMonthTx = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  const lastMonthTx = transactions.filter(t => t.date && t.date.startsWith(lastMonth));

  const currentSpent = currentMonthTx.filter(t => (t.amountCents || 0) < 0).reduce((s, t) => s + Math.abs(t.amountCents || 0), 0);
  const lastSpent = lastMonthTx.filter(t => (t.amountCents || 0) < 0).reduce((s, t) => s + Math.abs(t.amountCents || 0), 0);
  const currentIncome = currentMonthTx.filter(t => (t.amountCents || 0) > 0).reduce((s, t) => s + (t.amountCents || 0), 0);
  const lastIncome = lastMonthTx.filter(t => (t.amountCents || 0) > 0).reduce((s, t) => s + (t.amountCents || 0), 0);

  return { finance, currentSpent, lastSpent, currentIncome, lastIncome, currentMonth, lastMonth };
}

function buildInsights(state) {
  const insights = [];
  const { finance, currentSpent, lastSpent, currentIncome, lastIncome, currentMonth, lastMonth } = analyzeFinanceTrends(state);
  const attention = getAttentionItems(state);
  const habits = getTodayHabits(state);
  const goals = (state.goals || []).filter(g => !g.deletedAt);
  const projects = (state.projects || []).filter(p => !p.deletedAt);

  // ========== HECHOS VERIFICADOS ==========
  // Gasto real del mes actual (dato real de la base de datos)
  insights.push({
    type: INSIGHT_TYPES.FACT,
    title: `Gasto verificado este mes`,
    why: `Has gastado ${fmtEUR(currentSpent)} en ${currentMonth} según tus transacciones registradas.`,
    data: { value: currentSpent, period: currentMonth },
    action: ['Ver dinero', '#dinero']
  });

  // Ingreso real del mes actual
  if (currentIncome > 0) {
    insights.push({
      type: INSIGHT_TYPES.FACT,
      title: `Ingreso verificado este mes`,
      why: `Has recibido ${fmtEUR(currentIncome)} en ingresos durante ${currentMonth}.`,
      data: { value: currentIncome, period: currentMonth },
      action: ['Ver dinero', '#dinero']
    });
  }

  // Saldo neto real (hecho)
  const netBalance = currentIncome - currentSpent;
  insights.push({
    type: INSIGHT_TYPES.FACT,
    title: `Saldo neto del mes`,
    why: `Tu saldo neto es ${fmtEUR(netBalance)} (ingresos ${fmtEUR(currentIncome)} - gastos ${fmtEUR(currentSpent)}).`,
    data: { value: netBalance, type: netBalance >= 0 ? 'positivo' : 'negativo' },
    action: ['Ver dinero', '#dinero']
  });

  // Elementos que requieren atención (hecho)
  const urgentCount = attention.filter(a => a.tone === 'red' || a.label === 'Vencido' || a.label === 'Hoy').length;
  if (urgentCount > 0) {
    insights.push({
      type: INSIGHT_TYPES.ALERT,
      title: `${urgentCount} elemento${urgentCount !== 1 ? 's' : ''} requiere${urgentCount !== 1 ? 'n' : ''} atención urgente`,
      why: `Hay ${urgentCount} vencimiento${urgentCount !== 1 ? 's' : ''} crítico${urgentCount !== 1 ? 's' : ''} o elementos que vencen hoy.`,
      data: { count: urgentCount },
      action: ['Ver vencimientos', '#vence']
    });
  }

  // ========== ESTIMACIONES ==========
  // Presupuesto restante estimado (cálculo basado en datos actuales)
  if (finance.budgetTotal > 0) {
    const ratio = currentSpent / finance.budgetTotal;
    const remaining = finance.budgetTotal - currentSpent;
    insights.push({
      type: INSIGHT_TYPES.ESTIMATE,
      title: `Presupuesto restante estimado`,
      why: `Quedan aproximadamente ${fmtEUR(remaining)} de tu presupuesto de ${fmtEUR(finance.budgetTotal)} para este mes.`,
      data: { remaining, total: finance.budgetTotal, ratio },
      action: ['Ver dinero', '#dinero']
    });
  }

  // ========== PREDICCIONES (claramente marcadas como tales) ==========
  // Predicción de gasto fin de mes (NO es un hecho)
  if (lastSpent > 0 && currentSpent > 0) {
    const daysPassed = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyAvg = currentSpent / daysPassed;
    const projectedMonthEnd = dailyAvg * daysInMonth;
    const wouldExceed = projectedMonthEnd > finance.budgetTotal && finance.budgetTotal > 0;

    insights.push({
      type: INSIGHT_TYPES.PREDICTION,
      title: `Proyección de gasto a fin de mes`,
      why: `Si mantienes tu ritmo actual de gasto (${fmtEUR(Math.round(dailyAvg))}/día), se estima que gastarías ${fmtEUR(Math.round(projectedMonthEnd))} este mes.${wouldExceed ? ` Esto excedería tu presupuesto en ${fmtEUR(Math.round(projectedMonthEnd - finance.budgetTotal))}.` : ''}`,
      data: { projected: projectedMonthEnd, dailyAvg, wouldExceed, budgetTotal: finance.budgetTotal },
      isPrediction: true,
      action: ['Ver dinero', '#dinero']
    });
  }

  // Predicción de ahorro
  if (currentIncome > 0 && currentSpent > 0) {
    const monthlySavings = currentIncome - currentSpent;
    const yearlyProjection = monthlySavings * 12;
    insights.push({
      type: INSIGHT_TYPES.PREDICTION,
      title: `Proyección de ahorro anual`,
      why: `Si mantienes tu ritmo actual de ahorro (${fmtEUR(monthlySavings)}/mes), se estima ahorrar ${fmtEUR(Math.round(yearlyProjection))} en un año. Esta es una estimación basada en tu mes actual, no un hecho garantizado.`,
      data: { monthlySavings, yearlyProjection },
      isPrediction: true,
      action: ['Ver dinero', '#dinero']
    });
  }

  // ========== RECOMENDACIONES ==========
  // Recomendación basada en presupuesto excedido
  if (finance.budgetTotal > 0 && currentSpent > finance.budgetTotal * 0.9) {
    insights.push({
      type: INSIGHT_TYPES.RECOMMENDATION,
      title: `Revisar gastos antes de fin de mes`,
      why: `Has utilizado ${Math.round((currentSpent / finance.budgetTotal) * 100)}% de tu presupuesto mensual. Se recomienda revisar gastos no esenciales.`,
      data: { percentage: Math.round((currentSpent / finance.budgetTotal) * 100) },
      priority: 'alta',
      action: ['Ver dinero', '#dinero']
    });
  }

  // Recomendación de hábitos pendientes
  if (habits.total > 0 && habits.done < habits.total * 0.5) {
    insights.push({
      type: INSIGHT_TYPES.RECOMMENDATION,
      title: `Ponerte al día con hábitos`,
      why: `Solo has completado ${habits.done} de ${habits.total} hábitos hoy (${Math.round((habits.done / habits.total) * 100)}%). Se recomienda completar al menos la mitad antes de terminar el día.`,
      data: { done: habits.done, total: habits.total },
      priority: 'media',
      action: ['Ver hábitos', '#habitos']
    });
  }

  // Recomendación de objetivos estancados
  const stalledGoals = goals.filter(g => {
    const current = g.currentCents ?? g.current ?? 0;
    const target = g.targetCents ?? g.target ?? 0;
    return target > 0 && current === 0;
  });
  if (stalledGoals.length > 0) {
    insights.push({
      type: INSIGHT_TYPES.RECOMMENDATION,
      title: `${stalledGoals.length} objetivo${stalledGoals.length !== 1 ? 's' : ''} sin progreso`,
      why: `Tienes ${stalledGoals.length} objetivo${stalledGoals.length !== 1 ? 's' : ''} con metas definidas pero sin avance registrado. Se recomienda definir un primer paso para cada uno.`,
      data: { count: stalledGoals.length },
      priority: 'media',
      action: ['Ver objetivos', '#objetivos']
    });
  }

  // Recomendación de proyectos sin actualizar
  const staleProjects = projects.filter(p => {
    const updated = p.updatedAt || p.createdAt || '';
    const daysSinceUpdate = updated ? Math.floor((Date.now() - new Date(updated).getTime()) / (1000 * 60 * 60 * 24)) : 999;
    return daysSinceUpdate > 7;
  });
  if (staleProjects.length > 0) {
    insights.push({
      type: INSIGHT_TYPES.RECOMMENDATION,
      title: `${staleProjects.length} proyecto${staleProjects.length !== 1 ? 's' : ''} sin actualizar`,
      why: `Tienes ${staleProjects.length} proyecto${staleProjects.length !== 1 ? 's' : ''} con más de 7 días sin actualización. Se recomienda revisar su estado.`,
      data: { count: staleProjects.length },
      priority: 'baja',
      action: ['Ver proyectos', '#proyectos']
    });
  }

  // ========== TENDENCIAS ==========
  // Tendencia de gasto comparado con mes anterior
  if (lastSpent > 0) {
    const changePct = ((currentSpent - lastSpent) / lastSpent) * 100;
    const trendDirection = changePct > 5 ? 'alza' : changePct < -5 ? 'baja' : 'estable';
    insights.push({
      type: INSIGHT_TYPES.TREND,
      title: `Tendencia de gasto mensual`,
      why: `Comparado con ${lastMonth}, tu gasto ha cambiado un ${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}% (${fmtEUR(currentSpent)} vs ${fmtEUR(lastSpent)}). Tendencia: ${trendDirection}.`,
      data: { changePct, currentSpent, lastSpent, trendDirection },
      action: ['Ver dinero', '#dinero']
    });
  }

  // ========== ANÁLISIS DE PROGRESO ==========
  // Progreso general de objetivos activos
  const activeGoals = goals.filter(g => {
    const current = g.currentCents ?? g.current ?? 0;
    const target = g.targetCents ?? g.target ?? 0;
    return target > 0 && current < target;
  });
  if (activeGoals.length > 0) {
    const totalProgress = activeGoals.reduce((sum, g) => {
      const current = g.currentCents ?? g.current ?? 0;
      const target = g.targetCents ?? g.target ?? 0;
      return target > 0 ? sum + (current / target) : sum;
    }, 0);
    const avgProgress = Math.round((totalProgress / activeGoals.length) * 100);
    insights.push({
      type: INSIGHT_TYPES.FACT,
      title: `Progreso promedio de objetivos`,
      why: `Tus ${activeGoals.length} objetivo${activeGoals.length !== 1 ? 's' : ''} activo${activeGoals.length !== 1 ? 's' : ''} tienen un progreso promedio del ${avgProgress}%.`,
      data: { avgProgress, count: activeGoals.length },
      action: ['Ver objetivos', '#objetivos']
    });
  }

  // ========== RESUMEN EJECUTIVO ==========
  const totalAlerts = attention.filter(a => a.tone === 'red').length;
  const totalRecommendations = insights.filter(i => i.type === INSIGHT_TYPES.RECOMMENDATION).length;
  insights.push({
    type: INSIGHT_TYPES.FACT,
    title: 'Resumen de tu situación financiera',
    why: `Tienes ${urgentCount} elemento${urgentCount !== 1 ? 's' : ''} urgente${urgentCount !== 1 ? 's' : ''}, ${totalRecommendations} recomendación${totalRecommendations !== 1 ? 's' : ''} y un saldo de ${fmtEUR(netBalance)} este mes.`,
    data: { urgentCount, totalRecommendations, netBalance },
    summary: true,
    action: ['Ver todo', '#hoy']
  });

  // Ordenar: alertas primero, luego hechos, estimaciones, recomendaciones, predicciones, tendencias
  const typeOrder = { alert: 0, fact: 1, estimate: 2, recommendation: 3, prediction: 4, trend: 5 };
  insights.sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99));

  return insights.slice(0, 12); // Máximo 12 insights
}

function typeBadge(type) {
  return statusPill(TYPE_LABELS[type] || type, TYPE_TONES[type] || 'neutral');
}

function predictionWarning() {
  return `<p style="margin:4px 0 0 0;font-size:12px;color:var(--ink-3)"><strong>⚠️ Esta es una predicción basada en datos actuales, no un hecho garantizado.</strong> Los resultados reales pueden variar.</p>`;
}

export function renderInsights(state) {
  const insights = buildInsights(state || {});
  const finance = getFinanceSummary(state || {});
  const habits = getTodayHabits(state || {});

  // Estadísticas rápidas
  const stats = {
    netBalance: (finance.income || 0) - (finance.spent || 0),
    urgentAttention: getAttentionItems(state || {}).filter(a => a.tone === 'red' || a.label === 'Vencido' || a.label === 'Hoy').length,
    habitsProgress: habits.total ? Math.round((habits.done / habits.total) * 100) : 0,
    budgetRatio: finance.budgetTotal > 0 ? Math.round((finance.spent / finance.budgetTotal) * 100) : 0
  };

  const statsHtml = `
    <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px">
      <div class="surface stack" style="padding:16px;border-radius:16px">
        <p class="metric-label" style="margin:0 0 8px 0;font-size:13px;color:var(--ink-3)">Saldo neto del mes</p>
        <p class="metric-big tabular" style="margin:0;font-size:22px;font-weight:600;color:${stats.netBalance >= 0 ? 'var(--ok)' : 'var(--danger)'}">${fmtEUR(stats.netBalance)}</p>
      </div>
      <div class="surface stack" style="padding:16px;border-radius:16px">
        <p class="metric-label" style="margin:0 0 8px 0;font-size:13px;color:var(--ink-3)">Elementos urgentes</p>
        <p class="metric-big tabular" style="margin:0;font-size:22px;font-weight:600;color:${stats.urgentAttention > 0 ? 'var(--danger)' : 'var(--ok)'}">${stats.urgentAttention}</p>
      </div>
      <div class="surface stack" style="padding:16px;border-radius:16px">
        <p class="metric-label" style="margin:0 0 8px 0;font-size:13px;color:var(--ink-3)">Progreso de hábitos</p>
        <p class="metric-big tabular" style="margin:0;font-size:22px;font-weight:600;color:var(--ink)">${stats.habitsProgress}%</p>
      </div>
      <div class="surface stack" style="padding:16px;border-radius:16px">
        <p class="metric-label" style="margin:0 0 8px 0;font-size:13px;color:var(--ink-3)">Uso del presupuesto</p>
        <p class="metric-big tabular" style="margin:0;font-size:22px;font-weight:600;color:${stats.budgetRatio > 85 ? 'var(--danger)' : stats.budgetRatio > 60 ? 'var(--warn)' : 'var(--ok)'}">${stats.budgetRatio}%</p>
      </div>
    </div>
  `;

  if (insights.length === 0) {
    return `${pageHeader('Insights OS', 'Sin datos suficientes', '')}
    ${emptyState('Sin insights disponibles', 'Registra algunas transacciones, objetivos o proyectos para ver análisis automáticos.')}
    <p class="field-help" style="margin-top:12px">Los insights se generan automáticamente a partir de tus datos reales.</p>`;
  }

  const cardsHtml = insights.map(insight => {
    const isPrediction = insight.type === INSIGHT_TYPES.PREDICTION;
    const predictionHtml = isPrediction ? predictionWarning() : '';
    return `
      <article class="surface stack insight-card" style="margin-bottom:12px;border-left:4px solid var(--${TYPE_TONES[insight.type] || 'ink'})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
          <h3 style="margin:0;font-size:16px;font-weight:600;color:var(--ink)">${esc(insight.title)}</h3>
          ${typeBadge(insight.type)}
        </div>
        <p style="margin:0 0 8px 0;color:var(--ink-2);font-size:14px;line-height:1.4">${esc(insight.why)}${predictionHtml}</p>
        ${insight.data && insight.summary ? `<p style="margin:0 0 8px 0;font-size:12px;color:var(--ink-3)"><strong>Datos:</strong> urgentes: ${insight.data.urgentCount}, recomendaciones: ${insight.data.totalRecommendations}, saldo: ${fmtEUR(insight.data.netBalance)}</p>` : ''}
        <div><a class="btn" href="${insight.action[1]}" style="font-size:13px;padding:6px 12px">${esc(insight.action[0])}</a></div>
      </article>
    `;
  }).join('');

  const legendHtml = `
    <section class="section" style="margin-top:16px">
      <h2 class="section-title">Leyenda de tipos de insight</h2>
      <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
        ${Object.entries(INSIGHT_TYPES).map(([key, val]) => `
          <div class="surface stack" style="padding:10px;border-radius:8px;font-size:13px">
            ${typeBadge(val)}<br>
            <span style="color:var(--ink-3)">${key === 'prediction' ? 'Proyección no garantizada' : key === 'fact' ? 'Dato verificado' : key === 'estimate' ? 'Cálculo estimado' : key === 'recommendation' ? 'Acción sugerida' : key === 'alert' ? 'Requiere atención' : 'Evolución temporal'}</span>
          </div>
        `).join('')}
      </div>
      <p class="field-help" style="margin-top:8px;font-size:12px"><strong>Importante:</strong> Las predicciones son proyecciones basadas en tus datos actuales y no representan resultados garantizados. Los hechos verificados son datos reales de tu base de datos local.</p>
    </section>
  `;

  return `${pageHeader('Insights OS', 'Análisis de tus datos con hechos, estimaciones y recomendaciones', '')}
  ${statsHtml}
  <section class="section"><h2 class="section-title">Análisis e insights</h2>${cardsHtml}</section>
  ${legendHtml}`;
}

export function bindInsights(root, ctx) {
  // Los insights son de solo lectura (visualización), no hay acciones de edición directa
  // Los enlaces de acción navegan a los módulos correspondientes
}