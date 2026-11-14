import { escapeHtml as esc } from '../core/sanitize.js';

let sheetState = null;
let undoStack = [];

export function renderModule(root, { title, description, content, actions = '', headerHtml = null }) {
  if (!root) return;
  let head = '';
  if (headerHtml === null) {
    head = `<header class="page-header">
      <div class="page-headings">
        <h1 class="page-title">${esc(title)}</h1>
        ${description ? `<p class="page-context">${esc(description)}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>`;
  } else {
    head = headerHtml;
  }
  root.innerHTML = `${head}<div class="module-content stack">${content}</div>`;
}

export function toast(message, { type = 'info', actionLabel = null, onAction = null, duration = 6000 } = {}) {
  try {
    const region = document.getElementById('toast-region');
    if (!region) return { dismiss(){} };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const msg = document.createElement('span');
    msg.className = 'toast-msg';
    msg.textContent = message;
    el.appendChild(msg);
    let timer = null;
    const dismiss = () => { if (timer) clearTimeout(timer); el.remove(); };
    if (actionLabel) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-action';
      btn.textContent = actionLabel;
      btn.addEventListener('click', () => { try { onAction && onAction(); } finally { dismiss(); } });
      el.appendChild(btn);
    }
    region.appendChild(el);
    timer = setTimeout(dismiss, actionLabel ? duration : 2800);
    return { dismiss };
  } catch(_e){ return { dismiss(){} }; }
}

export function toastUndo(message, { onUndo, undoLabel = 'Deshacer', duration = 6000 } = {}) {
  try {
    const region = document.getElementById('toast-region');
    if (!region) return { dismiss(){} };
    const el = document.createElement('div');
    el.className = 'toast warning';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const msg = document.createElement('span');
    msg.className = 'toast-msg';
    msg.textContent = message;
    el.appendChild(msg);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = undoLabel;
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      if (timer) clearTimeout(timer);
      el.remove();
    };
    const handleUndo = () => {
      dismiss();
      try { onUndo && onUndo(); } catch(_e){}
    };
    btn.addEventListener('click', handleUndo);
    el.appendChild(btn);
    region.appendChild(el);
    const timer = setTimeout(() => {
      dismiss();
      // undo window expired
    }, duration);
    return { dismiss };
  } catch(_e){ return { dismiss(){} }; }
}

export function openSheet({ title = '', content = '', footer = '', onClose = null }) {
  const backdrop = document.getElementById('sheet-backdrop');
  const sheet = document.getElementById('sheet');
  if (!sheet || !backdrop) return { close(){} };
  closeSheet();
  const prevFocus = document.activeElement;
  sheet.innerHTML = `
    <div class="sheet-header"><h2 class="sheet-title">${esc(title)}</h2><button type="button" class="sheet-close" data-sheet-close aria-label="Cerrar">×</button></div>
    <div class="sheet-body">${content}</div>
    ${footer ? `<div class="sheet-footer">${footer}</div>` : ''}`;
  backdrop.hidden = false;
  sheet.hidden = false;
  sheet.setAttribute('aria-hidden', 'false');
  sheetState = { prevFocus, onClose };
  document.body.style.overflow = 'hidden';
  const focusable = () => sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const close = () => { closeSheet(); };
  sheet.querySelectorAll('[data-sheet-close]').forEach(b => b.addEventListener('click', close));
  backdrop.onclick = close;
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = Array.from(focusable());
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  sheet._onKey = onKey;
  document.addEventListener('keydown', onKey);
  const f = focusable();
  if (f[0]) f[0].focus();
  return { close, el: sheet };
}

export function closeSheet() {
  const backdrop = document.getElementById('sheet-backdrop');
  const sheet = document.getElementById('sheet');
  if (!sheet || !backdrop) return;
  if (sheet._onKey) document.removeEventListener('keydown', sheet._onKey);
  backdrop.hidden = true;
  sheet.hidden = true;
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '';
  backdrop.onclick = null;
  document.body.style.overflow = '';
  if (sheetState) {
    try { if (sheetState.onClose) sheetState.onClose(); } catch(_e){}
    try { sheetState.prevFocus && sheetState.prevFocus.focus && sheetState.prevFocus.focus(); } catch(_e){}
  }
  sheetState = null;
}
