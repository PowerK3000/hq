// Everything the dashboard shows that is computed rather than stored.
import { daysUntil, todayKey, weekStart, addDays } from './fmt.js';

export function readinessStats(state) {
  const groups = state.readiness.map((g) => {
    const total = g.items.length;
    const done = g.items.filter((i) => i.status === 'done').length;
    const blocked = g.items.filter((i) => i.status === 'blocked').length;
    return { group: g.group, total, done, blocked, frac: total ? done / total : 0 };
  });
  const total = groups.reduce((s, g) => s + g.total, 0);
  const done = groups.reduce((s, g) => s + g.done, 0);
  return { groups, total, done, frac: total ? done / total : 0 };
}

export function openTasks(state) { return state.tasks.filter((t) => t.status !== 'done'); }

export function taskStats(state) {
  const open = openTasks(state);
  const overdue = open.filter((t) => t.due && daysUntil(t.due) < 0);
  const soon = open.filter((t) => t.due && daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7);
  const blocked = state.tasks.filter((t) => t.status === 'blocked');
  return { open, overdue, soon, blocked, done: state.tasks.filter((t) => t.status === 'done').length };
}

// Dated things in one list: deadlines, open task due dates, open milestones.
export function agenda(state, fromDays = -7, toDays = 400) {
  const items = [];
  for (const d of state.deadlines) items.push({ date: d.date, title: d.title, kind: d.type, src: 'deadline' });
  for (const t of openTasks(state)) if (t.due) items.push({ date: t.due, title: t.title, kind: 'task', owner: t.owner, src: 'task', ref: t.id });
  for (const m of state.milestones) if (!m.done) items.push({ date: m.date, title: m.title, kind: 'milestone', src: 'milestone' });
  return items
    .filter((i) => { const n = daysUntil(i.date); return n != null && n >= fromDays && n <= toDays; })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nextDeadline(state) {
  const upcoming = [...state.deadlines.map((d) => ({ ...d })), ...state.milestones.filter((m) => !m.done)]
    .filter((x) => daysUntil(x.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}

// Last n weeks ending with the current week, zero-filled.
export function funnelWeeks(state, n = 12) {
  const byWeek = new Map(state.funnel.weeks.map((w) => [w.week, w]));
  const end = weekStart(todayKey());
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const wk = addDays(end, -7 * i);
    const w = byWeek.get(wk) || {};
    out.push({ week: wk, conversations: w.conversations || 0, outreach: w.outreach || 0, listings: w.listings || 0, ownerCalls: w.ownerCalls || 0, ndas: w.ndas || 0, lois: w.lois || 0 });
  }
  return out;
}

export function funnelTotals(state) {
  const t = { conversations: 0, outreach: 0, listings: 0, ownerCalls: 0, ndas: 0, lois: 0 };
  for (const w of state.funnel.weeks) for (const k of Object.keys(t)) t[k] += w[k] || 0;
  return t;
}

export function contactCoverage(state) {
  return state.contactTargets.map((t) => {
    const have = state.contacts.filter((c) => c.type === t.type && ['Met', 'Active'].includes(c.status)).length;
    return { ...t, have };
  });
}

export function blockers(state) {
  const out = [];
  for (const t of state.tasks) if (t.status === 'blocked') out.push({ kind: 'Task', text: t.title, note: t.notes });
  for (const g of state.readiness) for (const i of g.items) if (i.status === 'blocked') out.push({ kind: 'Readiness', text: i.label, note: i.note });
  return out;
}

export function holdingMetrics(state) {
  const hs = state.portfolio.holdings;
  const invested = hs.reduce((s, x) => s + (x.equityInvested || 0), 0);
  const value = hs.reduce((s, x) => s + (x.currentEquityValue || 0), 0);
  const dist = hs.reduce((s, x) => s + (x.distributions || 0), 0);
  return { count: hs.length, invested, value, dist, moic: invested ? (value + dist) / invested : null };
}

export function searchIndex(state) {
  const idx = [];
  for (const t of state.tasks) idx.push({ view: 'tasks', label: t.title, hint: `Task, ${t.owner}` });
  for (const c of state.contacts) idx.push({ view: 'network', label: `${c.name} ${c.org || ''}`.trim(), hint: `Contact, ${c.type}` });
  for (const d of state.pipeline) idx.push({ view: 'deals', label: d.name, hint: 'Deal' });
  for (const g of state.readiness) for (const i of g.items) idx.push({ view: 'readiness', label: i.label, hint: `Readiness, ${g.group}` });
  for (const j of state.journal) idx.push({ view: 'journal', label: j.title, hint: `Journal, ${j.date}` });
  for (const r of state.reference) idx.push({ view: 'reference', label: r.topic, hint: 'Reference' });
  return idx;
}
