/* Church Care: shows the update after each service and opens it when tapped. Caches nothing. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Church Care', {
    body: d.body || '',
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    tag: d.url || 'care',
    data: { url: d.url || 'team.html' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || 'team.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.split('#')[0] === url.split('#')[0] && 'focus' in list[i]) { list[i].navigate(url); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
