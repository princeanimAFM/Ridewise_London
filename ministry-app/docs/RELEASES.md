# The AFM HUB: Android releases

## Current builds (with automatic over-the-air updates)

These builds include `expo-updates`, so screen and content changes published with
`eas update` reach installed apps without a reinstall. Built from commit `acd3095`.

| Use | Build | File |
|---|---|---|
| **Google Play** (upload this) | [609d0a24](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/609d0a24-ab8a-4263-830c-02660db81d1d) | [app bundle (.aab)](https://expo.dev/artifacts/eas/c0EbjtcnIBSkhetGwn5TotovG_3GRmcq8yft04F-vmY.aab) |
| Testing on a phone | [a587ece8](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a587ece8-6cde-4a0e-bc43-724d46022db2) | [APK](https://expo.dev/artifacts/eas/FlZMdhxYl3FlvIlUtSLsGAIY49J8O3R80rIwtYh0nyg.apk) |

Latest over-the-air update (production and preview channels): service times,
AFM Center address, and Share App / privacy links on theafmchurch.org (commit `bc70ff2`).

Privacy policy for the Play listing: https://theafmchurch.org/privacy.html

## Older builds (no automatic updates, retire after Play Store launch)

- Test APK 695e8c08: the one linked from the launch flyers and QR codes
- Play bundle 97413c3b (version code 5): superseded by 609d0a24

## Before uploading to Google Play

Google Play signs apps with its own key by default, so the Play version will not
install over an APK people downloaded directly; they would have to uninstall first.
To let Play updates install over the existing APK instead:

1. In Play Console, when creating the app, choose to **use your own app signing key**
   (not "Google-generated").
2. Export the key EAS used for these builds: `npx eas-cli@latest credentials`
   → Android → production → Keystore → Download.
3. Upload that keystore to Play Console as the app signing key.

If you skip this, tell existing users to uninstall the APK and install from Play.

## On launch day

- Replace the APK link on theafmchurch.org, in the flyers and in the QR codes with
  the Google Play link.
- Set `playStoreUrl` in `src/content/ministry.ts` so the website shows
  "Get it on Google Play", then publish an over-the-air update.
