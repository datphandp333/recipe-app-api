// Free beta. Plus billing is deliberately not enabled before launch.
export const BETA_LIMITS = Object.freeze({ chat: 20, recipes: 5, scans: 2, plans: 1 });
export function monthlyWindow(anchor, now = new Date()) {
  const start = new Date(anchor);
  if (!Number.isFinite(start.getTime()) || start > now) throw new Error('Invalid allowance start');
  const anniversary = offset => {
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + offset;
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), last), start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds()));
  };
  let offset = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
  if (anniversary(offset) > now) offset--;
  return { start: anniversary(offset), end: anniversary(offset + 1) };
}
export function membershipPeriod(account, now = new Date()) {
  const window = monthlyWindow(account.createdAt, now);
  return { plan: 'beta', period: window.start.toISOString(), resetsAt: window.end.toISOString(), limits: BETA_LIMITS };
}
export function meteredFeatures(req) {
  if (req.path.toLowerCase().replace(/\/+$/, '') === '/chat') return req.body?.finalize === true ? ['chat', 'recipes'] : ['chat'];
  return ['recipes'];
}
