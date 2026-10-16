# Shopify-notificaties in iSelectStore-huisstijl

Status: huisstijl voorbereid; **niet opgeslagen in de live notificatie-instellingen**. De beschikbare Shopify-koppeling en Shopify CLI bieden geen ondersteunde bewerking van deze instellingen. Thema-deployments veranderen geen notificatiemails. Er zijn geen klantmails verzonden.

## Eén centrale aanpassing voor klantmails

Open [Shopify → Instellingen → Meldingen](https://admin.shopify.com/store/ggh8q9-v1/settings/notifications), kies **Klantmeldingen → E-mailtemplate aanpassen**. Upload `email-logo.png` uit het voorbereide ZIP-pakket, stel de breedte in op 240 px en kies accentkleur `#f9858b`. Bekijk de voorbeelden en sla op. Maak vooraf een kopie van de bestaande instellingen/logo. Dit geldt voor de Shopify-templates die deze centrale branding ondersteunen.

Het PNG-logo is rechtstreeks uit het officiële vectorlogo gerenderd, met transparante achtergrond, 960 px breed voor een scherpe weergave op retina-schermen. De vorm, verhoudingen en slogan zijn behouden. PNG werkt in meer mailclients dan SVG.

## Extra styling per mail

`brand.css` bevat uitsluitend presentatie: navy, koraal met witte knoptekst, rustige lijnen, afgeronde knoppen en een fontstack met Poppins en Arial/Helvetica als fallback. Poppins wordt niet extern geladen; mailclients zonder het font tonen Arial. Shopify zet CSS uit style-elementen automatisch om naar inline CSS en bewaart mediaqueries. Niet naar theme-assets verwijzen vanuit een stylesheetlink: die CSS wordt niet geïnlined.

1. Open een klantmelding, bijvoorbeeld **Bestelbevestiging**, en kies **Code bewerken**. Sla de volledige bestaande HTML op als back-up. Bewaar ook het onderwerp en eventuele vertaalde templates.
2. Voeg de inhoud van `brand.css` tussen `<style type="text/css" id="iselectstore-notification-brand">` en `</style>` toe, direct vóór `</head>`, na de bestaande CSS. Laat alle bestaande Liquid en HTML staan.
3. Of gebruik vanuit `apps/customer-portal`: `node scripts/brand-notification.mjs originele-mail.html aangepaste-mail.html`. Het script schrijft een apart bestand en overschrijft geen bestaande uitvoer. Opnieuw toepassen vervangt het eerdere merk-styleblok.
4. Plak de volledige aangepaste HTML in de Shopify-editor, bekijk de preview en stuur vanuit Shopify een testmail naar de beheerder. Controleer iPhone Mail, Gmail en Outlook voordat je opslaat. Afgeronde hoeken en fontweergave kunnen per client verschillen.
5. Herhaal voor verzendbevestiging, verzendupdates, factuur-/betaalverzoekmail, terugbetaling en annulering waar die templates bewerkbaar zijn. De originele taal, bedragen, kortingsregels, belastingregels, betaalstatus, tracking en betaal-/bestellinks blijven behouden.

Niet het volledige mailtemplate vervangen door alleen CSS. Bestaande inline `!important`-regels en custom templates kunnen aanvullende aanpassing vereisen; dat kan pas met de werkelijk geëxporteerde template worden gecontroleerd. Bewerkte notificatietemplates moeten bij wijzigingen van Shopify worden onderhouden.

## Factuur

Dit pakket kan de **Shopify-factuurmail/betaalverzoekmail** stylen. Die mail is geen automatisch aangepaste pdf-factuur. Order Printer en door Shopify Tax gegenereerde btw-facturen hebben hun eigen templates en beperkingen. Zonder vaststelling van het gebruikte factuurdocument wordt geen pdf-template vervangen, geen belastingbedrag berekend en geen factuurnummer of bedrijfs-/btw-gegeven ingevuld.

## Preview en controles

Het ZIP-pakket bevat een HTML-voorbeeld met uitsluitend fictieve previewgegevens en een PNG-logo. Het voorbeeld is **geen productie-mailtemplate** en kan geen Shopify-mail vervangen. Het transformatiescript wordt gecontroleerd op behoud van Liquid en bestaande inhoud, opnieuw toepassen, weigering van onvolledige HTML en mobiel/desktop-rendering. Dat is geen daadwerkelijke Shopify-mailtest; die volgt na import in de notificatie-editor.

Bronnen:
- [Shopify: notificatietemplates aanpassen](https://help.shopify.com/en/manual/fulfillment/setup/notifications/customizing-notification-template)
- [Shopify: beschikbare notificatievariabelen](https://help.shopify.com/en/manual/fulfillment/setup/notifications/email-variables)

Terugdraaien: zet de geëxporteerde originele HTML terug, of gebruik Shopify **Terugzetten naar → Vorige**. Dit zet centrale logo-/kleurinstellingen niet terug; wijzig die indien nodig apart.
