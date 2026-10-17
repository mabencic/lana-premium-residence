// Gradi statičnu stranicu iz datoteka u mapi content/ u mapu dist/.
// Nema vanjskih paketa: pokreće se s `node build.js`.
const fs = require('fs');
const path = require('path');

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

const baseUrl = (site.url || process.env.CF_PAGES_URL || '').replace(/\/$/, '');
const telHref = 'tel:' + String(site.phone || '').replace(/[^\d+]/g, '');
const waNumber = String(site.whatsapp || '').replace(/\D/g, '');
const mapQuery = encodeURIComponent(`${site.address}`);
const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
const img = (p) => (p || '').replace(/^\//, '');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: site.name,
  description: site.seo_description,
  url: baseUrl || undefined,
  image: baseUrl && site.hero_image ? `${baseUrl}/${img(site.hero_image)}` : undefined,
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
  amenityFeature: ['Bazen', 'Teniski tereni', 'Besplatan parking', 'Wi-Fi', 'Klima'].map((n) => ({
    '@type': 'LocationFeatureSpecification',
    name: n,
    value: true,
  })),
  sameAs: [site.instagram, site.facebook].filter(Boolean),
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const apartmentCards = apartments
  .map(
    (a) => `
      <article class="apt">
        <div class="arch apt__img"><img src="${esc(img(a.image))}" alt="${esc(a.image_alt)}" loading="lazy" width="800" height="1000"></div>
        <div class="apt__body">
          <h3>${esc(a.name)}</h3>
          ${a.count_note ? `<p class="apt__note">${esc(a.count_note)}</p>` : ''}
          <p>${esc(a.description)}</p>
          <ul class="chips">${(a.specs || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="btn" href="#kontakt">Pošalji upit</a>
        </div>
      </article>`
  )
  .join('');

const amenityItems = amenities
  .map((a) => `<li><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></li>`)
  .join('');

const galleryItems = gallery
  .map(
    (g, i) =>
      `<figure class="g g--${(i % 6) + 1}"><img src="${esc(img(g.image))}" alt="${esc(g.alt)}" loading="lazy" width="900" height="700"></figure>`
  )
  .join('');

const faqItems = faq
  .map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)
  .join('');

const bookingBtn = site.booking_url
  ? `<a class="btn btn--ghost" href="${esc(site.booking_url)}" rel="noopener">Rezerviraj online</a>`
  : '';

const html = `<!doctype html>
<html lang="${esc(site.locale || 'hr')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(site.seo_title)}</title>
  <meta name="description" content="${esc(site.seo_description)}">
  ${baseUrl ? `<link rel="canonical" href="${esc(baseUrl)}/">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(site.seo_title)}">
  <meta property="og:description" content="${esc(site.seo_description)}">
  <meta property="og:locale" content="hr_HR">
  ${baseUrl && site.hero_image ? `<meta property="og:image" content="${esc(baseUrl)}/${esc(img(site.hero_image))}">` : ''}
  <meta name="theme-color" content="#12474f">
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body>
  <a class="skip" href="#sadrzaj">Preskoči na sadržaj</a>
  <header class="top">
    <a class="brand" href="#">${esc(site.name)}</a>
    <nav aria-label="Glavni izbornik">
      <a href="#apartmani">Apartmani</a>
      <a href="#sadrzaji">Sadržaji</a>
      <a href="#galerija">Galerija</a>
      <a href="#lokacija">Lokacija</a>
      <a href="#pitanja">Pitanja</a>
      <a class="btn btn--small" href="#kontakt">Upit</a>
    </nav>
  </header>

  <main id="sadrzaj">
    <section class="hero">
      <div class="hero__text">
        <h1>${esc(site.hero_title)}</h1>
        <p>${esc(site.hero_text)}</p>
        <div class="actions">
          <a class="btn" href="#kontakt">Pošalji upit</a>
          <a class="btn btn--ghost" href="#apartmani">Pogledaj apartmane</a>
        </div>
      </div>
      <div class="arch hero__img"><img src="${esc(img(site.hero_image))}" alt="${esc(site.hero_image_alt)}" width="800" height="1000"></div>
    </section>

    <section class="about">
      <h2>${esc(site.about_title)}</h2>
      <p>${esc(site.about_text)}</p>
    </section>

    <section id="apartmani" class="block">
      <h2>Apartmani</h2>
      <div class="apts">${apartmentCards}</div>
    </section>

    <section id="sadrzaji" class="block block--tint">
      <h2>Što je uključeno u boravak</h2>
      <ul class="amenities">${amenityItems}</ul>
    </section>

    <section id="galerija" class="block">
      <h2>Galerija</h2>
      <div class="gallery">${galleryItems}</div>
    </section>

    <section id="lokacija" class="block block--tint">
      <div class="loc">
        <div>
          <h2>Lokacija</h2>
          <address>${esc(site.address)}</address>
          <p>${esc(site.distance_note)}. Mirno okruženje u zelenilu, a grad, plaže i istarska zaleđa su na kratkoj vožnji.</p>
          <a class="btn btn--ghost" href="${mapLink}" rel="noopener">Otvori u Google kartama</a>
        </div>
        <iframe title="Karta: ${esc(site.name)}" src="${mapEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>

    <section id="pitanja" class="block">
      <h2>Česta pitanja</h2>
      <div class="faq">${faqItems}</div>
    </section>

    <section id="kontakt" class="block contact">
      <div>
        <h2>Pošaljite upit</h2>
        <p>Javite nam datume i broj gostiju, a odgovaramo s dostupnošću i cijenom.</p>
        <ul class="contact__list">
          <li><a href="${esc(telHref)}">${esc(site.phone)}</a></li>
          <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
          ${site.instagram ? `<li><a href="${esc(site.instagram)}" rel="noopener">Instagram</a></li>` : ''}
          ${site.facebook ? `<li><a href="${esc(site.facebook)}" rel="noopener">Facebook</a></li>` : ''}
        </ul>
        ${bookingBtn}
      </div>
      <form id="upit" class="form" novalidate>
        <label>Ime i prezime<input name="ime" autocomplete="name" required></label>
        <div class="row">
          <label>Dolazak<input type="date" name="dolazak"></label>
          <label>Odlazak<input type="date" name="odlazak"></label>
        </div>
        <label>Broj gostiju<input type="number" name="gosti" min="1" max="3" value="2"></label>
        <label>Poruka<textarea name="poruka" rows="4"></textarea></label>
        <div class="actions">
          <button class="btn" type="submit" data-channel="mail">Pošalji e-mailom</button>
          <button class="btn btn--ghost" type="submit" data-channel="wa">Pošalji na WhatsApp</button>
        </div>
        <p class="form__hint">Otvara se vaša aplikacija za e-mail ili WhatsApp s već pripremljenom porukom.</p>
      </form>
    </section>
  </main>

  <footer class="foot">
    <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}</p>
    <p>${esc(site.address)}</p>
  </footer>

  <script>
    (function () {
      var form = document.getElementById('upit');
      var email = ${JSON.stringify(site.email)};
      var wa = ${JSON.stringify(waNumber)};
      var channel = 'mail';
      form.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { channel = b.getAttribute('data-channel'); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = new FormData(form);
        var lines = [
          'Upit za ${esc(site.name)}',
          'Ime: ' + (d.get('ime') || ''),
          'Dolazak: ' + (d.get('dolazak') || ''),
          'Odlazak: ' + (d.get('odlazak') || ''),
          'Gostiju: ' + (d.get('gosti') || ''),
          '',
          d.get('poruka') || ''
        ];
        var text = lines.join('\\n');
        if (channel === 'wa') {
          window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        } else {
          window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Upit za smještaj') + '&body=' + encodeURIComponent(text);
        }
      });
    })();
  </script>
</body>
</html>
`;

// --- izlaz ---
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
};
copyDir(path.join(root, 'css'), path.join(dist, 'css'));
copyDir(path.join(root, 'images'), path.join(dist, 'images'));
copyDir(path.join(root, 'admin'), path.join(dist, 'admin'));

fs.writeFileSync(path.join(dist, 'index.html'), html);

fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : ''}`
);
if (baseUrl) {
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${baseUrl}/</loc></url>\n</urlset>\n`
  );
}

// upozorenja o privremenim podacima
const warn = [];
if (/example\.com/.test(site.email)) warn.push('E-mail je još privremeni (info@example.com).');
if (/0000/.test(site.phone)) warn.push('Telefon je još privremeni.');
if (!baseUrl) warn.push('Adresa stranice (url) nije postavljena, pa nema canonical/sitemap.');
warn.forEach((w) => console.warn('UPOZORENJE: ' + w));
console.log('Gotovo: dist/index.html');
