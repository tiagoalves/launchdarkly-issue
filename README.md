# About

This is a simple repo to reproduce an unexpected LaunchDarkly issue in React Native.

## Problem description

Using the latest `@launchdarkly/react-native-client-sdk`, the `on('change', ...)` event handler is firing unrelated to `identify()` calls for older context updates.

This is an example sequence:

* Call to `identify({ user: { ... } })`
* `'change'` event is triggered with the correct variants for the previous `identify()` call (eg `mica-banner: false`).
* Call to `identify({ user: { ... }, network: { country: "Portugal" } })`
* `'change'` event is triggered again, now with the correct variants for the previous `identify()` call (eg `mica-banner: true`).
* `'change'` event is unexpectedly triggered again, but now with the variants of the first `identify()` call, thus reverting the previous correct feature flag state (eg `mica-banner: false`).
* `'change'` event is unexpectedly triggered once again, now with the variants of the second `identify()` call, fixing the flag state again (eg `mica-banner: true`).

This behaviour varies. Sometimes `'change'` is only triggered twice, as expected. Sometimes it's 3 times, sometimes 4 and even more.

In summary, we can't trust our feature flags to evaluate to the expected final variant.

## Reproduce

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY=mob-.... npx expo start
   ```

In the output, you'll see `LdTest ...`  messages showing what's going on.

## How to copy the custom-dependency-free reproduction code to a clean Expo project

1. Create a new Expo project: `npx create-expo-app@latest`
2. Copy the `FeatureFlagTest/` folder of this repo to your new project
3. Instance the reproduction component `<FeatureFlagTest />` ([Example in this repo](app/_layout.tsx#L36))
4. `npm i`
5. `npm i @launchdarkly/react-native-client-sdk@latest`

To run it in dev mode where the issue is reproducible:

      EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY=mob-.... npx expo start

To run it in prod mode where the issue is NOT reproducible:

      EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY=mob-.... npx expo run:ios --configuration Release
