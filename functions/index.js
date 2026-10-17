// Automatski izbor jezika na početnoj adresi "/".
//
// Redoslijed odluke:
//   1. Jezik koji je posjetitelj sam odabrao u izborniku (kolačić "lang").
//   2. Prvi podržani jezik iz postavki preglednika (Accept-Language).
//      Ako je to engleski, a posjetitelj dolazi iz Njemačke/Austrije/Švicarske ili Italije,
//      koristi se jezik te zemlje.
//   3. Ako preglednik ne javlja podržani jezik, odlučuje država posjetitelja
//      (DE, AT, CH, LI: njemački; IT, SM, VA: talijanski; HR, BA, ME, RS: hrvatski; ostalo: engleski).
// Hrvatski ostaje na "/", ostali jezici se otvaraju na /en/, /de/, /it/.
// Tražilice (botovi) se ne preusmjeravaju.

const SUPPORTED = ['hr', 'en', 'de', 'it'];
const ALIAS = { bs: 'hr', sr: 'hr' };
const COUNTRY_LANG = {
  HR: 'hr', BA: 'hr', ME: 'hr', RS: 'hr',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  IT: 'it', SM: 'it', VA: 'it',
};
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|facebookexternalhit|headless/i;

export function languageFromHeader(header) {
  if (!header) return null;
  const items = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { lang: tag.toLowerCase().split('-')[0], q: q ? parseFloat(q.slice(2)) : 1 };
    })
    .filter((x) => x.lang && x.lang !== '*' && !Number.isNaN(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const item of items) {
    const lang = ALIAS[item.lang] || item.lang;
    if (SUPPORTED.includes(lang)) return lang;
  }
  return null;
}

export function chooseLanguage({ cookie, acceptLanguage, country }) {
  const saved = (/(?:^|;\s*)lang=([a-z]{2})/.exec(cookie || '') || [])[1];
  if (saved && SUPPORTED.includes(saved)) return saved;

  const fromCountry = country ? COUNTRY_LANG[String(country).toUpperCase()] : undefined;
  const fromBrowser = languageFromHeader(acceptLanguage);

  if (fromBrowser === 'en' && (fromCountry === 'de' || fromCountry === 'it')) return fromCountry;
  if (fromBrowser) return fromBrowser;
  if (country && country !== 'XX' && country !== 'T1') return fromCountry || 'en';
  return null;
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();
  if (BOT.test(request.headers.get('User-Agent') || '')) return context.next();

  const lang = chooseLanguage({
    cookie: request.headers.get('Cookie'),
    acceptLanguage: request.headers.get('Accept-Language'),
    country: (request.cf && request.cf.country) || request.headers.get('CF-IPCountry'),
  });

  if (!lang || lang === 'hr') {
    const res = await context.next();
    const out = new Response(res.body, res);
    out.headers.append('Vary', 'Accept-Language, Cookie');
    return out;
  }

  const target = new URL(request.url);
  target.pathname = `/${lang}/`;
  return new Response(null, {
    status: 302,
    headers: { Location: target.toString(), 'Cache-Control': 'no-store', Vary: 'Accept-Language, Cookie' },
  });
}
