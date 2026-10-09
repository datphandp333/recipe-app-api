export function accessState(loaded, session) {
  if (!loaded) return 'loading';
  if (!session) return 'signed-out';
  if (session.currentTask || session.status === 'pending') return 'pending';
  return session.status === 'active' ? 'ready' : 'signed-out';
}
export function authError(error) {
  if (['ERR_REQUEST_CANCELED', 'SIGN_IN_CANCELLED', '-5', '12501'].includes(String(error?.code))) return '';
  if (/network|fetch|offline/i.test(error?.message || '')) return 'Could not connect. Check your connection and try again.';
  return error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error?.message || 'Sign-in could not be completed. Please try again.';
}
export function socialOutcome(result) {
  if (result?.createdSessionId) return 'complete';
  if (['cancel', 'dismiss'].includes(result?.authSessionResult?.type)) return 'canceled';
  if (['needs_second_factor', 'needs_first_factor', 'needs_new_password', 'needs_client_trust', 'needs_protect_check'].includes(result?.signIn?.status) || result?.signUp?.status === 'missing_requirements') return 'requirements';
  return 'canceled';
}
