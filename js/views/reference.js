import { h } from '../lib/dom.js';
import { panel, page, pill } from '../lib/ui.js';

const fmtP = (n) => (n >= 1e6 ? `$${n / 1e6}M` : `$${n / 1000}K`);

export default function reference(state) {
  return page('Reference', 'Rules and facts the plan relies on. Anything flagged verify has not been confirmed against an official source or an adviser.', null,
    panel('Facts', { flush: true },
      h('table', {},
        h('thead', {}, h('tr', {}, ['Topic', 'Fact', 'Status'].map((x) => h('th', {}, x)))),
        h('tbody', {}, state.reference.map((r) => h('tr', {}, h('td', {}, r.topic), h('td', {}, r.fact), h('td', {}, pill(r.verify ? 'warn' : 'good', r.verify ? 'verify' : 'confirmed'))))))),
    panel('Buy box', {},
      h('div', { class: 'grid g2' },
        h('div', {},
          h('table', {}, h('thead', {}, h('tr', {}, ['Tier', 'Price', 'Min earnings', 'Max multiple'].map((x) => h('th', {}, x)))),
            h('tbody', {}, state.buyBox.tiers.map((t) => h('tr', {}, h('td', {}, t.name), h('td', {}, `${fmtP(t.priceMin)} to ${fmtP(t.priceMax)}`), h('td', {}, t.gm ? `$${t.gm / 1000}K GM + 16% of price` : `$${t.sdeMin / 1000}K`), h('td', {}, `${t.multipleMax}x`))))),
          h('p', { class: 'mute' }, `DSCR: ${state.buyBox.dscrPreferred}x preferred, ${state.buyBox.dscrFloor}x floor.`),
          h('table', {}, h('tbody', {}, state.buyBox.criteria.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v)))))),
        h('div', {},
          h('b', {}, 'Rules'), h('ul', { class: 'mute' }, state.buyBox.rules.map((r) => h('li', {}, r))),
          h('b', {}, 'Execution loop'), h('p', { class: 'mute' }, state.buyBox.loop.join(' → '))))));
}
