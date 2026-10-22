import { h } from '../lib/dom.js';
import { panel, page, empty, ownerSpan } from '../lib/ui.js';
import { fmtDate, rel, daysUntil, weekStart } from '../lib/fmt.js';
import { agenda } from '../lib/derive.js';

export default function calendar(state) {
  const items = agenda(state, -14, 400);
  // Group by week so the next two weeks read as a plan and the far items read as a horizon.
  const groups = new Map();
  for (const i of items) {
    const wk = weekStart(i.date);
    if (!groups.has(wk)) groups.set(wk, []);
    groups.get(wk).push(i);
  }
  return page('Calendar', 'Deadlines, milestones and task due dates in one timeline. Real calendar events sync in when Claude refreshes from your calendar.', null,
    items.length ? [...groups.entries()].map(([wk, list]) =>
      panel(`Week of ${fmtDate(wk, false)}`, { meta: rel(wk), flush: true },
        h('div', { class: 'list' }, list.map((i) => h('div', { class: 'item' },
          h('span', { class: `when ${daysUntil(i.date) < 0 ? 'bad' : ''}` }, fmtDate(i.date)),
          h('span', {}, i.title, i.owner ? h('span', { class: 'faint' }, ' · ', ownerSpan(i.owner)) : null),
          h('span', { class: 'tag' }, i.kind)))))) : panel('Calendar', {}, empty('Nothing scheduled', 'Add deadlines and tasks with due dates.')));
}
