#!/usr/bin/env node
/* Diagnóstico público independiente de las pruebas de código.
 * No modifica DNS ni Vercel. El resultado es informativo: un build exitoso
 * no demuestra que el dominio público resuelva ni que sea accesible. */
import {lookup} from 'node:dns/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sites = [
  {host:'aptitudlabs.com',label:'Dominio comercial'},
  {host:'aptitud-labs.vercel.app',label:'Alias Vercel'},
];
const expectedHTML=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const expectedSha=createHash('sha256').update(expectedHTML).digest('hex');
console.log('SHA-256 de index.html en el commit de GitHub: '+expectedSha);
let success=0;
let versionErrors=0;
for(const site of sites){
  console.log('\n'+site.label+': https://'+site.host+'/');
  try{
    const ips=await lookup(site.host,{all:true});
    console.log('DNS: '+ips.map(x=>x.address).join(', '));
  }catch(e){
    console.log('DNS FALLÓ: '+(e.code||e.message));
    console.log('::warning::No se pudo resolver '+site.host+'. Revisar los registros DNS o el alias si corresponde.');
    versionErrors++;
    continue;
  }
  try{
    const response=await fetch('https://'+site.host+'/',{
      signal:AbortSignal.timeout(12000),
      cache:'no-store',
      headers:{
        'User-Agent':'AptitudLabs-QualitySmoke/1.1',
        'Cache-Control':'no-cache',
        'Pragma':'no-cache'
      }
    });
    const body=await response.text();
    const remoteSha=createHash('sha256').update(body).digest('hex');
    const correctTitle=body.includes('Proyectos seleccionados');
    const correctHero=body.includes('href="#trabajo-destacado"');
    const containsObsolete=body.includes('Nuestro trabajo. En acción.');
    const identical=body===expectedHTML;
    const verified=response.ok && correctTitle && correctHero && !containsObsolete && identical;
    console.log('HTTP: '+response.status+'; destino: '+response.url+'; caracteres: '+body.length);
    console.log('Cache-Control: '+(response.headers.get('cache-control')||'ausente')+
      '; x-vercel-cache: '+(response.headers.get('x-vercel-cache')||'ausente')+
      '; age: '+(response.headers.get('age')||'ausente'));
    console.log('SHA-256 del HTML público: '+remoteSha+
      '; coincide exactamente con index.html: '+identical);
    console.log('Marcadores: Proyectos seleccionados='+correctTitle+
      ', href="#trabajo-destacado"='+correctHero+
      ', título antiguo='+containsObsolete);
    if(verified){success++;console.log('OK: portada pública corresponde exactamente a index.html de este commit')}
    else{
      versionErrors++;
      console.log('::error::'+site.host+
        ' no sirve el HTML actualizado de index.html. Revisar proyecto, dominio, alias y caché en Vercel.');
    }
  }catch(e){
    console.log('HTTP FALLÓ: '+(e.cause?.code||e.name)+': '+e.message);
    console.log('::warning::No se pudo comprobar la portada pública de '+site.host);
    versionErrors++;
  }
}
console.log('\nComprobación pública independiente: '+success+'/'+sites.length+' sitios respondieron correctamente.');

// Comprobaciones adicionales de endpoints publicables y errores reales. Solo
// verifica el estado YA publicado: en un PR puede no incluir el nuevo commit.
const endpointChecks=[
  {path:'/robots.txt',code:200,needle:'Sitemap:'},
  {path:'/sitemap.xml',code:200,needle:'<urlset'},
  {path:'/web-para-barberias/',code:200,needle:'https://aptitudlabs.com/web-para-barberias/'},
  {path:'/web-para-restaurantes/',code:200,needle:'https://aptitudlabs.com/web-para-restaurantes/'},
  {path:'/aptitud-web/',code:200,needle:'noindex,follow'},
  {path:'/prueba-error-404-aptitud-2026/',code:404,needle:'Esta página no existe'},
];
let passes=0;
for(const item of endpointChecks){
  try{
    const res=await fetch('https://aptitudlabs.com'+item.path,{signal:AbortSignal.timeout(10000)});
    const body=await res.text();
    const ok=res.status===item.code&&body.includes(item.needle);
    console.log((ok?'OK':'REVISAR')+' '+item.path+' — HTTP '+res.status);
    if(ok)passes++;
    else console.log('::warning::Ruta pública '+item.path+' no coincide con el estado esperado. Puede ser un despliegue aún no actualizado.');
  }catch(e){
    console.log('REVISAR '+item.path+': '+e.message);
    console.log('::warning::No se pudo comprobar la ruta pública '+item.path);
  }
}
try{
  const res=await fetch('https://aptitudlabs.com/assets/hero/aptitud-hero-background.png',{signal:AbortSignal.timeout(10000)});
  const mime=res.headers.get('content-type')||'sin cabecera';
  const ok=res.status===200&&mime.startsWith('image/jpeg');
  console.log((ok?'OK':'REVISAR')+' asset portada — '+res.status+' / '+mime);
  if(ok)passes++;
  else console.log('::warning::La imagen de portada debe servirse como JPEG aunque conserve extensión .png.');
}catch(e){console.log('::warning::No se pudo comprobar el recurso hero: '+e.message)}
console.log('Endpoints públicos: '+passes+'/'+(endpointChecks.length+1)+' comprobaciones aprobadas.');

// Si GitHub contiene la versión nueva pero el dominio entrega la antigua,
// no dar el despliegue por validado. El exit code protege de falsos verdes.
if(versionErrors){
  console.log('::error::Verificación de HTML público fallida en '+versionErrors+' host(s).');
  process.exitCode=1;
}
