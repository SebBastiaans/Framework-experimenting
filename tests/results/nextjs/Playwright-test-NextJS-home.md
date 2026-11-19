# Playwright-test: Next.js (homepage)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de homepage (`/`) in de **Next.js**-versie. Het is exact dezelfde test als op de Eleventy- en SvelteKit-versie, zodat we de frameworks kunnen vergelijken op performance, toegankelijkheid en browserondersteuning. De vergelijking zelf staat op [Vergelijking frameworks](Vergelijking-frameworks).

| | |
|---|---|
| **Framework** | Next.js 16.4.6 (React 19.3.0, App Router, webpack, React Compiler aan) |
| **Pagina** | `/` (homepage) |
| **Datum** | 19 november 2026 |
| **Build** | Productie-build (`npm run build`), geserveerd met `next start -p 8081` (Node-server, gzip). De homepage is tijdens de build voorgerenderd als statische pagina (`○ (Static)`) |
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
| JavaScript naar de browser | **142,6 KB** in 8 bestanden (461,5 KB ongecomprimeerd) |
| Totale paginagrootte | 851,9 KB, waarvan 679,9 KB fonts (80%) |
| LCP mobiel | 860 ms |
| CLS mobiel | 0,001 |
| axe-overtredingen | 0 |
| Werkt zonder JavaScript | Ja: content, mobiel menu en formulieren werken. Alleen de knoppen op de kaarten doen niets (met of zonder JS) |
| Toetsenbord | Skip link werkt, mobiel menu volledig bedienbaar, 12 knoppen zonder zichtbare focus |
| Horizontaal scrollen op mobiel | Ja |

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 3 ms | 151 ms |
| FCP (First Contentful Paint) | 72 ms | 476 ms |
| LCP (Largest Contentful Paint) | 108 ms | 860 ms |
| CLS (Cumulative Layout Shift) | 0,002 | 0,001 |
| DOMContentLoaded | 30 ms | 454 ms |
| Load event | 59 ms | 4551 ms |
| Aantal DOM-elementen | 215 | 215 |

**Waar de cijfers vandaan komen:**
- **TTFB van 3 ms:** de homepage is tijdens de build al gerenderd (Static Site Generation). `next start` stuurt de opgeslagen HTML uit de cache (`x-nextjs-cache: HIT`). Er wordt bij een request dus niets uit Directus opgehaald. Daardoor is de TTFB net zo laag als bij Eleventy.
- **FCP mobiel (476 ms) lager dan bij Eleventy (544 ms):** de HTML gaat met gzip over de lijn (8,5 KB in plaats van 25,8 KB), en de CSS zit in één bestand van 3,5 KB in plaats van vier. Over Slow 4G scheelt dat.
- **LCP mobiel (860 ms) hoger dan de FCP:** de browser downloadt tegelijk 142,6 KB JavaScript, fonts en de partnerlogo's. Op 1,6 Mbit/s concurreren die om dezelfde bandbreedte, waardoor de grootste afbeelding of tekst later klaar is.
- **DOMContentLoaded mobiel (454 ms):** de HTML is ongecomprimeerd 69 KB, bijna drie keer zo groot als bij Eleventy. Bovenaan staat de gewone HTML, onderaan dezelfde content nog een keer als data voor React (de "RSC payload" in `self.__next_f.push(...)`-scripts). De browser moet die inline scripts uitvoeren voordat `DOMContentLoaded` valt, en met 4× CPU-vertraging kost dat tijd.
- **Load mobiel (4,6 s):** vooral de 680 KB aan `.woff`-fonts over Slow 4G, net als bij Eleventy (4,1 s). De extra ~0,4 s komt door het JavaScript dat er bij Eleventy niet is.
- **215 DOM-elementen:** 15 meer dan Eleventy (200). Next.js zet `<script>`-tags voor de chunks en de RSC payload in de HTML, die tellen mee.

## 2. Netwerk

| Type | Requests | Grootte (overgedragen, gzip) |
|---|---|---|
| HTML | 1 | 8,5 KB (69,2 KB ongecomprimeerd) |
| CSS | 1 | 3,5 KB (13,2 KB ongecomprimeerd) |
| JavaScript | 8 | 142,6 KB (461,5 KB ongecomprimeerd) |
| Afbeeldingen (partnerlogo's) | 4 | 7,1 KB |
| Fonts | 3 | 679,9 KB |
| Prefetch-requests (RSC, `Fetch`) | 8 (desktop) / 6 (mobiel) | 7,4 KB |
| Overig (favicon) | 1 | 2,8 KB |
| **Totaal** | **26** (desktop) / **24** (mobiel) | **851,9 KB** |

**JavaScript-bestanden:**

| Bestand | Inhoud | Grootte (gzip) | Ongecomprimeerd |
|---|---|---|---|
| `chunks/826-ba14021ace0236ba.js` | Next.js-runtime: router, `<Link>`, prefetch | 65,9 KB | 236,1 KB |
| `chunks/4bd1b696-228d6cc6681fc189.js` | React DOM | 63,0 KB | 198,9 KB |
| `chunks/402-706e8a996daa325d.js` | gedeelde code | 5,8 KB | 14,0 KB |
| `chunks/549-dba6f2f72b6e63e1.js` | gedeelde code | 3,6 KB | 7,5 KB |
| `chunks/webpack-c145c302de281160.js` | webpack-loader | 2,0 KB | 3,2 KB |
| `chunks/app/layout-3cbaf4316bf6fcc4.js` | root-layout (o.a. `NavLink`) | 1,0 KB | 1,1 KB |
| `chunks/main-app-a461006652534e20.js` | startpunt App Router | 0,8 KB | 0,5 KB |
| `chunks/app/page-a6bcc5f99e343b46.js` | homepage | 0,6 KB | 0,2 KB |
| **Totaal (8 bestanden)** | | **142,6 KB** | **461,5 KB** |

Alle paden beginnen met `/_next/static/`. De twee grootste bestanden (129 KB samen, 90%) zijn React DOM en de Next.js-router. Die komen mee met elke Next.js-pagina, hoe klein de pagina ook is. De code van deze site zelf is minder dan 2 KB (`layout` en `page`). De kleinste bestanden zijn zonder gzip verstuurd; met headers is de overdracht dan iets groter dan het bestand.

Waarom moet React mee? De homepage is grotendeels een Server Component, maar `NavLink` is een Client Component (`'use client'`, voor `usePathname`) en `<Link>` uit `next/link` heeft JavaScript nodig voor prefetch en client-side navigatie. Zodra er één Client Component op de pagina staat, laadt de browser React en de router.

**Mislukte requests (404):**
- `/info?_rsc=…`
- `/gvb?_rsc=…`, `/angular?_rsc=…`, `/fdnd-?_rsc=…`, `/rijksoverheid?_rsc=…`

Dit zijn **prefetch-requests** van `<Link>`. Next.js haalt van elke link die in beeld komt alvast de data op, zodat een klik direct werkt. De routes `/info` en `/<partner>` bestaan in deze Next.js-versie nog niet (alleen `/` is gebouwd), dus de server geeft 404. Op mobiel zijn het er 3, omdat daar minder links in beeld staan. Dit is geen probleem van Next.js zelf, maar van de nog niet overgezette pagina's. Wel gevolg: een klik op "Info" of een partnerkaart levert nu een 404-pagina op.

**Geen 404's voor fonts en favicon:** de CSS verwijst in deze versie alleen naar `.woff`-bestanden, niet eerst naar ontbrekende `.woff2`. Daarom zijn het 3 font-requests in plaats van 6 (Eleventy en SvelteKit), met dezelfde 680 KB. De favicon (`src/app/favicon.ico`) bestaat wel.

**HTML van 69 KB:** de partnerkaarten en de inline SVG-icoontjes staan er twee keer in: één keer als HTML en één keer in de RSC payload voor React. Door gzip gaat er maar 8,5 KB over de lijn.

De partnerlogo's komen van de favicon-dienst van Google, net als bij Eleventy. Het zijn de enige requests naar een andere server. `next/image` staat op `unoptimized`, dus Next.js bewerkt ze niet.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 44 | 42 |
| Overtredingen | 0 | 0 |
| Handmatig na te kijken | 0 | 0 |

axe vindt geen overtredingen. Er was dus geen extra axe-run voor details nodig. Het ontbreken van een zichtbare focus (hoofdstuk 4) en het horizontaal scrollen (hieronder) ziet axe niet. Die problemen zijn er wel. axe controleert één regel meer dan bij Eleventy (44 tegenover 43); waarschijnlijk een regel over de extra `<script>`-elementen of de `<picture>` rond de logo's. Er is niets mis mee.

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

De Tab-volgorde is precies gelijk aan die van Eleventy.

- **Skip link:** de eerste Tab-stop. Enter verplaatst de focus naar `<main>` (`id="main-content"`, `tabIndex={-1}`). ✅
- **Knoppen op de kaarten zonder focusstijl:** de reset `button { outline: inherit }` in `global.css` (regel 178) haalt de outline weg. Het gaat om 3 knoppen per kaart, dus 12 in totaal. Dezelfde oorzaak en hetzelfde aantal als bij Eleventy en SvelteKit: de CSS is overgenomen.
- **Volgorde:** de Tab-volgorde volgt de visuele volgorde: header, sub-header (toevoegen, zoeken, filter, sorteren, toepassen) en daarna de kaarten.
- **Skip link in het Engels:** de tekst staat in het Engels op een Nederlandse pagina (`lang="nl"`), net als bij Eleventy.

## 5. Mobiel menu (hamburger)

Gebouwd met de Popover API (`popover="auto"` en `popoverTarget` in `Hamburger.js`), zonder eigen JavaScript. Het menu is een Server Component; alleen de links erin (`NavLink`) zijn Client Components.

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
| Content (partnerkaarten) | ✅ werkt: de kaarten staan in de HTML, want Next.js rendert de pagina tijdens de build |
| Mobiel menu | ✅ werkt (Popover API) |
| Filtermenu (popover) | ✅ opent (zelfde Popover API), niet verder getest |
| Zoeken, filteren, sorteren | ✅ verstuurbaar: het zijn gewone `GET`-formulieren naar `/` met een knop "Toepassen". De pagina doet nog niets met de keuze, met of zonder JS |
| Links (menu, kaarten) | ✅ werken als gewone `<a href>`; zonder JS valt alleen de prefetch weg |
| Audit starten, bewerken, verwijderen | ❌ doen niets, maar ook niet **met** JS: het zijn `<button type="button">` zonder handler. Nog niet gebouwd |

De pagina ziet er met en zonder JavaScript hetzelfde uit en heeft exact dezelfde cijfers als Eleventy (168 tekens, 5 koppen, 11 links). Dat komt doordat Next.js alle HTML vooraf rendert; JavaScript voegt alleen "hydration" toe: React neemt de bestaande HTML over om client-side navigatie en prefetch mogelijk te maken. Zonder JS laadt elke klik gewoon een nieuwe pagina.

Het JavaScript (142,6 KB) wordt op deze pagina dus voor vrijwel niets gebruikt: alles wat de gebruiker ziet en kan bedienen werkt ook zonder. Dat is een keuze in de code (`<Link>` en een Client Component in de header), niet iets wat Next.js afdwingt. Met gewone `<a>`-tags en zonder `'use client'` zou de browser alleen nog de kleine runtime laden; helemaal 0 KB JS lukt met de App Router niet.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| TTFB | 3 ms | 3 ms | 3 ms |
| FCP | 28 ms | 42 ms | 35 ms |
| LCP | 128 ms | 123 ms | 148 ms |
| CLS | 0,005 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 21 ms | 29 ms | 36 ms |
| Load | 43 ms | 54 ms | 142 ms |
| Requests | 29 | 30 | 29 |
| JavaScript-bestanden (volgens script) | 7 | 7 | 7 |
| Mislukte requests | 5 (RSC-prefetch) | 5 (RSC-prefetch) | 5 (RSC-prefetch) |
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
- **Load in WebKit (142 ms):** iets later dan Chromium en Firefox. WebKit was bij Eleventy ook de traagste (261 ms). Het verschil is klein en valt binnen wat je per meting kunt verwachten.
- **JavaScript-bestanden:** het script telt 7 bestanden, de Chromium-audit 8. Het cross-browser-script telt alleen bestanden met initiator `script`; één chunk wordt door de webpack-loader opgehaald en valt daarbuiten. Anders dan bij SvelteKit telt het script in Firefox en WebKit wel bestanden, omdat Next.js gewone `<script async>`-tags gebruikt en geen `modulepreload`.
- **Content zonder JS:** Chromium telt 168 tekens, Firefox en WebKit 126. Precies hetzelfde verschil als bij Eleventy; het zit in hoe de browsers `innerText` berekenen (waarschijnlijk de opties van de `<select>`).
- **Console-fouten:** Chromium en WebKit melden de 404's van de prefetch-requests in de console, Firefox niet.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren".

**Screenshots:** het geopende mobiele menu (`nextjs-home-<browser>-menu-open.png`) ziet er in de drie browsers precies hetzelfde uit; de sluitknop staat volledig in beeld. Op de gewone mobiele weergave (`nextjs-home-<browser>-mobile.png`) verschilt alleen de sorteer-`<select>`: elke browser tekent zijn eigen pijltje (Chromium een enkel pijltje, WebKit een dubbel pijltje). In alle drie lopen de kaarten rechts buiten beeld.

Het aantal requests is hier 29–30, in hoofdstuk 2 is het 26. De twee scripts tellen requests op een andere manier, en het aantal prefetch-requests hangt af van welke links op dat moment in beeld zijn. Vergelijk daarom alleen getallen uit hetzelfde script.

Screenshots staan in `tests/results/nextjs/screenshots/`.

## Beperkingen van deze test

- **Lokale server en serveermethode:** Next.js is zonder `output: 'export'` gebouwd en heeft daarom zijn eigen server nodig. De site is geserveerd met `next start`: een Node-server met gzip die de vooraf gerenderde homepage uit de cache stuurt. Eleventy is geserveerd met `python3 -m http.server`, zonder compressie. Bij Next.js zijn HTML, CSS en JS daardoor kleiner over de lijn dan ze bij Eleventy zouden zijn. Kijk voor een eerlijke vergelijking van wat er gebouwd wordt naar de ongecomprimeerde waarden. Echte hosting (CDN, caching, HTTP/2) geeft andere absolute waarden.
- **Statisch, niet per request:** de homepage is tijdens de build gerenderd. De data uit Directus is dus die van het moment van bouwen. Een wijziging in Directus is pas zichtbaar na een nieuwe build (of met revalidatie, die hier niet is ingesteld). SvelteKit rendert per request en haalt de data dan elke keer op.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. De ontbrekende focus en het horizontaal scrollen laten dat zien. Een handmatige test met een screenreader blijft nodig.
- **Data uit Directus:** de pagina toont dezelfde 4 websites in dezelfde volgorde als Eleventy. Meer of minder websites geeft andere cijfers voor DOM-grootte, requests en Tab-stops.
- **Externe afbeeldingen:** de partnerlogo's komen van de favicon-dienst van Google. Hun laadtijd valt buiten de lokale server en kan per meting verschillen.
- **Niet ingelogd:** de Next.js-versie heeft (nog) geen login, net als Eleventy.
- **Onvolledige site:** alleen de homepage is overgezet. Daardoor geven de prefetch-requests naar `/info` en de partnerpagina's een 404. Als die pagina's er komen, verdwijnen de 404's, maar blijven de prefetch-requests (en dus de extra netwerkbelasting) bestaan.
- **Script ongewijzigd:** voor de Chromium-audit is alleen `framework` in het CONFIG-blok aangepast (naar `'NextJS'`), in een tijdelijke kopie van het script. De testlogica is niet veranderd.
