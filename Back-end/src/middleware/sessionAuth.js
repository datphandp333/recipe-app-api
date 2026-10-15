import { verifyToken } from '@clerk/backend';

export function sessionAuth({ verifySession = verifyToken, env = process.env } = {}) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
    const secretKey = env.CLERK_SECRET_KEY;
    const jwtKey = env.CLERK_JWT_KEY?.replace(/\\n/g, '\n');
    if (!secretKey && !jwtKey) return res.status(503).json({ message: 'Account verification is unavailable.' });
    try {
      const authorizedParties = env.CLERK_AUTHORIZED_PARTIES?.split(',').map(x => x.trim()).filter(Boolean);
      const payload = await verifySession(token, { secretKey, jwtKey, authorizedParties });
      if (!payload.sub || !payload.sid) throw new Error('Session required');
      req.userId = payload.sub;
      req.pantryUserId = payload.sub; // Compatibility with existing pantry handlers.
      next();
    } catch { res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
  };
}
