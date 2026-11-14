import { todayYMD, addDaysYMD, weekdayIndexMondayFirst, parseYMD, startOfWeekMonday, compareYMD } from './dates.js';

export const DAY_LETTERS = ['L','M','X','J','V','S','D']; // Mon-Sun

export function habitIsActive(h) { return h && h.active !== false && !h.deletedAt; }

export function habitDays(h) {
  // returns array of weekday indices 0-6 (Mon-Sun) when habit applies
  if (!h) return [0,1,2,3,4,5,6];
  if (Array.isArray(h.daysOfWeek) && h.daysOfWeek.length) return h.daysOfWeek;
  if (h.frequency === 'semanal') return [];
  // diario default
  return [0,1,2,3,4,5,6];
}

export function isHabitDueOn(h, ymd) {
  if (!habitIsActive(h)) return false;
  const idx = weekdayIndexMondayFirst(ymd);
  if (idx == null) return false;
  const days = habitDays(h);
  if (h.frequency === 'semanal') return false; // weekly count handled separately
  return days.includes(idx);
}

export function weekRangeFor(ymd) {
  const start = startOfWeekMonday(ymd);
  const days = [];
  for (let i=0;i<7;i++) days.push(addDaysYMD(start, i));
  return { start, end: days[6], days };
}

export function entriesSet(state, habitId) {
  const set = new Set();
  for (const e of (state.habitEntries || [])) {
    if (e && e.habitId === habitId && e.done && !e.deletedAt) set.add(e.date);
  }
  return set;
}

export function weeklyStats(h, state, refYMD = todayYMD()) {
  // Semana lunes-domingo. Para hábitos diarios: denominador = días transcurridos de la semana hasta hoy.
  // Para hábitos de días concretos: días programados hasta hoy.
  // Racha no se rompe hasta que acaba el día (so "today" pending doesn't break).
  const { days } = weekRangeFor(refYMD);
  const set = entriesSet(state, h.id);
  const today = refYMD;
  let dueSoFar = 0, doneSoFar = 0, dueTotal = 0, doneTotal = 0;
  for (const d of days) {
    const due = isHabitDueOn(h, d) || (h.frequency === 'semanal');
    if (due) dueTotal++;
    const done = set.has(d);
    if (done && due) doneTotal++;
    if (compareYMD(d, today) <= 0) {
      if (due) { dueSoFar++; if (done) doneSoFar++; }
    }
  }
  if (h.frequency === 'semanal') {
    // weekly target: once per week (or targetPerWeek) - denominator 1 (or target) for elapsed? simplify: count completions this week vs target
    const target = Math.max(1, Number(h.targetPerWeek || 1));
    const count = days.filter(d => set.has(d)).length;
    const pct = target ? Math.round((Math.min(count, target) / target) * 100) : 0;
    return { dueSoFar: 1, doneSoFar: count >= 1 ? 1 : 0, dueTotal: 1, doneTotal: count >= 1 ? 1 : 0, pct, count, target, days, set };
  }
  const denom = dueSoFar || 0;
  const pct = denom ? Math.round((doneSoFar / denom) * 100) : 0;
  return { dueSoFar, doneSoFar, dueTotal, doneTotal, pct, days, set };
}

export function streak(h, state, refYMD = todayYMD()) {
  // consecutive days (considering due days) up to today where done; if today due but not done, don't break until end of day -> count up to yesterday
  const set = entriesSet(state, h.id);
  let cur = refYMD;
  // if today is due and not done, start from yesterday for streak display
  if (isHabitDueOn(h, cur) && !set.has(cur)) {
    cur = addDaysYMD(cur, -1);
  }
  let count = 0;
  let guard = 0;
  while (cur && guard++ < 3660) {
    const due = isHabitDueOn(h, cur) || h.frequency === 'semanal';
    if (h.frequency === 'semanal') break; // streak less meaningful; skip
    if (!due) { cur = addDaysYMD(cur, -1); continue; }
    if (set.has(cur)) { count++; cur = addDaysYMD(cur, -1); }
    else break;
  }
  return count;
}

export function bestStreak(h, state, lookbackDays = 365, refYMD = todayYMD()) {
  if (h.frequency === 'semanal') return 0;
  const set = entriesSet(state, h.id);
  let best = 0, cur = 0;
  let d = addDaysYMD(refYMD, -lookbackDays);
  while (d && compareYMD(d, refYMD) <= 0) {
    if (isHabitDueOn(h, d)) {
      if (set.has(d)) { cur++; if (cur > best) best = cur; }
      else { if (compareYMD(d, refYMD) < 0) cur = 0; /* today pending doesn't reset best mid-calc except as end */ }
    }
    d = addDaysYMD(d, 1);
  }
  return best;
}
