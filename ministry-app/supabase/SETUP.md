# Backend setup: accounts, newsletter, announcements, notifications

These features need a backend. Until it's connected, the app shows "Coming soon"
on those screens and everything else works normally.

| Service | What it does | Cost |
| --- | --- | --- |
| **Supabase** | Accounts (email, Google, phone), database, flyer storage, sending functions | Free plan |
| **Brevo** | Sends newsletter emails and account emails (codes, password resets) | Free: 300 emails/day |
| **Twilio** | Text messages: phone sign-in codes and SMS announcements | Pay per text (about $0.05–0.30 depending on country) |
| **Anthropic** | "Write it with AI" in the Owner Dashboard | Pay per use (a few cents per draft) |
| **Expo push** | App notifications for announcements | Free |

Text messages and AI writing are optional. Leave them out and everything else still works.

---

## 1. Create the Supabase project
1. Sign up at https://supabase.com, then **New project**. Name it `afm-hub` and pick the region closest to most members (for example *West EU* for Ghana and the UK).
2. **SQL Editor → New query**: paste all of `supabase/migrations/0001_afm_hub.sql`, then **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `src/content/ministry.ts`:
   ```ts
   backend: { supabaseUrl: 'https://xxxx.supabase.co', supabaseAnonKey: 'eyJ…' },
   ```
   The anon key is designed to be public. The database rules protect the data. **Never** put the `service_role` key in the app.
4. **Storage → brand** bucket: upload `supabase/brand/afm.jpg`, named exactly `afm.jpg`. It's the photo at the top of every newsletter.

## 2. Email (Brevo)
1. Sign up at https://www.brevo.com, then **Senders & IP → Senders**: add and verify the address emails come from. Since 28 September 2026 that's **theafmfamily@gmail.com** (verified in Brevo). Supabase's SMTP sender email and the `NEWSLETTER_FROM_EMAIL` secret both use it.
   - Email providers increasingly reject bulk mail sent "from" a free @gmail.com address. For reliable delivery, use an address on the ministry's own domain (for example `news@theafmhub.org`, a domain costs about $10/year) and verify the domain in Brevo. Replies still go to theafmfamily@gmail.com.
2. **SMTP & API → API keys**: create a key (used for newsletters).
3. **SMTP & API → SMTP**: note the SMTP login and create an SMTP key (used for account emails).
4. Account emails (codes, password resets) use green templates with the Play Store feature graphic as the header (`store/feature-graphic-1024x500.png`, uploaded to the `brand` storage bucket as `email-header.png`; newsletters use the same header), set in **Authentication → Emails → Templates**. The email rate limit (**Authentication → Rate limits**) is 60 per hour; Supabase's default of 2 per hour is far too low once members sign up.
5. In Supabase, go to **Authentication → Emails → SMTP Settings** and enable custom SMTP: host `smtp-relay.brevo.com`, port `587`, your Brevo SMTP login and key, sender name `The AFM HUB`.

## 3. Account emails use codes
The app asks people to type a code, which works reliably in phone apps. In Supabase, go to **Authentication → Emails → Templates**:
- **Confirm signup**: subject `Your AFM HUB code`, body:
  ```html
  <h2>Welcome to The AFM HUB</h2><p>Your confirmation code is:</p><h1>{{ .Token }}</h1><p>It expires in 1 hour.</p>
  ```
- **Reset password**: subject `Reset your AFM HUB password`, body:
  ```html
  <h2>Reset your password</h2><p>Your code is:</p><h1>{{ .Token }}</h1><p>If you didn't ask for this, ignore this email.</p>
  ```

## 4. Sign-in methods (Authentication → Sign In / Providers)
- **Email**: on, with **Confirm email** on.
- **Phone** (text-message codes): turn on and choose **Twilio**. Enter your Account SID, Auth Token and Messaging Service SID (from https://console.twilio.com).
- **Google**:
  1. At https://console.cloud.google.com, create a project, then go to **APIs & Services → OAuth consent screen**. Choose External, app name `The AFM HUB`, support email princeanim88@gmail.com.
  2. **Credentials → Create credentials → OAuth client ID → Web application**. Under Authorized redirect URIs add `https://<your-project>.supabase.co/auth/v1/callback`.
  3. Paste the Client ID and Client Secret into Supabase's Google provider.
- **Authentication → URL Configuration → Redirect URLs**: add `afmhub://auth-callback` and `exp://**`. The second one is for testing in Expo Go.

## 5. Sending functions
The three functions in `supabase/functions` send newsletters, write AI drafts and handle unsubscribe links.

**Secrets** (Edge Functions → Secrets):
| Name | Value |
| --- | --- |
| `BREVO_API_KEY` | Brevo API key |
| `NEWSLETTER_FROM_EMAIL` | The verified sender address |
| `NEWSLETTER_FROM_NAME` | `The AFM HUB` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` | Only for SMS announcements |
| `ANTHROPIC_API_KEY` | Only for "Write it with AI" (from https://console.anthropic.com) |

**Deploy** from a computer, or have Claude do it in a session with a `SUPABASE_ACCESS_TOKEN` (Supabase → Account → Access Tokens) and network access to `supabase.com`:
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy send-announcement
npx supabase functions deploy draft-announcement
npx supabase functions deploy unsubscribe --no-verify-jwt
```
After changing the ministry's details in `src/content/ministry.ts` (links, PayPal, theme), run `node scripts/build-newsletter-brand.js` and deploy again so newsletters match.

## 6. The owner account and other admins
The owner is **princeanim88@gmail.com**. `migrations/0002_owner_admin.sql` makes that account an admin automatically once its email is confirmed.
1. In the app: **More → Sign in → Create account** with princeanim88@gmail.com and enter the emailed code.
2. Reopen **More**. **Owner dashboard** and **Edit app content** now appear. Nobody else sees them.
3. **Add or remove admins in the app:** Owner dashboard → **Admins**. The person creates an account and confirms their email first, then an admin enters that email. The owner account can't be removed, and admins can't remove themselves.

## 6b. Editing content from the app
Run `migrations/0003_app_content.sql` and `migrations/0004_admins.sql` (SQL Editor, or `npx supabase db push`). Then **Owner dashboard → Edit app content** lets admins change the following without an app update:
- books
- perfumes, and switching the shop from "Coming soon" to launched
- quotes
- giving details
- service times
- social and archive links
- the theme of the year, the contact email, WhatsApp, and the live-service channel

Each area uses the content built into the app until it's first edited. Newsletters pick up the edited theme, giving details and links automatically. Redeploy `send-announcement` and `draft-announcement` once after running 0003.

## 6c. Library, profile photos and subscribers
Run `migrations/0005_library_avatars.sql`. It adds:
- **Library**: Owner dashboard → Edit app content → **Library: free e-books & files**. Upload a PDF, title and optional cover, and it appears for everyone under More → Library.
- **Profile photos**: members can add an optional photo in My Account. Photos are stored in `avatars/<member id>/`. Only the member can change or remove theirs, and removing it deletes the file.
- **Subscribers**: Owner dashboard → **Subscribers** lists everyone on the newsletter, with search, remove and export.

When you handle an account deletion request, also delete the member's folder in **Storage → avatars**.

## 7. Push notifications in store builds
- **Android**: create a Firebase project (https://console.firebase.google.com) and add an Android app with package `com.afm.hub`. Then go to **Project settings → Service accounts → Generate new private key**, and upload that JSON to Expo with `npx eas-cli credentials` (Android → Google Service Account → FCM V1).
- **iPhone**: handled automatically by EAS when you build with your Apple Developer account.
- The daily AFM quote needs none of this. It's scheduled on the phone.
