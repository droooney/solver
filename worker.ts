const ctx: ServiceWorkerGlobalScope = self as any;

console.log('worker');

(async () => {
  ctx.addEventListener('activate', async () => {
    await ctx.clients.claim();
  });

  ctx.addEventListener('fetch', async (e) => {
    const { url } = e.request;

    if (url.endsWith('.less')) {
      e.respondWith(new Response(`
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = ${JSON.stringify(new URL(url.replace(/\.less$/, '.css')).pathname)};

        document.head.appendChild(link);
      `, {
        headers: {
          'Content-Type': 'text/javascript'
        }
      }));
    } else if (/\/\w+$/.test(url)) {
      e.respondWith((async () => {
        let response = await fetch(`${url}.js`);

        if (!responseSuccessful(response)) {
          response = Response.redirect(`${url}/index.js`);
        }

        return response;
      })());
    }
  });

  await ctx.skipWaiting();
})();

function responseSuccessful(response: Response): boolean {
  return (
    response.status >= 200 && response.status < 300
    || response.status === 302
  );
}
