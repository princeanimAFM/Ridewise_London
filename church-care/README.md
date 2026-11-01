# Church Care Tracker

A separate web app for The AFM Church (not part of AFM HUB): visitor welcome, follow-up by group leaders,
group attendance, an "away" list and prayer requests, with the overseeing pastor seeing everything.

| Page | Who | What |
|---|---|---|
| `index.html` | Visitors (the QR code opens this) | AFM HUB download, web app and church website links; welcome form; prayer request form. No login. |
| `team.html` | Pastor, welcome team, group leaders | Sign in with email. Overview, visitors, groups, away list, prayer requests. Can be added to the phone's home screen. |

## Who sees what

Enforced by the database (`supabase/schema.sql`), not just hidden in the app:

- **Pastor:** everything; assigns visitors and prayer requests to group leaders; manages the team list; can delete a person's record when they ask.
- **Welcome team:** adds visitors and sees the visitor list. Can add a prayer request but can't read any.
- **Group leader:** only their own group's visitors, members and prayer requests.
- **Visitors:** can only send the two forms. They can never read anything back.

A visitor's prayer request goes to the same leader as the visitor once the pastor assigns them. New visitors are due a first contact within 2 days of assignment; members unseen for 3 weeks show on the Away list (both set in `assets/config.js`).

## Try it

With the Supabase settings empty, both pages run in **demo mode** with sample people, kept in that browser only.
Serve the folder (for example `python3 -m http.server`) and open `team.html`; switch "Viewing as" to see each role.

## Going live

1. Create a free Supabase project (region: closest to Ghana, e.g. EU West / London). Free projects pause after
   7 days with no use; weekly services keep it active.
2. Run `supabase/schema.sql` in the SQL editor (safe to run again after changes).
3. Add the pastor: `insert into staff (email, name, role) values ('pastor@example.com', 'Prophet Micah Felix Azanduna D.D', 'pastor');`
   Everyone else is added from the app (Overview → Team list).
4. Authentication → URL configuration: set Site URL to the address of `team.html`.
   Authentication → Email templates → Magic link: add `Your code: {{ .Token }}` so people can type the code
   (a code works better than the link when the app is on the home screen).
5. Put the project URL and anon key in `assets/config.js`.
6. Host the folder on any static host (GitHub Pages works) and make the QR code from the address of `index.html`.

## Data protection

The forms record consent with a timestamp and explain who sees the details. Records are kept while someone is part
of the church; the pastor deletes a record (with its notes and prayer requests) when someone asks.
Leaders' phone numbers are never shown publicly.
