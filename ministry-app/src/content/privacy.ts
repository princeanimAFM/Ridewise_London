/**
 * Privacy Policy for The AFM HUB. Shown on the Privacy Policy screen and
 * published as a web page (docs/privacy.html, via
 * `node scripts/build-privacy-page.js`) for the App Store and Google Play.
 *
 * Written to cover the usual requirements: Apple App Store and Google Play
 * policies, the EU/UK GDPR, the California Consumer Privacy Act (CCPA/CPRA)
 * and children's privacy rules (COPPA). Keep it in step with what the app
 * actually does: if you add accounts, analytics, notifications, payments or
 * the House of Azanduna shop, update the relevant sections and the date.
 */

export type PrivacySection = { heading: string; body?: string[]; bullets?: string[]; after?: string[] };

export const privacy = {
  title: 'Privacy Policy',
  appName: 'The AFM HUB',
  publisher: 'The AFM Family Network (Alleluia Faith Mission)',
  effectiveDate: '26 September 2026',
  contactEmail: 'princeanim88@gmail.com',

  summary:
    'The AFM HUB does not require an account, does not show ads, does not track you across apps or websites, and does not sell or share your personal information. The only personal information we receive is what you choose to send us, such as a prayer request or a question to the AFM Assistant.',

  sections: [
    {
      heading: '1. Who we are',
      body: [
        'The AFM HUB ("the app") is published by The AFM Family Network (Alleluia Faith Mission) ("we", "us", "our"), the ministry of Prophet Micah Felix Azanduna (D.D). We are responsible for the personal information described in this policy (the "data controller" under EU and UK law).',
        'Contact for all privacy matters: princeanim88@gmail.com.',
      ],
    },
    {
      heading: '2. What this policy covers',
      body: [
        'This policy applies to the app on iPhone, iPad, Android and the web. It does not cover other websites or services the app links to, such as YouTube, Spotify, Apple Podcasts, Podbean, Telegram, Facebook, Instagram, WhatsApp or Amazon, which have their own privacy policies.',
      ],
    },
    {
      heading: '3. Information we collect',
      body: ['a) Information you choose to give us:'],
      bullets: [
        'Prayer requests and emails: your name (optional), your email address, and the content of your message, when you send a prayer request or contact us by email.',
        'Questions to the AFM Assistant: the text of your questions and the recent messages in that chat, when a question needs the AI service to answer it.',
        'Launch notifications: your email address, if you email us to be told when a product such as the House of Azanduna collection launches.',
      ],
      after: [
        'b) Technical information handled automatically: when the app loads sermons or answers an Assistant question, the services involved (see section 6) receive standard technical information such as your IP address, device type and the time of the request, as happens with any internet connection.',
        'c) Information we do not collect: we do not collect your precise or approximate location, contacts, photos, microphone or camera input, health information, payment details, advertising identifiers or browsing history. The app has no accounts, no analytics or crash-reporting tools, and no advertising.',
      ],
    },
    {
      heading: '4. How we use information',
      bullets: [
        'To read, pray over and respond to prayer requests and messages you send us.',
        'To answer your questions in the AFM Assistant.',
        'To send you a launch notice you asked for.',
        'To keep the app and its services working securely, including preventing abuse (for example, limiting how many Assistant questions can be sent each minute).',
        'To meet legal obligations.',
      ],
      after: ['We do not use your information for advertising, profiling, or automated decisions that have legal or similarly significant effects on you.'],
    },
    {
      heading: '5. Legal bases (EU and UK users)',
      bullets: [
        'Consent: when you choose to send a prayer request, email or Assistant question. You can withdraw consent at any time by contacting us; this does not affect earlier processing.',
        'Legitimate interests: to run the app securely and prevent abuse, where these interests are not overridden by your rights.',
        'Legal obligation: where we must keep or disclose information by law.',
      ],
      after: [
        'Prayer requests may reveal religious beliefs, which the law treats as special category information. We process this only because you choose to send it to us (your explicit consent) and only to pray with you and reply.',
      ],
    },
    {
      heading: '6. Who we share information with',
      body: ['We do not sell or rent personal information, and we do not share it for targeted advertising. We share information only with service providers that help run the app, under their own terms and privacy commitments:'],
      bullets: [
        'Anthropic (Claude), which writes AFM Assistant answers. It processes questions under its commercial terms and does not use them to train its models by default.',
        'Cloudflare, which hosts the AFM Assistant service.',
        'Podbean, which hosts and streams The AFM Podcast.',
        'Our email provider, which delivers and stores emails you send us.',
        'Apple and Google, which distribute the app and may collect information under their own policies when you download or update it.',
      ],
      after: ['We may also disclose information if required by law, to protect the rights, safety or property of our users, the ministry or others, or as part of a change in the organisation responsible for the app.'],
    },
    {
      heading: '7. International transfers',
      body: [
        'Our service providers may process information in countries other than your own, including the United States. Where the law requires it, these transfers are protected by safeguards such as the European Commission’s Standard Contractual Clauses or equivalent measures.',
      ],
    },
    {
      heading: '8. How long we keep information',
      bullets: [
        'Prayer requests and emails: for as long as needed to pray with you and respond, and no longer than 24 months, unless you ask us to delete them sooner.',
        'AFM Assistant chats: we do not keep a history. The conversation is cleared from the app when you close the Assistant. Our service providers may keep request logs for a short period for security and abuse prevention, under their own policies.',
        'Launch-notification emails: until the launch notice is sent or you ask us to stop.',
      ],
    },
    {
      heading: '9. How we protect information',
      body: [
        'Information sent between the app and our services is encrypted in transit (HTTPS). We keep the information we receive to a minimum and limit access to the ministry team members who need it. No method of transmission or storage is completely secure, but we work to protect your information.',
      ],
    },
    {
      heading: '10. Your rights',
      body: ['Depending on where you live, you may have the right to:'],
      bullets: [
        'Access the personal information we hold about you and get a copy of it.',
        'Correct information that is inaccurate or incomplete.',
        'Delete your information.',
        'Restrict or object to how we use it.',
        'Receive your information in a portable format.',
        'Withdraw consent at any time.',
        'Complain to your data protection authority (for example, the Information Commissioner’s Office in the UK, or your local authority in the EU).',
      ],
      after: [
        'California residents: you have the right to know what personal information we collect, use and disclose; to request its deletion or correction; and not to be discriminated against for using these rights. We do not sell or share personal information as defined by the CCPA/CPRA, and we do not use sensitive personal information to infer characteristics about you.',
        'To use any of these rights, email princeanim88@gmail.com. We will reply within one month (or within the time your local law requires) and may ask you to confirm your identity first.',
      ],
    },
    {
      heading: '11. Children',
      body: [
        'The app is suitable for all ages but is not directed at children under 13, and we do not knowingly collect personal information from children under 13 (or under 16 where local law requires). Children should ask a parent or guardian before sending a prayer request or using the AFM Assistant. If you believe a child has sent us personal information, contact us and we will delete it.',
      ],
    },
    {
      heading: '12. Links and future features',
      body: [
        'The app links to other services such as YouTube, Amazon and social media. We are not responsible for their privacy practices.',
        'Some features are planned, such as the House of Azanduna shop. If a new feature collects additional information (for example, orders, payments or notifications), we will update this policy before it launches and, where required, ask for your consent.',
      ],
    },
    {
      heading: '13. Changes to this policy',
      body: [
        'We may update this policy from time to time. We will change the effective date at the top and, for significant changes, give notice in the app. The latest version is always available in the app under More → Privacy Policy.',
      ],
    },
    {
      heading: '14. Contact us',
      body: ['For questions, requests or complaints about privacy, email princeanim88@gmail.com.'],
    },
  ] as PrivacySection[],
};
