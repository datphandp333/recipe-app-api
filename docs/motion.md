# Interaction motion

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

Validation: changed-file lint; 13 existing onboarding/auth/navigation/kitchen-list tests; iOS and web Expo exports. Temporary browser harnesses using actual components with mocked auth/router/API adapters verified press scale/release, single action invocation, disabled buttons, selection pulse, live Reduce Motion changes, onboarding/Back/Skip/preview navigation, and the main screen layouts/navigation. The harness supplies Metro’s `global` alias for React Native Web’s Animated implementation. Physical iPhone animation smoothness and OS VoiceOver behavior still need device testing.
