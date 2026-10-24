import { h, clear, safeLink } from '../lib/dom.js';
import { panel, page, pill, empty, seg } from '../lib/ui.js';
import { contactCoverage } from '../lib/derive.js';
import { progress } from '../lib/charts.js';
import { fmtDate, rel } from '../lib/fmt.js';

const prefs = { type: 'all', q: '' };

export default function network(state) {
  const root = h('div', { class: 'view' });
  const render = () => {
    clear(root);
    const types = [...new Set(state.contactTargets.map((t) => t.type))];
    const q = prefs.q.trim().toLowerCase();
    const list = state.contacts
      .filter((c) => prefs.type === 'all' || c.type === prefs.type)
      .filter((c) => !q || `${c.name} ${c.org} ${c.notes}`.toLowerCase().includes(q))
      .sort((a, b) => (b.lastContact || '').localeCompare(a.lastContact || ''));
    const search = h('input', { type: 'search', placeholder: 'Filter contacts', 'aria-label': 'Filter contacts', value: prefs.q });
    search.addEventListener('input', () => { prefs.q = search.value; render(); root.querySelector('input[type=search]').focus(); });
    root.append(page('Network', 'Relationships are the sourcing engine: lenders, brokers, advisers, people who bought a business, and capital.', null,
      h('div', { class: 'grid g-main' },
        panel('Contacts', { meta: `${list.length}`, flush: true },
          h('div', { class: 'body' }, h('div', { class: 'controls' }, seg([['all', 'All'], ...types.map((t) => [t, t])], prefs.type, (v) => { prefs.type = v; render(); }), search)),
          list.length
            ? h('div', { class: 'scroll-x' }, h('table', {},
                h('thead', {}, h('tr', {}, ['Name', 'Type', 'Status', 'Last contact', 'Next step'].map((x) => h('th', {}, x)))),
                h('tbody', {}, list.map((c) => h('tr', {},
                  h('td', {}, c.link ? safeLink(c.link, c.name) : c.name, h('div', { class: 'sub' }, c.org || '')),
                  h('td', {}, h('span', { class: 'tag' }, c.type)),
                  h('td', {}, pill(c.status === 'Active' || c.status === 'Met' ? 'good' : 'todo', c.status)),
                  h('td', {}, c.lastContact ? `${fmtDate(c.lastContact, false)} · ${rel(c.lastContact)}` : '–'),
                  h('td', {}, c.next || '–'))))))
            : empty('No contacts yet', 'Nobody has been contacted on the ETA path yet. Each real conversation (lender, broker, SBDC or SCORE adviser, someone who bought a business) becomes a row with a last-contact date and a next step.')),
        panel('Coverage vs. goals', { meta: 'by 2026-11-30' },
          contactCoverage(state).map((t) => h('div', { class: 'rowbar' },
            h('span', { class: 'lab', title: t.label }, t.contacted ? `${t.label} (${t.contacted} contacted)` : t.label), progress(t.goal ? t.have / t.goal : 0), h('span', { class: 'num' }, `${t.have}/${t.goal}`)))))));
  };
  render();
  return root;
}
