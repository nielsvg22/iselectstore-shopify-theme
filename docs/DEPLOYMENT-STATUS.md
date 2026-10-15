# Deploymentstatus klantenportaal — 15 oktober 2026

## Actuele implementatie

Het primaire portaal staat binnen het Shopify-thema, op `/search?view=mijn-account`. De header gebruikt deze alternatieve thematemplate zolang de optionele pagina `mijn-account` niet bestaat. De oorspronkelijke header, footer, Poppins en bestaande kleurvariabelen worden behouden. De foutgevende full-page extension is niet meer de accountbestemming. Het accountmenu is via de Admin API teruggebracht naar de oorspronkelijke Bestellingen/Profiel-items; bestaande items en IDs zijn behouden.

De huidige apprelease is `iselectstore-theme-portaal-20261015`, versie `1169156866049`, met alleen de oorspronkelijke drie customer-scopes in de configuratie. De tijdelijke pagina-aanvraag is verwijderd. De app is voor de primaire thema-integratie niet nodig; een optionele API-modus is apart voorbereid.

## Wat de themaversie doet

- Moderne officiële Shopify-login via `routes.storefront_login_url`, met terugkeer naar de storefront. Geen klassieke accountimplementatie of eigen authenticatie.
- Eigen ingelogde `customer`-gegevens server-side via Shopify Liquid: dashboard, gepagineerde orders, echte bedragen en betaal-/verzendstatus, orderregels, tracking en eigen productaankopen.
- Garantie alleen uit vastgelegde ordermetafields; geen verzonnen termijnen.
- Gegevens/adressen bekijken in het portaal, wijzigen via de officiële moderne Shopify-profielroute. De optionele API-modus ondersteunt aanvullende inline naam-/adresmutaties na configuratie van een publieke webclient.
- Service verwijst naar het bestaande native Shopify-contactformulier, garantieregels, FAQ en echte e-mailacties. Retourmogelijkheden worden via de officiële bestelling geopend; geen valse retourbevestiging.
- Favorieten blijven uit zolang metafields en catalogustoegang niet zijn ingesteld/gecontroleerd. De tokenloze Storefront API meldt nu `Online Store channel is locked`.

## Publicatie en back-up

Store `ggh8q9-v1.myshopify.com`, gepubliceerd thema `210646630791` (`iselectstore-shopify-theme/main`). Volledige voorafgaande back-up in Shopify: `211799605639`, **Backup voor klantenportaal 2026-10-15**. Lokale back-up `artifacts/live-theme-210646630791-before-portal.zip`.

Negen portalbestanden zijn gericht geüpload met `--allow-live --nodelete --only`, zonder homepage-, product-, collectie-, cart- of checkoutbestanden te wijzigen. Vóór upload kwamen live header en portal-CSS overeen met de vorige eigen publicatie. Readback en HTTP-controles worden onderaan vastgelegd.

Nieuwe/aangepaste themabestanden:

- `sections/header.liquid`
- `sections/storefront-portal.liquid`
- `snippets/storefront-portal-native.liquid`
- `snippets/storefront-portal-order.liquid`
- `assets/account-portal.css`
- `assets/storefront-portal-native.js`
- `assets/storefront-portal.js` (aanvullende API-modus, alleen geladen met client-ID)
- `templates/page.mijn-account.json`
- `templates/search.mijn-account.json`

Broncode/testen staan onder `apps/customer-portal/storefront`, `apps/customer-portal/scripts` en `apps/customer-portal/tests`. Configuratie en lokale testinstructies: `docs/STOREFRONT-PORTAL.md`.

## Verificatie en beperkingen

- 16 unit-/protocol-/schema-validatietests geslaagd, inclusief officiële Customer Account- en Storefront-schema's.
- Strict TypeScript van de aanvullende browserapp geslaagd.
- Chromium: native en aanvullende API-modus op 390px en 1440px geslaagd; Shopify-login is in deze tests gesimuleerd. Geen productievoorbeelddata.
- Theme Check in een schone theme-only stagingmap: dezelfde 16 bestaande bevindingen (11 fouten, 5 waarschuwingen), geen nieuwe bevindingen in portal- of headerbestanden. De genegeerde backupmap is niet onderdeel van deze telling.
- Playwright-WebKit gedownload, maar niet uitvoerbaar door ontbrekende systeembibliotheken. Geen geslaagde Safari-test geclaimd.
- De storefront-wachtwoordbescherming blijft behouden. Een echte ingelogde klantacceptatie en volledige checkout-/carttest achter die afscherming zijn nog niet onafhankelijk uitgevoerd. Een geslaagde upload bewijst die privéflows niet.

## GitHub

De remote themebranch bevat inmiddels Shopify's automatische commits van de eerdere live uploads (`deffc24`, `d6b2cd5`). Deze zijn opgehaald om wijzigingen te beschermen. De GitHub API/CLI-koppeling heeft eerder rechtstreeks schrijven geweigerd met HTTP 403. De nieuwste lokale implementatie wordt gecommit en met de remote gesynchroniseerd; het uiteindelijke pushresultaat wordt hieronder vastgelegd. De lokale bundle bevat de broncode voor overdracht als rechtstreeks pushen geblokkeerd blijft.


## Laatste bevestigde controles

Alle negen geüploade bestanden zijn uit het live thema teruggelezen: zeven bytegelijk; beide JSON-templates semantisch gelijk na Shopify-editorcommentaar en lege settings-normalisatie. De echte `/customer_authentication/login?return_to=%2Fsearch%3Fview%3Dmijn-account&locale=nl` opent Shopify OAuth met HTTP 200. `/search?view=mijn-account`, `/collections/all`, `/cart` en `/checkout` leiden vanuit deze niet-ingelogde omgeving nog naar de bestaande wachtwoordpagina. Dit is geen volledige geauthenticeerde acceptatie.

`appRevokeAccessScopes` heeft de drie tijdelijke rechten `read_online_store_pages`, `read_online_store_navigation` en `write_online_store_navigation` succesvol ingetrokken, zonder userErrors. De onbevestigde extra pagina-write-scope is niet meer aangevraagd.

## Definitieve Git-status

Shopify heeft de negen live themabestanden automatisch naar GitHub gesynchroniseerd in remote commit `8fc16c5` (naast eerdere commits `deffc24` en `d6b2cd5`). De volledige lokale bronimplementatie is commit `8cadc57`; remote wijzigingen zijn zorgvuldig gemerged in `c8f2860`. Vier JSON-add/add-conflicten waren uitsluitend Shopify-editorcommentaar/opmaak/lege settings: de inhoud is gelijk gecontroleerd en de remote editorversies zijn behouden.

Een rechtstreekse `git push origin main` na de merge blijft HTTP 403 geven. De themabestanden staan dus werkelijk op GitHub via de Shopify-koppeling; de aanvullende appbroncode, tests en documentatie zijn lokaal gecommit maar nog niet rechtstreeks gepusht. `artifacts/iselectstore-customer-portal.bundle` bewaart de volledige lokale commits voor overdracht. Geen force-push of overschrijving van ander werk.
