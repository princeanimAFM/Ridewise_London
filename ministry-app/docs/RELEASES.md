# The AFM HUB: Android releases

## Current builds (with automatic over-the-air updates)

These builds include `expo-updates`, so screen and content changes published with
`eas update` reach installed apps without a reinstall. Version 8 builds are from commit `96aed90`; version 7 from `acd3095`.

| Use | Build | File |
|---|---|---|
| **Google Play, version code 9** (Expo SDK 58, version 9.0.0, no microphone permission) | [952ae27e](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/952ae27e-c32e-4736-be32-f74dda3277f9) | [app bundle (.aab)](https://expo.dev/artifacts/eas/kUFLXNXQFVSYtpgXoev1oTBacrXhqBtScaHXWZcLnHg.aab) |
| Test APK for version 9 (preview channel) | [b8a1a9a1](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/b8a1a9a1-71a6-40fd-84d1-0238c15d88d0) | [APK](https://expo.dev/artifacts/eas/3mVm36uyurlKQglxFEjhjRWotA0Y8Qb9XBJnwjnGOrU.apk) |
| **Google Play, version code 8** (R8 code shrinking, SDK 57 patches; hold for production launch) | [a4ee46e3](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a4ee46e3-142c-4d13-a4ea-20297af9ae0b) | [app bundle (.aab)](https://expo.dev/artifacts/eas/5dwPiJyfaeozfQaxELxJlffoZy97mGNJKpDLKTWguY8.aab) |
| Test APK for version 8 (same code, preview channel) | [c9d3368a](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/c9d3368a-8e1e-411d-a763-cb4daa40309f) | [APK](https://expo.dev/artifacts/eas/1i1V_GzMahNKCRNn8a_MwtbjWCc51cIU3TAwJACXBw0.apk) |
| **Google Play, version code 7** (Firebase, announcement notifications) | [5973bbd9](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/5973bbd9-770e-4fba-8ce6-5ee1ffacd0ee) | [app bundle (.aab)](https://expo.dev/artifacts/eas/Qa-dAAq4QDMRJ1qataAgmcqWMTfC2l5Z5Ve1fHuf5cE.aab) |
| Google Play, version code 6 (in closed testing) | [609d0a24](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/609d0a24-ab8a-4263-830c-02660db81d1d) | [app bundle (.aab)](https://expo.dev/artifacts/eas/c0EbjtcnIBSkhetGwn5TotovG_3GRmcq8yft04F-vmY.aab) |
| Testing on a phone | [a587ece8](https://expo.dev/accounts/princeanim88s-team/projects/afm-hub/builds/a587ece8-6cde-4a0e-bc43-724d46022db2) | [APK](https://expo.dev/artifacts/eas/FlZMdhxYl3FlvIlUtSLsGAIY49J8O3R80rIwtYh0nyg.apk) |

**Bible highlights show on phones, 22 November 2026 (live).** Highlighted verses showed as selected but the colour didn't appear on the phone: the colour was a background on the verse's text, which some phones don't draw. It now sits on a box around the verse (`src/app/bible/read.tsx`); the web app looks the same as before. Over-the-air: group `03d1da04` production, `51c73ceb` preview (runtime 9.0.0); web app redeployed.

**New looks: Evening Glow, Sunset and Aurora, 21 November 2026 (live).** The owner's father chose three new looks for More → Appearance, next to AFM Green and Church Blue & White (both unchanged: pixel-identical to before in light and dark): Evening Glow (brown and copper glass over a drawn sunset), Sunset (the same look over a real sunset photograph; a crescent moon and stars at night) and Aurora (emerald glass over emerald water; the northern lights at night). The glass looks have a gradient behind every screen, glass panels, a floating tab bar, and day and night pictures of the pastor set into each scene (made on our own computer with `scripts/scenes/build.py`; free Pexels photos, credits in `scripts/scenes/README.md`). Also in this update: the KJV label on the Bible tab is readable in dark mode. Over-the-air: group `d3a788a5` production, `c3b2ec00` preview (runtime 9.0.0); web app redeployed.

**Free leaked-password check, 20 November 2026 (live).** Creating an account, resetting or changing a password refuses a password seen in data breaches (Have I Been Pwned's Pwned Passwords list, the one Supabase's paid check uses); signing in with one works but the account screen asks the member to change it. Only the first 5 characters of the password's SHA-1 leave the phone (`src/lib/pwned.ts`). Over-the-air: group `b9ba7777` production, `c83879d6` preview (runtime 9.0.0); web app redeployed.

**Bible tab follow-up, 20 November 2026 (live).** The books come straight after the tool tiles, and the Verse of the Day stays on Home only (the morning verse is under Notifications). Over-the-air: group `625095d5` production, `f2003d8b` preview (runtime 9.0.0); web app redeployed.

**Bible tab layout and the AI-crawler block, 20 November 2026 (live).** The Bible tab opens with Continue reading (a large card with how far into the book you are), then search, the study tools as six picture tiles, the Verse of the Day, and the books behind an Old / New Testament switch. Over-the-air: group `cf6fbcdd` production, `d3cad861` preview (runtime 9.0.0); web app redeployed. theafmchurch.org (website commits `9a3b93a`, `51d66dd`) and the web app turn away 46 AI crawlers, AI assistants and data scrapers in robots.txt (search engines still list the public website), the website has `ai.txt` and `/.well-known/tdmrep.json`, and every page carries "noai, noimageai" and a text-and-data-mining reservation (private pages also "noindex"). Leaked-password protection needs the Supabase Pro plan, so it is still off.

**Two-step sign-in and 12-hour invite links, 20 November 2026 (live).** HUB owners and admins need a code from an authenticator app for admin powers (migration `0011_two_step.sql`: `is_admin()` and `is_owner()` check it, the live-chat team badge too; edge functions send-announcement v16, draft-announcement v12 and go-live v4 ask `is_admin()` as the caller). Everyone on the Church Care team needs it to open Church Care (`church-care/supabase/patch-2026-11-20c-two-step.sql`); until 28 November those who haven't set it up can tap "Not now". The pastor sees who has it on and can reset it for a lost phone. Church Care join and leader links work for 12 hours (`patch-2026-11-20b-invite-hours.sql`). The Sermons photo gets a blue backdrop with Church Blue & White. Over-the-air: group `a41226cf` production, `994fc87d` preview (runtime 9.0.0; version 8 phones can't show the two-step screens, so admins need version 9). Web app redeployed; website commit `03751a4` (Church Care pages and the practice copy).

**Security review and fixes, 19–20 November 2026 (live).** Four reviewers checked the HUB, Church Care and the website. Fixed and live: only owner accounts (kept in the private table `private.owners`, not in the code) can manage admins and change the giving and contact details; nobody can take over or read another person's newsletter subscription (migration `0010_security_hardening.sql`); links saved in content must be web, email or phone links; push addresses are checked and flooding is braked; tighter table permissions; file size and type limits on storage buckets; sign-in redirect list no longer allows `exp://**`, site URL set, passwords need 8 characters, database SSL enforced; Church Care leaders can no longer link members from other groups (`church-care/supabase/patch-2026-11-20-security.sql`), join links expire after 30 days, lock-screen notifications carry no names or reasons; Church Care pages got a content-security policy, their own copy of supabase-js, clickjacking protection and a sign-out that switches notifications off; edge functions compare secrets in constant time and push batches survive one bad address; the app opens only safe link types and only known notification targets, and the map page can't leave theafmchurch.org (update groups `72f57b23` production, `a28cbb3f` preview; web redeployed). Still to do (needs a new Play build, 9.0.1): `allowBackup=false` and the draw-over-apps permission block (already in `app.json`), EAS Update code signing. Church Care moves to its own address (care.theafmchurch.org) and the code to a private repository; see `docs/TODO.md`.

**Version 9, 18–19 November 2026 (sent to Google Play).** Expo SDK 58 / React Native 0.88 (clears the edge-to-edge warning), app version 9.0.0 (runtime 9.0.0, so version 8 phones keep their own over-the-air updates), microphone permission removed. New: Bible word study (study button in the reader, tap any word for a concordance pop-up), full Concordance screen, Hebrew & Greek (Strong's) from the KJV (data `bible/kjv-strongs.json` and `bible/strongs.json` on theafmchurch.org, built with `scripts/build-strongs.py`), "new version available" pop-up (Owner dashboard → App updates → Newest version on the Play Store), and AFM Assistant answers about the Bible and word study. Over-the-air: version 8 phones got the update pop-up (group `4bd5f349` production, `5bab4f2d` preview, from commit `ea8e32b` plus the pop-up); version 9 got the assistant answers (group `c2e71165` production). Web app redeployed. **After Google approves: set Newest version to 9.0.0.**

**Released 5 November 2026: Store showcase.** Perfumes no longer show prices or take orders in the app (for Google Play non-trader status); each perfume links to the House of Azanduna website (rabbiazanduna.com/collections) for prices and ordering, and the Store has a "Shop at House of Azanduna" button (update groups `8094571e` production, `2ec08958` preview; web redeployed).

**Released 31 October 2026: live services.** Owner dashboard → Live service → "We're live: notify everyone" sends "🔴 Live now" to every phone and opens the Live screen, where members comment and send private prayer requests (seen only by the sender and the ministry team, under Prayer requests on the dashboard). Database migration `0008_live_service.sql`, new `go-live` function, `telegram-webhook` redeployed with shared push code, privacy policy effective 31 October 2026 (update groups `ca20ca35` production, `8bb50580` preview; web redeployed).

**Released 18 October 2026: the Holy Bible** (over-the-air to version 7 and 8 builds, and the web app). Bible tab with 17 versions (KJV, BSB, MSB, LSV, WEB, WEB British, ASV, Webster, BBE, YLT, Darby, Geneva 1599, Akuapem Twi, Asante Twi, Ewe, Hausa, Louis Segond), download for offline reading, search, highlights, bookmarks, Verse of the Day on Home and the Bible tab, and a daily Bible verse notification (on by default with the daily quote, a minute after it). Tabs are now Home · Bible · Sermons · Store · More; Quotes moved to More and a See all link on Home. Text is hosted at theafmchurch.org/bible (afm-church repo `bible/`, built with `scripts/build-bible.py`).

**Released 18 October 2026 (later the same day): Bible reader fixes.** Bottom bars now sit above Android's navigation buttons (they were hidden under them), labelled Bookmark · Note · Copy · Share actions, notes on verses (also listed under Highlights & Notes), and a "Next: <chapter>" button at the end of each chapter (update groups `8d20ebab` production, `5ff4342d` preview; first Bible release was `cf9b7404` production, `e4246f35` preview).

**Released 18 October 2026: blue welcome photo.** With Church Blue & White, the Home, welcome and newsletter photo shows a blue studio backdrop (update groups `2db0884f` production, `e9037025` preview).

**Still for version 9:** update to the newest Expo SDK and React Native (clears Play's edge-to-edge warning), then a test APK before the Play release.

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
