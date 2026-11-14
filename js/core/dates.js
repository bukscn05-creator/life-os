/* Fechas y horas — Europe/Berlin, es-ES. Parseo seguro (sin new Date('YYYY-MM-DD')). */

export const TZ = 'Europe/Berlin';
export const LOCALE = 'es-ES';

export function parseYMD(ymd) {
  if (typeof ymd !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { y, mo, d };
}

export function parseHM(hm) {
  if (typeof hm !== 'string') return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

export function ymdToLocalDate(ymd) {
  const p = parseYMD(ymd);
  if (!p) return null;
  return new Date(p.y, p.mo - 1, p.d);
}

export function toYMD(y, mo, d) {
  return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export function nowInTZ(date = new Date(), tz = TZ) {
  // Return parts of "now" in target timezone
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return {
    y: Number(parts.year), mo: Number(parts.month), d: Number(parts.day),
    h: Number(parts.hour === '24' ? '00' : parts.hour), min: Number(parts.minute), s: Number(parts.second)
  };
}

export function todayYMD(date = new Date(), tz = TZ) {
  const n = nowInTZ(date, tz);
  return toYMD(n.y, n.mo, n.d);
}

export function currentMonthYM(date = new Date(), tz = TZ) {
  const n = nowInTZ(date, tz);
  return `${String(n.y).padStart(4,'0')}-${String(n.mo).padStart(2,'0')}`;
}

export function calendarDayDiff(ymdA, ymdB) {
  const a = parseYMD(ymdA), b = parseYMD(ymdB);
  if (!a || !b) return null;
  const utcA = Date.UTC(a.y, a.mo - 1, a.d);
  const utcB = Date.UTC(b.y, b.mo - 1, b.d);
  return Math.round((utcB - utcA) / 86400000);
}

export function daysUntil(ymd, fromDate = new Date(), tz = TZ) {
  if (!ymd) return null;
  const t = todayYMD(fromDate, tz);
  return calendarDayDiff(t, ymd);
}

export function daysInMonth(y, mo) {
  return new Date(y, mo, 0).getDate();
}

export function addDaysYMD(ymd, delta) {
  const p = parseYMD(ymd);
  if (!p) return null;
  const dt = new Date(p.y, p.mo - 1, p.d + delta);
  return toYMD(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function addMonthsYM(ym, delta) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

export function clampDay(y, mo, day) {
  return Math.min(day, daysInMonth(y, mo));
}

export function compareYMD(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isValidYMD(ymd) { return !!parseYMD(ymd); }

export function weekdayIndexMondayFirst(ymd) {
  // 0=Lunes ... 6=Domingo
  const p = parseYMD(ymd);
  if (!p) return null;
  const js = new Date(p.y, p.mo - 1, p.d).getDay(); // 0=Sun
  return (js + 6) % 7;
}

export function startOfWeekMonday(ymd) {
  const idx = weekdayIndexMondayFirst(ymd);
  if (idx == null) return null;
  return addDaysYMD(ymd, -idx);
}

export function formatDateShort(ymd, tz = TZ) {
  const dt = ymdToLocalDate(ymd);
  if (!dt) return ymd ? String(ymd) : '—';
  // "14 nov" (sin punto final inconsistente)
  const s = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: tz }).format(dt);
  return s.replace(/\.$/, '');
}

export function formatDateLong(ymd, tz = TZ) {
  const dt = ymdToLocalDate(ymd);
  if (!dt) return ymd ? String(ymd) : '—';
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(dt);
}

export function formatMonthYear(ym, tz = TZ) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  if (!m) return ym || '—';
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const s = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: tz }).format(dt);
  return s;
}

export function formatRelative(ymd, fromDate = new Date(), tz = TZ) {
  const d = daysUntil(ymd, fromDate, tz);
  if (d == null) return formatDateShort(ymd, tz);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d === -1) return 'ayer';
  if (d > 1) return `en ${d} días`;
  return `hace ${Math.abs(d)} días`;
}

export function formatTopbarDateTime(date = new Date(), tz = TZ) {
  const day = new Intl.DateTimeFormat(LOCALE, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  const time = new Intl.DateTimeFormat(LOCALE, { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} · ${time}`;
}

export function greetingForDate(date = new Date(), tz = TZ) {
  const n = nowInTZ(date, tz);
  const h = n.h;
  if (h >= 6 && h < 13) return 'Buenos días';
  if (h >= 13 && h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatWeekdayShort(ymd, tz = TZ) {
  const dt = ymdToLocalDate(ymd);
  if (!dt) return '';
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: tz }).format(dt).replace('.', '');
}

export function monthGrid(ym) {
  // returns array of 42 days (6 weeks) starting Monday, each { ymd, inMonth }
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  if (!m) return [];
  const y = Number(m[1]), mo = Number(m[2]);
  const first = toYMD(y, mo, 1);
  const offset = weekdayIndexMondayFirst(first) || 0;
  const start = addDaysYMD(first, -offset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const ymd = addDaysYMD(start, i);
    const p = parseYMD(ymd);
    days.push({ ymd, inMonth: p.mo === mo, day: p.d, weekIndex: Math.floor(i / 7) });
  }
  // trim to 5 weeks if 6th has no days in month
  const lastWeekHas = days.slice(35).some(d => d.inMonth);
  return lastWeekHas ? days : days.slice(0, 35);
}
