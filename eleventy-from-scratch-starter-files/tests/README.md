# Framework-vergelijking: tests

Met deze tests vergelijken we dezelfde `/info`-pagina, gebouwd in verschillende frameworks, op performance, toegankelijkheid en browserondersteuning. Deze map is de centrale plek: resultaten uit andere projecten worden hierheen teruggekopieerd.

## Mappen

```
tests/
├── README.md
├── scripts/                     ← de tests, identiek voor elk framework
│   ├── playwright-audit.js      ← Chromium-audit via Playwright MCP (performance, axe, toetsenbord, menu, no-JS)
│   └── cross-browser.mjs        ← zelfde checks in Chromium, Firefox en WebKit
├── prompts/
│   └── PROMPT-nieuw-framework.md  ← prompt om de tests in een ander project te draaien
└── results/
    ├── eleventy/                ← één map per framework
    │   ├── Playwright-test-Eleventy.md   ← wikipagina
    │   ├── eleventy-info.json            ← ruwe data audit
    │   ├── eleventy-cross-browser.json   ← ruwe data cross-browser
    │   └── screenshots/
    ├── sveltekit/
    │   └── …                    ← zelfde opbouw
    └── vergelijking/            ← pagina's die frameworks naast elkaar zetten
        └── Vergelijking-Eleventy-vs-SvelteKit.md
```

Elk framework krijgt een map `results/<slug>/`, met `<slug>` als de naam in kleine letters (bijv. `astro`, `nextjs`). Bestandsnamen beginnen ook met de slug. Zo blijven ze uniek als je ze allemaal naar de wiki uploadt.

## Tests uitvoeren in dit project (Eleventy)

```bash
npx @11ty/eleventy                                   # productie-build
python3 -m http.server 8081 --directory dist         # in een tweede terminal
node tests/scripts/cross-browser.mjs Eleventy http://localhost:8081 /info/
```

De Chromium-audit draait via de Playwright MCP in Claude Code. Vraag Claude om `tests/scripts/playwright-audit.js` uit te voeren met `browser_run_code_unsafe`.

## Een nieuw framework toevoegen

1. Kopieer de map `tests/` naar het project van het nieuwe framework.
2. Gebruik de prompt in [prompts/PROMPT-nieuw-framework.md](prompts/PROMPT-nieuw-framework.md).
3. Kopieer `tests/results/<slug>/` en `tests/results/vergelijking/` terug naar dit project.
4. Zet de nieuwe wikipagina's in de GitHub Wiki. Afbeeldingen moet je apart uploaden.

## Afspraken voor een eerlijke vergelijking

- Pas in de scripts alleen het CONFIG-blok of de argumenten aan, nooit de testlogica.
- Test altijd een productie-build, nooit een dev-server.
- Serveer statische builds met `python3 -m http.server`. Gebruik alleen bij SSR het eigen preview-commando, en noteer dat bij de beperkingen.
- Gebruik dezelfde versies: Playwright 1.65.0 en axe-core 4.10.2.
- Wijzigen de scripts toch, test dan alle frameworks opnieuw.
