import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const OUTPUT_DIR = resolve(__dirname, 'visual-baselines');

const ROUTES = [
  { name: 'dashboard', path: '/' },
  { name: 'board', path: '/board' },
  { name: 'backlog', path: '/backlog' },
  { name: 'epics', path: '/epics' },
  { name: 'stories', path: '/stories/test-id' },
  { name: 'docs', path: '/docs' },
  { name: 'diagnostics', path: '/diagnostics' },
];

async function capture() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Capturing screenshots from ${BASE_URL}...`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  for (const route of ROUTES) {
    const url = `${BASE_URL}/#${route.path}`;
    console.log(`[${route.name}] Navigating to ${url}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      const filePath = resolve(OUTPUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`[${route.name}] Saved: ${filePath}`);
    } catch (err) {
      console.error(`[${route.name}] Failed:`, err instanceof Error ? err.message : err);
    }
  }

  await browser.close();
  console.log(`\nDone! ${ROUTES.length} screenshots captured.`);
}

capture().catch((err) => {
  console.error('Visual capture failed:', err);
  process.exit(1);
});
