// Slaat een inlogsessie op, voor frameworks waarvan de te testen pagina achter een login zit.
// Gebruik:  node tests/scripts/save-login.mjs <Framework> <URL van de loginpagina>
// Voorbeeld: node tests/scripts/save-login.mjs SvelteKit http://localhost:8081/login
// Er opent een browservenster. Log in, ga terug naar de terminal en druk op Enter.
// De sessie komt in tests/.auth/<slug>.json. Die map staat in .gitignore: er staan cookies in.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const [framework, LOGIN_URL] = process.argv.slice(2);
if (!framework || !LOGIN_URL) {
	console.error('Gebruik: node tests/scripts/save-login.mjs <Framework> <URL van de loginpagina>');
	process.exit(1);
}
const slug = framework.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const AUTH_DIR = new URL('../.auth/', import.meta.url);
const file = fileURLToPath(new URL(`${slug}.json`, AUTH_DIR));

await mkdir(AUTH_DIR, { recursive: true });
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(LOGIN_URL);

const rl = createInterface({ input: process.stdin, output: process.stdout });
await rl.question('Log in in het browservenster en druk daarna hier op Enter... ');
rl.close();

await ctx.storageState({ path: file });
await browser.close();
console.log(`Sessie opgeslagen in ${file}`);
