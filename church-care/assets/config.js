/* Church Care Tracker settings. Fill in the two Supabase values after creating the project
   (Supabase → Project Settings → API). The anon key is meant to be public; the access rules in
   supabase/schema.sql are what protect the data. While these are empty the app runs in demo mode. */
window.CARE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',

  church: 'The AFM Church',
  churchFull: 'Alleluia Faith Mission Global Assembly',
  pastor: 'Prophet Micah Felix Azanduna D.D',

  // Shown on the welcome page the QR code opens.
  links: {
    playStore: 'https://play.google.com/store/apps/details?id=com.afm.hub',
    webApp: 'https://afm-hub.expo.app',
    website: 'https://theafmchurch.org'
  },

  // Used in demo mode and if the group list can't be loaded. The live list is in the database.
  groups: [
    { id: 'g1', name: 'Group 1', tag: 'Archbishop Nicholas Duncan-Williams', leader_name: 'Prophet Richmond Taku' },
    { id: 'g2', name: 'Group 2', tag: 'David Oyedepo', leader_name: 'Elijah Antwi' },
    { id: 'g3', name: 'Group 3', tag: 'Prophet Miracle Damoah', leader_name: 'Prophet Elijah' },
    { id: 'g4', name: 'Group 4', tag: 'Dr. Mike Murdock', leader_name: 'Mr. Owusu Erga' },
    { id: 'wog', name: 'Women of Glory', tag: "Women's Fellowship", leader_name: 'Madam Millicent' },
    { id: 'sg', name: 'Stoic Gentleman', tag: "Men's Fellowship", leader_name: 'Mr. Owusu Geoffery' },
    { id: 'prov', name: 'The Providence', tag: 'Church Choir', leader_name: 'Caljay Music' }
  ],
  reasons: ['Invited by a member', 'Saw the church online', 'Passing by', 'Came with family', 'Other'],

  awayWeeks: 3,   // a member counts as "away" after this many weeks unseen
  followDays: 2   // new visitors are due a first contact within this many days of assignment
};
