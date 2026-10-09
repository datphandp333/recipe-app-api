import test from 'node:test';
import assert from 'node:assert/strict';
import { verificationMethods, sendVerification, verifySignInCode } from '../services/signInVerification.js';
test('offers only supported second factors, prioritizing authenticator', () => {
  assert.deepEqual(verificationMethods({ status: 'needs_second_factor', supportedSecondFactors: [{ strategy: 'backup_code' }, { strategy: 'totp' }, { strategy: 'email_code' }] }), ['totp', 'email_code', 'backup_code']);
  assert.deepEqual(verificationMethods({ status: 'needs_client_trust', supportedSecondFactors: [{ strategy: 'email_code' }] }), ['email_code']);
});
test('dispatches verification codes to the appropriate Clerk method', async () => {
  for (const [strategy, method] of Object.entries({ totp: 'verifyTOTP', phone_code: 'verifyPhoneCode', backup_code: 'verifyBackupCode', email_code: 'verifyEmailCode' })) {
    let received;
    const result = await verifySignInCode({ mfa: { [method]: async payload => { received = payload; return { error: null }; } } }, strategy, ' abc123 ');
    assert.deepEqual(received, { code: 'abc123' }); assert.equal(result.error, null);
  }
});
test('authenticator and backup codes do not request a message; errors propagate', async () => {
  assert.deepEqual(await sendVerification({}, 'totp'), { error: null });
  assert.deepEqual(await sendVerification({}, 'backup_code'), { error: null });
  const error = { message: 'Invalid code' };
  assert.deepEqual(await verifySignInCode({ mfa: { verifyTOTP: async () => ({ error }) } }, 'totp', '123'), { error });
  await assert.rejects(verifySignInCode({}, 'unsupported', '123'));
});

test('email-only second-factor challenges open the email verification flow', async () => {
  const calls = [];
  const signIn = {
    status: 'needs_second_factor', supportedSecondFactors: [{ strategy: 'email_code' }],
    mfa: { sendEmailCode: async () => { calls.push('send'); return { error: null }; },
      verifyEmailCode: async ({ code }) => { calls.push(code); return { error: null }; } },
  };
  const [method] = verificationMethods(signIn);
  assert.equal(method, 'email_code');
  await sendVerification(signIn, method);
  await verifySignInCode(signIn, method, ' 123456 ');
  assert.deepEqual(calls, ['send', '123456']);
});
