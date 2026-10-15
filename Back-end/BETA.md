# Free Simmerli beta

## Current state: private app testing

Beta limits are paused while the owner tests the app. Set `BETA_LIMITS_ENABLED=false`
in `Back-end/.env` and `EXPO_PUBLIC_BETA_ENABLED=false` in `mobile/.env`.
Development defaults to disabled limits; production defaults to enabled limits unless
explicitly overridden. During testing, authenticated AI calls skip allowance checks
and do not change beta usage counts. Beta usage is hidden from the account menu,
and direct visits to that screen show a testing message without loading usage.

To enable the free beta later, set both switches to `true`, restart the backend and
Expo, and use the beta policy documented below. Existing usage records are preserved.
The following allowances apply only while beta limits are enabled.

Simmerli is free during beta. There are no purchases, subscriptions, payment details,
RevenueCat SDK, or automatically renewing trials in this release. Plus remains a
future feature; monthly/annual pricing is not displayed or collected.

Every verified Clerk account gets these allowances each month:

| AI feature | Monthly allowance |
| --- | ---: |
| Chef chat | 20 messages |
| Create or adapt recipes (including Second Serving) | 5 recipes |
| Ingredient photo scans | 2 scans |
| Generate three-dinner meal plans | 1 plan |

Browsing, favorites, saved content, manual pantry edits, and reading/saving/completing
an existing plan remain free. Counts reset on the UTC monthly anniversary of the
account's first beta request or usage-screen visit. Short months clamp to their final
day, without shifting later anniversaries. Unused counts do not roll over.
Existing accounts receive a fresh allowance; pre-beta activity is not counted.

## Setup

Use the existing backend `DATABASE_URL`, `CLERK_SECRET_KEY` (or `CLERK_JWT_KEY`), and
`CLERK_AUTHORIZED_PARTIES` from [PANTRY.md](PANTRY.md). The frontend and backend must
use the same Clerk application. Never put server keys in `EXPO_PUBLIC_` variables.

From `Back-end`:

```sh
npm install
npm run setup:beta
npm run dev
```

`setup:beta` atomically installs only the additive beta tables and functions. It
supports existing databases provisioned with `drizzle-kit push`, refuses partial
setup, and makes no changes if the beta schema is already present. It does not
alter favorites, pantry data, or the historical Drizzle migration journal.

For a database already managed exclusively with Drizzle migrations, instead use
`npx drizzle-kit migrate` to apply `0007_beta_usage.sql` through the normal journal.
Choose one migration path; do not run `migrate` on a push/setup-managed database
without reconciling its migration history first.

Restart the backend after setup. Reload Expo with `r`; no additional native modules
were added for beta usage, so this feature does not require an iPhone rebuild.
On Recipes, open the account icon, then **Beta usage**. A quota alert links to the
same screen and can be dismissed without losing the user's draft or selected photo.
No purchase or upgrade screen is shown on any platform.

## API and accounting

`GET /api/membership` requires a Clerk bearer session and returns `plan: "beta"`,
`purchasesEnabled: false`, `resetsAt`, and `allowances` keyed by `chat`, `recipes`,
`scans`, and `plans`. Each allowance includes `limit`, `used`, `reserved`, and
`remaining`. Only the verified account is queried.

AI recipe POSTs, pantry scan, and meal-plan draft generation require both the
session and a 16–100 character `X-Request-Id` containing letters, digits, `_`, or `-`.
Old clients without tokens or retry identifiers must update. Health checks and
ordinary free operations do not require an AI request identifier.

PostgreSQL locks the account when reserving and settling requests, so limits apply
across API processes. Finalization reserves both chat and recipe availability,
then charges only the actual result: a recipe creation or a clarification message.
Failed responses release reservations; disconnects abort upstream AI calls.
Abandoned reservations expire after 180 seconds. Cached successful responses are
replayed for retries without charging again; request IDs are scoped by account and
bound to a SHA-256 hash of the request path and body. Completed/released IDs cannot
be reused for a different action. The client keeps identifiers for uncertain/network
failures; explicit failures permit a fresh attempt.

Errors:

- `401`: missing or expired account session.
- `400 request_id_required`: update an old client.
- `403 quota_exceeded`: includes `feature` and `resetsAt`; no AI provider call.
- `409 request_pending`: retry that same request later.
- `409 request_released/conflict/expired`: make a new attempt with a new ID.
- `503 allowance_unavailable`: allowance validation or result confirmation failed;
  retry the same ID because a database commit may have succeeded.

Successful AI output is cached in the database for retry receipts. Raw input chat
and photos are not stored in this ledger. Output can contain personal information
from a conversation, so treat the ledger like other user data. Receipt output is
cleared after 24 hours on later reservations and an hourly backend cleanup job
(up to one hour of delay while the server is running). ID/hash tombstones and
aggregate usage remain to prevent duplicate charging.

## Cost monitoring and validation

Provider calls log model, feature, token counts, request ID, and estimated USD cost;
no prompts, photos, or generated output are logged by the usage logger. To calculate
estimates set `AI_INPUT_USD_PER_MILLION` and `AI_OUTPUT_USD_PER_MILLION` to the current
prices for the configured Gemini model. Without prices, estimates are `null`.
Quota rejections log feature only. These counts protect per-account usage, not an
application-wide spending cap. Monitor total AI and hosting costs during beta.

```sh
npm run test:beta
node --test src/routes/pantryRoutes.test.js src/routes/mealPlanRoutes.test.js src/services/ingredientScan.test.js src/services/mealPlanService.test.js
```

SQL tests use an isolated in-memory PostgreSQL engine; they never need a live
`DATABASE_URL`. From `mobile`, run `node --test tests/betaClient.test.mjs`.

Physical-device checks: sign in, view the four counts, send a chat, create a recipe,
scan ingredients, and generate a meal plan. Reopen usage to check counts. Exhaust an
allowance in an isolated test account and confirm the reset alert preserves the
chat draft/photo/planner settings, then dismiss it and browse saved recipes. Switch
accounts and confirm isolation. Test backend outages and lost-response retries.

Before enabling Plus later, add verified Apple/RevenueCat entitlements, product setup,
purchase/restore flows, subscription lifecycle tests, and the separate paid limits.
Keep the beta and starter/monthly paid policies distinct; do not silently introduce
billing or migrate beta users into an automatically renewing trial.
