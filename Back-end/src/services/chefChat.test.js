import test, { mock } from "node:test";
import assert from "node:assert/strict";

// Keep these contract tests independent of credentials and installed dotenv.
mock.module("../config/env.js", {
  namedExports: { ENV: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "test-model" } },
});
const { chatWithRecipeChef } = await import("./geminiRecipeService.js");

const recipe = {
  title: "Mild rice bowl", servings: 2,
  ingredients: [{ name: "rice", amount: "1 cup" }],
  instructions: [{ instruction: "Cook the rice in water." }],
};
const messages = [{ role: "user", content: "I want a mild rice dish for two." }];

function respond(t, result) {
  return t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }),
  }));
}

test("discussion suppresses premature recipes and cleans suggested replies", async t => {
  respond(t, { reply: "Would you prefer a bowl or soup?", suggestedRecipe: recipe,
    suggestedReplies: [" Rice bowl ", null, "Rice bowl", "Soup", "More options", "Extra"] });
  for (const finalize of [false, "true", undefined]) {
    const result = await chatWithRecipeChef({ messages, finalize });
    assert.equal(result.suggestedRecipe, null);
    assert.deepEqual(result.suggestedReplies, ["Rice bowl", "Soup", "More options"]);
  }
});

test("finalization returns a complete recipe and clears suggested replies", async t => {
  respond(t, { reply: "Here is your dish.", suggestedRecipe: recipe, suggestedReplies: ["Soup"] });
  const result = await chatWithRecipeChef({ messages, finalize: true });
  assert.equal(result.suggestedRecipe.title, recipe.title);
  assert.equal(result.suggestedRecipe.servings, 2);
  assert.equal(result.suggestedRecipe.ingredients[0].name, "rice");
  assert.deepEqual(result.suggestedReplies, []);
});

test("finalization can ask for essential clarification; malformed recipes fail for retry", async t => {
  const response = { reply: "Which ingredient must I avoid?", suggestedRecipe: null };
  respond(t, response);
  assert.equal((await chatWithRecipeChef({ messages, finalize: true })).suggestedRecipe, null);
  response.suggestedRecipe = { title: "Incomplete" };
  await assert.rejects(chatWithRecipeChef({ messages, finalize: true }), /could not complete/);
});

test("long conversations retain early restrictions instead of dropping old turns", async t => {
  const fetchMock = respond(t, { reply: "A mild bowl fits.", suggestedRecipe: null });
  const history = [{ role: "user", content: "Avoid peanuts throughout this conversation." },
    ...Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "user" : "assistant", content: `Turn ${i}` }))];
  await chatWithRecipeChef({ messages: history });
  const body = JSON.parse(fetchMock.mock.calls[0].arguments[1].body);
  assert.match(body.contents[0].parts[0].text, /Avoid peanuts throughout/);
  await assert.rejects(chatWithRecipeChef({ messages: Array(81).fill(messages[0]) }), { status: 400 });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("empty conversations and assistant-only requests are rejected before calling Gemini", async t => {
  const fetchMock = respond(t, {});
  for (const messages of [[], [{ role: "assistant", content: "Hello" }]]) {
    await assert.rejects(chatWithRecipeChef({ messages }), { status: 400 });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});
