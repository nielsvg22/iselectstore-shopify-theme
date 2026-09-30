# iSelectStore — Shopify-thema

Dit is een werkend Shopify Online Store 2.0-thema, gebouwd op basis van de goedgekeurde HTML-demo. Volg deze stappen om het te installeren en werkend te krijgen.

## 1. Thema uploaden

1. Zip de inhoud van deze map (`shopify-theme/`) — **niet** de map zelf, maar de bestanden erin (zodat `layout/`, `sections/` etc. direct in de root van de zip staan).
2. Ga in Shopify naar **Online winkel → Thema's → Thema toevoegen → Bestand uploaden**.
3. Upload de zip en klik op **Publiceren** zodra je tevreden bent (of test eerst via "Preview").

Alternatief voor een developer: gebruik de [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) met `shopify theme push` vanuit deze map.

## 2. Metafields aanmaken (eenmalig, cruciaal)

Ga naar **Instellingen → Aangepaste gegevens → Producten** en maak deze metafields aan (namespace `custom`):

| Naam | Key | Type |
|---|---|---|
| Batterijconditie | `battery_percentage` | Geheel getal |
| Opslagcapaciteit | `storage_gb` | Geheel getal |
| Conditie | `condition` | Enkele regel tekst (bv. "Krasvrij", "Licht gebruikt", "Zeer nette staat") |
| Garantie (maanden) | `warranty_months` | Geheel getal |
| Badge-tekst | `badge_text` | Enkele regel tekst (bv. "100% batterij", "Hoge batterijconditie") |

Deze velden verschijnen daarna bij elk product en vul je per toestel in — dit is exact de "dupliceer en pas aan"-workflow die je al gewend bent vanuit WooCommerce.

## 3. Producten aanmaken

- **Elk fysiek toestel = 1 apart product** (geen varianten), want elk toestel is uniek. Gebruik Shopify's **"Dupliceren"**-knop op een bestaand product om snel een nieuwe te maken, pas titel/foto's/metafields/prijs aan.
- Zet het veld **Type** (Product type) op `iPhone`, `iPad`, `MacBook` of `Apple Watch` — dit stuurt de categorie-tabs en het filter aan.
- Zet **Voorraad = 1** per uniek toestel — de "Nog maar 1 op voorraad"-melding verschijnt dan automatisch.
- De referentiefoto's uit dit thema staan in `reference-images/` — upload deze (of vergelijkbare eigen foto's) als productafbeeldingen.

## 4. Accessoire-producten aanmaken

Maak 3 losse producten aan (kunnen "verborgen" staan, hoeven niet in de winkel getoond te worden):
- Glazen screenprotector — € 15,00
- Extra Apple oplaadkabel — € 12,50
- Apple USB-C adapter — € 15,00

Koppel deze vervolgens in **Thema-editor → Productpagina → sectie-instellingen → Accessoire 1/2/3**.

## 5. Collecties

Maak collecties aan (bv. "Alle voorraad", of per categorie) en koppel ze in de thema-editor bij:
- Header/footer-instelling **"Voorraad-collectie"**
- De **Categorieën**-sectie op de homepage (per blok een collectie kiezen)
- De **Uitgelichte producten**-sectie op de homepage

## 6. Filters op de webshop-pagina (collectiepagina)

Voor de batterij/opslag/prijs-filters op de collectiepagina: installeer de gratis Shopify-app **"Search & Discovery"** en zet daarin filtering aan op de metafields `battery_percentage`, `storage_gb` en op prijs. De collectiepagina in dit thema (`main-collection.liquid`) rendert automatisch alle filters die je daar activeert.

## 7. Pagina's aanmaken

Maak deze pagina's aan onder **Online winkel → Pagina's**, met exact deze **handle** (URL-slug):
- `faq` → gebruik template **"page.faq"**
- `contact` → gebruik template **"page.contact"**
- `originele-iphone` → gebruik template **"page.originele-iphone"**
- `ons-verhaal` → gebruik template **"page.ons-verhaal"**

(Template kiezen kan rechts in de pagina-editor onder "Thema-template".)

### Pagina "Ons verhaal"

1. **Online winkel → Pagina's → Toevoegen**: titel `Ons verhaal`, handle
   `ons-verhaal`, template **page.ons-verhaal**. Publiceren.
2. De secties (`story-hero` … `story-cta`) staan allemaal al in het template
   met Nederlandse standaardteksten. Teksten zijn aan te passen in de
   thema-editor; laat je een veld leeg, dan valt het terug op de
   standaardtekst uit `locales/nl.default.json`.
3. **Video**: bij sectie "Verhaal-video" kun je een Shopify-hosted video
   uploaden *of* een YouTube-/Vimeo-link plakken *of* een posterafbeelding
   kiezen. Zonder video toont de sectie een statische placeholder met
   uitleg — er wordt nooit iets leeg of foutiefs getoond.
4. **Homepage-CTA**: op de homepage staat tussen de producten en de
   inruil-banner het blok "Lees ons verhaal" (sectie `home-story-cta`).
   Verplaatsen of verwijderen kan in de thema-editor onder de sectie
   "Producten".

## 8. Contactformulier & nieuwsbrief

Werken direct, zonder extra instellingen:
- Het **contactformulier** stuurt automatisch een e-mail naar het adres onder **Instellingen → Algemeen → Winkelgegevens**.
- De **nieuwsbrief-aanmelding** in de footer voegt de klant toe aan je klantenlijst met tag "newsletter" — koppel dit eventueel aan Shopify Email of Klaviyo voor een echte nieuwsbrief-flow.

## 9. Belangrijk: checkout-pagina

Op het Basic/Shopify/Advanced-abonnement kun je de checkout **niet** volledig herbouwen (dat mag alleen op Shopify Plus). Je kunt 'm wel in de juiste huisstijl zetten via **Online winkel → Thema's → Aanpassen → Checkout** (of **Instellingen → Checkout → Merkinstellingen**):

- Logo: iSelectStore-logo uploaden
- Kleuren: Navy `#1f3049` als hoofdkleur, Coral `#f9858b` als accentkleur
- Lettertype: Poppins (of het dichtstbijzijnde beschikbare alternatief in de checkout-editor)

## 10. Inruil-waardeschatter & WhatsApp

De inruil-schatter (pop-up met model/conditie/geschatte waarde) werkt direct, zonder instellingen nodig. Het WhatsApp-nummer staat hardcoded op `31643295022` in `assets/theme.js` (functie `open()`) en in `sections/footer.liquid`/`sections/contact.liquid` (instelbaar via de thema-editor) — pas dit aan naar het juiste nummer.

## Wat is er anders dan de HTML-demo?

- **Winkelwagen & afrekenen** gebruiken nu Shopify's eigen, echte systeem (veilig, met iDEAL/creditcard/Klarna) in plaats van de gesimuleerde demo-versie.
- **Contactformulier & nieuwsbrief** versturen nu echt (Shopify-native), in plaats van een JS-simulatie.
- **Producten** komen uit de Shopify-catalogus (met metafields) in plaats van het `products.js`-bestand — dit maakt het toevoegen van je ~120 producten per maand net zo efficiënt als voorheen in WooCommerce, dankzij de "Dupliceren"-knop.
- **Filters** op de webshop-pagina gebruiken Shopify's native filter-engine (via Search & Discovery) in plaats van custom JavaScript — robuuster en sneller bij veel producten.
