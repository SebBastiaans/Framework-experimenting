# Playwright-test: Eleventy (homepage)

Deze pagina legt de resultaten vast van de geautomatiseerde test van de homepage (`/`) in de **Eleventy**-versie. Met dezelfde test op de andere frameworks kunnen we die vergelijken op performance, toegankelijkheid en browserondersteuning. De test van de `/info`-pagina staat op [Playwright-test Eleventy](Playwright-test-Eleventy).

| | |
|---|---|
| **Framework** | Eleventy 3.1.8 |
| **Pagina** | `/` (homepage) |
| **Datum** | 18 november 2026 |
| **Build** | Productie-build (`npx @11ty/eleventy`), geserveerd met `python3 -m http.server` |
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
| Totale paginagrootte | 733,8 KB, waarvan 679,6 KB fonts (93%) |
| LCP mobiel | 616 ms |
| CLS mobiel | 0,009 |
| axe-overtredingen | 0 |
| Werkt zonder JavaScript | Ja, inclusief het mobiele menu |
| Toetsenbord | Skip link werkt, mobiel menu volledig bedienbaar, 12 knoppen zonder zichtbare focus |
| Horizontaal scrollen op mobiel | Ja |

## 1. Performance

| Meting | Desktop | Mobiel |
|---|---|---|
| TTFB (Time to First Byte) | 2 ms | 153 ms |
| FCP (First Contentful Paint) | 76 ms | 544 ms |
| LCP (Largest Contentful Paint) | 96 ms | 616 ms |
| CLS (Cumulative Layout Shift) | 0,005 | 0,009 |
| DOMContentLoaded | 11 ms | 284 ms |
| Load event | 55 ms | 4122 ms |
| Aantal DOM-elementen | 200 | 200 |

De pagina bevat geen JavaScript, dus Total Blocking Time is niet gemeten: daar is niets om te meten.

De Load-tijd op mobiel is hoog (4,1 s) doordat de fonts groot zijn. FCP en LCP blijven laag, omdat `font-display: swap` de tekst eerst in een systeemfont toont. De LCP ligt iets later dan de FCP. Dat komt waarschijnlijk door de partnerlogo's op de kaarten, die van een externe dienst komen (zie hoofdstuk 2).

## 2. Netwerk

| Type | Requests | Grootte |
|---|---|---|
| HTML | 1 | 25,8 KB |
| CSS | 4 | 20,6 KB |
| JavaScript | 0 | 0 KB |
| Afbeeldingen (partnerlogo's) | 4 | 7,1 KB |
| Fonts | 6 | 679,6 KB |
| Overig (favicon) | 1 | 0,6 KB |
| **Totaal** | **16** | **733,8 KB** |

De groottes komen uit de mobiele meting. Op desktop zijn de afbeeldingen 7,7 KB.

**Mislukte requests (404):**
- `/fonts/fira-sans/FiraSans-Regular.woff2`
- `/fonts/fira-sans/FiraSans-Bold.woff2`
- `/fonts/fira-sans/FiraSans-Medium.woff2`
- `/favicon.ico`

De CSS vraagt eerst `.woff2` op. Die bestanden ontbreken, dus de browser valt terug op `.woff`: drie bestanden van ongeveer 225 KB elk. Van de 6 font-requests zijn er dus 3 mislukt.

De partnerlogo's komen van de favicon-dienst van Google (`site.faviconAPI` in `site.json`). Het zijn de enige requests naar een andere server. Hun laadtijd hangt dus af van die dienst, niet van Eleventy.

De icoontjes (toevoegen, filter, audit, bewerken, verwijderen) staan als inline SVG in de HTML en kosten geen eigen requests. Ze maken de HTML wel groter: 25,8 KB tegenover 12,9 KB op de info-pagina.

## 3. Toegankelijkheid (axe-core 4.10.2)

Getest op WCAG 2.0, 2.1 en 2.2 niveau A en AA, plus de best practices van axe.

| | Desktop | Mobiel |
|---|---|---|
| Geslaagde regels | 43 | 41 |
| Overtredingen | 0 | 0 |
| Handmatig na te kijken | 0 | 0 |

axe vindt geen overtredingen. Het ontbreken van een zichtbare focus (hoofdstuk 4) en het horizontaal scrollen (hieronder) ziet axe niet. Die problemen zijn er wel.

### Structuur

| Check | Resultaat |
|---|---|
| `lang`-attribuut | `nl` |
| `<title>` | "Home" |
| Aantal `<h1>` | 1 (visueel verborgen) |
| Koppenvolgorde | h1 > h2 > h2 > h2 > h2 (een h2 per partnerkaart) |
| Landmarks | `header`: 1, `nav`: 1 (desktop) / 0 zichtbaar (mobiel, achter het menu), `main`: 1, `footer`: 0 |
| Afbeeldingen zonder `alt` | 0 |
| Horizontaal scrollen | Desktop: nee. Mobiel (390 px): **ja** |

Op mobiel is de pagina breder dan het scherm. Welk element dat veroorzaakt, is nog niet onderzocht. Dit valt onder WCAG 1.4.10 (Reflow).

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

- **Skip link:** de eerste Tab-stop. Enter verplaatst de focus naar `<main>`. ✅
- **Knoppen op de kaarten zonder focusstijl:** de reset `button { outline: inherit }` in `global.css` haalt de outline weg, en `.navbutton` zet hem niet terug. Het gaat om 3 knoppen per kaart, dus 12 in totaal. Dit is dezelfde oorzaak als bij de verstuur-knop op de info-pagina.
- **Volgorde:** de Tab-volgorde volgt de visuele volgorde: header, sub-header (toevoegen, zoeken, filter, sorteren) en daarna de kaarten.
- **Skip link in het Engels:** de tekst staat in het Engels op een Nederlandse pagina (`lang="nl"`). Een screenreader leest hem met een Nederlandse uitspraak voor.

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
| Tekst in `<main>` | 168 tekens (alle kaarten en bedieningselementen) |
| Koppen | 5 |
| Links | 11 |
| Mobiel menu werkt | ✅ |
| Filtermenu (popover) | niet getest (gebouwd met dezelfde Popover API als het mobiele menu) |
| Zoeken, filteren, sorteren | niet getest. In deze versie doen ze nog niets met de keuze, met of zonder JS |

De pagina ziet er met en zonder JavaScript hetzelfde uit, omdat Eleventy alleen statische HTML en CSS oplevert. De kaarten staan al in de HTML, want Eleventy haalt de data tijdens de build op uit Directus.

Er staat weinig tekst op de homepage. Dat komt doordat de pagina vooral uit kaarten en knoppen bestaat. Het is geen teken dat er content ontbreekt.

## 7. Cross-browser

Dezelfde functionele en toegankelijkheidstests in drie browser-engines, met het script `tests/scripts/cross-browser.mjs` (Playwright 1.65.0). De metingen zijn op desktop (1280 × 800) zonder vertraging gedaan: CPU- en netwerkvertraging kan Playwright alleen in Chromium nabootsen. De vertraagde mobiele meting staat in hoofdstuk 1.

| | Chromium 158 | Firefox 159 | WebKit 27.2 (Safari) |
|---|---|---|---|
| FCP | 24 ms | 38 ms | 140 ms |
| LCP | 104 ms | 209 ms | 284 ms |
| CLS | 0,009 | niet ondersteund | niet ondersteund |
| DOMContentLoaded | 6 ms | 7 ms | 90 ms |
| Load | 114 ms | 232 ms | 261 ms |
| Requests | 19 | 19 | 19 |
| JavaScript-bestanden | 0 | 0 | 0 |
| Mislukte requests | 3 (`.woff2`) | 3 (`.woff2`) | 3 (`.woff2`) |
| axe-overtredingen desktop | 0 | 0 | 0 |
| axe-overtredingen mobiel | 0 | 0 | 0 |
| Tab-stops | 25 | 25 | 25 |
| Zonder zichtbare focus | 12 kaartknoppen | 12 kaartknoppen | 12 kaartknoppen |
| Skip link werkt | ✅ | ✅ | ✅ |
| Popover API ondersteund | ✅ | ✅ | ✅ |
| Menu opent met Enter / sluit met Escape | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ |
| Focus terug naar menuknop | ✅ | ✅ | ✅ |
| Menu werkt zonder JS | ✅ | ✅ | ✅ |
| Content zonder JS | 168 tekens | 126 tekens | 126 tekens |

De pagina werkt en gedraagt zich in alle drie de engines hetzelfde. Er zijn drie kleine verschillen:
- **WebKit is trager bij de eerste paint:** 140 ms tegenover 24–38 ms. De pagina is wel 2× zo groot als de info-pagina (200 tegenover 92 DOM-elementen) en laadt externe logo's. Op de info-pagina was WebKit nog het snelst (30 ms). Een verklaring is niet onderzocht. Herhaal de meting om toeval uit te sluiten.
- **Content zonder JS:** Chromium telt 168 tekens, Firefox en WebKit 126. De HTML is in alle browsers hetzelfde, dus het verschil zit in hoe de browsers `innerText` berekenen. Waarschijnlijk tellen ze de opties van de `<select>` verschillend mee, maar dat is niet nagekeken.
- **WebKit en Tab:** Safari springt met Tab standaard alleen langs formuliervelden en slaat links over. Daarom is in WebKit getest met Alt+Tab. Dat is gelijk aan de Safari-instelling "Druk op Tab om elk onderdeel op een webpagina te markeren". Met die toets zijn de Tab-stops gelijk aan die in de andere browsers.

Het aantal requests is hier 19, in hoofdstuk 2 is het 16. De twee scripts tellen requests op een andere manier. Vergelijk daarom alleen getallen uit hetzelfde script.

Screenshots van het mobiele menu staan in `tests/results/eleventy/screenshots/` (`eleventy-home-<browser>-menu-open.png` en `eleventy-home-<browser>-mobile.png`).

## Beperkingen van deze test

- **Lokale server:** gemeten op localhost met `python3 -m http.server`. Die server comprimeert niet (geen gzip of brotli) en stuurt geen cache-headers mee. Echte hosting geeft andere absolute waarden. Voor de vergelijking telt dat alle versies op dezelfde manier getest zijn.
- **Gesimuleerde vertraging:** de CPU- en netwerkvertraging zijn nagebootst, net als in Lighthouse. Dat is niet hetzelfde als een echt mobiel toestel.
- **Beperkte dekking van axe:** axe vindt maar een deel van de toegankelijkheidsproblemen. De ontbrekende focus en het horizontaal scrollen laten dat zien. Een handmatige test met een screenreader blijft nodig.
- **Data uit Directus:** de pagina toont 4 websites. Meer of minder websites geeft andere cijfers voor DOM-grootte, requests en Tab-stops. Test de andere frameworks met dezelfde data.
- **Externe afbeeldingen:** de partnerlogo's komen van de favicon-dienst van Google. Hun laadtijd valt buiten de lokale server en kan per meting verschillen.
- **Niet ingelogd:** de Eleventy-versie heeft geen login. Frameworks waarvan de homepage achter een login zit, zijn ingelogd getest. Dat staat in hun eigen rapport.
- **Zoeken, filteren en sorteren:** de formulieren staan er, maar doen in deze versie nog niets. Ze zijn alleen getest op toetsenbord en focus.
- **Aangepaste menucheck:** sinds deze test telt de menucheck alleen links die pas zichtbaar worden als het menu opengaat. De homepage heeft namelijk ook een gewone link naar `/info/`. De `/info`-test van 12 november gebruikte nog de oude check. Test `/info` opnieuw als je die resultaten naast deze wilt leggen.
- **Bekende problemen:** de ontbrekende `.woff2`-fonts en de favicon. Als die in de andere versies ook ontbreken, vallen ze tegen elkaar weg in de vergelijking.
