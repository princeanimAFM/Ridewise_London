import type { ImageSourcePropType } from 'react-native';
import { quoteAuthor, quoteTexts } from './quotes';

/**
 * ALL APP CONTENT LIVES IN THIS FILE.
 *
 * To update the app, edit the values below — no other code needs to change.
 * Anything marked "TODO" still needs the real link or detail filled in.
 * Links left as '' show a friendly "Coming soon" message when tapped.
 *
 * Tips:
 *  - For a YouTube sermon, paste only the video ID (the part after "v=" in the
 *    link). The thumbnail is fetched automatically.
 *  - Images can be a web link ("https://...") or a file in assets/images
 *    loaded with require('../../assets/images/<file>').
 *  - Dates use the format "YYYY-MM-DD".
 */

type ImageSource = string | ImageSourcePropType;

export type Sermon = {
  id: string;
  title: string;
  date: string;
  series?: string;
  scripture?: string;
  summary: string;
  youtubeId?: string;
  audioUrl?: string;
  image?: ImageSource;
};

export type Quote = {
  id: string;
  text: string;
  source?: string;
};

export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  cover?: ImageSource;
  amazonUrl: string;
  price?: string;
};

export type Fragrance = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  notes?: string[];
  size?: string;
  price?: string;
  image?: ImageSource;
  buyUrl?: string;
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
  icon:
    | 'youtube'
    | 'facebook'
    | 'instagram'
    | 'tiktok'
    | 'x'
    | 'telegram'
    | 'spotify'
    | 'apple'
    | 'podcast'
    | 'globe'
    | 'whatsapp'
    | 'mail'
    | 'archive'
    | 'book'
    | 'shield';
  description?: string;
};


export const ministry = {
  name: 'The AFM HUB',
  shortName: 'AFM',
  minister: 'Prophet Micah Felix Azanduna (D.D)',
  /** Theme for the year — shown on Home and in every newsletter. Update each new year. */
  themeOfTheYear: { year: '2026', title: 'Our Year of the Blessing' },
  tagline: 'Raising spiritually grounded and purpose-driven men and women.',
  logo: require('../../assets/images/logo.png') as ImageSource,
  heroImage: require('../../assets/images/prophet-micah.jpg') as ImageSource | undefined,
  portrait: require('../../assets/images/prophet-micah-portrait.jpg') as ImageSource,
  /**
   * Photos used as backgrounds across the app. To change one, put the new
   * photo in assets/photos/ and point the line below at it.
   */
  photos: {
    home: require('../../assets/photos/micah-red-suit-smile.jpg') as ImageSource,
    biography: require('../../assets/photos/micah-red-suit-stool.jpg') as ImageSource,
    about: require('../../assets/photos/micah-blue-suit.jpg') as ImageSource,
    quotes: require('../../assets/photos/micah-white-shirt.jpg') as ImageSource,
    sermons: require('../../assets/photos/micah-red-suit-full.jpg') as ImageSource,
  },
  appShareUrl: 'https://afm-hub.expo.app', // website link used by "Share App"
  // Privacy policy page on the website (needed for the App Store and Google Play listings)
  privacyPolicyUrl: 'https://afm-hub.expo.app/privacy.html',
  // Fill in once the app is live on Google Play: shows "Get it on Google Play" on the website.
  playStoreUrl: '', // 'https://play.google.com/store/apps/details?id=com.afm.hub'

  about: {
    headline: 'About the Ministry',
    story: `Prophet Micah Felix Azanduna (D.D) is a prophet, theologian, apologist, author, and transformational leader whose influence reaches believers across the world. He is the founder of the AFM Family Network, the Alleluia Faith Mission Global Assembly, the Young and Useful Summit (YouUseMe), and The Great Gathering, all dedicated to raising spiritually grounded and purpose-driven men and women.

He is the creator of the popular Hagin Channel on Telegram, established in honor of Kenneth E. Hagin, and also curates a respected theological resource channel on Telegram, providing doctrinal materials from renowned theologians to strengthen young Christians in their walk with God.

A prolific author, Prophet Azanduna has written impactful books such as The 1001 Scriptures: Genesis to Revelation, The Maker of Men, and The Voice of Honor. His mentorship has shaped thousands globally, guiding them into clarity, maturity, and divine purpose.

Known for simplifying deep biblical truths with precision and grace, he is a seasoned transformologist whose teachings inspire change and build strong doctrinal foundations. He is also the founder of the luxury fragrance brand The House of Azanduna, and is widely recognized as The Brand AFM—a symbol of excellence, transformation, and divine assignment.

Prophet Micah Felix Azanduna stands as a prophet, teacher, father, mentor, and change agent, committed to advancing the Kingdom with wisdom, integrity, and power.`,
    missionStatement: {
      title: 'The AFM Mission Statement',
      intro: `The AFM Family Network is a dynamic group of people driven by a common goal, that is, to bring the Kingdom here and now. It is led by God, through His humble servant; Azanduna F. Micah.

The AFM Family Network is incorporated into The Alleluia Faith Mission.`,
      sections: [
        { heading: 'Our Vision', icon: 'eye-outline', text: 'Our vision is to see men and women rise in the Kingdom to fulfil the task at hand; The Great Commission.' },
        { heading: 'Our Mission', icon: 'flag-outline', text: 'To raise men and women to live their lives not as theirs but as channels through which the King of Glory will find expression. That He will use them to cause tremendous and unrecoverable impact down here on earth.' },
        { heading: 'Our Process', icon: 'git-network-outline', text: 'To provide the sheepfold of God with Kingdom Strategies through: The Preaching of the Gospel of our Lord Jesus Christ, Conferences, Seminars, Resources sharing, Fellowship, Partnership and Mentorship.' },
        { heading: 'Our Invitation', icon: 'hand-left-outline', text: 'We believe that every vision set in motion will never lack support. Thus, we invite your prayers, talents and support to keep this moving. According to Napoleon Hill; "Strength and growth come only through continuous effort and struggle." Anyone can join The AFM Family Network.' },
      ] as { heading: string; icon: 'eye-outline' | 'flag-outline' | 'git-network-outline' | 'hand-left-outline'; text: string }[],
      signed: 'Azanduna Felix Micah (President, The AFM)',
    },
    ministries: [
      'AFM Family Network',
      'Alleluia Faith Mission Global Assembly',
      'Young and Useful Summit (YouUseMe)',
      'The Great Gathering',
    ],
    introVideoYoutubeId: '', // TODO: YouTube ID of the video shown on the About screen
    serviceTimes: [] as { day: string; detail: string }[], // TODO: e.g. { day: 'Sunday', detail: 'Worship Service · 10:00 AM' }
    address: '', // TODO: church address, or leave '' to hide
  },

  contact: {
    email: 'theafmfamily@gmail.com', // receives Contact Us messages and prayer requests
    whatsapp: '', // TODO: international format without "+", e.g. "233201234567"
    // Main online giving link (PayPal). Shown as the Give button and in every newsletter.
    givingUrl: 'https://www.paypal.com/paypalme/AfmDiaspora',
  },

  /**
   * The AFM Podcast on Podbean. The app reads the RSS feed live, so every new
   * episode uploaded to Podbean appears in the app automatically.
   */
  podcast: {
    title: 'The AFM Podcast',
    feedUrl: 'https://feed.podbean.com/theafmpodcast/feed.xml',
    pageUrl: 'https://theafmpodcast.podbean.com/',
    shareUrl: 'https://www.podbean.com/pa/pbblog-hshtw-14f15f9',
  },

  /**
   * Live services on YouTube. The Live screen plays whatever is streaming on
   * the channel right now. Optional: add the channel ID (starts with "UC",
   * shown in YouTube Studio → Settings → Channel → Advanced) to use YouTube's
   * embedded player instead of the mobile YouTube page.
   */
  live: {
    youtubeHandle: 'thebrandmicah',
    channelId: '',
  },

  /**
   * Accounts, newsletter and announcements run on Supabase (see supabase/SETUP.md).
   * Paste your project's URL and "anon public" key here. The anon key is safe
   * to include in the app — the database's security rules protect the data.
   * While these are empty, those features show "coming soon".
   */
  backend: {
    supabaseUrl: 'https://huxvyimncwbeqnsugszm.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eHZ5aW1uY3diZXFuc3Vnc3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjUxMTYsImV4cCI6MjEwNjAwMTExNn0.ggmws94tx8aHiicS2Qvh0TXShD540kEftitg8NAwF1Y',
    // Turn these on once set up in Supabase (see supabase/SETUP.md, step 4).
    googleSignIn: false,
    phoneSignIn: false,
  },

  /**
   * Ways to give offerings. Shown on the Give screen (with copy buttons) and in
   * every newsletter. `url` makes the method tappable; leave it out for
   * account numbers people send to from their own app.
   */
  giving: {
    intro: 'Thank you for partnering with the ministry. Your offerings support the preaching of the Gospel, conferences, mentorship and outreach.',
    methods: [
      { id: 'paypal', label: 'PayPal', value: '@AfmDiaspora', url: 'https://www.paypal.com/paypalme/AfmDiaspora', note: 'Card or PayPal balance, from anywhere' },
      { id: 'cashapp', label: 'Cash App', value: '$AsuamahRuth', url: 'https://cash.app/$AsuamahRuth', note: 'United States' },
      { id: 'momo', label: 'MTN Mobile Money (MoMo)', value: '0554405880', note: 'Ghana' },
      { id: 'vcash', label: 'Telecel Cash (V Cash)', value: '0506023820', note: 'Ghana' },
      { id: 'bank', label: 'Bank transfer — Fidelity Bank', value: '2030801199719', note: 'Account name: Micah Felix Azanduna · Sunyani branch' },
    ] as { id: string; label: string; value: string; url?: string; note?: string }[],
  },

  /**
   * The AFM Assistant (chat helper). It always answers common questions from
   * the app's own content. Set `apiUrl` to your deployed assistant server
   * (see server/README.md) to let it answer anything using AI.
   */
  assistant: {
    name: 'AFM Assistant',
    apiUrl: '', // e.g. 'https://afm-assistant.<your-account>.workers.dev'
  },

  /** The "Stream All 500+ Audio Sermons" archive directory. */
  sermonArchive: {
    title: 'Stream All 500+ Audio Sermons',
    subtitle: 'Instantly access the full archive directory of messages',
    url: 'https://theafmpodcast.podbean.com/',
  },

  /** Where people can watch / listen / follow. Shown on Home, Sermons and Connect. */
  socials: [
    { id: 'yt', label: 'Watch on YouTube', url: 'https://youtube.com/@thebrandmicah', icon: 'youtube', description: '@thebrandmicah' },
    { id: 'pb', label: 'The AFM Podcast', url: 'https://theafmpodcast.podbean.com/', icon: 'podcast', description: 'Podbean' },
    { id: 'sp', label: 'Listen on Spotify', url: 'https://open.spotify.com/show/6WjSecJ6T3ZQBASwTDI1Bc', icon: 'spotify', description: 'The AFM Podcast' },
    { id: 'tg', label: 'Join on Telegram', url: 'https://t.me/rabbimicah', icon: 'telegram', description: '@rabbimicah' },
    { id: 'ap', label: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/the-afm-podcast/id1523355747', icon: 'apple', description: 'The AFM Podcast' },
    { id: 'fb', label: 'Follow on Facebook', url: 'https://www.facebook.com/share/1MbmmFb6Nx/', icon: 'facebook', description: 'The Brand AFM' },
    { id: 'ig', label: 'Follow on Instagram', url: 'https://www.instagram.com/thebrandafm', icon: 'instagram', description: '@thebrandafm' },
    { id: 'tt1', label: 'TikTok: Dr Micah Azanduna', url: 'https://www.tiktok.com/@dr_micah_azanduna', icon: 'tiktok', description: '@dr_micah_azanduna' },
    { id: 'tt2', label: 'TikTok: Rabbi Azanduna', url: 'https://www.tiktok.com/@rabbiazanduna', icon: 'tiktok', description: '@rabbiazanduna' },
  ] as LinkItem[],

  archive: [
    { id: 'a1', label: 'The AFM Podcast (Podbean)', url: 'https://theafmpodcast.podbean.com/', icon: 'podcast', description: '500+ audio messages' },
    { id: 'a2', label: 'YouTube Channel', url: 'https://youtube.com/@thebrandmicah', icon: 'youtube', description: 'Video sermons & teachings' },
    { id: 'a3', label: 'Telegram: Rabbi Micah', url: 'https://t.me/rabbimicah', icon: 'telegram', description: 'Teachings & resources' },
    { id: 'a4', label: 'Hagin Channel (Telegram)', url: 'https://t.me/KennethHagin', icon: 'telegram', description: 'In honor of Kenneth E. Hagin' },
    { id: 'a5', label: 'Theological Channel (Telegram)', url: 'https://t.me/theologicalchannel', icon: 'telegram', description: 'Doctrinal materials from renowned theologians' },
  ] as LinkItem[],

  /**
   * Individual sermons to feature in the app (optional). While this list is
   * empty, the Sermons screen shows the archive and platform links instead.
   * Example:
   * { id: 's1', title: 'The Voice of Honor', date: '2026-09-20', series: 'Honour',
   *   scripture: 'Romans 13:7', summary: '…', youtubeId: 'dQw4w9WgXcQ' },
   */
  sermons: [] as Sermon[],

  quotes: quoteTexts.map((text, i): Quote => ({ id: `q${i + 1}`, text })),
  quoteSource: quoteAuthor,

  books: [
    {
      id: 'maker-of-men',
      title: 'The Maker of Men',
      description: 'A call to raise and become men of substance, shaped by God for purpose, leadership and lasting impact.', // TODO: official blurb
      cover: require('../../assets/images/book-maker-of-men.jpg'),
      amazonUrl: 'https://www.amazon.com/dp/B091BJ8FLN',
    },
    {
      id: '1001-scriptures',
      title: '1001 Scriptures',
      subtitle: 'Genesis – Revelation',
      description: 'A carefully curated journey through 1001 scriptures from Genesis to Revelation, to strengthen your faith and doctrinal foundation.', // TODO: official blurb
      cover: require('../../assets/images/book-1001-scriptures.jpg'),
      amazonUrl: 'https://www.amazon.com/dp/B094YKVRPN',
    },
    {
      id: 'voice-of-honor',
      title: 'The Voice of Honor',
      subtitle: 'Honour and Dishonour',
      description: 'An exploration of honour and dishonour — how honour opens doors, and how dishonour closes them.', // TODO: official blurb
      cover: require('../../assets/images/book-voice-of-honor.jpg'),
      amazonUrl: 'https://www.amazon.com/dp/B09K5G1SGW',
    },
  ] as Book[],

  fragrances: {
    brandName: 'House of Azanduna',
    brandStory: 'A luxury perfume brand founded by Prophet Micah Felix Azanduna, CEO and founder — crafted as a symbol of excellence.',
    shopUrl: '', // online shop link, once the brand launches
    /**
     * Not launched yet: while `launched` is false the Store shows a
     * "Coming soon" page. When ready, set it to true and add the products, e.g.
     * { id: 'f1', name: 'Name', tagline: 'Warm · Woody', description: '…',
     *   notes: ['Oud', 'Amber'], size: '100ml Eau de Parfum', price: '£45',
     *   image: require('../../assets/images/<photo>.jpg'), buyUrl: 'https://…' },
     */
    launched: false,
    /** The name printed on the bottles (the brand itself is `brandName`). */
    collectionName: 'Rabbi Azanduna',
    /** Photos shown as a "Sneak peek" on the Coming soon page before launch (files in assets/perfumes/). */
    previewPhotos: [
      { name: 'Excellent Spirit', image: require('../../assets/perfumes/excellent-spirit.jpg') },
      { name: 'Miracle Oud', image: require('../../assets/perfumes/miracle-oud.jpg') },
      { name: 'Green Pastures', image: require('../../assets/perfumes/green-pastures.jpg') },
      { name: 'Man of God', image: require('../../assets/perfumes/man-of-god.jpg') },
      { name: 'Man of God', image: require('../../assets/perfumes/man-of-god-label.jpg') },
    ] as { name: string; image: ImageSource }[],
    items: [] as Fragrance[],
  },
};
