// Keep the GitHub Pages source intact and adapt its paths for the custom domain.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'vercel-dist');
const routes = ['', 'servicios', 'proyectos', 'planes', 'nfc-qr', 'cotizar',
  'privacidad', 'diseno-web-puno', 'diseno-web-juliaca',
  'web-para-barberias', 'web-para-restaurantes', 'soluciones'];
const entries = ['assets', 'resources', 'herramientas', 'favicon.svg',
  'site.webmanifest', 'styles.css', 'main.js', '404.html',
  ...routes.map(route => path.join(route, 'index.html'))];
fs.mkdirSync(output, { recursive: true });
function copy(relative) {
  const source = path.join(root, relative);
  const target = path.join(output, relative);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(source)) copy(path.join(relative, child));
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (/\.(html|css|js|json|webmanifest|svg|txt)$/i.test(source)) {
    let content = fs.readFileSync(source, 'utf8')
      .replaceAll('https://aldo200908-lgtm.github.io/Aptitud-Labs/', 'https://aptitudlabs.com/')
      .replaceAll('/Aptitud-Labs/', '/');
    if (relative.endsWith('index.html') && routes.includes(path.dirname(relative) === '.' ? '' : path.dirname(relative))) {
      content = content.replace(/<meta name="robots" content="noindex,nofollow">/g,
        '<meta name="robots" content="index,follow">');
      if (!/rel=["']canonical["']/.test(content)) {
        const route = path.dirname(relative) === '.' ? '' : path.dirname(relative) + '/';
        content = content.replace('</head>', `<link rel="canonical" href="https://aptitudlabs.com/${route}"></head>`);
      }
    }
    fs.writeFileSync(target, content);
  } else fs.copyFileSync(source, target);
}
entries.forEach(copy);
fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://aptitudlabs.com/sitemap.xml\n');
fs.writeFileSync(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  routes.filter(route => route !== 'soluciones').map(route => `<url><loc>https://aptitudlabs.com/${route ? route + '/' : ''}</loc></url>`).join('') + '</urlset>\n');
console.log(`Vercel output ready: ${routes.length} pages with custom-domain paths.`);
