# Klantenportaal binnen de webshop

## Architectuur

`sections/storefront-portal.liquid` en `templates/page.mijn-account.json` plaatsen het klantenportaal in de bestaande Shopify-layout, inclusief de originele header en footer. `assets/account-portal.css` gebruikt de bestaande Poppins-typografie en themavariabelen. De gebundelde browserapp staat in `assets/storefront-portal.js`; broncode in `apps/customer-portal/storefront/`.

De primaire live integratie is volledig thema-native. `routes.storefront_login_url` gebruikt de moderne Shopify-login en keert terug naar de huidige storefrontpagina. De globaal beschikbare, ingelogde `customer` levert uitsluitend diens eigen bestellingen, naam, adressen en ordermetafields. Er is geen eigen authenticatie, klassieke accountlogin of backend-token nodig. Geen enkel Marktplaats-project is gewijzigd.

Het portaal is direct beschikbaar via de officiële alternatieve thematemplate op **`/search?view=mijn-account`**. Deze route gebruikt de bestaande Shopify-layout en verandert normale zoekpagina's niet. De header kiest een gepubliceerde pagina `mijn-account` zodra die bestaat; anders gebruikt hij deze werkende alternatieve template. De nette `/pages/mijn-account`-URL is dus een optionele contentconfiguratie, geen voorwaarde voor de thema-integratie.

`snippets/storefront-portal-native.liquid`, `snippets/storefront-portal-order.liquid` en `assets/storefront-portal-native.js` verzorgen deze primaire versie. Orders worden server-side per twintig gepagineerd, bestellingen zijn uitklapbaar, tracking gebruikt uitsluitend HTTPS en `order.customer_order_url` verwijst naar de moderne native bestelpagina. Naam, e-mail, telefoon en adressen worden hier getoond; wijzigingen gaan naar de officiële Shopify-profielpagina. Er is geen garantieclaim zonder vastgelegde ordermetafield. Contact gebruikt het bestaande native contactformulier of een echte e-mailactie.

De uitgebreidere browserapp in `apps/customer-portal/storefront/` is aanvullend voorbereid voor **Customer Account API met een publieke webclient**, OAuth Authorization Code + PKCE S256. Die optionele modus biedt inline naam- en adresmutaties en geconfigureerde favorieten. Hiervoor is een Headless/Hydrogen-client nodig; de bestaande extension-appclient is geen Customer Account API-webclient. Zolang geen openbare client-ID in de section staat, wordt de API-app niet geladen en blijft de echte Shopify-Liquid-integratie actief. Een aparte server of Vercel-project is niet nodig.

Officiële bronnen:

- https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started
- https://shopify.dev/docs/api/liquid/objects/customer
- https://shopify.dev/docs/api/liquid/objects/routes
- https://shopify.dev/docs/themes/architecture/templates/alternate-templates
- https://shopify.dev/docs/api/customer
- https://shopify.dev/docs/api/storefront#tokenless-access

## Aanvullende API-modus: gedrag en bescherming

- Dashboard, gepagineerde bestellingen, bestelregels, bedragen, betaal-/verzendstatus en tracking komen uit de Customer Account API, versie 2026-07.
- Bestellingen kunnen binnen het portaal worden uitgeklapt. De volledige Shopify-orderpagina en eventuele native retouropties blijven bereikbaar. Een servicebericht wordt niet als retourbevestiging gepresenteerd.
- Voornaam en achternaam kunnen via `customerUpdate` worden gewijzigd. Aanmaken, bewerken, verwijderen en standaard maken van adressen gebruiken de officiële Customer Account-mutaties. E-mail en accounttelefoon worden via het native Shopify-profiel beheerd: `CustomerUpdateInput` ondersteunt hiervoor geen velden.
- Garantie gebruikt uitsluitend bestaande `custom.portal_warranty`-snapshots per orderregel. Een ontbrekende snapshot levert een duidelijke leegtoestand op, geen berekende garantietermijn.
- Favorieten staan standaard uit. Na instelling van `custom.portal_wishlist` met Customer Account READ_WRITE worden productreferenties met `compareDigest` opgeslagen. Productinformatie en zoekopdrachten gebruiken de aparte publieke, tokenloze Storefront API. **Een customer access token wordt nooit naar die API gestuurd.** De live tokenloze catalogus weigert momenteel aanvragen met `Online Store channel is locked`; favorieten dus uit laten totdat catalogustoegang is gecontroleerd.
- Toegangstokens en refreshtokens bestaan alleen in geheugen. Er zijn geen klantgegevens of tokens in localStorage, sessionStorage, cookies of URL's. Alleen de tien minuten geldige PKCE-transactie (state, nonce, verifier, callback en client-ID) staat tijdelijk in sessionStorage en wordt eenmalig geconsumeerd.
- `oauth4webapi` controleert state, issuer, audience, nonce en ID-tokenhandtekening via de officiële JWKS. Callbackparameters worden meteen uit de adresbalk verwijderd.
- Uitloggen, verlopen toegang, pagehide, herstel vanuit browsercache en accountwissels in een andere tab wissen het geheugen en annuleren oude verzoeken. Late responses worden niet opnieuw aan de vorige klant gekoppeld.
- Na een volledige paginaherlading worden tokens niet hersteld uit browseropslag. De klant kan opnieuw via de bestaande Shopify-SSO-sessie inloggen.
- Ontbrekende API-configuratie laadt de browserapp niet. De native servergerenderde Shopify-integratie blijft actief; bezoekers zonder sessie zien de veilige Shopify-storefrontlogin. Er staan geen voorbeeldbestellingen in productie.

## Optionele API-configuratie en nette pagina-URL

1. Open Shopify Headless (of Hydrogen), selecteer/maak een storefront en open Customer Account API-instellingen. Kies een **publieke webclient**, geen confidential client.
2. Registreer voor de huidige primaire domeinnaam:
   - Callback: `https://ggh8q9-v1.myshopify.com/pages/mijn-account`
   - JavaScript-origin: `https://ggh8q9-v1.myshopify.com`
   - Logout: `https://ggh8q9-v1.myshopify.com/pages/mijn-account`
   - Registreer ook eventuele werkelijk gebruikte gelokaliseerde pagina-URLs als callbacks, omdat de section de huidige `request.path` gebruikt. Bij een toekomstige domeinwissel eerst de toegestane URLs aanpassen.
3. Maak een gepubliceerde pagina **Mijn iSelectStore**, handle `mijn-account`, met thematemplate **mijn-account**. Dit vereist paginabeheerrechten. Pagina-aanmaak via de Admin API was niet mogelijk doordat `write_online_store_pages` niet is toegekend. De extra aanvraag is inmiddels uit de appconfiguratie verwijderd en de minimale appversie is opnieuw vrijgegeven. De bestaande pagina's zijn niet overschreven; de alternatieve themaroute heeft deze scope niet nodig.
4. Stel in de theme-editor op deze pagina bij **Mijn iSelectStore portaal** de openbare Customer Account API-client-ID in. Geen appsecret, Admin-token of private Storefront-token invullen. De openbare ID mag ook in `templates/page.mijn-account.json` onder `sections.main.settings.customer_account_client_id` worden ingesteld.
5. Kies een echte servicepagina met `page.klantenservice` om het bestaande native Shopify-contactformulier te gebruiken. Zonder die configuratie gebruikt contact de echte `shop.email` via een e-mailactie. Een e-mailactie verstuurt niets zonder dat de klant zelf verzendt.
6. De header kiest automatisch de pagina `mijn-account` zodra die bestaat. Anders gaat de header naar `/search?view=mijn-account` binnen dezelfde webshop. Een bestaande expliciete account-URL in de headerinstellingen blijft gerespecteerd.
7. Controleer de ingestelde callback, logout en JavaScript-origins bij het activeren van de aanvullende API-modus. Voor de standaard Liquid-modus zijn geen nieuwe clientcredentials nodig.

De Headless-configuratiestappen zijn alleen benodigd voor de aanvullende inline API-modus. De primaire thema-integratie gebruikt de bestaande Shopify-login. De eigenaar heeft commits, pushes en livepublicatie al geautoriseerd. Zonder de officiële API-client en callbackregistratie wordt de aanvullende API-login niet geactiveerd.

## Testen

Vanuit `apps/customer-portal`:

```sh
npm ci
npm run build:storefront
npm run typecheck:storefront
npm test
npm run test:storefront:browser
npm run test:native:browser
```

Schema-validatie draait mee wanneer `CUSTOMER_SCHEMA` en `STOREFRONT_SCHEMA` naar officiële Shopify-introspectiebestanden wijzen. `scripts/storefront-browser.mjs` gebruikt Chromium via `/usr/bin/chromium` (override `CHROMIUM_PATH`). Optioneel: `BROWSER=webkit` met een geïnstalleerde Playwright-WebKit en bijbehorende systeembibliotheken.

De browsertest rendert de echte header, footer en portal-section met een **gesimuleerde**, RSA-ondertekende OAuth-server en testklanten. Deze data wordt uitsluitend in het testscript geïmporteerd. Er worden op 390px en 1440px gecontroleerd: PKCE-callback, verwijderen van callbackcode, lege browseropslag, orders/tracking, ontbrekende garantie, naamwijziging, adresaanmaak, verlopen sessie, ongeldige callback, leeg tweede account, cross-tab accountwissel, geen JavaScript-fouten en geen horizontale overflow. Dit is geen ingelogde live Shopify-acceptatietest.

Na het instellen van de echte client moet op de echte winkel worden getest: OTP-login, terugkeer naar de webshop, eigen orders, uitloggen, klantwissel, adressen, serviceverwerking en native retouropties. De storefront-wachtwoordbescherming wordt niet opgeheven door deze implementatie.

Ontwerpvoorbeelden met duidelijk herkenbare testdata worden alleen opgeslagen in de genegeerde map `artifacts/storefront-*.png`.

## Primaire native integratie: controles

`npm run test:native:browser` rendert de echte portal-section, header, footer en snippets op 390px en 1440px. De gesimuleerde server controleert de terugkeer naar dezelfde route via Shopify-login, eigen orders en tracking, garantie-leegtoestand, officiële profiellinks, uitloggen, een leeg tweede account, negeren van customer_id-URL-invoer, HTML-escaping, lege browseropslag en geen overflow/JavaScript-fouten. Shopify's serverpaginering wordt via de officiële `paginate customer.orders by 20` uitgevoerd; de lokale renderer simuleert een pagina. Dit is geen voltooide ingelogde live acceptatietest.

De native versie slaat geen klantdata of tokens in browseropslag op. `pagehide` verwijdert de persoonlijke DOM; bij terugkeer vanuit BFCache wordt opnieuw server-side geladen. Een logoutsignaal uit een andere tab verbergt de gegevens zonder een race met de nog lopende serverlogout te veroorzaken. Zonder JavaScript blijven alle secties en de echte links bruikbaar.
