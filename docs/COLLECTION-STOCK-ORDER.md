# Nieuwste beschikbare producten vooraan

De standaardweergave van `main-collection` toont beschikbare producten op aflopende Shopify-aanmaakdatum, gevolgd door alle uitverkochte producten op dezelfde datumvolgorde. Nieuwe producten komen na publicatie automatisch in deze volgorde. Aanmaakdatum is geen eerste publicatiedatum; opnieuw publiceren van een oud product verandert de aanmaakdatum niet.

## Werking

`collection-stock-order.js` vraagt met de officiële Section Rendering API dezelfde collectie op, met `sort_by=created-descending` en Shopify's native `filter.v.availability`. Alle bestaande prijs-, product- en metafieldfilters, taal-/marktpaden en previewparameters blijven behouden. Alleen de benodigde pagina's van de voorraadgroepen worden geladen: maximaal vier sectieverzoeken, onafhankelijk van de totale catalogusgrootte. Er worden geen Admin-tokens, privégegevens of beheer-API's naar de browser gestuurd.

De paginering blijft 24 producten per pagina tellen over beide groepen samen. Beschikbare producten van pagina 2 worden dus niet achter verkochte producten van pagina 1 geplaatst. De inruilbanner wordt éénmaal per pagina na de eerste volledige desktoprij geplaatst. Structured data volgt de zichtbare productvolgorde. Expliciete andere sorteerkeuzes blijven native Shopify; een expliciet beschikbaarheidsfilter blijft gerespecteerd.

De volgorde wordt bij iedere paginalading opnieuw uit actuele Shopify-data samengesteld; een reeds geopende tab wordt niet automatisch continu bijgewerkt. Bij netwerkfouten, ontbrekende native beschikbaarheidsfilter of inconsistente voorraadgegevens blijft het native productoverzicht bruikbaar met een zichtbare foutmelding. Zonder JavaScript blijft de native Shopify-volgorde gelden. De vijf hoofdcollecties zijn in Shopify ingesteld op `CREATED_DESC`, zodat deze fallback eveneens nieuwste eerst toont (zonder de extra voorraadsplitsing).

## Shopify-instellingen en terugzetten

Native beschikbaarheidsfilter moet geactiveerd blijven in Search & Discovery. Op 16 oktober 2026 zijn uitsluitend de sorteerinstellingen van `alle-voorraad`, `apple-iphone`, `apple-ipad`, `apple-macbooks` en `apple-watch` gewijzigd van `BEST_SELLING` naar `CREATED_DESC`. Collectieregels, productstatus, voorraad en prijzen blijven gelijk. De aparte `frontpage`-collectie is niet aangepast. Voor `/collections/all` kiest de browser dezelfde nieuwe standaard zonder de automatische Shopify-collectie te wijzigen.

Vooraf opgeslagen themafiles: `artifacts/stock-order-before/`. Collectie-instellingen: `artifacts/stock-order-collections-before.json`. Terugzetten: originele themafiles terugplaatsen, nieuw JS-asset verwijderen en indien gewenst de vijf collecties weer `BEST_SELLING` laten sorteren.

## Verificatie

`npm run test:collection:stock` vanuit `apps/customer-portal` gebruikt echte Liquid/templates, CSS en browser-JavaScript met uitsluitend testfixtures. Het controleert 90 producten (53 beschikbaar, 37 verkocht) over vier pagina's, de overgang tussen voorraadgroepen, geen dubbelen/ontbrekende producten, datumvolgorde, filters, enkele/both beschikbaarheidsfilters, alles/niets/één beschikbaar, lege resultaten, foutafhandeling, prijskeuze, structured data en de responsieve inruilbanner. `test:collection:browser` en `test:brand:browser` blijven de overige desktop- en mobiele flows controleren.

De storefront is met een winkelwachtwoord beschermd. Live verificatie bestaat uit teruglezen van de gepubliceerde bestanden en controle van de daadwerkelijk geserveerde JS/CSS-assets; de ingelogde storefrontflow is hier niet met echte klantgegevens getest.
