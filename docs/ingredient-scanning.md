# Ingredient photo scanning

Branch: `feature/ingredient-scanning`.

## Try it

1. Start the backend from `Back-end` with `npm run dev`.
2. Restart Expo from `mobile` with `npx expo start -c --port 8087` after installing dependencies.
3. Sign in, open Pantry, and tap **Stock your pantry with a photo**.
4. Take or choose a photo. In the iOS Simulator, use **Choose photo** (drag an image into the simulator's Photos app first).
5. Tap **Analyze photo** to send the resized image for recognition. Correct names, deselect incorrect guesses, and enter quantities/units.
6. Add selected items to Pantry, or open Chef with an editable draft. The Chef message is not sent automatically.

The backend needs `GEMINI_API_KEY`, `GEMINI_MODEL`, the database configuration already used by Pantry, and `CLERK_SECRET_KEY` or `CLERK_JWT_KEY`. No new secrets belong in the mobile app. Native development/production builds must be rebuilt to include the image-picker permission configuration; Expo Go uses its own permission descriptions.

## Behavior and limits

- The client uses Expo's camera/system photo picker and converts the selected image to JPEG with its longest edge at most 1280px. Uploads are capped at 3 MiB decoded / 4 MiB base64.
- `POST /api/pantry/scan` uses existing Pantry authentication and sends inline image content to the configured Gemini model. There is a 45-second upstream timeout, one active scan per account, and at most ten concurrent scans per backend process. These are concurrency controls, not a distributed quota system.
- A scan returns at most 30 deduplicated names and uncertainty flags. It never inserts Pantry rows. Quantities and expiration dates are not inferred. This is ingredient recognition, not calorie estimation or a food-safety assessment.
- Users supply quantities before saving. Existing Pantry validation and ownership rules apply. Rows confirmed saved cannot be submitted again in that review. If a save response is lost or fails, the row is marked **Check Pantry before retrying** and is not automatically retried; earlier successful rows remain saved.
- Photos are not written to the app database or logged by this implementation. A resized image is sent to Google on **Analyze photo**. Google processing follows the project's Gemini service terms. Expo may retain temporary local image cache files; this is not a claim of immediate deletion from all devices/providers.
- Review data is kept only while this screen is mounted. Starting over or leaving the screen discards that review. Unrecognized or ambiguous food should be entered manually or corrected by the user.

## Verification

```sh
node --test mobile/tests/ingredientScan.test.mjs Back-end/src/services/ingredientScan.test.js Back-end/src/routes/pantryRoutes.test.js
```

Tests cover image limits/signatures, authentication, concurrency, malformed/upstream errors, deduplication, user-entered quantities, partial-save retry exclusion, and Chef drafts. Targeted ESLint checks cover the scanner, review helpers, and Pantry entry. Web and iOS JS bundle exports check native imports and routing. Live camera permissions, photo recognition quality, and live authenticated saving require manual device testing; test suites use mocked providers and database adapters.

References: [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding).
