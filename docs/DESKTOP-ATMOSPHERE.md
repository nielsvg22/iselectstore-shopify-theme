# Rustigere desktopsfeer

De uitbreiding gebruikt uitsluitend bestaande merkkleuren en beeldmateriaal
uit de winkel. `desktop-atmosphere.css` wordt door de storefront-layout
geladen. Alle visuele aanpassingen gelden vanaf 981 px; `data-store-page`
houdt de achtergrondwisselingen gericht op homepage en informatiepagina's.
De eerder goedgekeurde hero blijft behouden.

- Homepage: wit/ivoor, een zachte blauwgrijze achtergrond bij de bewijsfoto's
  en rustige scheiding tussen assortiment, bewijs en verhaal.
- Bewijsfoto's: op desktop de bestaande productfoto van een toestel in
  handschoenen, naast de bestaande tekst en batterijafbeelding.
- Ons verhaal: bestaand iSelectStore-merkbeeld links, tekst en bestaande
  verhaal-CTA rechts. De mobiele kaart blijft behouden.
- Interacties: beperkte kaartlift, geringe categoriezoom en een korte
  verschijningsovergang. `prefers-reduced-motion` maakt de content direct
  zichtbaar en zet deze effecten uit. Er is geen nieuw JavaScript.

De beelden komen uit de bestaande Shopify-bestanden:
`IMG_9281-scaled_05a5f166-f8a5-474a-9af6-a1631fe05699.jpg` en
`iselectstore-unboxing-navy.jpg`. De eerste is een productfoto, de tweede
een merkpresentatie; ze worden niet als nieuw gemaakte werkplaatsfoto's
gepresenteerd. Eigen werkplaats-/reinigingsfotografie kan via **Bewijsfoto's →
Desktop foto werkwijze** worden gekozen. **Homepage — Ons verhaal → Desktop
verhaalfoto** vervangt het merkbeeld. Ontbreekt een gekozen/defaultfoto,
dan blijft de bestaande sectie bruikbaar. De afbeeldingsbronnen zijn lazy
en via een desktopmediaquery afgebakend; mobiel laadt de extra foto's niet.

Validatie: `atmosphere-browser.mjs` controleert 320–1920 px, vergelijking van
mobiele geometrie met commit 960cd63, afbeeldingsrequests, verhaalbestemming,
witte knoptekst, hover en minder beweging. `brand-browser.mjs` controleert
met de nieuwe CSS negen paginatypen op vijf breedtes, inclusief header,
navigatie en winkelformulieren. Beide slagen. De officiële themavalidatie
voor beide secties en beide taalbestanden slaagt. De bestaande twee
`push`-filtermeldingen in de layout vallen buiten deze wijziging.

Back-up en screenshots staan lokaal in `artifacts/atmosphere*`. Publicatie
gebeurt gericht, zonder verwijderingen of wijziging van homepage-instellingen.
De winkel is wachtwoordbeschermd; livecontrole omvat het teruglezen en
vergelijken van de gepubliceerde bestanden.
