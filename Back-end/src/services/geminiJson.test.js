import test from "node:test";
import assert from "node:assert/strict";
import { ENV } from "../config/env.js";
import { askGeminiForJson, parseGeminiJson } from "./geminiRecipeService.js";

test("JSON extraction accepts fences and surrounding prose but rejects incomplete JSON", () => {
  for (const input of ['{"meals":[]}', '```json\n{"meals":[]}\n```', 'Here is your plan:\n{"meals":[]}\nEnjoy!']) {
    assert.deepEqual(parseGeminiJson(input), { meals: [] });
  }
  assert.throws(() => parseGeminiJson('{"meals":['));
});

test("Gemini transport sends schema, excludes thought text, and rejects truncated responses", async t => {
  const originalKey = ENV.GEMINI_API_KEY;
  ENV.GEMINI_API_KEY = "test-key";
  t.after(() => { ENV.GEMINI_API_KEY = originalKey; });
  let finishReason = "STOP";
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [
      { thought: true, text: "Non-JSON reasoning" }, { text: '{"meals":[]}' },
    ] } }] }) };
  });
  const schema = { type: "OBJECT" };
  assert.equal(await askGeminiForJson("test", 0.4, undefined, { responseSchema: schema, maxOutputTokens: 8192 }), '{"meals":[]}');
  assert.deepEqual(sent.generationConfig.responseSchema, schema);
  assert.equal(sent.generationConfig.maxOutputTokens, 8192);
  finishReason = "MAX_TOKENS";
  await assert.rejects(askGeminiForJson("test"), error => error.code === "GEMINI_TRUNCATED" && error.status === 502);
});

test("missing API key and upstream outages have distinct error codes", async t => {
  const originalKey = ENV.GEMINI_API_KEY;
  t.after(() => { ENV.GEMINI_API_KEY = originalKey; });
  ENV.GEMINI_API_KEY = "";
  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503,
    json: async () => ({ error: { message: "Service unavailable" } }) }));
  await assert.rejects(askGeminiForJson("test"), error => error.code === "GEMINI_NOT_CONFIGURED");
  assert.equal(fetchMock.mock.callCount(), 0);
  ENV.GEMINI_API_KEY = "test-key";
  await assert.rejects(askGeminiForJson("test"), error => error.code === "GEMINI_UPSTREAM_ERROR" && error.status === 503);
});
