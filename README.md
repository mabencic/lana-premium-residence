# Lana Premium Residence: web stranica

Statična višejezična stranica. Sadržaj (tekstovi, fotografije, kontakt) nalazi se u mapi `content/` i `images/`, a nakon svake promjene u repozitoriju Cloudflare Pages sam objavi novu verziju.

## Jezici

Hrvatski je glavni jezik i nalazi se na početnoj adresi (`/`). Ostali jezici su na `/en/` (engleski), `/de/` (njemački) i `/it/` (talijanski), a u zaglavlju je izbornik za promjenu jezika (na mobitelu se nalazi u izborniku ☰, a oznaka trenutnog jezika vidi se na samom gumbu). Na početnoj adresi (`/`) posjetitelj se automatski preusmjerava na svoj jezik (datoteka `functions/index.js`):

1. ako je jezik već ručno odabrao u izborniku, pamti se taj odabir,
2. inače se gleda jezik preglednika (hrvatski, engleski, njemački, talijanski),
3. ako je preglednik na engleskom, a posjetitelj dolazi iz Njemačke, Austrije, Švicarske ili Italije, dobiva njemački odnosno talijanski,
4. ako preglednik ne javlja jezik, odlučuje država posjetitelja, a za sve ostalo je engleski.

Tražilice (Google i ostali) se ne preusmjeravaju, pa uvijek vide hrvatsku stranicu i oznake `hreflang` za ostale jezike. Izbornik za jezik uvijek ostaje vidljiv.

U datotekama u `content/` svaka stavka ima tekstove za sva četiri jezika (`hr`, `en`, `de`, `it`). Hrvatski je obavezan. Ako neko polje u drugom jeziku ostane prazno, na stranici se prikaže hrvatski tekst. Fotografije se biraju samo jednom.

Prijevode je napisao Claude. Preporučuje se da ih pregleda osoba koja govori taj jezik prije objave.

Tekstovi sučelja (izbornik, gumbi, obrazac) nalaze se u datoteci `i18n.js`.

## Što je u mapi

- `content/` tekstovi i podaci (JSON datoteke), uključujući `privacy.json` (Pravila privatnosti na 4 jezika)
- `images/` fotografije (JPG), a u `images/w/` njihove manje WebP verzije za brže učitavanje
- `slike.py` izrađuje WebP verzije: nakon dodavanja ili zamjene fotografije pokrenite `python3 slike.py` (treba Pillow). Ako WebP verzija nema, stranica koristi izvorni JPG.
- `fonts/` i `css/fonts.css` fontovi (poslužuju se sa same stranice, bez Google Fonts)
- `css/style.css` izgled
- `build.js` pretvara sadržaj u gotovu stranicu (mapa `dist/`), po jedna stranica za svaki jezik
- `i18n.js` popis jezika i tekstovi sučelja
- `functions/index.js` automatski izbor jezika na početnoj adresi

## Postavljanje, korak po korak

### 1. GitHub
1. Na GitHubu napravite repozitorij `lana-premium-residence` (New repository, Create repository).
2. Add file, Upload files: povucite SADRŽAJ ove mape (ne samu mapu `lana-premium-residence`, nego `content`, `images`, `css`, `vendor`, `functions`, `build.js`, `README.md`, `.gitignore`) i kliknite Commit changes.

### 2. Cloudflare Pages
1. Otvorite račun na cloudflare.com, zatim Workers & Pages, Create, Pages, Connect to Git.
2. Odaberite repozitorij `lana-premium-residence`.
3. Postavke izgradnje:
   - Build command: `node build.js`
   - Build output directory: `dist`
4. Save and Deploy. Dobit ćete adresu oblika `lana-premium-residence.pages.dev`.

### 3. Zaštita e-mail adrese od botova (Cloudflare Turnstile)
E-mail adresa nije u kodu stranice. Prikazuje se tek nakon što Cloudflare Turnstile potvrdi da je posjetitelj osoba (funkcija `functions/api/contact.js`).
1. Cloudflare, Turnstile, Add widget: domena `lanapremiumresidence.com`. Javni Site key upisan je u `content/site.json` (`turnstile_sitekey`).
2. Cloudflare, projekt, Settings, Variables and Secrets, dodajte:
   - `TURNSTILE_SECRET_KEY` (tajni ključ widgeta, kao Secret),
   - `CONTACT_EMAIL` (adresa koja se prikazuje posjetiteljima).
3. Nakon dodavanja varijabli pokrenite novi deploy da stupe na snagu.

### 4. Vlastita domena
Cloudflare, projekt, Custom domains, Set up a domain. Nakon toga upišite novu adresu u `content/site.json`, polje `url`. Time se uključuju sitemap i canonical oznake za Google.

## Privatnost

- Stranica „Pravila privatnosti” nalazi se na `/privatnost/`, `/en/privacy/`, `/de/datenschutz/` i `/it/privacy/`, s poveznicom u podnožju.
- U `content/site.json` upišite polje `operator`: puno ime vlasnika ili naziv obrta/tvrtke i OIB. Dok je prazno, kao voditelj obrade navodi se naziv objekta, a izgradnja javlja upozorenje.
- Fontovi su na samoj stranici, Google karta se učitava tek na klik („Prikaži kartu”), Cloudflare Turnstile tek kad posjetitelj zatraži e-mail ili počne ispunjavati obrazac, a Google Analytics samo uz pristanak.

## Što još treba zamijeniti prije objave

- [ ] Voditelj obrade (`operator`) u `content/site.json`
- [ ] Recenzije gostiju, okvirne cijene i udaljenosti (plaža, trgovina, Poreč, zračna luka)
- [ ] Provjeriti tekstove: broj osoba, sadržaje, česta pitanja (pravila za ljubimce, doručak, vrijeme prijave i odjave)
- [ ] Poveznice na Instagram, Facebook i eventualno online rezervaciju
- [ ] Otvoriti Google Business Profile i dodati poveznicu na stranicu

## Lokalni pregled (po želji)

Treba Node.js. U mapi pokrenite `node build.js`, a zatim otvorite `dist/index.html` u pregledniku.
