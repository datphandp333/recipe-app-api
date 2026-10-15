# Interaction motion

Project-wide design preference: apply deliberate interaction feedback to every current and future Simmerli page, including authentication, account recovery, Recipes/Home, Search, Favorites, Pantry, Profile, recipe detail/editing, Chef, Second Serving, scanning, meal planning, and membership/status. Prefer shared motion components so timing, interruption, disabled states, and Reduce Motion behavior stay consistent. Use the animation cheat sheet to choose techniques that clarify an action; do not animate every element or replace readable feedback with decoration. Success motion must follow actual success, and pending motion must follow actual pending work.

The remaining native press imports in sign-in, sign-up, password reset, provider buttons, scanning, favorite editing, Second Serving, and membership were switched to `MotionPressable` as part of the all-page pass. Provider authentication itself and third-party hosted interfaces retain their existing behavior.

Simmerli uses the existing React Native Animated API; no dependency or native rebuild is required for these changes.

- `MotionProvider` reads the operating system’s Reduce Motion preference and subscribes once to changes. Its safe default is static. Pending queries ignore unmounted components or a newer preference event.
- `MotionPressable` replaces button/card press surfaces across Home, Search, Favorites, Pantry, Profile, welcome/onboarding, Chef, meal planning, recipe details, cooking preferences, source cards, and shared auth buttons. A press springs to 97% size, then returns to normal. Actions run through the original Pressable handlers without waiting for animation. Existing styles, disabled state, roles, labels, long-press props, and press callbacks are passed through. Static opacity remains as press feedback with Reduce Motion enabled.
- `PageEntrance` gives the five main tabs a 240 ms reveal with a 6 px rise and opacity from 0.85 to 1 on focus. Onboarding remounts this presentation wrapper per step, retaining answers in its parent screen. Transforms do not change layout or safe-area measurements. Blur/unmount stops the animation and restores the fully visible state.
- `SelectionPulse` gives newly selected tab icons and successfully saved Home hearts a brief 14% pulse, then settles. It does not pulse preexisting saved state on mount. Hearts follow the existing successful-save state update, so a failed save does not animate as a success.

Reduce Motion removes scale/reveal/pulse animation and preference changes stop/reset active animations. There are no repeating idle animations, extra network calls, haptics, timers delaying navigation, or simulated loading/progress. The earlier launch animation remains separately controlled by its existing Reduce Motion handling.

## Kitchen companion and completion feedback

An original SVG bowl character greets users on welcome/onboarding and appears beside the Home Chef shortcut. Tapping the welcome character replays its greeting. Steam repeats only while a real Chef reply or meal-plan request is pending; backgrounding the app, leaving the screen, or enabling Reduce Motion stops it. No new package or paid service is used. Mobbin was skipped at the user's request because its MCP access requires a paid plan.

Pantry additions/edits and saved meal plans show a small celebration after the save succeeds. Recipe cooking progress reflects checked instruction steps, with a completion message after all steps are checked; this does not mark inventory consumed. Onboarding keeps its primary action visible beneath the scroll area on every step.

These additions passed changed-file lint and iOS/web exports. Browser checks use mocked services and cannot establish native iPhone performance or real backend save behavior.

Follow-up browser validation covered checking every cooking step, undoing completion, completion with Reduce Motion, a failed pantry save retaining its draft without celebrating, and a successful retry displaying the saved ingredient and celebration. Cooking step controls expose checkbox roles, step labels, and checked state. The error mock uses the backend's `message` field.

## Deliberate motion polish

Reference: John Kim's [AI App Animations is Hard Until You Learn This](https://www.youtube.com/watch?v=f-Ar8mwm3kQ&t=914s) and his [companion article](https://getpushtoprod.substack.com/p/making-your-app-feel-alive-with-animations). The article was accessible; video playback and the exact 15:14 segment could not be inspected. His distinction between timed geometry, responsive springs, and layout transitions informed these implementation choices:

- Cooking-step checks draw a small SVG stroke over 220 ms and settle with a restrained spring. Existing checked state is static on mount; undo immediately clears it, and rapid toggles stop the previous animation.
- Onboarding moves content 18 px from the right on Next and from the left on Back. A stationary clipped viewport prevents horizontal overflow; headers and the primary action remain stationary. The companion greets once per step, rather than replaying after every ingredient choice.
- Preferences and onboarding recipe previews use native 220 ms layout transitions and spring-driven chevrons. Web preserves immediate layout changes. Collapse does not change saved preferences or discard onboarding answers.

Reduce Motion makes these interactions static. No package, paid asset, haptic permission, artificial wait, or sensor dependency was added. Native layout behavior and feel still require physical iPhone testing.

Validation: all 47 mobile tests and active-app lint passed; iOS/web exports passed. Browser checks covered onboarding navigation/answer retention at 320/390/768 px, visible fixed primary action with Expo-style flex viewport, settled SVG check/undo, web checkbox semantics, live Reduce Motion, recipe preview open/close, and pantry save success/failure feedback. Cooking-step touch controls are now 44 points square.

## Choosing from the animation cheat sheet

Use a technique to solve an interaction, rather than adding every effect:

| Technique | Simmerli use/decision |
| --- | --- |
| Keyframes | Timed launch reveal, character greeting and brief success feedback. |
| Springs | Press/release, selected icons, disclosure chevrons. |
| Gestures | Existing touch controls; real press/release demonstration in the Rive prototype. Avoid intercepting recipe scrolling. |
| Physics | No current interaction needs momentum or collisions beyond normal native scrolling. |
| SVG paths | Cooking check draw and original vector character. |
| Layout transitions | Preferences and recipe-preview disclosure on native platforms. |
| Rive / Lottie | Actual Rive character prototype in `design/rive/simmerli-chef`; app continues using its tested SVG fallback. No Lottie dependency needed. |
| Skeletal rigs | Character parts already coordinate through a small transform hierarchy; a full bone/mesh rig is unnecessary for this bowl. |
| Flipbook / video | No current interactive task benefits; food photos stay still and readable. |
| Particles | Existing six-spark, one-shot save celebration only after success. |
| Shaders | No screen currently needs a surface effect; preserve food colors and text contrast. |

Rive was authored via its official local CLI, not computer-use clicks or a connected editor MCP. See the prototype README for tested states, review gestures, and the remaining account/export/native-runtime work. This prototype does not yet replace any app component.

Validation: changed-file lint; 13 existing onboarding/auth/navigation/kitchen-list tests; iOS and web Expo exports. Temporary browser harnesses using actual components with mocked auth/router/API adapters verified press scale/release, single action invocation, disabled buttons, selection pulse, live Reduce Motion changes, onboarding/Back/Skip/preview navigation, and the main screen layouts/navigation. The harness supplies Metro’s `global` alias for React Native Web’s Animated implementation. Physical iPhone animation smoothness and OS VoiceOver behavior still need device testing.
