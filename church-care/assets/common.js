/* Shared helpers for the welcome page and the team app. */
(function () {
  'use strict';
  var C = window.CARE_CONFIG;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { s = String(s).slice(0, 10); var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  window.Care = {
    live: !!(C.supabaseUrl && C.supabaseAnonKey),
    client: null,
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    today: function () { return ymd(new Date()); },
    ymd: ymd,
    parse: parse,
    addDays: function (s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); },
    daysBetween: function (a, b) { return Math.round((parse(b) - parse(a)) / 86400000); },
    fmt: function (s) { return s ? parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; },
    first: function (n) { return String(n || '').trim().split(/\s+/)[0] || 'friend'; },
    /** Phone number in international digits for WhatsApp and calls; Ghana local numbers (0xx…) become 233xx…. */
    intl: function (p) {
      var raw = String(p || '').trim(), d = raw.replace(/\D/g, '');
      if (!d) return '';
      if (raw.charAt(0) === '+') return d;
      if (d.indexOf('00') === 0) return d.slice(2);
      if (d.indexOf('233') === 0 && d.length >= 12) return d;
      if (d.charAt(0) === '0') return '233' + d.slice(1);
      return '233' + d;
    },
    waLink: function (p, msg) { return 'https://wa.me/' + Care.intl(p) + (msg ? '?text=' + encodeURIComponent(msg) : ''); },
    telLink: function (p) { return 'tel:+' + Care.intl(p); },
    toast: function (t) {
      var e = document.getElementById('toast');
      if (!e) return;
      e.textContent = t; e.className = 'toast show';
      clearTimeout(Care.toast.t);
      Care.toast.t = setTimeout(function () { e.className = 'toast'; }, 2800);
    },
    errText: function (e) {
      var m = (e && (e.message || e.error_description)) || String(e || '');
      if (/row-level security|permission denied/i.test(m)) return 'You don\'t have access to do that.';
      if (/Failed to fetch|NetworkError|network/i.test(m)) return 'No internet connection. Please try again.';
      return m.replace(/^.*?ERROR:\s*/, '') || 'Something went wrong. Please try again.';
    }
  };

  if (Care.live && window.supabase) {
    Care.client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'church-care-auth' },
      db: { schema: C.supabaseSchema || 'public' }
    });
  }
})();
