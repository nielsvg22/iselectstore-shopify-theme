# Productspecificaties, opschoning en taalweergave

Op 16 oktober 2026 zijn 30 gepubliceerde Shopify-producten gecontroleerd. Bron: de bestaande producttitels, beschrijvingen en metafields. Prijzen, voorraad, publicatiestatus, handles, foto's en variant-ID's zijn niet gewijzigd. De Marktplaats-repository is niet aangepast.

## Productgegevens

Twaalf merchant-owned definities in `custom` zijn ingericht met storefront-leestoegang: model, kleur, chip, RAM, SIM/eSIM, garantie, schermformaat, Watch-serie/-kastformaat, laadcycli, doos inbegrepen en cosmetische opmerkingen. De definities staan in `apps/customer-portal/catalog/metafield-definitions.json`. Merchant-owned is hier bewust nodig: webshop en bestaande integratie gebruiken dezelfde velden. Er zijn geen nieuwe app-owned bronvelden geïntroduceerd.

Er zijn 68 onderbouwde veldwijzigingen toegepast en teruggelezen:

- 25 modelnamen, 23 kleuren en 3 expliciet genoemde M1/M2/M3-chips uit de titels.
- 2 Apple Watch-series en 2 kastformaten uit de titels, 1 expliciet schermformaat.
- 2 expliciete aantallen laadcycli en 4 bevestigingen van een meegeleverde doos uit de beschrijvingen.
- De iPhone 14 met 128GB in de titel heeft nu 128GB in het opslagveld. De foutieve conditie `Zwart` is vervangen door de beschreven scherm-/behuizingstoestand. De badge zegt nauwkeurig `Krasvrij scherm`; de cosmetische toelichting blijft behouden.
- Bij de iPhone 14 Pro Max is `Zwart` als conditie vervangen door het letterlijk beschreven `Krasvrij`.
- De badge `Test` is vervangen door de reeds vastgelegde conditie van hetzelfde toestel.

Daarnaast is `test` verwijderd uit de Apple Watch SE-producttitel en de bijbehorende SEO-titel/-beschrijving. De eigenaar heeft expliciet **12 maanden garantie** bevestigd voor de iPhone 14; alleen de afwijkende zin met 6 maanden in de beschrijving is naar 12 maanden aangepast. Het reeds bestaande garantieveld bleef 12.

Nieuwe waarden zijn alleen geschreven als het veld nog niet bestond. Correcties hebben een expliciete broncontrole. `metafieldsSet` gebruikt de originele `compareDigest` (of null voor nieuw), zodat tussentijdse wijzigingen niet worden overschreven. Producttitel-/beschrijvingscorrecties zijn vlak vóór schrijven vergeleken met de originele velden. De pure planner `catalog/prepare-cleanup.mjs` schrijft zelf niets naar Shopify en weigert onvolledige backups. Na teruglezen levert hetzelfde plan geen verdere wijzigingen op.

## Nog ontbrekende toestelgegevens

Bij drie MacBooks is het exacte RAM niet vermeld. Bij twintig iPhones/iPads is de precieze SIM-/eSIM-uitvoering niet vastgelegd. Deze velden zijn bewust leeg gelaten: geheugen is configureerbaar en SIM verschilt onder andere per regio. Een generieke modelspecificatie is geen bewijs van de uitvoering van het verkochte exemplaar.

De werkbestanden staan lokaal in de genegeerde map `artifacts`: `product-cleanup-before.json`, `product-cleanup-plan.json`, de API-resultaten, `product-cleanup-verified.json`, `product-cleanup-recheck-final.json` en een invul-CSV. Niet automatisch toepassen op een nieuwe momentopname zonder de bronnen opnieuw te controleren. Overige toestellen met mogelijk onjuiste uitvoering/opslag moeten aan het fysieke toestel worden geverifieerd; er worden geen modelconfiguraties op basis van aannames gecorrigeerd.

## Storefront en Engels

De specificatielezer verwerkt nu Shopify-metafieldwaarden correct, inclusief expliciet false en nul. RAM krijgt een GB-eenheid; bewezen laadcycli kunnen ook bij iPhone/iPad/Watch worden getoond. Chip kan ook voor iPhone/iPad verschijnen als later een gecontroleerde waarde beschikbaar is. Ontbrekende waarden blijven verborgen. De bestaande app-namespace-fallback en producttype-afbakening blijven bestaan.

De collectie-interface, native bekende filterlabels, prijslabels, actieve filters, aantallen, lege toestanden, paginering, voorraadlabels en VERKOCHT-ribbon gebruiken NL/EN-locale-sleutels. Bekende conditie-/kleur-/badgeteksten worden per taal getoond; onbekende merchantwaarden blijven zichtbaar en worden ge-escaped. Standaardteksten van de inruilbanner worden ook vertaald als de Nederlandse standaard al in de sectie-instellingen is opgeslagen. Eigen teksten blijven behouden en kunnen via Shopify worden vertaald.

Dit is interfacevertaling. Zelfgeschreven productbeschrijvingen, eigen paginacontent, eigen bannerteksten en het apart gebouwde Nederlandstalige klantenportaal zijn niet automatisch herschreven of vervangen.

De browsertitel toont `iSelectStore` op de homepage en wachtwoordpagina. Andere pagina's behouden hun paginanaam en krijgen alleen een merksuffix als dat nog ontbreekt. De algemene Shopify-winkel-/bedrijfsnaam is niet gewijzigd.

## Validatie en publicatie

`npm run test:specifications` controleert de echte Liquid-specificatierijen en de Nederlandse/Engelse collectie-interface op 320/390/1440 px. Het dekt typed metafields, false, numerieke eenheden, bronfallback, lege waarden, escapegedrag, filterlabels, aantallen, chips, voorraadlabels, opgeslagen standaardbanners en browsertitels. De browserfixture ondersteunt Shopify LiquidDoc en handleize; de productielogica wordt niet vervangen.

De bestaande merk-, collectie-, voorraadvolgorde-, homepagevoorraad- en productkaarttests zijn uitgevoerd. Officiële themevalidatie is vergeleken met dezelfde bestanden vóór deze wijziging: drie reeds bestaande foutmeldingen (twee `push`-filters in layout/theme en een lichtboxafbeelding zonder afmetingen in main-product), geen nieuwe fouten in de aangepaste regels of nieuwe snippets. Deze bestaande onderdelen zijn niet voor dit werk herschreven.

De live storefront is wachtwoordbeschermd. Publicatie wordt gecontroleerd door de bestanden uit het gepubliceerde thema terug te lezen en de publiek zichtbare browsertitel te controleren. Dat is geen volledige ingelogde koopflowtest.
