# Vertalingen — iSelectStore Shopify theme

Dit document beschrijft hoe de storefront volledig vertaalbaar is gemaakt met
**uitsluitend Shopify-native mechanismes**: locale-bestanden, Liquid `| t`,
Shopify Markets / het localization-formulier en Translate & Adapt.

---

## 1. Waar staan de vertalingen?

| Wat | Bestand |
| --- | --- |
| Alle vaste theme-teksten (NL = standaardtaal) | `locales/nl.default.json` (230 sleutels, 24 groepen) |
| Engelse vertaling (referentie + Markets) | `locales/en.json` (identieke sleutelparentiteit) |
| Teksten die JS nodig heeft (trade-in, voorraadfouten) | `layout/theme.liquid` → `window.themeStrings` (gevuld via `\| t`) |
| Merchant content (teksten die je in de theme editor invult) | `templates/*.json` → via **Translate & Adapt** |
| Shop content (producten, collecties, pagina's, menu's) | Shopify admin → **Translate & Adapt** |
| Instellingen (logo, kleuren, nummers, backend-URL) | `config/settings_schema.json` — geen vertaling nodig |

Groepen: `general`, `products`, `cart`, `header`, `footer`, `featured_products`,
`hero`, `reviews_slider`, `product_card`, `collection`, `product_page`,
`cart_page`, `search_page`, `errors`, `featured_categories`, `trade_in`,
`webwinkelkeur`, `contact`, `faq`, `authenticity`, `password_page`,
`inventory_notify`, `whatsapp_float`, `language_selector`.

## 2. Drie soorten tekst — drie aanpakken

1. **Vaste theme-copy** (koppen, labels, knoppen, breadcrumbs, placeholders,
   aria-labels, foutmeldingen): hardcoded vervangen door `'sleutel' | t` en de
   Nederlandse tekst in `locales/nl.default.json`, de Engelse in `en.json`.
2. **Inline `| default:`-teksten in Liquid**: zijn *niet* vertaalbaar. Ze zijn
   verplaatst naar de locale, met een Liquid-fallback vóór de instelling:
   `{% assign x = 'sleutel' | t %}` → `{{ section.settings.x | default: x }}`.
   De merchant kan de instelling nog steeds overschrijven (en die waarde is
   via Translate & Adapt aanpasbaar).
3. **Merchant content in templates** (categorieën, reviews, trust-balk,
   FAQ-antwoorden, authenticiteitsstappen zodra ze zijn ingevuld): blijft staan
   en wordt vertaald via **Translate & Adapt**. Sectie-blocks die de merchant
   niet invult vallen terug op een **index-gebaseerde locale-key**
   (`faq.items.1.question`, `authenticity.steps.3.text`, …), zodat er altijd
   géén tekst ontbreekt én Translate & Adapt ze kan vertalen.

Schema-`default.blocks`-instellingen (de Nederlandse voorbeeldfall-back van
FAQ/authenticiteit) zijn verwijderd; `templates/page.faq.json` en
`templates/page.originele-iphone.json` bevatten nu expliciete lege blocks die
op de locale terugvallen.

## 3. Slogan — nooit vertalen

**"selected by us, ready for you"** staat bewust als *literal* in Liquid en
komt **niet** in de locale-bestanden voor:

- `sections/hero.liquid` → `eyebrow | default: "selected by us, ready for you"`
- `sections/main-password-header.liquid` → hardgecodeerde regel
- `sections/rich-text.liquid` → optie **Toon slogan** (`show_tagline`) voegt de
  Engelstalige `<span class="slogan">` vóór de eerste `</p>` in; de
  homepage-tekst in `templates/index.json` bevat de slogan daarom niet meer.

In elke taal blijft de slogan dus exact Engels. "Only the good ones."
(wachtwoordpagina) is wél een vertaalbare key (`password_page.title_line_1/2`)
met Engelse tekst als standaard in beide bestanden.

## 4. Taalkeuze (Shopify Markets)

- `sections/language-selector.liquid` gebruikt het officiële
  `{% form 'localization' %}` met `locale_code` en toont alleen iets als
  `shop.enabled_locales.size > 1`.
- Het sectieblok staat statisch in `layout/theme.liquid` vóór de footer.
- Labels komen uit `language_selector.label` / `.button`.
- Publiceer een taal via Shopify admin → **Instellingen → Talen** (of
  Translate & Adapt → taal toevoegen). Daarna verschijnt de keuzelijst
  automatisch; de cookie/`return_to`-doorverwijzing doet Shopify zelf.

## 5. Overzicht gelokaliseerde bestanden

Secties: `header` (USP-balk), `contact`, `faq`, `authenticity`,
`featured-categories`, `featured-products`, `hero`, `reviews`,
`trade-in-banner`, `webwinkelkeur`, `main-page`, `main-collection`
(prijsplaceholders), `main-password-header`, `rich-text` (slogan),
`language-selector`, `footer` (brand-tekst).

Snippets: `inventory-notification-form`, `whatsapp-float`.

Layout: `theme.liquid` (`window.themeStrings` + taalsectie).
Assets: `theme.js` (trade-in-modal, geldnotatie via
`Intl.NumberFormat(window.themeStrings.locale)`).

Niet-gelokaliseerd en bewust zo gelaten: merk-/productnamen
(`iSelectStore`, `Apple`, `iPhone 13–16`, `WhatsApp`, `WebwinkelKeur`),
numerieke voorbeelden (`9,8/10`, `607+`), `data-cat="Alle"` (filterwaarde in
JS, het zichtbare label is wél vertaald), instellingslabels in
`config/settings_schema.json` (alleen zichtbaar in de Shopify-admin).

## 6. Voorraadmeldingen → backend-codes

`POST /api/inventory/subscribe` (Iselectstore-marktplaats-) retourneert naast
`error`/`message` nu een **`code`**: `invalid_email` · `invalid_product` ·
`unrecognized_product` · `ok` · `error`.

De storefront toont de boodschap uit `inventory_notify.errors.*` via
`window.themeStrings.inventoryErrors[code]` en valt terug op
`data.error` / `data.message` / `inventory_notify.errors.generic`. Zo komt de
melding altijd uit de actieve taal, niet uit de backend.

## 7. Nieuwe tekst toevoegen — checklist

1. Voeg de sleutel toe aan **beide** `locales/nl.default.json` én
   `locales/en.json` (exact dezelfde structuur, 2-ruimtes inspringen).
2. Gebruik hem in Liquid: `{{ 'groep.sleutel' | t }}`; als default bij een
   instelling: `{% assign d = 'groep.sleutel' | t %}` + `| default: d`.
3. Pas `layout/theme.liquid` (`window.themeStrings`) aan als JS de tekst nodig
   heeft — gebruik de leaf-keys, nooit een groep.
4. Valideer (zie §8) en commit in het vaste formaat:
   `feat: …` / `fix: …`.

## 8. Validatie

```bash
python3 - <<'PY'   # JSON + nl/en-pariteit + ontbrekende/ongebruikte keys
import re, json, glob, collections
def load(f):
    s = open(f).read()
    if s.lstrip().startswith("/*"): s = re.sub(r'^/\*.*?\*/', '', s, flags=re.S)
    return json.loads(s)
nl, en = load("locales/nl.default.json"), load("locales/en.json")
def leaves(o, p=""):
    out = []
    if isinstance(o, dict):
        for k, v in o.items(): out += leaves(v, f"{p}.{k}" if p else k)
    else: out.append(p)
    return out
print("pariteit:", set(leaves(nl)) == set(leaves(en)), "| keys:", len(leaves(nl)))
missing = [k for f in glob.glob("sections/*.liquid") + glob.glob("snippets/*.liquid")
           + glob.glob("layout/*.liquid") + glob.glob("templates/*.liquid")
           for k in re.findall(r"['\"]([a-z0-9_.]+)['\"]\s*\|\s*t\b", open(f).read())
           if k not in leaves(nl)]
print("ontbrekend:", sorted(set(missing)) or "none")
PY

node --check assets/theme.js   # JS-syntaxis
shopify theme check            # Liquid/JSON-lint (verwacht alleen de bestaande
                               # waarschuwingen: RemoteAsset, OrphanedSnippet,
                               # ImgWidthAndHeight)
```

Verwachte uitkomst: `pariteit: True`, `ontbrekend: none`, `theme check` → 6
bestaande offenses (geen van alle in deze wijzigingen).

## 9. Bekende beperkingen

- De shop staat achter een **wachtwoord**, dus live renderen is niet te
  verifiëren; controle gebeurt hierboven + `shopify theme check`.
- Opgeslagen sectiewaarden in de theme editor overschrijven de locale-default;
  die zijn via Translate & Adapt aanpasbaar of moeten leeggemaakt worden.
- `locales/nl.default.json` is de *default* locale (shopinstelling "Nederlands");
  `en.json` moet bij elke wijziging identiek bijgehouden worden.
