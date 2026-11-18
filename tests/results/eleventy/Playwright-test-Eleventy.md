# Playwright-test: Eleventy (/info)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de `/info`-pagina in de **Eleventy**-versie. Met dezelfde test op de SvelteKit-versie kunnen we de twee frameworks vergelijken op performance en toegankelijkheid.

| | |
|---|---|
| **Framework** | Eleventy 3.1.8 |
| **Pagina** | `/info/` |
| **Datum** | 12 november 2026 |
| **Build** | Productie-build (`npx @11ty/eleventy`), geserveerd met `python3 -m http.server` |
| **Browser** | Chromium via Playwright MCP (hoofdstuk 1–6), plus Chromium, Firefox en WebKit via Playwright (hoofdstuk 7) |
| **Metingen** | 5 runs per profiel, mediaan gerapporteerd, cache leeg bij elke run |
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
| Totale paginagrootte | 731,4 KB, waarvan 679,6 KB fonts (93%) |
| LCP mobiel | 504 ms |
| CLS mobiel | 0,02 |
| axe-overtredingen | 1 regel (`color-contrast`), 3 elementen op desktop |
| Werkt zonder JavaScript | Ja, inclusief het mobiele menu |
| Toetsenbord | Skip link werkt, mobiel menu volledig bedienbaar, 1 element zonder zichtbare focus |

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 2 ms | 151 ms |
| FCP (First Contentful Paint) | 76 ms | 504 ms |
| LCP (Largest Contentful Paint) | 76 ms | 504 ms |
| CLS (Cumulative Layout Shift) | 0 | 0,02 |
| DOMContentLoaded | 11 ms | 221 ms |
| Load event | 42 ms | 4085 ms |
| Aantal DOM-elementen | 92 | 92 |

De pagina bevat geen JavaScript, dus Total Blocking Time is niet gemeten: daar is niets om te meten.

De Load-tijd op mobiel is hoog (4,1 s) doordat de fonts groot zijn. FCP en LCP blijven laag, omdat `font-display: swap` de tekst eerst in een systeemfont toont. De wissel naar het webfont veroorzaakt de kleine layout shift (CLS 0,02).

## 2. Netwerk

| Type | Requests | Grootte |
|---|---|---|
| HTML | 1 | 12,9 KB |
| CSS | 2 | 13,0 KB |
| JavaScript | 0 | 0 KB |
| Afbeeldingen (SVG) | 2 | 25,2 KB |
| Fonts | 6 | 679,6 KB |
| Overig (favicon) | 1 | 0,6 KB |
| **Totaal** | **12** | **731,4 KB** |

**Mislukte requests (404):**
- `/fonts/fira-sans/FiraSans-Regular.woff2`
- `/fonts/fira-sans/FiraSans-Bold.woff2`
- `/fonts/fira-sans/FiraSans-Medium.woff2`
- `/favicon.ico`

De CSS vraagt eerst `.woff2` op. Die bestanden ontbreken, dus de browser valt terug op `.woff`: drie bestanden van ongeveer 225 KB elk. Van de 6 font-requests zijn er dus 3 mislukt.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 39 | 37 |
| Overtredingen | 1 regel, 3 elementen | 1 regel, 1 element |
| Handmatig na te kijken | 0 | 7 elementen (`color-contrast`) |

**Overtreding: `color-contrast` (ernst: serious)**

Witte tekst haalt niet de vereiste contrastverhouding van 4,5:1:

| Element | Contrast | Kleuren |
|---|---|---|
| Sectie "Is uw website al toegankelijk?" | 3,64:1 | `#ffffff` op `#7a8f0b` (groen) |
| Sectie "Wat is de wettelijke achtergrond?" (2 alinea's) | 4,08:1 | `#ffffff` op `#0084c8` (blauw) |

Op mobiel kon axe het contrast van 7 elementen niet zelf bepalen ("incomplete"). Op een smal scherm overlappen de tekstblokken, door `height: 45vh` op `.text-container`.

### Structuur

| Check | Resultaat |
|---|---|
| `lang`-attribuut | `nl` |
| `<title>` | "Info" |
| Aantal `<h1>` | 1 (visueel verborgen) |
| Koppenvolgorde | h1 > h2 > h2 > h3 > h2 > h2 |
| Landmarks | `header`: 1, `nav`: 1 (desktop) / 0 zichtbaar (mobiel, achter het menu), `main`: 1, `footer`: 0 |
| Afbeeldingen zonder `alt` | 0 |
| Horizontaal scrollen | Nee |

## 4. Toetsenbordnavigatie (desktop)

| # | Element | Zichtbare focus |
|---|---|---|
| 1 | Skip link "Jump directly to main content" | ✅ |
| 2 | Logo ("ga naar homepagina") | ✅ |
| 3 | Home | ✅ |
| 4 | Info | ✅ |
| 5 | Naam (input) | ✅ |
| 6 | Email (input) | ✅ |
| 7 | Uw vraag (textarea) | ✅ |
| 8 | Verstuur-knop ("Verzend Vraag") | ❌ |

- **Skip link:** de eerste Tab-stop. Enter verplaatst de focus naar `<main>`. ✅
- **Verstuur-knop zonder focusstijl:** de reset `button { outline: inherit }` in `global.css` haalt de outline weg.
- **Account:** de knop staat er wel, maar is geen Tab-stop. In de statische versie heeft hij geen `href`.

## 5. Mobiel menu (hamburger)

Gebouwd met de Popover API (`popover="auto"` en `popovertarget`), zonder JavaScript.

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
| Tekst in `<main>` | 2229 tekens (volledige inhoud) |
| Koppen | 6 |
| Links | 6 |
| Mobiel menu werkt | ✅ |

De pagina werkt hetzelfde met en zonder JavaScript, omdat Eleventy alleen statische HTML en CSS oplevert.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| FCP | 24 ms | 41 ms | 30 ms |
| LCP | 24 ms | 41 ms | 30 ms |
| CLS | 0 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 6 ms | 7 ms | 6 ms |
| Load | 26 ms | 37 ms | 14 ms |
| Requests | 11 | 11 | 11 |
| JavaScript-bestanden | 0 | 0 | 0 |
| Mislukte requests | 3 (`.woff2`) | 3 (`.woff2`) | 3 (`.woff2`) |
| axe-overtredingen desktop | `color-contrast` (3) | `color-contrast` (3) | `color-contrast` (3) |
| axe-overtredingen mobiel | `color-contrast` (1) | `color-contrast` (2) | `color-contrast` (1) |
| Tab-stops | 8 | 8 | 8 |
| Zonder zichtbare focus | Verstuur-knop | Verstuur-knop | Verstuur-knop |
| Skip link werkt | ✅ | ✅ | ✅ |
| Popover API ondersteund | ✅ | ✅ | ✅ |
| Menu opent met Enter / sluit met Escape | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ |
| Focus terug naar menuknop | ✅ | ✅ | ✅ |
| Menu werkt zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | 2229 tekens | 2229 tekens | 2229 tekens |

De pagina werkt en gedraagt zich in alle drie de engines hetzelfde. Er zijn twee kleine verschillen:
- **Firefox mobiel:** axe vindt hier 2 contrast-elementen in plaats van 1. De tekstblokken overlappen op een smal scherm, en Firefox rendert die overlap anders. Daardoor beoordeelt axe één extra element.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren". Met die toets zijn de Tab-stops gelijk aan die in de andere browsers.

Screenshots van het mobiele menu staan in `tests/results/eleventy/screenshots/` (`eleventy-<browser>-menu-open.png` en `eleventy-<browser>-mobile.png`).

## Beperkingen van deze test

- **Lokale server:** gemeten op localhost met `python3 -m http.server`. Die server comprimeert niet (geen gzip of brotli) en stuurt geen cache-headers mee. Echte hosting geeft andere absolute waarden. Voor de vergelijking telt dat beide versies op dezelfde manier getest zijn.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. Een handmatige test met een screenreader blijft nodig.
- **Formulier:** het formulier is statisch. Versturen werkt in deze versie niet en is niet getest.
- **Bekende problemen in beide versies:** de ontbrekende `.woff2`-fonts en de favicon. Als die in de SvelteKit-versie ook ontbreken, vallen ze tegen elkaar weg in de vergelijking.
