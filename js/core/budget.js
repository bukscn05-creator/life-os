import { centsFromNumber, sumCents } from './money.js';
import { todayYMD, currentMonthYM, parseYMD, daysInMonth, calendarDayDiff } from './dates.js';
import { nextOccurrenceOnOrAfter } from './recurrence.js';

/**
 * Módulo único de finanzas/fórmulas (F6).
 * Importes en céntimos internamente; acepta datos legacy en euros (number).
 * Definiciones:
 * - Presupuesto: total presupuestado del mes.
 * - Gastado: suma de gastos del mes (transacciones tipo gasto / importe negativo).
 * - Ingresos: suma de ingresos del mes.
 * - Balance: Ingresos - Gastado.
 * - Comprometido: vencimientos pendientes con importe cuya fecha cae en el mes + cobros de suscripciones activas
 *   cuyo próximo cobro cae en el mes y no están ya registrados/enlazados de forma duplicada.
 * - Libre tras compromisos: (base mensual = Ingresos si hay, si no Presupuesto) - Gastado - Comprometido.
 * - Proyección a fin de mes: estimación lineal (Gastado / días transcurridos) * días del mes. Solo mostrar con >=7 días de datos.
 */

export function txCents(t) {
  // prefer amountCents, else amount number
  if (t && Number.isInteger(t.amountCents)) return t.amountCents;
  return centsFromNumber(t ? t.amount : 0);
}

export function isExpense(t) {
  if (!t) return false;
  if (t.type === 'gasto') return true;
  if (t.type === 'ingreso') return false;
  return txCents(t) < 0;
}

export function isIncome(t) {
  if (!t) return false;
  if (t.type === 'ingreso') return true;
  if (t.type === 'gasto') return false;
  return txCents(t) > 0;
}

export function monthOfDate(ymd) {
  return (ymd || '').slice(0, 7);
}

function deadlineAmountCents(d) {
  if (!d) return 0;
  if (Number.isInteger(d.amountCents)) return d.amountCents;
  if (d.amount == null || d.amount === '') return 0;
  return centsFromNumber(d.amount);
}

function subAmountCents(s) {
  if (!s) return 0;
  if (Number.isInteger(s.amountCents)) return s.amountCents;
  return centsFromNumber(s.amount || 0);
}

export function subscriptionMonthlyCents(s) {
  const a = subAmountCents(s);
  if (!s) return 0;
  if (s.period === 'anual') return Math.round(a / 12);
  if (s.period === 'semanal') return Math.round((a * 52) / 12);
  return a; // mensual
}

export function subscriptionYearlyCents(s) {
  const a = subAmountCents(s);
  if (!s) return 0;
  if (s.period === 'anual') return a;
  if (s.period === 'semanal') return a * 52;
  return a * 12;
}

export function nextSubscriptionChargeYMD(s, fromYMD) {
  if (!s || s.active === false) return null;
  // prefer computed from nextCharge/startDate + period; recalc on-the-fly
  const base = s.nextCharge || s.startDate;
  if (!base) return null;
  const rec = s.period === 'anual' ? 'anual' : s.period === 'semanal' ? 'semanal' : 'mensual';
  // If nextCharge is in future or today keep it if aligned; compute on/after from
  const occ = nextOccurrenceOnOrAfter(base, rec, fromYMD, s.exceptions || []);
  return occ;
}

export function getFinanceSummary(state, { ym, today } = {}) {
  const month = ym || currentMonthYM();
  today = today || todayYMD();
  const budgets = state.budgets || [];
  const budget = budgets.find(b => b.month === month) || { totalCents: centsFromNumber((budgets.find(b=>b.month===month)||{}).total || 0), categories: {} };
  const budgetTotalCents = Number.isInteger(budget.totalCents) ? budget.totalCents : centsFromNumber(budget.total || 0);

  const txs = (state.transactions || []).filter(t => monthOfDate(t.date) === month && !t.deletedAt);
  const incomes = txs.filter(isIncome);
  const expenses = txs.filter(isExpense);
  const incomeCents = incomes.reduce((s, t) => s + Math.abs(txCents(t)), 0);
  const spentCents = expenses.reduce((s, t) => s + Math.abs(txCents(t)), 0);
  const balanceCents = incomeCents - spentCents;

  // Comprometido: pending deadlines with amount in month (not completed)
  const pendingDeadlines = (state.deadlines || []).filter(d => !d.completed && !d.deletedAt);
  const deadlineCommitCents = pendingDeadlines
    .filter(d => monthOfDate(d.dueDate || d.date) === month)
    .filter(d => deadlineAmountCents(d) > 0)
    .reduce((s, d) => s + deadlineAmountCents(d), 0);

  // Subscriptions active: charge occurring this month (on-the-fly), not double-counting if linked to a deadline in month? simple rule: count sub charges in month not marked paid/linked
  let subsMonthCents = 0;
  const activeSubs = (state.subscriptions || []).filter(s => s.active !== false && !s.deletedAt);
  for (const s of activeSubs) {
    const charge = nextSubscriptionChargeYMD(s, month + '-01');
    if (charge && monthOfDate(charge) === month) {
      // avoid double count if a pending deadline explicitly linked to this subscription exists in month
      const linked = pendingDeadlines.some(d => d.subscriptionId && d.subscriptionId === s.id && monthOfDate(d.dueDate || d.date) === month);
      if (!linked) subsMonthCents += subAmountCents(s);
    }
  }
  const committedCents = deadlineCommitCents + subsMonthCents;

  const baseCents = incomeCents > 0 ? incomeCents : budgetTotalCents;
  const freeAfterCommitmentsCents = baseCents - spentCents - committedCents;
  const budgetRemainingCents = budgetTotalCents - spentCents;

  const subsMonthlyTotalCents = activeSubs.reduce((s, sub) => s + subscriptionMonthlyCents(sub), 0);
  const savingsPotsTotalCents = (state.savingsPots || []).filter(p=>!p.deletedAt).reduce((s, p) => s + (Number.isInteger(p.currentCents) ? p.currentCents : centsFromNumber(p.current||0)), 0);

  const prevYm = month === '0000-01' ? month : (function(){ const [y,m]=month.split('-').map(Number); const d=new Date(y,m-2,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
  const prevSpentCents = (state.transactions || []).filter(t => monthOfDate(t.date) === prevYm && isExpense(t) && !t.deletedAt).reduce((s,t)=>s+Math.abs(txCents(t)),0);
  const hasPrev = (state.transactions || []).some(t => monthOfDate(t.date) === prevYm && !t.deletedAt);

  const [yy, mm] = month.split('-').map(Number);
  const dim = daysInMonth(yy, mm);
  const monthStart = `${month}-01`;
  let dayOfMonth = dim;
  if (monthOfDate(today) === month) {
    dayOfMonth = Math.max(1, Number(today.slice(8,10)));
  } else if (today < monthStart) {
    dayOfMonth = 0;
  }
  const projectionCents = dayOfMonth >= 1 ? Math.round((spentCents / dayOfMonth) * dim) : 0;
  const showProjection = dayOfMonth >= 7 || (today > `${month}-${String(dim).padStart(2,'0')}`);

  return {
    month, today, budget, budgetTotalCents, incomeCents, spentCents, balanceCents,
    budgetRemainingCents, committedCents, freeAfterCommitmentsCents,
    deadlineCommitCents, subsMonthCents, subsMonthlyTotalCents, savingsPotsTotalCents,
    prevSpentCents, hasPrevData: hasPrev, projectionCents, showProjection, dayOfMonth, daysInMonth: dim
  };
}
