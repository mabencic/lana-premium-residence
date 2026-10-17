# Lana Premium Residence: web stranica

Statična stranica na hrvatskom s CMS-om (Decap CMS). Prijatelj sadržaj uređuje na `adresa-stranice/admin`, a stranica se sama osvježi.

## Što je u mapi

- `content/` tekstovi i podaci (to uređuje CMS)
- `images/` slike (privremene su SVG slike-zamjene)
- `css/style.css` izgled
- `build.js` pretvara sadržaj u gotovu stranicu (mapa `dist/`)
- `admin/` CMS
- `functions/api/` mali dio koji omogućuje prijavu u CMS preko GitHuba

## Postavljanje, korak po korak

### 1. GitHub
1. Na GitHubu napravite repozitorij `lana-premium-residence` (New repository, Create repository).
2. Add file, Upload files: povucite SADRŽAJ ove mape (ne samu mapu `lana-premium-residence`, nego `content`, `images`, `css`, `admin`, `functions`, `build.js`, `README.md`, `.gitignore`) i kliknite Commit changes.

### 2. Cloudflare Pages
1. Otvorite račun na cloudflare.com, zatim Workers & Pages, Create, Pages, Connect to Git.
2. Odaberite repozitorij `lana-premium-residence`.
3. Postavke izgradnje:
   - Build command: `node build.js`
   - Build output directory: `dist`
4. Save and Deploy. Dobit ćete adresu oblika `lana-premium-residence.pages.dev`.

### 3. Prijava u CMS (jednokratno)
1. GitHub, Settings, Developer settings, OAuth Apps, New OAuth App:
   - Homepage URL: adresa stranice s Cloudflarea
   - Authorization callback URL: `https://ADRESA-STRANICE/api/callback`
2. Spremite Client ID, napravite Client secret i spremite ga.
3. Cloudflare, projekt, Settings, Variables and Secrets, dodajte:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET` (kao Secret)
4. U repozitoriju uredite `admin/config.yml` i zamijenite sva mjesta označena s `TODO` (korisničko ime na GitHubu i adresa stranice).
5. Otvorite `ADRESA-STRANICE/admin`, kliknite prijavu s GitHubom.

Tko se prijavljuje, mora imati pristup za pisanje u repozitorij (prijatelja dodajte u Settings, Collaborators).

### 4. Vlastita domena
Cloudflare, projekt, Custom domains, Set up a domain. Nakon toga upišite novu adresu u CMS pod "Opći podaci i kontakt", polje "Adresa stranice". Time se uključuju sitemap i canonical oznake za Google.

## Što još treba zamijeniti prije objave

- [ ] Telefon, e-mail i WhatsApp broj (sada su privremeni)
- [ ] Fotografije: glavna, apartmana i galerija (sada su SVG slike-zamjene)
- [ ] Provjeriti tekstove: broj osoba, sadržaje, česta pitanja (pravila za ljubimce, doručak, vrijeme prijave i odjave)
- [ ] Poveznice na Instagram, Facebook i eventualno online rezervaciju
- [ ] Otvoriti Google Business Profile i dodati poveznicu na stranicu

## Lokalni pregled (po želji)

Treba Node.js. U mapi pokrenite `node build.js`, a zatim otvorite `dist/index.html` u pregledniku.
