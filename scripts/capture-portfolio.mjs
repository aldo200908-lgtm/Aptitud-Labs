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
  {
    id: 'aptitud-portfolio',
    name: 'Portafolio de Aptitud Labs',
    url: 'https://aptitudlabs.com/proyectos/',
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
      if (target.id === 'aptitud-portfolio') {
        const integrity = await page.evaluate(() => ({
          h1: document.querySelectorAll('h1').length,
          services: document.querySelectorAll('.service-card').length,
          projects: document.querySelectorAll('.project-card').length,
          projectImages: [...document.querySelectorAll('.project-cover img')].map(img => ({ loaded: img.complete && img.naturalWidth > 0, src: img.getAttribute('src') })),
          sections: [...document.querySelectorAll('main section[id]')].map(x => x.id),
          serviceChoices: document.querySelectorAll('input[name="servicio"]').length,
          dropdownCount: document.querySelectorAll('select,details,.menu-toggle,.menu-panel').length,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        }));
        if (integrity.h1 !== 1 || integrity.services !== 4 || integrity.projects !== 2 ||
            integrity.serviceChoices !== 4 || integrity.dropdownCount !== 0 || integrity.overflow ||
            !integrity.projectImages.every(img => img.loaded)) {
          throw new Error('Integridad del portafolio de escritorio: ' + JSON.stringify(integrity));
        }
        const projectsPath = path.join(outDir, 'aptitud-portfolio-projects-cover.png');
        await page.locator('#proyectos').screenshot({path: projectsPath, animations:'disabled'});
        console.log('PORTAFOLIO DE ESCRITORIO OK:', JSON.stringify(integrity));
      }
    } catch (error) {
      failures.push({ name: target.name, error: String(error) });
      console.error('No se pudo capturar:', target.name, error);
    } finally {
      await page.close();
    }
  }

  // Comprobación visual adicional: portafolio completo en un celular.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  try {
    const response = await mobile.goto('https://aptitudlabs.com/proyectos/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response?.ok()) throw new Error('Portafolio móvil: error HTTP ' + response?.status());
    await mobile.evaluate(() => document.fonts.ready).catch(() => {});
    await mobile.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await mobile.waitForTimeout(1500);
    const geometry = await mobile.evaluate(() => ({
      width: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      navLinks: document.querySelectorAll('.nav-items a').length,
      dropdownCount: document.querySelectorAll('select,details,.menu-toggle,.menu-panel').length,
      sections: [...document.querySelectorAll('main section[id]')].map(n => n.id),
      contactForm: Boolean(document.querySelector('#portfolio-contact-form')),
      themeToggle: Boolean(document.querySelector('#theme-toggle')),
      projectCards: document.querySelectorAll('.project-card').length,
      options: document.querySelectorAll('input[name="servicio"]').length,
    }));
    if (geometry.documentScrollWidth > geometry.width + 2) throw new Error('Desbordamiento horizontal móvil: ' + JSON.stringify(geometry));
    if (geometry.dropdownCount !== 0 || geometry.navLinks !== 6 || !geometry.contactForm || !geometry.themeToggle || geometry.projectCards !== 2 || geometry.options !== 4) throw new Error('Navegación o controles incorrectos: ' + JSON.stringify(geometry));
    const filename = path.join(outDir,'aptitud-portfolio-mobile-cover.png');
    await mobile.screenshot({ path: filename, type: 'png', fullPage: false, animations: 'disabled' });
    console.log('CAPTURA MÓVIL OK:', filename, JSON.stringify(geometry));
    await mobile.locator('label.type-choice').nth(1).click();
    const selected = await mobile.locator('input[name="servicio"]:checked').inputValue();
    if (selected !== 'Aplicación / sistema') throw new Error('Las opciones del formulario no cambian correctamente: ' + selected);
    await mobile.locator('#theme-toggle').click();
    const theme = await mobile.evaluate(() => document.documentElement.dataset.theme);
    if (theme !== 'dark') throw new Error('El cambio de tema no funciona: ' + theme);
    console.log('INTERACCIONES MÓVILES OK: opción=', selected, ' tema=', theme);
  } catch (error) {
    failures.push({ name: 'Portafolio móvil', error: String(error) });
    console.error('Portafolio móvil: ', error);
  } finally {
    await mobile.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Fallos en capturas:', JSON.stringify(failures));
  process.exitCode = 1;
}
