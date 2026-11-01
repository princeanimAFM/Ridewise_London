/* The welcome note and prayer for new visitors. Edit the wording here; it is used on the
   thank-you screen of the welcome form and in the WhatsApp message the team sends. */
(function () {
  'use strict';
  var C = window.CARE_CONFIG;

  /** "today", or "on Sunday" when the visit wasn't today. */
  function when(dateStr) {
    if (!dateStr) return 'today';
    var d = new Date(String(dateStr).slice(0, 10) + 'T12:00:00');
    var t = new Date(); t.setHours(12, 0, 0, 0);
    var days = Math.round((t - d) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return 'on ' + d.toLocaleDateString('en-GB', { weekday: 'long' });
    return 'recently';
  }

  window.CareWords = {
    when: when,
    welcome: function (first, visitDate) {
      var w = when(visitDate);
      return [
        'It was really good to have you join us ' + w + '! Thank you for worshipping with us at ' + C.church + '.',
        'You did not come by accident. God has a beautiful plan for your life, and we are glad to walk with you. ' +
          'Whenever you come, there is a seat for you and a family waiting to welcome you.',
        'You are always welcome in the AFM family.'
      ];
    },
    sign: 'With love, ' + C.pastor.replace(' D.D', ' (D.D)') + ' and the AFM Church family',
    prayer: function (first) {
      return 'Father, in the name of Jesus, we thank You for ' + first + '. Thank You for bringing ' + first + ' into Your house. ' +
        'Let Your peace, favour and protection rest on ' + first + ' and the whole family. Open new doors, meet every need and answer every prayer. ' +
        'In this Year of the Blessing, let ' + first + ' be blessed in the city and blessed in the field, blessed coming in and blessed going out. ' +
        'In Jesus’ mighty name,';
    },
    /** The full WhatsApp message a leader or the welcome team sends. */
    whatsapp: function (first, visitDate, sender) {
      var L = C.links, s = C.services;
      return 'Hello ' + first + '! 👋\n\n' +
        this.welcome(first, visitDate).join(' ') + '\n\n' +
        '🙏 *A prayer for you*\n' + this.prayer(first) + ' Amen.\n\n' +
        '*Stay connected*\n' +
        '📱 AFM HUB app: ' + L.playStore + '\n' +
        '💻 On iPhone or a computer: ' + L.webApp + '\n' +
        '⛪ Church website: ' + L.website + '\n\n' +
        '*Join us again*\n' + s.map(function (x) { return '• ' + x.day + ' ' + x.when + ': ' + x.what + (x.where ? ' (' + x.where + ')' : ''); }).join('\n') + '\n\n' +
        'God bless you,\n' + sender + '\n' + C.church;
    }
  };
})();
