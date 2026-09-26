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
| **Live** | Live services from YouTube (@thebrandmicah), streamed inside the app |
| **Give** | PayPal, Cash App, MTN MoMo, Telecel Cash and Fidelity Bank details, with copy buttons |
| **Accounts** | Optional sign-in with email and password, Google, or a text-message code; password reset by emailed code |
| **Newsletter** | Subscribe by email and/or text; every message greets the subscriber by first name |
| **Owner dashboard** | Upload a flyer, let AI write the message, then send by email, text and app notification |
| **Notifications** | A daily AFM quote, plus announcement alerts |
| **AFM Assistant** | A chat helper that answers common questions instantly and opens the right screen. It can also answer anything else with AI once the server in `server/` is deployed |

## Editing content

Everything is in `src/content/`:

| File | What it controls |
| --- | --- |
| `ministry.ts` | Names, links, contact email, books, fragrances, which photo appears where, assistant settings |
| `quotes.ts` | The quotes. **To add one, add a line at the end of the list.** |
| `biography.ts` | The Biography screen |
| `handbook.ts` | The AFM Handbook screen |
| `privacy.ts` | The Privacy Policy. Run `node scripts/build-privacy-page.js` after editing to update `docs/privacy.html` |

Search for `TODO` to find details that still need filling in. Brand colours are in `src/theme.ts`.

### Changing the logo / app icon

Replace `assets/brand/logo-source.png` with the new logo, then run
`python scripts/make-icons.py` (needs `pip install pillow`). That regenerates
the in-app logo, app icon, Android icon, splash image and favicon.

### Changing the photos

Put new photos in `assets/photos/` and update the `photos` section in
`src/content/ministry.ts`.

### Accounts, newsletter, notifications (backend)

See [`supabase/SETUP.md`](supabase/SETUP.md).

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
Both stores require a **Privacy Policy URL**. Host `docs/privacy.html` (for example on GitHub Pages or Netlify, or share the published page publicly) and put its address in the store listings and in `privacyPolicyUrl`.
Update the bundle identifier (`com.afm.hub`) in `app.json` if you prefer a different one.

## Website (laptops and computers)

The same app runs in a web browser. It's hosted free on Expo's EAS Hosting, using the Expo account the builds already use:

```bash
npx expo export -p web
npx eas-cli@latest deploy --prod --non-interactive
```

The site's address is shown after deploying (for example `https://afm-hub.expo.app`). The privacy policy is at `<address>/privacy.html`, and that's the link Google Play asks for. After the first deploy, put the address in `appShareUrl` and `<address>/privacy.html` in `privacyPolicyUrl` in `src/content/ministry.ts`. Redeploy whenever the app's code changes. Content edited in the Owner dashboard appears on the website automatically.

Phone-only on the website: push notifications and daily quote reminders, lock-screen audio controls, and in-page live video (the website shows a "Watch on YouTube" button instead).
