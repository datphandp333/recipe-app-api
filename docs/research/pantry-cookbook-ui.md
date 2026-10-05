# Pantry and cookbook UI refresh

Researched September 30, 2026; implemented in the existing Expo screens.

## Research and decisions

[Paprika's official guide](https://www.paprikaapp.com/help/ios/) describes recording pantry quantities and expiration dates. The useful pattern for this app is an inventory that can be scanned quickly. The refreshed Pantry therefore puts inventory ahead of data entry, adds counts and date filters, and opens the ingredient form only when adding or editing. Dates are user-entered label information, not a food-safety judgment.

[Samsung Food's official recipe-box guide](https://support.samsungfood.com/hc/en-us/articles/18365507924372-Getting-Started-with-Samsung-Food-Save-Search-and-Share-Recipes) emphasizes saving, searching, and organizing recipes. For this app's existing data model, search by title, ingredient, or note plus newest/alphabetical sorting provides useful organization immediately. Custom persistent collections would require additional data and are not part of this change.

Design judgments: retain the home's cream background, deep green actions, sage panels, and restrained terracotta accents. Use recipe photography in the cookbook, text and quantity/date information in Pantry. Make primary actions clear; put destructive cookbook actions behind a labeled options control and explicit confirmation. Existing navigation and backend storage remain in use.

## Delivered

- Pantry: overview counters, all/due-soon/past-date/undated filters, accent-insensitive ingredient search, earliest-date ordering, expandable add/edit form, success messages, meal-planner entry, existing removal confirmation.
- Favorites: photo-led recipe grid, search across titles/ingredients/notes, newest/A–Z sorting, discover action, per-recipe options for view/edit, Second Serving, and confirmed removal. Distinct empty, no-match, loading, and error states.
- Repaired existing favorites API mismatches: deletion and editor saving use the backend's recipe-ID routes; the editor resolves the selected saved record from the user's existing favorites endpoint. Legacy incomplete recipes resolve through the combined local/MealDB catalog.
- Async cookbook reads are invalidated when leaving the screen or removing a recipe. Account changes remount account-specific state. Mutations block repeated submissions.

## Validation

`node --test mobile/tests/kitchenLists.test.mjs` tests calendar-date boundaries, combined filters, accent-insensitive search, ingredient formats, and sorting without mutating source arrays.

Targeted ESLint checks passed for both screens, the editor, and list utilities. A full Expo web export also passed (25 static routes). A temporary React Native Web harness with mocked Expo adapters, accounts, and API responses checks mobile/desktop rendering; Pantry search/add/edit/remove; cookbook ingredient search; editor/Second Serving navigation; and removal cancellation/confirmation. No live account records were changed by browser checks. Native device validation and live authenticated integration remain manual checks.

Follow-up verification also passed at 320px width: empty collections, no search matches, ingredient validation, API failure/retry for both screens, and loading/editing/saving a saved recipe through the actual editor with mocked backend responses. Pantry edit/removal/confirmation controls now have minimum 44px touch targets. The browser harness's focus-effect mock was corrected to match callback-based navigation lifecycle before these checks passed.
