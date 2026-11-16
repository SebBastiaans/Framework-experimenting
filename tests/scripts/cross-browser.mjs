// Cross-browser test (Chromium, Firefox, WebKit/Safari) voor de framework-vergelijking.
// Gebruik:  node tests/scripts/cross-browser.mjs <Framework> <BASE_URL> <pad>
// Voorbeeld: node tests/scripts/cross-browser.mjs Eleventy http://localhost:8081 /info/
// Resultaten komen in tests/results/<framework>/ (de map wordt aangemaakt als hij nog niet bestaat).
// Pas de testlogica niet aan, zodat alle frameworks identiek getest worden.
import { chromium, firefox, webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [framework = 'Eleventy', BASE_URL = 'http://localhost:8081', PATH = '/info/'] = process.argv.slice(2);
const URL = BASE_URL + PATH;
const RUNS = 5;
const AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const slug = framework.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const OUT_DIR = new globalThis.URL(`../results/${slug}/`, import.meta.url);
const SHOT_DIR = new globalThis.URL(`../results/${slug}/screenshots/`, import.meta.url);

const DESKTOP = { viewport: { width: 1280, height: 800 } };
const MOBILE = { viewport: { width: 390, height: 844 } };

const median = (arr) => {
	const s = arr.filter((v) => v != null).sort((a, b) => a - b);
	if (!s.length) return null;
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (v) => (v == null ? null : Math.round(v));

// In WebKit gaat Tab standaard alleen langs formuliervelden (zoals Safari zonder
// "Druk op Tab om elk onderdeel te markeren"). Alt+Tab bootst die instelling na.
const tabKey = (name) => (name === 'webkit' ? 'Alt+Tab' : 'Tab');

async function measureLoad(browser) {
	const ctx = await browser.newContext(DESKTOP);
	const p = await ctx.newPage();
	const failed = [];
	let requests = 0;
	const consoleErrors = [];
	p.on('response', (r) => {
		requests++;
		if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(BASE_URL, '')}`);
	});
	p.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
	p.on('pageerror', (e) => consoleErrors.push(String(e)));
	await p.addInitScript(() => {
		window.__lcp = null;
		window.__cls = null;
		const types = PerformanceObserver.supportedEntryTypes || [];
		if (types.includes('largest-contentful-paint')) {
			new PerformanceObserver((l) => {
				const e = l.getEntries();
				window.__lcp = e[e.length - 1].startTime;
			}).observe({ type: 'largest-contentful-paint', buffered: true });
		}
		if (types.includes('layout-shift')) {
			window.__cls = 0;
			new PerformanceObserver((l) => {
				for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
			}).observe({ type: 'layout-shift', buffered: true });
		}
	});
	await p.goto(URL, { waitUntil: 'load' });
	await p.waitForTimeout(1000);
	const timing = await p.evaluate(() => {
		const nav = performance.getEntriesByType('navigation')[0];
		const fcp = performance.getEntriesByName('first-contentful-paint')[0];
		const scripts = performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'script');
		return {
			ttfb: nav.responseStart,
			fcp: fcp ? fcp.startTime : null,
			lcp: window.__lcp,
			cls: window.__cls,
			domContentLoaded: nav.domContentLoadedEventEnd,
			load: nav.loadEventEnd,
			jsFiles: scripts.length,
		};
	});
	await ctx.close();
	return { timing, requests, failed, consoleErrors };
}

async function auditA11y(browser, options) {
	const ctx = await browser.newContext(options);
	const p = await ctx.newPage();
	await p.goto(URL, { waitUntil: 'load' });
	await p.addScriptTag({ url: AXE_URL });
	const axe = await p.evaluate(async () => {
		const r = await window.axe.run(document, {
			runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
		});
		return {
			violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
			passes: r.passes.length,
			incomplete: r.incomplete.length,
		};
	});
	await ctx.close();
	return axe;
}

async function auditKeyboard(browser, name) {
	const ctx = await browser.newContext(DESKTOP);
	const p = await ctx.newPage();
	await p.goto(URL, { waitUntil: 'load' });
	const stops = [];
	for (let i = 0; i < 25; i++) {
		await p.keyboard.press(tabKey(name));
		const info = await p.evaluate(() => {
			const el = document.activeElement;
			if (!el || el === document.body) return null;
			const cs = getComputedStyle(el);
			const focusVisible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
			const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('name') || el.tagName)
				.trim()
				.replace(/\s+/g, ' ');
			return { name: label.slice(0, 40), focusVisible, key: el.outerHTML.slice(0, 120) };
		});
		if (!info) break;
		if (stops.length && stops[0].key === info.key) break;
		stops.push(info);
	}
	await p.goto(URL, { waitUntil: 'load' });
	await p.keyboard.press(tabKey(name));
	const firstStop = await p.evaluate(() => document.activeElement?.innerText?.trim() || '');
	await p.keyboard.press('Enter');
	await p.waitForTimeout(200);
	const skipWorks = await p.evaluate(() => {
		const main = document.querySelector('main');
		return !!main && (main === document.activeElement || main.contains(document.activeElement) || location.hash === '#' + main.id);
	});
	await ctx.close();
	return {
		tabKey: tabKey(name),
		stops: stops.map((s) => s.name),
		withoutVisibleFocus: stops.filter((s) => !s.focusVisible).map((s) => s.name),
		skipLink: { firstStop, works: skipWorks },
	};
}

async function auditMobileMenu(browser, name, javaScriptEnabled) {
	const ctx = await browser.newContext({ ...MOBILE, javaScriptEnabled });
	const p = await ctx.newPage();
	await p.goto(URL, { waitUntil: 'load' });
	const r = {
		popoverSupported: await p.evaluate(() => Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover')),
		found: false,
	};
	const btn = p.getByRole('button', { name: /menu/i }).first();
	if (!(await btn.count()) || !(await btn.isVisible())) {
		await ctx.close();
		return r;
	}
	r.found = true;
	const infoLinkVisible = () =>
		p.evaluate(() =>
			[...document.querySelectorAll('a[href]')].some((a) => {
				const b = a.getBoundingClientRect();
				return /info/.test(a.getAttribute('href')) && b.width > 0 && b.height > 0 && b.right > 0 && b.left < innerWidth && getComputedStyle(a).visibility !== 'hidden';
			}),
		);
	await btn.focus();
	await p.keyboard.press('Enter');
	await p.waitForTimeout(600);
	r.opensWithEnter = await infoLinkVisible();
	if (javaScriptEnabled) {
		await p.screenshot({ path: fileURLToPath(new globalThis.URL(`${slug}-${name}-menu-open.png`, SHOT_DIR)) });
	}
	await p.keyboard.press('Escape');
	await p.waitForTimeout(600);
	r.closesWithEscape = !(await infoLinkVisible());
	r.focusReturnsToButton = await p.evaluate(() =>
		/menu/i.test(document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText || ''),
	);
	if (javaScriptEnabled) {
		await p.screenshot({ path: fileURLToPath(new globalThis.URL(`${slug}-${name}-mobile.png`, SHOT_DIR)) });
	}
	await ctx.close();
	return r;
}

async function auditNoJs(browser) {
	const ctx = await browser.newContext({ ...MOBILE, javaScriptEnabled: false });
	const p = await ctx.newPage();
	await p.goto(URL, { waitUntil: 'load' });
	const r = await p.evaluate(() => ({
		textLength: document.querySelector('main')?.innerText.trim().length ?? 0,
		headings: document.querySelectorAll('h1,h2,h3').length,
		links: document.querySelectorAll('a[href]').length,
	}));
	await ctx.close();
	return r;
}

await mkdir(SHOT_DIR, { recursive: true });
const results = { framework, url: URL, date: new Date().toISOString(), runs: RUNS, browsers: {} };

for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
	console.log(`> ${name}`);
	const browser = await type.launch();
	const runs = [];
	for (let i = 0; i < RUNS; i++) runs.push(await measureLoad(browser));
	const t = (k) => median(runs.map((r) => r.timing[k]));
	results.browsers[name] = {
		version: browser.version(),
		performance: {
			ttfb: round(t('ttfb')),
			fcp: round(t('fcp')),
			lcp: round(t('lcp')),
			cls: t('cls') == null ? null : Number(t('cls').toFixed(3)),
			domContentLoaded: round(t('domContentLoaded')),
			load: round(t('load')),
			requests: runs[0].requests,
			jsFiles: runs[0].timing.jsFiles,
			failed: runs[0].failed,
			consoleErrors: [...new Set(runs.flatMap((r) => r.consoleErrors))],
		},
		a11y: { desktop: await auditA11y(browser, DESKTOP), mobile: await auditA11y(browser, MOBILE) },
		keyboard: await auditKeyboard(browser, name),
		mobileMenu: {
			withJs: await auditMobileMenu(browser, name, true),
			withoutJs: await auditMobileMenu(browser, name, false),
		},
		noJs: await auditNoJs(browser),
	};
	await browser.close();
}

const file = new globalThis.URL(`${slug}-cross-browser.json`, OUT_DIR);
await writeFile(file, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
