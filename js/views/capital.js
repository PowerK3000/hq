import { h } from '../lib/dom.js';
import { panel, page, empty, pill } from '../lib/ui.js';
import { money, mult } from '../lib/fmt.js';
import { underwrite } from '../lib/uw.js';
import { stackBar } from '../lib/charts.js';

export default function capital(state) {
  const pc = state.capital.personalCash;
  const rows = state.underwriting.scenarios.map((s) => ({ s, o: underwrite(s.inputs) }));
  const committed = state.capital.sources.filter((x) => x.status === 'Committed').reduce((t, x) => t + x.amount, 0);

  return page('Capital', 'Where the cash for a first deal comes from. The gap between personal cash and cash needed is the binding constraint at this stage.', null,
    h('div', { class: 'grid g2' },
      panel('Personal cash', { meta: 'range stated 2026-10-21' },
        h('dl', { class: 'kv' },
          h('dt', {}, 'Low'), h('dd', {}, money(pc.low)), h('dt', {}, 'High'), h('dd', {}, money(pc.high)),
          h('dt', {}, 'Other sources committed'), h('dd', {}, money(committed))),
        h('p', { class: 'mute' }, state.capital.guarantee)),
      panel('Notes', {}, h('p', { class: 'mute' }, state.capital.notes))),
    panel('Funding gap by scenario', { flush: true },
      h('div', { class: 'scroll-x' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Scenario', 'Price', 'Cash needed', 'Gap at high', 'Gap at low', 'DSCR'].map((x, i) => h('th', { class: i ? 'num' : '' }, x)))),
        h('tbody', {}, rows.map(({ s, o }) => h('tr', {},
          h('td', {}, s.name), h('td', { class: 'num' }, money(s.inputs.price, true)), h('td', { class: 'num' }, money(o.cashNeeded)),
          h('td', { class: 'num warn' }, money(Math.max(o.cashNeeded - pc.high - committed, 0))), h('td', { class: 'num warn' }, money(Math.max(o.cashNeeded - pc.low - committed, 0))),
          h('td', { class: 'num' }, mult(o.dscr)))))))),
    panel('Capital sources', { flush: true },
      state.capital.sources.length
        ? h('table', {}, h('thead', {}, h('tr', {}, ['Source', 'Type', 'Amount', 'Status'].map((x) => h('th', {}, x)))),
            h('tbody', {}, state.capital.sources.map((x) => h('tr', {}, h('td', {}, x.label), h('td', {}, x.type), h('td', { class: 'num' }, money(x.amount)), h('td', {}, pill(x.status === 'Committed' ? 'good' : 'todo', x.status))))))
        : empty('No outside capital identified yet', 'Co-investors, a larger seller note, family or a smaller deal all close the gap. Each candidate becomes a row with an amount and a status. Take no outside money without counsel (securities exemptions).')));
}
