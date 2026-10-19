// Generira admin/config.yml (postavke CMS-a) tako da se tekstovi za sva 4 jezika ne moraju ručno ponavljati.
// Pokretanje: node tools/make-cms-config.js   (zapisuje admin/config.yml)
//             node tools/make-cms-config.js --json   (ispisuje isti sadržaj kao JSON, za provjeru)
const fs = require('fs');
const path = require('path');

const REPO = 'mabencic/lana-premium-residence';
const SITE_URL = 'https://lana-premium-residence.pages.dev';
const LANGS = [
  ['hr', 'Hrvatski (glavni jezik)'],
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
];

const str = (label, name, extra = {}) => ({ label, name, widget: 'string', ...extra });
const txt = (label, name, extra = {}) => ({ label, name, widget: 'text', ...extra });
const image = (label, name, extra = {}) => ({ label, name, widget: 'image', ...extra });

// Objekt s po jednim blokom za svaki jezik. Hrvatski je obavezan, ostali nisu
// (ako je prazno, na stranici se prikaže hrvatski tekst).
const perLanguage = (makeFields) =>
  LANGS.map(([code, label], i) => ({
    label,
    name: code,
    widget: 'object',
    collapsed: i > 0,
    required: i === 0,
    fields: makeFields().map((f) => (i === 0 ? f : { ...f, required: false })),
  }));

const editLabel = str('Naziv za uređivanje (ne prikazuje se na stranici)', 'label');

const config = {
  backend: {
    name: 'github',
    repo: REPO,
    branch: 'main',
    base_url: SITE_URL,
    auth_endpoint: 'api/auth',
  },
  locale: 'hr',
  media_folder: 'images/uploads',
  public_folder: '/images/uploads',
  site_url: SITE_URL,
  collections: [
    {
      name: 'stranica',
      label: 'Stranica',
      files: [
        {
          name: 'site',
          label: 'Opći podaci, kontakt i uvodni tekstovi',
          file: 'content/site.json',
          format: 'json',
          fields: [
            str('Naziv objekta', 'name'),
            str('Adresa stranice (npr. https://lana-premium-residence.hr)', 'url', { required: false }),
            str('Adresa objekta', 'address'),
            str('Zemljopisna širina', 'latitude'),
            str('Zemljopisna dužina', 'longitude'),
            str('Telefon', 'phone'),
            str('E-mail', 'email'),
            str('WhatsApp broj (samo znamenke, npr. 385991234567)', 'whatsapp'),
            str('Instagram (poveznica)', 'instagram', { required: false }),
            str('Facebook (poveznica)', 'facebook', { required: false }),
            str('Poveznica za online rezervaciju (ako postoji)', 'booking_url', { required: false }),
            image('Glavna fotografija', 'hero_image'),
            {
              label: 'Tekstovi po jezicima',
              name: 'texts',
              widget: 'object',
              fields: perLanguage(() => [
                str('Naslov u Googleu (do 60 znakova)', 'seo_title'),
                txt('Opis u Googleu (do 160 znakova)', 'seo_description'),
                str('Glavni naslov', 'hero_title'),
                txt('Uvodni tekst', 'hero_text'),
                str('Opis glavne fotografije', 'hero_image_alt'),
                str('Naslov "O nama"', 'about_title'),
                txt('Tekst "O nama"', 'about_text'),
                str('Udaljenost (npr. Oko 6 km do središta Poreča)', 'distance_note'),
              ]),
            },
          ],
        },
        {
          name: 'apartments',
          label: 'Apartmani',
          file: 'content/apartments.json',
          format: 'json',
          fields: [
            {
              label: 'Apartmani',
              name: 'items',
              widget: 'list',
              summary: '{{fields.label}}',
              fields: [
                editLabel,
                image('Fotografija', 'image'),
                ...perLanguage(() => [
                  str('Naziv', 'name'),
                  str('Napomena (npr. 8 apartmana u kompleksu)', 'count_note', { required: false }),
                  txt('Opis', 'description'),
                  str('Opis fotografije', 'image_alt'),
                  {
                    label: 'Oznake (npr. 45 m², Klima)',
                    name: 'specs',
                    widget: 'list',
                    required: false,
                    field: str('Oznaka', 'spec'),
                  },
                ]),
              ],
            },
          ],
        },
        {
          name: 'amenities',
          label: 'Sadržaji',
          file: 'content/amenities.json',
          format: 'json',
          fields: [
            {
              label: 'Sadržaji',
              name: 'items',
              widget: 'list',
              summary: '{{fields.label}}',
              fields: [editLabel, ...perLanguage(() => [str('Naslov', 'title'), str('Opis', 'text')])],
            },
          ],
        },
        {
          name: 'gallery',
          label: 'Galerija',
          file: 'content/gallery.json',
          format: 'json',
          fields: [
            {
              label: 'Fotografije',
              name: 'items',
              widget: 'list',
              summary: '{{fields.label}}',
              fields: [
                editLabel,
                image('Fotografija (naslovna, vidi se u galeriji)', 'image'),
                {
                  label: 'Dodatne fotografije (otvaraju se klikom na naslovnu i listaju se)',
                  name: 'more',
                  widget: 'list',
                  required: false,
                  field: image('Fotografija', 'photo'),
                },
                {
                  label: 'Opis fotografije po jezicima',
                  name: 'alt',
                  widget: 'object',
                  collapsed: true,
                  fields: LANGS.map(([code, label], i) => str(label, code, { required: i === 0 })),
                },
              ],
            },
          ],
        },
        {
          name: 'faq',
          label: 'Česta pitanja',
          file: 'content/faq.json',
          format: 'json',
          fields: [
            {
              label: 'Pitanja',
              name: 'items',
              widget: 'list',
              summary: '{{fields.label}}',
              fields: [editLabel, ...perLanguage(() => [str('Pitanje', 'question'), txt('Odgovor', 'answer')])],
            },
          ],
        },
      ],
    },
  ],
};

// --- zapis u YAML (jednostavan ispis, svi nizovi znakova u navodnicima) ---
const scalar = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
function toLines(v, indent) {
  const pad = ' '.repeat(indent);
  const out = [];
  if (Array.isArray(v)) {
    for (const item of v) {
      if (item && typeof item === 'object') {
        const sub = toLines(item, indent + 2);
        sub[0] = pad + '- ' + sub[0].slice(indent + 2);
        out.push(...sub);
      } else {
        out.push(pad + '- ' + scalar(item));
      }
    }
  } else {
    for (const [k, val] of Object.entries(v)) {
      if (val && typeof val === 'object') {
        out.push(`${pad}${k}:`);
        out.push(...toLines(val, indent + 2));
      } else {
        out.push(`${pad}${k}: ${scalar(val)}`);
      }
    }
  }
  return out;
}

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(config));
} else {
  const header =
    '# Automatski generirano naredbom: node tools/make-cms-config.js\n' +
    '# Ako stranica dobije vlastitu domenu, promijenite SITE_URL u tools/make-cms-config.js i pokrenite naredbu ponovno.\n';
  fs.writeFileSync(path.join(__dirname, '..', 'admin', 'config.yml'), header + toLines(config, 0).join('\n') + '\n');
  console.log('Zapisano: admin/config.yml');
}
