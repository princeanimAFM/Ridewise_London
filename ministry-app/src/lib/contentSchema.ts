import type { LinkItem } from '@/content/ministry';
import type { IconName } from '@/components/ui';
import type { ContentKey } from './liveContent';

/** The areas the owner can edit in Owner dashboard → Edit app content, and their fields. */
export type FieldDef = {
  key: string;
  label: string;
  kind?: 'text' | 'multiline' | 'url' | 'email' | 'phone' | 'image' | 'file' | 'switch' | 'choice';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Starts a new heading on the form. */
  group?: string;
  options?: { value: string; label: string }[];
};

type Base = { key: ContentKey; title: string; subtitle: string; icon: IconName; intro: string; fields: FieldDef[] };
export type ObjectSection = Base & { type: 'object' };
export type ListSection = Base & {
  type: 'list';
  itemName: string;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  searchable?: boolean;
  /** New items go to the top of the list instead of the bottom. */
  addToTop?: boolean;
};
export type Section = ObjectSection | ListSection;

const linkIcons: { value: LinkItem['icon']; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple', label: 'Apple' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'x', label: 'X' },
  { value: 'mail', label: 'Email' },
  { value: 'book', label: 'Book' },
  { value: 'archive', label: 'Archive' },
  { value: 'globe', label: 'Website' },
];

const linkFields: FieldDef[] = [
  { key: 'label', label: 'Name', required: true, placeholder: 'e.g. Follow on Instagram' },
  { key: 'url', label: 'Link', kind: 'url', required: true, placeholder: 'https://…' },
  { key: 'icon', label: 'Icon', kind: 'choice', required: true, options: linkIcons },
  { key: 'description', label: 'Small text under the name', placeholder: 'e.g. @thebrandafm' },
];

export const sections: Section[] = [
  {
    key: 'books',
    type: 'list',
    title: 'Books',
    subtitle: 'Add new releases, covers and Amazon links',
    icon: 'book-outline',
    intro: 'Books appear in Store → AFM Books, on Home and on the Biography screen, in this order.',
    itemName: 'book',
    titleField: 'title',
    subtitleField: 'subtitle',
    imageField: 'cover',
    addToTop: true,
    fields: [
      { key: 'cover', label: 'Cover', kind: 'image' },
      { key: 'title', label: 'Title', required: true },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'description', label: 'Description', kind: 'multiline' },
      { key: 'amazonUrl', label: 'Amazon link', kind: 'url', required: true, placeholder: 'https://www.amazon.com/dp/…' },
      { key: 'price', label: 'Price (optional)', placeholder: 'e.g. $14.99' },
    ],
  },
  {
    key: 'library',
    type: 'list',
    title: 'Library: free e-books & files',
    subtitle: 'Upload PDFs everyone can read in the app',
    icon: 'document-text-outline',
    intro: 'Free e-books, sermon notes, programmes and other files. Everyone can open them in the app from More → Library, and on the website.',
    itemName: 'file',
    titleField: 'title',
    subtitleField: 'description',
    imageField: 'cover',
    addToTop: true,
    fields: [
      { key: 'file', label: 'File (PDF)', kind: 'file', required: true, hint: 'PDF works best. Word documents also open.' },
      { key: 'title', label: 'Title', required: true, placeholder: 'e.g. The Year of the Blessing: Study Guide' },
      { key: 'description', label: 'Short description', kind: 'multiline' },
      { key: 'cover', label: 'Cover picture (optional)', kind: 'image' },
    ],
  },
  {
    key: 'perfumes',
    type: 'list',
    title: 'Perfumes',
    subtitle: 'House of Azanduna bottles, photos and prices',
    icon: 'sparkles-outline',
    intro: 'Before launch, these show as the sneak peek on the Coming soon page (photo and name). To open the shop, turn on "Launched" in Theme, contact & settings, and each perfume becomes a product with its details and buy link.',
    itemName: 'perfume',
    titleField: 'name',
    subtitleField: 'price',
    imageField: 'image',
    fields: [
      { key: 'image', label: 'Photo', kind: 'image' },
      { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Miracle Oud' },
      { key: 'tagline', label: 'Short line', placeholder: 'e.g. Warm · Woody', group: 'Shown after launch' },
      { key: 'description', label: 'Description', kind: 'multiline' },
      { key: 'notes', label: 'Scent notes', placeholder: 'e.g. Oud, Amber, Vanilla', hint: 'Separate with commas.' },
      { key: 'size', label: 'Size', placeholder: 'e.g. 50 ml · 30 ml · 15 ml', hint: 'For several sizes, separate them with · and list the prices in the same order.' },
      { key: 'price', label: 'Price', placeholder: 'e.g. GH₵ 650 · GH₵ 400 · GH₵ 200' },
      { key: 'video', label: 'Video: the vision behind it (optional)', kind: 'url', placeholder: 'https://youtu.be/… or a Google Drive link', hint: 'YouTube, or a Google Drive video shared as "Anyone with the link".' },
      { key: 'buyUrl', label: 'Buy link (optional)', kind: 'url', placeholder: 'https://…', hint: 'Without a link, people are asked to order by WhatsApp or email.' },
    ],
  },
  {
    key: 'quotes',
    type: 'list',
    title: 'Quotes',
    subtitle: 'Add, edit or remove AFM quotes',
    icon: 'chatbubble-ellipses-outline',
    intro: 'Quotes appear on the Quotes tab, as the Quote of the Day and in the daily quote notification. Each one is signed "— AFM".',
    itemName: 'quote',
    titleField: 'text',
    searchable: true,
    addToTop: true,
    fields: [{ key: 'text', label: 'Quote', kind: 'multiline', required: true, hint: 'No need to add "AFM"; it is added underneath automatically.' }],
  },
  {
    key: 'giving',
    type: 'list',
    title: 'Giving details',
    subtitle: 'PayPal, Cash App, MoMo, bank accounts',
    icon: 'heart-outline',
    intro: 'Shown on the Give screen with copy buttons, and in every newsletter. The message above them is in Theme, contact & settings.',
    itemName: 'giving method',
    titleField: 'label',
    subtitleField: 'value',
    fields: [
      { key: 'label', label: 'Name', required: true, placeholder: 'e.g. MTN Mobile Money (MoMo)' },
      { key: 'value', label: 'Number, tag or account', required: true, placeholder: 'e.g. 0554405880' },
      { key: 'url', label: 'Payment link (optional)', kind: 'url', placeholder: 'https://…', hint: 'Adds a "Give" button, e.g. a PayPal.me link.' },
      { key: 'note', label: 'Note (optional)', placeholder: 'e.g. Ghana, or Account name: …' },
    ],
  },
  {
    key: 'services',
    type: 'list',
    title: 'Service times',
    subtitle: 'Weekly services and programmes',
    icon: 'time-outline',
    intro: 'Shown on the Live screen and used by the AFM Assistant. The church address is in Theme, contact & settings.',
    itemName: 'service',
    titleField: 'day',
    subtitleField: 'detail',
    fields: [
      { key: 'day', label: 'Day', required: true, placeholder: 'e.g. Sunday' },
      { key: 'detail', label: 'Service and time', required: true, placeholder: 'e.g. Worship Service · 10:00 AM GMT' },
    ],
  },
  {
    key: 'socials',
    type: 'list',
    title: 'Social media links',
    subtitle: 'YouTube, Telegram, TikTok, Instagram…',
    icon: 'share-social-outline',
    intro: 'Shown on Home, Sermons, Contact Us and in every newsletter, in this order.',
    itemName: 'link',
    titleField: 'label',
    subtitleField: 'description',
    fields: linkFields,
  },
  {
    key: 'archive',
    type: 'list',
    title: 'Archive links',
    subtitle: 'Sermon archives and Telegram channels',
    icon: 'archive-outline',
    intro: 'Shown on the Archive screen.',
    itemName: 'link',
    titleField: 'label',
    subtitleField: 'description',
    fields: linkFields,
  },
  {
    key: 'details',
    type: 'object',
    title: 'Theme, contact & settings',
    subtitle: 'Theme of the year, email, WhatsApp, live, store',
    icon: 'settings-outline',
    intro: 'General details used across the app and in newsletters.',
    fields: [
      { key: 'themeYear', label: 'Year', group: 'Theme of the year', placeholder: '2026' },
      { key: 'themeTitle', label: 'Theme', placeholder: 'Our Year of the Blessing', hint: 'Shown on Home, the Give screen and in every newsletter.' },
      { key: 'email', label: 'Contact email', kind: 'email', group: 'Contact', hint: 'Receives prayer requests and messages from the app.' },
      { key: 'whatsapp', label: 'WhatsApp number (optional)', kind: 'phone', placeholder: '233201234567', hint: 'Country code first, no + or spaces. Adds WhatsApp buttons.' },
      { key: 'givingIntro', label: 'Message on the Give screen', kind: 'multiline', group: 'Giving' },
      { key: 'givingUrl', label: 'Main giving link', kind: 'url', hint: 'The "Give an offering" button in newsletters, e.g. the PayPal link.' },
      { key: 'address', label: 'Church address (optional)', kind: 'multiline', group: 'Church' },
      { key: 'youtubeHandle', label: 'YouTube channel for live services', group: 'Live services', placeholder: 'thebrandmicah', hint: 'The name after @ in the channel link.' },
      { key: 'channelId', label: 'YouTube channel ID (optional)', placeholder: 'UC…', hint: 'Plays live services in the embedded player. YouTube Studio → Settings → Channel → Advanced.' },
      { key: 'storeLaunched', label: 'Launched: open the shop', kind: 'switch', group: 'House of Azanduna', hint: 'Off shows "Coming soon" with the sneak peek. On shows the perfumes as products.' },
      { key: 'brandStory', label: 'Brand story', kind: 'multiline' },
      { key: 'collectionName', label: 'Name on the bottles', placeholder: 'Rabbi Azanduna' },
      { key: 'shopUrl', label: 'Online shop link (optional)', kind: 'url', placeholder: 'https://…' },
    ],
  },
];
