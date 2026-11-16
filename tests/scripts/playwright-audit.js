// Playwright-audit (Chromium) voor de framework-vergelijking.
// Uitvoeren via de Playwright MCP-tool `browser_run_code_unsafe` met dit bestand als `filename`.
// De JSON-uitkomst opslaan als tests/results/<framework>/<framework>-info.json.
// Pas alleen CONFIG aan; laat de rest gelijk zodat alle frameworks identiek getest worden.
async (page) => {
	const CONFIG = {
		framework: 'Eleventy',
		BASE_URL: 'http://localhost:8081',
		pages: [{ name: 'Info', path: '/info/' }],
		runs: 5, // aantal metingen per pagina/profiel, we rapporteren de mediaan
		axeUrl: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js',
	};

	const PROFILES = {
		desktop: { width: 1280, height: 800, cpu: 1, network: null },
		// Zelfde instellingen als Lighthouse mobiel: 4x CPU-vertraging en "Slow 4G"
		mobile: {
			width: 390,
			height: 844,
			cpu: 4,
			network: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
		},
	};

	const context = page.context();
	const median = (arr) => {
		const s = arr.filter((v) => v != null).sort((a, b) => a - b);
		if (!s.length) return null;
		const m = Math.floor(s.length / 2);
		return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
	};
	const round = (v) => (v == null ? null : Math.round(v));

	// Nieuwe tab met lege cache en het gekozen profiel
	async function freshPage(profile, { jsDisabled = false } = {}) {
		const p = await context.newPage();
		await p.setViewportSize({ width: profile.width, height: profile.height });
		const cdp = await context.newCDPSession(p);
		await cdp.send('Network.enable');
		await cdp.send('Network.clearBrowserCache');
		await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
		if (profile.network) {
			await cdp.send('Network.emulateNetworkConditions', { offline: false, ...profile.network });
		}
		if (jsDisabled) await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
		return { p, cdp };
	}

	// ---------- 1. Performance + netwerk ----------
	async function measureLoad(url, profile) {
		const { p, cdp } = await freshPage(profile);
		const requests = new Map();
		cdp.on('Network.responseReceived', (e) => {
			requests.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status, bytes: 0 });
		});
		cdp.on('Network.loadingFinished', (e) => {
			const r = requests.get(e.requestId);
			if (r) r.bytes = e.encodedDataLength;
		});
		const consoleErrors = [];
		p.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
		p.on('pageerror', (e) => consoleErrors.push(String(e)));

		await p.addInitScript(() => {
			window.__lcp = null;
			window.__cls = 0;
			new PerformanceObserver((l) => {
				const e = l.getEntries();
				window.__lcp = e[e.length - 1].startTime;
			}).observe({ type: 'largest-contentful-paint', buffered: true });
			new PerformanceObserver((l) => {
				for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
			}).observe({ type: 'layout-shift', buffered: true });
		});

		await p.goto(url, { waitUntil: 'load' });
		await p.waitForTimeout(1500); // LCP/CLS laten afronden

		const timing = await p.evaluate(() => {
			const nav = performance.getEntriesByType('navigation')[0];
			const fcp = performance.getEntriesByName('first-contentful-paint')[0];
			const longTasks = 0;
			return {
				ttfb: nav.responseStart,
				fcp: fcp ? fcp.startTime : null,
				lcp: window.__lcp,
				cls: window.__cls,
				domContentLoaded: nav.domContentLoadedEventEnd,
				load: nav.loadEventEnd,
				domNodes: document.getElementsByTagName('*').length,
				longTasks,
			};
		});
		await p.close();

		const list = [...requests.values()];
		const byType = {};
		for (const r of list) {
			byType[r.type] ??= { count: 0, bytes: 0 };
			byType[r.type].count++;
			byType[r.type].bytes += r.bytes;
		}
		return {
			timing,
			requests: list.length,
			totalBytes: list.reduce((a, r) => a + r.bytes, 0),
			byType,
			failed: list.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.url.replace(CONFIG.BASE_URL, '')}`),
			consoleErrors,
		};
	}

	// ---------- 2. Toegankelijkheid (axe-core + eigen checks) ----------
	async function auditA11y(url, profile) {
		const { p } = await freshPage({ ...profile, cpu: 1, network: null });
		await p.goto(url, { waitUntil: 'load' });
		await p.addScriptTag({ url: CONFIG.axeUrl });
		const axe = await p.evaluate(async () => {
			const r = await window.axe.run(document, {
				runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
			});
			return {
				violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
				passes: r.passes.length,
				incomplete: r.incomplete.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })),
			};
		});

		const structure = await p.evaluate(() => {
			const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
			return {
				lang: document.documentElement.lang || '(geen)',
				title: document.title,
				h1: document.querySelectorAll('h1').length,
				headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => h.tagName.toLowerCase()).join(' > '),
				landmarks: {
					header: document.querySelectorAll('header, [role=banner]').length,
					nav: [...document.querySelectorAll('nav, [role=navigation]')].filter(visible).length,
					main: document.querySelectorAll('main, [role=main]').length,
					footer: document.querySelectorAll('footer, [role=contentinfo]').length,
				},
				imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
				horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
			};
		});
		await p.close();
		return { axe, structure };
	}

	// ---------- 3. Toetsenbord ----------
	async function auditKeyboard(url, profile) {
		const { p } = await freshPage({ ...profile, cpu: 1, network: null });
		await p.goto(url, { waitUntil: 'load' });
		const stops = [];
		for (let i = 0; i < 25; i++) {
			await p.keyboard.press('Tab');
			const info = await p.evaluate(() => {
				const el = document.activeElement;
				if (!el || el === document.body) return null;
				const cs = getComputedStyle(el);
				const focusVisible =
					(cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
				const name = (el.getAttribute('aria-label') || el.innerText || el.value || el.tagName).trim().replace(/\s+/g, ' ');
				return { name: name.slice(0, 40), tag: el.tagName.toLowerCase(), focusVisible, key: el.outerHTML.slice(0, 120) };
			});
			if (!info) break;
			if (stops.length && stops[0].key === info.key) break; // rondje gemaakt
			stops.push(info);
		}

		// Skip link: eerste Tab + Enter moet de focus naar <main> brengen
		await p.goto(url, { waitUntil: 'load' });
		await p.keyboard.press('Tab');
		const firstStop = await p.evaluate(() => document.activeElement?.innerText?.trim() || '');
		await p.keyboard.press('Enter');
		await p.waitForTimeout(200);
		const skipWorks = await p.evaluate(() => {
			const main = document.querySelector('main');
			return !!main && (main === document.activeElement || main.contains(document.activeElement) || location.hash === '#' + main.id);
		});
		await p.close();
		return {
			stops: stops.map(({ key, ...s }) => s),
			withoutVisibleFocus: stops.filter((s) => !s.focusVisible).map((s) => s.name),
			skipLink: { firstStop, works: skipWorks },
		};
	}

	// ---------- 4. Mobiel menu (toetsenbord) ----------
	async function auditMobileMenu(url, jsDisabled = false) {
		const { p } = await freshPage({ ...PROFILES.mobile, cpu: 1, network: null }, { jsDisabled });
		await p.goto(url, { waitUntil: 'load' });
		const result = { found: false };
		const btn = p.getByRole('button', { name: /menu/i }).first();
		if (!(await btn.count()) || !(await btn.isVisible())) {
			await p.close();
			return result;
		}
		result.found = true;
		result.buttonName = (await btn.getAttribute('aria-label')) || (await btn.innerText());
		result.ariaExpandedAttr = await btn.getAttribute('aria-expanded');
		await btn.focus();
		await p.keyboard.press('Enter');
		await p.waitForTimeout(600);
		const visibleLinks = async () =>
			p.evaluate(() =>
				[...document.querySelectorAll('a[href]')]
					.filter((a) => {
						const r = a.getBoundingClientRect();
						return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && getComputedStyle(a).visibility !== 'hidden';
					})
					.map((a) => a.getAttribute('href')),
			);
		const linksOpen = await visibleLinks();
		result.opensWithEnter = linksOpen.some((h) => /info/.test(h));
		result.ariaExpandedAfterOpen = await btn.getAttribute('aria-expanded');
		await p.keyboard.press('Tab');
		result.focusAfterTab = await p.evaluate(
			() => (document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30),
		);
		await p.keyboard.press('Escape');
		await p.waitForTimeout(600);
		const linksClosed = await visibleLinks();
		result.closesWithEscape = !linksClosed.some((h) => /info/.test(h)) || linksClosed.length < linksOpen.length;
		result.focusReturnsToButton = await p.evaluate(
			() => /menu/i.test(document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText || ''),
		);
		await p.close();
		return result;
	}

	// ---------- 5. Zonder JavaScript ----------
	async function auditNoJs(url) {
		const { p } = await freshPage({ ...PROFILES.mobile, cpu: 1, network: null }, { jsDisabled: true });
		await p.goto(url, { waitUntil: 'load' });
		const r = await p.evaluate(() => ({
			textLength: document.querySelector('main')?.innerText.trim().length ?? 0,
			headings: document.querySelectorAll('h1,h2,h3').length,
			links: document.querySelectorAll('a[href]').length,
		}));
		await p.close();
		return r;
	}

	// ---------- Uitvoeren ----------
	const results = { framework: CONFIG.framework, baseUrl: CONFIG.BASE_URL, date: new Date().toISOString(), runs: CONFIG.runs, pages: [] };

	for (const pg of CONFIG.pages) {
		const url = CONFIG.BASE_URL + pg.path;
		const entry = { name: pg.name, path: pg.path, performance: {}, a11y: {}, keyboard: null, mobileMenu: null, noJs: null };

		for (const [profileName, profile] of Object.entries(PROFILES)) {
			const runs = [];
			for (let i = 0; i < CONFIG.runs; i++) runs.push(await measureLoad(url, profile));
			const t = (k) => median(runs.map((r) => r.timing[k]));
			entry.performance[profileName] = {
				ttfb: round(t('ttfb')),
				fcp: round(t('fcp')),
				lcp: round(t('lcp')),
				cls: Number((t('cls') ?? 0).toFixed(3)),
				domContentLoaded: round(t('domContentLoaded')),
				load: round(t('load')),
				domNodes: runs[0].timing.domNodes,
				requests: runs[0].requests,
				totalKB: Number((runs[0].totalBytes / 1024).toFixed(1)),
				byType: Object.fromEntries(
					Object.entries(runs[0].byType).map(([k, v]) => [k, { count: v.count, kb: Number((v.bytes / 1024).toFixed(1)) }]),
				),
				failed: runs[0].failed,
				consoleErrors: [...new Set(runs.flatMap((r) => r.consoleErrors))],
			};
			entry.a11y[profileName] = await auditA11y(url, profile);
		}
		entry.keyboard = await auditKeyboard(url, PROFILES.desktop);
		entry.mobileMenu = { withJs: await auditMobileMenu(url, false), withoutJs: await auditMobileMenu(url, true) };
		entry.noJs = await auditNoJs(url);
		results.pages.push(entry);
	}

	return JSON.stringify(results, null, 2);
}
