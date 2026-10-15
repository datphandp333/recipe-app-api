# Simmerli private TestFlight preparation

Status: configuration prepared locally. No hosting service, Expo project, Apple app record, cloud build, or submission has been created by this work. Beta quotas and purchases remain disabled. TestFlight distribution is separate from a public App Store release.

## Confirm accounts first

1. Sign in at https://expo.dev and check whether you have an account. EAS supports a free plan; no paid Expo upgrade is required by this setup.
2. Sign in at https://developer.apple.com/account and check Membership details. A normal Apple ID or free Xcode device signing does not establish paid Apple Developer Program membership. Do not purchase anything until you decide to proceed with TestFlight.
3. Choose hosting. `render.yaml` is an optional free-instance template, with automatic deploys disabled. Free services can sleep; this is suitable for initial testing, not a promise of production availability. Existing AI/database providers may have their own usage charges.

## Resolve before inviting other testers

The Favorites routes still accept submitted account identifiers without verified session identity. They need backend Clerk authentication and matching mobile token headers before a shared backend is exposed for testing. Pantry and metered AI routes already verify sessions. This preparation does not establish that the app is ready for public launch.

## Backend

After the access-control issue is fixed and changes are reviewed/pushed to your repository:

1. Connect that repository to Render and use the root `render.yaml` Blueprint, or create a Node web service with root `Back-end`, build `npm ci`, start `npm start`, and health path `/api/health`.
2. Enter backend secrets in the host's environment settings using `Back-end/.env.example` as the key list. Never put backend secrets in Expo variables. Use a separate test database or a reviewed database backup before schema operations.
3. Provision all database tables from the repository's Drizzle schema using a reviewed migration plan. `npm run setup:beta` adds only membership tables/functions to an existing database; it does not initialize the entire application schema. Do not blindly replay historical migrations against an existing database.
4. Keep `BETA_LIMITS_ENABLED=false` and `ENABLE_KEEP_ALIVE=false`. The old self-ping is opt-in and is not needed for deployment.
5. Verify `https://YOUR_HOST/api/health`, then authenticated pantry, favorites, scan, Chef, and meal-plan operations using the same Clerk instance configured in the app. A passing health endpoint alone does not verify the database or sign-in.

## iPhone TestFlight

Run these from `mobile` after confirming the accounts:

```sh
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest init
```

`init` links an Expo project and writes its project ID. Keep bundle ID `com.datphandp333.simmerli` unless the Apple account shows it belongs to another app/team. Configure the EAS **production** environment in the Expo dashboard with:

- `EXPO_PUBLIC_API_URL=https://YOUR_HOST/api` (include `/api`; no localhost or Wi-Fi IP).
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` matching the backend Clerk instance.
- Existing public OAuth settings only for providers actually configured in Clerk and Apple/Google.
- `EXPO_PUBLIC_BETA_ENABLED=false` (also set by the production build profile).

These variables are embedded in the app and are public. Confirm sign-in configuration, including provider callbacks and native URL schemes, before building. Use production Clerk configuration for a public launch; keep any test Clerk instance restricted to private testing.

```sh
npx eas-cli@latest build --platform ios --profile production
```

This creates a store distribution build with an incremented iOS build number. Follow EAS prompts for the correct Apple team and signing credentials. After reviewing the successful build, submit that exact build:

```sh
npx eas-cli@latest submit --platform ios --profile production --id YOUR_BUILD_ID
```

Select/create the matching App Store Connect app when prompted. Answer Apple's export-compliance questions accurately. Add yourself as an internal tester in App Store Connect and install through TestFlight. External testing may require Apple's beta review. No Metro process should be needed by this build.

Test sign-in, cold launch, saved content, photo permissions, Chef, meal planning, navigation/safe areas, and logout on a physical iPhone over cellular as well as Wi-Fi. Keep public release and subscriptions disabled while testing.

References: [Expo build setup](https://docs.expo.dev/build/setup/), [TestFlight submission](https://docs.expo.dev/submit/testflight/), [Render Node deployment](https://render.com/docs/deploy-node-express-app), [Render Blueprint specification](https://render.com/docs/blueprint-spec).
