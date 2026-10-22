import { h } from '../lib/dom.js';
import { panel, page, pill, ownerSpan, STATUS_LABEL } from '../lib/ui.js';
import { readinessStats } from '../lib/derive.js';
import { progress } from '../lib/charts.js';
import { fmtDate, rel, daysUntil } from '../lib/fmt.js';

export default function readiness(state) {
  const stats = readinessStats(state);
  return page('Readiness', 'What a lender, a seller or an investor will check before taking Teem Array seriously.', null,
    panel('Overall', { meta: `${stats.done} of ${stats.total}` },
      h('div', { class: 'rowbar' }, h('span', { class: 'lab' }, 'Complete'), progress(stats.frac), h('span', { class: 'num' }, `${Math.round(stats.frac * 100)}%`))),
    state.readiness.map((g) => {
      const gs = stats.groups.find((x) => x.group === g.group);
      return panel(g.group, { meta: `${gs.done}/${gs.total}${gs.blocked ? ` · ${gs.blocked} blocked` : ''}`, flush: true },
        h('div', { class: 'scroll-x' }, h('table', {},
          h('tbody', {}, g.items.map((i) => h('tr', {},
            h('td', {}, i.label, i.note ? h('div', { class: 'sub' }, i.note) : null),
            h('td', {}, ownerSpan(i.owner)),
            h('td', {}, i.due ? h('span', { class: i.status !== 'done' && daysUntil(i.due) < 0 ? 'bad' : 'mute' }, `${fmtDate(i.due, false)} · ${rel(i.due)}`) : h('span', { class: 'faint' }, '–')),
            h('td', {}, pill(i.status, STATUS_LABEL[i.status] || i.status))))))));
    }));
}
