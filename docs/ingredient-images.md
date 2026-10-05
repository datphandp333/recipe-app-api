# Ingredient pictures

The shared `IngredientPicture` component displays ingredient-specific visuals in recipe details, AI Chef results, Second Serving results, and the saved-recipe editor's ingredient preview. Preparation text is retained in labels while matching against 992 ingredient names from TheMealDB (retrieved October 5, 2026). Matching prefers exact names, explicit aliases, and then the longest whole ingredient phrase. Combined herb entries in the starter catalog display both herbs.

Photos come from [TheMealDB ingredient image service](https://www.themealdb.com/api.php). They illustrate the ingredient, not necessarily its exact preparation, brand, quantity, or packaging. All 60 distinct photo URLs used by the starter collection were checked for valid image responses. Nori and pizza dough use original code-drawn illustrations because the provider did not have matching pictures.

Existing explicit ingredient URLs are preserved, with a matched provider photo as backup. Unknown ingredients and failed downloads display an initial and “No photo”; the UI does not pretend that every possible ingredient has a provider image. Photos require network access; the two illustrations work offline. No image-generation or per-screen image-search requests are needed.

Validation: `node --test mobile/tests/ingredientImages.test.mjs` covers all starter ingredients, descriptive names, combined herbs, explicit image URLs, and unsafe URL rejection. Targeted lint passes for the new component, resolver, editor, and Second Serving screen. Broader lint still reports pre-existing React hook/purity errors in recipe detail and Chef screens.
