import { h } from '../lib/dom.js';
import { panel, page } from '../lib/ui.js';
import { funnelWeeks, funnelTotals } from '../lib/derive.js';
import { barChart, legend, funnel as funnelChart, lineChart } from '../lib/charts.js';
import { fmtDate } from '../lib/fmt.js';

export default function funnelView(state) {
  const weeks = funnelWeeks(state, 12);
  const totals = funnelTotals(state);
  const tg = state.funnel.targets;
  let cum = 0;
  const cumPoints = weeks.map((w) => { cum += w.outreach + w.conversations; return { label: w.week.slice(5), value: cum }; });
  const thisWeek = weeks[weeks.length - 1];

  return page('Funnel', 'Activity is the leading indicator. A search is a long funnel: dozens of listings reviewed per serious conversation.', null,
    h('div', { class: 'grid g2' },
      panel('Weekly activity', { meta: 'last 12 weeks; listings screened are in the table' },
        barChart({ groups: weeks.map((w) => ({ label: w.week.slice(5), values: [w.conversations, w.outreach] })), series: [{ name: 'Conversations' }, { name: 'Outreach sent' }], target: tg.outreach, todayIndex: weeks.length - 1 }),
        legend(['Conversations', 'Outreach sent'])),
      panel('Cumulative touches', { meta: 'conversations + outreach' },
        lineChart({ points: cumPoints }))),
    h('div', { class: 'grid g2' },
      panel('Deal funnel, all time', {},
        funnelChart([
          { label: 'Listings reviewed', value: totals.listings },
          { label: 'Owner calls', value: totals.ownerCalls },
          { label: 'NDAs', value: totals.ndas },
          { label: 'Letters of intent', value: totals.lois },
        ])),
      panel(`This week (${fmtDate(thisWeek.week, false)}) vs. targets`, { flush: true },
        h('table', {},
          h('thead', {}, h('tr', {}, ['Metric', 'This week', 'Target', 'All time'].map((x, i) => h('th', { class: i ? 'num' : '' }, x)))),
          h('tbody', {}, [
            ['Conversations (lenders, brokers, advisers, buyers)', 'conversations'],
            ['Outreach sent', 'outreach'], ['Listings reviewed', 'listings'], ['Owner calls', 'ownerCalls'], ['NDAs', 'ndas'], ['LOIs', 'lois'],
          ].map(([label, k]) => h('tr', {},
            h('td', {}, label), h('td', { class: 'num' }, String(thisWeek[k])), h('td', { class: 'num faint' }, tg[k] ? String(tg[k]) : '–'), h('td', { class: 'num' }, String(totals[k]))))))))
  );
}
