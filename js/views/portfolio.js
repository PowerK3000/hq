import { h } from '../lib/dom.js';
import { panel, page, empty } from '../lib/ui.js';
import { money, mult, pct, fmtDate } from '../lib/fmt.js';
import { holdingMetrics } from '../lib/derive.js';
import { xirr } from '../lib/uw.js';

const COLS = ['Company', 'Close date', 'Entry price', 'Entry multiple', 'Debt at close', 'Equity in', 'EBITDA / SDE now', 'Equity value now', 'Distributions', 'MOIC', 'IRR'];

export default function portfolio(state) {
  const hs = state.portfolio.holdings;
  const m = holdingMetrics(state);
  const rowFor = (x) => {
    const invested = x.equityInvested || 0;
    const moic = invested ? ((x.currentEquityValue || 0) + (x.distributions || 0)) / invested : null;
    const flows = [...(x.cashFlows || [])];
    if (x.currentEquityValue && x.asOf) flows.push({ date: x.asOf, amount: x.currentEquityValue });
    const irr = xirr(flows);
    return [x.name, x.closeDate ? fmtDate(x.closeDate, false) : '–', money(x.entryPrice), x.entryMultiple ? mult(x.entryMultiple, 2) : '–', money(x.debtAtClose), money(x.equityInvested),
      money(x.currentEarnings), money(x.currentEquityValue), money(x.distributions), moic == null ? '–' : mult(moic), irr == null ? '–' : pct(irr, 1)];
  };
  const ghost = Array.from({ length: Math.max(0, 3 - hs.length) }, () => COLS.map((_, i) => (i === 0 ? 'Open slot' : '–')));

  return page('Portfolio', 'The track record. Empty until the first acquisition closes, then every holding is measured the same way an investor will measure it.', null,
    panel('Track record', { meta: m.count ? `${m.count} holding${m.count > 1 ? 's' : ''}` : 'no holdings yet' },
      h('dl', { class: 'kv' },
        h('dt', {}, 'Equity invested'), h('dd', {}, money(m.invested)),
        h('dt', {}, 'Equity value now'), h('dd', {}, money(m.value)),
        h('dt', {}, 'Distributions'), h('dd', {}, money(m.dist)),
        h('dt', {}, 'MOIC'), h('dd', {}, m.moic == null ? '–' : mult(m.moic)))),
    panel('Holdings', { flush: true },
      h('div', { class: 'scroll-x' }, h('table', {},
        h('thead', {}, h('tr', {}, COLS.map((c, i) => h('th', { class: i >= 2 ? 'num' : '' }, c)))),
        h('tbody', {}, [...hs.map(rowFor).map((r) => h('tr', {}, r.map((c, i) => h('td', { class: i >= 2 ? 'num' : '' }, c)))),
          ...ghost.map((r) => h('tr', { class: 'ghost' }, r.map((c, i) => h('td', { class: i >= 2 ? 'num' : '' }, c))))])))),
    hs.length ? null : panel('How a holding is recorded', {}, empty('Same fields for every deal', 'Entry price and multiple, debt and equity at close, current earnings and equity value, distributions, and dated cash flows. MOIC and IRR are calculated from those, never typed in, so the numbers can be audited.')));
}
