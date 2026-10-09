# Simmerli authentication setup

## Current development choice: Google first

Apple enrollment is deferred. Keep `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=false`; the dynamic Expo config also disables the Apple plugin and entitlement. Google is enabled in the local environment for **web testing** with the existing Clerk development connection and shared credentials:

```bash
cd mobile
npx expo start --web -c --port 8087
```

Native iPhone Google login still needs the Google Web/iOS client IDs described in step 3 and a development build. It is hidden in Expo Go and when client IDs are missing. The web flag alone does not enable native login. Apple setup below can be completed later. Rebuild any existing native app to remove an Apple entitlement that was previously included.

## What is implemented

The welcome screen and all email account screens use Simmerli's white/green branding. The app icon and splash use the scalable steam-and-bowl mark in `mobile/assets/images/simmerli-mark.svg`. A central Expo Router protected stack gates every app route on a loaded, active Clerk session with no outstanding task. Sign-out removes the protected navigation history. Existing Clerk user IDs, token cache, API URLs, and backend data are retained.

Social providers are **off by default**, so unconfigured login buttons never appear. iOS development builds use Clerk's native Apple/Google hooks; web uses Clerk's browser redirect flow. Expo Go and Android retain email login. Native flows that require additional fields or verification offer a secure Clerk Account Portal continuation (which can ask the user to sign in again). Pending session tasks stay outside the protected app until completed. Hosted continuation is not available in Expo Go.

The code does not configure your provider dashboards. Real-device social authentication remains unverified until the steps below are completed. Do not treat a passing bundle or unit test as an end-to-end login test.

## 1. Register the native application

Default bundle identifier: **com.datphandp333.simmerli** in `mobile/app.json`. Check availability in your Apple Developer account and register it there. If you already have an identifier, replace this value before creating credentials. Keep the same identifier in Apple, Clerk, Google, and all builds. The existing Expo slug and `clerkexpo` scheme are retained to avoid unnecessarily changing project links. Display name is now **Simmerli**.

In Apple Developer, enable **Sign in with Apple** for the App ID. In Clerk Dashboard → Native applications, add your iOS application with your Apple Team ID and bundle identifier. Keep your existing Clerk instance so current recipes and pantry ownership remain attached to the same users.

Allow the mobile redirect `clerkexpo://hosted-auth-callback` in Clerk's native redirect configuration. This is used only for completing account requirements through the Account Portal. Configure Account Portal sign-in/sign-up and tasks for the instance; test an account with required MFA or other tasks.

## 2. Enable Apple

In Clerk Dashboard → SSO connections → Add connection → For all users → Apple, enable sign-up and sign-in. Native Apple requires the registered application above. For browser Apple sign-in and the Account Portal fallback, configure Apple's **Services ID, key, Team ID, and Key ID** in Clerk, with Apple's permitted domains and return URL copied exactly from Clerk. Keep the private `.p8` key out of the repo and mobile environment.

Configure Apple Private Email Relay email sources so Clerk verification messages reach Hide My Email users.

After setup, add to `mobile/.env`:

```dotenv
EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true
```

Reference: https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-apple

## 3. Enable Google

In Google Cloud Console, configure the OAuth consent screen (including test users while in testing), then create:

- A **Web application OAuth client**, with the authorized redirect URI shown by the Clerk Google connection. Put this client ID and secret in Clerk's Google connection.
- An **iOS OAuth client**, using `com.datphandp333.simmerli` (or your registered replacement bundle ID).

Add public values to `mobile/.env`:

```dotenv
EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED=true
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.YOUR_IOS_CLIENT_ID
```

For the URL scheme, use the iOS client ID prefix before `.apps.googleusercontent.com`. No Google client secret belongs in the app. `app.config.js` copies only these public identifiers and provider flags into Expo's `extra`, so the native hook can read them in release builds too. Set those same values in the selected EAS environment before cloud builds; your ignored local `.env` is not a deployment configuration.

Reference: https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-google

## 4. Build and run

After changing provider credentials/plugins, rebuild the native app (a Metro reload is not enough):

```bash
cd /Users/datphan/recipe-app-api-1/mobile
npx expo run:ios --device
```

Xcode will need your Apple signing team. The Clerk native plugin requires iOS 17 or newer. Alternatively, configure EAS for your account and run:

```bash
npx eas-cli build --profile development --platform ios
npx expo start --dev-client -c --port 8087
```

Open the **Simmerli development build**, not Expo Go. For email-only testing in Expo Go:

```bash
npx expo start --go -c --port 8087
```

Web: use `npx expo start --web`, configure the local and production origins in Clerk/Google as required, and ensure the web host serves `/sso-callback` and `/complete-account`. Provider return URI in Google/Apple points to Clerk, while Clerk redirects the browser back to `/sso-callback` in Simmerli.

## Acceptance checklist

- Signed-out launch shows Welcome; protected URLs never display private content before Clerk finishes loading.
- Email signup → correct/incorrect code → sign-in; resend, password reset, and MFA work.
- Google/Apple: new account, returning account, canceled prompt, offline failure, retry; test on a physical iPhone.
- Apple Hide My Email receives verification messages; account linking follows Clerk's verified account rules (no app-side email merges).
- Additional profile fields, required MFA setup, and pending session tasks can be completed through Clerk; canceling keeps the app locked.
- A restored active session opens Recipes. Sign-out and the back button cannot restore protected screens.
- Existing users see their original favorites and pantry after email/social login linked by Clerk.
- Small iPhone and large-text layouts scroll; input and submit buttons remain reachable with the keyboard open.
- Missing credentials and Expo Go hide unsupported providers. Configured web social login survives redirects and completes requirements.

Automated checks:

```bash
node --test mobile/tests/*.test.mjs
cd mobile
npx eslint 'app/(auth)' app/_layout.jsx app/account-tasks.jsx components/auth services/authFlow.js app.config.js
npx expo export --platform web
npx expo export --platform ios
```

Native auth callbacks and provider-dashboard setup must still be validated on device; do not store credentials or session tokens in screenshots/logs.
