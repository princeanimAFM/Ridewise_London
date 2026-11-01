# The AFM HUB: to-do list

Ideas agreed with the owner, to build later. Nothing here is started or published until the owner says so.

## Version 9 (Play Store), reminder set for 18 November 2026
- Update to the newest Expo SDK and React Native (clears Play's edge-to-edge warning).
- Test APK for the owner to try, then the Play Store bundle.
- Remove the unused microphone permission (RECORD_AUDIO, added by expo-audio by default; the app only plays audio) so Play doesn't ask about it.
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
- Declare trader status in Play Console (Google requires it from November 2026, email of 29 October 2026). Owner to choose trader or non-trader.

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
