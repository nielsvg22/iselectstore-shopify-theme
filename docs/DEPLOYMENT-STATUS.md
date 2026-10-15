# Deploymentstatus klantenportaal — 15 oktober 2026

## Bevestigd uitgevoerd

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

De app moet via het Dev Dashboard voor custom distribution op de live winkel worden geïnstalleerd. De installatiestap moet de winkel en effectieve scopes bevestigen. `shopify app dev` kan deze winkel niet als development/sandboxstore vinden. Ook een read-only `app execute`-controle kon de winkel niet binnen de apporganisatie vinden. Er zijn geen Admin API-mutaties op productie geprobeerd.

Daarna zijn nog nodig:

1. Protected customer data-toegang controleren en klantaccounts met echte Shopify-testdata openen.
2. De full-page extension in de account-editor plaatsen, service-/winkel-URL's instellen en de echte directe URL kopiëren.
3. Garantie- en favorietmetafields met de beschreven lees-/schrijfrechten instellen. Favorieten pas daarna activeren.
4. De servicepagina aanmaken met template `page.klantenservice`, native retourinstellingen en contactontvangst controleren.
5. Preview van de nieuwe accountomgeving en bestaande winkelstromen testen; de storefront is momenteel wachtwoordbeschermd.
6. Pas dan de geteste accountbestanden gericht naar thema `210646630791` uploaden, zonder andere live bestanden te verwijderen of te vervangen. De header pas naar de directe extension-URL laten verwijzen nadat deze werkt.
7. Na upload live account, productpagina, cart en checkout controleren. Er is nog geen volledige live acceptatie geweest.

De gepubliceerde storefront is tot nu toe niet gewijzigd. Alleen de ongepubliceerde back-up en de Shopify-appregistratie/-versie zijn toegevoegd.
