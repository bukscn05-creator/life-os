import { formatEUR, centsFromNumber } from '../core/money.js';
import { formatDateShort, formatDateLong, formatRelative, daysUntil as coreDaysUntil, todayYMD } from '../core/dates.js';
import { countLabel } from '../core/plural.js';
import { escapeHtml as esc } from '../core/sanitize.js';
import { getIcon, icon as renderIcon } from './icons.js';

export function fmtEUR(value) {
  if (Number.isInteger(value)) return formatEUR(value);
  return formatEUR(centsFromNumber(value));
}

export function fmtDate(iso) { return formatDateShort(iso); }
export function fmtDateLong(iso) { return formatDateLong(iso); }
export function fmtRelative(iso) { return formatRelative(iso); }
export function daysUntil(iso) { return coreDaysUntil(iso); }

export function urgency(days) {
  if (days == null) return { label: 'Sin fecha', tone: 'neutral' };
  if (days < 0) return { label: 'Vencido', tone: 'danger' };
  if (days === 0) return { label: 'Hoy', tone: 'danger' };
  if (days === 1) return { label: 'Mañana', tone: 'warn' };
  if (days <= 3) return { label: `En ${days} días`, tone: 'warn' };
  if (days <= 7) return { label: `En ${days} días`, tone: 'neutral' };
  return { label: `En ${days} días`, tone: 'neutral' };
}
// compat: old modules expect [label, tone] with red/orange/green/blue
export function urgencyLabel(days) {
  const u = urgency(days);
  const tone = u.tone === 'danger' ? 'red' : u.tone === 'warn' ? 'orange' : u.tone === 'neutral' ? 'green' : '';
  return [u.label, tone];
}

export function statusPill(label, tone = 'neutral') {
  return `<span class="status-pill ${esc(tone)}">${esc(label)}</span>`;
}
export function pill(text, tone = '') {
  const t = tone === 'red' ? 'danger' : tone === 'orange' ? 'warn' : tone === 'green' ? 'ok' : 'neutral';
  return statusPill(text, t);
}

export function progressBar(pct, tone = '') {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return `<div class="progress ${esc(tone)}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>`;
}

export function card(title, body, extra = '') {
  return `<article class="surface stack">${title ? `<div class="row" style="justify-content:space-between;align-items:center"><h2 class="section-title" style="margin:0">${esc(title)}</h2>${extra||''}</div>` : ''}<div>${body}</div></article>`;
}

export function emptyState(title, text = '', actionHtml = '') {
  if (!text && !actionHtml && typeof title === 'string' && title.length > 40) {
    // compat: old signature emptyState(text)
    return `<div class="empty"><p class="empty-title">Sin contenido</p><p class="empty-text">${esc(title)}</p></div>`;
  }
  return `<div class="empty"><p class="empty-title">${esc(title)}</p>${text ? `<p class="empty-text">${esc(text)}</p>` : ''}${actionHtml || ''}</div>`;
}

export function pageHeader(title, context = '', actions = '') {
  return `<header class="page-header"><div class="page-headings"><h1 class="page-title">${esc(title)}</h1>${context ? `<p class="page-context">${esc(context)}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
}

export function rowList(itemsHtml) {
  if (!itemsHtml) return emptyState('Sin elementos', 'No hay nada que mostrar ahora.');
  return `<ul class="row-list">${itemsHtml}</ul>`;
}

export function rowItem({ title, subtitle = '', value = '', icon = '', meta = '', buttonAttrs = '' }) {
  return `<li class="row-item"><button type="button" class="row-tap" ${buttonAttrs}>
    <span class="row-icon" aria-hidden="true">${icon ? esc(icon) : ''}</span>
    <span class="row-main"><span class="row-title">${esc(title)}</span>${subtitle ? `<span class="row-sub">${esc(subtitle)}</span>` : ''}${meta ? `<span class="row-sub">${meta}</span>` : ''}</span>
    ${value ? `<span class="row-value">${esc(value)}</span>` : ''}
    <span class="row-chevron" aria-hidden="true">${renderIcon('chevronRight')}</span>
  </button></li>`;
}

export function statCard(label, value, sub = '') {
  return `<div class="surface"><p class="metric-label">${esc(label)}</p><p class="metric-big tabular">${esc(value)}</p>${sub ? `<p class="muted" style="margin:4px 0 0;font-size:14px">${esc(sub)}</p>` : ''}</div>`;
}

export function itemsCount(n, one, other) { return countLabel(n, one, other); }

export function today() { return todayYMD(); }

export { getIcon, renderIcon };

