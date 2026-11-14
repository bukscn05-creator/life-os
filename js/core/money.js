/* Dinero — céntimos enteros, formato es-ES, parseo y validación */

export const LOCALE = 'es-ES';
export const CURRENCY = 'EUR';

export function isValidCents(n) {
  return Number.isInteger(n) && Number.isFinite(n) && Math.abs(n) <= 99999999999; // ~1000M€
}

export function parseMoneyToCents(input, { allowNegative = false, allowZero = true } = {}) {
  if (input == null) return { ok: false, error: 'Importe vacío' };
  let s = String(input).trim();
  if (!s) return { ok: false, error: 'Importe vacío' };
  // accept formats: 12,5  12.50  1.234,56  1234,56  -12,00
  s = s.replace(/\s|\u00A0/g, '').replace(/€/g, '');
  if (/[eE]/.test(s)) return { ok: false, error: 'Importe no válido' };
  let negative = false;
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('-')) { negative = true; s = s.slice(1); }
  if (!s || /[^0-9.,]/.test(s)) return { ok: false, error: 'Importe no válido' };
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let normalized = s;
  if (hasComma && hasDot) {
    // assume dot thousands, comma decimal
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = s.replace(',', '.');
  } else if (hasDot) {
    // could be thousands or decimal; if more than one dot -> thousands
    const parts = s.split('.');
    if (parts.length > 2) normalized = parts.join('');
    else normalized = s; // decimal dot
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return { ok: false, error: 'Importe no válido' };
  const num = Number(normalized);
  if (!Number.isFinite(num) || Number.isNaN(num)) return { ok: false, error: 'Importe no válido' };
  let cents = Math.round(num * 100);
  if (negative) cents = -cents;
  if (cents < 0 && !allowNegative) return { ok: false, error: 'El importe no puede ser negativo' };
  if (cents === 0 && !allowZero) return { ok: false, error: 'El importe debe ser mayor que 0' };
  if (!isValidCents(cents)) return { ok: false, error: 'Importe fuera de rango' };
  return { ok: true, cents };
}

export function centsFromNumber(value) {
  // for legacy numeric values; convert safely
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToNumber(cents) {
  return (Number(cents) || 0) / 100;
}

export function formatEUR(cents, { signDisplay = 'auto' } = {}) {
  const n = centsToNumber(cents);
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, signDisplay }).format(n);
}

export function formatEURValue(value) {
  // legacy helper: accepts cents-int or number; prefer cents
  if (Number.isInteger(value)) return formatEUR(value);
  return formatEUR(centsFromNumber(value));
}

export function sumCents(arr, pick = (x) => x) {
  return arr.reduce((s, x) => s + (Number(pick(x)) || 0), 0);
}

export function absCents(cents) { return Math.abs(Number(cents) || 0); }

export function clampPercent(p) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export function percent(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

export function safeDivide(a, b, fallback = 0) {
  if (!b) return fallback;
  const r = a / b;
  return Number.isFinite(r) ? r : fallback;
}
