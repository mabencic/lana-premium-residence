// Prijava za CMS preko GitHuba (korak 2: zamijeni kod za token i vrati ga CMS-u).
const page = (status, payload) => `<!doctype html><html><body><script>
(function () {
  var message = 'authorization:github:${status}:' + ${JSON.stringify(JSON.stringify(payload))};
  function receive(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', receive, false);
    window.close();
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', window.location.origin);
})();
</script></body></html>`;

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = request.headers.get('Cookie') || '';
  const saved = (cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/) || [])[1];
  const headers = { 'Content-Type': 'text/html;charset=UTF-8' };

  if (!code || !state || state !== saved) {
    return new Response(page('error', { message: 'Neispravan zahtjev za prijavu.' }), { status: 400, headers });
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const data = await res.json();

  if (!data.access_token) {
    return new Response(page('error', { message: 'GitHub nije vratio pristup.' }), { status: 401, headers });
  }
  return new Response(page('success', { token: data.access_token, provider: 'github' }), { headers });
}
