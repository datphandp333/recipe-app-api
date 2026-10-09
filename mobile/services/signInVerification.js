export const VERIFICATION_LABELS = { totp: 'Authenticator app', phone_code: 'Text message', backup_code: 'Backup code', email_code: 'Email code' };
export function verificationMethods(signIn) {
  const allowed = signIn.status === 'needs_client_trust' ? ['email_code', 'phone_code'] : ['totp', 'phone_code', 'email_code', 'backup_code'];
  return allowed.filter(strategy => signIn.supportedSecondFactors?.some(factor => factor.strategy === strategy));
}
export async function sendVerification(signIn, method) {
  if (method === 'email_code') return signIn.mfa.sendEmailCode();
  if (method === 'phone_code') return signIn.mfa.sendPhoneCode();
  if (method === 'totp' || method === 'backup_code') return { error: null };
  throw new Error('This verification method is not supported.');
}
export async function verifySignInCode(signIn, method, code) {
  const methods = { totp: 'verifyTOTP', phone_code: 'verifyPhoneCode', backup_code: 'verifyBackupCode', email_code: 'verifyEmailCode' };
  if (!methods[method]) throw new Error('Choose a verification method.');
  return signIn.mfa[methods[method]]({ code: code.trim() });
}
