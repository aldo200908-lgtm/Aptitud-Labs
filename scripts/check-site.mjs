#!/usr/bin/env node
/* Aptitud Labs — controles estáticos sin dependencias ni red.
   Ejecutar: node scripts/check-site.mjs
   No reemplaza una prueba visual ni comprueba servicios externos. */
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalBase = 'https://aptitudlabs.com';
const pages = new Map([
  ['/', 'index.html'],
  ['/soluciones/', 'soluciones/index.html'],
  ['/diseno-web-puno/', 'diseno-web-puno/index.html'],
  ['/diseno-web-juliaca/', 'diseno-web-juliaca/index.html'],
  ['/nfc-qr/', 'nfc-qr/index.html'],
  ['/resources/navbars/', 'resources/navbars/index.html'],
  ['/privacidad/', 'privacidad/index.html'],
  ['/web-para-barberias/', 'web-para-barberias/index.html'],
  ['/web-para-restaurantes/', 'web-para-restaurantes/index.html'],
]);
const extras = ['aptitud-web/index.html','404.html',
  'resources/navbars/aurora.html','resources/navbars/folio.html',
  'resources/navbars/glass.html','resources/navbars/nexa.html',
  'resources/navbars/kai.html'];
let checks=0, errors=[];
function test(ok, message) {
  checks++;
  if (!ok) errors.push(message);
}
function file(path) {return readFileSync(resolve(root,path),'utf8')}
function tagAttr(markup,name) {
  return markup.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']','i'))?.[1]||'';
}
const vercel=JSON.parse(file('vercel.json'));
const sitemap=file('sitemap.xml');
const robots=file('robots.txt');
const built=new Set(vercel.builds.map(entry=>entry.src));
test(built.has('assets/**'), 'Falta incluir assets/** en Vercel');
test(built.has('robots.txt')&&built.has('sitemap.xml'), 'Falta publicar SEO técnico');
test(built.has('aptitud-web/index.html'), 'Aptitud Web no está incluido en el despliegue');
test(vercel.routes.some(r=>r.handle==='filesystem'),'Vercel debe servir archivos existentes');
const indexFS=vercel.routes.findIndex(r=>r.handle==='filesystem');
const index404=vercel.routes.findIndex(r=>r.status===404&&r.dest==='/404.html');
test(index404>indexFS,'404 debe ir después de filesystem');
test(vercel.builds.some(r=>r.src==='404.html'),'Falta publicar 404.html');
test(robots.includes(canonicalBase+'/sitemap.xml'),'robots.txt sin mapa correcto');
test((sitemap.match(/<loc>/g)||[]).length===pages.size,
  'La cantidad de URLs en sitemap no coincide con las páginas indexables');

const sitemapDates=[...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(x=>x[1]);
test(sitemapDates.length===pages.size,'Cada página en sitemap debe tener fecha de modificación');
test(sitemapDates.every(date=>Number.isFinite(Date.parse(date))&&Date.parse(date)<=Date.now()),'Fechas de sitemap inválidas o futuras');

test(vercel.routes.some(r=>r.src.includes('aptitud-web')&&r.dest==='/aptitud-web/index.html'),
 'Falta la ruta de Aptitud Web');
test(vercel.routes.some(r=>r.src.includes('aptitud-hero-background')&&r.headers?.['Content-Type']==='image/jpeg'),
 'El JPEG del hero requiere Content-Type image/jpeg');
const securityRoute=vercel.routes.find(r=>r.src.startsWith('^/.*')&&r.continue===true&&r.headers);
const csp=securityRoute?.headers?.['Content-Security-Policy']||'';
test(csp.includes("default-src 'self'")&&csp.includes("object-src 'none'")&&csp.includes("frame-ancestors 'self'"),
 'Falta CSP restrictiva o se ha eliminado la protección de contenido');

const localTarget=(pathname)=>{
  if (pages.has(pathname)) return pages.get(pathname);
  if (pathname==='/aptitud-web/'||pathname==='/aptitud-web') return 'aptitud-web/index.html';
  if (pathname==='/404.html') return '404.html';
  if (pathname.endsWith('/')) return pathname.slice(1)+'index.html';
  return pathname.slice(1);
};
function checkLinks(html,sourcePath,publicPath) {
  const tags=[...html.matchAll(/<(a|link|iframe|img)\b[^>]*>/gi)];
  for(const [full,rawTag] of tags) {
    const tag=rawTag.toLowerCase();
    const href=tagAttr(full,tag==='img'||tag==='iframe'?'src':'href');
    if(!href||href==='#'||href.startsWith('data:')||href.startsWith('blob:')) continue;
    let url;
    try {url=new URL(href,canonicalBase+publicPath)}
    catch {test(false,sourcePath+': URL mal formada '+href);continue}
    if(url.origin!==canonicalBase) continue;
    const target=localTarget(url.pathname);
    test(existsSync(join(root,target)),sourcePath+': enlace local sin archivo '+href+' -> '+target);
    if(tag==='a'&&url.hash&&url.hash!=='#'&&url.pathname===publicPath) {
      test(html.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),
       sourcePath+': ancla inexistente '+href);
    }
    if(tag==='img') test(/\balt\s*=/.test(full),sourcePath+': imagen sin texto alternativo');
    if(tag==='iframe') test(/\btitle\s*=/.test(full),sourcePath+': iframe sin título');
    if(tag==='a'&&/\btarget=["']_blank["']/.test(full)) {
      test(/\brel=["'][^"']*noopener/.test(full),sourcePath+': target blank sin noopener');
    }
  }
}
function checkScripts(html,sourcePath) {
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    const type=tagAttr(match[1],'type');
    if(type==='application/ld+json'){
      try {JSON.parse(match[2]);test(true,'')}
      catch(e){test(false,sourcePath+': JSON-LD inválido '+e.message)}
    } else if(!tagAttr(match[1],'src')&&(!type||type==='text/javascript')){
      try {new Script(match[2],{filename:sourcePath});test(true,'')}
      catch(e){test(false,sourcePath+': JavaScript inválido '+e.message)}
    }
  }
}
for(const [publicPath,sourcePath] of pages) {
  test(existsSync(join(root,sourcePath)),'Falta '+sourcePath);
  const html=file(sourcePath);
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  test(!!title,sourcePath+': título vacío');
  test(/<html\b[^>]*lang=["']es["']/.test(html),sourcePath+': falta idioma es');
  test(/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']{50,}["']/.test(html),
   sourcePath+': meta descripción ausente o demasiado corta');
  test((html.match(/<h1\b/gi)||[]).length===1,sourcePath+': debe tener un H1');
  test(!!html.match(/<main[\s>]/i),sourcePath+': falta main');
  test(html.includes('href="/privacidad/"')||sourcePath==='privacidad/index.html',
    sourcePath+': falta link a privacidad');
  test(html.includes('<link rel="canonical" href="'+canonicalBase+publicPath+'"'),
    sourcePath+': URL canónica diferente al sitemap');
  test(sitemap.includes('<loc>'+canonicalBase+publicPath+'</loc>'),
    sourcePath+': falta en sitemap.xml');
  test(built.has(sourcePath),sourcePath+': falta en la lista de builds de Vercel');
  test(html.includes('property="og:image"'),sourcePath+': falta imagen para vista previa social');
  checkLinks(html,sourcePath,publicPath);
  checkScripts(html,sourcePath);
}
for(const extra of extras){
  test(existsSync(join(root,extra)),'Falta recurso '+extra);
  const html=file(extra);
  if(extra==='aptitud-web/index.html'){
    test(/name="robots" content="noindex,follow"/.test(html),'Editor experimental debe estar en noindex');
    test(html.includes('fonts.googleapis.com/css2?family='),'Editor no incluye fuente para exportación');
  }
  checkScripts(html,extra,undefined);
}
const resourceDemos=file('resources/navbars/index.html');
test((resourceDemos.match(/<iframe sandbox="allow-scripts"/g)||[]).length===5,
  'Las demostraciones deben estar aisladas con sandbox');
const home=file('index.html');
test(home.includes('name="correo" type="email"')&&!home.includes('name="correo" type="email" maxlength="150" autocomplete="email" required'),
  'El correo de formulario para WhatsApp debe ser opcional');
test(home.includes('https://wa.me/51937367296'),'Falta WhatsApp válido');
test(home.includes('aptitudlabs.studio@gmail.com'),'Falta correo de contacto');
test(home.includes('id="sectores"'),'Falta zona de sectores');
const punoLanding=file('diseno-web-puno/index.html');
test(punoLanding.includes('id="trabajos-web-puno"')&&punoLanding.includes('id="cotizar-web-puno"'),
 'Puno debe mostrar ejemplos y facilitar la cotización');
test(punoLanding.includes('id="punoQuoteForm"')&&punoLanding.includes('Se abrirá WhatsApp'),
 'Puno debe tener formulario de consulta sin backend');
test(punoLanding.includes('no los presentamos como encargos')||punoLanding.includes('No los presentamos como encargos'),
 'Las demostraciones no deben presentarse como clientes');
test(home.includes('href="#contenido"')&&home.includes('id="contenido"'),'Falta acceso directo al contenido');
test(file('404.html').includes('name="robots" content="noindex"'),'404 no debe indexarse');
const editor=file('aptitud-web/index.html');
test(editor.includes("if(el.id!=='contacto')"),'El HTML exportado debe conservar el ancla contacto');
test(editor.includes("createElement('h1')"),'El editor debe exportar un H1');
test(editor.includes("phone:''")&&editor.includes("validPhone(data.phone)"),'No usar un WhatsApp ficticio en el editor');

console.log('Revisión de Aptitud Labs:',checks,'comprobaciones ejecutadas.');
if(errors.length){
  console.error('Se encontraron',errors.length,'errores:');
  for(const err of errors) console.error(' ✖ '+err);
  process.exitCode=1;
}else console.log('✓ Todos los controles estáticos aprobados.');
