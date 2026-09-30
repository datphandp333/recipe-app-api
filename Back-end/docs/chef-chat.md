# Recipe Chef conversation

The mobile chef screen discusses cooking questions and offers up to three contextual suggested replies. Users can explore dishes, ask for substitutions, and refine preferences before tapping **Create my dish**. Any unsent text is included when they tap that button. The finished recipe can still be saved to My Cookbook, and users can ask further questions about it.

`POST /api/ai/recipes/chat` accepts `messages` (user/assistant text history) and an optional boolean `finalize`, which defaults to `false`. It returns `reply`, `suggestedReplies`, and `suggestedRecipe`. Discussion requests always return a null recipe. Finalization may still return a clarifying question if essential information is missing. The model is instructed to reserve full instructions for finalization; free-text model compliance requires live evaluation.

History is retained for up to 80 messages instead of silently dropping earlier preferences. Longer conversations are rejected and require a fresh chat. History is local to the screen and is not persisted across app restarts. Generated recipe details are included in subsequent messages so follow-up questions have context.

Run the mocked service contract tests with Node 24:

```sh
node --experimental-test-module-mocks --test Back-end/src/services/chefChat.test.js
```

Manual check with the backend and Expo app running:

1. Ask “I have chicken and rice. What could I make?” Confirm the chef discusses options without a recipe card.
2. Choose an option, specify two servings, and ask for a milder version. Confirm replies use those preferences and suggestion chips send messages.
3. Tap **Create my dish**. Confirm a complete recipe appears and can be saved.
4. Ask about replacing an ingredient in that recipe. Confirm the answer refers to the finished dish; tap **Create my dish** again for an updated recipe.
5. Simulate a failed request. Confirm the draft is restored and retry does not add duplicate user turns. During a request, sending and resetting are disabled.
