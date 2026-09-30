# Curated home page

The home screen implements the direction in [the proposal](research/homepage-proposal.md): “A world of flavor. Made in your kitchen.” It replaces random recommendations with a bundled starter collection, country exploration, ingredient search, cookbook actions, and contextual entry into Chef chat.

## Content and behavior

- `mobile/data/countries.js` contains all 195 countries and territories in the researched MealDB list. The research CSV remains the source reference for each country's iconic dish. These are editorial choices, not measured popularity rankings.
- `mobile/data/curatedRecipes.js` contains eight original home adaptations with complete ingredients and instructions. Times are estimates and the recipes have not been kitchen-tested. Source links document cultural context; they do not claim these instructions were copied or tested by the linked organization.
- The initial collection and its bundled photos need no MealDB request. Country selection uses local recipes first, then MealDB only for countries without local recipes. Additional recipes are labeled as recipes to explore, not necessarily the researched iconic dish.
- MealDB results must include ingredients and instructions and match the selected country. Ambiguous area labels never substitute another country's recipes. Missing coverage displays an honest empty state with a Chef action.
- Successful fallback results are cached in memory for the current session (40 countries / 240 recipes). Refresh failures retain cached results. This is not persistent offline storage.
- Recipe IDs remain strings throughout saving and navigation. Cookbook saves retain ingredients, instructions, and the adaptation note.
- Chef actions prefill a draft without sending it. The user discusses preferences and alternatives before choosing “Create my dish.”

## Photos and attribution

Images are serving suggestions, not photographs of tested versions of the bundled recipes. All assets are in `mobile/assets/images/curated`; their mapping is in `curatedImages.js`. Remote source URLs are retained for saved recipe records. Recipe details link to image credits.

| Asset | Source |
| --- | --- |
| Beef phở | [TheMealDB 53238](https://www.themealdb.com/meal/53238) |
| Margherita | [TheMealDB 53014](https://www.themealdb.com/meal/53014) |
| Vegetable sushi | [Maki Sushi on green leaf plate](https://commons.wikimedia.org/wiki/File:Maki_Sushi_on_green_leaf_plate.jpg), Janet Hudson, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/); original downloaded unchanged, displayed cropped to fit |
| Lamb tagine | [TheMealDB 52843](https://www.themealdb.com/meal/52843) |
| Lamb biryani | [TheMealDB 52805](https://www.themealdb.com/meal/52805) |
| Moussaka | [TheMealDB 53006](https://www.themealdb.com/meal/53006) |
| Vegetable paella | [TheMealDB 52942](https://www.themealdb.com/meal/52942) |
| Feijoada | [TheMealDB 53482](https://www.themealdb.com/meal/53482) |

TheMealDB assets retain provider attribution; they are not claimed as original or public-domain photography. See the research proposal for provider usage considerations.

## Verification

Run the dependency-free catalog tests:

```sh
node --test mobile/tests/recipeCatalog.test.mjs
node --experimental-test-module-mocks --test Back-end/src/services/chefChat.test.js
```

The catalog suite checks all country identities, offline recipes, accent-insensitive search, country isolation, incomplete records, partial provider failures, cached refresh failures, request deduplication, and complete cookbook payloads. Chef tests cover discussion versus explicit finalization and conversation context.

A temporary React Native Web browser harness renders the actual home component with mocked Expo adapters, authentication, and API responses. It checks phone and desktop layouts, saving, country selection, fallback results, and navigation parameters. This does not replace a full Expo iOS/Android run or a live authenticated backend integration test. The workspace has no installed Expo dependencies.
