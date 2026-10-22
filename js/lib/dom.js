// Tiny DOM builder. Every string goes in via textContent/setAttribute, never innerHTML,
// because dashboard data is user-edited and must not be able to inject markup.
const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, props, ...kids) {
  const isSvg = tag.startsWith('svg:');
  const el = isSvg ? document.createElementNS(SVG_NS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty(n, val);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

// Only http(s) links render as anchors; anything else (javascript:, data:) is shown as plain text.
export function safeLink(url, label) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      return h('a', { href: u.href, target: '_blank', rel: 'noopener noreferrer' }, label || u.hostname);
    }
  } catch { /* fall through */ }
  return document.createTextNode(label || url || '');
}
