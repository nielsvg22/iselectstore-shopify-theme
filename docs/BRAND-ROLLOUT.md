# Huisstijl op de volledige webshop — 16 oktober 2026

## Bron en uitvoering

De door de eigenaar aangeleverde **Stijlsheet iSlectStore.pdf** van Studio Lef en de zes bijbehorende SVG-USP-iconen zijn de bron van waarheid.

- Navy `#1f3049`, lichtblauw `#e4ecf4`, koraal `#f9858b`, lichtkoraal `#ffe6ed`, ivory `#f7f7f7`, antraciet `#25292d`.
- Het officiële horizontale logo staat in header, footer en wachtwoordpagina. De logo's zijn als originele vectorpaden uit de stijlsheet geïmporteerd, inclusief de bestaande slogan **selected by us. ready for you.** Geen nagetekend beeldmerk of losse tekst als vervanging van het woordlogo.
- Het officiële beeldmerk vervangt de eerdere rastervariant in de gedeelde snippet en wordt als standaardfavicon gebruikt. Een expliciet door de winkel ingestelde favicon blijft behouden.
- De zes aangeleverde USP-SVG's worden ongewijzigd gebruikt. Kleine kleurverschillen tussen de aangeleverde SVG-export en de paletcodes worden niet stilzwijgend hertekend of overschreven.
- De eigenaar heeft **Poppins als tijdelijke fallback voor Aeonic** expliciet bevestigd. Poppins 400/500/600/700/800 is lokaal opgenomen in Latin- en Latin Extended-subsets, met `font-display: swap` en de SIL Open Font License. De fonts laden via Shopify-CDN, zonder Google Fonts-aanvragen vanuit de browser.
- Aeonic kan later worden gekoppeld via **Thema-instellingen → Typografie → Aeonic webfont URL**. Alleen een werkelijk aangeleverd .woff/.woff2-font gebruiken; de PDF-fonts zijn niet als webfont geëxtraheerd.

## Reikwijdte

De gedeelde `brand-head` en `brand.css` verzorgen de hele storefront: homepage, collectie-/zoekpagina's, productpagina's, winkelwagen, contact-, informatie-, garantie- en verhaalpagina's en het nieuwe klantenportaal. De wachtwoordlayout bevat nu een volledige HTML-documentstructuur en dezelfde merkassets en lokale fonts; de Shopify-wachtwoordbeveiliging en het bestaande wachtwoordformulier zijn behouden.

De homepage-trustbalk en herkenbare USP's op verhaal-, authenticiteits-, inruil- en productpagina's gebruiken de officiële iconen. Bestaande titels, teksten en merchantinstellingen worden behouden. Labels worden semantisch herkend, zodat onbekende/custom blokken hun bestaande icoon behouden. Op productpagina's zijn alleen de vier USP-iconen vervangen; metafieldvoorwaarden voor batterij, conditie en garantie zijn behouden.

Belangrijkste knoppen hebben navy/wit contrast. Koraal blijft een accentkleur, met navy tekst waar koraal als knopachtergrond op een donkere hero wordt gebruikt. Headeracties zijn consistente lijniconen met ruime aanraakvlakken. Mobiele header is gecontroleerd vanaf 320px; de navigatie schakelt eerder naar de bestaande mobiele menuknop wanneer het grotere officiële logo dat nodig maakt.

Productdata, prijzen, filters, productvarianten, cart-/checkoutacties, contactverwerking en accountauthenticatie zijn niet aangepast. De Shopify-hosted checkout valt buiten thema-CSS en is niet gewijzigd. Er zijn geen wijzigingen in een Marktplaats-repository of Vercel-project gedaan.

## Bestanden en onderhoud

- `assets/brand.css`: gedeelde merkregels en responsive logo-/icoonweergave.
- `assets/brand-fonts.css`, `assets/brand-poppins-*.woff2`, `assets/brand-poppins-license.txt`: lokale Poppins-fonts en licentie.
- `assets/brand-logo-*.svg`, `assets/brand-mark-*.svg`, `assets/brand-usp-*.svg`: officiële merkassets.
- `snippets/brand-head.liquid`, `brand-logo.liquid`, `brand-usp.liquid`, `brand-usp-key.liquid`: gedeelde componenten.
- `layout/theme.liquid`, `layout/password.liquid`, `config/settings_schema.json`: centrale aansluiting en instellingen.
- Header/footer/wachtwoordheader, trustbalk, authenticiteit, product-USP's, verhaalblokken en inruilbanner sluiten op deze componenten aan.
- `scripts/import-brand-assets.py`: reproduceerbare import uit de aangeleverde bronmap. Alleen de begrensde logo-vectorpaden worden gepubliceerd; de stijlsheet of het opleverdocument zelf niet.
- `scripts/import-poppins.py`: import van officiële Google Fonts-bestanden, inclusief OFL-licentie.

## Controle

Vanuit `apps/customer-portal`:

```sh
npm run test:brand:browser
npm run test:native:browser
node scripts/storefront-browser.mjs
npm test
```

De brandingtest rendert echte Liquid-secties met uitsluitend lokale testfixtures, op 320, 390, 768, 1024 en 1440 pixels. Er worden negen paginatypen bekeken. Controles: geladen lokale Poppins-fonts, geladen originele vectorassets, alle zes USP's, geen horizontale overflow, geen overlap/afgesneden headeracties, mobiele navigatie, zoekoverlay, productvariant-ID en originele product-/cartformulieracties. Screenshots staan alleen in de genegeerde map `artifacts/brand-preview/`; testproductafbeeldingen en voorbeeldgegevens worden niet naar Shopify geüpload.

Beide portal-browserflows slagen daarnaast op mobiel en desktop. De 16 bestaande en aanvullende account-/protocol-/schematests slagen. Het zijn geen nieuwe echte productieorders of ingelogde klantacceptatietests.

Theme Check is uitgevoerd op een schone theme-only kopie: **10 bestaande fouten en 2 bestaande waarschuwingen**, tegenover 11 fouten en 5 waarschuwingen voor deze wijziging. Geen nieuwe bevindingen in merkcomponenten of de wachtwoordlayout. De overgebleven bevindingen betreffen bestaande afbeeldingafmetingen, `where_exp`/`push`-filters en ongebruikte pixelsnippets. Ze zijn niet onderdeel van deze huisstijlwijziging.

## Live back-up en publicatie

- Store: `ggh8q9-v1.myshopify.com`.
- Gepubliceerd thema: `210646630791`, `iselectstore-shopify-theme/main`.
- Nieuwe volledige Shopify-back-up: **Backup voor huisstijl 2026-10-16**, ID `211826016647`, ongepubliceerd.
- Lokale back-up: `artifacts/brand-before-20261016/` en `artifacts/live-before-brand-20261016.zip`.
- Vlak vóór publicatie zijn alle te wijzigen bestaande live bestanden opnieuw opgehaald en bytegelijk met deze back-up bevonden. Geen externe wijzigingen overschreven.
- Publicatie is gericht op de 40 gewijzigde/toegevoegde themabestanden met `--allow-live --nodelete --only`. Eerst nieuwe assets/snippets, daarna bestaande layouts en secties. Andere live bestanden en merchantcontent worden niet gepusht.

Het resultaat van de live readback en GitHub-synchronisatie staat in de afrondingsnotitie hieronder zodra die controle is voltooid.

## Bevestigd na publicatie

Alle 40 bestanden zijn teruggelezen uit het gepubliceerde thema en komen overeen met de lokale bron, inclusief de binaire WOFF2-fonts en vectorlogo's. De echte live wachtwoordpagina is in Chromium op mobiel geopend: HTTP 200, drie logo-instanties correct geladen, lokale Poppins daadwerkelijk geladen, één intact wachtwoordformulier en geen JavaScript-fouten. Screenshot: `artifacts/brand-preview/live-password-390.png`.

De winkel blijft wachtwoordbeschermd. De paginatests achter die afscherming zijn lokale componenttests met testfixtures; er is geen volledige live aankoop, betaaltest of privéklantacceptatie geclaimd.

## Git-overdracht

Implementatiecommit: `593349e`. Shopify synchroniseert gepubliceerde themabestanden naar de gekoppelde GitHub-branch; de eerste waargenomen brandingcommit is `0b8b5dd`. Die remote wijzigingen zijn zonder conflicten in de lokale branch gemerged. Een rechtstreekse push van de volledige broncode, tests en documentatie wordt nog steeds geweigerd met HTTP 403. Alle lokale commits blijven bewaard in de bijgewerkte `artifacts/iselectstore-customer-portal.bundle`. Dit blokkeert de reeds geverifieerde live themapublicatie niet.
