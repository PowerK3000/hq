// Hand-drawn SVG charts. No dependencies (the page's CSP allows only same-origin scripts).
import { h } from './dom.js';

const W = 560;

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

// groups: [{label, values:[v0, v1, ...]}]; series: [{name}] ; target: optional horizontal line per series 0
export function barChart({ groups, series, target, height = 190, todayIndex }) {
  const padL = 30, padR = 8, padT = 10, padB = 24;
  const innerW = W - padL - padR, innerH = height - padT - padB;
  const maxV = niceMax(Math.max(target || 0, ...groups.flatMap((g) => g.values), 1));
  const gw = innerW / Math.max(groups.length, 1);
  const bw = Math.max(3, Math.min(18, (gw - 6) / series.length));
  const svg = h('svg:svg', { class: 'chart', viewBox: `0 0 ${W} ${height}`, role: 'img', 'aria-label': 'Bar chart' });
  for (let k = 0; k <= 4; k++) {
    const y = padT + innerH - (innerH * k) / 4;
    svg.append(h('svg:line', { class: k ? 'grid-l' : 'axis', x1: padL, x2: W - padR, y1: y, y2: y }));
    svg.append(h('svg:text', { x: padL - 6, y: y + 3, 'text-anchor': 'end' }, String(Math.round((maxV * k) / 4))));
  }
  groups.forEach((g, gi) => {
    const x0 = padL + gi * gw + (gw - bw * series.length) / 2;
    g.values.forEach((v, si) => {
      const bh = (innerH * v) / maxV;
      svg.append(h('svg:rect', { class: `s${si}`, x: x0 + si * bw, y: padT + innerH - bh, width: bw - 1, height: Math.max(bh, v > 0 ? 1 : 0), rx: 2, vars: { '--d': `${gi * 28 + si * 10}ms` } },
        h('svg:title', {}, `${g.label}: ${series[si].name} ${v}`)));
    });
    if (groups.length <= 14 || gi % 2 === 0) {
      svg.append(h('svg:text', { x: padL + gi * gw + gw / 2, y: height - 8, 'text-anchor': 'middle' }, g.label));
    }
  });
  if (target) {
    const y = padT + innerH - (innerH * target) / maxV;
    svg.append(h('svg:line', { class: 'target', x1: padL, x2: W - padR, y1: y, y2: y }));
    svg.append(h('svg:text', { x: W - padR, y: y - 4, 'text-anchor': 'end' }, `target ${target}`));
  }
  if (todayIndex != null && todayIndex >= 0) {
    const x = padL + todayIndex * gw + gw / 2;
    svg.append(h('svg:line', { class: 'today', x1: x, x2: x, y1: padT, y2: padT + innerH }));
  }
  return svg;
}

export function legend(items) {
  return h('div', { class: 'legend' }, items.map((it, i) =>
    h('span', {}, h('i', { vars: { background: `var(--c${i})` } }), it)));
}

// Horizontal funnel: stages [{label, value}] scaled to the largest value.
export function funnel(stages) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return h('div', {}, stages.map((s) =>
    h('div', { class: 'rowbar' },
      h('span', { class: 'lab' }, s.label),
      h('div', { class: 'bar', title: `${s.label}: ${s.value}` }, h('i', { vars: { '--w': `${(s.value / max) * 100}%` } })),
      h('span', { class: 'num' }, String(s.value)))));
}

// Single horizontal stack: parts [{label, value, colorVar}]
export function stackBar(parts) {
  const total = parts.reduce((s, p) => s + Math.max(p.value, 0), 0) || 1;
  return h('div', {},
    h('div', { class: 'stackbar' }, parts.map((p) =>
      h('span', { title: `${p.label}`, vars: { width: `${(Math.max(p.value, 0) / total) * 100}%`, background: p.colorVar } }))),
    h('div', { class: 'legend' }, parts.map((p) =>
      h('span', {}, h('i', { vars: { background: p.colorVar } }), p.label))));
}

export function progress(frac, tone = '') {
  return h('div', { class: `bar ${tone}`, role: 'progressbar', 'aria-valuenow': Math.round(frac * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 },
    h('i', { vars: { '--w': `${Math.max(0, Math.min(1, frac)) * 100}%` } }));
}

// Line over time: points [{label, value}] with optional target value (flat line)
export function lineChart({ points, height = 170, target }) {
  const padL = 30, padR = 8, padT = 10, padB = 24;
  const innerW = W - padL - padR, innerH = height - padT - padB;
  const maxV = niceMax(Math.max(target || 0, ...points.map((p) => p.value), 1));
  const svg = h('svg:svg', { class: 'chart', viewBox: `0 0 ${W} ${height}`, role: 'img', 'aria-label': 'Line chart' });
  for (let k = 0; k <= 4; k++) {
    const y = padT + innerH - (innerH * k) / 4;
    svg.append(h('svg:line', { class: k ? 'grid-l' : 'axis', x1: padL, x2: W - padR, y1: y, y2: y }));
    svg.append(h('svg:text', { x: padL - 6, y: y + 3, 'text-anchor': 'end' }, String(Math.round((maxV * k) / 4))));
  }
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const pts = points.map((p, i) => [padL + i * step, padT + innerH - (innerH * p.value) / maxV]);
  if (pts.length) svg.append(h('svg:polyline', { class: 'l0', pathLength: '1', points: pts.map((p) => p.join(',')).join(' ') }));
  pts.forEach((p, i) => svg.append(h('svg:circle', { class: 's0', cx: p[0], cy: p[1], r: 2.5 }, h('svg:title', {}, `${points[i].label}: ${points[i].value}`))));
  points.forEach((p, i) => { if (points.length <= 14 || i % 2 === 0) svg.append(h('svg:text', { x: padL + i * step, y: height - 8, 'text-anchor': 'middle' }, p.label)); });
  if (target) {
    const y = padT + innerH - (innerH * target) / maxV;
    svg.append(h('svg:line', { class: 'target', x1: padL, x2: W - padR, y1: y, y2: y }));
  }
  return svg;
}
