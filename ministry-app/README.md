# The AFM HUB — mobile app

The official app for Prophet Micah Felix Azanduna (D.D) and the AFM Family Network.
It is built with Expo (React Native), so one codebase runs on iPhone, Android and the web.
It replaces the earlier Adalo version.

## What's inside

| Area | Content |
| --- | --- |
| **Home** | Photo header, shortcuts, "Ask the AFM Assistant", 500+ sermons, Quote of the Day, latest messages, Meet the Prophet, AFM Books |
| **Sermons** | The AFM Podcast, loaded live from Podbean, with search and an in-app player (background and lock-screen playback), plus YouTube, Spotify, Telegram and more |
| **Quotes** | 51 quotes by AFM with search, a daily Quote of the Day, and a Share button on each |
| **Store** | AFM Books (exact Amazon links) and House of Azanduna fragrances |
| **More** | AFM Assistant, About Ministry (Mission Statement), Biography, The AFM Handbook, Archive, Contact Us, Prayer Request, Share App, Privacy Policy |
| **AFM Assistant** | A chat helper that answers common questions instantly and opens the right screen. It can also answer anything else with AI once the server in `server/` is deployed |

## Editing content

Everything is in `src/content/`:

| File | What it controls |
| --- | --- |
| `ministry.ts` | Names, links, contact email, books, fragrances, which photo appears where, assistant settings |
| `quotes.ts` | The quotes. **To add one, add a line at the end of the list.** |
| `biography.ts` | The Biography screen |
| `handbook.ts` | The AFM Handbook screen |

Search for `TODO` to find details that still need filling in. Brand colours are in `src/theme.ts`.

### Changing the logo / app icon

Replace `assets/brand/logo-source.png` with the new logo, then run
`python scripts/make-icons.py` (needs `pip install pillow`). That regenerates
the in-app logo, app icon, Android icon, splash image and favicon.

### Changing the photos

Put new photos in `assets/photos/` and update the `photos` section in
`src/content/ministry.ts`.

### AI for the assistant

See [`server/README.md`](server/README.md). About 10 minutes to set up on a free Cloudflare account.

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
