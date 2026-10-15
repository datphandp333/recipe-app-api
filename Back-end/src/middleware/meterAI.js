import { betaLimitsEnabled } from '../services/betaConfig.js';
import { createHash } from 'node:crypto';
import { meteredFeatures } from '../services/membershipPolicy.js';
import { withAIUsage } from '../services/aiUsage.js';

export function meterAI(service, selectFeatures = meteredFeatures, { enabled = betaLimitsEnabled() } = {}) {
  return async (req, res, next) => {
    const userId = req.userId || req.pantryUserId;
    if (!userId) return res.status(401).json({ message: 'Sign in to continue.' });
    if (!enabled) {
      if (res.destroyed) return;
      const controller = new AbortController();
      const disconnect = () => controller.abort();
      res.once('close', disconnect);
      res.once('finish', () => res.off('close', disconnect));
      return withAIUsage({ feature: selectFeatures(req).join('/'), signal: controller.signal }, next);
    }
    const requestId = req.headers['x-request-id'];
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(requestId)) {
      return res.status(400).json({ code: 'request_id_required', message: 'Update the app to continue using AI features.' });
    }
    const features = selectFeatures(req);
    const fingerprint = createHash('sha256').update(JSON.stringify({ path: req.originalUrl, body: req.body })).digest('hex');
    const originalJson = res.json.bind(res);
    let reservation;
    try { reservation = await service.reserve(userId, requestId, fingerprint, features); }
    catch {
      return res.status(503).json({ code: 'allowance_unavailable', message: 'Your beta allowance could not be checked. Please try again.' });
    }
    if (reservation.kind === 'quota') {
      console.info(JSON.stringify({ event: 'ai_quota_exceeded', feature: reservation.feature }));
      return res.status(403).json({ code: 'quota_exceeded', feature: reservation.feature,
        resetsAt: reservation.resetsAt, message: 'You have used this month’s free beta allowance. It resets on the date shown in Beta usage.' });
    }
    if (reservation.kind === 'replay') return res.status(reservation.status).json(reservation.body);
    if (reservation.kind !== 'reserved') return res.status(409).json({ code: `request_${reservation.kind}`,
      message: reservation.kind === 'pending' ? 'This request is still running. Please wait.' : 'This request cannot be reused. Please try again.' });

    if (res.destroyed) {
      await service.settle(userId, requestId, null, null, 499).catch(() => {});
      return;
    }
    const controller = new AbortController();
    let settling = false;
    const release = () => {
      controller.abort();
      if (!settling) {
        settling = true;
        service.settle(userId, requestId, null, null, 499).catch(() => {});
      }
    };
    res.once('close', release);
    res.json = body => {
      if (settling) return res;
      settling = true;
      res.off('close', release);
      const status = res.statusCode;
      const successful = status >= 200 && status < 300;
      const feature = !successful ? null : features.length === 2
        ? (body?.suggestedRecipe ? 'recipes' : 'chat') : features[0];
      (async () => {
        try {
          const settled = await service.settle(userId, requestId, feature, body, status);
          if (!settled && successful) {
            res.status(503);
            return originalJson({ code: 'request_expired', message: 'The request took too long. Please try again.' });
          }
          return originalJson(body);
        } catch {
          // The database may have committed even if the response was lost. Retry the same ID.
          res.status(503);
          return originalJson({ code: 'allowance_unavailable', message: 'The result could not be confirmed. Please retry.' });
        }
      })();
      return res;
    };
    withAIUsage({ feature: features.join('/'), requestId, signal: controller.signal }, next);
  };
}
