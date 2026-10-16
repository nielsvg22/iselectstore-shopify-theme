# Desktophero

De homepagehero volgt vanaf 981 px de aangeleverde richting: tekst links,
grote iPhone-presentatie rechts, witte achtergrond met zachte koraalbogen,
bestaande Poppins-typografie en koraalknoppen met witte tekst.

Bestanden: `sections/hero.liquid`, `assets/hero-desktop.css` en
`assets/hero-iphone-desktop.webp` (circa 45 KB). De productvisual is een
promotionele studiocompositie, gemaakt met beeldbewerking op basis van
Apple's iPhone 16 Pro-persbeeld:
https://www.apple.com/newsroom/images/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/article/Apple-iPhone-16-Pro-hero-240909_inline.jpg.large.jpg
Het is geen foto van een individueel voorraadtoestel. De originele bron en
gegenereerde werkbestanden zijn niet als grote themabestanden toegevoegd.

In de Theme Editor staat onder Hero een optionele **Desktop productvisual**.
Zonder eigen afbeelding wordt de geoptimaliseerde standaardvisual gebruikt.
Een afbeelding met een witte of transparante achtergrond past het beste.
De bestaande instelling **Hero-afbeelding** blijft voor de mobiele weergave.
Teksten, links, reviewscore en reviewaantal zijn niet gewijzigd.

De desktop-CSS is uitsluitend actief vanaf 981 px. Een `<picture>`-source
met dezelfde mediaquery voorkomt het downloaden van de desktopvisual op
mobiel. De afbeelding is decoratief: schermlezers krijgen geen dubbele
marketingtekst. Er is geen nieuw JavaScript of animatie toegevoegd.

`node apps/customer-portal/scripts/desktop-hero-browser.mjs` rendert de echte
Liquid en controleert 320/390/768/980/981/1024/1440/1766/1920 px, de witte
knoptekst, de gescheiden desktopkolommen, afbeeldingsdownload en ontbrekende
overflow/JavaScript-fouten. Tot 980 px worden de afmetingen van titel,
introductie, knoppen, reviews en de volledige hero vergeleken met de versie
vóór deze wijziging. De mobiele geometrie is gelijk. Screenshots en de
live-backup staan in de genegeerde map `artifacts/desktop-hero*`.

Officiële themevalidatie van de sectie: geen fouten; contextwaarschuwingen
over `section` in de lokaal gecachete Shopify-documentatie. De storefront is
wachtwoordbeschermd. Livepublicatie wordt daarom ook gecontroleerd door de
drie bestanden uit het gepubliceerde thema terug te lezen en te vergelijken.
