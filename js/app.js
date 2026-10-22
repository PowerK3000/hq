import { h, clear } from './lib/dom.js';
import { decryptState } from './lib/crypto.js';
import { daysUntil, fmtDate } from './lib/fmt.js';
import { readinessStats, taskStats, nextDeadline, searchIndex } from './lib/derive.js';
import overview from './views/overview.js';
import roadmap from './views/roadmap.js';
import tasks from './views/tasks.js';
import calendar from './views/calendar.js';
import funnel from './views/funnel.js';
import network from './views/network.js';
import deals from './views/deals.js';
import underwriting from './views/underwriting.js';
import readiness from './views/readiness.js';
import capital from './views/capital.js';
import portfolio from './views/portfolio.js';
import journal from './views/journal.js';
import reference from './views/reference.js';

const VIEWS = {
  overview: ['Overview', overview], roadmap: ['Roadmap', roadmap], tasks: ['Tasks', tasks], calendar: ['Calendar', calendar],
  funnel: ['Funnel', funnel], network: ['Network', network], deals: ['Deals', deals],
  underwriting: ['Underwriting', underwriting], readiness: ['Readiness', readiness], capital: ['Capital', capital], portfolio: ['Portfolio', portfolio],
  journal: ['Journal', journal], reference: ['Reference', reference],
};
const GROUPS = [['overview', 'roadmap', 'tasks', 'calendar'], ['funnel', 'network', 'deals'], ['underwriting', 'readiness', 'capital', 'portfolio'], ['journal', 'reference']];
const GO_KEYS = { o: 'overview', m: 'roadmap', t: 'tasks', c: 'calendar', f: 'funnel', n: 'network', d: 'deals', u: 'underwriting', r: 'readiness', k: 'capital', p: 'portfolio', j: 'journal', e: 'reference' };
const IDLE_MS = 15 * 60 * 1000;

const app = document.getElementById('app');
let state = null;
let plainMode = false;
let idleTimer = null;
let paletteOpen = false;

const current = () => (location.hash.replace(/^#\/?/, '') in VIEWS ? location.hash.replace(/^#\/?/, '') : 'overview');
const go = (v) => { location.hash = `#/${v}`; };

/* ---------- boot and lock ---------- */
async function boot() {
  const wantLock = new URLSearchParams(location.search).has('lock');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (local && !wantLock) {
    try {
      const r = await fetch('data/state.plain.json', { cache: 'no-store' });
      if (r.ok) { state = await r.json(); plainMode = true; return mount(); }
    } catch { /* fall through to the lock screen */ }
  }
  showLock();
}

async function showLock(message) {
  state = null; clearTimeout(idleTimer); clear(app);
  const err = h('p', { class: 'err', role: 'alert' }, message || '');
  const input = h('input', { id: 'pass', type: 'password', autocomplete: 'current-password', required: true, 'aria-describedby': 'lock-err' });
  const btn = h('button', { class: 'btn', type: 'submit' }, 'Unlock');
  let failures = 0;
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); btn.disabled = true; err.textContent = '';
    try {
      const r = await fetch('data/state.enc.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('No data has been published yet.');
      state = await decryptState(await r.json(), input.value);
      input.value = ''; mount();
    } catch (ex) {
      failures += 1;
      err.textContent = ex.message || 'Could not unlock.';
      // Brief delay is a courtesy against fat-fingering; the real protection is the slow key derivation.
      await new Promise((res) => setTimeout(res, Math.min(failures * 700, 4000)));
      btn.disabled = false; input.focus(); input.select();
    }
  } },
  h('h1', {}, 'HQ'),
  h('p', {}, 'Private. Enter the passphrase to decrypt the data in this browser.'),
  h('label', { for: 'pass' }, 'Passphrase', input),
  h('p', { class: 'err', id: 'lock-err' }, err), btn);
  app.append(h('div', { class: 'lock' }, form));
  input.focus();
}

function armIdle() {
  clearTimeout(idleTimer);
  if (!plainMode) idleTimer = setTimeout(() => showLock('Locked after 15 minutes of inactivity.'), IDLE_MS);
}

/* ---------- shell ---------- */
function mount() {
  clear(app);
  const stats = taskStats(state); const ready = readinessStats(state); const nd = nextDeadline(state);
  const stage = state.stages.find((s) => s.status === 'active') || state.stages[0];
  const upd = daysUntil(state.meta.updated);
  const cell = (label, value, tone = '') => h('div', { class: 'cell' }, h('b', { class: tone }, value), h('span', {}, label));
  const strip = h('header', { class: 'strip' },
    h('div', { class: 'brand' }, state.meta.name),
    cell('stage', stage.name),
    cell(nd ? nd.title.slice(0, 34) : 'next deadline', nd ? `${daysUntil(nd.date)}d` : '–', nd && daysUntil(nd.date) < 7 ? 'warn' : ''),
    cell('due in 7 days', String(stats.soon.length)),
    cell('overdue', String(stats.overdue.length), stats.overdue.length ? 'bad' : ''),
    cell('readiness', `${Math.round(ready.frac * 100)}%`),
    cell('data as of', fmtDate(state.meta.updated, false), upd != null && upd < -7 ? 'warn' : ''),
    h('div', { class: 'grow' }),
    h('div', { class: 'tools' },
      h('button', { class: 'btn ghost small', onclick: () => openPalette() }, 'Search ', h('kbd', {}, '/')),
      plainMode ? h('span', { class: 'faint' }, 'local') : h('button', { class: 'btn ghost small', onclick: () => showLock() }, 'Lock')));

  const counts = { tasks: stats.open.length, network: state.contacts.length, deals: state.pipeline.length };
  const rail = h('nav', { class: 'rail', 'aria-label': 'Views' });
  GROUPS.forEach((g, gi) => {
    if (gi) rail.append(h('div', { class: 'sep' }));
    for (const id of g) {
      rail.append(h('button', { type: 'button', 'data-view': id, onclick: () => go(id) },
        VIEWS[id][0], counts[id] != null ? h('span', { class: 'count' }, String(counts[id])) : null));
    }
  });

  const main = h('main', { id: 'main', tabindex: '-1' });
  app.append(h('div', { class: 'shell' }, strip, rail, main));
  renderView();
  armIdle();
}

function renderView() {
  const main = document.getElementById('main'); if (!main || !state) return;
  const id = current();
  clear(main);
  document.title = `${VIEWS[id][0]} · ${state.meta.name}`;
  document.querySelectorAll('.rail button').forEach((b) => {
    if (b.dataset.view === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const upd = daysUntil(state.meta.updated);
  if (upd != null && upd < -7) main.append(h('div', { class: 'notice warn' }, `Data was last updated ${-upd} days ago (${fmtDate(state.meta.updated, false)}). Ask Claude to refresh it.`));
  try {
    main.append(VIEWS[id][1](state, { go, rerender: renderView }));
  } catch (ex) {
    // Surface the failure instead of rendering a blank page.
    main.append(h('div', { class: 'notice warn', role: 'alert' }, `This view failed to render: ${ex.message}`));
    console.error(ex);
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { if (state) renderView(); });

/* ---------- command palette ---------- */
function openPalette() {
  if (paletteOpen || !state) return;
  paletteOpen = true;
  const entries = [...Object.entries(VIEWS).map(([id, v]) => ({ view: id, label: `Go to ${v[0]}`, hint: 'View' })), ...searchIndex(state)];
  const input = h('input', { type: 'text', placeholder: 'Jump to a view or search tasks, contacts, deals, readiness…', 'aria-label': 'Search', autocomplete: 'off' });
  const list = h('ul', { role: 'listbox' });
  let sel = 0; let shown = [];
  const draw = () => {
    clear(list);
    const q = input.value.trim().toLowerCase();
    shown = entries.filter((e) => !q || e.label.toLowerCase().includes(q)).slice(0, 12);
    if (!shown.length) { list.append(h('li', { class: 'none' }, 'No matches')); return; }
    sel = Math.min(sel, shown.length - 1);
    shown.forEach((e, i) => list.append(h('li', { role: 'option', 'aria-selected': String(i === sel), onclick: () => choose(e) }, h('span', {}, e.label), h('small', {}, e.hint))));
  };
  const close = () => { wrap.remove(); paletteOpen = false; };
  const choose = (e) => { close(); if (e) go(e.view); };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); draw(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); choose(shown[sel]); }
    else if (ev.key === 'Escape') { ev.preventDefault(); close(); }
  });
  const wrap = h('div', { class: 'palette-wrap', onclick: (ev) => { if (ev.target === wrap) close(); } }, h('div', { class: 'palette', role: 'dialog', 'aria-label': 'Search' }, input, list));
  document.body.append(wrap); draw(); input.focus();
}

/* ---------- keys and idle ---------- */
let chord = null;
document.addEventListener('keydown', (ev) => {
  if (state) armIdle();
  const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); openPalette(); return; }
  if (typing || ev.ctrlKey || ev.metaKey || ev.altKey || !state) return;
  if (ev.key === '/') { ev.preventDefault(); openPalette(); return; }
  if (chord) { const v = GO_KEYS[ev.key.toLowerCase()]; chord = null; if (v) go(v); return; }
  if (ev.key === 'g') { chord = true; setTimeout(() => { chord = null; }, 1200); }
});
['pointerdown', 'scroll'].forEach((t) => document.addEventListener(t, () => { if (state) armIdle(); }, { passive: true }));

boot();
