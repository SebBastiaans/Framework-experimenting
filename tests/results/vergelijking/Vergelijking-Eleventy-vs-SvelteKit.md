# Vergelijking: Eleventy vs SvelteKit (/info)

Op deze pagina zetten we de testresultaten van de `/info`-pagina in de Eleventy-versie en de SvelteKit-versie naast elkaar. Beide versies zijn getest met dezelfde scripts (`tests/scripts/playwright-audit.js` en `tests/scripts/cross-browser.mjs`), dezelfde profielen, 5 runs per meting (mediaan) en axe-core 4.10.2. Alle details staan op [Playwright-test Eleventy](Playwright-test-Eleventy) en [Playwright-test SvelteKit](Playwright-test-SvelteKit).

| | Eleventy | SvelteKit |
|---|---|---|
| **Versie** | Eleventy 3.1.8 | SvelteKit 2.70.3 (Svelte 5.57.1) |
| **Pad** | `/info/` | `/info` |
| **Server** | `python3 -m http.server` (statische bestanden, geen compressie) | `npm run preview` (Node, server-side rendering, gzip) |
| **Datum** | 12 november 2026 | 12 november 2026 |

Bronnen: `eleventy-info.json`, `eleventy-cross-browser.json`, `sveltekit-info.json` en `sveltekit-cross-browser.json` in `tests/results/<framework>/`.

## Metingen (Chromium, Playwright MCP)

| Meting | Eleventy | SvelteKit | Verschil |
|---|---|---|---|
| TTFB desktop | 2 ms | 221 ms | +219 ms |
| TTFB mobiel | 151 ms | 161 ms | +10 ms |
| FCP desktop | 76 ms | 300 ms | +224 ms |
| FCP mobiel | 504 ms | 476 ms | −28 ms |
| LCP desktop | 76 ms | 300 ms | +224 ms |
| LCP mobiel | 504 ms | 476 ms | −28 ms |
| CLS desktop | 0 | 0 | 0 |
| CLS mobiel | 0,02 | 0,02 | 0 |
| DOMContentLoaded desktop | 11 ms | 262 ms | +251 ms |
| DOMContentLoaded mobiel | 221 ms | 435 ms | +214 ms |
| Load desktop | 42 ms | 1241 ms | +1199 ms |
| Load mobiel | 4085 ms | 4839 ms | +754 ms |
| Requests | 12 | 37 | +25 |
| KB totaal (overgedragen) | 731,4 KB | 802,9 KB | +71,5 KB |
| KB totaal (ongecomprimeerd) | 731,4 KB | 933,2 KB | +201,8 KB |
| KB JavaScript | 0 KB (0 bestanden) | 62,7 KB gzip / 135,8 KB ongecomprimeerd (21 bestanden) | +62,7 KB / +135,8 KB |
| KB CSS | 13,0 KB (2 bestanden) | 7,2 KB gzip / 21,3 KB ongecomprimeerd (6 bestanden) | −5,8 KB / +8,3 KB |
| KB fonts | 679,6 KB | 704,4 KB | +24,8 KB (3× loginpagina, zie onder) |
| KB HTML | 12,9 KB | 9,3 KB gzip / 38,6 KB ongecomprimeerd | −3,6 KB / +25,7 KB |
| DOM-elementen | 92 | 142 | +50 |
| axe-overtredingen desktop | 1 regel, 3 elementen (`color-contrast`) | 2 regels, 3 elementen (`color-contrast` 2, `empty-heading` 1) | +1 regel |
| axe-overtredingen mobiel | 1 regel, 1 element (`color-contrast`) | 1 regel, 1 element (`empty-heading`) | gelijk aantal, andere regel |
| Elementen zonder zichtbare focus | 1 (Verstuur-knop) | 1 (Verstuur-knop) | gelijk |
| Skip link werkt | ✅ | ❌ | |
| Mobiel menu met JS | ✅ | ✅ | gelijk |
| Mobiel menu zonder JS | ✅ | ✅ | gelijk |
| Content zonder JS | ✅ 2229 tekens | ✅ 2226 tekens | gelijk |

Eleventy is ongecomprimeerd geserveerd, SvelteKit met gzip. Daarom staan bij SvelteKit beide waarden. Voor een eerlijke vergelijking van wat er gebouwd wordt, kijk naar de ongecomprimeerde kolom. Voor wat een gebruiker in deze testopstelling echt downloadt, kijk naar de overgedragen waarde.

## Cross-browser (desktop, zonder vertraging)

| Browser | | Eleventy | SvelteKit |
|---|---|---|---|
| **Chromium 158** | FCP | 24 ms | 272 ms |
| | Load | 26 ms | 1642 ms |
| | Skip link | ✅ | ❌ |
| | Menu (Enter / Escape) | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ |
| **Firefox 159** | FCP | 41 ms | 260 ms |
| | Load | 37 ms | 1445 ms |
| | Skip link | ✅ | ❌ |
| | Menu (Enter / Escape) | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ |
| **WebKit 27.2** | FCP | 30 ms | 228 ms |
| | Load | 14 ms | 1041 ms |
| | Skip link | ✅ | ❌ |
| | Menu (Enter / Escape) | ✅ | ✅ |
| | Menu en content zonder JS | ✅ | ✅ |

In WebKit is met Alt+Tab getest, omdat Safari met Tab standaard alleen langs formuliervelden springt. CLS is alleen in Chromium meetbaar.

## Conclusie

### Performance

Eleventy is op desktop veel sneller: FCP 76 tegen 300 ms, Load 42 tegen 1241 ms. Op mobiel (Slow 4G) is het verschil in FCP en LCP weg; SvelteKit is daar zelfs 28 ms sneller.

**Door het framework:**
- **Server-side rendering per request.** Eleventy levert een kant-en-klaar HTML-bestand (TTFB 2 ms). SvelteKit bouwt de pagina bij elke request op de server. Na de eerste byte is het renderen in de browser bij beide even snel (FCP min TTFB: 74 tegen 79 ms). Het verschil in FCP komt dus vrijwel helemaal door de servertijd.
- **JavaScript voor hydration.** SvelteKit stuurt 21 JS-bestanden mee (62,7 KB gzip). Ongeveer 60% daarvan is de Svelte-runtime en de SvelteKit-router. Eleventy stuurt 0 KB. Op deze pagina, die bijna geen interactie heeft, voegt dat JavaScript weinig toe. Het zorgt wel voor 21 extra requests en een hogere DOMContentLoaded.
- **Hydration-data in de HTML.** 21,8 KB van de SvelteKit-HTML is data die de browser nodig heeft om de pagina "wakker" te maken.

**Door de code of de opzet:**
- **Directus-request in de root-layout.** Die haalt bij elke pagina partners en principes op, ook op `/info` waar die data niet nodig is. Dat bepaalt de TTFB en vergroot de HTML. Met `export const prerender = true` op `/info`, of door de data alleen op te halen waar die gebruikt wordt, zou SvelteKit veel dichter bij Eleventy komen.
- **Redirect in plaats van 404.** Ontbrekende `.woff2`-fonts en de favicon matchen in SvelteKit de dynamische route `[websiteUID]/[urlUID]/[principleUID]`, die doorstuurt naar `/login`. De server rendert dus 4× de loginpagina. Dat is de grootste oorzaak van de hoge Load-tijd op desktop (1,2 s tegen 42 ms).
- **Gzip.** SvelteKit wint op mobiel FCP vooral doordat `vite preview` comprimeert. HTML en CSS komen daardoor sneller binnen over Slow 4G. Met compressie op de Eleventy-server zou dat verschil verdwijnen.
- **Fonts in beide versies.** De `.woff2`-bestanden ontbreken in beide versies, en de `.woff`-fallbacks zijn in beide even groot (679,7 KB). Fonts zijn in beide versies ongeveer 90% van de pagina. Dit verschil valt tegen elkaar weg; de echte winst zit in het toevoegen van `.woff2` of het subsetten van de fonts.

### Toegankelijkheid

Beide versies hebben dezelfde contrastproblemen (groen 3,64:1 en blauw 4,08:1) en dezelfde Verstuur-knop zonder zichtbare focus. Die komen uit de gedeelde CSS (`global.css`), niet uit het framework.

De verschillen komen allemaal door de code, niet door SvelteKit:
- **Skip link:** werkt in Eleventy, in SvelteKit niet. In SvelteKit krijgt de link de class `disabled`, en `.disabled { display: none; }` in `global.css` verbergt hem. Dit is het belangrijkste toegankelijkheidsverschil.
- **Lege `<h1>` en verkeerde `<title>`:** de info-pagina geeft `titel` door, de `Heading`-component verwacht `title`. Daardoor is de `<h1>` leeg en heet de pagina "Partneroverzicht".
- **Account-link:** is in SvelteKit een echte link en dus een Tab-stop, in Eleventy niet.

Als de skip link en de `title`-tikfout opgelost worden, zijn de twee versies op toegankelijkheid gelijk.

### Werking zonder JavaScript

Beide versies tonen zonder JavaScript de volledige inhoud, en in beide werkt het mobiele menu, omdat het op de Popover API (HTML) gebouwd is. SvelteKit rendert op de server, dus de HTML is compleet zonder JS.

Het formulier verschilt:
- **Eleventy:** het formulier is statisch en verstuurt niets (met of zonder JS).
- **SvelteKit:** het formulier verstuurt met en zonder JS, via de server-action (`method="POST"`). Met JS gebeurt dat via `use:enhance` zonder herlaad. Zonder JS krijgt de gebruiker geen bevestiging of foutmelding, omdat de pagina die alleen in de `use:enhance`-callback zet en de `form`-prop niet gebruikt.

Hier heeft SvelteKit een voordeel door het framework: progressive enhancement van formulieren zit erin ingebouwd.

### Browserondersteuning

Beide versies werken in Chromium, Firefox en WebKit hetzelfde. De verschillen tussen browsers zijn klein en gelijk voor beide frameworks: Firefox rendert de overlappende tekstblokken op mobiel iets anders (andere axe-telling, kleinere afbeelding in het groene blok), en WebKit vraagt Alt+Tab. De Popover API werkt in alle drie de engines.

Eén meetverschil: het cross-browser-script telt in Firefox en WebKit 0 JS-bestanden voor SvelteKit, omdat die browsers `modulepreload` als `link` registreren in plaats van `script`. In werkelijkheid laden alle drie de browsers 21 bestanden.

## Beperkingen

- **Lokale server:** beide versies zijn op localhost gemeten. Echte hosting (met CDN, compressie, caching en HTTP/2) geeft andere absolute waarden. Kijk vooral naar de verschillen, niet naar de absolute getallen.
- **Gesimuleerde vertraging:** de mobiele CPU- en netwerkvertraging zijn nagebootst zoals Lighthouse dat doet, en alleen in Chromium. Dat is niet hetzelfde als een echt mobiel toestel. De cross-browser-metingen zijn zonder vertraging gedaan.
- **Verschillen in serveermethode:** Eleventy is als statische bestanden geserveerd met `python3 -m http.server` (geen compressie). SvelteKit gebruikt adapter-auto en is daarom geserveerd met `npm run preview`: server-side rendering per request, met gzip en met een externe Directus-request. Een deel van het verschil komt dus door de serveermethode en niet door het framework. Een eerlijkere vergelijking van alleen het framework zou de SvelteKit-pagina prerenderen (adapter-static) en met dezelfde Python-server serveren.
- **Externe afhankelijkheid:** de SvelteKit-TTFB hangt af van de responstijd van Directus en schommelt daardoor (160–380 ms los gemeten).
- **Eén pagina:** alleen `/info` is getest. Op pagina's met veel interactie kan het JavaScript van SvelteKit juist voordeel geven.
- **axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. Een handmatige test met een screenreader blijft nodig.
