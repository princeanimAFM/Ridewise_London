# Church Care Tracker

A separate web app for The AFM Church (not part of AFM HUB): visitor welcome, follow-up by group leaders,
group attendance, an "away" list and prayer requests, with the overseeing pastor seeing everything.

| Page | Who | What |
|---|---|---|
| `index.html` | Visitors (the QR code opens this) | AFM HUB download, web app and church website links; welcome form; prayer request form. No login. |
| `team.html` | Pastor, welcome team, group leaders | Sign in with email. Overview, visitors, groups, away list, prayer requests. Can be added to the phone's home screen. |

## Look and wording

Styled like theafmchurch.org and the AFM HUB app (Church Blue & White, Playfair Display and Montserrat, the church
wordmark and JESUS seal, the AFM HUB logo, Prophet Micah's photo). The welcome note, the prayer for new visitors and
the WhatsApp welcome message are all in `assets/messages.js`; service times, links and the theme of the year are in
`assets/config.js`.

After a visitor sends the form they see a personal welcome letter and a prayer with their name. On the team's Home
screen, "Welcome messages to send" lists every new visitor not yet welcomed: one tap opens WhatsApp with the welcome,
the prayer, the app and website links and service times, and marks them as welcomed.

## Who sees what

Enforced by the database (`supabase/schema.sql`), not just hidden in the app:

- **Pastor:** everything. Sets everything up in the app (Home → Team & groups): adds group leaders, a PA and the
  welcome team by WhatsApp number or email, renames groups and adds new ones, and can delete a person's record when they ask.
- **PA:** only the areas the pastor ticks, in any mix: *Visitors* (all visitors, giving them a leader), *Groups*
  (every group's members, attendance and Away list), *Group prayer requests*, *Prayer requests to the pastor*.
  A PA can't change the team list, so can't give themselves more access.
- **Group leader:** only their own group's visitors, members and prayer requests.
- **Member:** joins through their group's link and sees only their group (names, no phone numbers), their leader
  (with a WhatsApp button), the church's service times and links, and their own prayer requests.

**Attendance:** leaders tick who came to each service: Sunday service, Time with the Rabbi (Tuesday), Friday Miracle
Service, online prayer, group meetings and special programs (any date up to today). Members can tap "I was in church" in their app for today or the last two days;
leaders see "said they came" and can untick it. Each person shows "Came 6 of the last 8 Sundays" and "missed 2 in a row".
The Follow up tab lists who missed each of the last 4 Sundays, with a kind WhatsApp message ready, and anyone away
3+ weeks. Home shows how many came last Sunday and a 4-Sunday table by group.

**Special programs:** the pastor (or a PA given "Special programs") adds conventions, Holy Ghost nights, thanksgiving
services and other programs: name, first and last day, time, place and a short description. Upcoming programs show on
the visitors' welcome page and in members' app; leaders mark who came, and each program shows who came by group.
The Follow up tab works for Sunday service, Time with the Rabbi and the Friday Miracle Service.

**Invite links:** the pastor taps *Invite leader* on a group (Team & groups) and sends the link. It works once: whoever
opens it and signs in becomes that group's leader. Each group also has a *join link* that the leader (or pastor) shares
in the group's WhatsApp or sends to each member; members who join show as "📱 On the app". A leader can make a new join
link at any time, which stops the old one.
- **Welcome team:** adds visitors and sends welcome messages. Can add a prayer request but can't read any.
- **Visitors:** can only send the two forms. They can never read anything back.

**Prayer requests:** the sender chooses who reads it. "The pastor only" stays with the pastor (and a PA he allows);
it is never passed to a leader. "My group leader" goes to the leader of the group they pick (on the prayer form), or to
whichever leader they are given (on the welcome form).

New visitors are due a first contact within 2 days of assignment; members unseen for 3 weeks show on the Away list
(both set in `assets/config.js`).

## Try it

With the Supabase settings empty, both pages run in **demo mode** with sample people, kept in that browser only.
Serve the folder (for example `python3 -m http.server`) and open `team.html`; switch "Viewing as" to see each role.

## Live setup (done 1 November 2026)

- **Address:** https://theafmchurch.org/welcome/ (visitor page; the QR code opens this) and
  https://theafmchurch.org/welcome/team.html (team and members). Hosted with the church website
  (afm-church repo, `welcome/` folder, GitHub Pages). To update, copy `index.html`, `team.html`,
  `manifest.webmanifest` and `assets/` into that folder.
- **Database:** the AFM HUB Supabase project, in its own schema `care` (`supabase/schema.sql`, safe to run again).
  `care` is added to the API's exposed schemas. AFM HUB's own tables are untouched.
- **Sign-in:** email code (sent from hello@theafmchurch.org) or Google. The magic-link email shows the code.
  `https://theafmchurch.org/welcome/**` is in the allowed redirect list.
  WhatsApp codes: set up Twilio's WhatsApp sender in Supabase (Authentication → Phone), then set
  `signIn.whatsapp: true` in `assets/config.js`.
- **First pastor:** hello@theafmchurch.org. Everyone else is invited from the app (Home → Team & groups).
- **QR code:** `welcome/qr.svg` on the website; printable card in the release notes.

## Data protection

The forms record consent with a timestamp and explain who sees the details. Records are kept while someone is part
of the church; the pastor deletes a record (with its notes and prayer requests) when someone asks.
Leaders' phone numbers are never shown publicly.
