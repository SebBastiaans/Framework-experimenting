# Prompt: de tests uitvoeren op een nieuw framework

Kopieer eerst de map `tests/` uit dit project naar het project van het nieuwe framework. Je hebt nodig:
- `tests/scripts/`: beide testscripts
- `tests/results/`: de resultaten van alle frameworks die al getest zijn (nodig voor de vergelijking)

Plak daarna de prompt hieronder in Claude Code, in het project van het nieuwe framework. Vul eerst de `[...]`-plekken in.

Kopieer na afloop de nieuwe map `tests/results/<framework>/` en de bijgewerkte `tests/results/vergelijking/` terug naar dit project. Zo blijft alles op één plek.

---

```
Ik vergelijk frameworks op performance en toegankelijkheid. In tests/results/ staan de resultaten van de frameworks die ik al getest heb, elk in een eigen map. Voer nu exact dezelfde tests uit op de /info-pagina van dit project en schrijf de resultaten op voor mijn GitHub Wiki.

Info over dit project:
- Framework + versie: [bijv. Astro 5]
- De info-pagina staat op route: [bijv. /info]
- Bijzonderheden: [bijv. adapter, rendermodus (static/SSR), of "geen"]

Gebruik in alle paden en bestandsnamen de framework-naam in kleine letters, zonder spaties. Die noem ik hieronder <slug>, bijv. "astro".

Stappen:

1. Maak een productie-build. Gebruik niet de dev-server, want die levert ongebundelde code en extra dev-scripts.
   - Levert de build statische bestanden op, serveer die map dan met `python3 -m http.server 8081 --directory <buildmap>`. Dat is dezelfde server als bij Eleventy, dus de eerlijkste vergelijking.
   - Heeft het framework een server nodig (SSR), gebruik dan het eigen preview- of start-commando op poort 8081. Noteer dit verschil bij de beperkingen.
   Start de server op de achtergrond en controleer dat de info-pagina laadt.

2. Test A: Chromium-audit via de Playwright MCP
   a. Open `tests/scripts/playwright-audit.js`. Pas ALLEEN het CONFIG-blok aan:
      - framework: '<Framework-naam>'
      - BASE_URL: 'http://localhost:8081'
      - pages: [{ name: 'Info', path: '<de route van de info-pagina>' }]
      Verander niets aan de testlogica, de profielen, het aantal runs of de axe-versie. Anders zijn de resultaten niet te vergelijken.
   b. Open met de Playwright MCP eerst de BASE_URL (browser_navigate). Voer daarna het script uit met browser_run_code_unsafe en het absolute pad naar tests/scripts/playwright-audit.js als `filename`. Sla de JSON-uitkomst op als `tests/results/<slug>/<slug>-info.json`.
   c. Zijn er axe-overtredingen, voer dan een extra axe-run uit (zelfde versie, 4.10.2) om per element de selector en de foutmelding op te halen. Zet die als "details" in de JSON, net als in tests/results/eleventy/eleventy-info.json.
   d. Neem het aantal JavaScript-bestanden en de KB per bestand op in het rapport.

3. Test B: cross-browser (Chromium, Firefox, WebKit)
   a. Installeer Playwright als devDependency in exact dezelfde versie als bij de andere frameworks, plus de browsers:
      `npm i -D playwright@1.65.0 && npx playwright install chromium firefox webkit`
   b. Voer het script uit, zonder het aan te passen:
      `node tests/scripts/cross-browser.mjs <Framework-naam> http://localhost:8081 <de route van de info-pagina>`
      Het script schrijft `tests/results/<slug>/<slug>-cross-browser.json` en screenshots naar `tests/results/<slug>/screenshots/`.
   c. Bekijk de screenshots van het mobiele menu per browser en meld visuele verschillen tussen de browsers.

4. Schrijf `tests/results/<slug>/Playwright-test-<Framework-naam>.md`. Gebruik precies dezelfde opbouw, kopjes en tabellen als tests/results/eleventy/Playwright-test-Eleventy.md:
   - Een kop-tabel met framework + versie, pagina, datum, build, browser, metingen en testscripts.
   - Testprofielen, Samenvatting, 1. Performance, 2. Netwerk, 3. Toegankelijkheid (met Structuur), 4. Toetsenbordnavigatie, 5. Mobiel menu, 6. Zonder JavaScript, 7. Cross-browser, Beperkingen van deze test.
   - Bij Netwerk een extra tabel met alle JavaScript-bestanden en hun grootte (als die er zijn).
   - Bij "Zonder JavaScript": geef duidelijk aan wat er wel en niet werkt zonder JS (content, mobiel menu, formulier).
   - Leg bij opvallende cijfers kort uit waar ze vandaan komen.
   - Schrijf in het Nederlands. De lezers zijn medestudenten en docenten.

5. Maak of werk bij: `tests/results/vergelijking/Vergelijking-frameworks.md`. Dit is de vergelijking van ALLE geteste frameworks: lees alle mappen in tests/results/ (behalve vergelijking/) en gebruik hun JSON-bestanden.
   - Hoofdtabel met één kolom per framework. Neem op: TTFB, FCP, LCP, CLS, DOMContentLoaded en Load (desktop en mobiel), requests, KB totaal, KB JavaScript, KB CSS, KB fonts, DOM-elementen, axe-overtredingen, elementen zonder zichtbare focus, skip link, mobiel menu met en zonder JS, en content zonder JS. Markeer per rij de beste waarde vetgedrukt.
   - Een cross-browser-tabel: per browser (Chromium, Firefox, WebKit) de FCP en Load, en of skip link, menu en no-JS werken, voor elk framework.
   - Een tabel met per framework de versie, de serveermethode en de rendermodus.
   - Een korte conclusie per onderwerp (performance, toegankelijkheid, werking zonder JS, browserondersteuning). Benoem welke verschillen door het framework komen en welke door verschillen in de code of assets.
   - Beperkingen: lokale server, gesimuleerde vertraging en verschillen in serveermethode.
   Laat de bestaande vergelijkingspagina's in tests/results/vergelijking/ ongewijzigd.

6. Stop de server als je klaar bent en geef me een korte samenvatting: hoe verhoudt dit framework zich tot de andere?
```
