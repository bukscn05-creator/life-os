import { fmtEUR, daysUntil } from '../ui/components.js';
import { todayYMD, currentMonthYM, addMonthsYM, calendarDayDiff, parseYMD } from '../core/dates.js';
import { countLabel } from '../core/plural.js';
import { getFinanceSummary as getFinanceSummaryCents } from '../core/budget.js';

export function todayISO() { return todayYMD(); }
export function currentMonthISO() { return currentMonthYM(); }

export function daysUntilBirthday(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]), day = Number(m[3]);
  const t = todayYMD();
  const tp = parseYMD(t);
  if (!tp) return null;
  let target = `${tp.y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const td = new Date(tp.y, month, 0).getDate();
  const dd = Math.min(day, td);
  target = `${tp.y}-${String(month).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  if (target < t) {
    const ny = tp.y + 1;
    const td2 = new Date(ny, month, 0).getDate();
    target = `${ny}-${String(month).padStart(2,'0')}-${String(Math.min(day, td2)).padStart(2,'0')}`;
  }
  return calendarDayDiff(t, target);
}

export function getFinanceSummary(state) {
  const centsSummary = getFinanceSummaryCents(state);
  return {
    month: centsSummary.month,
    budget: centsSummary.budget,
    budgetTotal: centsSummary.budgetTotalCents,
    income: centsSummary.incomeCents,
    spent: centsSummary.spentCents,
    budgetRemaining: centsSummary.budgetRemainingCents,
    net: centsSummary.balanceCents,
    obligationsMonth: centsSummary.deadlineCommitCents,
    subsMonthly: centsSummary.subsMonthlyTotalCents,
    subsDueThisMonth: centsSummary.subsMonthCents,
    committed: centsSummary.committedCents,
    estimatedFreeAfterCommitments: centsSummary.freeAfterCommitmentsCents,
    savingsPotsTotal: centsSummary.savingsPotsTotalCents,
    prevSpent: centsSummary.prevSpentCents,
    projection: centsSummary.projectionCents,
    daysInMonth: centsSummary.daysInMonth,
    dayOfMonth: centsSummary.dayOfMonth
  };
}

export function getAttentionItems(state) {
  const items = [];
  for (const d of (state.deadlines || []).filter(x => !x.completed && !x.deletedAt)) {
    const days = daysUntil(d.dueDate || d.date);
    if (days == null) continue;
    const amountCents = d.amountCents ?? (d.amount != null ? Math.round(Number(d.amount) * 100) : 0);
    if (days < 0) items.push({ priority: 100 + Math.abs(days), tone: 'red', label: 'Vencido', title: d.title, meta: `${d.dueDate || d.date}${amountCents ? ' · ' + fmtEUR(amountCents) : ''}`, kind: 'deadline', id: d.id });
    else if (days === 0) items.push({ priority: 95, tone: 'red', label: 'Hoy', title: d.title, meta: `${amountCents ? fmtEUR(amountCents) : 'Vence hoy'}`, kind: 'deadline', id: d.id });
    else if (days <= 3) items.push({ priority: 80 - days, tone: 'orange', label: countLabel(days, '1 día', `${days} días`), title: d.title, meta: `${d.dueDate}${amountCents ? ' · ' + fmtEUR(amountCents) : ''}`, kind: 'deadline', id: d.id });
  }
  for (const s of (state.subscriptions || []).filter(x => x.active !== false && !x.deletedAt)) {
    const days = daysUntil(s.nextCharge);
    if (days != null && days >= 0 && days <= 3) {
      const amountCents = s.amountCents ?? Math.round(Number(s.amount || 0) * 100);
      items.push({ priority: 70 - days, tone: days <= 1 ? 'orange' : 'blue', label: days === 0 ? 'Cobro hoy' : countLabel(days, '1 día', `${days} días`), title: `Cobro: ${s.name}`, meta: `${fmtEUR(amountCents)} · ${s.nextCharge}`, kind: 'subscription', id: s.id });
    }
  }
  for (const p of (state.people || []).filter(x=>!x.deletedAt)) {
    const days = daysUntilBirthday(p.birthday);
    if (days != null && days <= 7) {
      items.push({ priority: days === 0 ? 75 : 60 - days, tone: days === 0 ? 'orange' : 'blue', label: days === 0 ? 'Cumpleaños' : countLabel(days, '1 día', `${days} días`), title: p.name, meta: days === 0 ? 'Cumpleaños hoy' : 'Cumpleaños próximo', kind: 'birthday', id: p.id });
    }
  }
  for (const a of (state.appointments || []).filter(x=>!x.deletedAt)) {
    const days = daysUntil(a.date);
    if (days != null && days >= 0 && days <= 3) {
      items.push({ priority: 72 - days, tone: 'blue', label: days === 0 ? 'Hoy' : countLabel(days, '1 día', `${days} días`), title: a.title, meta: `${a.date}${a.time ? ' · ' + a.time : ''}${a.place ? ' · ' + a.place : ''}`, kind: 'appointment', id: a.id });
    }
  }
  return items.sort((a,b) => b.priority - a.priority).slice(0, 6);
}

export function getTodayHabits(state) {
  const today = todayYMD();
  const doneSet = new Set((state.habitEntries || []).filter(e => e.date === today && e.done && !e.deletedAt).map(e => e.habitId));
  const habits = (state.habits || []).filter(h => h.active !== false && !h.deletedAt);
  const done = habits.filter(h => doneSet.has(h.id)).length;
  return { today, habits, doneSet, done, total: habits.length };
}

export function getNextAction(state) {
  const today = todayYMD();
  const nowHM = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const events = (state.events || []).filter(e => e.date === today && !e.deletedAt).sort((a,b) => (a.start||'').localeCompare(b.start||''));
  const nextEvent = events.find(e => (e.start || '00:00') >= nowHM) || events[0];
  if (nextEvent) return { text: `Próximo: ${nextEvent.title}`, meta: `${nextEvent.start || 'Todo el día'}${nextEvent.end ? '–'+nextEvent.end : ''}` };
  const att = getAttentionItems(state)[0];
  if (att) return { text: `Atención: ${att.title}`, meta: att.meta || att.label };
  const habits = getTodayHabits(state);
  if (habits.total && habits.done < habits.total) return { text: 'Hábitos pendientes', meta: `${habits.done} de ${habits.total} completados hoy` };
  return { text: 'Todo en orden por ahora', meta: 'Sin acciones urgentes.' };
}