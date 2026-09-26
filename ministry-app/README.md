# The AFM Hub — mobile app

The official app for Prophet Micah Felix Azanduna (D.D) and the AFM Family Network.
It is built with Expo (React Native), so one codebase runs on iPhone, Android and the web.
It replaces the earlier Adalo version.

## What's inside

| Tab | Content |
| --- | --- |
| **Home** | Logo and welcome, shortcuts, the "Stream All 500+ Audio Sermons" archive, Quote of the Day, Watch/Listen/Follow buttons, AFM Books |
| **Sermons** | Sermon archive and YouTube / Spotify / Telegram / Instagram. Once individual sermons are added, you get search, series filters and a detail page |
| **Quotes** | A new Quote of the Day each day, plus every quote with a share button (WhatsApp, Instagram, etc.) |
| **Store** | AFM Books (covers, Buy on Amazon) and House of Azanduna fragrances (order by link, WhatsApp or email) |
| **More** | About Ministry (founder bio and the AFM Mission Statement), The AFM Handbook, Archive, Contact Us, Prayer Request, Share App, Privacy Policy |

There is no forced sign-up screen. Visitors go straight to the content.

## Editing content

**All text, links and images live in one file: [`src/content/ministry.ts`](src/content/ministry.ts).**
Search it for `TODO` to find what still needs a real link or detail. Empty links show a
"Coming soon" message instead of breaking.

- Brand colours are in [`src/theme.ts`](src/theme.ts).
- Images go in `assets/images/`.

## Running it

```bash
npm install
npx expo start      # scan the QR code with the Expo Go app on your phone
npm run web         # open in a browser
npm run typecheck
```

## Publishing to the App Store / Google Play

Publishing uses Expo's cloud build service (EAS). You don't need a Mac.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

You need an Apple Developer account ($99/year) and a Google Play Console account ($25 one-off).
Both stores require a **Privacy Policy URL**: set `privacyPolicyUrl` in the content file.
Update the bundle identifier (`com.afm.hub`) in `app.json` if you prefer a different one.
