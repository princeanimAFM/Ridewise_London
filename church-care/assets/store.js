/* Data layer. Live mode talks to Supabase (the database decides who sees what).
   Demo mode keeps sample data in this browser only and copies the database's rules, so the
   app can be tried before the church's project exists. */
(function () {
  'use strict';
  var C = window.CARE_CONFIG, Care = window.Care;
  var TABLES = ['staff', 'visitors', 'visitor_notes', 'members', 'prayers'];

  /* ---------------- live ---------------- */
  function live() {
    var sb = Care.client;
    function must(r) { if (r.error) throw r.error; return r.data; }
    return {
      mode: 'live',
      groups: function () {
        return sb.from('groups').select('*').order('sort').then(function (r) { return r.error || !r.data.length ? C.groups : r.data; });
      },
      submitWelcome: function (o) {
        return sb.rpc('submit_welcome', { p_name: o.name, p_phone: o.phone, p_reason: o.reason, p_invited_by: o.invited_by, p_group: o.group_interest || null, p_prayer: o.prayer, p_prayer_to: o.prayer_to || 'pastor', p_consent: o.consent }).then(must);
      },
      submitPrayer: function (o) {
        return sb.rpc('submit_prayer', { p_name: o.name, p_phone: o.phone, p_body: o.body, p_to: o.to || 'pastor', p_consent: o.consent }).then(must);
      },
      session: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
      // Codes go by WhatsApp (Supabase phone sign-in through Twilio's WhatsApp channel) or by email.
      sendCode: function (how, to) {
        if (how === 'whatsapp') return sb.auth.signInWithOtp({ phone: to, options: { channel: 'whatsapp', shouldCreateUser: true } }).then(must);
        return sb.auth.signInWithOtp({ email: to, options: { shouldCreateUser: true, emailRedirectTo: location.href.split('#')[0].split('?')[0] } }).then(must);
      },
      google: function () {
        return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }).then(must);
      },
      verify: function (how, to, code) {
        return (how === 'whatsapp' ? sb.auth.verifyOtp({ phone: to, token: code, type: 'sms' }) : sb.auth.verifyOtp({ email: to, token: code, type: 'email' })).then(must);
      },
      signOut: function () { return sb.auth.signOut(); },
      onAuth: function (cb) { sb.auth.onAuthStateChange(function () { cb(); }); },
      me: function () {
        return sb.rpc('whoami').then(must).then(function (r) {
          if (!r) return null;
          if (r.kind === 'member') { r.group_id = r.groups[0].group_id; }
          return r;
        });
      },
      createInvite: function (group, kind) { return sb.rpc('create_invite', { p_group: group, p_kind: kind }).then(must); },
      resetInvite: function (group) { return sb.rpc('reset_member_invite', { p_group: group }).then(must); },
      inviteInfo: function (token) { return sb.rpc('invite_info', { p_token: token }).then(must); },
      acceptInvite: function (token, name) { return sb.rpc('accept_invite', { p_token: token, p_name: name }).then(must); },
      groupView: function (group) { return sb.rpc('my_group_view', { p_group: group }).then(must); },
      memberPrayer: function (body, to, group) { return sb.rpc('member_prayer', { p_body: body, p_to: to, p_group: group }).then(must); },
      myPrayers: function () { return sb.rpc('my_prayers').then(must); },
      loadAll: function () {
        return Promise.all([
          this.groups(),
          sb.from('staff').select('*').order('name').then(must),
          sb.from('visitors').select('*').order('created_at', { ascending: false }).then(must),
          sb.from('visitor_notes').select('*').order('created_at').then(must),
          sb.from('members').select('*').order('name').then(must),
          sb.from('prayers').select('*').order('created_at', { ascending: false }).then(must),
          sb.from('attendance').select('member_id, seen_on, kind, program_id, by_self').gte('seen_on', Care.addDays(Care.today(), -120)).then(must),
          this.programs(),
          sb.from('absences').select('member_id, seen_on, kind, program_id, reason, note, created_at').gte('seen_on', Care.addDays(Care.today(), -120)).then(function (r) { return r.error ? [] : r.data; })
        ]).then(function (a) {
          return { groups: a[0], staff: a[1], visitors: a[2], visitor_notes: a[3], members: a[4], prayers: a[5], attendance: a[6], programs: a[7], absences: a[8] };
        });
      },
      // Prayer requests are saved without reading them back: the welcome team may add one but not read it.
      insert: function (t, row) { var q = sb.from(t).insert(row); return (t === 'prayers' ? q : q.select().single()).then(must); },
      update: function (t, key, id, patch) { return sb.from(t).update(patch).eq(key, id).select().then(must); },
      remove: function (t, key, id) { return sb.from(t).delete().eq(key, id).then(must); },
      // groups are loaded separately; staff/groups changes reload too
      markWelcomed: function (id) { return sb.rpc('mark_welcomed', { p_id: id }).then(must); },
      programs: function () { return sb.from('programs').select('*').gte('ends_on', Care.addDays(Care.today(), -120)).order('starts_on').then(must); },
      present: function (memberId, day, kind, program) {
        return sb.from('attendance').insert({ member_id: memberId, seen_on: day, kind: kind || 'sunday', program_id: program || null })
          .then(function (r) { if (r.error && r.error.code !== '23505') throw r.error; });
      },
      unpresent: function (memberId, day, kind, program) {
        var q = sb.from('attendance').delete().eq('member_id', memberId).eq('seen_on', day).eq('kind', kind || 'sunday');
        return (program ? q.eq('program_id', program) : q.is('program_id', null)).then(must);
      },
      memberCheckin: function (group, kind, day, here, program) { return sb.rpc('member_checkin', { p_group: group, p_kind: kind, p_day: day, p_here: here, p_program: program || null }).then(must); },
      myAttendance: function (group) { return sb.rpc('my_attendance', { p_group: group }).then(must); },
      growth: function () { return sb.rpc('growth_data').then(must); },
      myMissed: function () { return sb.rpc('my_missed').then(must); },
      memberAbsence: function (kind, day, program, reason, note) { return sb.rpc('member_absence', { p_kind: kind, p_day: day, p_program: program || null, p_reason: reason, p_note: note || '' }).then(must); },
      savePush: function (endpoint, p256dh, auth) { return sb.rpc('save_push', { p_endpoint: endpoint, p_p256dh: p256dh, p_auth: auth }).then(must); },
      dropPush: function (endpoint) { return sb.rpc('drop_push', { p_endpoint: endpoint }).then(must); },
      subscribe: function (cb) {
        var ch = sb.channel('care');
        TABLES.concat(['groups', 'attendance', 'programs', 'absences']).forEach(function (t) { ch = ch.on('postgres_changes', { event: '*', schema: C.supabaseSchema || 'public', table: t }, cb); });
        ch.subscribe();
      }
    };
  }

  /* ---------------- demo ---------------- */
  function demo() {
    var KEY = 'care-demo-v9', listeners = [];
    var data = read();
    var role = 'pastor';
    try { role = localStorage.getItem(KEY + '-role') || 'pastor'; } catch (e) { /* not kept */ }
    function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function now() { return new Date().toISOString(); }
    function read() {
      try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.visitors && s.groups) return s; } catch (e) { /* private window */ }
      return seed();
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* not kept */ }
      listeners.forEach(function (f) { setTimeout(f, 0); });
    }
    function me() {
      var mem = data.members.filter(function (x) { return 'mem:' + x.login === role; });
      if (mem.length) return { kind: 'member', role: 'member', id: role, name: mem[0].name, login: mem[0].login, group_id: mem[0].group_id, groups: mem.map(function (x) { return { member_id: x.id, group_id: x.group_id }; }) };
      return data.staff.filter(function (x) { return x.id === role; })[0] || data.staff[0];
    }
    function myMembers() { var m = me(); return m.role === 'member' ? data.members.filter(function (x) { return x.login === m.login; }) : []; }
    function has(m, a) { return m.role === 'pastor' || (m.role === 'pa' && m.areas.indexOf(a) >= 0); }
    function canSee(t, row, m) {
      if (t === 'staff') return m.role === 'pastor' || row.id === m.id;
      if (t === 'groups' || t === 'programs') return true;
      if (t === 'visitors') return has(m, 'visitors') || m.role === 'welcome' || (m.role === 'leader' && row.assigned_to === m.group_id);
      if (t === 'visitor_notes') return data.visitors.some(function (v) { return v.id === row.visitor_id && canSee('visitors', v, m); });
      if (t === 'members') return has(m, 'groups') || (m.role === 'leader' && row.group_id === m.group_id);
      if (t === 'prayers') return row.to_pastor ? has(m, 'prayer_pastor') : has(m, 'prayer_groups') || (m.role === 'leader' && row.assigned_to === m.group_id);
      return false;
    }
    function seed() {
      var t = Care.today(), d = { groups: C.groups.map(function (g, i) { return Object.assign({ sort: i + 1 }, g); }), staff: [], visitors: [], visitor_notes: [], members: [], prayers: [], attendance: [] };
      d.staff.push({ id: 'pastor', name: C.pastor, email: 'pastor@example.org', phone: null, role: 'pastor', group_id: null, areas: [], joined_app_at: Care.addDays(t, -20) + 'T09:00:00Z' });
      d.staff.push({ id: 'pa', name: 'Pastor’s PA', email: null, phone: '233200000001', role: 'pa', group_id: null, areas: ['visitors', 'groups', 'prayer_groups'] });
      d.staff.push({ id: 'welcome', name: 'Welcome team', email: null, phone: '233200000002', role: 'welcome', group_id: null, areas: [] });
      d.groups.forEach(function (g, i) { d.staff.push({ id: 'lead-' + g.id, name: g.leader_name, email: null, phone: '23324000000' + i, role: 'leader', group_id: g.id, areas: [], joined_app_at: i % 3 ? Care.addDays(t, -9) + 'T09:00:00Z' : null }); });
      var names = [['Kofi Mensah', 'g1', 0], ['Ama Serwaa', 'g1', 0], ['Yaw Boateng', 'g2', 1], ['Akosua Adjei', 'g2', 5], ['Kwame Asante', 'g3', 0],
        ['Efua Quaye', 'wog', 4], ['Abena Owusu', 'wog', 0], ['Nana Yeboah', 'sg', 1], ['Kojo Darko', 'sg', 6], ['Esi Appiah', 'prov', 0],
        ['Mensah Tetteh', 'g4', 2], ['Adwoa Frimpong', 'g4', 0], ['Kwabena Owusu', 'dia', 0], ['Akua Boakye', 'dia', 3]];
      names.forEach(function (n, i) {
        var phone = '024' + (1000000 + i * 7311), onApp = i % 3 !== 2;
        d.members.push({ id: 'm' + i, name: n[0], phone: phone, group_id: n[1], joined_at: Care.addDays(t, -(20 + i * 24)), last_seen: Care.addDays(t, -n[2] * 7), created_at: now(),
          login: onApp ? Care.intl(phone) : null, joined_app_at: onApp ? Care.addDays(t, -10) + 'T10:00:00Z' : null });
      });
      d.invites = [];
      d.programs = [
        { id: 'prog1', title: 'Holy Ghost Night', starts_on: Care.addDays(t, -3), ends_on: Care.addDays(t, -3), time_text: '7:00 PM', place: 'AFM Center, Sunyani', details: 'A night of worship, prayer and the power of the Holy Spirit.' },
        { id: 'prog2', title: 'Year of the Blessing Convention', starts_on: Care.addDays(t, 12), ends_on: Care.addDays(t, 14), time_text: '6:00 PM each night', place: 'AFM Center, Sunyani', details: 'Three nights of the Word with Prophet Micah Felix Azanduna and guest ministers.' },
        { id: 'prog3', title: 'Carols Night', starts_on: Care.addDays(t, 49), ends_on: Care.addDays(t, 49), time_text: '6:30 PM', place: 'AFM Center, Sunyani', details: 'Christmas carols, drama and thanksgiving.' }
      ];
      // Sunday attendance for the last 8 Sundays, matching each person's "weeks away"
      var lastSun = Care.addDays(t, -new Date().getDay());
      d.members.forEach(function (m, i) {
        var away = names[i][2], days = [];
        for (var k = 0; k < 8; k++) {
          if (k < away) continue;
          if ((k + i) % 5 === 4 && k !== away) continue;
          var sun = Care.addDays(lastSun, -7 * k);
          d.attendance.push({ member_id: m.id, seen_on: sun, kind: 'sunday', by_self: k === 0 && i % 4 === 0 }); days.push(sun);
          if ((k + i) % 3 === 0) { var fri = Care.addDays(sun, -2); d.attendance.push({ member_id: m.id, seen_on: fri, kind: 'friday', by_self: false }); days.push(fri); }
          if ((k + i) % 2 === 0 && k > 0) { var tue = Care.addDays(sun, 2); d.attendance.push({ member_id: m.id, seen_on: tue, kind: 'tuesday', by_self: false }); days.push(tue); }
          if (k === 0 && i % 3 !== 1) { var hg = Care.addDays(t, -3); d.attendance.push({ member_id: m.id, seen_on: hg, kind: 'special', program_id: 'prog1', by_self: false }); days.push(hg); }
        }
        m.last_seen = days.length ? days.sort()[days.length - 1] : null;
      });
      // Esi sings in the choir and is in Women of Glory too: one entry per group, attendance in both
      var esi = d.members.filter(function (x) { return x.name === 'Esi Appiah'; })[0];
      if (esi) {
        d.members.push(Object.assign({}, esi, { id: 'm-esi-wog', group_id: 'wog' }));
        d.attendance.filter(function (a) { return a.member_id === esi.id && a.kind !== 'meeting'; }).forEach(function (a) { d.attendance.push(Object.assign({}, a, { member_id: 'm-esi-wog' })); });
      }
      d.absences = [];
      d.members.forEach(function (m) {
        if (['Akosua Adjei', 'Kojo Darko'].indexOf(m.name) < 0 || d.attendance.some(function (a) { return a.member_id === m.id && a.seen_on === lastSun && a.kind === 'sunday'; })) return;
        d.absences.push({ member_id: m.id, seen_on: lastSun, kind: 'sunday', program_id: null, reason: m.name === 'Akosua Adjei' ? 'sick' : 'travelling', note: m.name === 'Akosua Adjei' ? 'Malaria, getting better. Please pray for me.' : 'Visiting family in Kumasi', created_at: now() });
      });
      var vs = [['Kwesi Ofori', -5, 'new', null, 'g2'], ['Maame Ama', -3, 'new', 'g2', null], ['Daniel Addo', -1, 'new', null, 'wog'], ['Grace Nartey', -8, 'reached', 'g1', null], ['Samuel Opoku', -12, 'joined', 'g3', null],
        ['Felix Amoah', -40, 'joined', 'sg', null], ['Rita Agyei', -66, 'reached', 'wog', null], ['Joseph Antwi', -95, 'joined', 'g1', null], ['Linda Osei', -130, 'reached', 'g4', null], ['Peter Badu', -170, 'joined', 'dia', null]];
      vs.forEach(function (v, i) {
        var made = Care.addDays(t, v[1]);
        var o = { id: 'v' + i, name: v[0], phone: '055' + (2000000 + i * 9137), reason: C.reasons[i % 5], invited_by: i === 1 ? 'Ama Serwaa' : '', group_interest: v[4], assigned_to: v[3],
          status: v[2], due: Care.addDays(made, C.followDays), reached_at: v[2] !== 'new' ? Care.addDays(made, i % 3 === 1 ? 4 : 1) : null, seen_by_leader: v[2] !== 'new' || !v[3],
          consent_at: made + 'T10:00:00Z', source: 'form', created_at: made + 'T10:00:00Z',
          welcomed_at: i === 0 || i === 2 ? null : made + 'T15:00:00Z', welcomed_by: i === 0 || i === 2 ? '' : 'Welcome team' };
        d.visitors.push(o);
        if (o.reached_at) d.visitor_notes.push({ id: 'n' + i, visitor_id: o.id, author: 'Group leader', body: 'Called and welcomed. Will come again on Sunday.', created_at: o.reached_at + 'T12:00:00Z' });
      });
      function pr(id, name, body, status, to_pastor, assigned_to, visitor_id, ago) {
        d.prayers.push({ id: id, name: name, phone: name ? '0552000' + id.slice(1) + '00' : '', body: body, status: status, to_pastor: to_pastor, assigned_to: assigned_to, visitor_id: visitor_id, source: 'form', created_at: Care.addDays(t, -ago) + 'T10:00:00Z' });
      }
      pr('p0', 'Kwesi Ofori', 'Please pray for my job interview this week.', 'open', false, null, 'v0', 5);
      pr('p1', 'Grace Nartey', 'Pray for my mother who is recovering.', 'prayed', false, 'g1', 'v3', 8);
      pr('p2', 'Abena Owusu', 'A private family matter. Please pray for peace in my home.', 'open', true, null, null, 2);
      pr('p3', 'Yaw Boateng', 'Pray for my exams next week.', 'open', false, 'g2', null, 1);
      return d;
    }
    function check(ok) { if (!ok) throw new Error('You don\'t have access to do that.'); }
    function leaderNames() {
      data.groups.forEach(function (g) {
        var ls = data.staff.filter(function (x) { return x.role === 'leader' && x.group_id === g.id; });
        if (ls.length) g.leader_name = ls[0].name; else if (g.hadLeader) g.leader_name = '';
        g.hadLeader = !!ls.length || g.hadLeader;
      });
    }
    function find(t, key, id) { return data[t].filter(function (r) { return r[key] === id; })[0]; }
    function pkey(x) { return x.login || Care.intl(x.phone) || x.id; }
    /** The person's entries in every group (the choir and a fellowship, say). */
    function sameMember(id) { var x = find('members', 'id', id); return x ? data.members.filter(function (y) { return pkey(y) === pkey(x); }) : []; }
    function lastSeen(row) { var ds = data.attendance.filter(function (a) { return a.member_id === row.id; }).map(function (a) { return a.seen_on; }).sort(); row.last_seen = ds.length ? ds[ds.length - 1] : null; }
    return {
      mode: 'demo',
      roles: function () {
        var seen = {}, mems = data.members.filter(function (x) { if (!x.login || seen[x.login]) return false; seen[x.login] = 1; return true; }).slice(0, 6);
        return data.staff.map(function (x) {
          var what = x.role === 'pastor' ? 'Pastor' : x.role === 'pa' ? 'PA' : x.role === 'welcome' ? 'Welcome team' : 'Leader';
          return [x.id, x.role === 'leader' ? x.name + ' · ' + ((find('groups', 'id', x.group_id) || {}).name || '') : what + (x.role === 'pastor' ? ' · ' + x.name : '')];
        }).concat(mems.map(function (x) { return ['mem:' + x.login, 'Member · ' + x.name + ' (' + ((find('groups', 'id', x.group_id) || {}).name || '') + ')']; }));
      },
      setRole: function (r) { role = r; try { localStorage.setItem(KEY + '-role', r); } catch (e) { /* not kept */ } },
      role: function () { return role; },
      reset: function () { data = seed(); this.setRole('pastor'); save(); },
      groups: function () { return Promise.resolve(data.groups.slice().sort(function (a, b) { return a.sort - b.sort; })); },
      submitWelcome: function (o) {
        return Promise.resolve().then(function () {
          if (!o.consent) throw new Error('Please tick the consent box');
          var v = { id: uid(), name: o.name.trim(), phone: o.phone.trim(), reason: o.reason || '', invited_by: o.invited_by || '', group_interest: o.group_interest || null, assigned_to: null,
            status: 'new', due: Care.addDays(Care.today(), C.followDays), reached_at: null, seen_by_leader: true, consent_at: now(), source: 'form', created_at: now(), welcomed_at: null, welcomed_by: '' };
          data.visitors.unshift(v);
          if ((o.prayer || '').trim()) data.prayers.unshift({ id: uid(), name: v.name, phone: v.phone, body: o.prayer.trim(), status: 'open', to_pastor: (o.prayer_to || 'pastor') === 'pastor', assigned_to: null, visitor_id: v.id, source: 'form', created_at: now() });
          save();
        });
      },
      submitPrayer: function (o) {
        return Promise.resolve().then(function () {
          if (!o.consent) throw new Error('Please tick the consent box');
          var g = find('groups', 'id', o.to);
          data.prayers.unshift({ id: uid(), name: (o.name || '').trim(), phone: (o.phone || '').trim(), body: o.body.trim(), status: 'open', to_pastor: !g, assigned_to: g ? g.id : null, visitor_id: null, source: 'form', created_at: now() });
          save();
        });
      },
      session: function () { return Promise.resolve({ demo: true }); },
      // Preview only: no code is really sent; any code signs in.
      sendCode: function () { return Promise.resolve(); },
      verify: function () { return Promise.resolve(); },
      signOut: function () { return Promise.resolve(); },
      onAuth: function () {},
      me: function () { return Promise.resolve(Object.assign({}, me())); },
      loadAll: function () {
        var m = me(), out = {};
        return this.groups().then(function (gs) {
          out.groups = gs;
          TABLES.forEach(function (t) { out[t] = data[t].filter(function (r) { return canSee(t, r, m); }).map(function (r) { return Object.assign({}, r); }); });
          out.programs = data.programs.slice().sort(function (a, b) { return a.starts_on < b.starts_on ? -1 : 1; });
          out.absences = (data.absences || []).filter(function (a) { var mm = find('members', 'id', a.member_id); return mm && canSee('members', mm, m); }).map(function (a) { return Object.assign({}, a); });
          out.attendance = data.attendance.filter(function (a) { var mm = find('members', 'id', a.member_id); return mm && canSee('members', mm, m); }).map(function (a) { return Object.assign({}, a); });
          return out;
        });
      },
      insert: function (t, row) {
        return Promise.resolve().then(function () {
          var m = me(); row = Object.assign({}, row);
          if (t === 'visitors') {
            check(has(m, 'visitors') || m.role === 'welcome' || m.role === 'leader');
            if (m.role === 'leader') row.assigned_to = m.group_id;
            else if (!has(m, 'visitors')) row.assigned_to = null;
            Object.assign(row, { id: uid(), status: 'new', source: 'team', created_at: now(), due: Care.addDays(Care.today(), C.followDays), reached_at: null, seen_by_leader: !row.assigned_to || m.role === 'leader', welcomed_at: null, welcomed_by: '' });
          } else if (t === 'visitor_notes') {
            check(data.visitors.some(function (v) { return v.id === row.visitor_id && canSee('visitors', v, m); }));
            Object.assign(row, { id: uid(), author: m.name, body: row.body.trim(), created_at: now() });
          } else if (t === 'members') {
            check(has(m, 'groups') || m.role === 'leader');
            if (m.role === 'leader') row.group_id = m.group_id;
            Object.assign(row, { id: uid(), created_at: now(), joined_at: row.joined_at || Care.today(), last_seen: row.last_seen || null });
          } else if (t === 'prayers') {
            if (m.role === 'leader' && !row.to_pastor) row.assigned_to = m.group_id;
            if (m.role === 'welcome' || row.to_pastor) row.assigned_to = null;
            Object.assign(row, { id: uid(), status: 'open', source: 'team', to_pastor: !!row.to_pastor, visitor_id: null, created_at: now() });
          } else if (t === 'staff') {
            check(m.role === 'pastor');
            row.id = uid(); row.email = row.email ? row.email.toLowerCase() : null; row.phone = row.phone ? Care.intl(row.phone) : null;
            check(!data.staff.some(function (s) { return (row.email && s.email === row.email) || (row.phone && s.phone === row.phone); }));
          } else if (t === 'groups') {
            check(m.role === 'pastor');
          } else if (t === 'programs') {
            check(has(m, 'programs'));
            if (!row.title || !row.starts_on || !row.ends_on || row.ends_on < row.starts_on) throw new Error('Please check the program name and dates.');
            row.id = uid();
          }
          data[t].unshift(row);
          if (t === 'staff') leaderNames();
          save();
          return row;
        });
      },
      update: function (t, key, id, patch) {
        return Promise.resolve().then(function () {
          var m = me(), row = find(t, key, id);
          check(row && canSee(t, row, m));
          patch = Object.assign({}, patch);
          if (t === 'visitors') {
            check(has(m, 'visitors') || (m.role === 'leader' && row.assigned_to === m.group_id));
            if ('assigned_to' in patch && patch.assigned_to !== row.assigned_to) {
              if (!has(m, 'visitors')) throw new Error('Only the pastor can assign visitors to a group');
              if (patch.assigned_to && row.status === 'new') { patch.due = Care.addDays(Care.today(), C.followDays); patch.seen_by_leader = false; }
              data.prayers.forEach(function (p) { if (p.visitor_id === row.id && !p.to_pastor) p.assigned_to = patch.assigned_to; });
            }
            if (patch.status && patch.status !== 'new' && row.status === 'new' && !row.reached_at) patch.reached_at = Care.today();
          }
          if (t === 'prayers' && 'assigned_to' in patch && patch.assigned_to !== row.assigned_to) {
            if (row.to_pastor) throw new Error('This prayer request is for the pastor only');
            if (!has(m, 'prayer_groups')) throw new Error('Only the pastor can pass a prayer request to a group');
          }
          if (t === 'members') check(has(m, 'groups') || m.role === 'leader');
          if (t === 'staff' || t === 'groups') check(m.role === 'pastor');
          if (t === 'programs') check(has(m, 'programs'));
          if (t === 'staff') {
            if (row.role === 'pastor' && patch.role !== 'pastor' && data.staff.filter(function (s) { return s.role === 'pastor'; }).length < 2) throw new Error('The team needs at least one pastor');
            if ('phone' in patch) patch.phone = patch.phone ? Care.intl(patch.phone) : null;
          }
          Object.assign(row, patch);
          if (t === 'staff') leaderNames();
          save();
          return [row];
        });
      },
      remove: function (t, key, id) {
        return Promise.resolve().then(function () {
          var m = me(), row = find(t, key, id);
          check(row && (m.role === 'pastor' || (t === 'programs' && has(m, 'programs')) || (t === 'members' && (m.role === 'leader' || has(m, 'groups')) && canSee(t, row, m))));
          if (t === 'programs') data.attendance = data.attendance.filter(function (a) { return a.program_id !== id; });
          if (t === 'staff' && row.role === 'pastor' && data.staff.filter(function (s) { return s.role === 'pastor'; }).length < 2) throw new Error('The team needs at least one pastor');
          data[t] = data[t].filter(function (r) { return r !== row; });
          if (t === 'staff') leaderNames();
          if (t === 'visitors') {
            data.prayers = data.prayers.filter(function (p) { return p.visitor_id !== id; });
            data.visitor_notes = data.visitor_notes.filter(function (n) { return n.visitor_id !== id; });
          }
          save();
        });
      },
      createInvite: function (group, kind) {
        return Promise.resolve().then(function () {
          var m = me();
          if (kind === 'leader') {
            check(m.role === 'pastor');
            data.invites.forEach(function (i) { if (i.group_id === group && i.kind === 'leader' && !i.used_at) i.revoked = true; });
          } else {
            check(has(m, 'groups') || (m.role === 'leader' && m.group_id === group));
            var ex = data.invites.filter(function (i) { return i.group_id === group && i.kind === 'member' && !i.revoked; })[0];
            if (ex) return ex.token;
          }
          var t = (uid() + uid()).replace(/[^a-z0-9]/g, '').slice(0, 32);
          data.invites.push({ token: t, kind: kind, group_id: group, created_at: now(), used_at: null, revoked: false }); save();
          return t;
        });
      },
      resetInvite: function (group) {
        var self = this;
        data.invites.forEach(function (i) { if (i.group_id === group && i.kind === 'member') i.revoked = true; });
        return self.createInvite(group, 'member');
      },
      inviteInfo: function (token) {
        var i = find('invites', 'token', token);
        if (!i) return Promise.resolve(null);
        var g = find('groups', 'id', i.group_id) || {};
        return Promise.resolve({ kind: i.kind, group: g.name, tag: g.tag, leader: g.leader_name, valid: !i.revoked && (i.kind === 'member' || !i.used_at) });
      },
      // target: the WhatsApp number or email they signed in with (preview only; live uses the sign-in itself)
      acceptInvite: function (token, name, target) {
        var self = this;
        return Promise.resolve().then(function () {
          var i = find('invites', 'token', token);
          if (!i || i.revoked) throw new Error('This invite link is no longer valid. Ask for a new one.');
          var login = /@/.test(target) ? target.toLowerCase() : Care.intl(target);
          if (!name) throw new Error('Please enter your name');
          if (i.kind === 'leader') {
            if (i.used_at) throw new Error('This invite link has already been used. Ask the pastor for a new one.');
            var st = { id: uid(), name: name, email: /@/.test(login) ? login : null, phone: /@/.test(login) ? null : login, role: 'leader', group_id: i.group_id, areas: [], joined_app_at: now() };
            data.staff.unshift(st); i.used_at = now(); leaderNames(); save(); self.setRole(st.id);
            return { kind: 'leader' };
          }
          var mm = data.members.filter(function (x) { return x.group_id === i.group_id && (x.login === login || (!x.login && Care.intl(x.phone) === login)); })[0];
          if (mm) { mm.login = login; mm.joined_app_at = mm.joined_app_at || now(); }
          else data.members.unshift({ id: uid(), name: name, phone: /@/.test(login) ? '' : '+' + login, group_id: i.group_id, joined_at: Care.today(), last_seen: null, created_at: now(), login: login, joined_app_at: now() });
          save(); self.setRole('mem:' + login);
          return { kind: 'member' };
        });
      },
      groupView: function (group) {
        return Promise.resolve().then(function () {
          check(myMembers().some(function (x) { return x.group_id === group; }) || me().group_id === group || has(me(), 'groups'));
          var lead = data.staff.filter(function (x) { return x.role === 'leader' && x.group_id === group; })[0];
          return { group: find('groups', 'id', group), leader_phone: lead ? lead.phone : null,
            people: data.members.filter(function (x) { return x.group_id === group; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return { name: x.name, on_app: !!x.joined_app_at }; }) };
        });
      },
      memberPrayer: function (body, to, group) {
        return Promise.resolve().then(function () {
          var mm = myMembers().filter(function (x) { return x.group_id === group; })[0];
          check(mm);
          data.prayers.unshift({ id: uid(), name: mm.name, phone: mm.phone, body: body, status: 'open', to_pastor: to === 'pastor', assigned_to: to === 'pastor' ? null : group, visitor_id: null, member_id: mm.id, source: 'team', created_at: now() });
          save();
        });
      },
      myPrayers: function () {
        var ids = myMembers().map(function (x) { return x.id; });
        return Promise.resolve(data.prayers.filter(function (p) { return ids.indexOf(p.member_id) >= 0; }));
      },
      memberCheckin: function (group, kind, day, here, program) {
        program = kind === 'special' ? program || null : null;
        return Promise.resolve().then(function () {
          var mm = myMembers().filter(function (x) { return x.group_id === group; })[0];
          check(mm);
          if (day > Care.today() || day < Care.addDays(Care.today(), -6)) throw new Error('You can mark attendance for the last week only');
          var dow = Care.parse(day).getDay();
          if ((kind === 'sunday' || kind === 'online') && dow !== 0) throw new Error('That service is on Sundays');
          if (kind === 'friday' && dow !== 5) throw new Error('The Miracle Service is on Fridays');
          if (kind === 'tuesday' && dow !== 2) throw new Error('Time with the Rabbi is on Tuesdays');
          (kind === 'meeting' ? [mm] : sameMember(mm.id)).forEach(function (x) {
            var ex = data.attendance.filter(function (a) { return a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program; })[0];
            if (here && !ex) data.attendance.push({ member_id: x.id, seen_on: day, kind: kind, program_id: program, by_self: true });
            if (here) data.absences = (data.absences || []).filter(function (a) { return !(a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program); });
            if (!here && ex && ex.by_self) data.attendance = data.attendance.filter(function (a) { return a !== ex; });
            lastSeen(x);
          });
          save();
        });
      },
      myAttendance: function (group) {
        var ids = myMembers().filter(function (x) { return x.group_id === group; }).map(function (x) { return x.id; });
        return Promise.resolve(data.attendance.filter(function (a) { return ids.indexOf(a.member_id) >= 0; }));
      },
      myMissed: function () {
        return Promise.resolve().then(function () {
          var mine = myMembers(), t = Care.today(), out = [];
          if (!mine.length) return out;
          var joined = mine.map(function (x) { return x.joined_at || t; }).sort()[0], ids = mine.map(function (x) { return x.id; });
          var svc = [];
          for (var i = 0; i <= 6; i++) { var dd = Care.addDays(t, -i); if (Care.parse(dd).getDay() === 0 && (i > 0 || new Date().getHours() >= 14)) svc.push(['sunday', dd, null, 'Sunday service']); }
          data.programs.forEach(function (p) { for (var j = 0; j <= 6; j++) { var d2 = Care.addDays(t, -j); if (d2 >= p.starts_on && d2 <= p.ends_on && (j > 0 || new Date().getHours() >= 22)) svc.push(['special', d2, p.id, p.title]); } });
          svc.forEach(function (x) {
            if (x[1] < joined) return;
            var same = function (a) { return ids.indexOf(a.member_id) >= 0 && a.seen_on === x[1] && a.kind === x[0] && (a.program_id || null) === x[2]; };
            if (data.attendance.some(same) || (data.absences || []).some(same)) return;
            out.push({ kind: x[0], seen_on: x[1], program_id: x[2], label: x[3] });
          });
          return out.sort(function (a, b) { return a.seen_on < b.seen_on ? 1 : -1; });
        });
      },
      memberAbsence: function (kind, day, program, reason, note) {
        return Promise.resolve().then(function () {
          var mine = myMembers(); check(mine.length);
          program = kind === 'special' ? program || null : null;
          data.absences = data.absences || [];
          mine.forEach(function (x) {
            if (data.attendance.some(function (a) { return a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program; })) return;
            data.absences = data.absences.filter(function (a) { return !(a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program); });
            data.absences.push({ member_id: x.id, seen_on: day, kind: kind, program_id: program, reason: reason, note: (note || '').trim().slice(0, 300), created_at: now() });
          });
          save();
        });
      },
      savePush: function () { return Promise.resolve(); },
      dropPush: function () { return Promise.resolve(); },
      markWelcomed: function (id) {
        return Promise.resolve().then(function () {
          var m = me(), v = find('visitors', 'id', id);
          check(v && canSee('visitors', v, m));
          if (!v.welcomed_at) { v.welcomed_at = now(); v.welcomed_by = m.name; }
          save();
        });
      },
      programs: function () { return Promise.resolve(data.programs.slice().sort(function (a, b) { return a.starts_on < b.starts_on ? -1 : 1; })); },
      // Same shape as the database's growth_data(): numbers only, the whole church or the leader's group.
      growth: function () {
        return Promise.resolve().then(function () {
          var m = me(), t = Care.today(), g = m.role === 'leader' ? m.group_id : null;
          check(['pastor', 'pa', 'leader'].indexOf(m.role) >= 0);
          var n0 = new Date(), since = Care.ymd(new Date(n0.getFullYear(), n0.getMonth() - 12, 1));
          var gm = {}; data.members.forEach(function (x) { gm[x.id] = x.group_id; });
          var att = {};
          data.attendance.forEach(function (a) {
            var grp = gm[a.member_id];
            if (!grp || a.seen_on < since || ['sunday', 'tuesday', 'friday', 'online'].indexOf(a.kind) < 0 || (g && grp !== g)) return;
            var k = grp + '|' + a.seen_on + '|' + a.kind; att[k] = (att[k] || 0) + 1;
          });
          return {
            scope: g ? 'group' : 'church', group: g, today: t,
            members: data.members.filter(function (x) { return !g || x.group_id === g; }).map(function (x) { return [x.group_id, x.joined_at || String(x.created_at).slice(0, 10), !!x.joined_app_at, x.last_seen, pkey(x)]; }),
            visitors: data.visitors.filter(function (v) { return !g || v.assigned_to === g; }).map(function (v) { return [v.assigned_to, String(v.created_at).slice(0, 10), v.status, v.due, v.reached_at]; }),
            attendance: Object.keys(att).map(function (k) { var p = k.split('|'); return [p[0], p[1], p[2], att[k]]; }),
            people_attendance: (function () {
              var c = {};
              data.attendance.forEach(function (a) {
                var x = find('members', 'id', a.member_id);
                if (!x || a.seen_on < since || ['sunday', 'tuesday', 'friday', 'online'].indexOf(a.kind) < 0 || (g && x.group_id !== g)) return;
                var k = a.seen_on + '|' + a.kind; (c[k] = c[k] || {})[pkey(x)] = 1;
              });
              return Object.keys(c).map(function (k) { var p = k.split('|'); return [p[0], p[1], Object.keys(c[k]).length]; });
            })(),
            prayers: data.prayers.filter(function (p) { return String(p.created_at).slice(0, 10) >= since && (!g || (p.assigned_to === g && !p.to_pastor)); }).map(function (p) { return [p.assigned_to, p.to_pastor, String(p.created_at).slice(0, 10), p.status]; })
          };
        });
      },
      present: function (memberId, day, kind, program) {
        kind = kind || 'sunday'; program = program || null;
        return Promise.resolve().then(function () {
          var row = find('members', 'id', memberId);
          check(row && canSee('members', row, me()));
          if (day > Care.today()) throw new Error('You can\'t mark a service that hasn\'t happened yet');
          if (program) { var pr = find('programs', 'id', program); if (!pr || day < pr.starts_on || day > pr.ends_on) throw new Error('That date is not part of the program'); }
          (kind === 'meeting' ? [row] : sameMember(memberId)).forEach(function (x) {
            if (!data.attendance.some(function (a) { return a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program; })) data.attendance.push({ member_id: x.id, seen_on: day, kind: kind, program_id: program, by_self: false });
            data.absences = (data.absences || []).filter(function (a) { return !(a.member_id === x.id && a.seen_on === day && a.kind === kind && (a.program_id || null) === program); });
            if (!x.last_seen || x.last_seen < day) x.last_seen = day;
          });
          save();
        });
      },
      unpresent: function (memberId, day, kind, program) {
        kind = kind || 'sunday'; program = program || null;
        return Promise.resolve().then(function () {
          var row = find('members', 'id', memberId);
          check(row && canSee('members', row, me()));
          var rows = kind === 'meeting' ? [row] : sameMember(memberId), ids = rows.map(function (x) { return x.id; });
          data.attendance = data.attendance.filter(function (a) { return !(ids.indexOf(a.member_id) >= 0 && a.seen_on === day && a.kind === kind && (a.program_id || null) === program); });
          rows.forEach(lastSeen);
          save();
        });
      },
      subscribe: function (cb) {
        listeners.push(cb);
        window.addEventListener('storage', function (e) { if (e.key === KEY) { data = read(); cb(); } });
      }
    };
  }

  window.Store = Care.live && Care.client ? live() : demo();
})();
