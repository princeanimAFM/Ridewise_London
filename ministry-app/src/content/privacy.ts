/**
 * Privacy Policy for The AFM HUB. Shown on the Privacy Policy screen and
 * published as a web page (docs/privacy.html) for the App Store and Google Play.
 *
 * Keep this in step with what the app actually does. If you add accounts,
 * analytics, payments or notifications, update the relevant sections.
 */

export const privacy = {
  title: 'Privacy Policy',
  appName: 'The AFM HUB',
  publisher: 'The AFM Family Network (Alleluia Faith Mission)',
  effectiveDate: '26 September 2026',
  contactEmail: 'princeanim88@gmail.com',

  summary:
    'The AFM HUB does not ask you to create an account, does not track you, does not show ads and does not sell your information. Most of the app works without sending us anything about you.',

  sections: [
    {
      heading: 'Who we are',
      body: [
        'The AFM HUB is the official app of Prophet Micah Felix Azanduna (D.D) and the AFM Family Network. This policy explains what information the app handles and why. Questions can be sent to princeanim88@gmail.com.',
      ],
    },
    {
      heading: 'Information we do not collect',
      body: [
        'You can use the app without an account. We do not collect your name, phone number, contacts, photos, location or device identifiers, and we do not use advertising, analytics or tracking tools.',
      ],
    },
    {
      heading: 'Prayer requests and messages',
      body: [
        'When you send a prayer request or tap "Email us", the app opens your own email app with the message filled in. Nothing is sent until you press send in your email app. The message then goes to the ministry’s email address, like any other email, and is read by the ministry team to pray with you and reply. We do not share prayer requests with anyone outside the ministry.',
        'If you contact us on WhatsApp, WhatsApp’s own privacy policy applies to that conversation.',
      ],
    },
    {
      heading: 'The AFM Assistant',
      body: [
        'The AFM Assistant answers many questions directly on your device. For other questions, the text of your question and the recent messages in that chat are sent securely to our assistant service, which uses Claude, an AI model made by Anthropic, to write the answer. The service runs on Cloudflare.',
        'We do not ask for your name or link questions to you, and we do not keep a history of your chats: when you close the Assistant, the conversation is gone from the app. Your internet address is used briefly to prevent abuse (limiting how many questions can be sent per minute). Anthropic processes the questions to produce answers under its commercial terms and does not use them to train its models by default. Please do not type sensitive personal information into the Assistant.',
      ],
    },
    {
      heading: 'Sermons, videos and links',
      body: [
        'Sermons play from The AFM Podcast on Podbean. When you open or play a sermon, your device connects to Podbean to fetch the episode list and audio, and Podbean can see your device’s internet address, as with any website.',
        'Buttons for YouTube, Spotify, Apple Podcasts, Telegram, Facebook, Instagram and Amazon open those services, which have their own privacy policies. Purchases of books are made on Amazon, not in the app.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'The app is suitable for all ages and does not knowingly collect personal information from children. If you believe a child has sent us personal information, email us and we will delete it.',
      ],
    },
    {
      heading: 'Keeping and deleting information',
      body: [
        'The app itself stores nothing about you on our servers. Emails you send to the ministry are kept only as long as needed to respond and pray with you. To ask us to delete an email you sent, or for any other privacy request, write to princeanim88@gmail.com.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If the app changes in a way that affects your privacy, for example by adding accounts or notifications, we will update this policy and its date. The latest version is always available in the app under More → Privacy Policy.',
      ],
    },
  ],
};
