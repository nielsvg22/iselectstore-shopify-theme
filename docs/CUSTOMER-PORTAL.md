# iSelectStore klantenportaal

## Oplevering en status

GitHub- en live deployment zijn door de opdrachtgever expliciet geautoriseerd. Vóór de GitHub-oplevering is `main` gecontroleerd en met `git pull --ff-only origin main` gesynchroniseerd; de remote had geen aanvullende commits. Shopify-deployment blijft geblokkeerd totdat de exacte `.myshopify.com`-store en geautoriseerde CLI-/app-toegang beschikbaar zijn. De beheerde omgeving meldt geen gekoppelde Shopify-credentials. `shopify theme list --json` stopt met **A store is required**. De openbare domeinen `iselectstore.nl` en `www.iselectstore.nl` gaven bij deze controle vanuit de uitvoeromgeving HTTP 503; hiermee is de toestand van de winkel niet vastgesteld. Er is geen live thema geïdentificeerd, geen live back-up gemaakt en niets naar Shopify gepubliceerd. Publiceer pas na identificatie, back-up en de live acceptatiecontroles hieronder.

De implementatie is lokaal gecommit als `69aeffa` (`feat: add secure Dutch Shopify customer portal and service pages`). Publicatie naar GitHub is eveneens geblokkeerd: `git push origin main` geeft HTTP 403 (permission denied), en de gekoppelde GitHub-app weigert het aanmaken van de bijbehorende Git-tree met HTTP 403 **Resource not accessible by integration**. De remote branch is niet gewijzigd. Herstel schrijfrecht (`Contents: read and write`) voor de repositorykoppeling of de Git-credential voordat de commits opnieuw worden gepusht. Een lokale Git-bundle in `artifacts/iselectstore-customer-portal.bundle` bewaart de oplevercommits voor overdracht; deze bevat geen node_modules, secrets of lokale appconfiguratie.

Dit project bevat een moderne Shopify Customer Account full-page extension, een optionele account-ingang in het thema en een servicepagina met een Shopify-contactformulier. Er is geen eigen authenticatieserver. **De app is nog niet gekoppeld, geïnstalleerd of gepubliceerd op een winkel.** De winkelinstellingen en echte klantaccounts konden zonder Shopify-toegang niet worden onderzocht of getest.

De accountknoppen in de bestaande desktop- en mobiele header verwijzen standaard naar `routes.account_url`, niet meer naar het Marktplaats-portaal. Na installatie kan de beheerder de full-page URL invullen in de headerinstelling **Klantenportaal URL**. Deze wijziging raakt uitsluitend het Shopify-thema.

## Onderzoek van de bron

- Repository: `nielsvg22/iselectstore-shopify-theme`, basiscommit `9ee52e388f5df7d0ff26181f52dce122d66dc42d` op `main`. De echte checkout was schoon vóór implementatie. Aanvankelijk ontbrak een checkout; na herstel van gerichte netwerktoegang is de volledige repository gekloond. Er zijn geen oorspronkelijke lokale wijzigingen aangetroffen.
- Online Store 2.0: `layout/`, JSON-templates in `templates/`, Liquid-secties in `sections/`, gedeelde snippets in `snippets/`. Geen bestaand Node-buildproces of Shopify-app. `product-import/` bevat productimportgegevens; deze blijven ongemoeid.
- `layout/theme.liquid` laadt Poppins 400–800, `theme.css`, `animations.css` en uitgestelde `theme.js`. Header is sticky met desktoplinks en een mobiel burgermenu. Footer bevat winkelinformatie, contact, beleid en een Shopify-nieuwsbriefformulier.
- Huisstijlbron: `assets/theme.css`, `config/settings_schema.json`, `layout/theme.liquid`. Navy `#1f3049`, coral `#f9858b`, ivory `#f7f7f7`; bestaande tokens `--navy`, `--coral`, `--line`, `--muted`, `--ivory`, `--lightpink`, `--ease`. Typografie Poppins, afgeronde kaarten 18–32px, pillvormige knoppen, dunne borders en ingetogen schaduw. Nieuwe thema-CSS is tot `.portal` beperkt en gebruikt deze tokens.
- Geen `templates/customers/*`, accountbackend of account-extension aanwezig. Accountlinks stonden hardcoded naar een afzonderlijke Marktplaats-app. De werkelijk ingestelde accountversie kan alleen via de winkelbeheerder worden vastgesteld.
- Bestaande hartjes in `fresh-stock.liquid` en `theme.js` gebruiken alleen apparaatgebonden `localStorage` (`freshStockLikes`). Die bestaande werking is behouden. Ze worden bewust niet als accountfavorieten gepresenteerd of automatisch naar een ander account gekopieerd.
- Garantie bestaat als huidig productmetafield `custom.warranty_months`. Dat veld kan na de aankoop veranderen en is daarom geen betrouwbare historische garantiebewijslast.

## Architectuur en ontwerp

Gekozen: een **extension-only app** in `apps/customer-portal`, met `customer-account.page.render`, Preact en officiële Polaris-webcomponenten, vastgezet op extension/API-versie `2026-07` (ondersteunde versie tijdens implementatie). De full-page extension gebruikt de Shopify Customer Account API via het automatisch geauthenticeerde `shopify://customer-account/api/2026-07/graphql.json`. Favorietproducten komen via de ingebouwde `query()` naar de Storefront API.

Een Liquid-template kan de moderne Shopify-accountpagina's niet vervangen. Een headless Customer Account API-app zou voor vrije CSS extra hosting, OAuth/PKCE, sessiebeheer en onderhoud vereisen. Voor dit project biedt de officiële extension de veiligste integratie met de bestaande Shopify-profiel- en retourstromen. Een Shopify-hosted extension-only app vereist geen eigen backend of opgeslagen toegangstokens.

Shopify beheert de buitenste header, het accountmenu, inloggen/uitloggen en branding. De extension kan geen vrije HTML/CSS of de Liquid-header injecteren. De thema-ingang is volledig in de bestaande huisstijl; binnen accounts worden kleuren, lettertype, knoppen en componentvormen via de account/checkout-brandingeditor ingesteld. Vrije animaties en een exact gekopieerde storefront-header zijn daar niet beschikbaar. De native componenten verzorgen interacties en toegankelijkheid.

Mobiel: één compacte selectienavigatie boven de content, één kolom en leesbare bestelkaarten. Desktop: zijbalk met navigatie naast de content. Containerqueries bepalen de indeling. Onderdelen: overzicht, bestellingen, producten & garantie, gegevens, service & retouren, optioneel favorieten. Leeg-, laad- en fouttoestanden zijn uitgewerkt. Alle nieuwe klantteksten zijn Nederlands.

## Wat de implementatie doet

| Onderdeel | Implementatie | Voorwaarde voor live gebruik |
| --- | --- | --- |
| Inloggen en uitloggen | Officiële Shopify Customer Accounts; geen eigen wachtwoordvelden | Moderne Customer Accounts activeren; uitloggen via Shopify-accountmenu |
| Dashboard | Begroeting, laatste bestelling, snelkoppelingen | App installeren, klantgegevensrechten toestaan |
| Bestellingen | Tien per verzoek, cursorpaginering; nummer, datum, artikelen, varianten, besteltotaal, betaal- en verzendstatus, terugbetaald bedrag | Bestellingen van het ingelogde Shopify-account |
| Besteldetails | Echte `statusPageUrl` uit Shopify | Shopify-account en bestaande bestelling |
| Tracking | HTTPS-trackinglinks uit succesvolle fulfillments | Trackinginformatie bij de Shopify-zending ingevuld |
| Producten | Artikelen uit bestelregels, ook bij verdwenen winkelproducten | Orderhistorie beschikbaar |
| Garantie | Alleen leesbaar, ordergebonden snapshotmetafield per bestelregel | `custom.portal_warranty` definiëren en met echte afspraken vullen |
| Gegevens en adressen | Tonen van beschikbare gegevens en standaardadres; wijzigen via officieel Shopify-profiel | Shopify bepaalt welke velden een klant kan wijzigen |
| Retouren | Verwijzing naar officiële bestelling/retourstroom | Self-serve returns en retourregels activeren; Shopify bepaalt geschiktheid |
| Service | Echt `{% form 'contact' %}` met onderwerp, bestelnummer, product en bericht; succes/fouten via Shopify | Pagina aanmaken, support-URL koppelen, e-mailontvangst testen |
| Favorieten | Per klant opgeslagen productreferenties, zoeken/toevoegen/verwijderen; compare-and-set voorkomt stil overschrijven | Metafieldrechten, app-scopes en instelling activeren |

Er zijn geen voorbeeldbestellingen in productie. Testgegevens staan uitsluitend in `tests/fixtures`. Het getoonde besteltotaal is geen berekening van reeds geïncasseerde deelbetalingen. Shopify's betaalstatus en terugbetaalde bedrag worden apart getoond. Een fulfillmentstatus 'Verzonden' betekent niet automatisch 'Bezorgd'.

Bestelregels zijn begrensd op 50 en fulfillments op 10 per bestelling om de pagina licht te houden. Bij meer gegevens verschijnt een expliciete verwijzing naar de volledige Shopify-bestelling. Historie buiten de eerste tien bestellingen is via **Meer bestellingen laden** bereikbaar. Garantie wordt afzonderlijk opgehaald zodat een ontbrekend metafieldrecht het besteloverzicht niet blokkeert.

## Activeren in Shopify

### 1. Thema eerst als ongepubliceerde kopie testen

Installeer Shopify CLI en voer vanuit de themaroot uit:

```sh
shopify theme dev --store JOUW-WINKEL.myshopify.com
shopify theme check
shopify theme push --unpublished --store JOUW-WINKEL.myshopify.com
```

Gebruik bij upload via ZIP uitsluitend de themamappen (`assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates`). Voeg `apps/`, `docs/`, `artifacts/` en `node_modules/` niet toe. `.shopifyignore` sluit ontwikkelbestanden uit bij CLI-gebruik.

Maak onder **Online winkel → Pagina's** twee pagina's:

- `mijn-iselectstore`, met template **page.account**: optionele publieke account-ingang. De header kan rechtstreeks naar de extension; de ingang is geen verplichte extra tussenstap.
- `klantenservice`, met template **page.klantenservice**: werkend Shopify-serviceformulier. Een nieuwe template verschijnt in de admin mogelijk pas nadat deze in een thema is geüpload/gepubliceerd; test dit eerst op een development store.

De bestaande contactpagina blijft behouden. Maak geen nieuwe garantievoorwaarden: koppel de bestaande `garantie`- en `faq`-pagina's als ze bestaan.

### 2. Moderne accounts en app

1. Activeer onder **Instellingen → Klantaccounts** de moderne **Customer Accounts**, niet legacy accounts. Gebruik Shopify's veilige inlogflow.
2. Maak in het Shopify Dev Dashboard een app met **custom distribution** voor deze winkel. Een extension-only app is niet een via de theme-editor te installeren sectie.
3. Vanuit `apps/customer-portal`: `npm ci`. Gebruik de meegeleverde lockfile.
4. Maak met `shopify app init` zo nodig eerst een extension-only appregistratie. Koppel deze bestaande appmap met `shopify app config link` en controleer de gegenereerde `shopify.app.toml`. Gebruik `shopify.app.toml.example` als referentie; de placeholder is geen geldige appregistratie. Er staat lokaal een genegeerde voorbeeldconfig voor de buildcontrole; vervang die via config link vóór dev/deploy.
5. Houd de door Shopify gegenereerde client-ID, app-URL en eventuele extension-UID aan. Er zijn geen app-secrets nodig in de extension. Gebruik scopes `customer_read_customers`, `customer_read_orders`, `customer_write_customers`; vraag de voor deze app benodigde protected-customer-data toegang aan, inclusief naam, e-mail, telefoon en adres waar vereist. Scopes in een bestand alleen verlenen geen toestemming.
6. Start `npm run dev`, kies de development store en controleer de preview. Shopify CLI kan een extension-UID toevoegen; bewaar de toegewezen UID zodat latere releases dezelfde extension bijwerken.
7. Na acceptatie: `npm run deploy`, app installeren en de uitgebrachte versie activeren. Dit is in deze opdracht niet uitgevoerd.
8. Voeg **Mijn iSelectStore** toe in de checkout/account-editor en accountnavigatie. Kopieer de door Shopify gegenereerde directe full-page URL; verzin geen extension-ID/URL.

### 3. Extension-instellingen en branding

Vul in de account-editor de extensioninstellingen in:

- **URL van de webshop**: volledige HTTPS-URL van de eigen winkel.
- **URL van de servicepagina**: volledige HTTPS-URL van `/pages/klantenservice` op de eigen winkel.
- **URL veelgestelde vragen** en **URL garantievoorwaarden**: bestaande pagina's, indien beschikbaar.
- **Favorieten inschakelen**: pas na onderstaande metafieldconfiguratie en schrijftest.

Ontbrekende optionele URL's worden niet als werkende knoppen getoond. Gebruik alleen eigen servicepagina's; ordernummer/product worden als URL-hints meegestuurd. Tokens, e-mailadressen en interne klant-ID's worden niet naar de servicepagina gestuurd.

Stel de account-branding in op de **daadwerkelijk ingestelde** themawaarden: navy/coral/ivory uit de thema-editor, Poppins waar Shopify dat ondersteunt, rustig lichte ondergronden, afgeronde kaarten en knoppen. Het thema kan aangepaste kleuren bevatten; de defaults in deze handleiding zijn geen reden om die te overschrijven. Kies voor knoptekst een voldoende contrasterende kleur; navy met wit is gebruikt voor de nieuwe primaire themaknoppen.

Vul na een geslaagde accountpreview in **Thema-editor → Header → Klantenportaal URL** de gekopieerde directe URL in. Stel dezelfde URL in de optionele account-ingang in. Zonder configuratie blijven deze knoppen de officiële account-route gebruiken. De standaard account-root wordt niet automatisch door deze extension vervangen.

### 4. Retouren en contactverwerking

Activeer Shopify **self-serve returns** en configureer retourregels volgens het bestaande winkelbeleid. Open een echte testbestelling en controleer of Shopify voor een geschikt artikel de aanvraagknop toont. Het portaal belooft geen retourgeschiktheid en maakt geen zelfstandige RMA aan.

Het serviceformulier gebruikt Shopify's contactverwerking en botbescherming. Verstuur een testbericht, controleer succes/foutweergave én de ontvangst op de door Shopify ingestelde contact-/afzenderadressen. De ingestelde `shop.email` wordt als directe mailmogelijkheid getoond. Een servicebericht over een retour is geen bevestigde retouraanvraag.

## Metafields

Maak definities in **Instellingen → Aangepaste gegevens** of via een geautoriseerde Admin GraphQL-client. Gebruik geen Admin API-token in browsercode. Bij bestaande definities: inspecteer en wijzig de definitie, maak geen duplicaat.

| Eigenaar | Namespace/key | Type | Customer Account API-toegang | Storefront-toegang |
| --- | --- | --- | --- | --- |
| Order | `custom.portal_warranty` | `json` | `READ` | Niet openbaar |
| Customer | `custom.portal_wishlist` | `list.product_reference` | `READ_WRITE` | Niet openbaar |

Voorbeeld voor een geautoriseerde beheerder (niet vanuit de extension uitvoeren):

```graphql
mutation CreatePortalDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition { id namespace key }
    userErrors { field message code }
  }
}
```

Variabelen voor garantie:

```json
{
  "definition": {
    "name": "Garantiegegevens bij aankoop",
    "namespace": "custom", "key": "portal_warranty",
    "ownerType": "ORDER", "type": "json",
    "access": {"customerAccount": "READ"}
  }
}
```

Voor favorieten: `ownerType: "CUSTOMER"`, `type: "list.product_reference"`, `key: "portal_wishlist"`, naam `Accountfavorieten`, `access.customerAccount: "READ_WRITE"`. Beperk een lijst desgewenst ook op definitieniveau tot 100 referenties. Controleer `userErrors` en effectieve rechten na iedere beheerwijziging.

Garantie-snapshotcontract (illustratie van het formaat, **geen echte garantieafspraak**):

```json
{
  "version": 1,
  "items": [
    {
      "lineItemId": "gid://shopify/LineItem/DE_ECHTE_BESTELREGEL_ID",
      "description": "De werkelijk overeengekomen garantieomschrijving bij deze aankoop",
      "expiresOn": "YYYY-MM-DD"
    }
  ]
}
```

Laat `expiresOn` weg als geen einddatum is vastgelegd. De UI koppelt uitsluitend op de bestelregel-ID en toont geen datum of termijn vanuit het actuele productmetafield. Ontbrekende/ongeldige data krijgt een neutrale melding met contactmogelijkheid, geen verzonnen periode. Een snapshot is informatie over de aankoop, geen automatische beslissing over wettelijke rechten of een garantieclaim.

Snapshots moeten met echte afspraken worden gevuld door de beheerder of een afzonderlijk te activeren workflow. **Er is geen automatische snapshot-writer gebouwd of aangesloten.** Een toekomstige writer kan Shopify Flow of een kleine backend gebruiken: controleer bij webhooks Shopify HMAC, lees de gezaghebbende bestelling server-side, schrijf idempotent per bestelregel, leg de afspraak op het moment van aankoop vast, hanteer Admin-scopes met minimale toegang en behandel annuleringen, retouren en correcties expliciet. Lees historische garanties nooit achteraf af uit inmiddels gewijzigde productvelden. Klanten krijgen geen schrijfrecht op garantiedata.

## Veiligheid en privacy

- Alle private data komt uit automatisch geauthenticeerde Shopify-aanroepen. Geen klant-ID uit URL, e-mail of browseropslag als autorisatiebron.
- De gemelde Shopify-klantidentiteit is de sleutel van de hele privécomponent. Een accountwissel verwijdert de oude state en breekt leesverzoeken af. De response-klant-ID moet ook overeenkomen met de actuele identiteit.
- Geen orders, garantiedata, e-mailadressen of tokens in localStorage, extension storage, analytics of consolelogs. Alleen in-memory state per actieve component.
- GraphQL-fouten/401/403 worden niet als gedeeltelijk geldige gegevens getoond. Na een access-fout wordt de oude bestellijst verwijderd.
- Favorieten schrijven uitsluitend naar het klant-ID uit de geauthenticeerde response. `compareDigest` voorkomt het blind overschrijven van wijzigingen uit een andere tab; bij onduidelijke uitkomst eerst opnieuw lezen.
- De servicepagina behandelt URL-parameters alleen als invulhulp. De winkelmedewerker moet de identiteit/het eigendom van een bestelling controleren vóór wijzigingen of het delen van privégegevens. De openbare servicepagina geeft zelf geen orderdata vrij.
- Inhoud wordt als tekst gerenderd; tracking- en ingestelde externe links moeten HTTPS zijn zonder ingesloten credentials. Native Shopify-componenten verzorgen schermlezerondersteuning en toetsenbordbediening; live controle blijft nodig.

## Lokale controles

```sh
cd apps/customer-portal
npm ci
npm run typecheck
npm test
npm run bundle
npm run test:browser
npm run build
```

Voor `build` is een `shopify.app.toml` nodig. Voor een uitsluitend lokale bundelcontrole kan de voorbeeldconfig gekopieerd worden; de placeholderconfig mag nooit worden gedeployd. De officiële CLI-build slaagde met deze voorbeeldconfig. `dev` en `deploy` vereisen de echte appregistratie en winkeltoegang. De browsercheck gebruikt standaard `/usr/bin/chromium`; stel `CHROMIUM_PATH` in voor een andere lokale installatie.

De browsercheck rendert de echte nieuwe Liquid-secties via LiquidJS en maakt screenshots in `artifacts/`. Het formulier wordt lokaal niet naar Shopify verzonden. De extensiontest gebruikt de echte gebundelde componentlogica met **gesimuleerde Shopify-host/API**, uitsluitend testdata. Dit bewijst navigatie- en state-afhandeling, niet dat Shopify-authenticatie, componentweergave of metafieldrechten live werken. Geen Safari-browser beschikbaar: test daarnaast op een echte iPhone.

De schema-validator accepteert een officieel introspectiebestand:

```sh
node scripts/validate-schema.mjs /pad/naar/customer-account.schema.json
```

Tijdens implementatie zijn alle vier Customer Account-operaties gevalideerd tegen Shopify's Hydrogen-schema. De gebruikte velden zijn ook in de `2026-07` API-documentatie nagekeken. Er is geen schema van de echte winkel opgevraagd.

### Uitgevoerde controles (15 oktober 2026)

- TypeScript strict: geslaagd; officiële `@shopify/ui-extensions`-componenttypes, geen zelfgemaakte permissieve JSX-declaraties.
- Officiële `shopify app build`: geslaagd met lokale voorbeeldconfig; circa 45 KB bronbundel / 16 KB gecomprimeerd. Dit is een buildcontrole zonder appinstallatie.
- Zeven gerichte Node-tests: geslaagd (API-fouten/partial responses, requestannulering, HTTPS-tracking, warranty-snapshot, ongeldige datums, favorietvalidatie/CAS en zoekinvoer).
- Vier Customer Account- en twee Storefront GraphQL-operaties: schema-validatie geslaagd tegen officiële Shopify Hydrogen-schema's.
- Chromium: nieuwe themasecties op 320/390/768/1440px gecontroleerd, geen overflow binnen de portaalcontent. Screenshots: `artifacts/preview-*.png` en `artifacts/support-*.png`. De previews gebruiken een lokale Liquid-renderer en eventueel een fallbackfont.
- Gesimuleerde extensionhost: routes, tracking, ontbrekende garantie, lege favorieten, lege klant, serverfout, accountwissel, vertraagde oude response en uitgelogde staat geslaagd; geen JavaScript-pageerrors.
- Shopify Theme Check: **11 bestaande fouten en 5 bestaande waarschuwingen**, exact gelijk aan de ongewijzigde broncheckout. Geen meldingen voor de nieuwe secties/snippets/assets of de headerwijziging. Bestaande meldingen betreffen afbeeldingsafmetingen, `push`/`where_exp`-filters, externe fontassets en ongebruikte pixelsnippets. Deze zijn buiten de opdracht gelaten.
- `git diff --check` en JavaScript-syntaxcontrole: geslaagd. Alleen accountgerelateerde bestanden en documentatie gewijzigd; Shopify-publicatie niet uitgevoerd. GitHub-oplevering wordt afzonderlijk met commitreferentie gerapporteerd.

Niet live geverifieerd: Shopify-inlog/uitlog, echte klantdata, profielwijzigingen, metafieldschrijfrechten, werkelijke retouraanvragen, bezorgde contactmails, Shopify-hostweergave en iPhone Safari. Hiervoor is de onderstaande acceptatietest nodig na winkelconfiguratie.

## Live acceptatietest vóór publiceren

1. Header desktop/mobiel → juiste extension → Shopify-login → persoonlijke begroeting. Log uit via Shopify-accountmenu en controleer dat een privépagina niet zichtbaar blijft.
2. Twee afzonderlijke testklanten: ieder uitsluitend eigen bestellingen/favorieten; accountwissel, terugknop en nieuwe tab testen. Probeer geen klant-ID als URL-parameter te gebruiken om gegevens op te vragen.
3. Lege klant, meerdere bestellingen, meer dan tien bestellingen, geannuleerde/deels terugbetaalde bestelling, onbekende status en verwijderde producten controleren.
4. Bestelling openen, meerdere zendingen en trackinglinks controleren; geen tracking als Shopify niets teruggeeft.
5. Naam, toegestane e-mail/telefoonwijzigingen, adres toevoegen/wijzigen/verwijderen en standaardadres via Shopify-profiel controleren. Heropen het portaal voor de actuele gegevens.
6. Garantie met/zonder snapshot en met verschillende bestelregels testen; garantiegegevens mogen geen andere bestelling of klant beschrijven.
7. Geschikte en ongeschikte retourbestelling; self-serve aanvraag bij Shopify afronden en ontvangst controleren.
8. Serviceformulier met verplicht veld leeg, foutrespons, botcontrole en succesvol ontvangen bericht testen. Controleer de bestelnummer/product-invulhulp.
9. Favoriet toevoegen, account opnieuw openen, verwijderen, verkocht/verwijderd product en wijzigingen in twee tabbladen testen; geen stille overschrijving bij conflict.
10. iPhone Safari (320/390px), tablet en desktop: geen horizontale overflow, zoom bij tekstinvoer, focus, VoiceOver, toetsenbord, trage verbinding en verbroken netwerk controleren.
11. Bestaande homepage, product, collectie, cart en checkout als regressiecontrole doorlopen. Deze bestanden zijn niet aangepast.

## Bestanden

- Aangepast: `sections/header.liquid` (twee accountlinks, SVG-icoon met aanraakvlak en URL-instelling).
- Nieuw thema: `assets/account-portal.css`, `assets/portal-support.js`, `sections/account-entrance.liquid`, `sections/portal-support.liquid`, `snippets/portal-icon.liquid`, `templates/page.account.json`, `templates/page.klantenservice.json`.
- App: `apps/customer-portal/package.json`, lockfile, `tsconfig.json`, `shopify.app.toml.example`, `extensions/portal/shopify.extension.toml`, extensionpackage en `src/Portal.tsx`, `src/api.mjs`, `src/types.ts`.
- Controles: app `tests/`, `scripts/browser-smoke.mjs`, `scripts/validate-schema.mjs`; screenshots in genegeerde `artifacts/`.
- Ondersteunend: `.gitignore`, `.shopifyignore`, deze handleiding. Geen wijzigingen aan de Marktplaats-repository.

## Officiële bronnen

- [Customer account apps en accountversies](https://shopify.dev/docs/apps/build/customer-accounts)
- [Full-page extensions en directe koppelingen](https://shopify.dev/docs/apps/build/customer-accounts/full-page-extensions)
- [Extension-only apps](https://shopify.dev/docs/apps/build/app-extensions/build-extension-only-app)
- [Polaris-webcomponenten en CSS-beperkingen](https://shopify.dev/docs/api/customer-account-ui-extensions/2026-07/web-components)
- [Customer Account API vanuit extensions](https://shopify.dev/docs/api/customer-account-ui-extensions/2026-07/target-apis/account-apis/customer-account-api)
- [Customer Account Order](https://shopify.dev/docs/api/customer/2026-07/objects/Order), [LineItem](https://shopify.dev/docs/api/customer/2026-07/objects/LineItem)
- [Metafields schrijven en compare-and-set](https://shopify.dev/docs/api/customer/2026-07/mutations/metafieldsSet)
- [Metafield-toegangsrechten](https://shopify.dev/docs/api/admin-graphql/2026-07/input-objects/MetafieldAccessInput)
- [Shopify self-serve returns](https://help.shopify.com/en/manual/fulfillment/managing-orders/returns/self-serve-returns)

