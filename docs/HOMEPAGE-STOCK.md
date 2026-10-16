# Homepage: uitsluitend beschikbare toestellen

`sections/featured-products.liquid` en `sections/fresh-stock.liquid` selecteren nu eerst Shopify-producten met `available == true`. Accessoires blijven uitgesloten. De categorie-aanvulling met uitverkochte producten is verwijderd. Een extra controle vlak vóór rendering bewaakt beschikbaarheid.

Onze producten behoudt de gemengde selectie per categorie en vult het ingestelde aantal met beschikbare toestellen aan. Als slechts één categorie voorraad heeft, kunnen daar meer dan twee producten uit worden getoond. Alleen categorieën met werkelijk getoonde producten krijgen een tab. Bij onvoldoende voorraad verschijnen minder producten; als niets beschikbaar is, wordt het blok verborgen. Vers in voorraad toont de nieuwste beschikbare toestellen en telt alleen die toestellen mee voor de ingestelde limiet.

Shopify-productdata, voorraadbeleid, collectiepagina's, uitverkochtlabels en detailpagina's zijn niet gewijzigd. Er is geen client-side truc die reeds gerenderde uitverkochte kaarten alleen verbergt; de selectie gebeurt server-side in Liquid.

Controle: `npm run test:homepage:stock` vanuit `apps/customer-portal`. De proef rendert beide echte secties en de echte kaart: gemengde voorraad, uitverkocht als nieuwste product, uitsluitend uitverkocht, alleen accessoires, geen collectie, één beschikbaar toestel, acht beschikbare toestellen binnen één categorie, geen duplicaten en tabbladen zonder uitverkochte categorieën. Daarnaast slaagt de bestaande branding-browserproef op 320/390/768/1024/1440 px.

Thema-validatie geeft geen bevindingen in de gewijzigde secties. De bestaande unsupported `where_exp` in Onze producten is door ondersteunde `where`/`reject`-filters vervangen; globale bestaande fouten dalen van acht naar zeven.

Back-up: `artifacts/home-stock-before/`. Publiceer uitsluitend de twee gewijzigde secties naar het bestaande live thema `210646630791` op `ggh8q9-v1.myshopify.com`, controleer vooraf op externe wijzigingen en lees beide bestanden terug na publicatie.
