# GitHub-pushverbinding

Repository: `nielsvg22/iselectstore-shopify-theme`. Alleen deze repository wordt voor iSelectStore Shopify gebruikt.

## Herstel op 16 oktober 2026

Het GitHub-account had pushrechten, maar de gekoppelde app had geen toegankelijke installatie voor het account. Zowel Git als de GitHub-API weigerde schrijfacties met HTTP 403 (`Resource not accessible by integration`, vereiste permissie `contents=write`). Opnieuw aanmelden bij GitHub CLI alleen loste dit niet op.

Na autorisatie van de officiële **ChatGPT Codex Connector** verscheen de installatie en werkte een echte Git-push. De verbinding gebruikt de door de omgeving aangeboden GitHub-authenticatie; er staan geen tokens of wachtwoorden in de repository of remote-URL.

De lokale geschiedenis en de door Shopify geschreven GitHub-commits zijn normaal samengevoegd. De 119 bestaande themabestanden zijn gecontroleerd tegen een verse download van het gepubliceerde Shopify-thema. Huidige Shopify-template-instellingen zijn behouden. De lokale branch `backup/github-sync-20261016` bewaart de toestand vóór het samenvoegen. Een force-push is niet nodig.

## Normale werkwijze

```sh
git status --short
git pull --no-rebase origin main
git push origin main
```

`pull.rebase=false` is lokaal ingesteld, zodat normale pulls uiteenlopende geschiedenis samenvoegen. Controleer wijzigingen en eventuele conflicten vóór publiceren. GitHub is aan Shopify gekoppeld; een push naar `main` kan het live thema bijwerken.

## Als schrijven opnieuw wordt geweigerd

1. Controleer `gh auth status`, `git remote -v` en de actuele foutmelding. Alleen kunnen lezen of `permissions.push=true` zien bewijst niet dat de app mag schrijven.
2. Controleer in [GitHub-appinstallaties](https://github.com/settings/installations) of de ChatGPT Codex Connector toegang heeft tot deze repository en eventuele nieuwe rechten zijn geaccepteerd.
3. Installeer of herstel zo nodig de [officiële connector](https://github.com/apps/chatgpt-codex-connector/installations/new). Geef alleen de repositories toegang die nodig zijn.
4. Test met een echte push naar een tijdelijke branch en lees de remote commit terug. Ruim de testbranch daarna op. Maak geen wijzigingen in een andere iSelectStore-repository.

Gebruik geen tokens in de Git-URL of in chatberichten. Een token uit een andere dienst of een andere netwerkrouting is geen oplossing voor ontbrekende apprechten.
