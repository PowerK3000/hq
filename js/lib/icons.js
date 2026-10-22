// One consistent icon set: 24px grid, 1.7 stroke, round caps. Authored here, no external library.
import { h } from './dom.js';

const PATHS = {
  overview: 'M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z',
  roadmap: 'M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M7 17h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6',
  tasks: 'M9 11l2 2 4-4 M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
  calendar: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z M4 11h16 M8 3v4 M16 3v4',
  funnel: 'M4 5h16l-6 8v5l-4 2v-7z',
  network: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 19a6 6 0 0 1 12 0 M17 11a2.5 2.5 0 1 0 0-5 M21 18a5 5 0 0 0-4-4.9',
  deals: 'M4 8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M4 13h16',
  underwriting: 'M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8 8h8 M8 12h2 M12 12h2 M8 16h2 M12 16h4',
  readiness: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9 12l2 2 4-4',
  capital: 'M4 7a1 1 0 0 1 1-1h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z M4 8h14 M16 13h2',
  portfolio: 'M4 20V10 M10 20V4 M16 20v-7 M21 20H3',
  journal: 'M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z M6 18a2 2 0 0 1 2-2h11 M10 8h5',
  reference: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  mark: 'M7 18V6 M17 18V6 M7 12h10',
};

export function icon(name) {
  const svg = h('svg:svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
  svg.append(h('svg:path', { d: PATHS[name] || PATHS.reference }));
  return svg;
}
