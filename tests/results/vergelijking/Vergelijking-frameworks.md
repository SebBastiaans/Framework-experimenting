# Vergelijking frameworks (homepage)

Op deze pagina zetten we de testresultaten van de homepage (`/`) van alle geteste frameworks naast elkaar. Alle versies zijn getest met dezelfde scripts (`tests/scripts/playwright-audit.js` en `tests/scripts/cross-browser.mjs`), dezelfde profielen, 5 runs per meting (mediaan), axe-core 4.10.2 en Playwright 1.65.0. De details staan per framework op [Playwright-test Eleventy (homepage)](Playwright-test-Eleventy-home), [Playwright-test SvelteKit (homepage)](Playwright-test-SvelteKit-home) en [Playwright-test Next.js (homepage)](Playwright-test-NextJS-home).

Bronnen: `<slug>-home.json` en `<slug>-home-cross-browser.json` in `tests/results/<slug>/`.

## Versies en serveermethode

| | Eleventy | SvelteKit | Next.js |
|---|---|---|---|
| **Versie** | Eleventy 3.1.8 | SvelteKit 2.50.2 (Svelte 5.49.2, Vite 7.3.1) | Next.js 16.4.6 (React 19.3.0, webpack) |
| **Rendermodus** | Statisch: HTML gemaakt tijdens de build | Server-side rendering bij elke request | Statisch voorgerenderd tijdens de build (SSG), met hydration in de browser |
| **Data uit Directus** | Opgehaald tijdens de build | Opgehaald bij elke request (2× per request) | Opgehaald tijdens de build |
| **Server** | `python3 -m http.server` (geen compressie) | `npm run preview` (Node, gzip) | `next start` (Node, gzip, HTML uit cache) |
| **Ingelogd getest** | nee (geen login) | ja (homepage zit achter een login) | nee (geen login) |
| **Datum** | 18 november 2026 | 18 november 2026 | 19 november 2026 |

## Metingen (Chromium, Playwright MCP)

De beste waarde per rij is **vetgedrukt**. Bij gelijke waarden is niets gemarkeerd.

| Meting | Eleventy | SvelteKit | Next.js |
|---|---|---|---|
| TTFB desktop | **2 ms** | 405 ms | 3 ms |
| TTFB mobiel | 153 ms | 347 ms | **151 ms** |
| FCP desktop | 76 ms | 492 ms | **72 ms** |
| FCP mobiel | 544 ms | 1060 ms | **476 ms** |
| LCP desktop | **96 ms** | 512 ms | 108 ms |
| LCP mobiel | **616 ms** | 1060 ms | 860 ms |
| CLS desktop | 0,005 | 0,004 | **0,002** |
| CLS mobiel | 0,009 | 0,002 | **0,001** |
| DOMContentLoaded desktop | **11 ms** | 448 ms | 30 ms |
| DOMContentLoaded mobiel | **284 ms** | 1022 ms | 454 ms |
| Load desktop | **55 ms** | 1360 ms | 59 ms |
| Load mobiel | **4122 ms** | 5064 ms | 4551 ms |
| Requests | **16** | 40 | 26 |
| KB totaal (overgedragen) | **734,4 KB** | 781,5 KB | 851,9 KB |
| KB JavaScript | **0 KB** (0 bestanden) | 63,4 KB gzip / 137,9 KB ongecomprimeerd (21 bestanden) | 142,6 KB gzip / 461,5 KB ongecomprimeerd (8 bestanden) |
| KB CSS | 20,6 KB (4 bestanden) | 9,2 KB gzip (7 bestanden) | **3,5 KB** gzip / 13,2 KB ongecomprimeerd (1 bestand) |
| KB HTML | 25,8 KB | 12,9 KB gzip / 116,3 KB ongecomprimeerd | **8,5 KB** gzip / 69,2 KB ongecomprimeerd |
| KB fonts | 679,6 KB | 679,7 KB | 679,9 KB |
| DOM-elementen | **200** | 485 | 215 |
| axe-overtredingen (desktop en mobiel) | **0** | 5 regels, 6 elementen | **0** |
| Elementen zonder zichtbare focus | 12 | 12 | 12 |
| Skip link werkt | ✅ | ❌ | ✅ |
| Mobiel menu met JS | ✅ | ✅ | ✅ |
| Mobiel menu zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | ✅ 168 tekens | ✅ 43 tekens (sub-header staat buiten `<main>`) | ✅ 168 tekens |

Eleventy is ongecomprimeerd geserveerd, SvelteKit en Next.js met gzip. Daarom staan bij die twee beide waarden. Voor wat er gebouwd wordt, kijk naar de ongecomprimeerde waarden. Voor wat een gebruiker in deze testopstelling echt downloadt, kijk naar de overgedragen waarden. De fonts zijn bij alle drie dezelfde `.woff`-bestanden; het kleine verschil is meetruis in de headers.

## Cross-browser (desktop, zonder vertraging)

| Browser | | Eleventy | SvelteKit | Next.js |
|---|---|---|---|---|
| **Chromium 158** | FCP | **24 ms** | 480 ms | 28 ms |
| | Load | 114 ms | 1343 ms | **43 ms** |
| | Skip link | ✅ | ❌ | ✅ |
| | Menu (Enter / Escape) | ✅ | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ | ✅ |
| **Firefox 159** | FCP | **38 ms** | 556 ms | 42 ms |
| | Load | 232 ms | 1413 ms | **54 ms** |
| | Skip link | ✅ | ❌ | ✅ |
| | Menu (Enter / Escape) | ✅ | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ | ✅ |
| **WebKit 27.2** | FCP | 140 ms | 495 ms | **35 ms** |
| | Load | 261 ms | 1093 ms | **142 ms** |
| | Skip link | ✅ | ❌ | ✅ |
| | Menu (Enter / Escape) | ✅ | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ | ✅ |

In WebKit is getest met Alt+Tab, omdat Safari met gewone Tab alleen langs formuliervelden springt.

## Conclusies

### Performance

- **Eleventy is het lichtst:** geen JavaScript, de minste requests en de minste DOM-elementen. Op mobiel heeft Eleventy de beste LCP, DOMContentLoaded en Load. Dat komt door het framework: Eleventy stuurt standaard geen JavaScript mee.
- **Next.js zit dicht bij Eleventy**, omdat de homepage ook tijdens de build wordt gerenderd (TTFB 3 ms). Next.js wint zelfs op FCP mobiel (476 tegenover 544 ms), maar dat komt door gzip en het samenvoegen van de CSS tot één bestand, niet doordat het framework sneller is. Met gzip op de Eleventy-server zou dat verschil grotendeels verdwijnen.
- **Next.js stuurt het meeste JavaScript mee:** 142,6 KB gzip (461,5 KB ongecomprimeerd), meer dan twee keer zoveel als SvelteKit. 90% daarvan is React DOM en de Next.js-router. Dat is framework-gebonden: zodra er een Client Component of `<Link>` op de pagina staat, laadt de browser React. Op mobiel zie je dat terug in een latere LCP (860 ms), DOMContentLoaded (454 ms) en Load (4,6 s) dan bij Eleventy. Daarnaast stuurt Next.js de content twee keer mee (HTML plus RSC payload), waardoor de HTML ongecomprimeerd 69 KB is.
- **SvelteKit is het traagst op tijden**, maar vooral door de serveermethode en de code: de pagina wordt bij elke request opnieuw gerenderd, met twee calls naar Directus en een sessiecontrole (TTFB ~400 ms). Het JavaScript van SvelteKit zelf (63 KB) is juist kleiner dan dat van Next.js. Met prerendering zou SvelteKit waarschijnlijk dicht bij de andere twee uitkomen.
- **Load mobiel** wordt bij alle drie vooral bepaald door de 680 KB aan fonts over Slow 4G. Dat is een asset-probleem, geen framework-probleem: `.woff2`-bestanden of minder font-varianten zouden alle drie versnellen.
- **Load in de cross-browser-test:** Next.js is daar sneller dan Eleventy (43 tegenover 114 ms in Chromium). De Next.js-CSS verwijst direct naar `.woff`; Eleventy vraagt eerst drie ontbrekende `.woff2`-bestanden op en krijgt 404's. Dat verschil komt door de code, niet door het framework.

### Toegankelijkheid

- **Eleventy en Next.js zijn gelijk:** 0 axe-overtredingen, werkende skip link en dezelfde 25 Tab-stops in dezelfde volgorde. Logisch, want de Next.js-versie gebruikt dezelfde HTML-structuur en CSS als Eleventy.
- **SvelteKit heeft 5 axe-overtredingen en een niet-werkende skip link.** Die komen allemaal uit de code van die versie (een lege `<h1>`, een overschreven `aria-label`, een te kleine select-knop, de sub-header buiten een landmark, contrast van de placeholder), niet uit SvelteKit zelf.
- **Gedeelde problemen:** alle drie hebben 12 kaartknoppen zonder zichtbare focus (de reset `button { outline: inherit }`) en horizontaal scrollen op mobiel. Die komen uit de gedeelde CSS en verdwijnen pas als die wordt aangepast.

### Werking zonder JavaScript

- **Alle drie werken zonder JavaScript:** de content staat in de HTML en het mobiele menu werkt overal, omdat het met de Popover API is gebouwd en niet met JavaScript.
- **Eleventy en Next.js** gedragen zich zonder JS identiek. Bij Next.js valt alleen de prefetch en client-side navigatie weg; links laden dan gewoon een nieuwe pagina. Het JavaScript van Next.js voegt op deze pagina dus weinig toe voor de gebruiker.
- **SvelteKit:** content, menu en filteren werken zonder JS, maar audit starten, bewerken en verwijderen niet (dialogen met `showModal()` en `fetch`). In de Eleventy- en Next.js-versie zijn die knoppen nog niet gebouwd, dus daar is dit niet te vergelijken.

### Browserondersteuning

- **Alle drie werken in Chromium, Firefox en WebKit** zonder functionele verschillen in menu, skip link en no-JS-gedrag. De Popover API wordt door alle drie de engines ondersteund.
- **SvelteKit** heeft in Firefox een lege sorteerknop (`button-name`), omdat de aanpasbare `<select>` met `<selectedcontent>` daar nog niet werkt. Dat komt door de code (een nieuwe CSS/HTML-feature), niet door SvelteKit.
- **Next.js** heeft in alle browsers 5 mislukte prefetch-requests, omdat `/info` en de partnerpagina's nog niet bestaan. Dat verdwijnt als die pagina's worden gebouwd.
- **Zonder JS-tekst** telt Chromium bij Eleventy en Next.js 168 tekens en Firefox/WebKit 126. Dat verschil zit in hoe browsers `innerText` berekenen, niet in de pagina.

## Beperkingen

- **Lokale server:** alles is gemeten op localhost. Echte hosting (CDN, caching, HTTP/2, brotli) geeft andere absolute waarden. Vergelijk de frameworks daarom op de verschillen, niet op de exacte milliseconden.
- **Verschillen in serveermethode:** Eleventy is geserveerd met `python3 -m http.server` zonder compressie, SvelteKit met `npm run preview` (SSR per request, gzip) en Next.js met `next start` (voorgerenderde HTML uit cache, gzip). Gzip geeft SvelteKit en Next.js een voordeel in overgedragen KB en mobiele FCP; SSR per request geeft SvelteKit een nadeel in TTFB. Een deel van de verschillen komt dus door de opstelling, niet door het framework.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging voor mobiel zijn nagebootst (zoals Lighthouse) en alleen in Chromium mogelijk. De cross-browser-tijden zijn op desktop zonder vertraging gemeten. Dat is niet hetzelfde als een echt mobiel toestel.
- **Login:** alleen SvelteKit is ingelogd getest; de sessiecontrole telt daar mee in de TTFB.
- **Niet gelijke code:** de versies zijn niet identiek. SvelteKit heeft werkende dialogen en andere componenten; Next.js heeft (nog) alleen de homepage. Verschillen in toegankelijkheid en DOM-grootte komen vaak uit de code, niet uit het framework.
- **Externe afhankelijkheden:** de partnerlogo's komen van de favicon-dienst van Google, en bij SvelteKit hangt de TTFB af van Directus. Die tijden schommelen per meting.
