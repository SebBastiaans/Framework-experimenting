# Framework-vergelijking: tests

Met deze tests vergelijken we dezelfde pagina's, gebouwd in verschillende frameworks, op performance, toegankelijkheid en browserondersteuning. Eerst was dat de `/info`-pagina, nu is het de homepage (`/`). Deze map op `main` is de centrale plek: de frameworks staan elk op een eigen branch (of in een eigen repository), en hun resultaten komen hier terecht.

## Mappen

```
tests/
├── README.md
├── package.json                 ← Playwright 1.65.0, voor cross-browser.mjs en save-login.mjs
├── scripts/                     ← de tests, identiek voor elk framework
│   ├── playwright-audit.js      ← Chromium-audit via Playwright MCP (performance, axe, toetsenbord, menu, no-JS)
│   ├── cross-browser.mjs        ← zelfde checks in Chromium, Firefox en WebKit
│   └── save-login.mjs           ← slaat een inlogsessie op, voor pagina's achter een login
├── prompts/
│   └── PROMPT-nieuw-framework.md  ← prompt om de tests in een ander project te draaien
├── .auth/                       ← opgeslagen inlogsessies (staat in .gitignore)
└── results/
    ├── eleventy/                ← één map per framework
    │   ├── Playwright-test-Eleventy-home.md      ← wikipagina homepage
    │   ├── eleventy-home.json                    ← ruwe data audit homepage
    │   ├── eleventy-home-cross-browser.json      ← ruwe data cross-browser homepage
    │   ├── Playwright-test-Eleventy.md           ← wikipagina /info (12 november)
    │   ├── eleventy-info.json
    │   ├── eleventy-cross-browser.json
    │   └── screenshots/
    ├── sveltekit/
    │   └── …                    ← zelfde opbouw
    └── vergelijking/            ← pagina's die frameworks naast elkaar zetten
        └── Vergelijking-Eleventy-vs-SvelteKit.md
```

Elk framework krijgt een map `results/<slug>/`, met `<slug>` als de naam in kleine letters (bijv. `astro`, `nextjs`). Bestandsnamen beginnen met de slug en de pagina (`<slug>-home-…`). Zo blijven ze uniek als je ze allemaal naar de wiki uploadt.

## Eenmalig: installeren

```bash
cd tests
npm install
npx playwright install chromium firefox webkit
```

## Een framework testen (branch in deze repository)

Gebruik een worktree, zodat je niet van branch hoeft te wisselen. De tests blijven op `main`, het framework staat in een eigen map ernaast:

```bash
git worktree add ../fw-eleventy Eleventy        # eenmalig per framework-branch
```

Daarna, per testronde:

```bash
# Terminal 1: productie-build van het framework serveren op poort 8081
cd ../fw-eleventy/eleventy-from-scratch-starter-files
npx @11ty/eleventy
python3 -m http.server 8081 --directory dist

# Terminal 2: vanuit deze repository (main)
node tests/scripts/cross-browser.mjs Eleventy http://localhost:8081 /
```

De Chromium-audit draait via de Playwright MCP in Claude Code. Vraag Claude om `tests/scripts/playwright-audit.js` uit te voeren met `browser_run_code_unsafe`. Pas alleen het CONFIG-blok aan (framework, BASE_URL, pages). Sla de uitkomst op als `results/<slug>/<slug>-home.json`.

## Pagina's achter een login

Zit de pagina achter een login, sla dan eerst een sessie op:

```bash
node tests/scripts/save-login.mjs SvelteKit http://localhost:8081/login
# er opent een browser: log in, druk daarna Enter in de terminal
STORAGE_STATE=tests/.auth/sveltekit.json node tests/scripts/cross-browser.mjs SvelteKit http://localhost:8081 /
```

Voor de Chromium-audit log je eerst in in de Playwright MCP-browser. De cookies blijven in die browser staan.

Beide scripts controleren vooraf of ze echt op de gevraagde pagina uitkomen. Word je doorgestuurd (bijvoorbeeld naar een loginpagina), dan stoppen ze met een melding. In de JSON staat of de meting ingelogd was (`loggedIn`).

## Een framework in een andere repository

1. Kopieer de map `tests/` naar dat project.
2. Gebruik de prompt in [prompts/PROMPT-nieuw-framework.md](prompts/PROMPT-nieuw-framework.md).
3. Kopieer `tests/results/<slug>/` en `tests/results/vergelijking/` terug naar `main` in deze repository.
4. Zet de nieuwe wikipagina's in de GitHub Wiki. Afbeeldingen moet je apart uploaden.

## Afspraken voor een eerlijke vergelijking

- Pas in de scripts alleen het CONFIG-blok of de argumenten aan, nooit de testlogica.
- Test altijd een productie-build, nooit een dev-server.
- Serveer statische builds met `python3 -m http.server`. Gebruik alleen bij SSR het eigen preview-commando, en noteer dat bij de beperkingen.
- Gebruik dezelfde versies: Playwright 1.65.0 en axe-core 4.10.2.
- Gebruik dezelfde data. De homepage toont websites uit Directus, en meer of minder websites geeft andere cijfers.
- Wijzigen de scripts toch, test dan alle frameworks opnieuw.

## Wijzigingen in de scripts

- **18 november 2026:**
  - **Menucheck:** telt alleen links die pas zichtbaar worden als het menu opengaat. De homepage heeft ook een gewone link naar `/info/`, en die maakte de oude check onbetrouwbaar.
  - **Login:** er is een inlogoptie bijgekomen (`STORAGE_STATE`, `save-login.mjs`), plus een controle op doorsturen.
  - **Bestandsnamen:** die bevatten nu ook de pagina.
  - **Gevolg:** de `/info`-resultaten van 12 november zijn met de oude scripts gemaakt.
