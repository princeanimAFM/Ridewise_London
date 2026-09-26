# Trying The AFM HUB on your phone (private, not published)

Nothing here publishes the app. Only people you send the link to can install it.

## Android: a private install link (free)

You need a free Expo account (sign up at https://expo.dev/signup) and a
computer with Node.js installed (https://nodejs.org).

```bash
cd ministry-app
npm install
npx eas-cli@latest login          # sign in with your Expo account
npm run test-build:android        # answer "Yes" to the setup questions
```

The first time, it asks to create the project on Expo and to generate an
Android signing key. Answer **Yes** to both.

The build runs on Expo's servers for about 10–15 minutes, then prints a link
and QR code. Open it on an Android phone to download and install the app. You
may need to allow "Install from unknown sources". Share the same link with
anyone who should test it.

## iPhone

Apple only allows private installs through a paid **Apple Developer account**
($99/year, https://developer.apple.com/programs/). With one:

```bash
npx eas-cli@latest device:create     # register each tester's iPhone (opens a link on the phone)
npm run test-build:ios
```

**Free alternative for iPhone (and Android): Expo Go**

1. Install **Expo Go** from the App Store / Google Play.
2. On the computer: `cd ministry-app && npm install && npx expo start --tunnel`
3. Scan the QR code with the iPhone camera (or from inside Expo Go on Android).

The full app runs, including sermons playing from Podbean. It works while that
command is running on your computer.

## What to check

- Sermons tab: episodes load from Podbean and play; playback continues with the phone locked.
- Books open the right Amazon pages.
- Prayer Request opens your email app.
- The AFM Assistant answers common questions. Open questions need the assistant server; see server/README.md.
