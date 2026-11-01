/* The page the QR code opens: app and website links, the welcome form and a prayer request form. */
(function () {
  'use strict';
  var C = window.CARE_CONFIG, Care = window.Care, Store = window.Store;
  function $(id) { return document.getElementById(id); }

  $('theme').textContent = C.themeOfTheYear;
  $('foot').innerHTML = Care.esc(C.churchFull) + '<br>' + Care.esc(C.place);
  $('services').innerHTML = C.services.map(function (x, i) {
    return '<div class="card top ' + ['', 'red', 'sky'][i % 3] + '"><div class="svc"><span class="big">' + Care.esc(x.day) + '</span>' +
      '<span class="when">' + Care.esc(x.when) + '<small>GMT</small></span><span class="what">' + Care.esc(x.what) + '</span><span class="where">' + Care.esc(x.where) + '</span></div></div>';
  }).join('');
  function letter(first) {
    var W = window.CareWords;
    return '<div class="dear">Dear ' + Care.esc(first) + ',</div>' +
      W.welcome(first).map(function (p) { return '<p>' + Care.esc(p) + '</p>'; }).join('') +
      '<p class="sign">' + Care.esc(W.sign) + '</p>';
  }
  function prayerCard(first) {
    return '<div class="prayer"><div class="kicker">A prayer for you</div><h3>We are praying for you, ' + Care.esc(first) + '</h3>' +
      '<p>' + Care.esc(window.CareWords.prayer(first)) + '</p><span class="amen">Amen. 🙏</span></div>';
  }
  $('letter').innerHTML = letter('friend');
  $('l-play').href = C.links.playStore;
  $('l-web').href = C.links.webApp;
  $('l-site').href = C.links.website;
  $('demo').hidden = Store.mode !== 'demo';

  var consent = 'I agree that ' + C.church + ' may keep these details and contact me by phone or WhatsApp to welcome me and care for me. I can ask for them to be removed at any time.';
  Array.prototype.forEach.call(document.querySelectorAll('.consent'), function (e) { e.textContent = consent; });
  $('privacy').innerHTML =
    '<p>' + Care.esc(C.church) + ' (' + Care.esc(C.churchFull) + ') keeps what you send here to welcome you, follow up with you and pray with you. ' +
    'It is never sold or shared outside the church.</p>' +
    '<p>Our pastor, ' + Care.esc(C.pastor) + ', sees it, and so does the leader of the group you are placed in. Prayer requests are read only by the pastor and the ministry team caring for you.</p>' +
    '<p>We keep your details while you are part of the church family. To see, correct or remove them, tell any church leader or the welcome team, and the pastor will do it.</p>';

  C.reasons.forEach(function (r) { var o = document.createElement('option'); o.textContent = r; o.value = r; $('w-reason').appendChild(o); });
  Store.groups().then(function (gs) {
    gs.forEach(function (g) { var o = document.createElement('option'); o.value = g.id; o.textContent = g.name + (g.tag ? ' (' + g.tag + ')' : ''); $('w-group').appendChild(o); });
  });

  function tab(which) {
    $('t-welcome').setAttribute('aria-pressed', which === 'welcome');
    $('t-prayer').setAttribute('aria-pressed', which === 'prayer');
    $('f-welcome').hidden = which !== 'welcome';
    $('f-prayer').hidden = which !== 'prayer';
  }
  $('t-welcome').onclick = function () { tab('welcome'); };
  $('t-prayer').onclick = function () { tab('prayer'); };
  if (location.hash === '#prayer') tab('prayer');

  function msg(id, kind, text) { $(id).innerHTML = text ? '<div class="banner ' + kind + '">' + Care.esc(text) + '</div>' : ''; }
  function digits(s) { return String(s || '').replace(/\D/g, '').length; }
  function busy(form, on) { var b = form.querySelector('button[type=submit]'); b.disabled = on; }

  $('f-welcome').onsubmit = function (e) {
    e.preventDefault();
    var f = this, o = {
      name: $('w-name').value.trim(), phone: $('w-phone').value.trim(), reason: $('w-reason').value,
      invited_by: $('w-invited').value.trim(), group_interest: $('w-group').value, prayer: $('w-prayer').value.trim(), consent: $('w-consent').checked
    };
    if (!o.name) return msg('w-msg', 'bad', 'Please enter your name.');
    if (digits(o.phone) < 9 || digits(o.phone) > 15) return msg('w-msg', 'bad', 'Please enter your WhatsApp number, for example 024 123 4567.');
    if (!o.consent) return msg('w-msg', 'bad', 'Please tick the box so we can keep your details and reach you.');
    if ($('w-hp').value) return done();
    busy(f, true); msg('w-msg');
    Store.submitWelcome(o).then(done, function (err) { busy(f, false); msg('w-msg', 'bad', Care.errText(err)); });
    function done() {
      var first = Care.first(o.name);
      document.querySelector('.chips').hidden = true;
      f.className = 'card top green';
      f.innerHTML = '<div class="kicker">Thank you</div><h2 class="title">We\'re so glad you came, ' + Care.esc(first) + '!</h2>' +
        '<p class="lead" style="margin-bottom:0">Someone from the church will message you on WhatsApp within two days.</p>';
      $('letter').innerHTML = letter(first);
      $('letter').insertAdjacentHTML('afterend', prayerCard(first));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  $('f-prayer').onsubmit = function (e) {
    e.preventDefault();
    var f = this, o = { body: $('p-body').value.trim(), name: $('p-name').value.trim(), phone: $('p-phone').value.trim(), consent: $('p-consent').checked };
    if (!o.body) return msg('p-msg', 'bad', 'Please write your prayer request.');
    if (o.phone && (digits(o.phone) < 9 || digits(o.phone) > 15)) return msg('p-msg', 'bad', 'That WhatsApp number looks too short. Check it, or leave it empty.');
    if (!o.consent) return msg('p-msg', 'bad', 'Please tick the box so we can keep your request.');
    if ($('p-hp').value) return done();
    busy(f, true); msg('p-msg');
    Store.submitPrayer(o).then(done, function (err) { busy(f, false); msg('p-msg', 'bad', Care.errText(err)); });
    function done() {
      var first = o.name ? Care.first(o.name) : 'friend';
      f.className = 'card top green';
      f.innerHTML = '<div class="kicker">Received</div><h2 class="title">We are standing with you in prayer</h2>' +
        '<p class="lead">Your request has reached our pastor and ministry team.' + (o.phone ? ' Someone may reach you on WhatsApp.' : '') + '</p>' +
        prayerCard(first) + '<p class="meta" style="margin-top:12px">\u201CThe effectual fervent prayer of a righteous man availeth much.\u201D James 5:16</p>';
    }
  };
})();
