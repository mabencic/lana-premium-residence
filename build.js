// Gradi statičnu višejezičnu stranicu iz datoteka u mapi content/ u mapu dist/.
// Hrvatski je na adresi "/", ostali jezici na "/en/", "/de/", "/it/".
// Nema vanjskih paketa: pokreće se s `node build.js`.
const fs = require('fs');
const path = require('path');
const { defaultLang, languages, ui } = require('./i18n.js');

const root = __dirname;
const dist = path.join(root, 'dist');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'content', f), 'utf8'));

const site = read('site.json');
const apartments = read('apartments.json').items || [];
const amenities = read('amenities.json').items || [];
const gallery = read('gallery.json').items || [];
const faq = read('faq.json').items || [];

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Siguran ispis u <script>: nikad ne zatvara oznaku skripte.
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

// Vrijednost za traženi jezik; ako je prazna, uzima se hrvatski.
const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const pick = (map, lang, key) => {
  const v = map && map[lang] ? map[lang][key] : undefined;
  if (!empty(v)) return v;
  const d = map && map[defaultLang] ? map[defaultLang][key] : undefined;
  return empty(d) ? (key === 'specs' ? [] : '') : d;
};

const baseUrl = (site.url || '').replace(/\/$/, '');
const img = (p) => (p ? (/^https?:/.test(p) ? p : '/' + p.replace(/^\//, '')) : '');
const urlFor = (lang) => (lang === defaultLang ? '/' : `/${lang}/`);
const privacyUrl = (lang) => `${urlFor(lang)}${ui[lang].privacyPath}/`;
const privacy = read('privacy.json');

// Fotografije: ako postoje manje WebP verzije (images/w/, izrađuje ih `python3 slike.py`),
// preglednik sam bira veličinu prema zaslonu. Inače se koristi izvorna JPG datoteka.
const WIDTHS = [640, 1200, 1800];
const variants = (p) => {
  if (!p || /^https?:/.test(p) || !/\.jpe?g$/i.test(p)) return null;
  const base = path.basename(p).replace(/\.jpe?g$/i, '');
  const files = WIDTHS.map((w) => ({ w, rel: `images/w/${base}-${w}.webp` }));
  return files.every((f) => fs.existsSync(path.join(root, f.rel))) ? files : null;
};
const large = (p) => { const v = variants(p); return v ? '/' + v[v.length - 1].rel : img(p); };
const picture = (p, alt, sizes, attrs = '') => {
  const v = variants(p);
  const src = v ? '/' + v[1].rel : img(p);
  const set = v ? ` srcset="${v.map((f) => `/${f.rel} ${f.w}w`).join(', ')}" sizes="${sizes}"` : '';
  return `<img src="${esc(src)}"${set} alt="${esc(alt)}" ${attrs}>`;
};

// Ikone za sadržaje (oznaka "icon" u content/amenities.json).
const ICONS = {
  pool: '<path d="M3 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/><path d="M3 14c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/><path d="M8 12V5a2 2 0 0 1 4 0M14 12V5a2 2 0 0 1 4 0M8 8h6"/>',
  bar: '<path d="M6 4h12l-6 8z"/><path d="M12 12v7M8 20h8"/>',
  tennis: '<circle cx="12" cy="12" r="8.5"/><path d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11"/>',
  parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3"/>',
  wifi: '<path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>',
  climate: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  shop: '<path d="M4 7h16l-1.5 12h-13z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
};
const icon = (name) =>
  ICONS[name] ? `<svg class="ico" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>` : '';
const telHref = 'tel:' + String(site.phone || '').replace(/[^\d+]/g, '');
const waNumber = String(site.whatsapp || '').replace(/\D/g, '');
const mapQuery = encodeURIComponent(site.address || '');
const hasPin = site.map_lat && site.map_lng;
const mapEmbed = hasPin
  ? `https://www.google.com/maps?q=${encodeURIComponent(site.map_name || site.name || '')}&ll=${site.map_lat},${site.map_lng}&z=16&output=embed`
  : `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const mapLink = site.map_link || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

const consentBox = (t) =>
  site.ga_measurement_id ? `<div class="consent" id="consent" role="region" aria-label="${esc(t.consent.label)}" hidden>
    <p>${esc(t.consent.text)}</p>
    <div class="consent__btns">
      <button type="button" class="btn" id="consent-accept">${esc(t.consent.accept)}</button>
      <button type="button" class="btn btn--ghost" id="consent-decline">${esc(t.consent.decline)}</button>
    </div>
  </div>` : '';

const gaScript = () =>
  site.ga_measurement_id ? `<script>
    // Google Analytics se učitava tek nakon pristanka posjetitelja.
    (function () {
      var gaId = ${js(site.ga_measurement_id)};
      var KEY = 'lpr_consent';
      var box = document.getElementById('consent');
      var loaded = false;
      var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
      var write = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
      var clearGa = function () {
        try {
          document.cookie.split(';').forEach(function (c) {
            var n = c.split('=')[0].trim();
            if (n === '_ga' || n.indexOf('_ga_') === 0) {
              document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
              document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + location.hostname;
              document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + location.hostname.replace(/^www\\./, '');
            }
          });
        } catch (e) {}
      };
      var loadGa = function () {
        if (loaded) return;
        loaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
        gtag('js', new Date());
        gtag('config', gaId);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
        document.head.appendChild(s);
      };
      var show = function () { if (box) box.hidden = false; };
      var hide = function () { if (box) box.hidden = true; };
      var v = read();
      if (v === 'granted') loadGa(); else if (v !== 'denied') show();
      var acc = document.getElementById('consent-accept');
      var dec = document.getElementById('consent-decline');
      if (acc) acc.addEventListener('click', function () { write('granted'); hide(); loadGa(); });
      if (dec) dec.addEventListener('click', function () {
        write('denied'); hide(); clearGa();
        if (loaded) { try { window['ga-disable-' + gaId] = true; } catch (e) {} }
      });
      var st = document.getElementById('cookie-settings');
      if (st) st.addEventListener('click', show);
    })();
  </script>` : '';

// Podnožje: kontakt, adresa, privatnost i postavke kolačića.
const footer = (lang, home) => {
  const t = ui[lang];
  return `<footer class="foot">
    <div class="foot__in">
      <div class="foot__brand">
        <p class="foot__name"><img src="/images/logo-mark.svg" alt="" width="28" height="28">${esc(site.name)}</p>
        <p>${esc(site.address)}</p>
      </div>
      <ul class="foot__links">
        ${site.phone ? `<li><a href="${esc(telHref)}">${esc(site.phone)}</a></li>` : ''}
        ${waNumber ? `<li><a href="https://wa.me/${esc(waNumber)}" rel="noopener">${esc(t.whatsapp)}</a></li>` : ''}
        ${home ? `<li><a href="#contact">${esc(t.nav.enquire)}</a></li>` : `<li><a href="${urlFor(lang)}#contact">${esc(t.nav.enquire)}</a></li>`}
        ${site.instagram ? `<li><a href="${esc(site.instagram)}" rel="noopener">Instagram</a></li>` : ''}
        ${site.facebook ? `<li><a href="${esc(site.facebook)}" rel="noopener">Facebook</a></li>` : ''}
      </ul>
    </div>
    <div class="foot__legal">
      <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}</p>
      <p><a href="${privacyUrl(lang)}">${esc(t.privacy)}</a></p>
      ${site.ga_measurement_id ? `<p><button type="button" class="linklike" id="cookie-settings">${esc(t.consent.settings)}</button></p>` : ''}
    </div>
  </footer>`;
};

// Fontovi su na samoj stranici; najvažniji se učitavaju unaprijed.
const FONT_PRELOAD = ['instrument-serif-latin-400-normal', 'hanken-grotesk-latin-400-normal']
  .map((f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`)
  .join('\n  ');

function renderPage(lang) {
  const t = ui[lang];
  const tx = (key) => pick(site.texts, lang, key);
  const self = baseUrl ? baseUrl + urlFor(lang) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: site.name,
    description: tx('seo_description'),
    inLanguage: lang,
    url: self || undefined,
    image: baseUrl && site.hero_image ? baseUrl + img(site.hero_image) : undefined,
    telephone: site.phone,
    numberOfRooms: 8,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Cerova ulica 43',
      postalCode: '52446',
      addressLocality: 'Poreč',
      addressRegion: 'Istarska županija',
      addressCountry: 'HR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.latitude, longitude: site.longitude },
    amenityFeature: t.schemaAmenities.map((n) => ({ '@type': 'LocationFeatureSpecification', name: n, value: true })),
    sameAs: [site.instagram, site.facebook].filter(Boolean),
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: pick(f, lang, 'question'),
      acceptedAnswer: { '@type': 'Answer', text: pick(f, lang, 'answer') },
    })),
  };

  const lightboxData = {};
  const apartmentCards = apartments
    .map((a, i) => {
      const note = pick(a, lang, 'count_note');
      const aAlt = pick(a, lang, 'image_alt');
      const aMore = Array.isArray(a.more) ? a.more.filter(Boolean) : [];
      const photoAlts = Array.isArray(a.photo_alts) ? a.photo_alts : [];
      const photoAlt = (n) => {
        const e = photoAlts[n];
        return (e && (e[lang] || e[defaultLang])) || aAlt;
      };
      lightboxData['a' + i] = [a.image, ...aMore].map((p, n) => ({ src: large(p), alt: photoAlt(n) }));
      const aBadge = aMore.length ? `<span class="g__more" aria-hidden="true">+${aMore.length}</span>` : '';
      const aLabel = aMore.length ? `${aAlt} (${t.lightbox.open})` : aAlt;
      return `
      <article class="apt">
        <div class="apt__img"><button type="button" class="g__btn" data-lb="a${i}" aria-label="${esc(aLabel)}" aria-haspopup="dialog">${picture(a.image, photoAlt(0), '(max-width: 860px) 100vw, 34rem', 'loading="lazy" width="1500" height="1000"')}${aBadge}</button></div>
        <div class="apt__body">
          <h3>${esc(pick(a, lang, 'name'))}</h3>
          ${note ? `<p class="apt__note">${esc(note)}</p>` : ''}
          <p>${esc(pick(a, lang, 'description'))}</p>
          <ul class="chips">${pick(a, lang, 'specs').map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="btn" href="#contact">${esc(t.aptButton)}</a>
        </div>
      </article>`;
    })
    .join('');

  const amenityItems = amenities
    .map((a) => `<li>${icon(a.icon)}<h3>${esc(pick(a, lang, 'title'))}</h3><p>${esc(pick(a, lang, 'text'))}</p></li>`)
    .join('') +
    // Kartica s pozivom na upit popunjava zadnji red mreže.
    `<li class="amenities__cta"><h3>${esc(t.amenityCta.title)}</h3><p>${esc(t.amenityCta.text)}</p><a href="#contact">${esc(t.amenityCta.link)} &rarr;</a></li>`;

  // Približna širina fotografije u rasporedu galerije (za izbor veličine).
  const gSizes = (i) => (i === 0 ? '(max-width: 860px) 100vw, 46rem' : i === gallery.length - 1 && i >= 6 ? '100vw' : '(max-width: 860px) 50vw, 23rem');
  const galleryItems = gallery
    .map((g, i) => {
      const alt = (g.alt && (g.alt[lang] || g.alt[defaultLang])) || '';
      const more = Array.isArray(g.more) ? g.more.filter(Boolean) : [];
      const gAlts = Array.isArray(g.photo_alts) ? g.photo_alts : [];
      const photoAlt = (n) => {
        const e = gAlts[n];
        return (e && (e[lang] || e[defaultLang])) || alt;
      };
      lightboxData['g' + i] = [g.image, ...more].map((p, n) => ({ src: large(p), alt: photoAlt(n) }));
      const title = (g.title && (g.title[lang] || g.title[defaultLang])) || '';
      const badge = more.length ? `<span class="g__more" aria-hidden="true">+${more.length}</span>` : '';
      const cap = title ? `<span class="g__cap">${esc(title)}</span>` : '';
      const label = more.length ? `${alt} (${t.lightbox.open})` : alt;
      return `<figure class="g g--${i < 6 ? i + 1 : 7}"><button type="button" class="g__btn" data-lb="g${i}" aria-label="${esc(label)}" aria-haspopup="dialog">${picture(g.image, photoAlt(0), gSizes(i), 'loading="lazy" width="900" height="700"')}${cap}${badge}</button></figure>`;
    })
    .join('');

  const faqItems = faq
    .map((f) => `<details><summary>${esc(pick(f, lang, 'question'))}</summary><p>${esc(pick(f, lang, 'answer'))}</p></details>`)
    .join('');

  const langSwitch = languages
    .map(
      (l) =>
        `<li><a href="${urlFor(l.code)}" hreflang="${l.code}" lang="${l.code}" title="${esc(l.name)}"${l.code === lang ? ' aria-current="true"' : ''}>${l.short}</a></li>`
    )
    .join('');

  const alternates = baseUrl
    ? languages.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${baseUrl + urlFor(l.code)}">`).join('\n  ') +
      `\n  <link rel="alternate" hreflang="x-default" href="${baseUrl + urlFor(defaultLang)}">`
    : '';

  const ogAlternates = languages
    .filter((l) => l.code !== lang)
    .map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}">`)
    .join('\n  ');

  const current = languages.find((l) => l.code === lang);
  const bookingBtn = site.booking_url
    ? `<a class="btn btn--ghost" href="${esc(site.booking_url)}" rel="noopener">${esc(t.bookOnline)}</a>`
    : '';

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(tx('seo_title'))}</title>
  <meta name="description" content="${esc(tx('seo_description'))}">
  ${self ? `<link rel="canonical" href="${esc(self)}">` : ''}
  ${alternates}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(tx('seo_title'))}">
  <meta property="og:description" content="${esc(tx('seo_description'))}">
  <meta property="og:locale" content="${current.ogLocale}">
  ${ogAlternates}
  ${baseUrl && site.hero_image ? `<meta property="og:image" content="${esc(baseUrl + img(site.hero_image))}">` : ''}
  <meta name="theme-color" content="#12474f">
  <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
  ${FONT_PRELOAD}
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/vendor/flatpickr/flatpickr.min.css">
  <link rel="stylesheet" href="/css/style.css">
  <script type="application/ld+json">${js(jsonLd)}</script>
  <script type="application/ld+json">${js(faqLd)}</script>
</head>
<body>
  <a class="skip" href="#content">${esc(t.skip)}</a>
  <header class="top">
    <a class="brand" href="${urlFor(lang)}"><img class="brand__mark" src="/images/logo-mark.svg" alt="" width="36" height="36"><span>${esc(site.name)}</span></a>
    <div class="top__right">
      <button type="button" class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="site-nav" data-open="${esc(t.menu)}" data-close="${esc(t.menuClose)}" aria-label="${esc(t.menu)}"><span class="menu-btn__lang" aria-hidden="true">${current.short}</span><span class="menu-btn__bars" aria-hidden="true"></span></button>
      <nav id="site-nav" aria-label="${esc(t.navLabel)}">
        <a href="#apartments">${esc(t.nav.apartments)}</a>
        <a href="#amenities">${esc(t.nav.amenities)}</a>
        <a href="#gallery">${esc(t.nav.gallery)}</a>
        <a href="#location">${esc(t.nav.location)}</a>
        <a href="#faq">${esc(t.nav.faq)}</a>
        <a class="btn btn--small" href="#contact">${esc(t.nav.enquire)}</a>
        <ul class="lang lang--menu" aria-label="${esc(t.langLabel)}">${langSwitch}</ul>
      </nav>
      <ul class="lang" aria-label="${esc(t.langLabel)}">${langSwitch}</ul>
    </div>
  </header>

  <main id="content">
    <section class="hero">
      <div class="hero__text">
        <h1>${esc(tx('hero_title'))}</h1>
        <p>${esc(tx('hero_text'))}</p>
        <div class="actions">
          <a class="btn" href="#contact">${esc(t.heroPrimary)}</a>
          <a class="btn btn--ghost" href="#apartments">${esc(t.heroSecondary)}</a>
        </div>
      </div>
      <div class="hero__img">${picture(site.hero_image, tx('hero_image_alt'), '(max-width: 860px) 100vw, 44rem', 'width="1500" height="1000" fetchpriority="high"')}</div>
    </section>

    <section class="about">
      <h2>${esc(tx('about_title'))}</h2>
      <p>${esc(tx('about_text'))}</p>
    </section>

    <section id="apartments" class="block">
      <h2>${esc(t.apartments)}</h2>
      <div class="apts">${apartmentCards}</div>
    </section>

    <section id="amenities" class="block block--tint">
      <h2>${esc(t.amenities)}</h2>
      <ul class="amenities">${amenityItems}</ul>
    </section>

    <section id="gallery" class="block">
      <h2>${esc(t.gallery)}</h2>
      <div class="gallery">${galleryItems}</div>
    </section>

    <section id="location" class="block block--tint">
      <div class="loc">
        <div>
          <h2>${esc(t.location)}</h2>
          <address>${esc(site.address)}</address>
          <p>${esc(tx('distance_note'))}. ${esc(t.locationText)}</p>
          <a class="btn btn--ghost" href="${mapLink}" rel="noopener">${esc(t.mapButton)}</a>
        </div>
        <div class="map" id="map" data-src="${esc(mapEmbed)}" data-title="${esc(t.mapTitle)}: ${esc(site.name)}">
          <svg class="map__pin" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          <p class="map__addr">${esc(site.address)}</p>
          <button type="button" class="btn" id="map-load">${esc(t.map.load)}</button>
          <p class="map__note">${esc(t.map.text)}</p>
        </div>
      </div>
    </section>

    <section id="faq" class="block">
      <h2>${esc(t.faq)}</h2>
      <div class="faq">${faqItems}</div>
    </section>

    <section id="contact" class="block contact">
      <div>
        <h2>${esc(t.contact)}</h2>
        <p>${esc(t.contactIntro)}</p>
        <ul class="contact__list">
          <li><a href="${esc(telHref)}">${esc(site.phone)}</a></li>
          <li id="email-item"><button type="button" class="linklike" id="show-email">${esc(t.email.show)}</button><div id="ts-box"></div></li>
          ${site.instagram ? `<li><a href="${esc(site.instagram)}" rel="noopener">Instagram</a></li>` : ''}
          ${site.facebook ? `<li><a href="${esc(site.facebook)}" rel="noopener">Facebook</a></li>` : ''}
        </ul>
        ${bookingBtn}
      </div>
      <form id="enquiry" class="form" novalidate>
        <label>${esc(t.form.name)}<input name="name" autocomplete="name" required></label>
        <label>${esc(t.form.dates)}<input name="dates" id="dates" autocomplete="off" inputmode="none" placeholder="${esc(t.form.datesPlaceholder)}"></label>
        <div class="field"><label for="guests">${esc(t.form.guests)}</label><div class="stepper"><button type="button" class="stepper__btn" data-step="-1" aria-label="${esc(t.guestsLess)}">&minus;</button><input type="number" id="guests" name="guests" min="1" max="3" value="2" inputmode="numeric"><button type="button" class="stepper__btn" data-step="1" aria-label="${esc(t.guestsMore)}">+</button></div></div>
        <label>${esc(t.form.message)}<textarea name="message" rows="4"></textarea></label>
        <div class="actions">
          <button class="btn" type="submit" data-channel="mail">${esc(t.form.sendMail)}</button>
          <button class="btn btn--ghost" type="submit" data-channel="wa">${esc(t.form.sendWhatsApp)}</button>
        </div>
        <p class="form__hint">${esc(t.form.hint)}</p>
      </form>
    </section>
  </main>

  ${footer(lang, true)}

  <div class="cta-bar" id="cta-bar" hidden>
    <a class="btn" href="#contact">${esc(t.nav.enquire)}</a>
    ${waNumber ? `<a class="btn btn--ghost" href="https://wa.me/${esc(waNumber)}" rel="noopener">${esc(t.whatsapp)}</a>` : `<a class="btn btn--ghost" href="${esc(telHref)}">${esc(t.call)}</a>`}
  </div>

  ${consentBox(t)}

  <dialog id="lightbox" class="lb" aria-label="${esc(t.gallery)}">
    <button type="button" class="lb__close" aria-label="${esc(t.lightbox.close)}">&times;</button>
    <button type="button" class="lb__nav lb__prev" aria-label="${esc(t.lightbox.prev)}">&#8249;</button>
    <img class="lb__img" alt="">
    <button type="button" class="lb__nav lb__next" aria-label="${esc(t.lightbox.next)}">&#8250;</button>
    <p class="lb__count" aria-live="polite"></p>
  </dialog>

  <script src="/vendor/flatpickr/flatpickr.min.js"></script>
  ${current.code !== 'en' ? `<script src="/vendor/flatpickr/l10n/${current.code}.js"></script>` : ''}
  <script>
    (function () {
      var form = document.getElementById('enquiry');
      // Galerija: klik otvara fotografiju, a ako ih ima više, listaju se strelicama, tipkama ili prstom.
      var photos = ${js(lightboxData)};
      var lb = document.getElementById('lightbox');
      if (lb && lb.showModal) {
        var lbImg = lb.querySelector('.lb__img');
        var lbCount = lb.querySelector('.lb__count');
        var set = [], pos = 0, startX = null;
        var show = function (n) {
          pos = (n + set.length) % set.length;
          lbImg.src = set[pos].src;
          lbImg.alt = set[pos].alt;
          lbCount.textContent = set.length > 1 ? (pos + 1) + ' / ' + set.length : '';
          if (set.length > 1) { var nx = new Image(); nx.src = set[(pos + 1) % set.length].src; }
        };
        document.querySelectorAll('[data-lb]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            set = photos[btn.getAttribute('data-lb')] || [];
            if (!set.length) return;
            lb.classList.toggle('lb--single', set.length < 2);
            show(0);
            lb.showModal();
          });
        });
        lb.querySelector('.lb__prev').addEventListener('click', function () { show(pos - 1); });
        lb.querySelector('.lb__next').addEventListener('click', function () { show(pos + 1); });
        lb.querySelector('.lb__close').addEventListener('click', function () { lb.close(); });
        lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
        lb.addEventListener('keydown', function (e) {
          if (set.length < 2) return;
          if (e.key === 'ArrowLeft') { e.preventDefault(); show(pos - 1); }
          if (e.key === 'ArrowRight') { e.preventDefault(); show(pos + 1); }
        });
        lb.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', function (e) {
          if (startX === null || set.length < 2) return;
          var dx = e.changedTouches[0].clientX - startX; startX = null;
          if (Math.abs(dx) > 50) show(dx < 0 ? pos + 1 : pos - 1);
        }, { passive: true });
      }
      // Izbornik na mobitelu
      var top = document.querySelector('.top');
      var menuBtn = document.getElementById('menu-btn');
      var setMenu = function (open) {
        top.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', menuBtn.getAttribute(open ? 'data-close' : 'data-open'));
      };
      menuBtn.addEventListener('click', function () { setMenu(!top.classList.contains('is-open')); });
      document.querySelectorAll('#site-nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
      document.addEventListener('click', function (e) { if (top.classList.contains('is-open') && !top.contains(e.target)) setMenu(false); });
      // Traka s gumbima na dnu (mobitel): vidljiva nakon uvoda, skriva se kod obrasca.
      var bar = document.getElementById('cta-bar');
      if (bar && 'IntersectionObserver' in window) {
        var pastHero = false, atContact = false;
        var upd = function () { bar.hidden = !(pastHero && !atContact); };
        new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; upd(); }).observe(document.querySelector('.hero .actions'));
        new IntersectionObserver(function (en) { atContact = en[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -20% 0px' }).observe(document.getElementById('contact'));
      }
      // Karta se učitava tek na zahtjev (Google dobiva IP adresu tek tada).
      var mapLoad = document.getElementById('map-load');
      if (mapLoad) mapLoad.addEventListener('click', function () {
        var box = document.getElementById('map');
        var f = document.createElement('iframe');
        f.src = box.getAttribute('data-src'); f.title = box.getAttribute('data-title');
        f.referrerPolicy = 'no-referrer-when-downgrade';
        box.textContent = ''; box.classList.add('map--on'); box.appendChild(f);
      });
      // Broj gostiju: gumbi − i +
      var guests = document.getElementById('guests');
      document.querySelectorAll('.stepper__btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = (parseInt(guests.value, 10) || 0) + parseInt(b.getAttribute('data-step'), 10);
          guests.value = Math.min(+guests.max, Math.max(+guests.min, v));
        });
      });
      var picker = null;
      if (window.flatpickr) {
        picker = flatpickr('#dates', {
          mode: 'range',
          dateFormat: 'd.m.Y',
          minDate: 'today',
          showMonths: window.innerWidth >= 700 ? 2 : 1,
          disableMobile: true,
          locale: Object.assign({}, (flatpickr.l10ns[${js(current.code)}] || flatpickr.l10ns.default), { rangeSeparator: ' \u2013 ', firstDayOfWeek: 1 })
        });
      }
      var sitekey = ${js(process.env.TURNSTILE_SITEKEY || site.turnstile_sitekey || '')};
      var emailText = ${js(t.email)};
      var email = null, emailPromise = null, widgetId = null;
      // E-mail adresa se ne nalazi u kodu stranice: server je vraća tek nakon provjere (Cloudflare Turnstile).
      var getEmail = function () {
        if (email) return Promise.resolve(email);
        if (emailPromise) return emailPromise;
        emailPromise = new Promise(function (resolve, reject) {
          var tries = 0;
          // Skripta za provjeru učitava se tek kad zatreba (klik na e-mail ili ispunjavanje obrasca).
          if (!window.turnstile && !document.getElementById('ts-script')) {
            var ts = document.createElement('script');
            ts.id = 'ts-script'; ts.async = true;
            ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            document.head.appendChild(ts);
          }
          var start = function () {
            if (!window.turnstile) {
              if (++tries > 100) return reject(new Error('turnstile'));
              return setTimeout(start, 100);
            }
            try {
              widgetId = turnstile.render('#ts-box', {
                sitekey: sitekey,
                execution: 'execute',
                appearance: 'interaction-only',
                callback: function (token) {
                  fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token }) })
                    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('verify')); })
                    .then(function (d) { return d && d.email ? resolve(d.email) : reject(new Error('empty')); })
                    .catch(reject);
                },
                'error-callback': function () { reject(new Error('widget')); }
              });
              turnstile.execute('#ts-box');
            } catch (err) { reject(err); }
          };
          start();
        });
        emailPromise.then(function (a) {
          email = a;
          try { turnstile.remove(widgetId); } catch (e) {}
          showEmail(a);
        }, function () {
          emailPromise = null;
          try { turnstile.remove(widgetId); } catch (e) {}
          var btn = document.getElementById('show-email');
          if (btn) { btn.disabled = false; btn.textContent = emailText.show; }
          var item = document.getElementById('email-item');
          if (item && !item.querySelector('.email-err')) {
            var p = document.createElement('p'); p.className = 'email-err'; p.setAttribute('role', 'alert'); p.textContent = emailText.error; item.appendChild(p);
          }
        });
        return emailPromise;
      };
      var showEmail = function (addr) {
        var item = document.getElementById('email-item');
        if (!item) return;
        item.textContent = '';
        var a = document.createElement('a'); a.href = 'mailto:' + addr; a.textContent = addr; item.appendChild(a);
      };
      var showBtn = document.getElementById('show-email');
      if (showBtn) showBtn.addEventListener('click', function () {
        showBtn.disabled = true; showBtn.textContent = emailText.checking;
        var old = document.querySelector('.email-err'); if (old) old.remove();
        getEmail().catch(function () {});
      });
      // Provjera se pokreće čim posjetitelj počne ispunjavati obrazac, da je adresa spremna pri slanju.
      form.addEventListener('focusin', function () { if (!email) getEmail().catch(function () {}); }, { once: true });
      var wa = ${js(waNumber)};
      var m = ${js({ ...t.mail, siteName: site.name })};
      var channel = 'mail';
      // Zapamti ručni odabir jezika da ga automatski izbor ne prebriše.
      document.querySelectorAll('.lang a').forEach(function (a) {
        a.addEventListener('click', function () {
          try { document.cookie = 'lang=' + a.getAttribute('hreflang') + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) {}
        });
      });
      form.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { channel = b.getAttribute('data-channel'); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = new FormData(form);
        var text = [
          m.title + ' ' + m.siteName,
          m.name + ': ' + (d.get('name') || ''),
          m.arrival + ': ' + (picker && picker.selectedDates[0] ? picker.formatDate(picker.selectedDates[0], 'd.m.Y') : ''),
          m.departure + ': ' + (picker && picker.selectedDates[1] ? picker.formatDate(picker.selectedDates[1], 'd.m.Y') : ''),
          m.guests + ': ' + (d.get('guests') || ''),
          '',
          d.get('message') || ''
        ].join('\\n');
        if (channel === 'wa') {
          window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        } else {
          getEmail().then(function (addr) {
            var href = 'mailto:' + addr + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(text);
            var fb = form.querySelector('.form__open');
            if (!fb) { fb = document.createElement('a'); fb.className = 'form__open'; form.appendChild(fb); }
            fb.href = href; fb.textContent = emailText.open;
            window.location.href = href;
          }, function () {
            var er = form.querySelector('.form__err');
            if (!er) { er = document.createElement('p'); er.className = 'form__err'; er.setAttribute('role', 'alert'); form.appendChild(er); }
            er.textContent = emailText.error;
          });
        }
      });
    })();
  </script>
  ${gaScript()}
</body>
</html>
`;
}


// Stranica "Pravila privatnosti" za svaki jezik (tekst u content/privacy.json).
function renderPrivacy(lang) {
  const t = ui[lang];
  const pv = privacy[lang] || privacy[defaultLang];
  const current = languages.find((l) => l.code === lang);
  const operator = site.operator ? `${site.operator}, ${site.address}` : `${site.name}, ${site.address}`;
  const fill = (x) => esc(x).replace('{operator}', esc(operator)).replace('{phone}', `<a href="${esc(telHref)}">${esc(site.phone)}</a>`);
  const date = privacy.updated ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(privacy.updated + 'T12:00:00Z')) : '';
  const langSwitch = languages
    .map((l) => `<li><a href="${privacyUrl(l.code)}" hreflang="${l.code}" lang="${l.code}" title="${esc(l.name)}"${l.code === lang ? ' aria-current="true"' : ''}>${l.short}</a></li>`)
    .join('');
  const alternates = baseUrl ? languages.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${baseUrl + privacyUrl(l.code)}">`).join('\n  ') : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pv.title)} | ${esc(site.name)}</title>
  ${baseUrl ? `<link rel="canonical" href="${esc(baseUrl + privacyUrl(lang))}">` : ''}
  ${alternates}
  <meta name="theme-color" content="#12474f">
  <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
  ${FONT_PRELOAD}
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <a class="skip" href="#content">${esc(t.skip)}</a>
  <header class="top">
    <a class="brand" href="${urlFor(lang)}"><img class="brand__mark" src="/images/logo-mark.svg" alt="" width="36" height="36"><span>${esc(site.name)}</span></a>
    <div class="top__right"><ul class="lang lang--always" aria-label="${esc(t.langLabel)}">${langSwitch}</ul></div>
  </header>
  <main id="content" class="block legal">
    <div>
      <p><a class="back" href="${urlFor(lang)}">&larr; ${esc(t.back)}</a></p>
      <h1>${esc(pv.title)}</h1>
      ${date ? `<p class="legal__date">${esc(pv.updated_label)}: ${esc(date)}</p>` : ''}
      ${pv.sections.map((sec) => `<h2>${esc(sec.h)}</h2>${sec.p.map((x) => `<p>${fill(x)}</p>`).join('')}`).join('\n      ')}
    </div>
  </main>
  ${footer(lang, false)}
  ${consentBox(t)}
  <script>
    document.querySelectorAll('.lang a').forEach(function (a) {
      a.addEventListener('click', function () { try { document.cookie = 'lang=' + a.getAttribute('hreflang') + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) {} });
    });
  </script>
  ${gaScript()}
</body>
</html>
`;
}

// --- izlaz ---
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const dir of ['css', 'fonts', 'images', 'vendor']) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dist, dir), { recursive: true });
}

for (const l of languages) {
  const outDir = l.code === defaultLang ? dist : path.join(dist, l.code);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderPage(l.code));
  const pDir = path.join(outDir, ui[l.code].privacyPath);
  fs.mkdirSync(pDir, { recursive: true });
  fs.writeFileSync(path.join(pDir, 'index.html'), renderPrivacy(l.code));
}

fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\n${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : ''}`
);

if (baseUrl) {
  const links = languages
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${baseUrl + urlFor(l.code)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl + urlFor(defaultLang)}"/>`)
    .join('\n');
  const urls = languages.map((l) => `  <url>\n    <loc>${baseUrl + urlFor(l.code)}</loc>\n${links}\n  </url>`)
    .concat(languages.map((l) => `  <url>\n    <loc>${baseUrl + privacyUrl(l.code)}</loc>\n  </url>`))
    .join('\n');
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
  );
}

// upozorenja
const warn = [];
if (!site.turnstile_sitekey) warn.push('Nedostaje turnstile_sitekey u content/site.json (e-mail se neće moći prikazati).');
if (/0000/.test(site.phone)) warn.push('Telefon je još privremeni.');
if (!site.operator) warn.push('U content/site.json nije upisan voditelj obrade (operator: ime vlasnika ili tvrtke i OIB) za stranicu Pravila privatnosti.');
if (!baseUrl) warn.push('Adresa stranice (url) nije postavljena, pa nema canonical, hreflang i sitemap.');
for (const l of languages) {
  if (l.code === defaultLang) continue;
  const miss = ['seo_title', 'hero_title', 'hero_text', 'about_text'].filter((k) => empty(site.texts && site.texts[l.code] && site.texts[l.code][k]));
  if (miss.length) warn.push(`Jezik ${l.code}: nedostaju prijevodi (${miss.join(', ')}), prikazuje se hrvatski tekst.`);
}
warn.forEach((w) => console.warn('UPOZORENJE: ' + w));
console.log('Gotovo: ' + languages.map((l) => (l.code === defaultLang ? 'index.html' : l.code + '/index.html')).join(', '));
