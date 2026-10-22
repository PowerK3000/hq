// The hub is deliberately thin: where we are, what's next, and one-line doors into the detail views.
import { h } from '../lib/dom.js';
import { panel, page, ownerSpan } from '../lib/ui.js';
import { fmtDate, rel, daysUntil, money, mult } from '../lib/fmt.js';
import { readinessStats, taskStats, agenda, funnelWeeks, blockers, holdingMetrics } from '../lib/derive.js';
import { underwrite } from '../lib/uw.js';

export default function overview(state, ctx) {
  const stats = taskStats(state);
  const ready = readinessStats(state);
  const stage = state.stages.find((s) => s.status === 'active') || state.stages[0];
  const dd = daysUntil(state.meta.decisionDate);
  const week = funnelWeeks(state, 1)[0];
  const blk = blockers(state);
  const hm = holdingMetrics(state);
  const upNext = [...stats.open].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 3);
  const dates = agenda(state, 0, 120).filter((i) => i.src !== 'task').slice(0, 3);

  const sc = state.underwriting.scenarios[1] || state.underwriting.scenarios[0];
  const gap = Math.max(underwrite(sc.inputs).cashNeeded - state.capital.personalCash.high, 0);

  const door = (view, name, summary) => h('button', { class: 'door', type: 'button', onclick: () => ctx.go(view) },
    h('span', {}, name), h('span', { class: 'mute' }, summary), h('span', { class: 'faint', 'aria-hidden': 'true' }, '→'));

  return h('div', { class: 'view hub' },
    h('div', { class: 'hub-head' }, h('h1', {}, state.meta.company), h('p', {}, state.meta.goal)),

    panel(`Now: ${stage.name}`, { meta: stage.window },
      h('p', { class: 'mute' }, stage.summary),
      h('div', { class: 'gap' }),
      h('dl', { class: 'kv hub-kv' },
        h('dt', {}, 'Decision date'), h('dd', {}, dd == null ? '–' : `${fmtDate(state.meta.decisionDate, false)} · ${dd} days`),
        h('dt', {}, 'Due this week'), h('dd', {}, String(stats.soon.length)),
        h('dt', {}, 'Overdue'), h('dd', { class: stats.overdue.length ? 'bad' : '' }, String(stats.overdue.length)),
        h('dt', {}, 'Readiness'), h('dd', {}, `${ready.done} of ${ready.total}`))),

    blk.length ? h('button', { class: 'notice warn door-notice', type: 'button', onclick: () => ctx.go('readiness') },
      `${blk.length} blocked: ${blk.map((b) => b.text).join('; ')}`) : null,

    h('div', { class: 'grid g2' },
      panel('Up next', { flush: true },
        h('div', { class: 'list' }, upNext.map((t) => h('div', { class: 'item' },
          h('span', { class: `when ${t.due && daysUntil(t.due) < 0 ? 'bad' : ''}` }, t.due ? rel(t.due) : '–'),
          h('span', {}, t.title), ownerSpan(t.owner))))),
      panel('Coming up', { flush: true },
        h('div', { class: 'list' }, dates.map((d) => h('div', { class: 'item' },
          h('span', { class: 'when' }, fmtDate(d.date, false)), h('span', {}, d.title), '' ))))),

    panel('Dig in', { flush: true },
      h('div', { class: 'doors' },
        door('tasks', 'Tasks', `${stats.open.length} open`),
        door('funnel', 'Funnel', `${week.conversations} conversations, ${week.outreach} outreach this week`),
        door('network', 'Network', `${state.contacts.length} contacts`),
        door('deals', 'Deals', `${state.pipeline.length} in pipeline`),
        door('underwriting', 'Underwriting', `example DSCR ${mult(underwrite(sc.inputs).dscr)}`),
        door('capital', 'Capital', `gap on the micro example: ${money(gap, true)}`),
        door('portfolio', 'Portfolio', hm.count ? `${hm.count} holdings` : 'first holding pending'))));
}
