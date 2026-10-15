import { sql } from 'drizzle-orm';
import { membershipPeriod } from './membershipPolicy.js';

const rowsOf = result => result.rows || result;
export function createMembershipService({ db, now }) {
  const query = async statement => rowsOf(await db.execute(statement));
  async function account(userId) {
    const rows = await query(sql`INSERT INTO membership_accounts(user_id) VALUES(${userId})
      ON CONFLICT(user_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING created_at,now() AS server_now`);
    return { createdAt: rows[0].created_at, serverNow: new Date(rows[0].server_now) };
  }
  async function period(userId) {
    const value = await account(userId);
    return membershipPeriod(value, now ? now() : value.serverNow);
  }
  return {
    async purgeExpiredReceipts() {
      await query(sql`UPDATE membership_requests SET response=NULL WHERE response IS NOT NULL AND created_at < now()-interval '24 hours'`);
    },
    async status(userId) {
      const current = await period(userId);
      const usage = await query(sql`SELECT feature,used FROM membership_usage WHERE user_id=${userId} AND period=${current.period}`);
      const reservations = await query(sql`SELECT features FROM membership_requests WHERE user_id=${userId}
        AND period=${current.period} AND state='pending' AND lease_until > now()`);
      const allowances = Object.fromEntries(Object.entries(current.limits).map(([feature, limit]) => {
        const used = usage.find(row => row.feature === feature)?.used || 0;
        const reserved = reservations.filter(row => row.features.includes(feature)).length;
        return [feature, { limit, used, reserved, remaining: Math.max(0, limit - used - reserved) }];
      }));
      return { plan: 'beta', purchasesEnabled: false, resetsAt: current.resetsAt, allowances };
    },
    async reserve(userId, requestId, fingerprint, features) {
      const current = await period(userId);
      const rows = await query(sql`SELECT membership_reserve(${userId},${requestId},${fingerprint},${current.period},
        ${JSON.stringify(features)}::jsonb,${JSON.stringify(current.limits)}::jsonb) AS result`);
      return { ...rows[0].result, resetsAt: current.resetsAt };
    },
    async settle(userId, requestId, feature, body, status) {
      const rows = await query(sql`SELECT membership_settle(${userId},${requestId},${feature},
        ${JSON.stringify(body ?? null)}::jsonb,${status}) AS settled`);
      return rows[0].settled;
    },
  };
}
