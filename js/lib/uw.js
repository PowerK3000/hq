// Underwriting math. Same inputs and outputs as the Command Center sheet's Underwriting tab,
// except debt service uses standard monthly amortization (the sheet's v1 used annual payments,
// which overstates debt service a little). Lender underwriting will be more detailed.
export function payment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  const n = years * 12, r = annualRate / 12;
  const m = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  return m * 12;
}

export function underwrite(i) {
  const sde = (i.sde || 0) + (i.addbacks || 0);
  const cfBeforeDebt = sde - (i.replMgmt || 0) - (i.capex || 0);
  const senior = i.price * i.seniorPct;
  const ads = payment(senior, i.rate, i.amortYears);
  const equity = i.price * i.equityPct;
  const sellerNote = i.price * i.sellerPct;
  const closing = i.price * (i.closingPct || 0);
  const cashNeeded = equity + closing + (i.wc || 0);
  const stackTotal = i.seniorPct + i.equityPct + i.sellerPct;
  return {
    sde, cfBeforeDebt, senior, ads, equity, sellerNote, closing, cashNeeded,
    dscr: ads > 0 ? cfBeforeDebt / ads : Infinity,
    multiple: sde > 0 ? i.price / sde : Infinity,
    cfAfterDebt: cfBeforeDebt - ads,
    stackOk: Math.abs(stackTotal - 1) < 0.0001,
    stackTotal,
  };
}

export function buyBoxTest(i, o, box) {
  const t = [];
  const mk = (label, pass) => t.push({ label, pass });
  const fp = (n) => (n >= 1e6 ? `${n / 1e6}M` : `${n / 1000}K`);
  mk(`Price ${fp(box.priceMin)} to ${fp(box.priceMax)}`, i.price >= box.priceMin && i.price <= box.priceMax);
  // GM-run tier: earnings must cover the GM plus 1.25x debt service (about GM + 16% of price).
  const need = box.gm ? box.gm + 0.162 * i.price : box.sdeMin;
  mk(box.gm ? `Earnings at least ${Math.round(need / 1000)}K (GM ${box.gm / 1000}K + 16% of price)` : `SDE at least ${box.sdeMin / 1000}K`, o.sde >= need);
  mk(`Multiple at most ${box.multipleMax}x`, o.multiple <= box.multipleMax);
  mk(`DSCR at least ${box.dscrPreferred}x (preferred)`, o.dscr >= box.dscrPreferred);
  mk(`DSCR at least ${box.dscrFloor}x (floor)`, o.dscr >= box.dscrFloor);
  return t;
}

// Weighted deal score 0-100 from per-criterion 0-10 scores.
export function dealScore(scores, criteria) {
  if (!scores) return null;
  let total = 0, weight = 0;
  for (const c of criteria) {
    const s = scores[c.id];
    if (typeof s === 'number') { total += (s / 10) * c.weight; weight += c.weight; }
  }
  return weight ? Math.round((total / weight) * 100 * 10) / 10 : null;
}

// XIRR by bisection on dated cash flows [{date:'YYYY-MM-DD', amount}]; returns null if undefined.
export function xirr(flows) {
  const f = flows.filter((x) => x.amount && x.date);
  if (f.length < 2 || !f.some((x) => x.amount < 0) || !f.some((x) => x.amount > 0)) return null;
  const t0 = new Date(f[0].date).getTime();
  const npv = (r) => f.reduce((s, x) => s + x.amount / Math.pow(1 + r, (new Date(x.date).getTime() - t0) / 31557600000), 0);
  let lo = -0.99, hi = 10;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
