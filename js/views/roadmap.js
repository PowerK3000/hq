import { h } from '../lib/dom.js';
import { panel, page, pill } from '../lib/ui.js';
import { fmtDate, rel } from '../lib/fmt.js';

export default function roadmap(state) {
  return page('Roadmap', 'Portfolio and track record first; independent sponsor and a firm come after documented results.', null,
    h('div', { class: 'grid g-main' },
      panel('Stages', { flush: true },
        h('div', { class: 'stages' }, state.stages.map((s) => {
          const done = s.criteria.filter((c) => c.done).length;
          return h('div', { class: `stage ${s.status}` },
            h('span', { class: 'dot' }),
            h('div', {},
              h('div', { class: 'stage-head' },
                h('h3', {}, s.name), h('span', { class: 'faint' }, s.window), pill(s.status, s.status), h('span', { class: 'faint' }, `${done}/${s.criteria.length}`)),
              h('p', { class: 'mute' }, s.summary),
              h('ul', {}, s.criteria.map((c) => h('li', { class: c.done ? 'ok' : '' }, c.text)))));
        }))),
      panel('Milestones', { flush: true },
        h('div', { class: 'list milestones' }, state.milestones.map((m) => h('div', { class: 'item' },
          h('span', { class: 'when' }, fmtDate(m.date, false)),
          h('span', {}, m.title),
          h('span', { class: 'faint' }, m.done ? 'done' : rel(m.date)))))))
  );
}
