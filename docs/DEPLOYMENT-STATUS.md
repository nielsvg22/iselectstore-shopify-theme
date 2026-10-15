# Deploymentstatus klantenportaal — 15 oktober 2026

## Actuele publicatie

De acht accountgerelateerde themabestanden zijn gericht geüpload naar het **gepubliceerde** thema `210646630791`, met `--allow-live --nodelete --only ...`. De bestaande header kwam vlak vóór upload nog overeen met de back-up. Alle acht bestanden zijn na upload teruggelezen: zes zijn bytegelijk, beide JSON-templates zijn inhoudelijk gelijk na normalisatie van Shopify's automatisch toegevoegde lege `settings`-objecten en editorcommentaar. De header gebruikt de officiële Shopify-account-route.

De actuele vrijgegeven appversie is **iselectstore-portaal-live-20261015-v2**, versie-ID `1168792715265`. Deze bevat naast de full-page extension een nieuwe, automatisch weergegeven ingang op zowel het besteloverzicht als profiel (`customer-account.order-index.announcement.render` en `customer-account.profile.announcement.render`). De knop **Open mijn iSelectStore** gebruikt `extension:iselectstore-portal/`; Shopify lost daarmee de juiste full-page URL binnen dezelfde geïnstalleerde app op. Er hoeft hiervoor geen URL door de winkelbeheerder te worden gekopieerd. Een directe storefront-headerlink naar de full-page URL blijft een optionele vervolgstap; de huidige route loopt via het besteloverzicht.

De nieuwe app-ingang heeft UID `9420b04e-5d37-9a42-7912-e3102c1d0f623e6b9eb7`. Webshop- en contactlinks gebruiken nu de echte `shop.url` en `shop.email` uit de Customer Account API als geen editorinstelling is ingevuld. Contact valt dan terug op een e-mailactie, niet op een niet-bestaande servicepagina. De e-mailactie verstuurt niets zonder dat de klant zelf verzendt.

Eigenaar heeft installatie gemeld. De CLI kan de installatie op deze productiestore nog niet onafhankelijk verifiëren. Een volledige ingelogde klanttest, protected-customer-data rechten, adreswijzigingen en een echte retouraanvraag zijn **niet** als geslaagd vastgesteld. De native accountomgeving is vanuit de uitvoeromgeving beperkt door toegang/botbescherming. De openbare storefront blijft wachtwoordbeschermd.

## Eerder bevestigd uitgevoerd

- Store: `ggh8q9-v1.myshopify.com`. Shopify CLI-login is geautoriseerd en thematoegang werkt.
- Gepubliceerd thema: `iselectstore-shopify-theme/main`, ID `210646630791`.
- Volledige live themabron opgehaald naar de genegeerde map `artifacts/live-backup-210646630791/`.
- Lokale back-up: `artifacts/live-theme-210646630791-before-portal.zip`.
- Back-up in Shopify zelf: **Backup voor klantenportaal 2026-10-15**, ID `211799605639`, ongepubliceerd.
- De bestaande Liquid-, CSS- en JavaScript-bestanden komen overeen met repositorybasis `9ee52e3`. Enkele live JSON-templates bevatten extra lege `settings`-objecten/editoropmaak. Ze zijn niet overschreven.
- `/account` verwijst naar de moderne Shopify Customer Accounts. De storefront zelf verwijst bezoekers naar `/password`; de afscherming is niet gewijzigd.
- Shopify-app **iSelectStore klantenportaal** aangemaakt en gekoppeld in organisatie **Mijn winkel**. Client-ID `cc1af57817edaf380750b7c000363fed`; app-ID `435960217601`.
- Echte appconfiguratie: `apps/customer-portal/shopify.app.iselectstore-klantenportaal.toml`. Dit bestand bevat publieke appmetadata, geen clientsecret of token.
- Shopify kende extension-UID `32b0b463-0898-ddc7-5713-75cc037b7e06676d0711` toe; deze is in de extensionconfiguratie vastgelegd.
- Officiële deploymentvalidatie/bundelbuild geslaagd. Versie **iselectstore-klantenportaal-2** is eerst als concept aangemaakt en vervolgens via `shopify app release` vrijgegeven. Een vrijgegeven appversie betekent niet dat de app al in de winkel is geïnstalleerd.

Appbeheer: https://dev.shopify.com/dashboard/237731586/apps/435960217601

Vrijgegeven versie: https://dev.shopify.com/dashboard/237731586/apps/435960217601/versions/1168766861313

## Resterende blokkades

### GitHub

De implementatie en statusdocumentatie zijn lokaal gecommit. Zowel de bestaande GitHub-koppeling als GitHub CLI-authenticatie weigeren schrijven naar `nielsvg22/iselectstore-shopify-theme`:

- `git push origin main`: HTTP 403, permission denied.
- Git Trees API: HTTP 403, **Resource not accessible by integration**.
- Contents API: dezelfde HTTP 403.
- Na geautoriseerde CLI-login en `gh auth refresh --scopes repo` blijft de fout bestaan; de API meldt geen actieve OAuth-scopes.

Een nieuwe identieke browserlogin lost dit niet op. De effectieve repositorykoppeling moet `Contents: read and write` krijgen, of een geschikte GitHub-credential moet via de ondersteunde secretconfiguratie aan de uitvoeromgeving worden gekoppeld. Geen tokens in chat plaatsen. Er is niet geforceerd gepusht en de remote branch is niet gewijzigd.

De lokale bundle `artifacts/iselectstore-customer-portal.bundle` bevat de oplevercommits boven basiscommit `9ee52e3` voor overdracht aan een geautoriseerde ontwikkelomgeving.

### Shopify-installatie en acceptatie

De eigenaar meldt de app te hebben geïnstalleerd. De effectieve winkelinstallatie en scopes moeten nog via een ingelogde klanttest worden bevestigd. `shopify app dev` kan deze winkel niet als development/sandboxstore vinden. Ook een read-only `app execute`-controle kon de winkel niet binnen de apporganisatie vinden. Er zijn geen Admin API-mutaties op productie geprobeerd.

Daarna zijn nog nodig:

1. Protected customer data-toegang controleren en klantaccounts met echte Shopify-testdata openen.
2. Ingelogd op het besteloverzicht of profiel de automatisch weergegeven knop **Open mijn iSelectStore** controleren. Een accountmenu-item en een directe header-URL zijn aanvullend mogelijk, maar niet nodig voor deze nieuwe ingang.
3. Garantie- en favorietmetafields met de beschreven lees-/schrijfrechten instellen. Favorieten pas daarna activeren.
4. De servicepagina aanmaken met template `page.klantenservice`, native retourinstellingen en contactontvangst controleren.
5. Preview van de nieuwe accountomgeving en bestaande winkelstromen testen; de storefront is momenteel wachtwoordbeschermd.
6. De acht geteste accountbestanden zijn gericht live geüpload. Een eventuele directe header-URL pas na controle van de werkelijke full-page URL activeren.
7. Na upload live account, productpagina, cart en checkout controleren. Er is nog geen volledige live acceptatie geweest.

De gepubliceerde storefront bevat inmiddels de acht hierboven genoemde accountbestanden. Homepage, product-, collectie-, cart- en checkoutbestanden zijn niet aangepast. De wachtwoordbescherming is behouden.


## Controles na de laatste update

- Strict TypeScript: geslaagd.
- Acht gerichte API-/validatietests: geslaagd.
- Customer Account GraphQL-schema inclusief `shop { email url }`: geldig.
- Chromium-smoketest: geslaagd, inclusief automatische-inganglink en contact zonder editorinstellingen, accountwissels en late responses.
- Officiële Shopify-build en releasevalidatie van beide extensions: geslaagd.
- Live HTTP: `/`, `/collections/all`, `/cart` en `/checkout` leiden naar de bestaande wachtwoordpagina (HTTP 200). `/cart.js` is afgeschermd (401). De account-route verwijst naar Shopify-hosted accounts, maar de uiteindelijke pagina geeft vanuit de uitvoeromgeving 406. Dit is geen volledige functionele regressietest achter de winkelafscherming.
- GitHub-schrijfrecht blijft geblokkeerd; de commits zijn lokaal en in de bijgewerkte bundle bewaard.
