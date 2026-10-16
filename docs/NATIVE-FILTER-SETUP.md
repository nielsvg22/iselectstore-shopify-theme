# Ontbrekende native Shopify-filters

De live sidebar op de aangeleverde screenshot toont alleen beschikbaarheid en prijs. De collectie-Liquid doorloopt alle werkelijk door Shopify aangeleverde `collection.filters`; er staat geen maximum van twee of een uitsluiting van andere velden in het thema.

Filterbronnen worden in Shopify beheerd via de gratis **Search & Discovery → Filters → Filter toevoegen → Bron → Opslaan**. Alleen thema-CSS/Liquid wijzigen activeert geen filterindex. Het toevoegen van URL-parameters voor niet-geactiveerde filters zou niet betrouwbaar werken. Daarom zijn geen schijnfilters of lokale filters op alleen de eerste 24 producten toegevoegd.

## Aan te zetten bronnen

| Label | Bron om in Shopify te selecteren |
| --- | --- |
| Productcategorie | Standaardfilter Producttype, met werkelijk aanwezige typen zoals iPhone/iPad/MacBook/Apple Watch |
| Model | Productmetaveld `custom.model`, indien gedefinieerd en gevuld |
| Opslag | Productmetaveld `custom.storage_gb`, indien gedefinieerd en gevuld; of bestaande productoptie Opslag indien dat de werkelijke bron is |
| Kleur | Productmetaveld `custom.color` of bestaande productoptie Kleur, afhankelijk van waar cataloguswaarden werkelijk zijn opgeslagen |
| Conditie | Productmetaveld `custom.condition`, indien gedefinieerd en gevuld |
| Batterijconditie (optioneel) | Productmetaveld `custom.battery_percentage`, indien gedefinieerd en gevuld |

Beschikbaarheid en prijs behouden. Vermijd dubbele bronnen voor hetzelfde kenmerk. Kies voor kleur/opslag de daadwerkelijk gebruikte bron; de live waarden en definities konden met de huidige toegang niet worden geïnventariseerd. De hierboven genoemde keys komen uit de bestaande Shopify-thema-/importcode en zijn geen bevestiging dat alle productieproducten die velden al gevuld hebben.

Als een veld niet als bron wordt aangeboden: controleer in **Instellingen → Aangepaste gegevens → Producten** of de definitie bestaat en een door Shopify ondersteund filtertype heeft. Controleer daarna of producten echte waarden hebben. Geen model/conditie/kleuren uit titels afleiden en automatisch overschrijven; individuele producten behouden hun eigen gegevens.

Na opslaan levert Shopify deze filters automatisch aan de al gepubliceerde sidebar. Afhankelijk van catalogus/indexering verschijnt een bron alleen bij collecties met relevante waarden. Controleer één filter, combinaties, sortering en pagina 2; verwijder daarna alle filters.

## Toegang en status

De bestaande CLI kan het live thema lezen/publiceren. De geïnstalleerde account-app heeft klant-/orderscopes en geen `read_products`/`write_products` of interactieve Search & Discovery-beheersessie. Een echte Admin API-productquery is eerder geweigerd met `ACCESS_DENIED`. De officiële Liquid-console wordt bovendien door het storefrontwachtwoord geblokkeerd. Deze toegangen mogen niet worden voorgesteld als toegang tot filterconfiguratie.

Er zijn in deze opdracht geen filterinstellingen geactiveerd of productgegevens gewijzigd. Met de huidige middelen is de resterende concrete handeling door de winkelbeheerder: de bovengenoemde bronnen selecteren en opslaan in Search & Discovery. Geen extra app-abonnement nodig.

Officiële Shopify-instructies: https://help.shopify.com/nl/manual/online-store/search-and-discovery/filters
