import { h } from './dom.js';

export function panel(title, { meta, flush, span2 } = {}, ...body) {
  return h('section', { class: `panel${span2 ? ' span2' : ''}` },
    h('header', {}, h('h2', {}, title), meta ? h('span', { class: 'meta' }, meta) : null),
    h('div', { class: `body${flush ? ' flush' : ''}` }, body));
}

export function page(title, sub, actions, ...kids) {
  return h('div', { class: 'view' },
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub ? h('p', {}, sub) : null), actions || null),
    ...kids);
}

export function pill(status, label) {
  return h('span', { class: `pill ${status}` }, label || status);
}

// Empty states teach what goes here and who fills it.
export function empty(title, text) {
  return h('div', { class: 'empty' }, h('b', {}, title), h('span', {}, text));
}

export function seg(options, current, onPick) {
  const wrap = h('div', { class: 'seg', role: 'group' });
  for (const [value, label] of options) {
    wrap.append(h('button', { type: 'button', 'aria-pressed': String(value === current), onclick: () => onPick(value) }, label));
  }
  return wrap;
}

export function ownerSpan(o) { return h('span', { class: o === 'Claude' ? 'owner-c' : 'owner-k' }, o); }

export const STATUS_LABEL = { todo: 'To do', doing: 'Doing', blocked: 'Blocked', done: 'Done', progress: 'In progress' };
