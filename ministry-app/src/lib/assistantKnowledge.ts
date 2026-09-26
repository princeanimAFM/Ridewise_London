import { biography } from '@/content/biography';
import { handbook } from '@/content/handbook';
import { ministry } from '@/content/ministry';

/**
 * Everything the AFM Assistant knows, as plain text. Built from the same
 * content files the screens use, so updating the app updates the assistant.
 * `scripts/build-assistant-knowledge.js` writes this text for the server too.
 */
export function buildKnowledge(): string {
  const m = ministry;
  const ms = m.about.missionStatement;
  let rule = 0;
  const lines: string[] = [];
  const add = (...l: string[]) => lines.push(...l, '');

  add(
    `# ${m.name}`,
    `The official app of ${m.minister} and the AFM Family Network. Tagline: "${m.tagline}"`,
  );

  add(
    '## Screens in the app (how to navigate)',
    '- Home tab: shortcuts, "Stream All 500+ Audio Sermons", Quote of the Day, latest messages, Meet the Prophet, AFM Books.',
    '- Sermons tab: The AFM Podcast episodes (search and play inside the app), plus YouTube, Spotify, Telegram, Apple Podcasts, Facebook and Instagram links.',
    '- Quotes tab: a new Quote of the Day every day and all quotes, each with a Share button.',
    '- Store tab: "AFM Books" (with Buy on Amazon buttons) and "House of Azanduna" fragrances.',
    '- More tab: About Ministry, Biography, The AFM Handbook, Archive, Contact Us, Prayer Request, Share App, Privacy Policy.',
    '- About Ministry: the AFM Mission Statement (vision, mission, process, invitation).',
    `- Biography: the life and ministry of ${m.minister}.`,
    '- The AFM Handbook: FAQs, anchor scripture (Isaiah 60), slogans, and the 53-point Code of Conduct.',
    '- Prayer Request: write a prayer request and send it by email.',
    '- Contact Us: social media links and email.',
  );

  add(
    '## Biography',
    ...biography.intro,
    `Known as: ${biography.knownAs.join(', ')}.`,
    ...biography.facts.map((f) => `- ${f.label}: ${f.value}`),
    ...biography.chapters.flatMap((c) => [`### ${c.title}`, ...c.paragraphs]),
    biography.closing,
  );

  add(
    `## ${ms.title} (About Ministry)`,
    ms.intro.replace(/\n+/g, ' '),
    ...ms.sections.map((s) => `${s.heading.toUpperCase()}: ${s.text}`),
    `Signed: ${ms.signed}`,
  );

  add(
    '## The AFM Handbook',
    `${handbook.subtitle} — "${handbook.motto}"`,
    '### Frequently asked questions',
    ...handbook.faqs.map((f) => `Q: ${f.q}\nA: ${f.a.join(' ')}`),
    `### Anchor scripture: ${handbook.anchorScripture.reference}`,
    `Isaiah 60:1 — ${handbook.anchorScripture.verses[0]}`,
    `Isaiah 60:22 — ${handbook.anchorScripture.verses[handbook.anchorScripture.verses.length - 1]}`,
    '### Slogans (call…response)',
    ...handbook.slogans.map((s) => `- ${s}`),
    '### Code of Conduct',
    ...handbook.codeOfConduct.flatMap((g) => [`${g.title}:`, ...g.rules.map((r) => `${++rule}. ${r}`)]),
  );

  add(
    '## Sermons and media',
    `- ${m.podcast.title} on Podbean (500+ audio messages): ${m.podcast.pageUrl}`,
    ...m.socials.filter((s) => s.url).map((s) => `- ${s.label}: ${s.url}`),
  );

  add(
    '## Books (Store tab → AFM Books)',
    ...m.books.map((b) => `- ${b.title}${b.subtitle ? `: ${b.subtitle}` : ''} — ${b.description} Amazon: ${b.amazonUrl}`),
  );

  add(
    `## ${m.fragrances.brandName} (Store tab)`,
    m.fragrances.brandStory,
    m.fragrances.launched ? 'The collection is available in the Store tab.' : 'The brand has not launched yet. There are no products, prices or ordering yet; people can ask to be told at launch from the Store tab.',
    m.fragrances.launched ? '' : `Sneak peek of the upcoming ${m.fragrances.collectionName} collection by ${m.fragrances.brandName} (the bottles are labelled "${m.fragrances.collectionName}"): ${[...new Set(m.fragrances.previewPhotos.map((p) => p.name))].join(', ')}. No prices or release date yet.`,
  );

  add('## Quotes by AFM', ...m.quotes.map((q) => `- "${q.text}"`));

  add(
    `## Theme for ${m.themeOfTheYear.year}`,
    `"${m.themeOfTheYear.title}"`,
  );

  add(
    '## Giving offerings (Give screen: More → Give an Offering)',
    m.giving.intro,
    ...m.giving.methods.map((g) => `- ${g.label}: ${g.value}${g.note ? ` (${g.note})` : ''}`),
  );

  add(
    '## Newsletter, announcements and accounts',
    '- Newsletter: More → Newsletter. Subscribe with first name plus email and/or mobile number; choose email, text messages or both. Every message greets you by first name and has an unsubscribe link.',
    '- Announcements: More → Announcements shows upcoming programmes and flyers.',
    '- Live services: the Live screen (Home → Watch Live Services, or More → Live Services) streams services from YouTube @thebrandmicah inside the app.',
    '- Notifications: More → Notifications turns on a daily AFM quote and announcement alerts.',
    '- Accounts (optional): More → Sign in. Sign in with email and password, Google, or a text-message code. "Forgot password?" emails a 6-digit code. To delete an account: More → My Account → Request account deletion.',
  );

  add(
    '## Contact',
    `Email: ${m.contact.email}`,
    m.contact.whatsapp ? `WhatsApp: +${m.contact.whatsapp}` : 'WhatsApp: not listed yet.',
    m.about.serviceTimes.length
      ? `Service times: ${m.about.serviceTimes.map((s) => `${s.day} ${s.detail}`).join('; ')}`
      : 'Service times and church address: not listed in the app yet.',
  );

  return lines.join('\n');
}

/** Standing instructions for the assistant, followed by the knowledge. */
export function buildInstructions(): string {
  const m = ministry;
  return `You are the AFM Assistant, a friendly helper inside ${m.name}, the official app of ${m.minister} and the AFM Family Network.

Your job:
- Help people find their way around the app: tell them which tab or screen to open (use the screen names exactly as listed below).
- Answer questions about the ministry, Prophet Micah, the Mission Statement, the Handbook, his books, sermons and fragrance brand, using ONLY the information below.
- If the answer is not in the information below, say you don't have that detail and suggest emailing ${m.contact.email}. Never invent dates, prices, events, locations or quotes.
- You may answer general Bible questions briefly and respectfully, and point people to his sermons for deeper teaching. Don't claim to speak for Prophet Micah or to be him.
- If someone shares a personal struggle, respond with warmth, suggest the Prayer Request screen, and if they may be in danger, encourage them to contact local emergency services or someone they trust right away.

Style: warm, respectful and clear. Keep answers short (2–5 sentences, or a short list). Plain text only, no Markdown headings or tables.

=== APP AND MINISTRY INFORMATION ===
${buildKnowledge()}`;
}
