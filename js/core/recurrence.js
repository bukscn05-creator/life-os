import { parseYMD, toYMD, daysInMonth, addDaysYMD, compareYMD, calendarDayDiff } from './dates.js';

export const RECURRENCES = ['nunca', 'diaria', 'semanal', 'mensual', 'anual'];

export function normalizeRecurrence(r) {
  const v = (r || 'nunca').toLowerCase();
  return RECURRENCES.includes(v) ? v : 'nunca';
}

function endOfMonth(y, mo) {
  return daysInMonth(y, mo);
}

function addOne(baseYMD, rule) {
  const p = parseYMD(baseYMD);
  if (!p) return null;
  const rec = normalizeRecurrence(rule);
  if (rec === 'nunca') return null;
  if (rec === 'diaria') return addDaysYMD(baseYMD, 1);
  if (rec === 'semanal') return addDaysYMD(baseYMD, 7);
  if (rec === 'mensual') {
    const nextMoDate = new Date(p.y, p.mo, 1); // month is 0-based in Date; p.mo is 1-based, so this is next month
    const ny = nextMoDate.getFullYear();
    const nmo = nextMoDate.getMonth() + 1;
    const nd = Math.min(p.d, endOfMonth(ny, nmo));
    return toYMD(ny, nmo, nd);
  }
  if (rec === 'anual') {
    const ny = p.y + 1;
    // 29-feb -> 28-feb on non-leap years
    let nd = p.d;
    let nmo = p.mo;
    if (p.mo === 2 && p.d === 29 && endOfMonth(ny, 2) < 29) nd = 28;
    else nd = Math.min(p.d, endOfMonth(ny, nmo));
    return toYMD(ny, nmo, nd);
  }
  return null;
}

export function nextOccurrenceAfter(baseYMD, rule, afterYMD) {
  // returns first occurrence > afterYMD (or >= depending use) - we compute > afterYMD for "next"
  const rec = normalizeRecurrence(rule);
  if (rec === 'nunca') return null;
  let cur = baseYMD;
  let guard = 0;
  // advance until cur > afterYMD
  while (cur && compareYMD(cur, afterYMD) <= 0) {
    const nxt = addOne(cur, rec);
    if (!nxt || nxt === cur) return null;
    cur = nxt;
    if (++guard > 2000) return null;
  }
  return cur;
}

export function occursOn(ymd, startYMD, rule, exceptions = []) {
  // check if ymd is an occurrence of series (startYMD, rule) and not excepted
  if (!ymd || !startYMD) return false;
  if (exceptions && exceptions.includes(ymd)) return false;
  const rec = normalizeRecurrence(rule);
  if (compareYMD(ymd, startYMD) < 0) return false;
  if (rec === 'nunca') return ymd === startYMD;
  if (ymd === startYMD) return true;
  if (rec === 'diaria') return true;
  if (rec === 'semanal') {
    const diff = calendarDayDiff(startYMD, ymd);
    return diff != null && diff >= 0 && diff % 7 === 0;
  }
  if (rec === 'mensual') {
    const s = parseYMD(startYMD), t = parseYMD(ymd);
    if (!s || !t) return false;
    // same day-of-month concept with month-end clamp: occurrence happens on min(start.day, endOfMonth(target))
    const targetDay = Math.min(s.d, daysInMonth(t.y, t.mo));
    return t.d === targetDay && (t.y > s.y || (t.y === s.y && t.mo >= s.mo));
  }
  if (rec === 'anual') {
    const s = parseYMD(startYMD), t = parseYMD(ymd);
    if (!s || !t) return false;
    if (t.y < s.y) return false;
    // 29-feb -> 28-feb in non-leap
    let targetDay = s.d;
    if (s.mo === 2 && s.d === 29 && daysInMonth(t.y, 2) < 29) targetDay = 28;
    else targetDay = Math.min(s.d, daysInMonth(t.y, s.mo));
    return t.mo === s.mo && t.d === targetDay;
  }
  return false;
}

export function occurrencesInRange(startYMD, rule, fromYMD, toYMD, exceptions = [], limit = 500) {
  const rec = normalizeRecurrence(rule);
  const out = [];
  if (!startYMD || !fromYMD || !toYMD || compareYMD(fromYMD, toYMD) > 0) return out;
  if (rec === 'nunca') {
    if (compareYMD(startYMD, fromYMD) >= 0 && compareYMD(startYMD, toYMD) <= 0 && !(exceptions||[]).includes(startYMD)) out.push(startYMD);
    return out;
  }
  // find first >= fromYMD
  let cur = startYMD;
  if (compareYMD(cur, fromYMD) < 0) {
    // step forward efficiently enough
    if (rec === 'diaria') {
      cur = fromYMD;
    } else if (rec === 'semanal') {
      const diff = calendarDayDiff(startYMD, fromYMD);
      const steps = diff > 0 ? Math.floor(diff / 7) : 0;
      cur = addDaysYMD(startYMD, steps * 7);
      if (compareYMD(cur, fromYMD) < 0) cur = addDaysYMD(cur, 7);
    } else if (rec === 'mensual' || rec === 'anual') {
      cur = startYMD;
      let guard = 0;
      while (cur && compareYMD(cur, fromYMD) < 0) {
        const nxt = addOne(cur, rec);
        if (!nxt) return out;
        cur = nxt;
        if (++guard > 2000) return out;
      }
    } else {
      let guard = 0;
      while (cur && compareYMD(cur, fromYMD) < 0) { const nxt = addOne(cur, rec); if (!nxt) return out; cur = nxt; if (++guard>2000) return out; }
    }
  }
  let guard = 0;
  while (cur && compareYMD(cur, toYMD) <= 0) {
    if (occursOn(cur, startYMD, rec, exceptions)) out.push(cur);
    const nxt = addOne(cur, rec);
    if (!nxt) break;
    cur = nxt;
    if (out.length >= limit || ++guard > 4000) break;
  }
  return out;
}

export function nextOccurrenceOnOrAfter(startYMD, rule, fromYMD, exceptions = []) {
  const list = occurrencesInRange(startYMD, rule, fromYMD, addDaysYMD(fromYMD, 366 * 5) || fromYMD, exceptions, 1);
  // occurrencesInRange starting at fromYMD may be heavy; do iterative
  const rec = normalizeRecurrence(rule);
  if (rec === 'nunca') return (compareYMD(startYMD, fromYMD) >= 0 && !(exceptions||[]).includes(startYMD)) ? startYMD : null;
  let cur = startYMD;
  if (compareYMD(cur, fromYMD) < 0) {
    if (rec === 'semanal') {
      const diff = calendarDayDiff(startYMD, fromYMD);
      const steps = diff > 0 ? Math.floor(diff / 7) : 0;
      cur = addDaysYMD(startYMD, steps * 7);
      while (cur && compareYMD(cur, fromYMD) < 0) cur = addDaysYMD(cur, 7);
    } else if (rec === 'diaria') {
      cur = fromYMD;
    } else {
      let guard = 0;
      while (cur && compareYMD(cur, fromYMD) < 0) { const nxt = addOne(cur, rec); if (!nxt) return null; cur = nxt; if (++guard>3000) return null; }
    }
  }
  let guard = 0;
  while (cur && guard++ < 3000) {
    if (!(exceptions||[]).includes(cur)) return cur;
    const nxt = addOne(cur, rec);
    if (!nxt) return null;
    cur = nxt;
  }
  return null;
}
