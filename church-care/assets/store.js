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
      verify: function (how, to, code) {
        return (how === 'whatsapp' ? sb.auth.verifyOtp({ phone: to, token: code, type: 'sms' }) : sb.auth.verifyOtp({ email: to, token: code, type: 'email' })).then(must);
      },
      signOut: function () { return sb.auth.signOut(); },
      onAuth: function (cb) { sb.auth.onAuthStateChange(function () { cb(); }); },
      me: function () { return sb.rpc('me').then(must).then(function (r) { r = Array.isArray(r) ? r[0] : r; return r && r.id ? r : null; }); },
      loadAll: function () {
        return Promise.all([
          this.groups(),
          sb.from('staff').select('*').order('name').then(must),
          sb.from('visitors').select('*').order('created_at', { ascending: false }).then(must),
          sb.from('visitor_notes').select('*').order('created_at').then(must),
          sb.from('members').select('*').order('name').then(must),
          sb.from('prayers').select('*').order('created_at', { ascending: false }).then(must)
        ]).then(function (a) {
          return { groups: a[0], staff: a[1], visitors: a[2], visitor_notes: a[3], members: a[4], prayers: a[5] };
        });
      },
      // Prayer requests are saved without reading them back: the welcome team may add one but not read it.
      insert: function (t, row) { var q = sb.from(t).insert(row); return (t === 'prayers' ? q : q.select().single()).then(must); },
      update: function (t, key, id, patch) { return sb.from(t).update(patch).eq(key, id).select().then(must); },
      remove: function (t, key, id) { return sb.from(t).delete().eq(key, id).then(must); },
      // groups are loaded separately; staff/groups changes reload too
      markWelcomed: function (id) { return sb.rpc('mark_welcomed', { p_id: id }).then(must); },
      present: function (memberId, day) { return sb.from('attendance').upsert({ member_id: memberId, seen_on: day }, { ignoreDuplicates: true }).then(must); },
      unpresent: function (memberId, day) { return sb.from('attendance').delete().eq('member_id', memberId).eq('seen_on', day).then(must); },
      subscribe: function (cb) {
        var ch = sb.channel('care');
        TABLES.concat(['groups']).forEach(function (t) { ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, cb); });
        ch.subscribe();
      }
    };
  }

  /* ---------------- demo ---------------- */
  function demo() {
    var KEY = 'care-demo-v3', listeners = [];
    var data = read();
    var role = 'pastor';
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
    function me() { return data.staff.filter(function (x) { return x.id === role; })[0] || data.staff[0]; }
    function has(m, a) { return m.role === 'pastor' || (m.role === 'pa' && m.areas.indexOf(a) >= 0); }
    function canSee(t, row, m) {
      if (t === 'staff') return m.role === 'pastor' || row.id === m.id;
      if (t === 'groups') return true;
      if (t === 'visitors') return has(m, 'visitors') || m.role === 'welcome' || (m.role === 'leader' && row.assigned_to === m.group_id);
      if (t === 'visitor_notes') return data.visitors.some(function (v) { return v.id === row.visitor_id && canSee('visitors', v, m); });
      if (t === 'members') return has(m, 'groups') || (m.role === 'leader' && row.group_id === m.group_id);
      if (t === 'prayers') return row.to_pastor ? has(m, 'prayer_pastor') : has(m, 'prayer_groups') || (m.role === 'leader' && row.assigned_to === m.group_id);
      return false;
    }
    function seed() {
      var t = Care.today(), d = { groups: C.groups.map(function (g, i) { return Object.assign({ sort: i + 1 }, g); }), staff: [], visitors: [], visitor_notes: [], members: [], prayers: [], attendance: [] };
      d.staff.push({ id: 'pastor', name: C.pastor, email: 'pastor@example.org', phone: null, role: 'pastor', group_id: null, areas: [] });
      d.staff.push({ id: 'pa', name: 'Pastor’s PA', email: null, phone: '233200000001', role: 'pa', group_id: null, areas: ['visitors', 'groups', 'prayer_groups'] });
      d.staff.push({ id: 'welcome', name: 'Welcome team', email: null, phone: '233200000002', role: 'welcome', group_id: null, areas: [] });
      d.groups.forEach(function (g, i) { d.staff.push({ id: 'lead-' + g.id, name: g.leader_name, email: null, phone: '23324000000' + i, role: 'leader', group_id: g.id, areas: [] }); });
      var names = [['Kofi Mensah', 'g1', 0], ['Ama Serwaa', 'g1', 0], ['Yaw Boateng', 'g2', 1], ['Akosua Adjei', 'g2', 5], ['Kwame Asante', 'g3', 0],
        ['Efua Quaye', 'wog', 4], ['Abena Owusu', 'wog', 0], ['Nana Yeboah', 'sg', 1], ['Kojo Darko', 'sg', 6], ['Esi Appiah', 'prov', 0],
        ['Mensah Tetteh', 'g4', 2], ['Adwoa Frimpong', 'g4', 0], ['Kwabena Owusu', 'dia', 0], ['Akua Boakye', 'dia', 3]];
      names.forEach(function (n, i) {
        d.members.push({ id: 'm' + i, name: n[0], phone: '024' + (1000000 + i * 7311), group_id: n[1], joined_at: Care.addDays(t, -90), last_seen: Care.addDays(t, -n[2] * 7), created_at: now() });
      });
      var vs = [['Kwesi Ofori', -5, 'new', null, 'g2'], ['Maame Ama', -3, 'new', 'g2', null], ['Daniel Addo', -1, 'new', null, 'wog'], ['Grace Nartey', -8, 'reached', 'g1', null], ['Samuel Opoku', -12, 'joined', 'g3', null]];
      vs.forEach(function (v, i) {
        var made = Care.addDays(t, v[1]);
        var o = { id: 'v' + i, name: v[0], phone: '055' + (2000000 + i * 9137), reason: C.reasons[i % 5], invited_by: i === 1 ? 'Ama Serwaa' : '', group_interest: v[4], assigned_to: v[3],
          status: v[2], due: Care.addDays(made, C.followDays), reached_at: v[2] !== 'new' ? Care.addDays(made, 1) : null, seen_by_leader: v[2] !== 'new' || !v[3],
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
    function find(t, key, id) { return data[t].filter(function (r) { return r[key] === id; })[0]; }
    return {
      mode: 'demo',
      roles: function () {
        return data.staff.map(function (x) {
          var what = x.role === 'pastor' ? 'Pastor' : x.role === 'pa' ? 'PA' : x.role === 'welcome' ? 'Welcome team' : 'Leader';
          return [x.id, x.role === 'leader' ? x.name + ' · ' + ((find('groups', 'id', x.group_id) || {}).name || '') : what + (x.role === 'pastor' ? ' · ' + x.name : '')];
        });
      },
      setRole: function (r) { role = r; },
      role: function () { return role; },
      reset: function () { data = seed(); role = 'pastor'; save(); },
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
      signOut: function () { return Promise.resolve(); },
      onAuth: function () {},
      me: function () { return Promise.resolve(Object.assign({}, me())); },
      loadAll: function () {
        var m = me(), out = {};
        return this.groups().then(function (gs) {
          out.groups = gs;
          TABLES.forEach(function (t) { out[t] = data[t].filter(function (r) { return canSee(t, r, m); }).map(function (r) { return Object.assign({}, r); }); });
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
            if (row.role === 'leader') { var g = find('groups', 'id', row.group_id); if (g) g.leader_name = row.name; }
          } else if (t === 'groups') {
            check(m.role === 'pastor');
          }
          data[t].unshift(row); save();
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
          if (t === 'staff') {
            if (row.role === 'pastor' && patch.role !== 'pastor' && data.staff.filter(function (s) { return s.role === 'pastor'; }).length < 2) throw new Error('The team needs at least one pastor');
            if ('phone' in patch) patch.phone = patch.phone ? Care.intl(patch.phone) : null;
            if (patch.role === 'leader') { var g = find('groups', 'id', patch.group_id); if (g) g.leader_name = patch.name || row.name; }
          }
          Object.assign(row, patch); save();
          return [row];
        });
      },
      remove: function (t, key, id) {
        return Promise.resolve().then(function () {
          var m = me(), row = find(t, key, id);
          check(row && (m.role === 'pastor' || (t === 'members' && (m.role === 'leader' || has(m, 'groups')) && canSee(t, row, m))));
          if (t === 'staff' && row.role === 'pastor' && data.staff.filter(function (s) { return s.role === 'pastor'; }).length < 2) throw new Error('The team needs at least one pastor');
          data[t] = data[t].filter(function (r) { return r !== row; });
          if (t === 'visitors') {
            data.prayers = data.prayers.filter(function (p) { return p.visitor_id !== id; });
            data.visitor_notes = data.visitor_notes.filter(function (n) { return n.visitor_id !== id; });
          }
          save();
        });
      },
      markWelcomed: function (id) {
        return Promise.resolve().then(function () {
          var m = me(), v = find('visitors', 'id', id);
          check(v && canSee('visitors', v, m));
          if (!v.welcomed_at) { v.welcomed_at = now(); v.welcomed_by = m.name; }
          save();
        });
      },
      present: function (memberId, day) {
        return Promise.resolve().then(function () {
          var row = find('members', 'id', memberId);
          check(row && canSee('members', row, me()));
          if (!data.attendance.some(function (a) { return a.member_id === memberId && a.seen_on === day; })) data.attendance.push({ member_id: memberId, seen_on: day });
          if (!row.last_seen || row.last_seen < day) row.last_seen = day;
          save();
        });
      },
      unpresent: function (memberId, day) {
        return Promise.resolve().then(function () {
          var row = find('members', 'id', memberId);
          check(row && canSee('members', row, me()));
          data.attendance = data.attendance.filter(function (a) { return !(a.member_id === memberId && a.seen_on === day); });
          var days = data.attendance.filter(function (a) { return a.member_id === memberId; }).map(function (a) { return a.seen_on; }).sort();
          row.last_seen = days.length ? days[days.length - 1] : (row.last_seen === day ? null : row.last_seen);
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
