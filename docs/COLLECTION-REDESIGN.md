# Desktopcollecties en inruilbanner — 16 oktober 2026

## Uitvoering

De referentie https://mobico.nl/acties/beste-deals/ is bekeken: filters links, productraster rechts, consistente productfoto's en een commerciële onderbreking na de eerste rij. iSelectStore behoudt eigen Poppins-typografie, navy/ivory/lichtkoraal en koraalkleurige knoppen met witte tekst. Geen gekopieerde Mobico-afbeeldingen of stijlen.

- Alleen de collectiepagina krijgt de nieuwe desktopindeling: zijbalk van 220 px en een productraster met 2 kolommen vanaf 901 px, 3 vanaf 1100 px en 4 vanaf 1440 px. De maximale paginabreedte is 1480 px.
- Het bestaande mobiele tweekolomsraster en de bestaande productkaartinhoud blijven behouden. Nieuwe voorraadinformatie en specificatiechips zijn alleen op desktop zichtbaar. De nieuwe banner is bewust niet zichtbaar op mobiel/tablet tot en met 900 px.
- De gedeelde productkaart krijgt extra inhoud uitsluitend met `collection_card: true`: opslag uit `custom.storage_gb` of een opslagoptie, kleuren uit productopties en echte Shopify-beschikbaarheid. Geen technische gegevens, garantie of korting verzonnen. Afbeeldingen gebruiken `contain`, gereserveerde ruimte en Shopify-responsieve URL's. Eerste vier kaartafbeeldingen laden eager, de rest lazy.
- Iedere Shopify-productvermelding blijft zelfstandig. Geen samenvoeging van modellen. Collectieproducten, telling, paginering en volgorde komen rechtstreeks uit Shopify. De oude, niet-ondersteunde `where_exp`-uitsluiting en hergroepering op beschikbaarheid zijn verwijderd: ze ondermijnden aantallen en de gekozen sortering. Eventuele uitsluiting van accessoires hoort in de collectieregels van Shopify thuis.
- Native GET-filterformulier met inklapbare filtergroepen, actieve chips, wissen, disabled opties zonder resultaten en behoud van sortering. De sorteervorm behoudt alle actieve filters en minimum/maximumprijzen. Prijsbedragen gaan als valuta-eenheden naar Shopify, niet als centen. Shopify-paginering behoudt de actieve parameters. Geen extern productbestand, app, Ajax-laag of eigen filterdatabase.
- De zoekbalk verwijst nu naar de echte Shopify-productzoekroute; `q` op een gewone collectie was geen werkende productzoekfunctie.
- Filterdrawer ondersteunt focus, Escape, focusbegrenzing en inert bij sluiten. Zonder JavaScript blijven de filter- en sorteerformulieren bruikbaar.

## Inruilbanner

Herbruikbaar component: `snippets/collection-trade-in.liquid`.

**Theme Editor → Collecties → Standaardcollectie → Collectie → Inruilbanner na eerste productrij** bevat aan/uit, titel, beschrijving, afbeelding, knoptekst en bestemmings-URL. Nieuwe instellingen zijn aan de bestaande sectie toegevoegd; merchantinstellingen worden niet overschreven.

Bij een lege bestemming wordt een bestaande pagina met handle `inruilen` of `inruil` gebruikt, indien aanwezig. Anders opent een echte button de al bestaande `.js-tradein-trigger`-inruilmodule. Er is geen nieuwe inruilroute of waardeberekening gebouwd. Zonder JavaScript wordt een bestaande contactpagina aangeboden als alternatief.

De standaardafbeelding is het eerder gepubliceerde `category-iphone.webp`. CSS reserveert onmiddellijk rij 2 over alle productkolommen: de banner veroorzaakt geen late verspringing. Een kleine ResizeObserver verplaatst dezelfde ene DOM-node na de eerste volledige rij, zodat tabvolgorde en beeldvolgorde ook bij veranderen van schermbreedte overeenkomen. Geen duplicaten. Bij minder producten dan een volledige rij wordt de banner verborgen. De banner telt niet mee voor producttelling, paginering of ItemList-SEO.

## Bestanden

- Gewijzigd: `sections/main-collection.liquid`, `snippets/product-card.liquid`.
- Nieuw: `assets/collection.css`, `assets/collection.js`, `snippets/collection-filter-values.liquid`, `snippets/collection-trade-in.liquid`.
- Test/onderhoud: `apps/customer-portal/scripts/collection-browser.mjs`, npm-script `test:collection:browser` en dit document.

Homepage, productdetailpagina, cart, checkout, productgegevens en Marktplaats zijn niet aangepast. De gedeelde productkaart behoudt buiten collecties zijn inhoud; alleen de ontbrekende afbeeldingshoogte is daar toegevoegd.

## Testen

Vanuit `apps/customer-portal`:

```sh
npm run test:collection:browser
npm run test:brand:browser
```

De collectieproef gebruikt de echte Liquid-componenten, CSS en JS met uitsluitend lokale testproducten. Een lokale route simuleert Shopify-GET-responses. Getest: 1920, 1440, 1280, 1024, 768 en 390 px; resize/DOM-volgorde; banner na 4/3/2 producten; één banner; verborgen mobiele banner; productafbeeldingen en lange namen; verschillende unieke productlinks/prijzen; uitverkochte producten; geen onterechte vergelijkingsprijs; prijsconversie; selectie en behoud filters bij sorteren; actieve filters; tweede pagina en SEO-posities; 0–4 producten; ontbrekende filters; banner uit; eigen bestemmingslink; de bestaande inruilmodule openen/sluiten; mobiel filter openen/sluiten met Escape en focusherstel; formulieren zonder JS; geen pagina-overflow en geen JS-fouten.

De brandingregressietest controleert daarnaast negen bestaande paginatypen op 320/390/768/1024/1440 px, navigatie, header, originele merkassets en product-/cartformulieren.

Theme Check op een geïsoleerde theme-only kopie: vóór **10 fouten/2 waarschuwingen**, na **8 fouten/2 waarschuwingen**. Geen bevindingen in de aangepaste collectie-/kaartbestanden of nieuwe snippets. De resterende bestaande fouten staan in andere secties/layout (ontbrekende afbeeldingsafmetingen, `where_exp`, `push`); ze zijn niet uitgebreid naar deze opdracht.

Screenshots en ruwe resultaten staan in de genegeerde map `artifacts/collection-preview/` en `artifacts/collection-theme-check*.json`.

## Herstel en publicatie

- Store: `ggh8q9-v1.myshopify.com`; bevestigd live thema: `210646630791`.
- Volledige actuele back-up op Shopify: **Backup voor desktopcollectie 2026-10-16**, ID `211829752199`, ongepubliceerd.
- Lokale volledige back-up: `artifacts/collection-live-backup-20261016/`. Gerichte eerste snapshot: `artifacts/collection-before/`.
- Alleen de zes themabestanden worden gericht gepusht, eerst de nieuwe assets/snippets en daarna de bestaande kaart en sectie. Bestaande live bronbestanden worden direct vooraf opnieuw vergeleken.
- Herstel van deze wijziging: de twee bestaande bronbestanden terugzetten uit de volledige back-up. De vier nieuwe ongebruikte bestanden kunnen blijven staan. Geen publicatie van de hele oude back-up nodig.

De winkel is wachtwoordbeschermd. De officiële Liquid-console vraagt het storefrontwachtwoord; dat is niet beschikbaar. Daarom zijn de product-/filter-interacties componenttests met fixtures, geen echte ingelogde productiecatalogus- of aankoopacceptatie. Publicatie en bestandsinhoud worden wel via de geauthenticeerde Theme API gecontroleerd. De storefrontbeveiliging blijft behouden.

Controleer als eigenaar de collectie in je bestaande ingelogde browser: filters combineren, sortering wijzigen, volgende pagina openen, schermbreedte wijzigen en inruilknop openen. Alleen filters die Shopify daadwerkelijk aanlevert verschijnen. Ontbreken gewenste opslag-/kleur-/conditiefilters, activeer deze via de gratis Shopify Search & Discovery-configuratie met de juiste productmetafields; het thema verzint geen filteropties.

Officiële documentatie: https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering/support-storefront-filtering

GitHub: de Shopify-koppeling synchroniseert live themabestanden naar `main`. Rechtstreeks pushen van de volledige broncode kan nog HTTP 403 opleveren; lokale commits en een Git-bundle bewaren ook tests/documentatie. De definitieve publicatie-/synchronisatiecontrole wordt in de afronding vermeld.

## Bevestigd na publicatie

Implementatiecommit: `77cf935`. De zes themabestanden zijn live gepubliceerd, via de Theme API teruggelezen en bytegelijk met de geteste bron bevonden. Ze zijn eveneens alle zes in `origin/main` teruggevonden via Shopify-sync (waargenomen commit `1519f79`). De echte live wachtwoordpagina geeft HTTP 200 zonder JavaScript-fouten; de nieuwe collectie-CSS en JavaScript zijn via de Shopify-CDN opgehaald (HTTP 200, nieuwe functionaliteit aanwezig). Shopify minificeert CSS op de CDN; de onveranderde bron is afzonderlijk via de Theme API gecontroleerd. De echte catalogus achter het wachtwoord is niet als browseracceptatietest geclaimd.

Aanvullend is de huidige paginapositie toegankelijk gemarkeerd met `aria-current` en getest op pagina 2. Rechtstreeks pushen van tests/documentatie is opnieuw met HTTP 403 geweigerd; deze bestanden staan in lokale commits en de Git-bundle, niet automatisch in de GitHub-themakoppeling.

## Compactere desktopweergave

Na feedback over de grote presentatie is uitsluitend desktop-CSS compacter gemaakt: lager titelblok (28–34 px titel), kleiner boven-/tussenruimte, een 220 px filterkolom, maximaal 1480 px inhoud, fotovlakken van 200 px hoog met contain en producttitels op maximaal twee zichtbare regels. Productnamen blijven volledig in de linktekst voor hulptechnologie. Kaarten, voorraad en acties blijven zichtbaar en uitgelijnd. Vier kolommen vanaf 1440 px; drie vanaf 1100 px. De inruilbanner is eveneens lager. Mobiele regels zijn behouden.

De volledige collectie-browsertest slaagt opnieuw op 1920/1536/1440/1280/1024/768/390 px, inclusief maxima voor kaart-/titelblokhoogte, eerste rij en banner, filtering/sortering/paginering, lege collecties, zonder JavaScript en nul JS-fouten. Back-up van de voorgaande live CSS: `artifacts/collection-compact-before/assets/collection.css`.
