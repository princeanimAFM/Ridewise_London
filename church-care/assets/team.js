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
  function isMember() { return role() === 'member'; }
  /** The pastor has every area; a PA has the ones the pastor ticked. */
  function can(area) { return isPastor() || (role() === 'pa' && (S.me.areas || []).indexOf(area) >= 0); }
  function canPrayer() { return can('prayer_groups') || can('prayer_pastor'); }
  var AREAS = [['visitors', 'Visitors', 'See all visitors and give them a group leader'], ['groups', 'Groups', 'Every group\'s members, attendance and the Away list'],
    ['prayer_groups', 'Group prayer requests', 'Prayer requests meant for group leaders'], ['prayer_pastor', 'Prayer requests to the pastor', 'Requests people sent to the pastor only']];
  function group(id) { return S.groups.filter(function (g) { return g.id === id; })[0]; }
  function groupName(id) { var g = group(id); return g ? g.name : ''; }
  function leaderOf(id) { var g = group(id); return g ? g.leader_name : ''; }
  function day(ts) { return ts ? String(ts).slice(0, 10) : ''; }
  function weeksAway(m) { var ref = m.last_seen || m.joined_at || Care.today(); return Math.max(0, Math.floor(Care.daysBetween(ref, Care.today()) / 7)); }
  function isAway(m) { return weeksAway(m) >= C.awayWeeks; }
  function isOverdue(v) { return v.status === 'new' && v.due && v.due < Care.today(); }
  function notesOf(id) { return S.notes.filter(function (n) { return n.visitor_id === id; }); }
  function fail(e) { Care.toast(Care.errText(e)); }

  function welcomeMsg(v) { return window.CareWords.whatsapp(Care.first(v.name), day(v.created_at), S.me.name); }
  var COLORS = ['#1552B5', '#2D6A3E', '#C9A227', '#56A3FF', '#0A3A80', '#C62828', '#7A4DFF'];
  function avatar(name) {
    var n = String(name || '?').trim(), h = 0;
    for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    var ini = n.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
    return '<span class="avatar" style="background:' + COLORS[h % COLORS.length] + '">' + esc(ini || '?') + '</span>';
  }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function welcomeButton(v) {
    if (!v.phone) return '';
    return '<a class="btn sm wa" data-welcome="' + v.id + '" href="' + esc(Care.waLink(v.phone, welcomeMsg(v))) + '" target="_blank" rel="noopener">' +
      (v.welcomed_at ? '💬 Send welcome again' : '💬 Send welcome message') + '</a>';
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
      return '<option value="' + g.id + '"' + (g.id === sel ? ' selected' : '') + '>' + esc((g.leader_name ? g.leader_name + ' (' + g.name + ')' : g.name)) + '</option>';
    }).join('');
  }

  /* ---------- data ---------- */
  var reloading = null;
  function reload() {
    clearTimeout(reloading);
    reloading = setTimeout(function () {
      if (isMember()) return loadMember();
      Store.loadAll().then(function (d) {
        S.groups = d.groups; S.staff = d.staff; S.visitors = d.visitors; S.notes = d.visitor_notes; S.members = d.members; S.prayers = d.prayers;
        S.loaded = true;
        if (Store.mode === 'demo') demoRoles();
        render();
      }, fail);
    }, 150);
  }
  function act(p, ok) { return p.then(function (r) { if (ok) Care.toast(ok); reload(); return r; }, fail); }

  function demoRoles() {
    var cur = Store.role();
    $('role').innerHTML = Store.roles().map(function (r) { return '<option value="' + esc(r[0]) + '"' + (r[0] === cur ? ' selected' : '') + '>' + esc(r[1]) + '</option>'; }).join('');
  }

  /* ---------- start / sign in ---------- */
  function start() {
    $('signout').onclick = function () { Store.signOut().then(function () { location.reload(); }); };
    if (Store.mode === 'demo') {
      $('demo-roles').hidden = false;
      $('banner').innerHTML = '<div class="banner"><b>Preview</b> with sample people. Nothing leaves this phone. <button class="back" id="reset">Reset</button> · <a href="team.html?signin=1">See the sign-in screen</a></div>';
      $('reset').onclick = function () { Store.reset(); Care.toast('Sample data reset.'); };
      demoRoles();
      $('role').onchange = function () { Store.setRole(this.value); S.tab = 'overview'; S.groupId = null; signedIn(); };
      Store.subscribe(reload);
      if (inviteToken()) { $('demo-roles').hidden = true; $('banner').innerHTML = '<div class="banner"><b>Preview</b> of an invite link. No real code is sent; type any 6 digits.</div>'; return inviteFlow(inviteToken()); }
      if (/[?&]signin/.test(location.search)) { $('demo-roles').hidden = true; return signInScreen(); }
      return signedIn();
    }
    if (inviteToken()) return inviteFlow(inviteToken());
    Store.onAuth(function () { if (!S.me) boot(); });
    boot();
  }
  function boot() {
    Store.session().then(function (session) {
      if (!session) return signInScreen();
      $('signout').hidden = false;
      return Store.me(session).then(function (me) {
        if (!me) return notOnTeam(session.user.email || (session.user.phone ? '+' + session.user.phone : 'This account'));
        if (!S.me) Store.subscribe(reload);
        signedIn(me);
      });
    }).catch(fail);
  }
  function signInScreen(opts) {
    opts = opts || {};
    if (!opts.intro) { $('hello').textContent = 'Sign in'; $('sub').textContent = 'For the church team and group members'; }
    $('nav').hidden = true; $('fab').hidden = true;
    var ways = C.signIn || { whatsapp: true, email: true }, how = ways.whatsapp ? 'whatsapp' : 'email', target = '';
    $('main').innerHTML = (opts.intro || '') +
      '<div class="card top" style="margin-top:16px">' +
      (ways.whatsapp && ways.email ? '<div class="chips"><button class="chip" data-how="whatsapp" aria-pressed="true">💬 WhatsApp</button><button class="chip" data-how="email" aria-pressed="false">✉️ Email</button></div>' : '') +
      '<form id="f-start"><p class="meta" id="how-note"></p><div class="field"><label for="who" id="who-label"></label><input id="who" required></div>' +
      '<button class="btn wide blue" type="submit">Send me a sign-in code</button></form>' +
      '<form id="f-code" hidden><p>We sent a 6-digit code to <b id="sent-to"></b>.</p>' +
      '<div class="field"><label for="code">Code</label><input id="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" style="font-size:1.4rem;letter-spacing:.3em;text-align:center"></div>' +
      '<button class="btn wide blue" type="submit">Sign in</button> <button class="back" type="button" id="again">Send to a different number or email</button></form>' +
      '<div id="sign-msg"></div></div>';
    function setHow(h) {
      how = h;
      Array.prototype.forEach.call(document.querySelectorAll('[data-how]'), function (b) { b.setAttribute('aria-pressed', b.dataset.how === h); });
      var w = $('who');
      if (h === 'whatsapp') {
        $('how-note').textContent = opts.intro ? 'Enter your WhatsApp number. We\'ll send a code to it on WhatsApp.' : 'Use your WhatsApp number. The code arrives as a WhatsApp message.';
        $('who-label').textContent = 'Your WhatsApp number'; w.type = 'tel'; w.inputMode = 'tel'; w.autocomplete = 'tel'; w.placeholder = '024 123 4567';
      } else {
        $('how-note').textContent = 'We\'ll email you a code.';
        $('who-label').textContent = 'Your email'; w.type = 'email'; w.inputMode = 'email'; w.autocomplete = 'email'; w.placeholder = '';
      }
      w.value = '';
    }
    setHow(how);
    $('main').onclick = function (e) { var b = e.target.closest('[data-how]'); if (b) setHow(b.dataset.how); };
    $('f-start').onsubmit = function (e) {
      e.preventDefault();
      var v = $('who').value.trim();
      if (how === 'whatsapp') {
        var n = v.replace(/\D/g, '').length;
        if (n < 9 || n > 15) return Care.toast('Please enter your WhatsApp number.');
        target = '+' + Care.intl(v);
      } else {
        if (!/^\S+@\S+\.\S+$/.test(v)) return Care.toast('Please enter your email.');
        target = v.toLowerCase();
      }
      var b = this.querySelector('button'); b.disabled = true; $('sign-msg').innerHTML = '';
      Store.sendCode(how, target).then(function () {
        $('f-start').hidden = true; $('f-code').hidden = false; $('sent-to').textContent = target; $('code').focus();
        var ch = document.querySelector('.chips'); if (ch) ch.hidden = true;
      }, function (err) { b.disabled = false; $('sign-msg').innerHTML = '<div class="banner bad">' + esc(Care.errText(err)) + '</div>'; });
    };
    $('f-code').onsubmit = function (e) {
      e.preventDefault();
      Store.verify(how, target, $('code').value.trim()).then(opts.onDone ? function () { opts.onDone(target); } : Store.mode === 'demo' ? function () { location.href = 'team.html'; } : boot, function () { $('sign-msg').innerHTML = '<div class="banner bad">That code didn\'t work. Check it, or send a new one.</div>'; });
    };
    $('again').onclick = function () {
      $('f-start').hidden = false; $('f-code').hidden = true; $('f-start').querySelector('button').disabled = false;
      var ch = document.querySelector('.chips'); if (ch) ch.hidden = false;
    };
  }
  function notOnTeam(email) {
    $('hello').textContent = 'Almost there'; $('sub').textContent = C.church;
    $('main').innerHTML = '<div class="card empty"><p><b>' + esc(email) + '</b> hasn\'t joined yet.</p><p>Ask your group leader for your group\'s join link, or ask ' + esc(C.pastor) + ' to add you to the team.</p></div>';
  }
  function signedIn(me) {
    var p = me ? Promise.resolve(me) : Store.me();
    p.then(function (m) {
      S.me = m;
      var label = m.role === 'pastor' ? 'Overseeing pastor' : m.role === 'welcome' ? 'Welcome team' : m.role === 'pa' ? 'PA to the pastor' : m.role === 'member' ? 'Member' : 'Leader · ' + groupName(m.group_id);
      if (m.role === 'member') S.groupId = m.group_id;
      $('hello').textContent = greeting() + ', ' + m.name.split(/\s+/).slice(0, 2).join(' ');
      $('sub').textContent = label + ' · ' + C.church;
      $('nav').hidden = false;
      if (isLeader()) S.groupId = m.group_id;
      reload();
    });
  }

  /* ---------- layout ---------- */
  function tabs() {
    if (isMember()) return [['overview', 'My group', '👥'], ['prayer', 'Prayer', '🙏']];
    if (role() === 'welcome') return [['overview', 'Home', '🏠'], ['visitors', 'Visitors', '👋']];
    if (role() === 'pa') {
      var t = [['overview', 'Home', '🏠']];
      if (can('visitors')) t.push(['visitors', 'Visitors', '👋']);
      if (can('groups')) t.push(['groups', 'Groups', '👥'], ['away', 'Away', '💛']);
      if (canPrayer()) t.push(['prayer', 'Prayer', '🙏']);
      return t;
    }
    if (isLeader()) return [['overview', 'Home', '🏠'], ['visitors', 'Visitors', '👋'], ['groups', 'My group', '👥'], ['away', 'Away', '💛'], ['prayer', 'Prayer', '🙏']];
    return [['overview', 'Home', '🏠'], ['visitors', 'Visitors', '👋'], ['groups', 'Groups', '👥'], ['away', 'Away', '💛'], ['prayer', 'Prayer', '🙏']];
  }
  function badge(t) {
    if (t === 'visitors') {
      var n = isLeader() ? S.visitors.filter(function (v) { return v.status === 'new' && !v.seen_by_leader; }).length
        : can('visitors') ? S.visitors.filter(function (v) { return v.status === 'new' && !v.assigned_to; }).length : 0;
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
      return '<button data-tab="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '><i>' + t[2] + '</i>' + t[1] + badge(t[0]) + '</button>';
    }).join('');
    var fab = $('fab');
    fab.hidden = false;
    if (isMember()) fab.hidden = true;
    if (S.tab === 'groups' && (can('groups') || isLeader())) { fab.textContent = '+ Add member'; fab.dataset.act = 'new-member'; }
    else if (S.tab === 'prayer') { fab.textContent = '+ Prayer request'; fab.dataset.act = 'new-prayer'; }
    else if (S.tab === 'away') { fab.hidden = true; }
    else if (role() === 'pa' && !can('visitors')) { fab.hidden = true; }
    else { fab.textContent = '+ New visitor'; fab.dataset.act = 'new-visitor'; }
    if (!S.loaded) { $('main').innerHTML = '<p class="empty">Loading…</p>'; return; }
    $('main').innerHTML = isMember() ? (S.tab === 'prayer' ? viewMemberPrayer() : viewMemberHome())
      : ({ overview: viewOverview, visitors: viewVisitors, groups: viewGroups, away: viewAway, prayer: viewPrayer })[S.tab]();
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
    if (role() === 'pa') h += '<div class="banner ok">You are the pastor\'s PA. You can see: ' + esc(AREAS.filter(function (a) { return can(a[0]); }).map(function (a) { return a[1]; }).join(', ') || 'nothing yet') + '.</div>';
    if (isPastor()) h += '<div class="actions"><button class="btn sm alt" data-act="team">👥 Team & groups (' + S.staff.length + ')</button><button class="btn sm alt" data-act="qr">QR code page</button></div>';
    h += '<div class="tiles">' +
      tile(recent.length, 'New visitors, last 30 days') +
      tile(recent.length ? Math.round(reached / recent.length * 100) + '%' : '–', 'Reached (of those)') +
      tile(overdue.length, 'Follow-ups overdue', overdue.length) +
      tile(avg, 'Average time to first contact');
    if (can('visitors') || role() === 'welcome') h += tile(waiting.length, 'Waiting for a leader', waiting.length);
    if (isLeader()) { var nfy = vs.filter(function (v) { return v.status === 'new' && !v.seen_by_leader; }).length; h += tile(nfy, 'New visitors for you', nfy); }
    if (can('groups') || isLeader()) { var away = ms.filter(isAway).length; h += tile(away, 'Away ' + C.awayWeeks + '+ weeks', away) + tile(ms.length, 'Members on the list'); }
    if (canPrayer() || isLeader()) h += tile(S.prayers.filter(function (p) { return p.status === 'open'; }).length, 'Open prayer requests');
    h += '</div>';

    var toWelcome = vs.filter(function (v) { return !v.welcomed_at && v.phone && v.status !== 'joined'; });
    if (toWelcome.length) {
      h += '<h2 class="sec">Welcome messages to send</h2><p class="meta" style="margin-top:-4px">A warm welcome, a prayer and the app links, ready in WhatsApp. Tap, then press send.</p>' +
        toWelcome.map(function (v) {
          return '<div class="card top green"><div class="row">' + avatar(v.name) + '<div class="grow"><div class="name">' + esc(v.name) + '</div><div class="meta">Came ' + Care.fmt(day(v.created_at)) + '</div></div></div>' +
            '<div class="actions" style="margin-bottom:0">' + welcomeButton(v) + '<button class="btn sm alt" data-open="visitor:' + v.id + '">Details</button></div></div>';
        }).join('');
    }
    if (can('visitors') && waiting.length) {
      h += '<h2 class="sec">Waiting for a leader</h2>' + waiting.slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).map(visitorCard).join('');
    }
    if (isLeader()) {
      var mine = vs.filter(function (v) { return v.status === 'new'; });
      if (mine.length) h += '<h2 class="sec">To contact</h2>' + mine.map(visitorCard).join('');
    }
    if (can('visitors') && overdue.length) {
      h += '<h2 class="sec">Overdue follow-ups</h2>' + overdue.map(visitorCard).join('');
    }
    if (can('groups') || isLeader()) {
      var gs = isLeader() ? [group(S.me.group_id)] : S.groups;
      h += '<h2 class="sec">' + (isLeader() ? 'My group' : 'All groups') + '</h2><div class="card scroll"><table class="table"><thead><tr><th>Group</th><th class="n">Members</th><th class="n">Seen this week</th><th class="n">Away</th><th class="n">To contact</th><th class="n">Overdue</th></tr></thead><tbody>';
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
    var where = v.assigned_to ? 'Leader: ' + leaderOf(v.assigned_to) : (v.group_interest ? 'Chose ' + groupName(v.group_interest) : 'No leader yet');
    return '<div class="card tap" data-open="visitor:' + v.id + '"><div class="row">' + avatar(v.name) + '<div class="grow"><div class="name">' + esc(v.name) + '</div>' +
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
    var canEdit = can('visitors') || isLeader();
    var h = '<div class="row" style="justify-content:flex-start">' + avatar(v.name) + '<h2>' + esc(v.name) + '</h2></div><div class="actions">' + pill(v) + '</div>' +
      '<div class="meta">' + (v.phone ? esc(v.phone) + ' · ' : '') + 'came ' + Care.fmt(day(v.created_at)) + (v.source === 'form' ? ' (welcome form)' : '') + '</div>' +
      (v.reason ? '<div class="meta">How they came: ' + esc(v.reason) + '</div>' : '') +
      (v.invited_by ? '<div class="meta">Invited by: ' + esc(v.invited_by) + '</div>' : '') +
      (v.group_interest ? '<div class="meta">Group they chose: ' + esc(groupName(v.group_interest)) + '</div>' : '') +
      '<div class="meta" style="margin-top:4px"><b>Leader: ' + esc(v.assigned_to ? leaderOf(v.assigned_to) + ' (' + groupName(v.assigned_to) + ')' : 'not given a leader yet') + '</b></div>' +
      (v.status === 'new' && v.due ? '<div class="meta">First contact due by ' + Care.fmt(v.due) + '</div>' : '') +
      (v.reached_at ? '<div class="meta">First reached ' + Care.fmt(v.reached_at) + '</div>' : '') +
      (v.welcomed_at ? '<div class="meta">💬 Welcome sent ' + Care.fmt(day(v.welcomed_at)) + (v.welcomed_by ? ' by ' + esc(v.welcomed_by) : '') + '</div>' : '') +
      '<div class="actions">' + welcomeButton(v) + (v.phone ? '<a class="btn sm alt" href="' + Care.telLink(v.phone) + '">📞 Call</a>' : '') + '</div>';
    if (can('visitors')) {
      h += '<div class="field"><label for="assign">' + (v.assigned_to ? 'Change leader' : 'Give her or him a leader') + '</label><select id="assign" data-assign="' + v.id + '">' + groupOptions(v.assigned_to, 'Not assigned yet') + '</select></div>';
    } else {
      if (!v.assigned_to) h += '<div class="meta">The pastor will choose a leader.</div>';
    }
    if (canEdit) {
      h += '<div class="actions">' +
        (v.status === 'new' ? '<button class="btn sm" data-status="reached:' + v.id + '">✓ Mark reached</button>' : '<button class="btn sm alt" data-status="new:' + v.id + '">Back to “to contact”</button>') +
        (v.status !== 'joined' && v.assigned_to ? '<button class="btn sm alt" data-join="' + v.id + '">Add to ' + esc(groupName(v.assigned_to)) + ' list</button>' : '') +
        '</div>';
    }
    var ns = notesOf(v.id);
    h += '<h2 class="sec">Notes</h2>' + (ns.length ? ns.map(function (n) {
      return '<div class="note">' + esc(n.body) + '<div class="meta">' + esc(n.author || '') + ' · ' + Care.fmt(day(n.created_at)) + '</div></div>';
    }).join('') : '<p class="meta">No notes yet.</p>') +
      '<form data-note="' + v.id + '"><div class="field"><label for="note">Add a note</label><textarea id="note" maxlength="1000" placeholder="e.g. Called, prayed with her, coming on Sunday"></textarea></div><button class="btn sm" type="submit">Save note</button></form>';
    if (isPastor()) h += '<div class="actions" style="margin-top:22px"><button class="btn sm danger" data-del-visitor="' + v.id + '">Delete this person\'s record</button></div>';
    return h;
  }

  var seenSent = {};

  /* ---------- invite links ---------- */
  S.links = {}; S.leaderLinks = {}; var linkBusy = {};
  function inviteToken() { var m = /[?&]invite=([a-z0-9]{8,64})/i.exec(location.search) || /#invite-([a-z0-9]{8,64})/i.exec(location.hash); return m ? m[1] : null; }
  function appUrl() { return location.href.split('#')[0].split('?')[0]; }
  function inviteUrl(t) { return appUrl() + '?invite=' + t; }
  function memberInviteText(g, t) {
    return 'You are invited to join ' + g.name + ' on The AFM Church app 🙏\n' +
      'Tap the link and sign in with your WhatsApp number. You will see our group and our leader, and you can send prayer requests.\n' + inviteUrl(t);
  }
  function leaderInviteText(g, t) {
    return 'Hello' + (g.leader_name ? ' ' + g.leader_name : '') + ', ' + C.pastor + ' has invited you to lead ' + g.name + ' on The AFM Church app. ' +
      'Tap the link and sign in with your WhatsApp number. You will go straight to your group:\n' + inviteUrl(t);
  }
  function shareLink(text) { return 'https://wa.me/?text=' + encodeURIComponent(text); }
  function linkBox(url, text, extra) {
    return '<div class="field"><input type="text" readonly value="' + esc(url) + '" onclick="this.select()" aria-label="Invite link"></div>' +
      '<div class="actions"><button class="btn sm blue" data-copy="' + esc(text) + '">📋 Copy invite</button>' +
      '<a class="btn sm wa" href="' + esc(shareLink(text)) + '" target="_blank" rel="noopener">💬 Send on WhatsApp</a>' + (extra || '') +
      (Store.mode === 'demo' ? '<a class="btn sm alt" href="' + esc(url) + '">▶ Try the link (preview)</a>' : '') + '</div>';
  }
  function getMemberLink(gid) {
    if (S.links[gid] || linkBusy[gid]) return;
    linkBusy[gid] = true;
    Store.createInvite(gid, 'member').then(function (t) { S.links[gid] = t; linkBusy[gid] = false; render(); }, function (e) { linkBusy[gid] = false; fail(e); });
  }
  function inviteCard(gid) {
    var g = group(gid), t = S.links[gid];
    if (!g || !(can('groups') || isLeader())) return '';
    if (!t) getMemberLink(gid);
    var ms = S.members.filter(function (m) { return m.group_id === gid; }), on = ms.filter(function (m) { return m.joined_app_at; }).length;
    return '<div class="card top green"><div class="kicker">Invite your group</div>' +
      '<h3 style="font-size:1.1rem;color:var(--navy-800);margin:4px 0 2px">' + on + ' of ' + ms.length + (ms.length === 1 ? ' member is' : ' members are') + ' on the app</h3>' +
      '<p class="meta" style="margin:0 0 6px">Send this link to your group\'s WhatsApp, or to each member. When they join, they see only this group.</p>' +
      (t ? linkBox(inviteUrl(t), memberInviteText(g, t), '<button class="btn sm alt" data-reset-link="' + gid + '">New link</button>') : '<p class="meta">Making the link…</p>') + '</div>';
  }
  function sheetLeaderLink(gid) {
    var g = group(gid), t = S.leaderLinks[gid];
    if (!g) return null;
    if (!t && !linkBusy['L' + gid]) {
      linkBusy['L' + gid] = true;
      Store.createInvite(gid, 'leader').then(function (tok) { S.leaderLinks[gid] = tok; linkBusy['L' + gid] = false; openSheet('leaderlink:' + gid, true); }, function (e) { linkBusy['L' + gid] = false; fail(e); });
    }
    return '<button class="back" data-open="team">‹ Team & groups</button><h2>Invite a leader</h2>' +
      '<p>For <b>' + esc(g.name) + '</b>. Send this link to ' + esc(g.leader_name || 'the leader') + '. When they open it and sign in with their WhatsApp number, they become this group\'s leader and see only this group.</p>' +
      (t ? linkBox(inviteUrl(t), leaderInviteText(g, t)) : '<p class="meta">Making the link…</p>') +
      '<p class="meta">The link works once, for one person. Making a new link cancels this one.</p>';
  }

  /* ---------- joining from an invite link ---------- */
  function inviteFlow(token) {
    $('nav').hidden = true; $('fab').hidden = true;
    $('hello').textContent = 'You\'re invited'; $('sub').textContent = C.church;
    $('main').innerHTML = '<p class="empty">Opening your invite…</p>';
    Store.inviteInfo(token).then(function (info) {
      if (!info || !info.valid) {
        $('main').innerHTML = '<div class="card top red" style="margin-top:16px"><h3 style="color:var(--navy-800)">This link no longer works</h3><p>It may have been used already or replaced by a new one. Ask ' +
          (info && info.kind === 'leader' ? 'the pastor' : 'your group leader') + ' to send you a new link.</p></div>';
        return;
      }
      var lead = info.kind === 'leader';
      $('hello').textContent = lead ? 'Lead ' + info.group : 'Join ' + info.group;
      var intro = '<div class="card top gold" style="margin-top:16px"><div class="kicker">' + (lead ? 'Group leader invite' : 'Group invite') + '</div>' +
        '<h3 style="font-size:1.25rem;color:var(--navy-800);margin:4px 0">' + esc(info.group) + '</h3>' +
        (info.tag ? '<div class="meta">' + esc(info.tag) + '</div>' : '') +
        '<p style="margin:8px 0 0">' + (lead ? C.pastor + ' has invited you to lead this group. You will see your group\'s members, new visitors and prayer requests, and invite your members.'
          : 'You are invited to join this group' + (info.leader ? ', led by ' + esc(info.leader) : '') + '. You will see your group and your leader, and you can send prayer requests.') + '</p></div>';
      function nameStep(target) {
        $('main').innerHTML = intro + '<form class="card top" id="f-join" style="margin-top:10px"><div class="field"><label for="join-name">Your name</label><input id="join-name" type="text" maxlength="80" autocomplete="name" required></div>' +
          '<button class="btn wide blue" type="submit">' + (lead ? 'Become the group leader' : 'Join the group') + '</button><div id="join-msg"></div></form>';
        $('join-name').focus();
        $('f-join').onsubmit = function (e) {
          e.preventDefault();
          var n = $('join-name').value.trim();
          if (!n) return Care.toast('Please enter your name.');
          Store.acceptInvite(token, n, target).then(function () { location.href = appUrl(); },
            function (err) { $('join-msg').innerHTML = '<div class="banner bad">' + esc(Care.errText(err)) + '</div>'; });
        };
      }
      Store.session().then(function (session) {
        if (session && Store.mode !== 'demo') { $('signout').hidden = false; return nameStep(); }
        signInScreen({ intro: intro, onDone: nameStep });
      });
    }, fail);
  }

  /* ---------- members' own app ---------- */
  function loadMember() {
    var gs = S.me.groups || [{ group_id: S.me.group_id }];
    Promise.all(gs.map(function (g) { return Store.groupView(g.group_id); }).concat([Store.myPrayers(), Store.groups()])).then(function (r) {
      S.mview = {}; gs.forEach(function (g, i) { S.mview[g.group_id] = r[i]; });
      S.myPrayers = r[gs.length]; S.groups = r[gs.length + 1];
      if (!S.mview[S.groupId]) S.groupId = gs[0].group_id;
      S.loaded = true;
      if (Store.mode === 'demo') demoRoles();
      render();
    }, fail);
  }
  function viewMemberHome() {
    var v = S.mview[S.groupId], g = v.group, ppl = v.people || [], h = '';
    var gs = S.me.groups || [];
    if (gs.length > 1) h += '<div class="chips">' + gs.map(function (x) { return '<button class="chip" data-mg="' + x.group_id + '" aria-pressed="' + (x.group_id === S.groupId) + '">' + esc(groupName(x.group_id)) + '</button>'; }).join('') + '</div>';
    h += '<div class="card top gold" style="margin-top:12px">' + (g.tag ? '<div class="kicker">' + esc(g.tag) + '</div>' : '<div class="kicker">My group</div>') +
      '<h3 style="font-size:1.35rem;color:var(--navy-800);margin:4px 0 2px">' + esc(g.name) + '</h3>' +
      '<div class="meta">Leader: <b>' + esc(g.leader_name || 'not set yet') + '</b></div>' +
      '<div class="actions">' + (v.leader_phone ? '<a class="btn sm wa" href="' + esc(Care.waLink(v.leader_phone, 'Hello ' + (g.leader_name || '') + ', this is ' + S.me.name + ' from ' + g.name + '.')) + '" target="_blank" rel="noopener">💬 Message my leader</a>' : '') +
      '<button class="btn sm blue" data-tab="prayer">🙏 Send a prayer request</button></div></div>';
    var on = ppl.filter(function (p) { return p.on_app; }).length;
    h += '<h2 class="sec">Our group</h2><p class="meta" style="margin-top:-4px">' + ppl.length + ' members · ' + on + ' on the app</p>' +
      '<div class="card">' + ppl.map(function (p) {
        return '<div class="row" style="padding:5px 0">' + avatar(p.name) + '<div class="grow name">' + esc(p.name) + '</div>' + (p.on_app ? '<span class="pill reached">📱 On the app</span>' : '') + '</div>';
      }).join('') + '</div>';
    h += '<h2 class="sec">Church</h2><div class="card">' + C.services.map(function (x) {
      return '<div class="row" style="padding:4px 0"><b style="font-family:var(--serif);color:var(--navy-800);width:40px">' + esc(x.day) + '</b><div class="grow"><div class="name">' + esc(x.what) + '</div><div class="meta">' + esc(x.when) + ' GMT · ' + esc(x.where) + '</div></div></div>';
    }).join('') + '<div class="actions"><a class="btn sm blue" href="' + esc(C.links.playStore) + '" target="_blank" rel="noopener">📱 AFM HUB app</a><a class="btn sm alt" href="' + esc(C.links.website) + '" target="_blank" rel="noopener">⛪ Website</a></div></div>';
    return h;
  }
  function viewMemberPrayer() {
    var v = S.mview[S.groupId], g = v.group;
    var h = '<form class="card top" data-mprayer style="margin-top:12px"><div class="kicker">Prayer request</div>' +
      '<div class="field"><label for="mp-body">What can we pray with you about?</label><textarea id="mp-body" maxlength="1000" required></textarea></div>' +
      '<div class="field"><label for="mp-to">Who should read it?</label><select id="mp-to"><option value="leader">My group leader' + (g.leader_name ? ', ' + esc(g.leader_name) : '') + '</option>' +
      '<option value="pastor">🔒 ' + esc(C.pastor.replace(' D.D', '')) + ' (the pastor) only</option></select></div>' +
      '<button class="btn blue" type="submit">Send</button></form>';
    var mine = S.myPrayers || [];
    h += '<h2 class="sec">My prayer requests</h2>' + (mine.length ? mine.map(function (p) {
      return '<div class="card top ' + (p.to_pastor ? 'gold' : 'sky') + '"><div class="row"><div class="meta grow">' + Care.fmt(day(p.created_at)) + ' · ' + (p.to_pastor ? '🔒 To the pastor' : 'To my leader') + '</div>' +
        (p.status === 'prayed' ? '<span class="pill reached">Prayed for 🙏</span>' : '<span class="pill new">Received</span>') + '</div><p style="margin:6px 0 0;white-space:pre-wrap">' + esc(p.body) + '</p></div>';
    }).join('') : '<div class="card empty">Your prayer requests will show here, with a note when they have been prayed for.</div>');
    return h;
  }

  /* ---------- groups ---------- */
  function viewGroups() {
    var gid = S.groupId || (S.groups[0] && S.groups[0].id);
    S.groupId = gid;
    var g = group(gid), h = '';
    if (!isLeader()) h += '<div class="chips">' + S.groups.map(function (x) { return '<button class="chip" data-g="' + x.id + '" aria-pressed="' + (x.id === gid) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>';
    h += '<div class="card top gold">' + (g.tag ? '<div class="kicker">' + esc(g.tag) + '</div>' : '') + '<h3 style="font-size:1.4rem;color:var(--navy-800);margin-top:4px">' + esc(g.name) + '</h3><div class="meta">Leader: ' + esc(g.leader_name) + '</div></div>';
    var ms = S.members.filter(function (m) { return m.group_id === gid; });
    var here = ms.filter(function (m) { return m.last_seen === S.day; }).length;
    h += inviteCard(gid);
    h += '<div class="field"><label for="day">Service date</label><input type="date" id="day" value="' + S.day + '" max="' + Care.today() + '"></div>' +
      '<p class="meta">' + here + ' of ' + ms.length + ' marked present on ' + Care.fmt(S.day) + '. Tap a name to edit.</p>';
    if (!ms.length) return h + '<div class="card empty">No members yet. Tap “+ Add member”.</div>';
    return h + ms.map(function (m) {
      var on = m.last_seen === S.day, w = weeksAway(m);
      return '<div class="card"><div class="row">' + avatar(m.name) + '<div class="grow tap" data-open="member:' + m.id + '" style="cursor:pointer"><div class="name">' + esc(m.name) + '</div>' +
        '<div class="meta">' + (m.joined_app_at ? '<span class="pill reached">📱 On the app</span> ' : (m.phone && S.links[m.group_id] ? '<a class="pill new" href="' + esc(Care.waLink(m.phone, 'Hello ' + Care.first(m.name) + '! ' + memberInviteText(group(m.group_id), S.links[m.group_id]))) + '" target="_blank" rel="noopener">💬 Invite to the app</a> ' : '')) +
        (m.last_seen ? 'Last seen ' + Care.fmt(m.last_seen) : 'Not marked yet') + (w >= C.awayWeeks ? ' · <b style="color:var(--red)">away ' + w + ' weeks</b>' : '') + '</div></div>' +
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
      (can('groups') ? '<div class="field"><label for="m-group">Group</label><select id="m-group">' + groupOptions(gid) + '</select></div>' : '<input type="hidden" id="m-group" value="' + gid + '">') +
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
      return '<div class="card top gold"><div class="row">' + avatar(m.name) + '<div class="grow"><div class="name">' + esc(m.name) + '</div>' +
        '<div class="meta">' + (!isLeader() ? esc(groupName(m.group_id)) + ' · ' : '') + 'away ' + weeksAway(m) + ' weeks' + (m.last_seen ? ' · last seen ' + Care.fmt(m.last_seen) : '') + '</div></div></div>' +
        '<div class="actions">' + (contactButtons(m.phone, awayMsg(m)) || '<span class="meta">No number saved.</span>') + '</div></div>';
    }).join('');
  }

  /* ---------- prayer ---------- */
  function viewPrayer() {
    var f = S.pFilter, list = S.prayers.filter(function (p) {
      if (f === 'pastor') return p.to_pastor;
      if (f === 'groups') return !p.to_pastor;
      return f === 'all' || p.status === f;
    });
    var chips = [['open', 'Open'], ['prayed', 'Prayed for'], ['all', 'All']];
    if (can('prayer_pastor') && can('prayer_groups')) chips.splice(2, 0, ['pastor', '🔒 To the pastor'], ['groups', 'For leaders']);
    var h = '<div class="chips">' + chips.map(function (c) {
      return '<button class="chip" data-pf="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>';
    }).join('') + '</div>';
    if (!list.length) return h + '<div class="card empty">No prayer requests here.</div>';
    return h + list.map(function (p) {
      var where = p.to_pastor ? '🔒 For the pastor only' : p.assigned_to ? 'For ' + leaderOf(p.assigned_to) + ' (' + groupName(p.assigned_to) + ')' : 'For a group leader · not passed on yet';
      return '<div class="card top ' + (p.to_pastor ? 'gold' : 'sky') + '"><div class="row">' + avatar(p.name || '?') + '<div class="grow"><div class="name">' + esc(p.name || 'Anonymous') + '</div>' +
        '<div class="meta">' + Care.fmt(day(p.created_at)) + (p.source === 'form' ? ' · from the QR page' : '') + '</div></div>' +
        (p.status === 'prayed' ? '<span class="pill reached">Prayed for</span>' : '<span class="pill new">Open</span>') + '</div>' +
        (isLeader() ? '' : '<div class="meta" style="margin-top:6px"><b>' + esc(where) + '</b></div>') +
        '<p style="margin:8px 0;white-space:pre-wrap">' + esc(p.body) + '</p>' +
        '<div class="actions">' + (p.status === 'open' ? '<button class="btn sm" data-prayed="prayed:' + p.id + '">🙏 Mark prayed for</button>' : '<button class="btn sm alt" data-prayed="open:' + p.id + '">Reopen</button>') +
        contactButtons(p.phone, prayerMsg(p)) + '</div>' +
        (can('prayer_groups') && !p.to_pastor ? '<div class="field"><label>Pass to a group leader</label><select data-passprayer="' + p.id + '">' + groupOptions(p.assigned_to, 'Not passed on yet') + '</select></div>' : '') +
        '</div>';
    }).join('');
  }
  function sheetNewPrayer() {
    var to = isLeader()
      ? '<option value="mine">Me, as their group leader</option><option value="pastor">The pastor only (I won\'t see it again)</option>'
      : '<option value="pastor">The pastor only</option>' + (can('prayer_groups') ? groupOptions(null, 'A group leader (pass on later)') : '<option value="">A group leader (the pastor passes it on)</option>');
    return '<h2>Prayer request</h2><form data-newprayer>' +
      '<div class="field"><label for="np-body">Prayer request</label><textarea id="np-body" maxlength="1000" required></textarea></div>' +
      '<div class="field"><label for="np-name">For (name)</label><input id="np-name" type="text" maxlength="80"></div>' +
      '<div class="field"><label for="np-phone">WhatsApp number (optional)</label><input id="np-phone" type="tel" inputmode="tel" maxlength="20"></div>' +
      '<div class="field"><label for="np-to">Who should read it?</label><select id="np-to">' + to + '</select></div>' +
      (role() === 'welcome' ? '<p class="meta">You won\'t see it in your list afterwards.</p>' : '') +
      '<button class="btn" type="submit">Save</button></form>';
  }

  /* ---------- new visitor ---------- */
  function sheetNewVisitor() {
    return '<h2>New visitor</h2><form data-newvisitor>' +
      '<div class="field"><label for="nv-name">Name</label><input id="nv-name" type="text" maxlength="80" required></div>' +
      '<div class="field"><label for="nv-phone">WhatsApp number</label><input id="nv-phone" type="tel" inputmode="tel" maxlength="20" placeholder="024 123 4567"></div>' +
      '<div class="field"><label for="nv-reason">How did they come?</label><select id="nv-reason"><option value="">Choose one</option>' + C.reasons.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="nv-invited">Invited by</label><input id="nv-invited" type="text" maxlength="80"></div>' +
      '<div class="field"><label for="nv-group">' + (can('visitors') ? 'Assign to a group leader' : 'Group they\'re interested in') + '</label>' +
      (isLeader() ? '<input type="hidden" id="nv-group" value="' + S.me.group_id + '"><div class="meta">Goes to your group, ' + esc(groupName(S.me.group_id)) + '.</div>' : '<select id="nv-group">' + groupOptions(null, can('visitors') ? 'Not yet' : 'Not sure') + '</select>') + '</div>' +
      '<div class="field"><label for="nv-prayer">Prayer need (optional)</label><textarea id="nv-prayer" maxlength="1000"></textarea></div>' +
      '<label class="check" style="margin-bottom:10px"><input type="checkbox" id="nv-private"><span>🔒 Only the pastor should read their prayer request</span></label>' +
      '<label class="check"><input type="checkbox" id="nv-consent"><span>They agreed to the church keeping these details and contacting them on WhatsApp.</span></label>' +
      '<div class="actions"><button class="btn" type="submit">Save visitor</button></div></form>' +
      '<p class="meta">Visitors can also fill this in themselves from the QR code page.</p>';
  }

  /* ---------- team list (pastor) ---------- */
  function roleText(x) {
    if (x.role === 'pastor') return 'Pastor · sees everything';
    if (x.role === 'welcome') return 'Welcome team · adds visitors, sends welcomes';
    if (x.role === 'leader') return 'Group leader · ' + groupName(x.group_id) + ' only';
    var a = AREAS.filter(function (r) { return (x.areas || []).indexOf(r[0]) >= 0; }).map(function (r) { return r[1]; });
    return 'PA · ' + (a.length ? a.join(', ') : 'no areas yet');
  }
  function sheetTeam() {
    var url = location.href.split('#')[0].split('?')[0];
    var order = { pastor: 0, pa: 1, leader: 2, welcome: 3 };
    var people = S.staff.slice().sort(function (a, b) { return order[a.role] - order[b.role] || a.name.localeCompare(b.name); });
    return '<h2>Team & groups</h2><p class="meta">Only people on the team list can sign in, at <b>' + esc(url) + '</b>, with a code sent to their WhatsApp or email. ' +
      'Group leaders see only their own group.</p>' +
      '<div class="banner ok">To bring a leader in, tap <b>Invite leader</b> on their group below and send them the link. They choose their own sign-in.</div>' +
      '<h2 class="sec">Team</h2>' + people.map(function (x) {
        return '<div class="card tap" data-open="staff:' + x.id + '"><div class="row">' + avatar(x.name) + '<div class="grow"><div class="name">' + esc(x.name) + '</div>' +
          '<div class="meta">' + esc(roleText(x)) + '</div><div class="meta">' + (x.joined_app_at ? '<span class="pill reached">📱 On the app</span> ' : '<span class="pill new">Not joined yet</span> ') + esc([x.phone ? '+' + x.phone : '', x.email || ''].filter(Boolean).join(' · ')) + '</div></div><span class="meta">Edit ›</span></div></div>';
      }).join('') +
      '<div class="actions"><button class="btn" data-act="new-staff">+ Add a leader, PA or helper</button></div>' +
      '<h2 class="sec">Groups</h2>' + S.groups.map(function (g) {
        var n = S.members.filter(function (m) { return m.group_id === g.id; }).length;
        return '<div class="card tap" data-open="grp:' + g.id + '"><div class="row"><div class="grow"><div class="name">' + esc(g.name) + '</div>' +
          '<div class="meta">' + esc((g.tag ? g.tag + ' · ' : '') + 'Leader: ' + (g.leader_name || 'not set')) + (n ? ' · ' + n + (n === 1 ? ' member' : ' members') : '') + '</div>' +
          '<div class="actions" style="margin:6px 0 0">' + (S.staff.some(function (x) { return x.role === 'leader' && x.group_id === g.id && x.joined_app_at; })
            ? '<span class="pill reached">📱 Leader on the app</span>' : '<button class="btn sm blue" data-invite-leader="' + g.id + '">✉️ Invite leader</button>') + '</div></div><span class="meta">Edit ›</span></div></div>';
      }).join('') +
      '<div class="actions"><button class="btn alt" data-act="new-group">+ Add a group</button></div>';
  }
  function sheetStaff(id) {
    var x = id ? S.staff.filter(function (y) { return y.id === id; })[0] : null;
    if (id && !x) return null;
    var r = x ? x.role : 'leader', areas = x ? x.areas || [] : [];
    function opt(v, t) { return '<option value="' + v + '"' + (r === v ? ' selected' : '') + '>' + t + '</option>'; }
    return '<button class="back" data-open="team">‹ Team & groups</button><h2>' + (x ? esc(x.name) : 'Add to the team') + '</h2>' +
      '<form data-staff="' + (x ? x.id : '') + '">' +
      '<div class="field"><label for="ns-name">Name</label><input id="ns-name" type="text" maxlength="80" required value="' + esc(x ? x.name : '') + '"></div>' +
      '<div class="field"><label for="ns-phone">WhatsApp number (for sign-in codes)</label><input id="ns-phone" type="tel" inputmode="tel" placeholder="024 123 4567" value="' + esc(x && x.phone ? '+' + x.phone : '') + '"></div>' +
      '<div class="field"><label for="ns-email">Email (optional)</label><input id="ns-email" type="email" value="' + esc(x && x.email ? x.email : '') + '"></div>' +
      '<div class="field"><label for="ns-role">Role</label><select id="ns-role">' + opt('leader', 'Group leader: sees only their group') + opt('pa', 'PA: sees the areas you choose') +
        opt('welcome', 'Welcome team: adds visitors') + opt('pastor', 'Pastor: sees everything') + '</select></div>' +
      '<div class="field" id="ns-group-f"><label for="ns-group">Their group</label><select id="ns-group">' + groupOptions(x ? x.group_id : null) + '</select></div>' +
      '<div class="field" id="ns-areas-f"><label>What can the PA see?</label>' + AREAS.map(function (a) {
        return '<label class="check" style="margin-bottom:6px"><input type="checkbox" name="ns-area" value="' + a[0] + '"' + (areas.indexOf(a[0]) >= 0 ? ' checked' : '') + '><span><b>' + a[1] + '</b><br>' + a[2] + '</span></label>';
      }).join('') + '<p class="meta">Only you can change the team list.</p></div>' +
      '<div class="actions"><button class="btn" type="submit">' + (x ? 'Save changes' : 'Add to the team') + '</button></div></form>' +
      (x && x.id !== S.me.id ? '<div class="actions" style="margin-top:18px"><button class="btn sm danger" data-del-staff="' + x.id + '">Remove from the team</button></div>' : '');
  }
  function sheetGroup(id) {
    var g = id ? group(id) : null;
    if (id && !g) return null;
    return '<button class="back" data-open="team">‹ Team & groups</button><h2>' + (g ? esc(g.name) : 'New group') + '</h2>' +
      '<form data-group="' + (g ? g.id : '') + '">' +
      '<div class="field"><label for="ng-name">Group name</label><input id="ng-name" type="text" maxlength="80" required value="' + esc(g ? g.name : '') + '"></div>' +
      '<div class="field"><label for="ng-tag">Description (optional)</label><input id="ng-tag" type="text" maxlength="80" placeholder="e.g. Men\'s Fellowship" value="' + esc(g ? g.tag : '') + '"></div>' +
      '<div class="field"><label for="ng-leader">Leader\'s name (shown to everyone)</label><input id="ng-leader" type="text" maxlength="80" value="' + esc(g ? g.leader_name : '') + '"></div>' +
      '<p class="meta">To let the leader sign in, add them under Team as a group leader for this group.</p>' +
      '<div class="actions"><button class="btn" type="submit">' + (g ? 'Save' : 'Add group') + '</button></div></form>';
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
      parts[0] === 'leaderlink' ? sheetLeaderLink(parts[1]) :
      parts[0] === 'staff' ? sheetStaff(parts[1]) :
      parts[0] === 'new-staff' ? sheetStaff(null) :
      parts[0] === 'grp' ? sheetGroup(parts[1]) :
      parts[0] === 'new-group' ? sheetGroup(null) :
      parts[0] === 'qr' ? sheetQr() : null;
    if (html === null) return closeSheet();
    var sh = $('sheet');
    var f = document.activeElement;
    if (keep && f && sh.contains(f) && (f.tagName === 'TEXTAREA' || (f.tagName === 'INPUT' && !/checkbox|radio/.test(f.type)))) return; // don't wipe what they're typing
    var top = keep ? sh.scrollTop : 0;
    sh.innerHTML = '<div class="grab"></div>' + (/^<button class="back" data-open/.test(html) ? '' : '<button class="back" data-close>✕ Close</button>') + html;
    sh.scrollTop = top;
    S.sheet = key;
    $('veil').className = 'veil open';
    if (/^(staff|new-staff)/.test(key)) syncRole();
  }
  /** In-app confirmation (browser pop-ups are blocked in some views). */
  function ask(text, yes) {
    var sh = $('sheet');
    sh.innerHTML = '<div class="grab"></div><h2 style="margin-top:8px">Are you sure?</h2><p>' + esc(text) + '</p>' +
      '<div class="actions"><button class="btn danger" id="ask-yes">Yes, remove</button><button class="btn alt" id="ask-no">Cancel</button></div>';
    $('veil').className = 'veil open';
    var back = S.sheet; S.sheet = null;
    $('ask-yes').onclick = function () { closeSheet(); yes(); };
    $('ask-no').onclick = function () { if (back) openSheet(back); else closeSheet(); };
  }
  function closeSheet() { S.sheet = null; $('veil').className = 'veil'; $('sheet').innerHTML = ''; }
  function syncRole() { var r = $('ns-role'); if (r) { $('ns-group-f').hidden = r.value !== 'leader'; $('ns-areas-f').hidden = r.value !== 'pa'; } }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var wl = e.target.closest('[data-welcome]');
    if (wl) { var wid = wl.dataset.welcome; setTimeout(function () { act(Store.markWelcomed(wid), 'Marked as welcomed. 💬'); }, 400); return; }
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
      ask('Delete this person\'s record, notes and prayer requests? Use this when someone asks to be removed. It can\'t be undone.', function () { closeSheet(); act(Store.remove('visitors', 'id', d.delVisitor), 'Record deleted.'); });
    } else if (d.delMember) {
      ask('Remove this member from the list? Their attendance history goes too.', function () { closeSheet(); act(Store.remove('members', 'id', d.delMember), 'Removed.'); });
    } else if (d.delStaff) {
      ask('Remove this person from the team? They will lose access straight away.', function () { openSheet('team'); act(Store.remove('staff', 'id', d.delStaff), 'Removed from the team.'); });
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'day') { S.day = t.value || Care.today(); render(); }
    else if (t.dataset.assign) {
      t.blur();
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
      if (can('visitors')) o.assigned_to = g; else o.group_interest = g;
      var privatePrayer = $('nv-private') && $('nv-private').checked;
      o.consent_at = new Date().toISOString();
      closeSheet();
      act(Store.insert('visitors', o).then(function (v) {
        if (prayer) return Store.insert('prayers', { name: o.name, phone: o.phone, body: prayer, to_pastor: privatePrayer, assigned_to: privatePrayer ? null : v.assigned_to || null });
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
      var to = val('np-to');
      p.to_pastor = to === 'pastor';
      if (!p.to_pastor && to && to !== 'mine') p.assigned_to = to;
      closeSheet();
      act(Store.insert('prayers', p), 'Prayer request saved.');
    } else if ('staff' in d) {
      var st = { name: val('ns-name'), email: val('ns-email').toLowerCase() || null, phone: val('ns-phone') || null, role: val('ns-role') };
      st.group_id = st.role === 'leader' ? val('ns-group') : null;
      st.areas = st.role === 'pa' ? Array.prototype.map.call(document.querySelectorAll('input[name=ns-area]:checked'), function (x) { return x.value; }) : [];
      if (!st.name) return Care.toast('Please enter their name.');
      if (!st.phone && !st.email) return Care.toast('Add their WhatsApp number or email, so they can sign in.');
      if (st.phone && !digitsOk(st.phone)) return Care.toast('That WhatsApp number looks wrong.');
      if (st.email && !/^\S+@\S+\.\S+$/.test(st.email)) return Care.toast('That email looks wrong.');
      if (st.role === 'pa' && !st.areas.length) return Care.toast('Tick at least one area the PA can see.');
      act(d.staff ? Store.update('staff', 'id', d.staff, st) : Store.insert('staff', st), d.staff ? 'Saved.' : st.name + ' can now sign in.').then(function (r) { if (r) openSheet('team'); });
    } else if ('group' in d) {
      var g = { name: val('ng-name'), tag: val('ng-tag'), leader_name: val('ng-leader') };
      if (!g.name) return Care.toast('Please enter the group name.');
      if (!d.group) {
        g.id = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'group';
        if (group(g.id)) g.id += '-' + Date.now().toString(36).slice(-4);
        g.sort = S.groups.length + 1;
      }
      act(d.group ? Store.update('groups', 'id', d.group, g) : Store.insert('groups', g), d.group ? 'Saved.' : g.name + ' added.').then(function (r) { if (r) openSheet('team'); });
    }
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-invite-leader],[data-invite-one],[data-copy],[data-reset-link],[data-mg]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    var d = el.dataset;
    if (d.inviteLeader) openSheet('leaderlink:' + d.inviteLeader);
    else if (d.mg) { S.groupId = d.mg; render(); }
    else if (d.copy) {
      var done = function () { Care.toast('Invite copied. Paste it in WhatsApp.'); };
      try { navigator.clipboard.writeText(d.copy).then(done, function () { Care.toast('Press and hold the link to copy it.'); }); } catch (x) { Care.toast('Press and hold the link to copy it.'); }
    } else if (d.resetLink) {
      ask('Make a new join link? The old link will stop working for anyone who hasn\'t joined yet.', function () {
        Store.resetInvite(d.resetLink).then(function (t) { S.links[d.resetLink] = t; Care.toast('New link ready.'); render(); }, fail);
      });
    } else if (d.inviteOne) {
      var m = S.members.filter(function (x) { return x.id === d.inviteOne; })[0], g = group(m.group_id), t = S.links[m.group_id];
      if (!t) return Care.toast('One moment, the link is still being made.');
      window.open(Care.waLink(m.phone, 'Hello ' + Care.first(m.name) + '! ' + memberInviteText(g, t)), '_blank', 'noopener');
    }
  }, true);
  document.addEventListener('submit', function (e) {
    if (!('mprayer' in e.target.dataset)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var body = $('mp-body').value.trim(), to = $('mp-to').value;
    if (!body) return Care.toast('Please write your prayer request.');
    Store.memberPrayer(body, to, S.groupId).then(function () { Care.toast(to === 'pastor' ? 'Sent to the pastor. 🙏' : 'Sent to your leader. 🙏'); reload(); }, fail);
  }, true);

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSheet(); });
  start();
})();
