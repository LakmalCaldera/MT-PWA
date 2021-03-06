var dataCacheName = 'dataCache';
var cacheName = 'shellCache';
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/ic_refresh_white_24px.svg',
  '/scripts/jquery-3.2.1.min.js',
  '/scripts/handlebars-v4.0.10.js'
];
var dataUrl = ['/MobileTicket', '/geo'];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
      caches.open(cacheName).then(function(cache) {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(filesToCache);
      })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
      caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== cacheName && key !== dataCacheName) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  if (e.request.url.indexOf(dataUrl[0]) > -1 || e.request.url.indexOf(dataUrl[1]) > -1 ) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
        caches.open(dataCacheName).then(function(cache) {
          return fetch(e.request).then(function(response){
            cache.put(e.request.url, response.clone());
            return response;
          }).catch(function(err){
            console.log('Fetch Failed!!, - ', err);
            return caches.match(e.request).then(function(response) {
              if(response){
                return response;
              }
            })
          });
        })
    );

    /*
    Variation of another strategy...
    e.respondWith(caches.match(e.request).then(function(response) {
      if (response)
        return response;

      return fetch(e.request).then(function (response) {
        caches.open(dataCacheName).then(function (cache) {
          // cache response after making a request
          cache.put(e.request, response.clone());
          // return original response
          return response;
        })
      });
    }));
    */

  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
        caches.match(e.request).then(function(response) {
          return response || fetch(e.request);
        })
    );
  }
});



/*
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'You will be served shortly.';
  const options = {
    body: event.data.text(),
    icon: 'icon.png',
    badge: 'icon.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }

  };

  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);

});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  if (event.action === 'close') {
    event.notification.close();
  }
  else {
    event.waitUntil(
      clients.openWindow('https://developers.google.com/web/')
    );
  }
});
*/