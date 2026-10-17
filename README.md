# Lana Premium Residence: web stranica

Statična višejezična stranica s CMS-om (Decap CMS). Prijatelj sadržaj uređuje na `adresa-stranice/admin`, a stranica se sama osvježi.

## Jezici

Hrvatski je glavni jezik i nalazi se na početnoj adresi (`/`). Ostali jezici su na `/en/` (engleski), `/de/` (njemački) i `/it/` (talijanski), a u zaglavlju je izbornik za promjenu jezika. Na početnoj adresi (`/`) posjetitelj se automatski preusmjerava na svoj jezik (datoteka `functions/index.js`):

1. ako je jezik već ručno odabrao u izborniku, pamti se taj odabir,
2. inače se gleda jezik preglednika (hrvatski, engleski, njemački, talijanski),
3. ako je preglednik na engleskom, a posjetitelj dolazi iz Njemačke, Austrije, Švicarske ili Italije, dobiva njemački odnosno talijanski,
4. ako preglednik ne javlja jezik, odlučuje država posjetitelja, a za sve ostalo je engleski.

Tražilice (Google i ostali) se ne preusmjeravaju, pa uvijek vide hrvatsku stranicu i oznake `hreflang` za ostale jezike. Izbornik za jezik uvijek ostaje vidljiv.

U CMS-u se tekstovi za sva četiri jezika uređuju na istom mjestu: svaka stavka ima blokove Hrvatski, English, Deutsch i Italiano. Hrvatski je obavezan. Ako neko polje u drugom jeziku ostane prazno, na stranici se prikaže hrvatski tekst. Fotografije se biraju samo jednom.

Prijevode je napisao Claude. Preporučuje se da ih pregleda osoba koja govori taj jezik prije objave.

Tekstovi sučelja (izbornik, gumbi, obrazac) nalaze se u datoteci `i18n.js`.

## Što je u mapi

- `content/` tekstovi i podaci (to uređuje CMS)
- `images/` slike (privremene su SVG slike-zamjene)
- `css/style.css` izgled
- `build.js` pretvara sadržaj u gotovu stranicu (mapa `dist/`), po jedna stranica za svaki jezik
- `i18n.js` popis jezika i tekstovi sučelja
- `admin/` CMS (`config.yml` je generiran, vidi `tools/make-cms-config.js`)
- `tools/make-cms-config.js` generira `admin/config.yml`. Ako mijenjate polja u CMS-u, mijenjate ovu datoteku i pokrenete `node tools/make-cms-config.js`.
- `functions/index.js` automatski izbor jezika na početnoj adresi
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
