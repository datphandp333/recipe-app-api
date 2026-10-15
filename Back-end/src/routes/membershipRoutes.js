import { betaLimitsEnabled } from '../services/betaConfig.js';
import { Router } from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
export function createMembershipRouter({ service, authenticate = sessionAuth(), enabled = betaLimitsEnabled() }) {
  const router = Router();
  router.use(authenticate);
  router.get('/', async (req, res) => {
    if (!enabled) return res.json({ plan: 'testing', purchasesEnabled: false, allowancesEnabled: false, allowances: null, resetsAt: null });
    try { res.json(await service.status(req.userId)); }
    catch { res.status(503).json({ code: 'allowance_unavailable', message: 'Beta usage is temporarily unavailable. Please try again.' }); }
  });
  return router;
}
