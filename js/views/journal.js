import { h } from '../lib/dom.js';
import { panel, page } from '../lib/ui.js';
import { fmtDate } from '../lib/fmt.js';

export default function journal(state) {
  const entries = [...state.journal].sort((a, b) => b.date.localeCompare(a.date));
  return page('Journal', 'Decisions, reasoning and gotchas, in order. The record of why things were chosen.', null,
    entries.map((e) => panel(e.title, { meta: `${fmtDate(e.date, false)} · ${e.tag}` }, h('p', { class: 'mute' }, e.body))));
}
