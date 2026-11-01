/* Church Care Tracker settings. Fill in the two Supabase values after creating the project
   (Supabase → Project Settings → API). The anon key is meant to be public; the access rules in
   supabase/schema.sql are what protect the data. While these are empty the app runs in demo mode. */
window.CARE_CONFIG = {
  // The AFM HUB Supabase project; Church Care's tables live in their own "care" schema there.
  supabaseUrl: 'https://huxvyimncwbeqnsugszm.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eHZ5aW1uY3diZXFuc3Vnc3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjUxMTYsImV4cCI6MjEwNjAwMTExNn0.ggmws94tx8aHiicS2Qvh0TXShD540kEftitg8NAwF1Y',
  supabaseSchema: 'care',

  // How the team signs in. WhatsApp codes need Twilio set up in Supabase (see README); turn on when ready.
  signIn: { whatsapp: false, email: true, google: true },

  church: 'The AFM Church',
  churchFull: 'Alleluia Faith Mission Global Assembly',
  pastor: 'Prophet Micah Felix Azanduna D.D',

  themeOfTheYear: '2026 · Our Year of the Blessing',
  place: 'AFM Center, Sunyani',
  services: [
    { day: 'Sun', when: '8:00 AM', what: 'International Word Assembly', where: 'AFM Center, Sunyani' },
    { day: 'Tue', when: '6:00 PM', what: 'Time with the Rabbi', where: 'AFM Center, Sunyani' },
    { day: 'Fri', when: '6:00 PM', what: 'Friday Miracle Service', where: 'AFM Center, Sunyani' },
    { day: 'Sun', when: '8:00 PM', what: 'International Online Prayer Connect', where: 'Online on Zoom' }
  ],

  // Shown on the welcome page the QR code opens.
  links: {
    playStore: 'https://play.google.com/store/apps/details?id=com.afm.hub',
    webApp: 'https://afm-hub.expo.app',
    website: 'https://theafmchurch.org'
  },

  // Used in demo mode and if the group list can't be loaded. The live list is in the database.
  groups: [
    { id: 'g1', name: 'Bishop David Oyedepo', tag: '', leader_name: 'Prophet Richmond Taku' },
    { id: 'g2', name: 'Archbishop Nicholas Duncan-Williams', tag: '', leader_name: 'Elijah Antwi' },
    { id: 'g3', name: 'Prophet Miracle Damoah Godfred', tag: '', leader_name: 'Prophet Elijah' },
    { id: 'g4', name: 'Dr. Mike Murdock', tag: '', leader_name: 'Mr. Owusu Erga' },
    { id: 'wog', name: 'Women of Glory', tag: "Women's Fellowship", leader_name: 'Madam Millicent' },
    { id: 'sg', name: 'Stoic Gentleman', tag: "Men's Fellowship", leader_name: 'Mr. Owusu Geoffery' },
    { id: 'prov', name: 'The Providence', tag: 'Church Choir', leader_name: 'Caljay Music' },
    { id: 'dia', name: 'The AFM Diaspora', tag: '', leader_name: 'David Annor' }
  ],
  reasons: ['Invited by a member', 'Saw the church online', 'Passing by', 'Came with family', 'Other'],

  awayWeeks: 3,   // a member counts as "away" after this many weeks unseen
  followDays: 2   // new visitors are due a first contact within this many days of assignment
};
