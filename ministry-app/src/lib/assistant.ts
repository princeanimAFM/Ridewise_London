import { Platform } from 'react-native';
import { biography } from '@/content/biography';
import { handbook } from '@/content/handbook';
import { liveMinistry as ministry } from './liveContent';
import { buildInstructions } from './assistantKnowledge';
import { quoteOfTheDay } from './content';

/** A button under an assistant reply: open a screen in the app, or a link. */
export type AssistantAction = { label: string; route?: string; params?: Record<string, string>; url?: string };
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply = { text: string; actions: AssistantAction[]; source: 'guide' | 'ai' | 'fallback' };

// ---------------------------------------------------------------------------
// Built-in guide: instant answers from the app's own content, no AI needed.
// ---------------------------------------------------------------------------

const go = (label: string, route: string, params?: Record<string, string>): AssistantAction => ({ label, route, params });

type Intent = { words: string[]; phrases?: string[]; reply: () => { text: string; actions: AssistantAction[] } };

const faq = (q: string) => handbook.faqs.find((f) => f.q.toLowerCase().includes(q.toLowerCase()));
const faqText = (q: string) => {
  const f = faq(q);
  return f ? f.a[f.a.length > 1 ? 1 : 0] : '';
};

const intents: Intent[] = [
  {
    words: ['hi', 'hello', 'hey', 'help', 'menu', 'navigate'],
    phrases: ['what can you do', 'good morning', 'good evening'],
    reply: () => ({
      text: `Welcome to ${ministry.name}! I can help you find sermons, quotes, Prophet Micah's books, the AFM Handbook, the Mission Statement, and how to get in touch. What would you like to do?`,
      actions: [go('Sermons', '/sermons'), go('Handbook', '/handbook'), go('Books', '/store', { tab: 'books' }), go('Contact Us', '/connect')],
    }),
  },
  {
    words: ['sermon', 'sermons', 'message', 'messages', 'podcast', 'listen', 'audio', 'preaching', 'teaching', 'episode'],
    reply: () => ({
      text: `Open the Sermons tab to search and play The AFM Podcast (500+ audio messages) right inside the app. You can also watch on YouTube or listen on Spotify and Apple Podcasts.`,
      actions: [go('Open Sermons', '/sermons'), { label: 'YouTube', url: ministry.socials.find((s) => s.id === 'yt')?.url }],
    }),
  },
  {
    words: ['book', 'books', 'amazon', 'buy', 'author'],
    phrases: ['maker of men', '1001', 'voice of honor', 'voice of honour'],
    reply: () => ({
      text: `Prophet Micah has written ${ministry.books.map((b) => b.title).join(', ')}. Open Store → AFM Books and tap "Buy on Amazon" on any book.`,
      actions: [go('AFM Books', '/store', { tab: 'books' }), ...ministry.books.map((b) => go(b.title, '/book/[id]', { id: b.id }))],
    }),
  },
  {
    words: ['perfume', 'perfumes', 'fragrance', 'fragrances', 'scent', 'cologne', 'azanduna'],
    phrases: ['house of'],
    reply: () => ({
      text: ministry.fragrances.launched
        ? `${ministry.fragrances.brandName} is the luxury perfume brand founded by Prophet Micah. Open Store → ${ministry.fragrances.brandName} to see the collection.`
        : `${ministry.fragrances.brandName} is the luxury perfume brand founded by Prophet Micah, and it is launching soon. Open Store → ${ministry.fragrances.brandName} to ask to be told at launch.`,
      actions: [go(ministry.fragrances.brandName, '/store', { tab: 'fragrance' })],
    }),
  },
  {
    words: ['handbook', 'conduct', 'rules', 'rule'],
    phrases: ['code of conduct'],
    reply: () => ({
      text: `The AFM Handbook has the FAQs, the anchor scripture (Isaiah 60), the AFM slogans and the 53-point Code of Conduct, from "The Place of Honour" to "The AFM Young Minister".`,
      actions: [go('Open the Handbook', '/handbook')],
    }),
  },
  {
    words: ['youuseme', 'youth', 'young'],
    phrases: ['young and useful'],
    reply: () => ({
      text: 'Young and Useful (YouUseMe) is a summit founded by Prophet Micah to gather young people and nurture them through kingdom principles, so they rise early to fill vacuums in the church and the corporate world. Its conviction: “no one becomes great in this life by mistake, by miracle or by breakthrough” but through the right principles applied continually.',
      actions: [go('Read in the Handbook', '/handbook'), go('Biography', '/biography')],
    }),
  },
  {
    words: [],
    phrases: ['family meeting', 'family meetings'],
    reply: () => ({ text: faqText('family meeting'), actions: [go('Read in the Handbook', '/handbook')] }),
  },
  {
    words: [],
    phrases: ['prayer connect'],
    reply: () => ({ text: faqText('Prayer Connect'), actions: [go('Read in the Handbook', '/handbook')] }),
  },
  {
    words: ['join', 'member', 'membership'],
    reply: () => ({
      text: `${faqText('Who can join')} To get connected, email ${ministry.contact.email}.`,
      actions: [go('Mission Statement', '/about'), go('Contact Us', '/connect')],
    }),
  },
  {
    words: ['church', 'denomination'],
    reply: () => ({ text: faqText('church or denomination'), actions: [go('Read in the Handbook', '/handbook')] }),
  },
  {
    words: ['scripture', 'isaiah', 'verse', 'anchor'],
    reply: () => ({
      text: `The anchor scripture of the AFM Family Network is Isaiah 60: "${handbook.anchorScripture.verses[0]}"`,
      actions: [go('Read Isaiah 60', '/handbook')],
    }),
  },
  {
    words: ['slogan', 'slogans', 'arise', 'shine', 'alleluia'],
    reply: () => ({ text: `The AFM slogans are:\n${handbook.slogans.map((s) => `• ${s}`).join('\n')}`, actions: [go('Open the Handbook', '/handbook')] }),
  },
  {
    words: ['mission', 'vision', 'invitation'],
    phrases: ['mission statement'],
    reply: () => ({
      text: `${ministry.about.missionStatement.sections[0].text} ${ministry.about.missionStatement.sections[1].heading}: ${ministry.about.missionStatement.sections[1].text}`,
      actions: [go('About Ministry', '/about')],
    }),
  },
  {
    words: ['prophet', 'micah', 'biography', 'bio', 'founder', 'pastor', 'rabbi', 'mentor', 'mentored'],
    reply: () => ({ text: `${biography.intro[0]} ${biography.intro[1]}`, actions: [go('Read his Biography', '/biography')] }),
  },
  {
    words: ['quote', 'quotes', 'inspiration', 'inspire', 'saying', 'sayings'],
    reply: () => ({
      text: `Today's quote: "${quoteOfTheDay().text}" — ${ministry.quoteSource}. There are ${ministry.quotes.length} quotes on the Quotes tab, each with a Share button.`,
      actions: [go('Open Quotes', '/quotes')],
    }),
  },
  {
    words: ['pray', 'prayer', 'praying'],
    reply: () => ({
      text: `We would love to pray with you. Open Prayer Request, write your request and send it by email to the ministry team.`,
      actions: [go('Prayer Request', '/prayer')],
    }),
  },
  {
    words: ['contact', 'email', 'phone', 'whatsapp'],
    reply: () => ({ text: `You can reach the ministry by email at ${ministry.contact.email}.`, actions: [go('Contact Us', '/connect'), { label: 'Send an email', url: `mailto:${ministry.contact.email}` }] }),
  },
  {
    words: ['youtube', 'telegram', 'spotify', 'instagram', 'facebook', 'tiktok', 'social', 'follow', 'channel'],
    reply: () => ({
      text: `Follow Prophet Micah on YouTube (@thebrandmicah), Instagram (@thebrandafm), TikTok (@dr_micah_azanduna and @rabbiazanduna), Telegram (@rabbimicah) and Facebook. All the links are on the Contact Us screen.`,
      actions: [go('Contact Us', '/connect')],
    }),
  },
  {
    words: ['give', 'giving', 'donate', 'donation', 'offering', 'offerings', 'tithe', 'paypal', 'momo', 'cashapp', 'bank', 'seed'],
    phrases: ['cash app', 'mobile money', 'v cash'],
    reply: () => ({
      text: `Thank you for supporting the ministry! You can give by:\n${ministry.giving.methods.map((m) => `• ${m.label}: ${m.value}`).join('\n')}\nThe Give screen has copy buttons for each one.`,
      actions: [go('Open Give', '/give'), { label: 'PayPal', url: ministry.contact.givingUrl }],
    }),
  },
  {
    words: ['live', 'stream', 'streaming', 'watch', 'service', 'services', 'church'],
    phrases: ['live service', 'live stream'],
    reply: () => ({ text: 'You can watch live services inside the app on the Live screen. When Prophet Micah is ministering live on YouTube, it plays there.', actions: [go('Watch Live', '/live'), go('Notifications', '/notifications')] }),
  },
  {
    words: ['newsletter', 'subscribe', 'subscription', 'unsubscribe', 'updates'],
    reply: () => ({
      text: 'Subscribe to the AFM Newsletter to get announcements, flyers and upcoming programmes by email or text message. Every message has a one-tap unsubscribe link.',
      actions: [go('Subscribe', '/subscribe'), go('Announcements', '/announcements')],
    }),
  },
  {
    words: ['announcement', 'announcements', 'programme', 'programmes', 'program', 'programs', 'event', 'events', 'flyer', 'upcoming'],
    reply: () => ({ text: 'Upcoming programmes and flyers are on the Announcements screen.', actions: [go('Announcements', '/announcements'), go('Get them by email or text', '/subscribe')] }),
  },
  {
    words: ['account', 'login', 'signin', 'sign', 'password', 'register', 'signup'],
    reply: () => ({
      text: 'You can create an account with your email, your Google account or your phone number from More → Sign in. If you forget your password, tap "Forgot password?" and we will email you a code.',
      actions: [go('Sign in', '/account'), go('Reset password', '/account/forgot')],
    }),
  },
  {
    words: ['theme', 'year'],
    phrases: ['year of the blessing'],
    reply: () => ({ text: `Our theme for ${ministry.themeOfTheYear.year} is "${ministry.themeOfTheYear.title}".`, actions: [go('About Ministry', '/about')] }),
  },
  {
    words: ['archive', 'hagin'],
    reply: () => ({ text: 'The Archive has The AFM Podcast, the YouTube channel and the Telegram channels.', actions: [go('Open Archive', '/archive')] }),
  },
];

const normalize = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Best matching built-in answer, or null when the question needs the AI. */
export function guideAnswer(question: string): AssistantReply | null {
  const q = normalize(question);
  const words = new Set(q.split(' '));
  let best: { score: number; intent: Intent } | null = null;
  intents.forEach((intent, i) => {
    let score = intent.words.filter((w) => words.has(w)).length;
    score += (intent.phrases ?? []).filter((p) => q.includes(normalize(p))).length * 2;
    // Earlier intents win ties, except the greeting, which only wins on its own.
    if (i === 0 && words.size > 4) score = Math.min(score, 0);
    if (score > 0 && (!best || score > best.score)) best = { score, intent };
  });
  if (!best) return null;
  const { text, actions } = (best as { intent: Intent }).intent.reply();
  return { text, actions: actions.filter((a) => a.route || a.url), source: 'guide' };
}

/** Screen buttons to attach to an AI answer, based on what was asked and said. */
function suggestActions(question: string, answer: string): AssistantAction[] {
  const hit = guideAnswer(`${question} ${answer}`);
  return hit ? hit.actions.slice(0, 3) : [];
}

// ---------------------------------------------------------------------------
// AI answers. Two ways to reach Claude, tried in order:
//  1. The AFM Assistant server (server/ in this project), when its URL is set.
//  2. On the claude.ai preview page, the viewer's own Claude via `sample`.
// ---------------------------------------------------------------------------

type SampleFn = ((input: ChatTurn[], opts?: { cache?: boolean; modelTier?: string }) => Promise<{ text: string }>) | null;
let samplePromise: Promise<SampleFn> | undefined;

function getSample(): Promise<SampleFn> {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  const claude = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (!claude?.use) return Promise.resolve(null);
  samplePromise ??= claude.use('sample').then((s) => (s as SampleFn) ?? null).catch(() => null);
  return samplePromise;
}

/** True when this device can reach an AI model at all (used to set expectations in the UI). */
export async function aiAvailable() {
  return !!ministry.assistant.apiUrl || !!(await getSample());
}

async function askServer(history: ChatTurn[]): Promise<string> {
  const res = await fetch(ministry.assistant.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history }),
  });
  if (!res.ok) throw new Error(`Assistant server returned ${res.status}`);
  const data = (await res.json()) as { text?: string };
  if (!data.text) throw new Error('Empty reply');
  return data.text;
}

let instructions: string | undefined;

async function askSample(sample: NonNullable<SampleFn>, history: ChatTurn[]): Promise<string> {
  instructions ??= buildInstructions();
  // `sample` has no system prompt: standing instructions go in a leading user turn.
  const { text } = await sample([{ role: 'user', content: instructions }, ...history], { cache: false, modelTier: 'quick' });
  return text;
}

const MAX_TURNS = 12;

/** Answer a question: built-in guide first, then AI, then a helpful fallback. */
export async function answer(question: string, history: ChatTurn[]): Promise<AssistantReply> {
  const guided = guideAnswer(question);
  // Short, clearly navigational questions get the instant answer.
  if (guided && normalize(question).split(' ').length <= 8) return guided;

  const turns = [...history, { role: 'user' as const, content: question }].slice(-MAX_TURNS);
  while (turns[0]?.role === 'assistant') turns.shift();
  try {
    let text: string | undefined;
    if (ministry.assistant.apiUrl) text = await askServer(turns);
    else {
      const sample = await getSample();
      if (sample) text = await askSample(sample, turns);
    }
    if (text) return { text: text.trim(), actions: suggestActions(question, text), source: 'ai' };
  } catch {
    // fall through to the guide / fallback
  }
  if (guided) return guided;
  return {
    text: `I'm not sure about that one. I can help with sermons, quotes, Prophet Micah's books and biography, the AFM Handbook and the Mission Statement. For anything else, email ${ministry.contact.email}.`,
    actions: [go('Handbook', '/handbook'), go('About Ministry', '/about'), { label: 'Email the ministry', url: `mailto:${ministry.contact.email}` }],
    source: 'fallback',
  };
}

export const suggestedQuestions = [
  'Where can I listen to sermons?',
  'Who is Prophet Micah?',
  'What is YouUseMe?',
  'How do I buy his books?',
  'What are the AFM slogans?',
  'How can I send a prayer request?',
];
