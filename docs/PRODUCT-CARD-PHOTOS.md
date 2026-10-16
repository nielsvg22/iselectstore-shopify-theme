# Productkaarten: verkochtstrook en fotovlak — 16 oktober 2026

De eigenaar wil `VERKOCHT` in witte tekst op een diagonale koraalstrook, in de stijl van de aangeleverde Nieuw-binnen-referentie. De bestaande rode sticker zat in de productfoto ingebakken.

## Gedrag

- `snippets/product-card.liquid` kiest bij een `verkocht-<oorspronkelijke-afbeeldings-ID>[_uuid].jpg` eerst de oorspronkelijke foto met hetzelfde ID uit **hetzelfde product**. Als die niet aanwezig is, wordt een andere niet-gestempelde foto van hetzelfde product gebruikt. Er wordt geen foto van een ander product geleend.
- Het voorraadlabel komt uit Shopify `product.available`: uitverkocht toont precies `VERKOCHT`, beschikbaar toont geen verkochtstrook. Ook een weer beschikbaar toestel blijft dus niet door een oude export onterecht als verkocht aangeduid wanneer de originele foto aanwezig is.
- `.productSoldRibbon` is een losse, responsieve CSS-strook met bestaande merkkleur `--coral`, witte tekst en een hoek van -45 graden. De strook is aan het fotovlak gekoppeld, niet aan het hele kaartvlak.
- In de huidige gepubliceerde catalogus hebben 13 van de 14 gestempelde primaire foto's een losse originele foto in hetzelfde product. Bij de ene uitzondering blijft de bestaande foto behouden en ligt de nieuwe ondoorzichtige koraalstrook over de oude hoeksticker. Dit is met een echte gestempelde foto gecontroleerd: geen oude rode pixels buiten de nieuwe strook zichtbaar.
- Het desktop-fotovlak is weer vierkant, met maximaal 260 px breedte en hoogte, gecentreerd. `object-fit:contain`, zonder extra binnenpadding, behoudt de hele foto. De oude brede 200 px hoge balk met een klein vierkant fotootje is vervallen. De pagina blijft compact en heeft drie producten per rij vanaf 1100 px.
- De mobiele fotoverhouding blijft behouden. De verkochte status gebruikt ook daar dezelfde responsieve witte/koraalstrook.

Er zijn geen Shopify-productwaarden, bestandsuploads, originele fotobestanden, voorraad of prijzen gewijzigd. Er zijn geen AI-bewerkingen op productfoto's gedaan. Dit betreft de gedeelde kaarten (collectie, homepage en zoekresultaten), geen wijziging van de productdetailgalerij.

## Controle en herstel

`npm run test:product-card:browser` vanuit `apps/customer-portal` gebruikt lokale SVG-testfixtures, de echte productkaart en echte CSS. Test: juiste oorspronkelijke afbeelding, fallback zonder origineel, één VERKOCHT-label, witte tekst/koraal, weer beschikbaar, juiste productlinks, vierkant maximaal 260 px op desktop, volledige foto zonder crop, mobiel en nul JS-fouten op 390/1280/1440/1920 px. Dezelfde browserproef is daarnaast met de echte aangeleverde iPhone-foto's uitgevoerd (`CARD_USE_REAL_PHOTOS=1` bij lokaal aanwezige auditbeelden). Voor- en na-beelden staan in genegeerde `artifacts/sold-ribbon-review/`.

De complete collectieproef slaagt op 1920/1536/1440/1280/1024/768/390 px, inclusief drie kolommen, compacte kaarten, inruilbanner, filters, sortering, paginering en lege resultaten. De brandingregressie slaagt eveneens op vijf schermbreedtes. Theme Check: acht bestaande fouten en twee bestaande waarschuwingen elders, geen bevindingen in de gewijzigde kaart.

Back-up van de drie vervangen live bestanden: `artifacts/sold-ribbon-before/`. Alleen `assets/brand.css`, `assets/collection.css` en `snippets/product-card.liquid` worden gepubliceerd. Publiceer de CSS eerst, daarna de kaart. Controleer vóór vervanging op wijzigingen ten opzichte van deze back-up en lees na publicatie de drie bestanden opnieuw terug.
