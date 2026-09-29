# Pantry setup

The Pantry tab supports adding, editing and removing ingredients, fractional quantities,
units, optional expiry dates, and expiry-first sorting. Records belong to the verified
Clerk session, not a user ID supplied by the client.

From `Back-end`, install dependencies with `npm ci`. Create `Back-end/.env` with:

```dotenv
DATABASE_URL=your_postgres_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
# Comma-separated frontend origins; set these to your actual web origins.
CLERK_AUTHORIZED_PARTIES=http://localhost:8081
```

Alternatively, set `CLERK_JWT_KEY` to your Clerk PEM public key for offline token
verification. See [Clerk token verification](https://clerk.com/docs/reference/backend/verify-token).
Use the same Clerk application as the mobile frontend. Never place the secret key in
an `EXPO_PUBLIC_` variable. Include every intended frontend origin in the allowlist.

Apply migrations to your configured development database, then start the API:

```sh
npx drizzle-kit migrate
npm run dev
```

Migration `0003_add_pantry.sql` only creates the pantry table. If your database was
previously managed with `drizzle-kit push`, reconcile its migration history before
using `migrate`; do not replay existing table-creation migrations on that database.

Run the frontend from `mobile` with `npm start`. On a physical device, configure
`EXPO_PUBLIC_API_URL` with the reachable backend address. Web currently uses
`http://localhost:5001/api` in the existing API configuration.

Validation and API tests (no live database or credentials required):

```sh
node --test src/services/pantryValidation.test.js src/routes/pantryRoutes.test.js
```

Manual smoke test: sign in, add spinach with a fractional quantity and expiry date,
refresh, edit it, cancel a removal, then confirm removal. Sign into another account
and check that its pantry is separate. Stop the API and check the error/retry state.

## Three-dinner planner

Set `GEMINI_API_KEY` in the backend environment and apply `0004_add_meal_plans.sql`
through the migration command above. In Pantry, tap **Plan dinners**, choose
servings (1–8) and a maximum cooking time (15–120 minutes), then generate a draft.
Review the three recipes and combined grocery list, then choose **Save plan &
grocery list**. The latest ten saved plans are available on the planner screen.

The backend loads only the signed-in user's pantry and sends ingredient names,
quantities, units, and expiry dates to the configured Gemini service for planning.
Generation uses API quota. Invalid model output gets one repair attempt, with a
90-second timeout across both attempts. A per-user in-process guard prevents
simultaneous generation requests; it is not a distributed quota system.

Application code allocates stock across all three meals, consumes earliest-expiring
batches first, excludes stock expired by each meal date, and calculates shortages.
Mass (g/kg), metric volume (ml/l), and kitchen measures (tsp/tbsp/cups) are converted
within their groups. Mass-to-volume conversions and ingredient synonyms are not
guessed; review any unmatched ingredients before shopping. Quantities are totals
for all requested servings. Model cooking-time estimates are checked numerically,
not measured in a kitchen.

Saving checks that the pantry snapshot and starting date still match. It does not
reserve or deduct stock, so independently saved plans may reuse the same pantry.
Saved grocery lists persist; shopping checkmarks are local to the open screen.
Drafts are stored server-side, but are not included in the saved-plan list.

Run all pantry and planner tests:

```sh
node --test src/services/pantryValidation.test.js src/routes/pantryRoutes.test.js src/services/mealPlanService.test.js src/routes/mealPlanRoutes.test.js
```

Planner smoke test: add unexpired spinach, 500 g chicken, and rice. Generate a plan
and confirm spinach is in dinner one. Verify chicken allocated from the pantry
across all dinners never exceeds 500 g, and any additional chicken is on the grocery
list. Save, reload, and reopen the saved plan. Generate another draft, edit the pantry
in another tab, then try saving: the server should ask you to generate a fresh plan.

## Mark a dinner cooked

Migration `0005_meal_completion.sql` adds completion history and an atomic PostgreSQL
function. Open a saved plan and choose **I cooked this**. Review current pantry
quantities, adjust actual usage (0 means none), add optional feedback, and choose
**Confirm usage & mark cooked**. Cancel makes no changes.

Only pantry items originally allocated to that dinner can be deducted. Grocery
purchases and substitute ingredients are not automatically deducted. A missing or
renamed pantry item defaults to zero. Exhausted pantry rows are removed. If stock
changes before confirmation, the operation rejects insufficient amounts without
partial deductions; cancel and reopen the form to refresh it.

The database locks the saved plan and affected pantry rows, then deducts inventory
and stores the completion receipt in one transaction. Repeated confirmations return
the original receipt without deducting again. There is no undo-completion action;
pantry quantities can still be edited manually. Feedback is stored and displayed
with the meal. Use **Remember this feedback** to review it as a cooking preference.

Tests:

```sh
node --test src/services/mealCompletionService.test.js
# Optional database test: uses temporary tables and synthetic fixtures only.
RUN_DATABASE_TESTS=1 node --test src/services/mealCompletion.database.test.js
```

Manual check: save a dinner allocating 300 g of 500 g chicken, select **I cooked
this**, adjust usage to 250 g, and confirm. Pantry should show 250 g remaining.
Refresh the saved plan: it should still show Cooked and the saved feedback. Verify
canceling the form leaves inventory unchanged, and a failed excessive deduction
leaves both the pantry and completion history unchanged.

## Preference memory

Migration `0006_cooking_preferences.sql` adds a per-account preferences table.
The planner's **Cooking preferences** form stores household size, spice level,
disliked ingredients, and cooking notes. Household size becomes the default serving
count; users can override servings for an individual plan. **Reset form to defaults**
followed by **Save preferences** clears the remembered values.

Saved preferences are loaded by the backend for every generation and sent to Gemini
with the pantry. Client-supplied preference snapshots are not trusted. Disliked pantry
items are excluded from expiry prioritization. Ingredient names in generated recipes
are checked against dislike phrases and simple plurals; matching recipes trigger the
existing bounded retry. This is a taste-preference filter, not allergy detection or
comprehensive ingredient/synonym analysis. Spice and free-text notes are model guidance.

Drafts contain the preferences used for generation. Changing preferences requires
regenerating an unsaved draft before saving it. Existing saved plans keep their original
recipes and preference snapshot. Clearing memory does not delete historical snapshots
or meal feedback.

Feedback is never silently converted into a lasting preference. On a cooked meal,
choose **Remember this feedback**, then **Add to notes for review**, edit the notes,
and **Save preferences**. Only the explicitly saved notes are used in future generation.

Test: save household size 4, mild spice, mushrooms as a dislike, and a one-pot note.
Reload the planner and confirm persistence and 4 default servings. Generate a plan
and inspect its preferences summary and ingredients. Change a preference before
saving a draft and verify the server asks for a new plan. Sign into another account
to check separation. Validation and personalization tests use mocked Gemini output:

```sh
node --test src/services/cookingPreferences.test.js src/routes/mealPlanRoutes.test.js
```
