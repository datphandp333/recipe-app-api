# Simmerli launch and welcome

The app root renders `LaunchGate` once per root mount (cold launch or full JavaScript reload). It reveals the existing steam-and-bowl SVG mark with a short fade, rise, and scale, then reveals the editorial wordmark and tagline. The combined introduction is about 1.1 seconds, followed by a 220 ms fade to the underlying app. It does not loop or replay when changing tabs, returning from a recipe, or signing out.

The native splash is held at module initialization and hidden when the launch view lays out. Native and JavaScript backgrounds use ivory `#FBF7EF`. Native configuration changes require rebuilding the app; the updated welcome and JavaScript animation work through Metro on the existing development build.

Clerk still determines access through the existing `accessState` function. Signed-out sessions enter the auth navigator, whose initial route is Welcome. Active sessions go directly to their authenticated route after the intro. Accounts with outstanding tasks retain the existing completion flow. The launch layer does not redirect the router, so explicit sign-in, verification, recipe, and callback links are preserved. The navigator is mounted beneath the overlay as soon as auth is loaded. If auth takes longer than the intro, a short loading message remains until it is ready; no animation loops or artificial timeout signs the user out.

Reduce Motion removes motion and the minimum display delay. Underlying content is not interactive or accessible while covered. Animated sequences stop on unmount, and asynchronous accessibility queries ignore unmounted results.

The new welcome screen uses an existing bundled vegetable-paella serving photograph, shared logo mark, editorial type, and ivory/green palette. It describes discovery, pantry, and Chef, then enters a two-question discovery flow before existing sign-up and sign-in screens. Social authentication remains available on those screens. The page scrolls for smaller screens and larger text; no onboarding-completion flag or new native dependency was introduced.

Validation: changed-file ESLint; six existing auth/navigation tests; iOS and web Expo exports. A local browser harness rendering the actual LaunchGate and Welcome components with mocked router/auth adapters checked the readiness gate, splash handoff callback, sign-up/sign-in targets, Reduce Motion, and 320/390/768 px layouts without horizontal overflow. It does not replace a physical-device check of the operating-system splash or a real Clerk deep-link round trip.

To test the JavaScript experience, reload Expo. A signed-in tester sees the animation and then their authenticated page; sign out to see Welcome. To include the matching native background in an iPhone development build:

```sh
cd mobile
npx expo run:ios --device
```


## Interactive onboarding

The welcome action “Find my first dish” opens `/(auth)/onboarding`. The pattern adapts Tide’s two-question recommendations and Duolingo’s pre-sign-up product experience discussed in the [Mobbin video](https://www.youtube.com/watch?v=Qsq-Sj_rojU); the accessible [caption transcript](https://youtube2text.diguardia.org/v/i-studied-1-460-onboarding-flows-here-s-what-i-found-Qsq-Sj_rojU) was used because direct video retrieval was unavailable. Tide appears around 2:52 and Duolingo around 5:41. The user’s linked 5:07 section discusses paywalls; Simmerli’s current private testing flow has no purchases.

1. Choose faster dinners, using familiar ingredients, or exploring different places.
2. Select common ingredients, or choose Surprise me.
3. See up to three real bundled recipe recommendations, expand full ingredients/instructions and adaptation/source/photo notes, then create an account. The account button stays visible beneath the results scroll area.

`services/onboarding.js` ranks local recipes. Quick mode uses complete elapsed time and enforces 30 minutes or less. World mode chooses different countries when available. Ingredient matching distinguishes actual rice/fish/chicken from rice vinegar, fish sauce, and chicken stock. Picks disclose that additional ingredients may be needed; these suggestions are not a pantry sufficiency, allergy, or dietary safety check.

No account is needed to read these bundled previews. Answers are in-memory choices for this preview, retained while navigating Back within the flow; they do not automatically create pantry inventory, persist cooking preferences, or personalize the post-sign-up home collection. No AI calls, token allowance consumption, simulated preparation delay, purchase screen, or analytics event were added.

Skip opens existing sign-up; existing users can sign in on every step. Native/ARIA selected and expanded states support accessible choices and previews. The launch animation remains once per cold start; signed-in sessions bypass onboarding.

Validation: four recommendation tests plus six existing auth/navigation tests passed; changed-file ESLint and iOS/web exports passed. Browser checks using the actual components with mocked auth/router adapters covered welcome entry, required goal, optional ingredients, Back/answer retention, three readable recipe previews, Skip/sign-up/sign-in, Surprise me, and 320/390/768 px widths. Real Clerk round trips and physical-device checks remain outside the harness.
