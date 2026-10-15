// Local testing is unrestricted. Public production keeps limits unless explicitly disabled.
export function betaLimitsEnabled(env = process.env) {
  if (env.BETA_LIMITS_ENABLED === 'true') return true;
  if (env.BETA_LIMITS_ENABLED === 'false') return false;
  return env.NODE_ENV === 'production';
}
