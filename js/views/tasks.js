import { h, clear } from '../lib/dom.js';
import { panel, page, pill, seg, ownerSpan, empty, STATUS_LABEL } from '../lib/ui.js';
import { fmtDate, rel, daysUntil } from '../lib/fmt.js';

const COLS = ['todo', 'doing', 'blocked', 'done'];
const prefs = { owner: 'all', mode: 'board', track: 'all' };

export default function tasks(state) {
  const root = h('div', { class: 'view' });
  const render = () => {
    clear(root);
    const tracks = [...new Set(state.tasks.map((t) => t.track))];
    const list = state.tasks.filter((t) => (prefs.owner === 'all' || t.owner === prefs.owner) && (prefs.track === 'all' || t.track === prefs.track));
    const controls = h('div', { class: 'controls' },
      seg([['all', 'Everyone'], ['Kayden', 'Kayden'], ['Claude', 'Claude']], prefs.owner, (v) => { prefs.owner = v; render(); }),
      seg([['all', 'All tracks'], ...tracks.map((t) => [t, t])], prefs.track, (v) => { prefs.track = v; render(); }),
      seg([['board', 'Board'], ['table', 'Table']], prefs.mode, (v) => { prefs.mode = v; render(); }));
    const body = prefs.mode === 'board' ? board(list) : table(list);
    root.append(page('Tasks', 'Updated by Claude after calls and decisions. Kayden owns calls, signatures and approvals; Claude owns drafts, builds and research.', controls, body));
  };
  render();
  return root;
}

function dueCell(t) {
  if (!t.due) return h('span', { class: 'faint' }, 'no date');
  const n = daysUntil(t.due);
  return h('span', { class: t.status !== 'done' && n < 0 ? 'bad' : n <= 3 && t.status !== 'done' ? 'warn' : 'mute' }, `${fmtDate(t.due, false)} · ${rel(t.due)}`);
}

function board(list) {
  return panel('Board', { meta: `${list.length} tasks`, flush: true },
    h('div', { class: 'board' }, COLS.map((c) => {
      const items = list.filter((t) => t.status === c).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
      return h('div', { class: 'col' },
        h('h3', {}, STATUS_LABEL[c], h('span', { class: 'faint' }, String(items.length))),
        h('div', { class: 'stack' }, items.length ? items.map((t) => h('div', { class: 'tcard' },
          h('div', { class: 't' }, t.title),
          h('div', { class: 'row' }, ownerSpan(t.owner), h('span', { class: 'tag' }, t.track), t.priority === 'high' ? h('span', { class: 'warn' }, 'high') : null),
          h('div', { class: 'row' }, dueCell(t)),
          t.notes ? h('div', { class: 'faint' }, t.notes) : null)) : h('span', { class: 'faint' }, 'Empty')));
    })));
}

function table(list) {
  if (!list.length) return panel('Tasks', {}, empty('No tasks match these filters', 'Change the owner or track filter.'));
  const rows = [...list].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  return panel('Tasks', { meta: `${list.length}`, flush: true },
    h('div', { class: 'scroll-x' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Task', 'Owner', 'Track', 'Priority', 'Due', 'Status'].map((x) => h('th', {}, x)))),
      h('tbody', {}, rows.map((t) => h('tr', {},
        h('td', {}, t.title, t.notes ? h('div', { class: 'sub' }, t.notes) : null),
        h('td', {}, ownerSpan(t.owner)), h('td', {}, h('span', { class: 'tag' }, t.track)),
        h('td', {}, t.priority), h('td', {}, dueCell(t)), h('td', {}, pill(t.status, STATUS_LABEL[t.status]))))))));
}
