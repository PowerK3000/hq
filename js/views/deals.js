import { h } from '../lib/dom.js';
import { panel, page, pill, empty } from '../lib/ui.js';
import { money, mult, fmtDate, rel } from '../lib/fmt.js';
import { dealScore } from '../lib/uw.js';

export default function deals(state) {
  const sc = state.scorecard;
  const stages = state.pipelineStages;
  const ds = state.pipeline.map((d) => ({ ...d, score: d.scoreOverride ?? dealScore(d.scores, sc.criteria) }));
  const verdict = (s) => (s == null ? ['todo', 'unscored'] : s >= sc.investigate ? ['good', 'investigate'] : s >= sc.watch ? ['warn', 'watch'] : ['bad', 'usually pass']);

  return page('Deals', 'A deal enters only after a real conversation. Move a stage only when evidence supports it. Scores below the pass line usually pass.', null,
    panel('Pipeline by stage', { meta: `${ds.length} deals`, flush: true },
      h('div', { class: 'board' }, stages.map((st) => {
        const items = ds.filter((d) => d.stage === st);
        return h('div', { class: 'col' },
          h('h3', {}, st, h('span', { class: 'faint' }, String(items.length))),
          h('div', { class: 'stack' }, items.length ? items.map((d) => h('div', { class: 'tcard' },
            h('div', { class: 't' }, d.name),
            h('div', { class: 'row' }, h('span', {}, money(d.ask, true)), h('span', {}, `SDE ${money(d.sde, true)}`), d.ask && d.sde ? h('span', {}, mult(d.ask / d.sde, 1)) : null),
            h('div', { class: 'row' }, pill(...verdict(d.score)), d.score != null ? h('span', {}, String(d.score)) : null),
            d.nextAction ? h('div', { class: 'faint' }, d.nextAction) : null)) : h('span', { class: 'faint' }, '–')));
      }))),
    ds.length ? panel('Deal table', { flush: true },
      h('div', { class: 'scroll-x' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Deal', 'Industry', 'Ask', 'SDE', 'Multiple', 'Score', 'Stage', 'Last contact', 'Next action'].map((x, i) => h('th', { class: i >= 2 && i <= 5 ? 'num' : '' }, x)))),
        h('tbody', {}, ds.map((d) => h('tr', {},
          h('td', {}, d.name, h('div', { class: 'sub' }, d.source || '')), h('td', {}, d.industry || '–'),
          h('td', { class: 'num' }, money(d.ask)), h('td', { class: 'num' }, money(d.sde)), h('td', { class: 'num' }, d.ask && d.sde ? mult(d.ask / d.sde, 2) : '–'),
          h('td', { class: 'num' }, d.score == null ? '–' : String(d.score)), h('td', {}, pill(d.stage === 'Passed' ? 'bad' : 'active', d.stage)),
          h('td', {}, d.lastContact ? `${fmtDate(d.lastContact, false)} · ${rel(d.lastContact)}` : '–'), h('td', {}, d.nextAction || '–'))))))) :
      panel('Deal table', {}, empty('No deals in the pipeline', 'The old aggregator log was cleared on purpose. New rows come from conversations with brokers, lenders and owners, each with a scorecard so it can be compared to the pass line.')),
    panel('Scorecard', { meta: `investigate ${sc.investigate}+ · watch ${sc.watch}-${sc.investigate - 1} · below ${sc.watch} usually pass` },
      h('div', { class: 'grid g2' },
        h('div', {}, h('table', {}, h('tbody', {}, sc.criteria.map((c) => h('tr', {}, h('td', {}, c.label), h('td', { class: 'num' }, `${c.weight}`)))))),
        h('div', {}, h('b', {}, 'Hard stops'), h('ul', { class: 'mute' }, sc.hardStops.map((s) => h('li', {}, s)))))));
}
