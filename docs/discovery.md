# The Simmerli kitchen edit

The four main tabs share the editorial theme in `mobile/constants/editorialTheme.js`:
warm ivory, deep green, muted gold, Georgia/serif headlines, readable sans-serif body
text, generous spacing, and photography. Favorites uses full-width photo cards.
Pantry keeps inventory/search/filter/edit operations with the same heading hierarchy.
Recipe details, saved-recipe editing, scanning, Second Serving, and meal planning
carry the same palette and typography. Recipe back/save controls remain fixed below
the device safe area; the tab bar accounts for the bottom inset.

## Search and offline behavior

Search opens directly into a bundled collection of 14 complete dishes: the eight
existing world-cuisine starters plus six original home adaptations. It makes no
initial random-meal requests and never hides the entire screen behind a loader.
The hero highlights mushroom risotto; filters cover chef inspiration, meals taking
30 minutes or less, world favorites, and desserts. Search matches multiple words
across dishes, ingredients, countries/cuisines, and inspiration metadata.

“Favorites” and “handpicked” describe editorial selections, not measured popularity,
customer ratings, or restaurant rankings. The app does not assign Michelin stars to
recipes or imply endorsement. No restaurant star count is stored or shown.

Users can explicitly search TheMealDB for additional dishes. Name search is tried
first, then ingredient search with full-detail hydration. Results are deduplicated;
incomplete records are excluded. Errors and loading stay inline, retaining local
recipes and the search controls. Query/filter changes invalidate stale responses.
Every local discovery ID resolves through the existing recipe detail/catalog path;
cookbook saves retain complete ingredients, instructions, and the adaptation note.

## Chef inspiration and recipes

These are original Simmerli recipes, not verbatim restaurant instructions, authorized
restaurant recipes, or kitchen-tested recipes. Time estimates and photo serving
suggestions are labeled. Ingredients and techniques have been simplified for home
use. Inspiration cards in recipe details link to these primary sources:

- Risotto: [MICHELIN Guide, Simone Zanoni’s risotto feature](https://guide.michelin.com/fr/fr/article/dining-in/l-art-du-risotto), with context from [Le George’s Guide listing](https://guide.michelin.com/en/ile-de-france/paris/restaurant/le-george). Our recipe adds mushrooms and uses different quantities and a simplified stock-based method.
- Roast chicken: [MICHELIN Guide, Lanshu Chen and Raymond Fang’s roast-chicken interview](https://guide.michelin.com/sg/en/article/dining-in/dos-donts-french-roasted-chicken-poulet-roti). Our version changes the seasoning and method and uses thermometer-based safe doneness checks.
- Steak: [MICHELIN Guide, The Science of Steak](https://guide.michelin.com/en/article/features/tips-searing-steak-at-home). This is general searing inspiration, not a specific restaurant connection; our mushroom sauce is our own home adaptation.

The tiramisu cups, garlic spaghetti, and honey-soy salmon are additional original
home adaptations of familiar dishes. Tiramisu excludes raw eggs and includes four
hours of chilling; it is excluded from the 30-minute filter. Whole poultry, steaks,
and fish use the minimum temperatures in the [USDA safe-temperature guidance](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart)
and [FoodSafety.gov chart](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures).

## Photo attribution

Six photographs are bundled locally, avoiding network-dependent initial image loads.
Original downloaded images are unchanged; the UI crops their display to fit cards.
Credits, source links, and the applicable license are available in recipe details.
The full source metadata is in `docs/research/discovery-photo-credits.json`.

| Dish | Photographer | License | Source |
| --- | --- | --- | --- |
| Mushroom risotto | spurekar | CC BY 2.0 | [Mushroom and Leek Risotto](https://commons.wikimedia.org/wiki/File:Mushroom_and_Leek_Risotto_(49535206656).jpg) |
| Roast chicken | Evan Swigart | CC BY 2.0 | [Max’s Roasted Chicken](https://commons.wikimedia.org/wiki/File:Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg) |
| Steak | Ruth Hartnup | CC BY 2.0 | [Steak Diane](https://commons.wikimedia.org/wiki/File:Steak_Diane_(11484836483).jpg) |
| Tiramisu | Anna.Massini | CC BY 4.0 | [Dolce Tiramisù monoporzione](https://commons.wikimedia.org/wiki/File:Dolce_Tiramis%C3%B9_monoporzione.jpg) |
| Garlic spaghetti | Bairuilong | CC BY-SA 4.0 | [Spaghetti aglio e olio](https://commons.wikimedia.org/wiki/File:Spaghetti_aglio_e_olio_KB.jpg) |
| Salmon | Andy Li | CC0 | [Teriyaki Salmon Salad](https://commons.wikimedia.org/wiki/File:TERIYAKI_SALMON_SALAD_-_Jonny%27s_2025-05-27.jpg) |

Retain these credits and license links if replacing, exporting, or reusing images.

## Validation

Run `node --test mobile/tests/discoveryCatalog.test.mjs mobile/tests/recipeCatalog.test.mjs mobile/tests/kitchenLists.test.mjs mobile/tests/navigation.test.mjs mobile/tests/ingredientImages.test.mjs`.
The suites check offline detail resolution, complete cookbook payloads, source
metadata, filtering including elapsed chilling time, additional-provider hydration,
country isolation, inventory filters, and navigation fallbacks.

A temporary React Native Web harness renders the actual Home, Search, Favorites,
Pantry, and recipe-detail components with sample data and mocked platform/auth/API
adapters. Browser checks cover phone widths, horizontal overflow, local filtering,
recipe navigation, back-button inset placement, chef collections, and the country
picker. It is a layout/interaction check, not a replacement for physical-iPhone
checks with live authentication and backend data. Expo iOS/web exports verify the
real production component imports and bundles.

No new native dependencies are required. Reload Expo to see the updated screens.
Free-beta allowances remain paused during the owner’s testing.
