# Playwright-test: SvelteKit (/info)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de `/info`-pagina in de **SvelteKit**-versie. Het is exact dezelfde test als op de Eleventy-versie, zodat we de twee frameworks kunnen vergelijken op performance en toegankelijkheid. De vergelijking zelf staat op de pagina [Vergelijking Eleventy vs SvelteKit](Vergelijking-Eleventy-vs-SvelteKit).

| | |
|---|---|
| **Framework** | SvelteKit 2.70.3 (Svelte 5.57.1, Vite 7.3.6) |
| **Pagina** | `/info` |
| **Datum** | 12 november 2026 |
| **Build** | Productie-build (`npm run build`, adapter-auto), geserveerd met `npm run preview -- --port 8081` |
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
| JavaScript naar de browser | **62,7 KB** in 21 bestanden (135,8 KB ongecomprimeerd) |
| Totale paginagrootte | 802,9 KB, waarvan 704,4 KB fonts (88%) |
| LCP mobiel | 476 ms |
| CLS mobiel | 0,02 |
| axe-overtredingen | 2 regels op desktop: `color-contrast` (2 elementen) en `empty-heading` (1) |
| Werkt zonder JavaScript | Ja: content en mobiel menu werken. Het formulier verstuurt wel, maar toont geen melding |
| Toetsenbord | Skip link werkt **niet** (verborgen met `display: none`), mobiel menu volledig bedienbaar, 1 element zonder zichtbare focus |

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 221 ms | 161 ms |
| FCP (First Contentful Paint) | 300 ms | 476 ms |
| LCP (Largest Contentful Paint) | 300 ms | 476 ms |
| CLS (Cumulative Layout Shift) | 0 | 0,02 |
| DOMContentLoaded | 262 ms | 435 ms |
| Load event | 1241 ms | 4839 ms |
| Aantal DOM-elementen | 142 | 142 |

**TTFB is hoog voor localhost.** SvelteKit rendert de pagina bij elke request op de server (SSR). De root-layout (`src/routes/+layout.server.js`) haalt daarbij eerst partners en principes op uit Directus, ook voor de info-pagina die die data niet gebruikt. Die externe request bepaalt de TTFB, en die schommelt: los gemeten met `curl` tussen 160 en 380 ms. Daardoor is de mobiele TTFB in deze meting toevallig lager dan die op desktop, terwijl mobiel 150 ms extra latency heeft.

**FCP min TTFB is bijna gelijk aan Eleventy** (desktop: 79 ms tegen 74 ms). Het verschil in FCP komt dus vrijwel helemaal door de servertijd, niet door het renderen in de browser.

**Load is hoog, ook op desktop (1,2 s).** De `.woff2`-fonts en de favicon ontbreken. In plaats van een 404 stuurt SvelteKit een redirect naar `/login` (zie hoofdstuk 2). De server rendert dan per ontbrekend bestand de loginpagina, inclusief de Directus-request uit de layout. Het load-event wacht op al die requests. Op mobiel komen daar de 680 KB aan `.woff`-fonts en 21 JS-bestanden over Slow 4G bij.

**CLS 0,02 op mobiel** komt, net als bij Eleventy, door de wissel van systeemfont naar webfont (`font-display: swap`).

Total Blocking Time is niet gemeten. Het script meet geen long tasks, zodat de meting gelijk blijft aan die bij Eleventy.

## 2. Netwerk

Grootte = wat over het netwerk ging. `vite preview` comprimeert met gzip, `python3 -m http.server` bij Eleventy niet. Daarom staat de ongecomprimeerde grootte ernaast.

| Type | Requests | Grootte (gzip) | Ongecomprimeerd |
|---|---|---|---|
| HTML | 1 | 9,3 KB | 38,6 KB |
| CSS | 6 | 7,2 KB | 21,3 KB |
| JavaScript | 21 | 62,7 KB | 135,8 KB |
| Afbeeldingen (SVG) | 2 | 11,0 KB | 24,9 KB |
| Fonts | 6 | 704,4 KB | 704,4 KB |
| Overig (favicon) | 1 | 8,2 KB | – |
| **Totaal** | **37** | **802,9 KB** | |

**De HTML is 3× zo groot als bij Eleventy (38,6 tegen 12,9 KB).** Daarvan is 21,8 KB een inline `<script>` met de data voor hydration: alles wat de layout uit Directus ophaalt (partners, principes) gaat mee naar de browser, ook op de info-pagina. Ook staan er 11 inline SVG's (logo en iconen) in de HTML.

**Redirects in plaats van 404's:**
- `/fonts/fira-sans/FiraSans-Regular.woff2` → 302 naar `/login`
- `/fonts/fira-sans/FiraSans-Bold.woff2` → 302 naar `/login`
- `/fonts/fira-sans/FiraSans-Medium.woff2` → 302 naar `/login`
- `/$lib/assets/svglogo.ico` → 302 naar `/login`

Dezelfde `.woff2`-bestanden ontbreken als bij Eleventy. Het verschil is wat de server dan doet. Een pad met drie delen, zoals `/fonts/fira-sans/…`, past op de route `[websiteUID]/[urlUID]/[principleUID]`. Die route vereist inloggen en stuurt je door naar `/login`. De browser downloadt dus 4× de loginpagina (ongeveer 8 KB per keer) en telt die als font of favicon. Daarom is "Fonts" 24,7 KB groter dan bij Eleventy, terwijl de echte `.woff`-bestanden even groot zijn (679,7 KB). Firefox meldt in de console dat het font "rejected by sanitizer" is: hij krijgt HTML in plaats van een font.

De favicon-link in `src/app.html` verwijst naar `$lib/assets/svglogo.ico`. Die `$lib`-alias werkt alleen in imports, niet in `app.html`, dus de browser vraagt letterlijk `/$lib/assets/svglogo.ico` op.

### JavaScript-bestanden

| Bestand | Inhoud | Gzip | Ongecomprimeerd |
|---|---|---|---|
| `chunks/633A1qL9.js` | Svelte-runtime (reactiviteit, hydration) | 12,1 KB | 30,4 KB |
| `chunks/DQF7oWWT.js` | SvelteKit-client: router, preload, scroll | 11,7 KB | 29,8 KB |
| `chunks/DK5blnXX.js` | Icon-component (55 SVG-iconen) | 8,7 KB | 22,9 KB |
| `nodes/0.BPGJVmKa.js` | Root-layout: header, mobiel menu | 5,3 KB | 13,2 KB |
| `entry/app.f2PSoFUg.js` | SvelteKit app-entry | 3,6 KB | 7,9 KB |
| `chunks/B_-PPndt.js` | SvelteKit-client: navigatie, fetch | 2,9 KB | 5,6 KB |
| `chunks/BRVgDCNh.js` | Svelte-runtime (hydrate) | 2,7 KB | 5,3 KB |
| `nodes/8.DACxYFKO.js` | Info-pagina | 2,5 KB | 5,3 KB |
| `chunks/De-XOCWg.js` | gedeelde chunk | 2,3 KB | 4,2 KB |
| `chunks/95UTfnkz.js` | gedeelde chunk | 2,1 KB | 3,9 KB |
| `chunks/CMDgUA7E.js` | gedeelde chunk | 1,3 KB | 2,0 KB |
| `nodes/1.DO4XDbTP.js` | Error-pagina (alvast geladen) | 1,2 KB | 1,0 KB |
| `chunks/Cc0Bm_pR.js` | gedeelde chunk | 1,1 KB | 0,8 KB |
| `chunks/BcoEV23Q.js` | gedeelde chunk | 0,9 KB | 1,2 KB |
| `chunks/BQWe9W7W.js` | gedeelde chunk | 0,8 KB | 0,6 KB |
| `chunks/EA-FL1RI.js` | gedeelde chunk | 0,8 KB | 0,5 KB |
| `chunks/sQg3JvtC.js` | gedeelde chunk | 0,7 KB | 0,4 KB |
| `chunks/irx9Uy1t.js` | gedeelde chunk | 0,7 KB | 0,5 KB |
| `chunks/BvR4Ne8k.js` | gedeelde chunk | 0,5 KB | 0,2 KB |
| `entry/start.aKKmJRKz.js` | SvelteKit start-entry | 0,4 KB | 0,1 KB |
| `chunks/DsnmJJEf.js` | gedeelde chunk | 0,3 KB | 0,1 KB |
| **Totaal (21 bestanden)** | | **62,7 KB** | **135,8 KB** |

Alle paden beginnen met `/_app/immutable/`. "Gzip" is inclusief HTTP-headers; daardoor is bij heel kleine bestanden de gzip-waarde groter dan het bestand zelf. Ongeveer 60% van het JavaScript is framework (Svelte-runtime en SvelteKit-router). De info-pagina zelf is maar 2,5 KB. De Icon-component laadt alle 55 iconen, ook als de pagina er maar een paar gebruikt.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 34 | 34 |
| Overtredingen | 2 regels, 3 elementen | 1 regel, 1 element |
| Handmatig na te kijken | 0 | 7 elementen (`color-contrast`) |

**Overtreding 1: `color-contrast` (ernst: serious)**

Witte tekst haalt niet de vereiste contrastverhouding van 4,5:1:

| Element | Contrast | Kleuren |
|---|---|---|
| Sectie "Is uw website al toegankelijk?" | 3,64:1 | `#ffffff` op `#7a8f0b` (groen) |
| Sectie "Wat is de wettelijke achtergrond?" (1 alinea) | 4,08:1 | `#ffffff` op `#0084c8` (blauw) |

Dezelfde kleuren als bij Eleventy. Axe telt hier 2 elementen in plaats van 3, omdat de blauwe sectie in SvelteKit één `<p>` is met `<br>`'s, en in Eleventy twee `<p>`'s. Het probleem is hetzelfde.

Op mobiel kon axe het contrast van 7 elementen niet zelf bepalen ("incomplete"). Net als bij Eleventy overlappen de tekstblokken op een smal scherm door `height: 45vh` op `.text-container`.

**Overtreding 2: `empty-heading` (ernst: minor)**

De `<h1>` is leeg. De info-pagina geeft `{ titel: 'Informatie' }` door aan de `Heading`-component, maar die leest `heading.title`. Door die tikfout is de `<h1>` leeg en valt de `<title>` terug op de standaardwaarde "Partneroverzicht". Dit is een fout in de code, niet in het framework.

### Structuur

| Check | Resultaat |
|---|---|
| `lang`-attribuut | `nl` |
| `<title>` | "Partneroverzicht" (hoort "Informatie" te zijn, zie hierboven) |
| Aantal `<h1>` | 1 (leeg) |
| Koppenvolgorde | h1 > h2 > h2 > h3 > h2 > h2 |
| Landmarks | `header`: 1, `nav`: 1 (desktop) / 0 zichtbaar (mobiel, achter het menu), `main`: 1, `footer`: 0 |
| Afbeeldingen zonder `alt` | 0 |
| Horizontaal scrollen | Nee |

## 4. Toetsenbordnavigatie (desktop)

| # | Element | Zichtbare focus |
|---|---|---|
| 1 | Logo ("ga naar homepagina") | ✅ |
| 2 | Home | ✅ |
| 3 | Info | ✅ |
| 4 | Account | ✅ |
| 5 | Naam (input) | ✅ |
| 6 | Email (input) | ✅ |
| 7 | Uw vraag (textarea) | ✅ |
| 8 | Verstuur-knop ("Verzend Vraag") | ❌ |

- **Skip link werkt niet.** ❌ De link "Jump directly to main content" staat wel in de HTML, maar krijgt de class `disabled`. In `static/global.css` staat `.disabled { display: none; }`, dus de link is onzichtbaar en geen Tab-stop. De eerste Tab gaat naar het logo. `<main id="main">` bestaat wel; alleen de link is verborgen.
- **Verstuur-knop zonder focusstijl:** net als bij Eleventy haalt de reset `button { outline: inherit }` in `global.css` de outline weg.
- **Account:** in SvelteKit is dit een echte link met `href`, dus wel een Tab-stop. In de statische Eleventy-versie niet.

## 5. Mobiel menu (hamburger)

Gebouwd met de Popover API (`popover="auto"` en `popovertarget`), net als in Eleventy. Het menu heeft dus geen JavaScript nodig.

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
| Tekst in `<main>` | 2226 tekens (volledige inhoud) |
| Koppen | 6 |
| Links | 8 |
| Mobiel menu werkt | ✅ |
| Formulier | Verstuurt wel, maar geeft geen melding (niet getest, zie hieronder) |

SvelteKit rendert de pagina op de server, dus zonder JavaScript krijg je dezelfde HTML als met JavaScript.

| Onderdeel | Met JS | Zonder JS |
|---|---|---|
| Content (tekst, koppen, afbeeldingen) | ✅ | ✅ |
| Mobiel menu | ✅ | ✅ (Popover API is HTML, geen JS) |
| Formulier versturen | ✅ via `use:enhance` (fetch, geen herlaad) | ✅ gewone POST naar `/info` (`method="POST"`), daarna herlaadt de pagina |
| Melding "Verzonden!" of foutmelding | ✅ | ❌ de melding wordt alleen in de `use:enhance`-callback gezet. De pagina leest de `form`-prop niet uit, dus na een POST zonder JS ziet de gebruiker niets |

Het versturen zelf is niet getest, omdat elke inzending echt in Hygraph wordt opgeslagen. De tabel is gebaseerd op de code en de gerenderde HTML.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| TTFB | 225 ms | 196 ms | 172 ms |
| FCP | 272 ms | 260 ms | 228 ms |
| LCP | 272 ms | 260 ms | 228 ms |
| CLS | 0 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 267 ms | 256 ms | 213 ms |
| Load | 1642 ms | 1445 ms | 1041 ms |
| Requests | 39 | 41 | 39 |
| JavaScript-bestanden | 21 | 21 (script telt 0, zie onder) | 21 (script telt 0, zie onder) |
| Mislukte requests | 0 (wel 3 redirects `.woff2` → `/login`) | 0 (wel 4 redirects) | 0 (wel 3 redirects) |
| axe-overtredingen desktop | `color-contrast` (2), `empty-heading` (1) | `color-contrast` (2), `empty-heading` (1) | `color-contrast` (2), `empty-heading` (1) |
| axe-overtredingen mobiel | `empty-heading` (1) | `color-contrast` (1), `empty-heading` (1) | `empty-heading` (1) |
| Tab-stops | 8 | 8 | 8 |
| Zonder zichtbare focus | Verstuur-knop | Verstuur-knop | Verstuur-knop |
| Skip link werkt | ❌ | ❌ | ❌ |
| Popover API ondersteund | ✅ | ✅ | ✅ |
| Menu opent met Enter / sluit met Escape | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ |
| Focus terug naar menuknop | ✅ | ✅ | ✅ |
| Menu werkt zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | 2226 tekens | 2226 tekens | 2224 tekens |

De pagina gedraagt zich in alle drie de engines hetzelfde. Wat opvalt:
- **CLS:** alleen Chromium ondersteunt de Layout Instability API. In Firefox en WebKit is CLS daarom niet meetbaar.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren". Met die toets zijn de Tab-stops gelijk aan die in de andere browsers.
- **JavaScript-bestanden in Firefox en WebKit:** het script telt resources met `initiatorType === 'script'`. SvelteKit laadt zijn modules via `<link rel="modulepreload">`. Chromium noemt die `script`, Firefox en WebKit noemen ze `link`. Er worden in alle drie de browsers 21 JS-bestanden geladen (los gecontroleerd), het script telt ze alleen niet.
- **Requests:** Playwright telt een redirect als aparte response. Firefox vraagt ook de favicon op (+ de redirect daarvan), Chromium en WebKit headless niet.
- **Firefox mobiel:** axe vindt hier 1 contrast-element dat in Chromium en WebKit "incomplete" blijft. De tekstblokken overlappen op een smal scherm, en Firefox rendert die overlap anders. Hetzelfde verschil zat in de Eleventy-test.

**Screenshots mobiel menu.** Het open menu ziet er in alle drie de browsers precies hetzelfde uit. In alle drie valt de sluitknop half buiten beeld aan de rechterkant, en zijn de menu-items smal (ongeveer 130 px) in plaats van over de hele breedte zoals bij Eleventy. Dat is een CSS-verschil tussen de twee versies, geen browserverschil. Bij het dichte menu toont Firefox de afbeelding in het groene blok kleiner en de tekst breder dan Chromium en WebKit. Dat gebeurt in de Eleventy-versie ook, dus het komt door de CSS en niet door het framework.

Screenshots staan in `tests/results/sveltekit/screenshots/` (`sveltekit-<browser>-menu-open.png` en `sveltekit-<browser>-mobile.png`).

## Beperkingen van deze test

- **Andere server dan bij Eleventy:** dit project gebruikt adapter-auto, dus er is geen statische buildmap. Daarom is getest met `npm run preview` (de Node-server van Vite) en niet met `python3 -m http.server`. Twee gevolgen: (1) `vite preview` comprimeert met gzip, de Python-server niet. Daarom staan in hoofdstuk 2 ook de ongecomprimeerde groottes. (2) De pagina wordt bij elke request op de server gerenderd, inclusief een externe request naar Directus. Dat is eerlijk voor SvelteKit zoals dit project het gebruikt, maar het is geen vergelijking van "statische HTML tegen statische HTML".
- **Externe afhankelijkheid:** de TTFB hangt af van de responstijd van Directus. Die schommelt, dus de absolute TTFB is minder stabiel dan bij Eleventy. Bij de eerste start van de server mislukte één Directus-request ("fetch failed").
- **Niet ingelogd:** de officiële meting is uitgevoerd zonder sessie. Een eerste run in het MCP-browserprofiel had nog een ingelogde sessie. Daarin was de TTFB hoger (322 ms desktop), omdat `hooks.server.js` dan eerst de sessie controleert. Ook gaven ontbrekende bestanden daar een 404 in plaats van een redirect. Die run staat in `sveltekit-info.json` onder `loggedInRun`, maar is niet gebruikt in dit rapport.
- **Lokale server:** gemeten op localhost. Echte hosting geeft andere absolute waarden.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. Een handmatige test met een screenreader blijft nodig.
- **Formulier:** versturen is niet getest, omdat inzendingen echt in Hygraph worden opgeslagen.
- **Bekende problemen in beide versies:** de ontbrekende `.woff2`-fonts en de favicon. In SvelteKit leiden ze tot een redirect naar de loginpagina in plaats van een 404, wat de Load-tijd verhoogt.
