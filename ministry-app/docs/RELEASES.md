# The AFM HUB: Android releases

## Current builds (with automatic over-the-air updates)

These builds include `expo-updates`, so screen and content changes published with
`eas update` reach installed apps without a reinstall. Version 8 builds are from commit `96aed90`; version 7 from `acd3095`.

| Use | Build | File |
|---|---|---|
| **Google Play, version code 8** (R8 code shrinking, SDK 57 patches; hold for production launch) | [a4ee46e3](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a4ee46e3-142c-4d13-a4ea-20297af9ae0b) | [app bundle (.aab)](https://expo.dev/artifacts/eas/5dwPiJyfaeozfQaxELxJlffoZy97mGNJKpDLKTWguY8.aab) |
| Test APK for version 8 (same code, preview channel) | [c9d3368a](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/c9d3368a-8e1e-411d-a763-cb4daa40309f) | [APK](https://expo.dev/artifacts/eas/1i1V_GzMahNKCRNn8a_MwtbjWCc51cIU3TAwJACXBw0.apk) |
| **Google Play, version code 7** (Firebase, announcement notifications) | [5973bbd9](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/5973bbd9-770e-4fba-8ce6-5ee1ffacd0ee) | [app bundle (.aab)](https://expo.dev/artifacts/eas/Qa-dAAq4QDMRJ1qataAgmcqWMTfC2l5Z5Ve1fHuf5cE.aab) |
| Google Play, version code 6 (in closed testing) | [609d0a24](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/609d0a24-ab8a-4263-830c-02660db81d1d) | [app bundle (.aab)](https://expo.dev/artifacts/eas/c0EbjtcnIBSkhetGwn5TotovG_3GRmcq8yft04F-vmY.aab) |
| Testing on a phone | [a587ece8](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a587ece8-6cde-4a0e-bc43-724d46022db2) | [APK](https://expo.dev/artifacts/eas/FlZMdhxYl3FlvIlUtSLsGAIY49J8O3R80rIwtYh0nyg.apk) |

**On hold for version 9** (rolled back the same day, 18 October 2026: the Play Store link update was republished as groups `eba33d15` production, `2d699a61` preview, and the web app redeployed without it). The code stays on this branch: **Holy Bible**, KJV and World English Bible (text at theafmchurch.org/bible, kept on the phone after the first download), search, highlights, bookmarks and verse of the day (commit `a5596d5`; update groups `d6181166` production, `6e70610f` preview).

**Live on Google Play since 17 October 2026** (version 8): https://play.google.com/store/apps/details?id=com.afm.hub
The website button and QR code point there. Over-the-air update the same day set `playStoreUrl` (update groups `ee80e959` production, `18ef5cb0` preview).

Earlier (13 October): More →
Appearance, with AFM Green (default) or Church Blue & White, and Automatic, Light or Dark
(commit `e6d9377`; update groups `6d00ea50` production, `8d71a48f` preview).

Earlier on 13 October: optional
start time (Ghana time) on announcements, shown in each member's own time; emails list
Ghana, UK and US times (migration `0007_announcement_time.sql`).

Earlier on 13 October: service
times labelled GMT, with each member's own local time underneath (commit `6348fef`; update
groups `1b53af6e` production, `c2c9db0a` preview). Website redeployed the same day.

Earlier on 13 October: tapping a Telegram post notification opens the post in Telegram
(commit `547edc1`).

Previous update (1 October 2026): perfume shop with a 50/30/15 ml size picker, Call to
order / Order by email, and "The vision behind it" videos (commit `2c1fe80`).

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
