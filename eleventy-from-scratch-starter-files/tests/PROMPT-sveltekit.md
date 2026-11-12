# Prompt: dezelfde Playwright-test op de SvelteKit-versie

Kopieer eerst deze bestanden naar je SvelteKit-project, in dezelfde mappen:
- `tests/playwright-audit.js`
- `tests/cross-browser.mjs`
- `tests/results/eleventy-info.json` (nodig voor de vergelijkingspagina)
- `tests/results/eleventy-cross-browser.json` (nodig voor de vergelijkingspagina)

Plak daarna de prompt hieronder in Claude Code, in je SvelteKit-project. Vul eerst de twee `[...]`-plekken in.

---

```
Ik vergelijk Eleventy en SvelteKit op performance en toegankelijkheid. De Eleventy-versie is al getest. Voer nu exact dezelfde tests uit op de /info-pagina van dit SvelteKit-project en schrijf de resultaten op voor mijn GitHub Wiki.

Info over dit project:
- De info-pagina staat op route: [bijv. /info]
- Adapter: [bijv. adapter-auto / adapter-static / adapter-node]

Stappen:

1. Maak een productie-build met `npm run build`. Gebruik niet de dev-server (`npm run dev`), want die levert ongebundelde code en Vite-scripts.
   - Bij adapter-static: serveer de buildmap met `python3 -m http.server 8081 --directory build`. Dat is dezelfde server als bij Eleventy, dus de eerlijkste vergelijking.
   - Bij een andere adapter: gebruik `npm run preview -- --port 8081`. Noteer dit verschil bij de beperkingen.
   Start de server op de achtergrond en controleer dat de info-pagina laadt.

2. Test A: Chromium-audit via de Playwright MCP
   a. Open `tests/playwright-audit.js`. Pas ALLEEN het CONFIG-blok aan:
      - framework: 'SvelteKit'
      - BASE_URL: 'http://localhost:8081'
      - pages: [{ name: 'Info', path: '<de route van de info-pagina>' }]
      Verander niets aan de testlogica, de profielen, het aantal runs of de axe-versie. Anders zijn de resultaten niet te vergelijken.
   b. Open met de Playwright MCP eerst de BASE_URL (browser_navigate). Voer daarna het script uit met browser_run_code_unsafe en het absolute pad naar tests/playwright-audit.js als `filename`. Sla de JSON-uitkomst op als `tests/results/sveltekit-info.json`.
   c. Zijn er axe-overtredingen, voer dan een extra axe-run uit (zelfde versie, 4.10.2) om per element de selector en de foutmelding op te halen, net als in de details van eleventy-info.json.
   d. Script-requests (JavaScript) zijn hier belangrijk. Neem het aantal en de KB per JS-bestand op in het rapport.

3. Test B: cross-browser (Chromium, Firefox, WebKit)
   a. Installeer Playwright als devDependency in exact dezelfde versie als bij Eleventy, plus de browsers:
      `npm i -D playwright@1.65.0 && npx playwright install chromium firefox webkit`
   b. Voer het script uit, zonder het aan te passen:
      `node tests/cross-browser.mjs SvelteKit http://localhost:8081 <de route van de info-pagina>`
      Het script schrijft `tests/results/sveltekit-cross-browser.json` en screenshots naar `tests/results/screenshots/`.
   c. Bekijk de screenshots van het mobiele menu per browser en meld visuele verschillen tussen de browsers.

4. Schrijf `tests/results/Playwright-test-SvelteKit.md` in precies dezelfde opbouw, kopjes en tabellen als de Eleventy-wikipagina (de structuur van eleventy-info.json en eleventy-cross-browser.json). Dus:
   - Een kop-tabel met framework + versie, pagina, datum, build, browser, metingen en testscripts.
   - Testprofielen, Samenvatting, 1. Performance, 2. Netwerk, 3. Toegankelijkheid (met Structuur), 4. Toetsenbordnavigatie, 5. Mobiel menu, 6. Zonder JavaScript, 7. Cross-browser, Beperkingen van deze test.
   - Bij Netwerk een extra tabel met alle JavaScript-bestanden en hun grootte.
   - Bij "Zonder JavaScript": geef duidelijk aan wat er wel en niet werkt zonder JS (content, mobiel menu, formulier).
   - Bij Cross-browser: één tabel met een kolom per browser. Leg uit waarom WebKit met Alt+Tab getest is (Safari springt met Tab standaard alleen langs formuliervelden) en dat CLS in Firefox en WebKit niet meetbaar is.
   - Leg bij opvallende cijfers kort uit waar ze vandaan komen, net als in de Eleventy-pagina.
   - Schrijf in het Nederlands. De lezers zijn medestudenten en docenten.

5. Schrijf ook `tests/results/Vergelijking-Eleventy-vs-SvelteKit.md`, op basis van de vier JSON-bestanden:
   - Een tabel met per meting de waarde voor Eleventy, voor SvelteKit en het verschil. Neem op: TTFB, FCP, LCP, CLS, DOMContentLoaded en Load (desktop en mobiel), requests, KB totaal, KB JavaScript, KB CSS, KB fonts, DOM-elementen, axe-overtredingen, elementen zonder zichtbare focus, skip link, mobiel menu met en zonder JS, en content zonder JS.
   - Een cross-browser-tabel: per browser (Chromium, Firefox, WebKit) de FCP en Load, en of skip link, menu en no-JS werken, voor Eleventy en SvelteKit naast elkaar.
   - Een korte conclusie per onderwerp (performance, toegankelijkheid, werking zonder JS, browserondersteuning). Benoem welke verschillen door het framework komen en welke door verschillen in de code of assets (bijv. fonts die in beide ontbreken).
   - Beperkingen: lokale server, gesimuleerde vertraging en verschillen in serveermethode.

6. Stop de server als je klaar bent en geef me een korte samenvatting van de belangrijkste verschillen.
```
