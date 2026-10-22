import { h } from '../lib/dom.js';
import { panel, page, pill, empty, ownerSpan } from '../lib/ui.js';
import { fmtDate, rel, daysUntil, money, mult } from '../lib/fmt.js';
import { readinessStats, taskStats, agenda, funnelWeeks, blockers, holdingMetrics } from '../lib/derive.js';
import { barChart, legend, progress, stackBar } from '../lib/charts.js';
import { underwrite } from '../lib/uw.js';

export default function overview(state, ctx) {
  const stats = taskStats(state);
  const ready = readinessStats(state);
  const items = agenda(state, -3, 14).slice(0, 9);
  const stage = state.stages.find((s) => s.status === 'active') || state.stages[0];
  const crit = stage.criteria;
  const critDone = crit.filter((c) => c.done).length;
  const dd = daysUntil(state.meta.decisionDate);
  const weeks = funnelWeeks(state, 12);
  const blk = blockers(state);
  const hm = holdingMetrics(state);

  const nextTasks = [...stats.open]
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
    .slice(0, 7);

  // Cash needed on the micro scenario against Kayden's personal cash range: the gap is the real constraint.
  const sc = state.underwriting.scenarios[1] || state.underwriting.scenarios[0];
  const o = underwrite(sc.inputs);
  const pc = state.capital.personalCash;

  return page(state.meta.company, state.meta.goal, h('button', { class: 'btn ghost small', onclick: () => ctx.go('roadmap') }, 'Roadmap'),
    h('div', { class: 'grid g-main' },
      panel(`Now: ${stage.name}`, { meta: stage.window },
        h('p', { class: 'mute' }, stage.summary),
        h('div', { class: 'gap' }),
        h('div', { class: 'rowbar' }, h('span', { class: 'lab' }, 'Stage checklist'), progress(crit.length ? critDone / crit.length : 0), h('span', { class: 'num' }, `${critDone}/${crit.length}`)),
        h('div', { class: 'rowbar' }, h('span', { class: 'lab' }, 'Readiness overall'), progress(ready.frac), h('span', { class: 'num' }, `${ready.done}/${ready.total}`)),
        h('div', { class: 'rowbar' }, h('span', { class: 'lab' }, 'Decision date'), progress(dd == null ? 0 : Math.max(0, 1 - dd / 25), dd != null && dd < 7 ? 'warn' : ''),
          h('span', { class: 'num' }, dd == null ? '–' : `${dd}d`)),
        h('p', { class: 'faint' }, state.meta.decisionNote)),
      panel('Next 14 days', { meta: `${items.length} items`, flush: true },
        items.length
          ? h('div', { class: 'list' }, items.map((i) => h('div', { class: 'item' },
              h('span', { class: `when ${daysUntil(i.date) < 0 ? 'bad' : ''}` }, `${fmtDate(i.date)}`),
              h('span', {}, i.title, i.owner ? h('span', { class: 'faint' }, ' · ', ownerSpan(i.owner)) : null),
              h('span', { class: 'tag' }, i.kind))))
          : empty('Nothing dated in the next 14 days', 'Deadlines and task due dates appear here as they are added.'))),

    h('div', { class: 'grid g3' },
      panel('Up next', { meta: `${stats.open.length} open · ${stats.overdue.length} overdue`, flush: true },
        h('div', { class: 'list' }, nextTasks.map((t) => h('div', { class: 'item' },
          h('span', { class: `when ${t.due && daysUntil(t.due) < 0 ? 'bad' : ''}` }, t.due ? rel(t.due) : 'no date'),
          h('span', {}, t.title),
          ownerSpan(t.owner))))),
      panel('Readiness', { meta: `${Math.round(ready.frac * 100)}%` },
        ready.groups.map((g) => h('div', { class: 'rowbar' }, h('span', { class: 'lab', title: g.group }, g.group), progress(g.frac, g.blocked ? 'warn' : ''), h('span', { class: 'num' }, `${g.done}/${g.total}`)))),
      panel('Blockers', { meta: String(blk.length), flush: true },
        blk.length
          ? h('div', { class: 'list' }, blk.map((b) => h('div', { class: 'item' }, pill('blocked', b.kind), h('span', {}, b.text, b.note ? h('div', { class: 'sub faint' }, b.note) : null), '')))
          : empty('No blockers', 'Blocked tasks and readiness items are surfaced here automatically.'))),

    h('div', { class: 'grid g2' },
      panel('Outreach and conversations, 12 weeks', { meta: 'weekly' },
        barChart({ groups: weeks.map((w) => ({ label: w.week.slice(5), values: [w.conversations, w.outreach] })), series: [{ name: 'Conversations' }, { name: 'Outreach sent' }], target: state.funnel.targets.outreach, todayIndex: weeks.length - 1 }),
        legend(['Conversations', 'Outreach sent'])),
      panel('Capital reality check', { meta: sc.name },
        stackBar([
          { label: `Personal cash ${money(pc.low, true)} to ${money(pc.high, true)}`, value: pc.high, colorVar: 'var(--c1)' },
          { label: `Cash needed ${money(o.cashNeeded, true)}`, value: Math.max(o.cashNeeded - pc.high, 0), colorVar: 'var(--c2)' },
        ]),
        h('p', { class: 'mute' }, `Gap on this example: ${money(Math.max(o.cashNeeded - pc.high, 0))} to ${money(Math.max(o.cashNeeded - pc.low, 0))}. DSCR ${mult(o.dscr)}.`),
        h('button', { class: 'btn ghost small', onclick: () => ctx.go('underwriting') }, 'Open underwriting'))),

    panel('Portfolio', { meta: hm.count ? `${hm.count} holding${hm.count > 1 ? 's' : ''}` : 'no holdings yet' },
      hm.count
        ? h('p', {}, `Invested ${money(hm.invested)} · MOIC ${hm.moic == null ? '–' : mult(hm.moic)}`)
        : empty('The first row of the track record goes here', 'When the first acquisition closes, its entry price, debt, EBITDA, MOIC and IRR fill the Portfolio view and this panel.')));
}
