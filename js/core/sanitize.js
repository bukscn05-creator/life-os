/* Sanitizacion XSS centralizada — sin dependencias externas, implementacion ligera y segura */

const ENTITY_MAP = {
  '&': '&',
  '<': '<',
  '>': '>',
  '"': '"',
  "'": '\u2019', // right single quotation mark
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"'`=\/]/g, c => ENTITY_MAP[c]);
}

export function escapeAttribute(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"'=]/g, c => ENTITY_MAP[c]);
}

const SAFE_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'hr', 'b', 'i', 'sub', 'sup', 'mark', 'small',
  'section', 'article', 'header', 'footer', 'main', 'aside',
  'button', 'input', 'select', 'textarea', 'label', 'form',
  'fieldset', 'legend', 'option', 'optgroup', 'datalist'
]);

const SAFE_ATTRIBUTES = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id', 'style',
  'type', 'value', 'placeholder', 'disabled', 'readonly',
  'required', 'name', 'for', 'data-*', 'aria-*', 'role',
  'tabindex', 'autocomplete', 'inputmode', 'min', 'max', 'step',
  'rows', 'cols', 'colspan', 'rowspan', 'scope', 'headers'
]);

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'data:']);

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeAttributes(tag, attrs) {
  const safe = {};
  for (const [key, value] of Object.entries(attrs || {})) {
    const lowerKey = key.toLowerCase();
    if (SAFE_ATTRIBUTES.has(lowerKey) || lowerKey.startsWith('data-') || lowerKey.startsWith('aria-')) {
      if (lowerKey === 'href' || lowerKey === 'src') {
        if (isSafeUrl(value)) safe[key] = escapeAttribute(value);
      } else if (lowerKey === 'style') {
        safe[key] = sanitizeStyle(value);
      } else {
        safe[key] = escapeAttribute(value);
      }
    }
  }
  return safe;
}

function sanitizeStyle(style) {
  if (!style) return '';
  const safe = [];
  const declarations = style.split(';');
  const allowedProps = new Set([
    'color', 'background', 'background-color', 'font-size', 'font-weight',
    'font-style', 'text-align', 'text-decoration', 'margin', 'padding',
    'border', 'border-radius', 'width', 'height', 'max-width', 'max-height',
    'display', 'flex', 'grid', 'gap', 'opacity', 'cursor', 'overflow',
    'white-space', 'word-break', 'text-overflow', 'vertical-align'
  ]);
  for (const decl of declarations) {
    const [prop, ...valParts] = decl.split(':');
    if (!prop || !valParts.length) continue;
    const cleanProp = prop.trim().toLowerCase();
    if (allowedProps.has(cleanProp)) {
      safe.push(`${cleanProp}:${valParts.join(':').trim()}`);
    }
  }
  return safe.join(';');
}

export function sanitizeHtml(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  const result = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      result.push(escapeHtml(node.textContent));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (!SAFE_TAGS.has(tag)) continue;
      const attrs = sanitizeAttributes(tag, Array.from(node.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}));
      const attrStr = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      result.push(`<${tag}${attrStr}>`);
      if (node.childNodes.length === 0 && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tag)) {
        result.push(`</${tag}>`);
      }
    }
  }
  return result.join('');
}

export function createSanitizedElement(html) {
  const template = document.createElement('template');
  template.innerHTML = sanitizeHtml(html);
  return template.content.cloneNode(true);
}

export function safeSetHTML(element, html) {
  element.innerHTML = sanitizeHtml(html);
}

export function safeSetText(element, text) {
  element.textContent = text;
}

export function safeAppendHTML(parent, html) {
  const fragment = createSanitizedElement(html);
  parent.appendChild(fragment);
}