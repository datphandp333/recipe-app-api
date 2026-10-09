import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { validateScanImage, normalizeScanResult, scanIngredients } from './ingredientScanService.js';
import { ingredientScanHandler } from '../routes/ingredientScanRoute.js';
const photo = { mimeType: 'image/jpeg', image: Buffer.from([255,216,255,224,1,2,255,217]).toString('base64') };
test('validates format, signature and upload bounds before sending an image', () => {
  assert.deepEqual(validateScanImage(photo), photo);
  for (const body of [{}, { ...photo, mimeType: 'text/plain' }, { ...photo, image: 'not base64' }, { ...photo, image: Buffer.from('not a jpeg').toString('base64') }, { ...photo, image: 'a'.repeat(4 * 1024 * 1024 + 4) }]) assert.throws(() => validateScanImage(body));
});
test('normalizes suggestions without accepting AI quantities or dates', () => {
  assert.deepEqual(normalizeScanResult({ ingredients: [{ name: ' Tomato ', quantity: 99, expiresOn: '2030-01-01', uncertain: false }, { name: 'tomato' }, { name: '' }, { name: 'Pepper' }] }), { ingredients: [{ name: 'Tomato', uncertain: false }, { name: 'Pepper', uncertain: true }] });
  assert.deepEqual(normalizeScanResult({ ingredients: [] }), { ingredients: [] });
  assert.throws(() => normalizeScanResult({}));
});
test('sends inline image to Gemini and handles malformed and failed responses', async () => {
  const env = { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'models/test' };
  const result = await scanIngredients(photo, { env, fetchImpl: async (url, options) => {
    assert.ok(!url.includes('test-key'));
    const payload = JSON.parse(options.body);
    assert.equal(payload.contents[0].parts[1].inlineData.data, photo.image);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"ingredients":[{"name":"Onion","uncertain":false}]}' }] } }] }) };
  } });
  assert.equal(result.ingredients[0].name, 'Onion');
  await assert.rejects(scanIngredients(photo, { env, fetchImpl: async () => ({ ok: false, status: 429 }) }), { status: 429 });
  await assert.rejects(scanIngredients(photo, { env, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), { status: 502 });
});
const response = () => Object.assign(new EventEmitter(), { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; this.writableEnded = true; } });
test('route requires identity and blocks simultaneous scans for the same user', async () => {
  let release; const pending = new Promise(resolve => { release = resolve; });
  const handler = ingredientScanHandler(async () => { await pending; return { ingredients: [] }; });
  const anonymous = response(); await handler({ body: photo }, anonymous); assert.equal(anonymous.statusCode, 401);
  const first = response(); const work = handler({ pantryUserId: 'a', body: photo }, first);
  const second = response(); await handler({ pantryUserId: 'a', body: photo }, second); assert.equal(second.statusCode, 429);
  release(); await work; assert.deepEqual(first.body, { ingredients: [] });
  const next = response(); await handler({ pantryUserId: 'a', body: photo }, next); assert.equal(next.statusCode, 200);
});
