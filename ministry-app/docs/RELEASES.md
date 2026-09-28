# The AFM HUB: Android releases

## Current builds (with automatic over-the-air updates)

These builds include `expo-updates`, so screen and content changes published with
`eas update` reach installed apps without a reinstall. Built from commit `acd3095`.

| Use | Build | File |
|---|---|---|
| **Google Play, version code 7** (Firebase, announcement notifications) | [5973bbd9](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/5973bbd9-770e-4fba-8ce6-5ee1ffacd0ee) | [app bundle (.aab)](https://expo.dev/artifacts/eas/Qa-dAAq4QDMRJ1qataAgmcqWMTfC2l5Z5Ve1fHuf5cE.aab) |
| Google Play, version code 6 (in closed testing) | [609d0a24](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/609d0a24-ab8a-4263-830c-02660db81d1d) | [app bundle (.aab)](https://expo.dev/artifacts/eas/c0EbjtcnIBSkhetGwn5TotovG_3GRmcq8yft04F-vmY.aab) |
| Testing on a phone | [a587ece8](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a587ece8-6cde-4a0e-bc43-724d46022db2) | [APK](https://expo.dev/artifacts/eas/FlZMdhxYl3FlvIlUtSLsGAIY49J8O3R80rIwtYh0nyg.apk) |

Latest over-the-air update (production and preview channels): service times,
AFM Center address, and Share App / privacy links on theafmchurch.org (commit `bc70ff2`).

Privacy policy for the Play listing: https://theafmchurch.org/privacy.html

## Older builds (no automatic updates, retire after Play Store launch)

- Test APK 695e8c08: the one linked from the launch flyers and QR codes
- Play bundle 97413c3b (version code 5): superseded by 609d0a24

## Google Play setup (done 28 September 2026)

- **App signing:** Play Console uses the app's own EAS keystore as the app signing key
  (uploaded via "Export and upload a key from Java keystore"; certificate SHA-256
  `53:AC:E5:85:39:83:3F:80:2B:A3:F8:54:F3:4F:4B:6C:E0:48:18:C2:87:EA:C3:FB:46:E8:21:33:D7:59:59:99`).
  This is the same key that signed the flyer APK and the test APKs, so the Play version
  installs over them as an update. **Never replace or regenerate the Android keystore in EAS.**
- **Closed testing:** track "Church testers", email list "AFM Church testers", all countries.
  Release 6 (1.0.0) sent for review on 28 September 2026. Production access needs
  12+ testers opted in for 14 days in a row.
- **Reviewer login** (App content → Sign in details): afmhub.review@gmail.com, a normal member account.
- **Store listing text and images:** `store/LISTING.md` and `store/`.

## On launch day

- Replace the APK link on theafmchurch.org, in the flyers and in the QR codes with
  the Google Play link.
- Set `playStoreUrl` in `src/content/ministry.ts` so the website shows
  "Get it on Google Play", then publish an over-the-air update.
