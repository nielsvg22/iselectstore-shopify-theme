# Mobiel productoverzicht

Onder 901 px blijven Filteren en de native sorteerlijst tijdens scrollen bovenaan het productoverzicht bereikbaar. De balk houdt rekening met de zichtbare header en stopt aan het einde van de collectie. Een gereserveerde plek voorkomt verspringen. Op desktop blijft de bestaande indeling staan.

Het filterbadge telt toegepaste filterwaarden; een prijsbereik telt als één filter. Shopify GET-formulieren blijven verantwoordelijk voor filtering en sortering, inclusief het behouden van actieve filters. Zonder JavaScript blijven de filtervelden en de sorteerknop beschikbaar. Het filterpaneel behoudt focusbeheer, Escape en grote aanraakvlakken.

Gedeelde productkaarten tonen mobiel opslag, batterijconditie en staat via `spec-value`: bestaande `custom`-metafields, met de bestaande Marktplaats-appnamespace als fallback. Ontbrekende gegevens worden weggelaten. Foto's staan in gelijke vierkante vakken met `object-fit: contain`; prijs en productknop blijven onderaan de kaart.

## Controle

Vanuit de themamap:

```sh
node apps/customer-portal/scripts/collection-browser.mjs
node apps/customer-portal/scripts/specification-localization-test.mjs
node apps/customer-portal/scripts/collection-stock-browser.mjs
```

De browsertests gebruiken de echte Liquid, CSS en JavaScript met lokale productfixtures. Ze controleren 320–1920 px, de zwevende balk, touchdoelen, gelijke afbeeldingen, filteraantallen, native formulierparameters, paginering, lege collecties en bediening zonder JavaScript. De voorraadtest controleert beschikbaarheid en volgorde over meerdere pagina's. Shopify Liquid-validatie controleert beide gewijzigde Liquid-bestanden.

De winkel is met een wachtwoord afgeschermd. Live publicatie wordt gecontroleerd door de vijf gepubliceerde themabestanden opnieuw op te halen en te vergelijken. Een volledige live klantreis achter de wachtwoordpagina en een fysieke iPhone Safari-test blijven afzonderlijke controles.
