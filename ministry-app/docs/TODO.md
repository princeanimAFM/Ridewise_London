# The AFM HUB: to-do list

Ideas agreed with the owner, to build later. Nothing here is started or published until the owner says so.

## Version 9 (Play Store), started 18 November 2026
- Done: Expo SDK 58 / React Native 0.88 (clears Play's edge-to-edge warning); app version 9.0.0 (new runtime, so
  over-the-air updates for version 8 phones stay separate until they update).
- Done: microphone permission removed (RECORD_AUDIO blocked; expo-audio recording off). Camera stays removed.
- Test APK (preview build) for the owner to try, then the Play Store bundle (production build) and submit.
- Study Bible (built 19 November, waiting for "publish"; goes out as an over-the-air update to 9.0.0 phones):
  cross-references, book introductions, Bible studies by the owner and admins, Bible dictionary (Easton's),
  commentary (Matthew Henry Concise), Bible maps. To publish:
  1. Upload the data files to the afm-church repo: bible/crossrefs.json, bible/dictionary.json,
     bible/commentary.json, bible/places.json and bible/map/ (index.html, basemap.json, leaflet.js, leaflet.css).
     Rebuild them with scripts/build-crossrefs.py, build-dictionary.py, build-commentary.py and build-maps.py.
  2. Apply supabase/migrations/0009_bible_studies.sql.
  3. Over-the-air update (production and preview, runtime 9.0.0) and redeploy the web app.
- After release: update the Play listing's Data safety only if anything changed (nothing new collected).
- Google Play app quality requirements (memory use and code optimisation), deadline February 2027: check the version 9 build against them (R8 shrinking is already on since version 8).

## Apple App Store (with version 9, November)
- Apple Developer Program for the church ($99 a year). Enrolling as an organisation needs the church's D-U-N-S number (free from Dun & Bradstreet, takes a few days); an individual account is quicker but shows a person's name on the store.
- App Store Connect: create the app (bundle ID `com.afm.hub`, already set in app.json), privacy policy link (afm-hub.expo.app/privacy.html), privacy labels, age rating, support URL.
- Sign in with Apple: the app offers Google sign-in, so Apple requires Sign in with Apple as well (guideline 4.8). Add it on iPhone (expo-apple-authentication + Supabase Apple provider).
- Give screen: Apple doesn't allow in-app donations unless the church is an approved nonprofit (guideline 3.2.2). On iPhone, show the bank and MoMo details as information only, or link to the website's giving section.
- Push notifications on iPhone: EAS creates the Apple push key during the first iOS build.
- Screenshots for 6.9" and 6.5" iPhones (and 13" iPad while iPad is supported; or turn iPad off).
- `eas build -p ios --profile production`, test on TestFlight, then `eas submit -p ios`. Over-the-air updates then reach iPhones the same way as Android.

## Church Care (separate web app in /church-care)
- Preview approved by the pastor? Then: Supabase project, sign-in codes (WhatsApp via Twilio, or email), hosting at theafmchurch.org/welcome, QR code.

## Google Play account
- Trader status declared 5 November 2026: **non-trader** (the developer account is personal, so trader status would publish a personal name and home address). To keep this true, the app does not show perfume prices or take orders; perfumes link to the House of Azanduna website.
- Later: church organisation account (needs the church's D-U-N-S number, also needed for the Apple App Store). Move AFM HUB to it, then the church can declare as trader under its own name and prices can come back.

## Daily devotional
- "Today's Devotional" card on Home next to the Verse of the Day.
- Each devotional: title, date, scripture (opens in the Bible reader), message, short prayer, optional declaration.
- Mark as read, share, browse past devotionals; optional line in the morning notification.
- Written or approved by Prophet Micah, entered and scheduled ahead in the Owner dashboard.
- To decide: how often (daily, weekdays, weekly), who writes, the name, and whether there are existing devotionals to load in.

## Bible reading challenge
- In the Bible tab, a member picks a length (for example 1 year, 6 months, 3 months, 1 month, or their own number of days).
- The app splits the whole Bible into that many daily portions, balanced by verse count rather than chapter count, so each day takes about the same time.
- Shows today's reading, ticks it off when read, tracks progress and streaks, and lets a member catch up after missed days or restart.
- Optional daily reminder notification with today's portion.
- Possible extras: Old and New Testament together each day, or New Testament only plans.

## Bible audio
- ▶ Listen on each chapter, optional auto-play, continues to the next chapter, plays with the screen off.
- Waiting on the owner to apply for a Bible Brain (Faith Comes By Hearing) API key; then check Twi/Ewe audio and licence terms.
- Fallback: public-domain World English Bible audio from eBible.org.

## Bible text: permission letters
- NKJV, ESV, Amplified need publisher permission; the owner will write the letters.

## Church live-stream sound
- Steady microphone level for online viewers. Waiting on photos of the mixer and streaming setup from the media team.
