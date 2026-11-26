# Bevindingen frameworkvergelijking (homepage)

Korte samenvatting van de testresultaten van Eleventy, SvelteKit, Next.js en Astro, als basis voor de presentatie. De volledige metingen staan in [Vergelijking frameworks (homepage)](Vergelijking-frameworks.md).

Bronnen:

- **Speedlify2:** Lighthouse (mobiel), axe en page weight, gemeten op de live versies. SvelteKit op `toolgankelijk.dev.fdnd.nl` (18 november 2026), Eleventy, Next.js en Astro op Netlify (23 november 2026).
- **Playwright:** eigen scripts (`tests/scripts/playwright-audit.js` en `tests/scripts/cross-browser.mjs`), lokaal gemeten, mediaan van 5 runs (18–23 november 2026).

## Speedlify (Lighthouse, mobiel)

| Framework | Performance | Accessibility | Best Practices | SEO | Opvallend |
|---|---|---|---|---|---|
| Eleventy | 98 | 100 | 92 | 91 | 0 KB JS, 20 requests, main thread 229 ms |
| SvelteKit | 100 | 91 | 92 | 58 | 58 KB JS, 40 requests, 453 DOM-elementen, main thread 533 ms |
| Next.js | 98 | 100 | 92 | 91 | 137 KB JS (waarvan 50 KB ongebruikt), 30 requests, main thread 344 ms |
| Astro | 98 | 100 | 92 | 91 | 0 KB JS, 20 requests, main thread 209 ms |

- **Eleventy, Next.js en Astro hebben exact dezelfde LCP: 2,29 s.** Bij alle drie gaat 97% van het gewicht naar fonts (ongeveer 693 KB). De fonts zijn dus het knelpunt, niet het framework.
- **De SEO-score van 58 bij SvelteKit komt door de hosting.** Op het dev-domein is de pagina geblokkeerd voor indexering en is `robots.txt` ongeldig.
- **De Eleventy-meting van 18 november is niet gebruikt.** De site stond toen privé, dus Speedlify heeft de inlogpagina van Netlify gemeten (score 40, LCP 15,9 s).

## Playwright (homepage, lokaal)

| | Eleventy | SvelteKit | Next.js | Astro |
|---|---|---|---|---|
| LCP mobiel (Slow 4G) | 616 ms | 1060 ms | 860 ms | **608 ms** |
| JavaScript (gzip) | **0 KB** | 63 KB | 143 KB | **0 KB** |
| axe-overtredingen | **0** | 5 | **0** | **0** |
| Skip link | werkt | werkt niet | werkt | werkt |
| Zonder JavaScript | werkt | deels | werkt | werkt |

## Voor- en nadelen per framework

### Eleventy

- **+** Stuurt geen JavaScript mee, laadt het minst en scoort 100 op toegankelijkheid.
- **+** Eenvoudig: HTML-templates, de data uit Directus wordt opgehaald tijdens de build.
- **−** Er is geen server, dus inloggen en audits bewerken vragen een aparte oplossing.
- **−** Nieuwe data is pas zichtbaar na een nieuwe build.

### SvelteKit

- **+** De enige versie waarin login, dialogen en filteren al werken.
- **+** Weinig eigen JavaScript van het framework: 58–63 KB, de helft van Next.js.
- **−** Traagst in de lokale test: TTFB van ongeveer 400 ms, omdat de pagina bij elke request opnieuw wordt gerenderd met twee calls naar Directus.
- **−** Accessibility 91, 5 axe-overtredingen en een skip link die niet werkt. Dit komt uit onze code, niet uit SvelteKit.

### Next.js

- **+** Snel dankzij statisch renderen: 0 axe-overtredingen, de beste CLS en Lighthouse 98/100.
- **+** Groot ecosysteem rond React.
- **−** Stuurt het meeste JavaScript mee: 137–143 KB, voor 90% React en de router. Daarvan is 50 KB ongebruikt.
- **−** Op deze pagina voegt al dat JavaScript weinig toe. Zonder JavaScript werkt de pagina hetzelfde.

### Astro

- **+** Even licht als Eleventy: 0 KB JS, de minste main-thread-tijd (209 ms) en de beste LCP op mobiel.
- **+** JavaScript komt alleen mee waar je het vraagt (`client:`), en Svelte-componenten zijn als "island" te gebruiken.
- **+** Kan met een adapter ook op een server draaien (SSR), wat nodig is voor inloggen.
- **−** Niet sneller dan Eleventy: het verschil is meetruis.
- **−** Alleen de homepage is getest. Login en SSR zijn nog niet geprobeerd.

## Conclusie (argumentatieproces)

**Standpunt:** Astro past het best bij ons project.

**Argumenten:**

- **A.** Astro is even snel en licht als Eleventy: 0 KB JS, Lighthouse 98 en de beste LCP op mobiel.
- **B.** Astro is net zo toegankelijk: 0 axe-overtredingen lokaal, Accessibility 100 in Speedlify, en de pagina werkt zonder JavaScript.
- **C.** Astro groeit mee: inloggen kan via SSR, en interactie voeg je alleen toe waar dat nodig is.

**Tegenargumenten en weerlegging:**

- *"SvelteKit heeft de login en dialogen al."* Astro kan Svelte-componenten grotendeels hergebruiken als island, dus dat werk gaat niet verloren.
- *"Eleventy is net zo snel en eenvoudiger."* Dat klopt, maar Eleventy heeft geen server voor inloggen en het bewerken van audits.

**Dus:** Astro geeft ons de snelheid van Eleventy, met ruimte voor wat de SvelteKit-versie nu kan.

## Kanttekeningen

- **Fonts:** de grootste winst voor alle vier zit niet in het framework, maar in de fonts: overstappen op `.woff2` of minder font-varianten.
- **Meetomstandigheden:** de Playwright-tests zijn lokaal gedaan met verschillende servers. Speedlify meet SvelteKit op een andere hosting en een andere dag dan de andere drie. Vergelijk daarom vooral de verschillen, niet de exacte waarden.
- **Code verschilt per versie:** SvelteKit heeft meer functies (login, dialogen). De andere versies hebben alleen de homepage. Een deel van de verschillen komt dus uit de code, niet uit het framework.
