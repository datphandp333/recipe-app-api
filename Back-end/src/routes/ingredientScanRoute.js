import { scanIngredients } from '../services/ingredientScanService.js';
// Mounted after the pantry's Clerk authentication middleware.
export function ingredientScanHandler(scan = scanIngredients) {
  const inFlight = new Set();
  return async (req, res) => {
    const userId = req.pantryUserId;
    if (!userId) return res.status(401).json({ message: 'Sign in to scan ingredients.' });
    if (inFlight.has(userId) || inFlight.size >= 10) return res.status(429).json({ message: 'A scan is already running. Please wait and try again.' });
    inFlight.add(userId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', disconnect);
    try { res.json(await scan(req.body, { signal: controller.signal })); }
    catch (error) {
      if (!res.destroyed) res.status(controller.signal.aborted ? 504 : error.status || 502).json({
        message: controller.signal.aborted ? 'Scanning took too long. Please try again.' : error.status ? error.message : 'Photo analysis is temporarily unavailable.',
      });
    } finally { clearTimeout(timeout); res.off('close', disconnect); inFlight.delete(userId); }
  };
}
