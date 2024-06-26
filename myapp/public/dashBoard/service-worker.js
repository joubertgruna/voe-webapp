self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-cache').then(cache => {
      return cache.addAll([
        '/dashBoard/',
        '/dashBoard/admin/',
        '/dashBoard/css/styles.css',
        '/dashBoard/js/script.js',
        // Adicione aqui outros arquivos que deseja armazenar em cache
      ]).catch(error => {
        console.error('Falha ao carregar arquivos para o cache:', error);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(error => {
      console.error('Falha ao buscar recurso:', error);
    })
  );
});
