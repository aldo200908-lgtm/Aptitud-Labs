import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const targets = [
  {
    id: 'sushi-ten-bento',
    name: 'Sushi Ten Bento',
    url: 'https://aldo200908-lgtm.github.io/sushi-ten-bento-/',
  },
  {
    id: 'allin-mikuy',
    name: 'Allin Mikuy Café Restobar',
    url: 'https://aldo200908-lgtm.github.io/Allin-mikuy-Caf-Restobar/',
  },
];

const outDir = path.resolve('assets/projects');
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const failures = [];

try {
  for (const target of targets) {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });

    try {
      console.log('Abriendo:', target.name, target.url);
      const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (!response || !response.ok()) throw new Error('HTTP ' + (response?.status() ?? 'sin respuesta'));

      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(6500);

      const details = await page.evaluate(() => ({
        title: document.title,
        textLength: (document.body?.innerText ?? '').trim().length,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }));

      if (details.textLength < 70) {
        throw new Error('Página con poco contenido visible: ' + JSON.stringify(details));
      }

      const filename = path.join(outDir, target.id + '-cover.png');
      await page.screenshot({
        path: filename,
        type: 'png',
        fullPage: false,
        animations: 'disabled',
        caret: 'hide',
      });

      const buffer = await fs.readFile(filename);
      const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!isPng || buffer.length < 15000) {
        throw new Error('Captura inválida o demasiado pequeña: ' + buffer.length + ' bytes');
      }

      console.log('CAPTURA OK:', filename, buffer.length + ' bytes', JSON.stringify(details));
    } catch (error) {
      failures.push({ name: target.name, error: String(error) });
      console.error('No se pudo capturar:', target.name, error);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Fallos en capturas:', JSON.stringify(failures));
  process.exitCode = 1;
}
