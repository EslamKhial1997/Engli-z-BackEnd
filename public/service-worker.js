self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("message", (event) => {
  console.log("Message received in Service Worker:", event.data);
  if (event.data.status === "upload-progress") {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          status: "upload-progress",
          progress: event.data.progress,
        });
      });
    });
  }
});
