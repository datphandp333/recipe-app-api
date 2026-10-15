# Simmerli Chef — local Rive prototype

Original vector bowl, authored and tested with the official Rive CLI 1.6.0. This is an actual RML/Rive project, not a React Native animation labeled as Rive. No paid service, account upload, or app runtime dependency has been added.

[Native-rendered preview](../../../docs/research/rive-chef-preview.png)

## Preview

The temporary CLI used in this session is:

```sh
/tmp/simmerli-rive-cli/versions/1.6.0/rive design/rive/simmerli-chef
```

Run from the repository root. A native preview opens and rebuilds on source changes. Move onto the bowl to greet it, press and hold for Thinking, release for Celebrate, and move away for Idle. These gestures demonstrate states; the production app would drive Thinking only from an actual pending request and Celebrate only after success.

The temporary executable can disappear after a reboot/cleanup. Install the official CLI using [Rive's instructions](https://rive.app/docs/cli/getting-started) to use `rive` instead. The source project stays in this repository.

## Host contract

Artboard: `SimmerliChef`. State machine: `Chef`. View model: `ChefState`, numeric property `mode`:

| Value | State | App use |
| --- | --- | --- |
| 0 | Idle, static | Resting or Reduce Motion fallback |
| 1 | Greet, one shot | Welcome or a deliberate greeting tap |
| 2 | Thinking, seamless loop | Actual pending Chef reply or meal plan |
| 3 | Celebrate, one shot | A successful save/completion |

All timelines key the same transforms so transitions reset correctly. Greet/Celebrate finish in a resting pose. A host can replay them by returning to Idle before reentering. Native preview pointer listeners are for review; remove them before embedding in the app so touching the character cannot imply a real save or AI request.

Before app integration: export/publish with the user's Rive account, retain the Free plan's required splash/branding, validate the supported React Native runtime against Expo SDK 57, rebuild the native development client, and keep the existing SVG companion as the load/error/Reduce Motion fallback. Stop playback when blurred/backgrounded. Do not replace navigation, accessible controls, or loading/error text with the character.

`build/simmerli-chef.riv` is a local unsigned prototype (about 5 KB), ignored by Git. It is not a signed, branded production export and has not been tested in the installed iPhone app. The user approved trying the free splash-branded prototype; no paid plan was purchased. [Current Rive pricing](https://rive.app/pricing).

## Validation

CLI verification: zero errors/warnings. Resolved inspection: no problems, four timelines and four states. Native renderer visually checked greeting and celebration; input simulation confirmed press writes `mode=2` and release writes `mode=3`. Build and screenshots use no scripts, stock characters, external fonts, or network assets.
