// Formatting and date helpers. Dates are plain 'YYYY-MM-DD' strings, parsed at local midnight
// so a due date never shifts a day because of the viewer's timezone.
const DAY = 86400000;

export function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function toKey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
export function todayKey() { return toKey(today()); }
export function daysUntil(s) {
  const d = parseDate(s);
  return d ? Math.round((d - today()) / DAY) : null;
}
export function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return toKey(d); }
export function weekStart(s) {
  const d = parseDate(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return toKey(d);
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function fmtDate(s, withDow = true) {
  const d = parseDate(s); if (!d) return s || '';
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  const yr = d.getFullYear() !== today().getFullYear() ? ` ${d.getFullYear()}` : '';
  return (withDow ? `${DOW[d.getDay()]} ` : '') + base + yr;
}
export function rel(s) {
  const n = daysUntil(s); if (n == null) return '';
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n}d` : `${-n}d ago`;
}

export function money(n, compact = false) {
  if (n == null || Number.isNaN(n)) return '–';
  const abs = Math.abs(n), sign = n < 0 ? '-' : '';
  if (compact) {
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 2).replace(/\.?0+$/, '')}M`;
    if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}
export function pct(n, d = 0) { return n == null || Number.isNaN(n) ? '–' : `${(n * 100).toFixed(d)}%`; }
export function mult(n, d = 2) { return n == null || !Number.isFinite(n) ? '–' : `${n.toFixed(d)}x`; }
