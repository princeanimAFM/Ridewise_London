/* Church Care team app: pastor, welcome team and group leaders.
   What each person can see is decided by the database; this file only lays it out. */
(function () {
  'use strict';
  var C = window.CARE_CONFIG, Care = window.Care, Store = window.Store, esc = Care.esc;
  function $(id) { return document.getElementById(id); }

  var S = {
    me: null, tab: 'overview', vFilter: 'open', pFilter: 'open', groupId: null, day: Care.today(),
    groups: C.groups, staff: [], visitors: [], notes: [], members: [], prayers: [], sheet: null, loaded: false
  };

  /* ---------- small helpers ---------- */
  function role() { return S.me ? S.me.role : ''; }
  function isPastor() { return role() === 'pastor'; }
  function isLeader() { return role() === 'leader'; }
  function group(id) { return S.groups.filter(function (g) { return g.id === id; })[0]; }
  function groupName(id) { var g = group(id); return g ? g.name : ''; }
  function leaderOf(id) { var g = group(id); return g ? g.leader_name : ''; }
  function day(ts) { return ts ? String(ts).slice(0, 10) : ''; }
  function weeksAway(m) { var ref = m.last_seen || m.joined_at || Care.today(); return Math.max(0, Math.floor(Care.daysBetween(ref, Care.today()) / 7)); }
  function isAway(m) { return weeksAway(m) >= C.awayWeeks; }
  function isOverdue(v) { return v.status === 'new' && v.due && v.due < Care.today(); }
  function notesOf(id) { return S.notes.filter(function (n) { return n.visitor_id === id; }); }
  function fail(e) { Care.toast(Care.errText(e)); }

  function welcomeMsg(v) {
    return 'Hello ' + Care.first(v.name) + ', this is ' + S.me.name + ' from ' + C.church + '. Thank you for worshipping with us! ' +
      'We are so glad you came. Is there anything we can pray with you about this week? God bless you.';
  }
  function awayMsg(m) {
    return 'Hello ' + Care.first(m.name) + ', this is ' + S.me.name + ' from ' + C.church + '. We have missed you at church and just wanted to check on you. ' +
      'How are you and your family? We are praying for you. God bless you.';
  }
  function prayerMsg(p) {
    return 'Hello ' + Care.first(p.name) + ', this is ' + S.me.name + ' from ' + C.church + '. We received your prayer request and we are standing with you in prayer. God bless you.';
  }
  function contactButtons(phone, msg) {
    if (!phone) return '';
    return '<a class="btn sm alt" href="' + Care.telLink(phone) + '">📞 Call</a>' +
      '<a class="btn sm wa" href="' + esc(Care.waLink(phone, msg)) + '" target="_blank" rel="noopener">WhatsApp</a>';
  }
  function groupOptions(sel, blank) {
    return (blank ? '<option value="">' + esc(blank) + '</option>' : '') + S.groups.map(function (g) {
      return '<option value="' + g.id + '"' + (g.id === sel ? ' selected' : '') + '>' + esc(g.name + ' · ' + g.leader_name) + '</option>';
    }).join('');
  }

  /* ---------- data ---------- */
  var reloading = null;
  function reload() {
    clearTimeout(reloading);
    reloading = setTimeout(function () {
      Store.loadAll().then(function (d) {
        S.groups = d.groups; S.staff = d.staff; S.visitors = d.visitors; S.notes = d.visitor_notes; S.members = d.members; S.prayers = d.prayers;
        S.loaded = true; render();
      }, fail);
    }, 150);
  }
  function act(p, ok) { return p.then(function (r) { if (ok) Care.toast(ok); reload(); return r; }, fail); }

  /* ---------- start / sign in ---------- */
  function start() {
    $('signout').onclick = function () { Store.signOut().then(function () { location.reload(); }); };
    if (Store.mode === 'demo') {
      $('demo-roles').hidden = false;
      $('banner').innerHTML = '<div class="banner">Demo mode with sample people. Nothing leaves this browser. <button class="back" id="reset">Reset sample data</button></div>';
      $('reset').onclick = function () { Store.reset(); Care.toast('Sample data reset.'); };
      $('role').innerHTML = Store.roles().map(function (r) { return '<option value="' + r[0] + '">' + esc(r[1]) + '</option>'; }).join('');
      $('role').onchange = function () { Store.setRole(this.value); S.tab = 'overview'; S.groupId = null; signedIn(); };
      Store.subscribe(reload);
      return signedIn();
    }
    Store.onAuth(function () { if (!S.me) boot(); });
    boot();
  }
  function boot() {
    Store.session().then(function (session) {
      if (!session) return signInScreen();
      $('signout').hidden = false;
      return Store.me(session).then(function (me) {
        if (!me) return notOnTeam(session.user.email);
        if (!S.me) Store.subscribe(reload);
        signedIn(me);
      });
    }).catch(fail);
  }
  function signInScreen() {
    $('sub').textContent = C.church;
    $('nav').hidden = true; $('fab').hidden = true;
    $('main').innerHTML =
      '<h2>Team sign in</h2><div class="card"><p class="meta">For the pastor, the welcome team and group leaders. Use the email the pastor added to the team list.</p>' +
      '<form id="f-email"><div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" required></div>' +
      '<button class="btn wide" type="submit">Send me a sign-in code</button></form>' +
      '<form id="f-code" hidden><p>We sent a code to <b id="sent-to"></b>. Enter it below, or tap the link in that email.</p>' +
      '<div class="field"><label for="code">Code</label><input id="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></div>' +
      '<button class="btn wide" type="submit">Sign in</button> <button class="back" type="button" id="again">Use a different email</button></form>' +
      '<div id="sign-msg"></div></div>';
    var email = '';
    $('f-email').onsubmit = function (e) {
      e.preventDefault();
      email = $('email').value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return Care.toast('Please enter your email.');
      var b = this.querySelector('button'); b.disabled = true;
      Store.sendCode(email).then(function () {
        $('f-email').hidden = true; $('f-code').hidden = false; $('sent-to').textContent = email; $('code').focus();
      }, function (err) { b.disabled = false; $('sign-msg').innerHTML = '<div class="banner bad">' + esc(Care.errText(err)) + '</div>'; });
    };
    $('f-code').onsubmit = function (e) {
      e.preventDefault();
      Store.verify(email, $('code').value.trim()).then(boot, function () { $('sign-msg').innerHTML = '<div class="banner bad">That code didn\'t work. Check it, or send a new one.</div>'; });
    };
    $('again').onclick = function () { $('f-email').hidden = false; $('f-code').hidden = true; $('f-email').querySelector('button').disabled = false; };
  }
  function notOnTeam(email) {
    $('sub').textContent = C.church;
    $('main').innerHTML = '<div class="card empty"><p><b>' + esc(email) + '</b> isn\'t on the team list yet.</p><p>Ask ' + esc(C.pastor) + ' to add you, then sign in again.</p></div>';
  }
  function signedIn(me) {
    var p = me ? Promise.resolve(me) : Store.me();
    p.then(function (m) {
      S.me = m;
      var label = m.role === 'pastor' ? 'Overseeing pastor' : m.role === 'welcome' ? 'Welcome team' : 'Leader · ' + groupName(m.group_id);
      $('sub').textContent = m.name + ' · ' + label;
      $('nav').hidden = false;
      if (isLeader()) S.groupId = m.group_id;
      reload();
    });
  }

  /* ---------- layout ---------- */
  function tabs() {
    if (role() === 'welcome') return [['overview', 'Overview'], ['visitors', 'Visitors']];
    if (isLeader()) return [['overview', 'Overview'], ['visitors', 'Visitors'], ['groups', 'My group'], ['away', 'Away'], ['prayer', 'Prayer']];
    return [['overview', 'Overview'], ['visitors', 'Visitors'], ['groups', 'Groups'], ['away', 'Away'], ['prayer', 'Prayer']];
  }
  function badge(t) {
    if (t === 'visitors') {
      var n = isLeader() ? S.visitors.filter(function (v) { return v.status === 'new' && !v.seen_by_leader; }).length
        : isPastor() ? S.visitors.filter(function (v) { return v.status === 'new' && !v.assigned_to; }).length : 0;
      return n ? '<span class="dot">' + n + '</span>' : '';
    }
    if (t === 'prayer') { var p = S.prayers.filter(function (x) { return x.status === 'open'; }).length; return p ? '<span class="dot">' + p + '</span>' : ''; }
    return '';
  }
  function render() {
    if (!S.me) return;
    var ts = tabs();
    if (!ts.some(function (t) { return t[0] === S.tab; })) S.tab = 'overview';
    $('tabs').innerHTML = ts.map(function (t) {
      return '<button data-tab="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + badge(t[0]) + '</button>';
    }).join('');
    var fab = $('fab');
    fab.hidden = false;
    if (S.tab === 'groups' && (isPastor() || isLeader())) { fab.textContent = '+ Add member'; fab.dataset.act = 'new-member'; }
    else if (S.tab === 'prayer') { fab.textContent = '+ Prayer request'; fab.dataset.act = 'new-prayer'; }
    else if (S.tab === 'away') { fab.hidden = true; }
    else { fab.textContent = '+ New visitor'; fab.dataset.act = 'new-visitor'; }
    if (!S.loaded) { $('main').innerHTML = '<p class="empty">Loading…</p>'; return; }
    $('main').innerHTML = ({ overview: viewOverview, visitors: viewVisitors, groups: viewGroups, away: viewAway, prayer: viewPrayer })[S.tab]();
    if (S.sheet) openSheet(S.sheet, true);
  }

  /* ---------- overview ---------- */
  function tile(n, label, alert) { return '<div class="tile' + (alert ? ' alert' : '') + '"><b>' + n + '</b><span>' + label + '</span></div>'; }
  function viewOverview() {
    var t = Care.today(), cutoff = Care.addDays(t, -30), vs = S.visitors, ms = S.members;
    var recent = vs.filter(function (v) { return day(v.created_at) >= cutoff; });
    var reached = recent.filter(function (v) { return v.status !== 'new'; }).length;
    var times = vs.filter(function (v) { return v.reached_at; }).map(function (v) { return Math.max(0, Care.daysBetween(day(v.created_at), v.reached_at)); });
    var avg = times.length ? (times.reduce(function (a, b) { return a + b; }, 0) / times.length).toFixed(1) + ' days' : '–';
    var overdue = vs.filter(isOverdue);
    var waiting = vs.filter(function (v) { return v.status === 'new' && !v.assigned_to; });
    var h = '';
    if (isPastor()) h += '<div class="actions"><button class="btn sm alt" data-act="team">👥 Team list (' + S.staff.length + ')</button><button class="btn sm alt" data-act="qr">QR code page</button></div>';
    h += '<div class="tiles">' +
      tile(recent.length, 'New visitors, last 30 days') +
      tile(recent.length ? Math.round(reached / recent.length * 100) + '%' : '–', 'Reached (of those)') +
      tile(overdue.length, 'Follow-ups overdue', overdue.length) +
      tile(avg, 'Average time to first contact');
    if (!isLeader()) h += tile(waiting.length, 'Waiting for a leader', waiting.length);
    if (isLeader()) { var nfy = vs.filter(function (v) { return v.status === 'new' && !v.seen_by_leader; }).length; h += tile(nfy, 'New visitors for you', nfy); }
    if (role() !== 'welcome') {
      var away = ms.filter(isAway).length;
      h += tile(away, 'Away ' + C.awayWeeks + '+ weeks', away) + tile(ms.length, 'Members on the list') + tile(S.prayers.filter(function (p) { return p.status === 'open'; }).length, 'Open prayer requests');
    }
    h += '</div>';

    if (isPastor() && waiting.length) {
      h += '<h2>Waiting for a leader</h2>' + waiting.slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).map(visitorCard).join('');
    }
    if (isLeader()) {
      var mine = vs.filter(function (v) { return v.status === 'new'; });
      if (mine.length) h += '<h2>To contact</h2>' + mine.map(visitorCard).join('');
    }
    if (isPastor() && overdue.length) {
      h += '<h2>Overdue follow-ups</h2>' + overdue.map(visitorCard).join('');
    }
    if (role() !== 'welcome') {
      var gs = isLeader() ? [group(S.me.group_id)] : S.groups;
      h += '<h2>' + (isLeader() ? 'My group' : 'All groups') + '</h2><div class="card scroll"><table class="table"><thead><tr><th>Group</th><th class="n">Members</th><th class="n">Seen this week</th><th class="n">Away</th><th class="n">To contact</th><th class="n">Overdue</th></tr></thead><tbody>';
      gs.forEach(function (g) {
        var gm = ms.filter(function (m) { return m.group_id === g.id; });
        var gv = vs.filter(function (v) { return v.assigned_to === g.id; });
        h += '<tr><td><b>' + esc(g.name) + '</b><div class="meta">' + esc(g.leader_name) + '</div></td>' +
          '<td class="n">' + gm.length + '</td>' +
          '<td class="n">' + gm.filter(function (m) { return m.last_seen && Care.daysBetween(m.last_seen, t) < 7; }).length + '</td>' +
          '<td class="n">' + gm.filter(isAway).length + '</td>' +
          '<td class="n">' + gv.filter(function (v) { return v.status === 'new'; }).length + '</td>' +
          '<td class="n">' + gv.filter(isOverdue).length + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    if (!vs.length && !ms.length) h += '<div class="card empty">Nothing here yet. Visitors appear when they fill in the welcome form, or tap “+ New visitor”.</div>';
    return h;
  }

  /* ---------- visitors ---------- */
  function pill(v) {
    if (isLeader() && v.status === 'new' && !v.seen_by_leader) return '<span class="pill foryou">New for you</span>';
    if (v.status === 'joined') return '<span class="pill joined">In a group</span>';
    if (v.status === 'reached') return '<span class="pill reached">Reached</span>';
    if (isOverdue(v)) return '<span class="pill overdue">Overdue</span>';
    if (!v.assigned_to) return '<span class="pill new">Needs a leader</span>';
    return '<span class="pill new">To contact</span>';
  }
  function visitorCard(v) {
    var where = v.assigned_to ? groupName(v.assigned_to) + ' · ' + leaderOf(v.assigned_to) : (v.group_interest ? 'Interested in ' + groupName(v.group_interest) : 'Not assigned yet');
    return '<div class="card tap" data-open="visitor:' + v.id + '"><div class="row"><div class="grow"><div class="name">' + esc(v.name) + '</div>' +
      '<div class="meta">Came ' + Care.fmt(day(v.created_at)) + ' · ' + esc(where) + (v.status === 'new' && v.due ? ' · due ' + Care.fmt(v.due) : '') + '</div></div>' + pill(v) + '</div></div>';
  }
  function viewVisitors() {
    var f = S.vFilter, list = S.visitors.filter(function (v) {
      if (f === 'open') return v.status === 'new';
      if (f === 'unassigned') return v.status === 'new' && !v.assigned_to;
      if (f === 'overdue') return isOverdue(v);
      if (f === 'reached') return v.status === 'reached';
      if (f === 'joined') return v.status === 'joined';
      return true;
    });
    var chips = [['open', 'To contact'], ['overdue', 'Overdue'], ['reached', 'Reached'], ['joined', 'In a group'], ['all', 'All']];
    if (!isLeader()) chips.splice(1, 0, ['unassigned', 'Needs a leader']);
    return '<div class="chips">' + chips.map(function (c) { return '<button class="chip" data-vf="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      (list.length ? list.map(visitorCard).join('') : '<div class="card empty">No visitors here.</div>');
  }
  function sheetVisitor(id) {
    var v = S.visitors.filter(function (x) { return x.id === id; })[0];
    if (!v) return null;
    if (isLeader() && !v.seen_by_leader && !seenSent[v.id]) seenSent[v.id] = Store.update('visitors', 'id', v.id, { seen_by_leader: true }).then(reload, function () {});
    var canEdit = isPastor() || isLeader();
    var h = '<h2>' + esc(v.name) + '</h2><div class="actions">' + pill(v) + '</div>' +
      '<div class="meta">' + (v.phone ? esc(v.phone) + ' · ' : '') + 'came ' + Care.fmt(day(v.created_at)) + (v.source === 'form' ? ' (welcome form)' : '') + '</div>' +
      (v.reason ? '<div class="meta">How they came: ' + esc(v.reason) + '</div>' : '') +
      (v.invited_by ? '<div class="meta">Invited by: ' + esc(v.invited_by) + '</div>' : '') +
      (v.group_interest ? '<div class="meta">Interested in: ' + esc(groupName(v.group_interest)) + '</div>' : '') +
      (v.status === 'new' && v.due ? '<div class="meta">First contact due by ' + Care.fmt(v.due) + '</div>' : '') +
      (v.reached_at ? '<div class="meta">First reached ' + Care.fmt(v.reached_at) + '</div>' : '') +
      '<div class="actions">' + contactButtons(v.phone, welcomeMsg(v)) + '</div>';
    if (isPastor()) {
      h += '<div class="field"><label for="assign">Group leader</label><select id="assign" data-assign="' + v.id + '">' + groupOptions(v.assigned_to, 'Not assigned yet') + '</select></div>';
    } else {
      h += '<div class="meta">Leader: ' + esc(v.assigned_to ? leaderOf(v.assigned_to) + ' (' + groupName(v.assigned_to) + ')' : 'not assigned yet; the pastor will choose') + '</div>';
    }
    if (canEdit) {
      h += '<div class="actions">' +
        (v.status === 'new' ? '<button class="btn sm" data-status="reached:' + v.id + '">✓ Mark reached</button>' : '<button class="btn sm alt" data-status="new:' + v.id + '">Back to “to contact”</button>') +
        (v.status !== 'joined' && v.assigned_to ? '<button class="btn sm alt" data-join="' + v.id + '">Add to ' + esc(groupName(v.assigned_to)) + ' list</button>' : '') +
        '</div>';
    }
    var ns = notesOf(v.id);
    h += '<h2>Notes</h2>' + (ns.length ? ns.map(function (n) {
      return '<div class="note">' + esc(n.body) + '<div class="meta">' + esc(n.author || '') + ' · ' + Care.fmt(day(n.created_at)) + '</div></div>';
    }).join('') : '<p class="meta">No notes yet.</p>') +
      '<form data-note="' + v.id + '"><div class="field"><label for="note">Add a note</label><textarea id="note" maxlength="1000" placeholder="e.g. Called, prayed with her, coming on Sunday"></textarea></div><button class="btn sm" type="submit">Save note</button></form>';
    if (isPastor()) h += '<div class="actions" style="margin-top:22px"><button class="btn sm danger" data-del-visitor="' + v.id + '">Delete this person\'s record</button></div>';
    return h;
  }

  var seenSent = {};

  /* ---------- groups ---------- */
  function viewGroups() {
    var gid = S.groupId || (S.groups[0] && S.groups[0].id);
    S.groupId = gid;
    var g = group(gid), h = '';
    if (isPastor()) h += '<div class="chips">' + S.groups.map(function (x) { return '<button class="chip" data-g="' + x.id + '" aria-pressed="' + (x.id === gid) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>';
    h += '<div class="card" style="border-left-color:var(--sun)"><div class="name">' + esc(g.name) + '</div><div class="meta">' + esc(g.tag) + ' · leader ' + esc(g.leader_name) + '</div></div>';
    var ms = S.members.filter(function (m) { return m.group_id === gid; });
    var here = ms.filter(function (m) { return m.last_seen === S.day; }).length;
    h += '<div class="field"><label for="day">Service date</label><input type="date" id="day" value="' + S.day + '" max="' + Care.today() + '"></div>' +
      '<p class="meta">' + here + ' of ' + ms.length + ' marked present on ' + Care.fmt(S.day) + '. Tap a name to edit.</p>';
    if (!ms.length) return h + '<div class="card empty">No members yet. Tap “+ Add member”.</div>';
    return h + ms.map(function (m) {
      var on = m.last_seen === S.day, w = weeksAway(m);
      return '<div class="card"><div class="row"><div class="grow tap" data-open="member:' + m.id + '" style="cursor:pointer"><div class="name">' + esc(m.name) + '</div>' +
        '<div class="meta">' + (m.last_seen ? 'Last seen ' + Care.fmt(m.last_seen) : 'Not marked yet') + (w >= C.awayWeeks ? ' · <b style="color:var(--bad)">away ' + w + ' weeks</b>' : '') + '</div></div>' +
        '<button class="btn sm ' + (on ? 'on' : 'alt') + '" data-present="' + m.id + '" aria-pressed="' + on + '">' + (on ? '✓ Present' : 'Present') + '</button></div></div>';
    }).join('');
  }
  function sheetMember(id) {
    var m = id ? S.members.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !m) return null;
    var gid = m ? m.group_id : S.groupId;
    return '<h2>' + (m ? esc(m.name) : 'Add a member') + '</h2>' +
      (m ? '<div class="actions">' + contactButtons(m.phone, isAway(m) ? awayMsg(m) : '') + '</div>' : '') +
      '<form data-member="' + (m ? m.id : '') + '">' +
      '<div class="field"><label for="m-name">Name</label><input id="m-name" type="text" maxlength="80" required value="' + esc(m ? m.name : '') + '"></div>' +
      '<div class="field"><label for="m-phone">WhatsApp number</label><input id="m-phone" type="tel" inputmode="tel" maxlength="20" value="' + esc(m ? m.phone : '') + '"></div>' +
      (isPastor() ? '<div class="field"><label for="m-group">Group</label><select id="m-group">' + groupOptions(gid) + '</select></div>' : '<input type="hidden" id="m-group" value="' + gid + '">') +
      (m ? '' : '<label class="check"><input type="checkbox" id="m-consent"><span>They agreed to the church keeping these details and contacting them on WhatsApp.</span></label>') +
      '<div class="actions"><button class="btn" type="submit">' + (m ? 'Save' : 'Add to ' + esc(groupName(gid))) + '</button></div></form>' +
      (m ? '<div class="actions" style="margin-top:18px"><button class="btn sm danger" data-del-member="' + m.id + '">Remove from the list</button></div>' : '');
  }

  /* ---------- away ---------- */
  function viewAway() {
    var list = S.members.filter(isAway).sort(function (a, b) { return weeksAway(b) - weeksAway(a); });
    var h = '<p class="meta">Members not marked present for ' + C.awayWeeks + ' weeks or more. A kind message is ready in WhatsApp; just tap and send.</p>';
    if (!list.length) return h + '<div class="card empty">Everyone has been seen recently. 🙌</div>';
    return h + list.map(function (m) {
      return '<div class="card" style="border-left-color:var(--sun)"><div class="name">' + esc(m.name) + '</div>' +
        '<div class="meta">' + (isPastor() ? esc(groupName(m.group_id)) + ' · ' : '') + 'away ' + weeksAway(m) + ' weeks' + (m.last_seen ? ' · last seen ' + Care.fmt(m.last_seen) : '') + '</div>' +
        '<div class="actions">' + (contactButtons(m.phone, awayMsg(m)) || '<span class="meta">No number saved.</span>') + '</div></div>';
    }).join('');
  }

  /* ---------- prayer ---------- */
  function viewPrayer() {
    var f = S.pFilter, list = S.prayers.filter(function (p) { return f === 'all' || p.status === f; });
    var h = '<div class="chips">' + [['open', 'Open'], ['prayed', 'Prayed for'], ['all', 'All']].map(function (c) {
      return '<button class="chip" data-pf="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>';
    }).join('') + '</div>';
    if (!list.length) return h + '<div class="card empty">No prayer requests here.</div>';
    return h + list.map(function (p) {
      return '<div class="card" style="border-left-color:var(--violet)"><div class="row"><div class="grow"><div class="name">' + esc(p.name || 'Anonymous') + '</div>' +
        '<div class="meta">' + Care.fmt(day(p.created_at)) + (p.source === 'form' ? ' · from the QR page' : '') + (isPastor() ? ' · ' + esc(p.assigned_to ? groupName(p.assigned_to) : 'with the pastor') : '') + '</div></div>' +
        (p.status === 'prayed' ? '<span class="pill reached">Prayed for</span>' : '<span class="pill new">Open</span>') + '</div>' +
        '<p style="margin:8px 0;white-space:pre-wrap">' + esc(p.body) + '</p>' +
        '<div class="actions">' + (p.status === 'open' ? '<button class="btn sm" data-prayed="prayed:' + p.id + '">🙏 Mark prayed for</button>' : '<button class="btn sm alt" data-prayed="open:' + p.id + '">Reopen</button>') +
        contactButtons(p.phone, prayerMsg(p)) + '</div>' +
        (isPastor() ? '<div class="field"><label>Pass to a group leader</label><select data-passprayer="' + p.id + '">' + groupOptions(p.assigned_to, 'Keep with the pastor') + '</select></div>' : '') +
        '</div>';
    }).join('');
  }
  function sheetNewPrayer() {
    return '<h2>Prayer request</h2><form data-newprayer>' +
      '<div class="field"><label for="np-body">Prayer request</label><textarea id="np-body" maxlength="1000" required></textarea></div>' +
      '<div class="field"><label for="np-name">For (name)</label><input id="np-name" type="text" maxlength="80"></div>' +
      '<div class="field"><label for="np-phone">WhatsApp number (optional)</label><input id="np-phone" type="tel" inputmode="tel" maxlength="20"></div>' +
      (isPastor() ? '<div class="field"><label for="np-group">Group leader</label><select id="np-group">' + groupOptions(null, 'Keep with the pastor') + '</select></div>' : '') +
      (role() === 'welcome' ? '<p class="meta">It goes to the pastor. You won\'t see it in your list afterwards.</p>' : '') +
      '<button class="btn" type="submit">Save</button></form>';
  }

  /* ---------- new visitor ---------- */
  function sheetNewVisitor() {
    return '<h2>New visitor</h2><form data-newvisitor>' +
      '<div class="field"><label for="nv-name">Name</label><input id="nv-name" type="text" maxlength="80" required></div>' +
      '<div class="field"><label for="nv-phone">WhatsApp number</label><input id="nv-phone" type="tel" inputmode="tel" maxlength="20" placeholder="024 123 4567"></div>' +
      '<div class="field"><label for="nv-reason">How did they come?</label><select id="nv-reason"><option value="">Choose one</option>' + C.reasons.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="nv-invited">Invited by</label><input id="nv-invited" type="text" maxlength="80"></div>' +
      '<div class="field"><label for="nv-group">' + (isPastor() ? 'Assign to a group leader' : 'Group they\'re interested in') + '</label>' +
      (isLeader() ? '<input type="hidden" id="nv-group" value="' + S.me.group_id + '"><div class="meta">Goes to your group, ' + esc(groupName(S.me.group_id)) + '.</div>' : '<select id="nv-group">' + groupOptions(null, isPastor() ? 'Not yet' : 'Not sure') + '</select>') + '</div>' +
      '<div class="field"><label for="nv-prayer">Prayer need (optional)</label><textarea id="nv-prayer" maxlength="1000"></textarea></div>' +
      '<label class="check"><input type="checkbox" id="nv-consent"><span>They agreed to the church keeping these details and contacting them on WhatsApp.</span></label>' +
      '<div class="actions"><button class="btn" type="submit">Save visitor</button></div></form>' +
      '<p class="meta">Visitors can also fill this in themselves from the QR code page.</p>';
  }

  /* ---------- team list (pastor) ---------- */
  function sheetTeam() {
    var url = location.href.split('#')[0].split('?')[0];
    return '<h2>Team list</h2><p class="meta">Only people on this list can sign in. They sign in at <b>' + esc(url) + '</b> with their email.</p>' +
      S.staff.map(function (s) {
        var what = s.role === 'pastor' ? 'Pastor (sees everything)' : s.role === 'welcome' ? 'Welcome team (adds visitors)' : 'Leader · ' + groupName(s.group_id);
        return '<div class="card"><div class="row"><div class="grow"><div class="name">' + esc(s.name) + '</div><div class="meta">' + esc(s.email) + ' · ' + esc(what) + '</div></div>' +
          (s.email !== S.me.email ? '<button class="btn sm danger" data-del-staff="' + esc(s.email) + '">Remove</button>' : '') + '</div></div>';
      }).join('') +
      '<h2>Add someone</h2><form data-newstaff>' +
      '<div class="field"><label for="ns-name">Name</label><input id="ns-name" type="text" maxlength="80" required></div>' +
      '<div class="field"><label for="ns-email">Email</label><input id="ns-email" type="email" required></div>' +
      '<div class="field"><label for="ns-role">Role</label><select id="ns-role"><option value="leader">Group leader</option><option value="welcome">Welcome team</option><option value="pastor">Pastor (sees everything)</option></select></div>' +
      '<div class="field" id="ns-group-f"><label for="ns-group">Their group</label><select id="ns-group">' + groupOptions(null) + '</select></div>' +
      '<button class="btn" type="submit">Add to the team</button></form>';
  }
  function sheetQr() {
    var base = location.href.split('#')[0].split('?')[0].replace(/team\.html$/, '');
    return '<h2>QR code page</h2><p>The QR code opens:</p><p><a href="' + esc(base) + '" target="_blank" rel="noopener"><b>' + esc(base) + '</b></a></p>' +
      '<p class="meta">It shows the AFM HUB download, the web app and the church website, then the welcome form and the prayer request form. Print the QR code on welcome cards, the screen before service, and the notice board.</p>';
  }

  /* ---------- sheets ---------- */
  function openSheet(key, keep) {
    var parts = key.split(':'), html =
      parts[0] === 'visitor' ? sheetVisitor(parts[1]) :
      parts[0] === 'member' ? sheetMember(parts[1]) :
      parts[0] === 'new-member' ? sheetMember(null) :
      parts[0] === 'new-visitor' ? sheetNewVisitor() :
      parts[0] === 'new-prayer' ? sheetNewPrayer() :
      parts[0] === 'team' ? sheetTeam() :
      parts[0] === 'qr' ? sheetQr() : null;
    if (html === null) return closeSheet();
    var sh = $('sheet');
    var f = document.activeElement;
    if (keep && f && sh.contains(f) && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) return; // don't wipe what they're typing
    var top = keep ? sh.scrollTop : 0;
    sh.innerHTML = '<button class="back" data-close>✕ Close</button>' + html;
    sh.scrollTop = top;
    S.sheet = key;
    $('veil').className = 'veil open';
    if (key === 'team') syncRole();
  }
  function closeSheet() { S.sheet = null; $('veil').className = 'veil'; $('sheet').innerHTML = ''; }
  function syncRole() { var r = $('ns-role'); if (r) $('ns-group-f').hidden = r.value !== 'leader'; }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab],[data-act],[data-open],[data-vf],[data-pf],[data-g],[data-present],[data-status],[data-join],[data-prayed],[data-close],[data-del-visitor],[data-del-member],[data-del-staff]');
    if (!el) { if (e.target.id === 'veil') closeSheet(); return; }
    var d = el.dataset;
    if (d.tab) { S.tab = d.tab; window.scrollTo(0, 0); render(); }
    else if (d.act) openSheet(d.act);
    else if (d.open) openSheet(d.open);
    else if (d.vf) { S.vFilter = d.vf; render(); }
    else if (d.pf) { S.pFilter = d.pf; render(); }
    else if (d.g) { S.groupId = d.g; render(); }
    else if ('close' in d) closeSheet();
    else if (d.present) {
      var m = S.members.filter(function (x) { return x.id === d.present; })[0];
      act(m.last_seen === S.day ? Store.unpresent(m.id, S.day) : Store.present(m.id, S.day));
    } else if (d.status) {
      var p = d.status.split(':');
      act(Store.update('visitors', 'id', p[1], { status: p[0], seen_by_leader: true }), p[0] === 'reached' ? 'Marked reached. Well done!' : 'Moved back to “to contact”.');
    } else if (d.join) {
      var v = S.visitors.filter(function (x) { return x.id === d.join; })[0];
      act(Store.insert('members', { name: v.name, phone: v.phone, group_id: v.assigned_to, visitor_id: v.id, last_seen: null })
        .then(function () { return Store.update('visitors', 'id', v.id, { status: 'joined', seen_by_leader: true }); }), v.name + ' is now on the ' + groupName(v.assigned_to) + ' list.');
    } else if (d.prayed) {
      var q = d.prayed.split(':');
      act(Store.update('prayers', 'id', q[1], { status: q[0] }), q[0] === 'prayed' ? 'Marked prayed for. 🙏' : 'Reopened.');
    } else if (d.delVisitor) {
      if (confirm('Delete this person\'s record, notes and prayer requests? Use this when someone asks to be removed. It can\'t be undone.')) { closeSheet(); act(Store.remove('visitors', 'id', d.delVisitor), 'Record deleted.'); }
    } else if (d.delMember) {
      if (confirm('Remove this member from the list? Their attendance history goes too.')) { closeSheet(); act(Store.remove('members', 'id', d.delMember), 'Removed.'); }
    } else if (d.delStaff) {
      if (confirm('Remove ' + d.delStaff + ' from the team? They will lose access straight away.')) act(Store.remove('staff', 'email', d.delStaff), 'Removed from the team.');
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'day') { S.day = t.value || Care.today(); render(); }
    else if (t.dataset.assign) {
      var g = t.value || null;
      act(Store.update('visitors', 'id', t.dataset.assign, { assigned_to: g }), g ? 'Assigned to ' + leaderOf(g) + '. They have ' + C.followDays + ' days to make contact.' : 'Unassigned.');
    } else if (t.dataset.passprayer) {
      act(Store.update('prayers', 'id', t.dataset.passprayer, { assigned_to: t.value || null }), t.value ? 'Passed to ' + leaderOf(t.value) + '.' : 'Kept with the pastor.');
    } else if (t.id === 'ns-role') syncRole();
  });

  document.addEventListener('submit', function (e) {
    var f = e.target, d = f.dataset;
    e.preventDefault();
    function val(id) { var x = $(id); return x ? x.value.trim() : ''; }
    function digitsOk(p) { var n = p.replace(/\D/g, '').length; return !p || (n >= 9 && n <= 15); }
    if (d.note) {
      var body = val('note');
      if (!body) return;
      act(Store.insert('visitor_notes', { visitor_id: d.note, body: body }), 'Note saved.').then(function () { if ($('note')) $('note').value = ''; });
    } else if ('newvisitor' in d) {
      var o = { name: val('nv-name'), phone: val('nv-phone'), reason: val('nv-reason'), invited_by: val('nv-invited') };
      var g = val('nv-group') || null, prayer = val('nv-prayer');
      if (!o.name) return Care.toast('Please enter their name.');
      if (!digitsOk(o.phone)) return Care.toast('That WhatsApp number looks wrong.');
      if (!$('nv-consent').checked) return Care.toast('Please confirm they agreed to us keeping their details.');
      if (isPastor()) o.assigned_to = g; else o.group_interest = g;
      o.consent_at = new Date().toISOString();
      closeSheet();
      act(Store.insert('visitors', o).then(function (v) {
        if (prayer) return Store.insert('prayers', { name: o.name, phone: o.phone, body: prayer, assigned_to: v.assigned_to || null });
      }), o.name + ' added.' + (role() === 'welcome' ? ' The pastor will assign a leader.' : ''));
    } else if ('member' in d) {
      var m = { name: val('m-name'), phone: val('m-phone'), group_id: val('m-group') };
      if (!m.name) return Care.toast('Please enter a name.');
      if (!digitsOk(m.phone)) return Care.toast('That WhatsApp number looks wrong.');
      if (!d.member && !$('m-consent').checked) return Care.toast('Please confirm they agreed to us keeping their details.');
      closeSheet();
      act(d.member ? Store.update('members', 'id', d.member, m) : Store.insert('members', m), d.member ? 'Saved.' : m.name + ' added.');
    } else if ('newprayer' in d) {
      var p = { body: val('np-body'), name: val('np-name'), phone: val('np-phone') };
      if (!p.body) return Care.toast('Please write the prayer request.');
      if (isPastor()) p.assigned_to = val('np-group') || null;
      closeSheet();
      act(Store.insert('prayers', p), 'Prayer request saved.');
    } else if ('newstaff' in d) {
      var s = { name: val('ns-name'), email: val('ns-email').toLowerCase(), role: val('ns-role') };
      s.group_id = s.role === 'leader' ? val('ns-group') : null;
      if (!s.name || !/^\S+@\S+\.\S+$/.test(s.email)) return Care.toast('Please enter a name and email.');
      act(Store.insert('staff', s), s.name + ' can now sign in.');
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSheet(); });
  start();
})();
