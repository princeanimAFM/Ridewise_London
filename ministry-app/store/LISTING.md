# Google Play listing: The AFM HUB

Copy each part into **Play Console → your app**. The graphics are in this folder.

## Main store listing (Grow users → Store presence → Main store listing)

**App name** (30 characters max)
```
The AFM HUB
```

**Short description** (80 characters max)
```
Sermons, live services, daily quotes and books from Prophet Micah Azanduna.
```

**Full description** (4000 characters max)
```
The AFM HUB is the official app of Prophet Micah Felix Azanduna (D.D) and the AFM Family Network.

Our theme for 2026: Our Year of the Blessing.

LISTEN TO SERMONS
• Stream more than 500 audio messages from The AFM Podcast inside the app
• Keep listening with the screen off and control playback from your lock screen
• Search for any message by title

WATCH LIVE SERVICES
• Join live services and watch past broadcasts from YouTube without leaving the app

DAILY QUOTES
• A new AFM quote every day, with an optional daily reminder
• Browse every quote and share your favourites with friends and family

KNOW THE MINISTRY
• About Ministry: the AFM Mission Statement, covering our vision, mission and process
• Biography: the life and ministry of Prophet Micah Azanduna
• The AFM Handbook: frequently asked questions, our anchor scripture, slogans and the Code of Conduct

BOOKS AND FREE E-BOOKS
• Books by Prophet Micah Azanduna, with direct links to buy on Amazon
• A free Library of e-books, study guides and files to read in the app

STAY CONNECTED
• Announcements and flyers for upcoming programmes
• Subscribe to the newsletter by email or text message
• Create an optional account, with your own profile photo if you like
• Optional notifications for announcements and daily quotes
• Every AFM channel in one place: YouTube, Telegram, Spotify, Apple Podcasts, Facebook, Instagram and TikTok

GIVE AND PRAY
• Give an offering through PayPal, Cash App, Mobile Money or bank transfer
• Send a prayer request to the ministry

AFM ASSISTANT
• Ask questions about the ministry and the app, and get help finding your way around

HOUSE OF AZANDUNA
• A first look at the upcoming Rabbi Azanduna fragrance collection

Arise and shine. Welcome to the AFM Family.
```

**Graphics**
| Field | File |
| --- | --- |
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic-1024x500.png` |
| Phone screenshots (2–8) | everything in `screenshots/`, uploaded in number order |

## Store settings (Grow users → Store presence → Store settings)
- **App or game:** App
- **Category:** Lifestyle. Books & Reference would also fit.
- **Tags:** Religion, Podcasts
- **Email:** theafmfamily@gmail.com
- **Website:** leave empty for now
- **Phone:** leave empty

## App content (Policy → App content)

**Privacy policy URL:** Google needs a public web page. Use the published privacy policy link, which is also in the app under More → Privacy Policy.

**Ads:** No, the app does not contain ads.

**App access:** "All functionality is available without special access." Signing in is optional. The Owner dashboard is limited to ministry staff and is not part of the public app.

**Target audience:** 18 and over. Selecting 13 and over also works. Don't include children under 13.

**Content rating questionnaire:** Category *Reference, News, or Educational*. Answer **No** to violence, sexual content, profanity, drugs, gambling and similar questions. For "Can users interact or share content?" answer **No**, because users can't post anything visible to other users. The expected rating is Everyone or PEGI 3.

**News app:** No.

**Government app:** No.

**Financial features:** None. Giving opens PayPal and Cash App, or shows account numbers. The app doesn't process any payments.

**Health:** No.

## Data safety form

**Does the app collect or share user data?** Yes, it collects data. It shares nothing.
**Is all data encrypted in transit?** Yes.
**Can users request that their data be deleted?** Yes: More → My Account → Request account deletion, or email theafmfamily@gmail.com.

| Data type | Collected | Shared | Required? | Purpose |
| --- | --- | --- | --- | --- |
| Personal info → Name | Yes | No | Optional | Account management, App functionality (newsletter greeting) |
| Personal info → Email address | Yes | No | Optional | Account management, Developer communications (newsletter) |
| Personal info → Phone number | Yes | No | Optional | Account management, Developer communications (SMS) |
| Device or other IDs | Yes (push notification token) | No | Optional | App functionality (announcement notifications) |
| Photos and videos → Photos | Yes (optional profile photo) | No | Optional | App functionality (personalising your account) |

Answer **not collected** for: location, financial info, health, messages, videos, audio, files and docs, calendar, contacts, app activity, web browsing, and diagnostics.

(Library files are uploaded by the ministry and only downloaded by users, so they don't count as data collected from users.)

Notes behind these answers:
- Prayer requests and contact messages open the person's own email app. The app doesn't store them.
- Payments happen in PayPal, Cash App or the person's bank or MoMo app, never inside this app.
- AFM Assistant questions go to the assistant service only to generate a reply and aren't stored with any identity. If the online assistant is switched on later, re-check this form and add "App interactions".
- The daily quote reminder is scheduled on the phone and needs no data.

## Release plan
1. **Testing → Closed testing:** create a track and add at least 12 testers by their Gmail addresses (a Google Group also works). Upload the `.aab` from the production build. Testers must stay opted in for **14 days**.
2. After the 14 days, go to **Dashboard → Apply for production** and answer the short questionnaire about the test.
3. **Production:** roll out the reviewed build. After approval, set `playStoreUrl` in `app.json`. The "Rate the app" button uses it.
