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

Beschikbaarheid en prijs behouden. Vermijd dubbele bronnen voor hetzelfde kenmerk. Kies voor kleur/opslag de daadwerkelijk gebruikte bron; de inventaris hieronder beschrijft de inmiddels bevestigde waarden en definities. De hierboven genoemde keys komen uit de bestaande Shopify-thema-/importcode en zijn geen bevestiging dat alle productieproducten die velden al gevuld hebben.

Als een veld niet als bron wordt aangeboden: controleer in **Instellingen → Aangepaste gegevens → Producten** of de definitie bestaat en een door Shopify ondersteund filtertype heeft. Controleer daarna of producten echte waarden hebben. Geen model/conditie/kleuren uit titels afleiden en automatisch overschrijven; individuele producten behouden hun eigen gegevens.

Na opslaan levert Shopify deze filters automatisch aan de al gepubliceerde sidebar. Afhankelijk van catalogus/indexering verschijnt een bron alleen bij collecties met relevante waarden. Controleer één filter, combinaties, sortering en pagina 2; verwijder daarna alle filters.

## Toegang en status — bijgewerkt na toegangsverzoek

De account-app heeft geen productrechten, maar de reeds geautoriseerde Shopify CLI-adminsessie bleek wel toegang tot de officiële Admin GraphQL API te hebben. Met deze sessie zijn de echte productgegevens en metafielddefinities geïnventariseerd. Er zijn geen nieuwe apprechten aangevraagd of credentials gepubliceerd.

Er zijn 85 actieve producten, waarvan 30 online gepubliceerd. Van de 30 gepubliceerde producten hebben 25 opslaggegevens en 24 batterijgegevens. Model en kleur ontbreken als aparte metafields. Eén van de gepubliceerde conditiewaarden is `Zwart`; die is niet automatisch gecorrigeerd. De oudere, bredere productinventaris bevat nog meer ongeschikte conditiewaarden. Maak geen filters uit producttitels of kleuren onder het label conditie.

De volgende ontbrekende definities zijn via de officiële `metafieldDefinitionCreate`-mutatie aangemaakt, met dezelfde bestaande datatype en storefronttoegang `PUBLIC_READ`:

| Bron | Definitie-ID | Status |
| --- | --- | --- |
| `custom.storage_gb` | `1600663126407` | Aangemaakt: Opslagcapaciteit (GB), integer |
| `custom.condition` | `1600663159175` | Aangemaakt: Conditie, tekst; eerst vervuilde waarde beoordelen |
| `custom.battery_percentage` | `1600663191943` | Aangemaakt: Batterijconditie (%), integer |

De productmetafieldwaarden van alle 85 actieve producten zijn vóór en na de mutaties vergeleken en zijn ongewijzigd. Er zijn geen productnamen, prijzen, voorraad, varianten of individuele productwaarden gewijzigd. Lokale audit/back-up staat in de genegeerde map `artifacts/filter-configuration/`.

Deze definities voorbereiden is **niet hetzelfde als filters activeren**. De beschikbare API-sessie geeft geen toegang tot het beheer van Search & Discovery (ook de query naar geïnstalleerde apps geeft `ACCESS_DENIED`). Er is geen gedocumenteerde openbare mutatie gevonden waarmee de actieve Search & Discovery-filters via deze koppeling gewijzigd kunnen worden. Er zijn geen geraden Shopify-interne configuratievelden of schijnfilters geschreven.

De resterende handeling door de winkelbeheerder: **Apps → Search & Discovery → Filters → Filter toevoegen → Bron**, selecteer Producttype en de aangemaakte productmetavelden, sla op. Controleer vóór Conditie de onjuiste waarde. De storefront toont de bronnen automatisch zodra Shopify ze activeert. Model/kleur worden pas zinvol na correcte aparte brongegevens; daarvoor zijn geen waarden verzonnen.

Officiële Shopify-instructies: https://help.shopify.com/nl/manual/online-store/search-and-discovery/filters

## Officiële ChatGPT-koppeling bevestigd

De officiële Shopify-koppeling is nu verbonden met de juiste winkel. Een gevalideerde Admin GraphQL-query kan hiermee de geïnstalleerde apps en metafielddefinities lezen; de eerdere `ACCESS_DENIED` op de CLI-appinventaris is dus geen blokkade voor deze nieuwe koppeling. De volledige appinventaris (geen vervolgpagina) bevat **geen Shopify Search & Discovery**. Dat is een concreet ontbrekend onderdeel in de winkel, afzonderlijk van de werkende ChatGPT-koppeling.

De drie voorbereide definities zijn via de nieuwe koppeling opnieuw bevestigd. Het openbare mutationschema biedt geen installatie-operatie voor Search & Discovery en geen operatie voor het toevoegen van storefrontfilterbronnen. De activering is daarom niet uitgevoerd. Er zijn geen aanvullende productwaarden, tags, apps of filterinstellingen gewijzigd.

Benodigde beheerhandeling: installeer de gratis officiële app https://apps.shopify.com/search-and-discovery en voeg binnen Filters de bronnen Producttype, Opslagcapaciteit (GB) en Batterijconditie (%) toe. Controleer de onjuiste conditiewaarde vóór die bron geactiveerd wordt. Dit vereist geen nieuw thema of nieuwe koppelpoging van de ChatGPT-app.

Documentatie: https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering (filters moeten eerst in Shopify Admin worden aangemaakt).
