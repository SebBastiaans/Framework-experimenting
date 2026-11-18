# Playwright-test: SvelteKit (homepage)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de homepage (`/`) in de **SvelteKit**-versie. Het is exact dezelfde test als op de Eleventy-versie, zodat we de frameworks kunnen vergelijken op performance, toegankelijkheid en browserondersteuning. De vergelijking zelf staat op [Vergelijking frameworks](Vergelijking-frameworks). De test van de `/info`-pagina staat op [Playwright-test SvelteKit](Playwright-test-SvelteKit).

| | |
|---|---|
| **Framework** | SvelteKit 2.50.2 (Svelte 5.49.2, Vite 7.3.1) |
| **Pagina** | `/` (homepage, partneroverzicht) |
| **Datum** | 18 november 2026 |
| **Build** | Productie-build (`npm run build`, adapter-auto), geserveerd met `npm run preview -- --port 8081` (server-side rendering per request, gzip) |
| **Data** | 4 partners uit Directus (Angular, Fdnd, GVB, Rijksoverheid), opgehaald bij elke request |
| **Browser** | Chromium via Playwright MCP (hoofdstuk 1–6), plus Chromium, Firefox en WebKit via Playwright (hoofdstuk 7) |
| **Metingen** | 5 runs per profiel, mediaan gerapporteerd, cache leeg bij elke run, **ingelogd** |
| **Testscripts** | `tests/scripts/playwright-audit.js` en `tests/scripts/cross-browser.mjs` |

De homepage zit achter een login. Zonder sessie stuurt SvelteKit door naar `/login`. Voor de test is eerst ingelogd in de Playwright-browser. Die sessie is ook gebruikt voor de cross-browser-test (`STORAGE_STATE=tests/.auth/sveltekit.json`).

## Testprofielen

| Profiel | Viewport | CPU | Netwerk |
|---|---|---|---|
| Desktop | 1280 × 800 | geen vertraging | geen beperking (localhost) |
| Mobiel | 390 × 844 | 4× vertraagd | "Slow 4G": 150 ms latency, 1,6 Mbit/s down |

Het mobiele profiel gebruikt dezelfde instellingen als Lighthouse mobiel.

## Samenvatting

| Onderdeel | Resultaat |
|---|---|
| JavaScript naar de browser | **63,4 KB** in 21 bestanden (137,9 KB ongecomprimeerd) |
| Totale paginagrootte | 781,5 KB, waarvan 679,7 KB fonts (87%) |
| LCP mobiel | 1060 ms |
| CLS mobiel | 0,002 |
| axe-overtredingen | 5 regels, 6 elementen: `color-contrast`, `empty-heading`, `link-name`, `region` (2), `target-size` |
| Werkt zonder JavaScript | Deels: content, mobiel menu en filteren/sorteren werken. Audit starten, bewerken en verwijderen niet |
| Toetsenbord | Skip link werkt **niet** (verborgen met `display: none`), mobiel menu volledig bedienbaar, 12 knoppen zonder zichtbare focus |
| Horizontaal scrollen op mobiel | Ja |

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 405 ms | 347 ms |
| FCP (First Contentful Paint) | 492 ms | 1060 ms |
| LCP (Largest Contentful Paint) | 512 ms | 1060 ms |
| CLS (Cumulative Layout Shift) | 0,004 | 0,002 |
| DOMContentLoaded | 448 ms | 1022 ms |
| Load event | 1360 ms | 5064 ms |
| Aantal DOM-elementen | 485 | 485 |

**Waar de cijfers vandaan komen:**
- **TTFB van ongeveer 400 ms:** SvelteKit bouwt de pagina bij elke request op de server. Daarvoor haalt hij de partners twee keer op uit Directus: één keer in de root-layout (`+layout.server.js`, voor de zijbalk en principes) en één keer in de pagina zelf (`+page.server.js`). Ook wordt de sessie gecontroleerd. De TTFB is op mobiel niet hoger dan op desktop, omdat de servertijd veel groter is dan de gesimuleerde 150 ms latency. De TTFB hangt af van Directus en schommelt per meting.
- **FCP min TTFB:** op desktop zit er 87 ms tussen de eerste byte en de eerste paint. Het renderen in de browser gaat dus snel; het grootste deel van de FCP is wachten op de server.
- **Load-tijd op desktop (1,4 s):** de drie ontbrekende `.woff2`-fonts en de favicon gaan in SvelteKit niet direct naar een 404, maar door de router. Ze matchen de dynamische route `[websiteUID]`, die opnieuw data uit Directus ophaalt en dan een foutpagina rendert. Elk van die requests kost ongeveer 0,4 s servertijd. De `load`-event wacht op de fonts en dus op die requests.
- **Load-tijd op mobiel (5,1 s):** vooral de 680 KB aan `.woff`-fonts over Slow 4G, net als bij Eleventy, plus de trage 404's.
- **485 DOM-elementen:** elke partnerkaart heeft drie `<dialog>`-elementen (audit starten, bewerken, verwijderen) met elk een formulier. Die staan alle 12 al in de HTML, ook als ze dicht zijn.

## 2. Netwerk

| Type | Requests | Grootte (overgedragen, gzip) |
|---|---|---|
| HTML | 1 | 12,9 KB (116,3 KB ongecomprimeerd) |
| CSS | 7 | 9,2 KB |
| JavaScript | 21 | 63,4 KB (137,9 KB ongecomprimeerd) |
| Afbeeldingen (partnerlogo's) | 4 | 7,1 KB |
| Fonts | 6 | 679,7 KB |
| Overig (favicon, 404-pagina) | 1 | 9,1 KB |
| **Totaal** | **40** | **781,5 KB** |

**JavaScript-bestanden:**

| Bestand | Grootte (gzip) |
|---|---|
| `entry/start.BvRVO0Xu.js` | 0,4 KB |
| `entry/app.v1CDU9wn.js` | 3,5 KB |
| `nodes/0.CRRJSs-Q.js` (root-layout) | 5,3 KB |
| `nodes/1.ZN0S5GiP.js` (foutpagina) | 1,3 KB |
| `nodes/3.eG6ekIm8.js` (homepage) | 1,5 KB |
| `chunks/wkccUmWP.js` | 12,6 KB |
| `chunks/BJ8H7Bwr.js` | 10,7 KB |
| `chunks/itPs29yM.js` | 8,3 KB |
| `chunks/DV5pRcBc.js` | 6,4 KB |
| `chunks/BHMd2zYX.js` | 2,4 KB |
| `chunks/BslQmH_N.js` | 2,1 KB |
| `chunks/DeUIfFsj.js` | 2,0 KB |
| `chunks/Bg-hJh5j.js` | 1,3 KB |
| `chunks/D_VkTXvd.js` | 1,1 KB |
| `chunks/NzQC__Is.js` | 1,0 KB |
| `chunks/CAHcdugO.js` | 0,8 KB |
| `chunks/D-DiOpRo.js` | 0,8 KB |
| `chunks/BhAzOIfM.js` | 0,6 KB |
| `chunks/5nQHVYcY.js` | 0,6 KB |
| `chunks/77qCqAjJ.js` | 0,5 KB |
| `chunks/DsnmJJEf.js` | 0,3 KB |
| **Totaal (21 bestanden)** | **63,4 KB** |

Alle paden beginnen met `/_app/immutable/`. De vier grootste chunks (38 KB samen) zijn de Svelte-runtime en de SvelteKit-router. De code voor de homepage zelf is klein (`nodes/3`, 1,5 KB). Dit is bijna hetzelfde als op de `/info`-pagina (62,7 KB, 21 bestanden): het JavaScript komt vooral van het framework, niet van de pagina.

**Mislukte requests (404):**
- `/fonts/fira-sans/FiraSans-Regular.woff2`
- `/fonts/fira-sans/FiraSans-Bold.woff2`
- `/fonts/fira-sans/FiraSans-Medium.woff2`
- `/$lib/assets/svglogo.ico`

De CSS vraagt eerst `.woff2` op. Die bestanden ontbreken, dus de browser valt terug op `.woff`: drie bestanden van ongeveer 225 KB elk. Dit is hetzelfde probleem als bij Eleventy.

De favicon staat in `src/app.html` als `href="$lib/assets/svglogo.ico"`. `$lib` werkt alleen in Svelte- en JS-bestanden, niet in `app.html`. De browser vraagt dus letterlijk `/$lib/assets/svglogo.ico` op en krijgt een foutpagina van 39,8 KB (9,1 KB gzip) terug.

**HTML van 116 KB:** 45 KB daarvan is het inline script met de data voor hydration (partners en principes uit de layout en de pagina). De rest is vooral de 12 dialogen en 38 inline SVG-icoontjes. Door gzip gaat er maar 12,9 KB over de lijn.

De partnerlogo's komen van de favicon-dienst van Google, net als bij Eleventy. Het zijn de enige requests naar een andere server.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 36 | 36 |
| Overtredingen | 5 regels, 6 elementen | 5 regels, 6 elementen |
| Handmatig na te kijken | 2 regels (5 elementen) | 2 regels (6 elementen) |

| Regel | Impact | Element | Oorzaak |
|---|---|---|---|
| `color-contrast` | serious | `#partner-search` (zoekveld) | Placeholder-tekst `#c8b3be` op wit: 1,97:1, minimaal 4,5:1 nodig |
| `empty-heading` | minor | `<h1>` | De `Heading`-component toont `heading.title`, maar op de homepage is die leeg |
| `link-name` | serious | Link "scroll naar boven" (`.scroll-color-override > a`) | `+page.svelte` geeft `aria-label` mee, maar `NavButton` zet daarna `aria-label={aria}`. Omdat `aria` leeg is, wordt het label overschreven |
| `region` | moderate | "Partner toevoegen"-knop en het filterblok | De sub-header staat buiten `<main>` en buiten een andere landmark |
| `target-size` | serious | Knop in de sorteer-`<select>` | 24 × 19 px, minimaal 24 × 24 px nodig (WCAG 2.5.8) |

**Handmatig na te kijken:**
- `duplicate-id-aria` (4 elementen): het id `progress-partner` staat op elke partnerkaart, en de ids `name`, `url` en `sitemap` komen in elk bewerk-dialoog terug. Labels kunnen daardoor naar het verkeerde veld wijzen.
- `color-contrast` (1–2 elementen): axe kan de achtergrond van het sorteerfilter en (mobiel) een kaarttitel niet bepalen, omdat er iets overheen ligt.

### Structuur

| Check | Resultaat |
|---|---|
| `lang`-attribuut | `nl` |
| `<title>` | "Partneroverzicht" |
| Aantal `<h1>` | 1 (**leeg**) |
| Koppenvolgorde | h1 > 16 × h2 (4 kaarttitels en 12 dialoogtitels: "Audit starten", "Partner bewerken", "Partner verwijderen") |
| Landmarks | `header`: 1, `nav`: 1 (desktop) / 0 zichtbaar (mobiel, achter het menu), `main`: 1, `footer`: 0 |
| Afbeeldingen zonder `alt` | 0 |
| Horizontaal scrollen | Desktop: nee. Mobiel (390 px): **ja** |

Op mobiel is de pagina breder dan het scherm. De partnerkaarten (`.card-content`) lopen door tot 421 px bij een scherm van 390 px. Dit valt onder WCAG 1.4.10 (Reflow). Eleventy heeft hetzelfde probleem.

De koppen van de dichte dialogen tellen mee in de koppenlijst, omdat de dialogen al in de HTML staan. Een screenreader slaat dichte dialogen wel over, dus in de praktijk hoort een gebruiker alleen de kaarttitels.

## 4. Toetsenbordnavigatie (desktop)

| # | Element | Zichtbare focus |
|---|---|---|
| – | Skip link "Jump directly to main content" | niet bereikbaar |
| 1 | Logo ("ga naar homepagina") | ✅ |
| 2 | Home | ✅ |
| 3 | Info | ✅ |
| 4 | Account | ✅ |
| 5 | Partner toevoegen (+) | ✅ |
| 6 | Zoekveld | ✅ |
| 7 | Filter pagina | ✅ |
| 8 | Sorteer op (select) | ✅ |
| 9 | Kaart "Angular" (link) | ✅ |
| 10–12 | start audit / bewerk / verwijder Angular | ❌ |
| 13 | Kaart "Fdnd" (link) | ✅ |
| 14–16 | start audit / bewerk / verwijder Fdnd | ❌ |
| 17 | Kaart "GVB" (link) | ✅ |
| 18–20 | start audit / bewerk / verwijder GVB | ❌ |
| 21 | Kaart "Rijksoverheid" (link) | ✅ |
| 22–24 | start audit / bewerk / verwijder Rijksoverheid | ❌ |
| 25 | Link "scroll naar boven" (het script toont alleen "A": de link heeft geen naam) | ✅ |

Het script stopt na 25 Tab-stops. Bij Eleventy ook, dus de lijsten zijn even lang.

- **Skip link werkt niet:** de link staat in `header.svelte` met `class="disabled"`. `NavButton` zet de class vóór `{...rest}`, dus `disabled` vervangt de normale classes. De link krijgt daardoor `display: none` en `pointer-events: none`. Hij is niet met Tab te bereiken. De eerste Tab-stop is het logo. Dit is hetzelfde probleem als op de `/info`-pagina.
- **Knoppen op de kaarten zonder focusstijl:** de reset `button { outline: inherit }` in `navButton.svelte` haalt de outline weg. Het gaat om 3 knoppen per kaart, dus 12 in totaal. Dit is dezelfde oorzaak en hetzelfde aantal als bij Eleventy.
- **Volgorde:** de Tab-volgorde volgt de visuele volgorde: header, sub-header (toevoegen, zoeken, filter, sorteren) en daarna de kaarten.
- **Geen "Toepassen"-knop met JavaScript:** met JS verstuurt het filterformulier zichzelf bij een wijziging (`onchange`). De knop "Toepassen" is dan niet nodig. Zonder JS staat hij er wel (zie hoofdstuk 6). Bij Eleventy is de knop altijd een Tab-stop.

## 5. Mobiel menu (hamburger)

Gebouwd met de Popover API (`popover="auto"` en `popovertarget` in `hamburgerMenu.svelte`), zonder JavaScript.

| Check | Met JS | Zonder JS |
|---|---|---|
| Menuknop gevonden en zichtbaar | ✅ | ✅ |
| Opent met Enter | ✅ | ✅ |
| Tab gaat het menu in (naar "close menu") | ✅ | ✅ |
| Sluit met Escape | ✅ | ✅ |
| Focus terug naar menuknop na sluiten | ✅ | ✅ |
| `aria-expanded`-attribuut in HTML | geen | geen |

Er staat geen `aria-expanded` in de HTML. Chromium leidt de open/dicht-status zelf af uit `popovertarget` en geeft die door aan screenreaders. Controleer dit handmatig met VoiceOver.

Op de screenshots met het menu open valt de sluitknop (X) half buiten het scherm, in alle drie de browsers. Dat hangt waarschijnlijk samen met het horizontaal scrollen op mobiel.

## 6. Zonder JavaScript

| Check | Resultaat |
|---|---|
| Tekst in `<main>` | 43 tekens (de 4 kaarten met naam en percentage) |
| Koppen | 17 |
| Links | 14 |
| Content (partnerkaarten) | ✅ werkt: de kaarten staan in de HTML door server-side rendering |
| Mobiel menu | ✅ werkt (Popover API) |
| Filteren en sorteren | ✅ werkt waarschijnlijk: het formulier is een gewoon `GET`-formulier naar `/navigate`, en zonder JS verschijnt de knop "Toepassen". Niet verder getest |
| Partner toevoegen | ✅ is een gewone link |
| Audit starten, bewerken, verwijderen | ❌ werkt niet: de knoppen openen een `<dialog>` met `showModal()` en de formulieren versturen met `fetch`. Zonder JS gebeurt er niets |

De pagina ziet er met en zonder JavaScript hetzelfde uit, omdat SvelteKit de HTML op de server rendert. De content is dus compleet zonder JS. Wat niet werkt, zijn de acties op de kaarten. Die zijn alleen met JavaScript gebouwd en hebben geen terugvaloptie. Dat komt door de code, niet door SvelteKit: met een gewoon `<form method="POST">` en een form action zouden ze ook zonder JS werken.

**Waarom 43 tekens en niet 168 zoals bij Eleventy?** De sub-header (toevoegen, zoeken, filter, sorteren) staat in SvelteKit buiten `<main>`, in Eleventy erbinnen. Het script telt alleen de tekst in `<main>`. Er ontbreekt dus geen content; de grens van `<main>` ligt anders. Dat is ook de oorzaak van de `region`-overtreding in hoofdstuk 3.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| TTFB | 434 ms | 443 ms | 406 ms |
| FCP | 480 ms | 556 ms | 495 ms |
| LCP | 500 ms | 573 ms | 552 ms |
| CLS | 0,01 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 472 ms | 550 ms | 457 ms |
| Load | 1343 ms | 1413 ms | 1093 ms |
| Requests | 39 | 40 | 39 |
| JavaScript-bestanden (volgens script) | 21 | 0 (meetfout, zie onder) | 0 (meetfout, zie onder) |
| Mislukte requests | 3 (`.woff2`) | 4 (`.woff2` + favicon) | 3 (`.woff2`) |
| axe-overtredingen desktop | 5 regels | 5 regels (`button-name` i.p.v. `target-size`) | 5 regels |
| axe-overtredingen mobiel | 5 regels | 5 regels (`button-name` i.p.v. `target-size`) | 5 regels |
| Zonder zichtbare focus | 12 kaartknoppen | 12 kaartknoppen | 12 kaartknoppen |
| Skip link werkt | ❌ | ❌ | ❌ |
| Popover API ondersteund | ✅ | ✅ | ✅ |
| Menu opent met Enter / sluit met Escape | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ |
| Focus terug naar menuknop | ✅ | ✅ | ✅ |
| Menu werkt zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | 43 tekens | 43 tekens | 43 tekens |

De pagina werkt en gedraagt zich in alle drie de engines bijna hetzelfde. De tijden liggen dicht bij elkaar, omdat de servertijd (TTFB ~400 ms) alles bepaalt. De verschillen:
- **Sorteer-select in Firefox:** de `<select>` gebruikt de nieuwe aanpasbare select (`appearance: base-select` met `<button><selectedcontent>`). Chromium ondersteunt dat en zet de gekozen optie ("A-Z") in de knop. Firefox ondersteunt `<selectedcontent>` nog niet: de knop blijft leeg en axe meldt `button-name` (knop zonder naam). Omdat de knop in Firefox geen tekst heeft, meldt axe daar geen `target-size`. De `@supports`-regel in `SelectField.svelte` regelt alleen de stijl, niet de lege knop. Visueel ziet de select er in Firefox wel normaal uit (zie screenshots).
- **JavaScript-bestanden:** het script telt in Firefox en WebKit 0 JS-bestanden, omdat die browsers `modulepreload` niet als `script` registreren. In werkelijkheid laden alle drie de browsers 21 bestanden. Dit was op de `/info`-pagina ook zo.
- **Favicon in Firefox:** alleen Firefox vraagt in deze meting de favicon op, daarom 40 requests en 4 mislukte.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren".

**Screenshots:** het mobiele menu ziet er in de drie browsers hetzelfde uit (`sveltekit-home-<browser>-menu-open.png`). Op de gewone mobiele weergave (`sveltekit-home-<browser>-mobile.png`) is alleen het zoekveld per browser iets anders breed: het smalst in Chromium, het breedst in WebKit. Dat komt door de standaardbreedte van `<input>` per browser.

Het aantal requests is hier 39, in hoofdstuk 2 is het 40. De twee scripts tellen requests op een andere manier. Vergelijk daarom alleen getallen uit hetzelfde script.

Screenshots staan in `tests/results/sveltekit/screenshots/`.

## Beperkingen van deze test

- **Lokale server en serveermethode:** SvelteKit gebruikt adapter-auto en is daarom geserveerd met `npm run preview`: server-side rendering per request, met gzip. Eleventy is als statische bestanden geserveerd met `python3 -m http.server`, zonder compressie. Een deel van het verschil komt dus door de serveermethode en niet door het framework. Echte hosting (CDN, caching, HTTP/2) geeft andere absolute waarden.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Externe afhankelijkheid:** de TTFB hangt af van de responstijd van Directus. De pagina haalt bij elke request data op, dus de tijden schommelen per meting.
- **Ingelogd getest:** de homepage zit achter een login. Alle metingen zijn met een geldige sessie gedaan. Eleventy heeft geen login en is niet ingelogd getest. De sessiecontrole in `hooks.server.js` telt dus mee in de SvelteKit-TTFB.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. De ontbrekende focus, de onbereikbare skip link en het horizontaal scrollen vindt axe niet als overtreding. Een handmatige test met een screenreader blijft nodig.
- **Data uit Directus:** de pagina toont dezelfde 4 partners als Eleventy, maar gesorteerd A-Z. Meer of minder partners geeft andere cijfers voor DOM-grootte, requests en Tab-stops.
- **Externe afbeeldingen:** de partnerlogo's komen van de favicon-dienst van Google. Hun laadtijd valt buiten de lokale server.
- **Andere versie dan de `/info`-test:** deze build gebruikt SvelteKit 2.50.2 (branch `46-user-story-wcag-principles-in-the-sidebar`). De `/info`-test van 12 november gebruikte SvelteKit 2.70.3. Vergelijk de twee SvelteKit-rapporten daarom voorzichtig.
- **Bekende problemen:** de ontbrekende `.woff2`-fonts zitten ook in Eleventy en vallen in de vergelijking tegen elkaar weg. De verkeerde favicon-link is alleen een SvelteKit-probleem in deze code.
