import { h, clear } from '../lib/dom.js';
import { panel, page, pill, seg } from '../lib/ui.js';
import { money, mult, pct } from '../lib/fmt.js';
import { underwrite, buyBoxTest, payment } from '../lib/uw.js';
import { stackBar } from '../lib/charts.js';

const FIELDS = [
  ['price', 'Purchase price', 'money'], ['revenue', 'Annual revenue', 'money'], ['sde', 'Seller SDE', 'money'], ['addbacks', 'Other add-backs', 'money'],
  ['replMgmt', 'Replacement management', 'money'], ['capex', 'Maintenance capex', 'money'], ['wc', 'Working capital needed', 'money'], ['closingPct', 'Closing costs % of price', 'pct'],
  ['rate', 'Interest rate', 'pct'], ['amortYears', 'Amortization (years)', 'int'], ['seniorPct', 'Senior debt %', 'pct'], ['equityPct', 'Equity %', 'pct'], ['sellerPct', 'Seller standby note %', 'pct'],
];
const state = { idx: 0, inputs: null };

export default function underwriting(data) {
  const root = h('div', { class: 'view' });
  const scenarios = data.underwriting.scenarios;
  if (!state.inputs) state.inputs = { ...scenarios[0].inputs };
  const render = () => {
    clear(root);
    const i = state.inputs;
    const o = underwrite(i);
    const tiers = data.buyBox.tiers;
    const tier = tiers.find((t) => i.price >= t.priceMin && i.price <= t.priceMax) || null;
    const box = tier ? { ...tier, dscrPreferred: data.buyBox.dscrPreferred, dscrFloor: data.buyBox.dscrFloor } : { ...tiers[0], priceMin: 0, priceMax: 0, dscrPreferred: data.buyBox.dscrPreferred, dscrFloor: data.buyBox.dscrFloor };
    const tests = buyBoxTest(i, o, box);
    const pc = data.capital.personalCash;

    const inputs = h('div', { class: 'fields' }, FIELDS.map(([k, label, kind]) => {
      const id = `uw-${k}`;
      const shown = kind === 'pct' ? +(i[k] * 100).toFixed(2) : i[k];
      const input = h('input', { id, type: 'number', step: kind === 'pct' ? '0.1' : kind === 'int' ? '1' : '1000', value: shown });
      input.addEventListener('change', () => {
        const v = parseFloat(input.value);
        if (Number.isFinite(v) && v >= 0) { state.inputs[k] = kind === 'pct' ? v / 100 : v; render(); document.getElementById(id)?.focus(); }
      });
      return h('div', { class: 'field' }, h('label', { for: id }, label), input);
    }));

    // Sensitivity: DSCR across price and rate, the two numbers a seller or lender moves first.
    const prices = [-0.2, -0.1, 0, 0.1, 0.2].map((d) => i.price * (1 + d));
    const rates = [i.rate - 0.02, i.rate - 0.01, i.rate, i.rate + 0.01, i.rate + 0.02];
    const dscrAt = (p, r) => {
      const ads = payment(p * i.seniorPct, r, i.amortYears);
      return ads > 0 ? o.cfBeforeDebt / ads : Infinity;
    };

    root.append(page('Underwriting', 'Screening model, not a lender model. Edits here are for exploring; saved scenarios live in the data file.',
      h('div', { class: 'controls' },
        seg(scenarios.map((s, n) => [String(n), s.name]), String(state.idx), (v) => { state.idx = +v; state.inputs = { ...scenarios[state.idx].inputs }; render(); }),
        h('button', { class: 'btn ghost small', onclick: () => { state.inputs = { ...scenarios[state.idx].inputs }; render(); } }, 'Reset')),
      h('div', { class: 'notice' }, scenarios[state.idx].note),
      h('div', { class: 'grid g2' },
        panel('Inputs', {}, inputs),
        panel('Outputs', {},
          h('dl', { class: 'kv' },
            h('dt', {}, 'Normalized SDE'), h('dd', {}, money(o.sde)),
            h('dt', {}, 'Cash flow before debt'), h('dd', {}, money(o.cfBeforeDebt)),
            h('dt', {}, 'Senior debt'), h('dd', {}, money(o.senior)),
            h('dt', {}, 'Annual debt service'), h('dd', {}, money(o.ads)),
            h('dt', {}, 'DSCR'), h('dd', { class: o.dscr >= data.buyBox.dscrPreferred ? 'good' : o.dscr >= data.buyBox.dscrFloor ? 'warn' : 'bad' }, mult(o.dscr)),
            h('dt', {}, 'Price / SDE'), h('dd', {}, mult(o.multiple)),
            h('dt', {}, 'Cash flow after debt'), h('dd', {}, money(o.cfAfterDebt)),
            h('div', { class: 'hr' }),
            h('dt', {}, 'Equity'), h('dd', {}, money(o.equity)),
            h('dt', {}, 'Seller standby note'), h('dd', {}, money(o.sellerNote)),
            h('dt', {}, 'Closing costs'), h('dd', {}, money(o.closing)),
            h('dt', {}, 'Cash needed at close'), h('dd', {}, money(o.cashNeeded)),
            h('dt', {}, `Gap vs. personal cash (${money(pc.low, true)} to ${money(pc.high, true)})`), h('dd', { class: o.cashNeeded > pc.high ? 'warn' : 'good' }, `${money(Math.max(o.cashNeeded - pc.high, 0))} to ${money(Math.max(o.cashNeeded - pc.low, 0))}`)),
          h('div', { class: 'gap' }),
          o.stackOk ? null : h('div', { class: 'notice warn' }, `Capital stack adds to ${pct(o.stackTotal, 1)}, not 100%. Fix senior, equity and seller percentages.`),
          stackBar([
            { label: `Senior ${pct(i.seniorPct, 0)}`, value: i.seniorPct, colorVar: 'var(--c0)' },
            { label: `Seller note ${pct(i.sellerPct, 0)}`, value: i.sellerPct, colorVar: 'var(--c2)' },
            { label: `Equity ${pct(i.equityPct, 0)}`, value: i.equityPct, colorVar: 'var(--c1)' },
          ]))),
      h('div', { class: 'grid g2' },
        panel('Buy box test', { meta: tier ? tier.name : 'outside every tier' },
          h('div', { class: 'verdict' }, tests.map((t) => pill(t.pass ? 'good' : 'bad', t.label)))),
        panel('DSCR sensitivity', { meta: 'price vs. interest rate', flush: true },
          h('div', { class: 'scroll-x' }, h('table', {},
            h('thead', {}, h('tr', {}, h('th', {}, 'Price'), rates.map((r) => h('th', { class: 'num' }, pct(r, 1))))),
            h('tbody', {}, prices.map((p) => h('tr', {}, h('td', {}, money(p, true)), rates.map((r) => {
              const d = dscrAt(p, r);
              return h('td', { class: `num ${d >= data.buyBox.dscrPreferred ? 'good' : d >= data.buyBox.dscrFloor ? 'warn' : 'bad'}` }, mult(d));
            }))))))))));
  };
  render();
  return root;
}
