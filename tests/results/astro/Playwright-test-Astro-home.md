# Playwright-test: Astro (homepage)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de homepage (`/`) in de **Astro**-versie. Het is exact dezelfde test als op de Eleventy-, SvelteKit- en Next.js-versie, zodat we de frameworks kunnen vergelijken op performance, toegankelijkheid en browserondersteuning. De vergelijking zelf staat op [Vergelijking frameworks](Vergelijking-frameworks).

| | |
|---|---|
| **Framework** | Astro 7.4.13 (Vite 8.3.8), statische output, geen integraties |
| **Pagina** | `/` (homepage) |
| **Datum** | 23 november 2026 |
| **Build** | Productie-build (`npm run build`), geserveerd met `python3 -m http.server 8081 --directory dist` |
| **Data** | 4 websites uit Directus, opgehaald tijdens de build |
| **Browser** | Chromium via Playwright MCP (hoofdstuk 1–6), plus Chromium, Firefox en WebKit via Playwright (hoofdstuk 7) |
| **Metingen** | 5 runs per profiel, mediaan gerapporteerd, cache leeg bij elke run, niet ingelogd |
| **Testscripts** | `tests/scripts/playwright-audit.js` en `tests/scripts/cross-browser.mjs` |

## Testprofielen

| Profiel | Viewport | CPU | Netwerk |
|---|---|---|---|
| Desktop | 1280 × 800 | geen vertraging | geen beperking (localhost) |
| Mobiel | 390 × 844 | 4× vertraagd | "Slow 4G": 150 ms latency, 1,6 Mbit/s down |

Het mobiele profiel gebruikt dezelfde instellingen als Lighthouse mobiel.

## Samenvatting

| Onderdeel | Resultaat |
|---|---|
| JavaScript naar de browser | **0 KB** (geen enkel script) |
| Totale paginagrootte | 732,7 KB, waarvan 679,6 KB fonts (93%) |
| LCP mobiel | 608 ms |
| CLS mobiel | 0,009 |
| axe-overtredingen | 0 |
| Werkt zonder JavaScript | Ja: content, mobiel menu en formulieren. Alleen de knoppen op de kaarten doen niets (met of zonder JS) |
| Toetsenbord | Skip link werkt, mobiel menu volledig bedienbaar, 12 knoppen zonder zichtbare focus |
| Horizontaal scrollen op mobiel | Ja |

De Astro-versie levert vrijwel dezelfde pagina op als Eleventy: dezelfde 200 DOM-elementen, dezelfde 16 requests, geen JavaScript. Het enige meetbare verschil is dat de HTML iets kleiner is (zie hoofdstuk 2).

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 2 ms | 151 ms |
| FCP (First Contentful Paint) | 88 ms | 536 ms |
| LCP (Largest Contentful Paint) | 88 ms | 608 ms |
| CLS (Cumulative Layout Shift) | 0,006 | 0,009 |
| DOMContentLoaded | 9 ms | 275 ms |
| Load event | 44 ms | 4119 ms |
| Aantal DOM-elementen | 200 | 200 |

De pagina bevat geen JavaScript, dus Total Blocking Time is niet gemeten: daar is niets om te meten.

**Waar de cijfers vandaan komen:**
- **Geen JavaScript:** Astro rendert de componenten (`.astro`-bestanden) tijdens de build naar gewone HTML. Er gaat alleen JavaScript naar de browser als je een component expliciet interactief maakt met een `client:`-directive. Op deze homepage gebeurt dat nergens.
- **Bijna gelijk aan Eleventy:** het verschil met Eleventy is op alle tijden maximaal 12 ms. Dat valt binnen de meetruis. Desktop-FCP is bij Astro 88 ms en bij Eleventy 76 ms, maar in de cross-browser-test zijn ze in Chromium allebei precies 24 ms.
- **Load mobiel (4,1 s):** net als bij de andere frameworks vooral de 680 KB aan `.woff`-fonts over Slow 4G. FCP en LCP blijven laag, omdat `font-display: swap` de tekst eerst in een systeemfont toont.
- **LCP mobiel iets later dan FCP:** waarschijnlijk door de partnerlogo's, die van een externe dienst komen (zie hoofdstuk 2).

## 2. Netwerk

| Type | Requests | Grootte |
|---|---|---|
| HTML | 1 | 24,7 KB |
| CSS | 4 | 20,6 KB |
| JavaScript | 0 | 0 KB |
| Afbeeldingen (partnerlogo's) | 4 | 7,1 KB (mobiel) / 8,2 KB (desktop) |
| Fonts | 6 (3 geslaagd, 3 × 404) | 679,6 KB |
| Overig (favicon, 404) | 1 | 0,6 KB |
| **Totaal** | **16** | **732,7 KB** |

**JavaScript-bestanden:** geen.

**HTML 1,1 KB kleiner dan bij Eleventy (24,7 tegenover 25,8 KB):** Astro haalt bij het bouwen standaard de witruimte tussen HTML-tags weg (`compressHTML`). De inhoud is gelijk: dezelfde elementen, dezelfde inline SVG-iconen. Op een pagina van 733 KB maakt dat in de praktijk niets uit.

**CSS in 4 bestanden:** de CSS staat in `public/css/` en wordt met gewone `<link>`-tags geladen, net als bij Eleventy. Astro bundelt die bestanden daarom niet. Zou je de CSS importeren in een component (`import '../styles/global.css'`), dan voegt Astro ze samen tot minder bestanden en zou dit vergelijkbaar worden met Next.js (1 bestand).

**Mislukte requests (404):**
- `/fonts/fira-sans/FiraSans-Medium.woff2`, `-Regular.woff2`, `-Bold.woff2`: de CSS verwijst eerst naar `.woff2`-bestanden die niet bestaan, daarna valt de browser terug op `.woff`. Dezelfde CSS als bij Eleventy, dus dezelfde 404's.
- `/favicon.ico`: er is geen favicon. Ook gelijk aan Eleventy.

Dit komt door de overgenomen assets, niet door Astro.

De partnerlogo's komen van de favicon-dienst van Google, net als bij de andere versies. Het zijn de enige requests naar een andere server.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 43 | 41 |
| Overtredingen | 0 | 0 |
| Handmatig na te kijken | 0 | 0 |

axe vindt geen overtredingen. Er was dus geen extra axe-run voor details nodig. Precies dezelfde aantallen als bij Eleventy. Het ontbreken van een zichtbare focus (hoofdstuk 4) en het horizontaal scrollen (hieronder) ziet axe niet. Die problemen zijn er wel.

### Structuur

| Check | Resultaat |
|---|---|
| `lang`-attribuut | `nl` |
| `<title>` | "Home" |
| Aantal `<h1>` | 1 (visueel verborgen: "Home pagina") |
| Koppenvolgorde | h1 > h2 > h2 > h2 > h2 (een h2 per partnerkaart) |
| Landmarks | `header`: 1, `nav`: 1 (desktop) / 0 zichtbaar (mobiel, achter het menu), `main`: 1, `footer`: 0 |
| Afbeeldingen zonder `alt` | 0 |
| Horizontaal scrollen | Desktop: nee. Mobiel (390 px): **ja** |

Op mobiel is de pagina breder dan het scherm: op de screenshots lopen de partnerkaarten rechts buiten beeld (de verwijderknop valt half weg). Dit valt onder WCAG 1.4.10 (Reflow). De CSS is overgenomen van Eleventy, dat hetzelfde probleem heeft.

## 4. Toetsenbordnavigatie (desktop)

| # | Element | Zichtbare focus |
|---|---|---|
| 1 | Skip link "Jump directly to main content" | ✅ |
| 2 | Logo ("ga naar homepagina") | ✅ |
| 3 | Home | ✅ |
| 4 | Info | ✅ |
| 5 | Website toevoegen (+) | ✅ |
| 6 | Zoekveld | ✅ |
| 7 | Filter pagina | ✅ |
| 8 | Sorteer op (select) | ✅ |
| 9 | Toepassen | ✅ |
| 10 | Kaart "GVB" (link) | ✅ |
| 11–13 | start audit / bewerk / verwijder GVB | ❌ |
| 14 | Kaart "Angular" (link) | ✅ |
| 15–17 | start audit / bewerk / verwijder Angular | ❌ |
| 18 | Kaart "Fdnd" (link) | ✅ |
| 19–21 | start audit / bewerk / verwijder Fdnd | ❌ |
| 22 | Kaart "Rijksoverheid" (link) | ✅ |
| 23–25 | start audit / bewerk / verwijder Rijksoverheid | ❌ |

De Tab-volgorde is precies gelijk aan die van Eleventy en Next.js.

- **Skip link:** de eerste Tab-stop. Enter verplaatst de focus naar `<main>` (`id="main-content"`, `tabindex="-1"`). ✅
- **Knoppen op de kaarten zonder focusstijl:** de reset `button { outline: inherit }` in `global.css` haalt de outline weg. Het gaat om 3 knoppen per kaart, dus 12 in totaal. Dezelfde oorzaak en hetzelfde aantal als bij de andere frameworks: de CSS is overgenomen.
- **Volgorde:** de Tab-volgorde volgt de visuele volgorde: header, sub-header (toevoegen, zoeken, filter, sorteren, toepassen) en daarna de kaarten.
- **Skip link in het Engels:** de tekst staat in het Engels op een Nederlandse pagina (`lang="nl"`), net als bij Eleventy.

## 5. Mobiel menu (hamburger)

Gebouwd met de Popover API (`popover="auto"` en `popovertarget` in `Hamburger.astro`), zonder JavaScript.

| Check | Met JS | Zonder JS |
|---|---|---|
| Menuknop gevonden en zichtbaar | ✅ | ✅ |
| Opent met Enter | ✅ | ✅ |
| Tab gaat het menu in (naar "close menu") | ✅ | ✅ |
| Sluit met Escape | ✅ | ✅ |
| Focus terug naar menuknop na sluiten | ✅ | ✅ |
| `aria-expanded`-attribuut in HTML | geen | geen |

Er staat geen `aria-expanded` in de HTML. Chromium leidt de open/dicht-status zelf af uit `popovertarget` en geeft die door aan screenreaders. Controleer dit handmatig met VoiceOver.

## 6. Zonder JavaScript

| Check | Resultaat |
|---|---|
| Tekst in `<main>` | 168 tekens (alle kaarten en bedieningselementen) |
| Koppen | 5 |
| Links | 11 |
| Content (partnerkaarten) | ✅ werkt: de kaarten staan in de HTML, want Astro rendert de pagina tijdens de build |
| Mobiel menu | ✅ werkt (Popover API) |
| Filtermenu (popover) | ✅ opent (zelfde Popover API), niet verder getest |
| Zoeken, filteren, sorteren | ✅ verstuurbaar: het zijn gewone `GET`-formulieren. De pagina doet nog niets met de keuze, met of zonder JS |
| Links (menu, kaarten) | ✅ werken als gewone `<a href>` |
| Audit starten, bewerken, verwijderen | ❌ doen niets, maar ook niet **met** JS: het zijn `<button type="button">` zonder handler. Nog niet gebouwd |

Met en zonder JavaScript is de pagina identiek, omdat er geen JavaScript is. De cijfers (168 tekens, 5 koppen, 11 links) zijn gelijk aan die van Eleventy en Next.js.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| TTFB | 2 ms | 2 ms | 2 ms |
| FCP | 24 ms | 42 ms | 27 ms |
| LCP | 92 ms | 107 ms | 120 ms |
| CLS | 0,009 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 6 ms | 7 ms | 11 ms |
| Load | 99 ms | 100 ms | 117 ms |
| Requests | 19 | 19 | 19 |
| JavaScript-bestanden | 0 | 0 | 0 |
| Mislukte requests | 3 (`.woff2`) | 3 (`.woff2`) | 3 (`.woff2`) |
| axe-overtredingen desktop | 0 | 0 | 0 |
| axe-overtredingen mobiel | 0 | 0 | 0 |
| Tab-stops | 25 | 25 | 25 (Alt+Tab) |
| Zonder zichtbare focus | 12 kaartknoppen | 12 kaartknoppen | 12 kaartknoppen |
| Skip link werkt | ✅ | ✅ | ✅ |
| Popover API ondersteund | ✅ | ✅ | ✅ |
| Menu opent met Enter / sluit met Escape | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ |
| Focus terug naar menuknop | ✅ | ✅ | ✅ |
| Menu werkt zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | 168 tekens | 126 tekens | 126 tekens |

De pagina werkt en gedraagt zich in alle drie de engines hetzelfde. De kleine verschillen:
- **Load en LCP in Firefox en WebKit lager dan bij Eleventy** (Firefox: 100 tegenover 232 ms, WebKit: 117 tegenover 261 ms). Omdat de pagina's vrijwel identiek zijn, komt dit niet door Astro. Het ligt eerder aan schommelingen in de externe partnerlogo's en de 404's voor de fonts, die per meting anders uitvallen. Neem dit verschil niet mee als voordeel van Astro.
- **Content zonder JS:** Chromium telt 168 tekens, Firefox en WebKit 126. Precies hetzelfde verschil als bij Eleventy en Next.js; het zit in hoe de browsers `innerText` berekenen (waarschijnlijk de opties van de `<select>`).
- **Console-fouten:** alle drie melden de ontbrekende `.woff2`-fonts. Firefox doet dat met een eigen melding ("downloadable font: download failed").
- **Favicon:** in de cross-browser-test vraagt geen enkele browser `/favicon.ico` op, in de Chromium-audit wel. Daarom 3 mislukte requests hier en 4 in hoofdstuk 2.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren".

**Screenshots:** het geopende mobiele menu (`astro-home-<browser>-menu-open.png`) ziet er in de drie browsers hetzelfde uit; de sluitknop staat volledig in beeld. Op de gewone mobiele weergave (`astro-home-<browser>-mobile.png`) verschilt alleen de sorteer-`<select>`: elke browser tekent zijn eigen pijltje. In alle drie lopen de kaarten rechts buiten beeld.

Het aantal requests is hier 19, in hoofdstuk 2 is het 16. De twee scripts tellen requests op een andere manier. Vergelijk daarom alleen getallen uit hetzelfde script.

Screenshots staan in `tests/results/astro/screenshots/`.

## Beperkingen van deze test

- **Lokale server:** de site is geserveerd met `python3 -m http.server`, zonder compressie. Dat is dezelfde opstelling als bij Eleventy, dus die twee zijn direct te vergelijken. SvelteKit en Next.js zijn met gzip geserveerd; kijk voor een eerlijke vergelijking met die twee naar de ongecomprimeerde waarden. Echte hosting (CDN, caching, HTTP/2) geeft andere absolute waarden.
- **Statisch, niet per request:** de homepage is tijdens de build gerenderd. Een wijziging in Directus is pas zichtbaar na een nieuwe build, net als bij Eleventy en Next.js.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. De ontbrekende focus en het horizontaal scrollen laten dat zien. Een handmatige test met een screenreader blijft nodig.
- **Data uit Directus:** de pagina toont dezelfde 4 websites in dezelfde volgorde als de andere versies. Meer of minder websites geeft andere cijfers voor DOM-grootte, requests en Tab-stops.
- **Externe afbeeldingen:** de partnerlogo's komen van de favicon-dienst van Google. Hun laadtijd valt buiten de lokale server en kan per meting verschillen.
- **Niet ingelogd:** de Astro-versie heeft geen login, net als Eleventy en Next.js.
- **Onvolledige site:** alleen de homepage is overgezet. De links naar `/info/` en de partnerpagina's geven een 404. Anders dan bij Next.js worden ze niet vooraf opgehaald, dus dat heeft geen invloed op de metingen.
- **Script ongewijzigd:** voor de Chromium-audit is alleen `framework` in het CONFIG-blok aangepast (naar `'Astro'`), in een tijdelijke kopie van het script. De testlogica is niet veranderd.
