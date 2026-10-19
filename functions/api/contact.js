// Vraća kontakt e-mail adresu tek nakon što Cloudflare Turnstile potvrdi da je posjetitelj osoba.
// Adresa se ne nalazi u kodu stranice nego u tajnoj varijabli CONTACT_EMAIL (Cloudflare Pages, Settings).
// Potrebne varijable: TURNSTILE_SECRET_KEY (tajna) i CONTACT_EMAIL.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET_KEY || !env.CONTACT_EMAIL) return json({ error: 'not_configured' }, 500);

  let token = '';
  try {
    const body = await request.json();
    token = typeof body.token === 'string' ? body.token : '';
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  if (!token || token.length > 2048) return json({ error: 'bad_request' }, 400);

  let result;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined,
        idempotency_key: crypto.randomUUID(),
      }),
    });
    result = await res.json();
  } catch (e) {
    return json({ error: 'verify_unavailable' }, 502);
  }

  if (!result || result.success !== true) return json({ error: 'verification_failed' }, 403);
  return json({ email: env.CONTACT_EMAIL });
}

// Sve ostalo (GET i ostale metode) ne vraća ništa.
export async function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
