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
const telHref = 'tel:' + String(site.phone || '').replace(/[^\d+]/g, '');
const waNumber = String(site.whatsapp || '').replace(/\D/g, '');
const mapQuery = encodeURIComponent(site.address || '');
const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

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
    email: site.email,
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
      lightboxData['a' + i] = [a.image, ...aMore].map((p) => ({ src: img(p), alt: aAlt }));
      const aBadge = aMore.length ? `<span class="g__more" aria-hidden="true">+${aMore.length}</span>` : '';
      const aLabel = aMore.length ? `${aAlt} (${t.lightbox.open})` : aAlt;
      return `
      <article class="apt">
        <div class="apt__img"><button type="button" class="g__btn" data-lb="a${i}" aria-label="${esc(aLabel)}" aria-haspopup="dialog"><img src="${esc(img(a.image))}" alt="${esc(aAlt)}" loading="lazy" width="1500" height="1000">${aBadge}</button></div>
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
    .map((a) => `<li><h3>${esc(pick(a, lang, 'title'))}</h3><p>${esc(pick(a, lang, 'text'))}</p></li>`)
    .join('');

  const galleryItems = gallery
    .map((g, i) => {
      const alt = (g.alt && (g.alt[lang] || g.alt[defaultLang])) || '';
      const more = Array.isArray(g.more) ? g.more.filter(Boolean) : [];
      lightboxData['g' + i] = [g.image, ...more].map((p) => ({ src: img(p), alt }));
      const title = (g.title && (g.title[lang] || g.title[defaultLang])) || '';
      const badge = more.length ? `<span class="g__more" aria-hidden="true">+${more.length}</span>` : '';
      const cap = title ? `<span class="g__cap">${esc(title)}</span>` : '';
      const label = more.length ? `${alt} (${t.lightbox.open})` : alt;
      return `<figure class="g g--${i < 6 ? i + 1 : 7}"><button type="button" class="g__btn" data-lb="g${i}" aria-label="${esc(label)}" aria-haspopup="dialog"><img src="${esc(img(g.image))}" alt="${esc(alt)}" loading="lazy" width="900" height="700">${cap}${badge}</button></figure>`;
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/vendor/flatpickr/flatpickr.min.css">
  <link rel="stylesheet" href="/css/style.css">
  <script type="application/ld+json">${js(jsonLd)}</script>
  <script type="application/ld+json">${js(faqLd)}</script>
</head>
<body>
  <a class="skip" href="#content">${esc(t.skip)}</a>
  <header class="top">
    <a class="brand" href="${urlFor(lang)}">${esc(site.name)}</a>
    <div class="top__right">
      <nav aria-label="${esc(t.navLabel)}">
        <a href="#apartments">${esc(t.nav.apartments)}</a>
        <a href="#amenities">${esc(t.nav.amenities)}</a>
        <a href="#gallery">${esc(t.nav.gallery)}</a>
        <a href="#location">${esc(t.nav.location)}</a>
        <a href="#faq">${esc(t.nav.faq)}</a>
        <a class="btn btn--small" href="#contact">${esc(t.nav.enquire)}</a>
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
      <div class="arch hero__img"><img src="${esc(img(site.hero_image))}" alt="${esc(tx('hero_image_alt'))}" width="1500" height="1000" fetchpriority="high"></div>
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
        <iframe title="${esc(t.mapTitle)}: ${esc(site.name)}" src="${mapEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
          <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
          ${site.instagram ? `<li><a href="${esc(site.instagram)}" rel="noopener">Instagram</a></li>` : ''}
          ${site.facebook ? `<li><a href="${esc(site.facebook)}" rel="noopener">Facebook</a></li>` : ''}
        </ul>
        ${bookingBtn}
      </div>
      <form id="enquiry" class="form" novalidate>
        <label>${esc(t.form.name)}<input name="name" autocomplete="name" required></label>
        <label>${esc(t.form.dates)}<input name="dates" id="dates" autocomplete="off" inputmode="none" placeholder="${esc(t.form.datesPlaceholder)}"></label>
        <label>${esc(t.form.guests)}<input type="number" name="guests" min="1" max="3" value="2"></label>
        <label>${esc(t.form.message)}<textarea name="message" rows="4"></textarea></label>
        <div class="actions">
          <button class="btn" type="submit" data-channel="mail">${esc(t.form.sendMail)}</button>
          <button class="btn btn--ghost" type="submit" data-channel="wa">${esc(t.form.sendWhatsApp)}</button>
        </div>
        <p class="form__hint">${esc(t.form.hint)}</p>
      </form>
    </section>
  </main>

  <footer class="foot">
    <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}</p>
    <p>${esc(site.address)}</p>
  </footer>

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
      var email = ${js(site.email)};
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
          window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(text);
        }
      });
    })();
  </script>
</body>
</html>
`;
}

// --- izlaz ---
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const dir of ['css', 'images', 'admin', 'vendor']) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dist, dir), { recursive: true });
}

for (const l of languages) {
  const outDir = l.code === defaultLang ? dist : path.join(dist, l.code);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderPage(l.code));
}

fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : ''}`
);

if (baseUrl) {
  const links = languages
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${baseUrl + urlFor(l.code)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl + urlFor(defaultLang)}"/>`)
    .join('\n');
  const urls = languages.map((l) => `  <url>\n    <loc>${baseUrl + urlFor(l.code)}</loc>\n${links}\n  </url>`).join('\n');
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
  );
}

// upozorenja
const warn = [];
if (/example\.com/.test(site.email)) warn.push('E-mail je još privremeni (info@example.com).');
if (/0000/.test(site.phone)) warn.push('Telefon je još privremeni.');
if (!baseUrl) warn.push('Adresa stranice (url) nije postavljena, pa nema canonical, hreflang i sitemap.');
for (const l of languages) {
  if (l.code === defaultLang) continue;
  const miss = ['seo_title', 'hero_title', 'hero_text', 'about_text'].filter((k) => empty(site.texts && site.texts[l.code] && site.texts[l.code][k]));
  if (miss.length) warn.push(`Jezik ${l.code}: nedostaju prijevodi (${miss.join(', ')}), prikazuje se hrvatski tekst.`);
}
warn.forEach((w) => console.warn('UPOZORENJE: ' + w));
console.log('Gotovo: ' + languages.map((l) => (l.code === defaultLang ? 'index.html' : l.code + '/index.html')).join(', '));
