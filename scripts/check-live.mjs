#!/usr/bin/env node
/* Diagnóstico público independiente de las pruebas de código.
 * No modifica DNS ni Vercel. El resultado es informativo: un build exitoso
 * no demuestra que el dominio público resuelva ni que sea accesible. */
import {lookup} from 'node:dns/promises';

const sites = [
  {host:'aptitudlabs.com',label:'Dominio comercial'},
  {host:'aptitud-labs.vercel.app',label:'Alias Vercel'},
];
let success=0;
for(const site of sites){
  console.log('\n'+site.label+': https://'+site.host+'/');
  try{
    const ips=await lookup(site.host,{all:true});
    console.log('DNS: '+ips.map(x=>x.address).join(', '));
  }catch(e){
    console.log('DNS FALLÓ: '+(e.code||e.message));
    console.log('::warning::No se pudo resolver '+site.host+'. Revisar los registros DNS o el alias si corresponde.');
    continue;
  }
  try{
    const response=await fetch('https://'+site.host+'/',{
      signal:AbortSignal.timeout(12000),
      headers:{'User-Agent':'AptitudLabs-QualitySmoke/1.0'}
    });
    const body=await response.text();
    console.log('HTTP: '+response.status+'; destino: '+response.url+'; bytes: '+body.length);
    const expected=response.ok && /<title>[^<]*Aptitud Labs/i.test(body);
    if(expected){success++;console.log('OK: portada identificada como Aptitud Labs')}
    else console.log('::warning::'+site.host+' no respondió con la portada pública esperada. Revisar dominio, protección y deployment.');
  }catch(e){
    console.log('HTTP FALLÓ: '+(e.cause?.code||e.name)+': '+e.message);
    console.log('::warning::No se pudo comprobar la portada pública de '+site.host);
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

// Diagnóstico no bloqueante: el estado de publicación requiere revisión humana.


// Comprobación HTTP final de producción con commit exacto y rutas principales.
if(process.env.GITHUB_HEAD_REF==='audit/release-20261030-preview'){
 const {createHash}=await import('node:crypto');
 const {execFileSync}=await import('node:child_process');
 const origin='https://aptitudlabs.com';
 const commit='dc9cd37384da66d10fbed1e2d18b750afec0d125';
 const deploy='dpl_8rr9LmLvU3522Km3Nc8KaaqV6Cg9';
 const nocache='?nocache=final';
 const sha=x=>createHash('sha256').update(x).digest('hex');
 const opts={cache:'no-store',signal:AbortSignal.timeout(25000),headers:{
  'Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':'AptitudLabs-FinalReleaseAudit/1.0'
 }};
 async function get(path){
  const url=new URL(path,origin);
  if(!url.search)url.search=nocache;
  const r=await fetch(url,{...opts,signal:AbortSignal.timeout(25000)});
  const bytes=Buffer.from(await r.arrayBuffer());
  return {status:r.status,body:bytes.toString('utf8'),bytes,cache:r.headers.get('x-vercel-cache')||'ausente',
   headers:r.headers,final:r.url};
 }
 let errors=0;
 console.log('=== AUDITORIA FINAL DE APTITUDLABS.COM EN PRODUCCION ===');
 console.log('COMMIT MAIN ESPERADO='+commit);
 try{
  const home=await get('/');
  const body=home.body;
  console.log('FINAL URL='+home.final);
  console.log('FINAL HTTP='+home.status);
  console.log('FINAL X-VERCEL-CACHE='+home.cache);
  console.log('FINAL X-VERCEL-ID='+(home.headers.get('x-vercel-id')||'ausente'));
  console.log('FINAL HTML BYTES='+home.bytes.length);
  console.log('FINAL SHA-256 HTML PUBLICO='+sha(home.bytes));
  const count=x=>body.split(x).length-1;
  const work=count('Proyectos seleccionados');
  const service=count('VER TODOS LOS SERVICIOS');
  const nfc=count('Elige la modalidad que encaja con tu negocio');
  const hero=body.includes('href="#trabajo-destacado"');
  console.log('FINAL CONTEO Proyectos seleccionados='+work);
  console.log('FINAL CONTEO VER TODOS LOS SERVICIOS='+service);
  console.log('FINAL CONTEO Elige la modalidad que encaja con tu negocio='+nfc);
  console.log('FINAL HERO href="#trabajo-destacado"='+hero);
  if(home.status!==200||home.cache!=='MISS'||work!==1||service!==1||nfc!==1||!hero)errors++;
  execFileSync('git',['fetch','--no-tags','--depth=1','origin',commit],{timeout:30000,maxBuffer:1024*1024});
  const original=execFileSync('git',['show',commit+':index.html'],{timeout:20000,maxBuffer:1024*1024});
  const script=Buffer.from('<script async data-explicit-opt-in="true" data-deployment-id="'+deploy+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>');
  const injected=home.bytes.subarray(-script.length).equals(script);
  const clean=injected?home.bytes.subarray(0,home.bytes.length-script.length):home.bytes;
  const exact=clean.equals(original);
  console.log('FINAL SHA-256 index.html DEL COMMIT='+sha(original));
  console.log('FINAL SHA-256 NORMALIZADO='+sha(clean));
  console.log('FINAL SCRIPT VERCEL='+injected);
  console.log('FINAL COMMIT SERVIDO='+ (exact?commit:'NO COINCIDE'));
  console.log('FINAL HTML COINCIDE CON COMMIT='+exact);
  if(!exact)errors++;
  const sitemap=await get('/sitemap.xml');
  console.log('FINAL SITEMAP HTTP='+sitemap.status);
  const pages=[...sitemap.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim());
  console.log('FINAL SITEMAP PAGINAS='+pages.length);
  if(sitemap.status!==200||pages.length!==13)errors++;
  const statuses=[];
  for(const [i,page] of pages.entries()){
   const path=new URL(page).pathname;
   try{
    const result=await get(path);
    const ok=result.status===200;
    console.log('FINAL RUTA '+String(i+1).padStart(2,'0')+'/13 '+path+' HTTP='+result.status+' '+(ok?'OK':'ERROR'));
    statuses.push({path,status:result.status});
    if(!ok)errors++;
   }catch(e){console.log('FINAL RUTA '+String(i+1).padStart(2,'0')+'/13 '+path+' ERROR='+e);statuses.push({path,status:0});errors++}
  }
  console.log('FINAL RUTAS HTTP 200='+statuses.filter(x=>x.status===200).length+'/'+pages.length);
  console.log('FINAL RUTAS CON ERROR='+statuses.filter(x=>x.status!==200).map(x=>x.path+'('+x.status+')').join(','));
  console.log('FINAL TOTAL ERRORES='+errors);
  if(errors){console.log('::error::FALLÓ AUDITORIA DE PRODUCCION. Se requiere revertir el ultimo commit de main.');process.exitCode=1}
  else console.log('RESULTADO FINAL: PRODUCCION VERIFICADA. COMMIT '+commit);
 }catch(e){console.log('::error::FALLO HTTP DE PRODUCCION: '+(e?.stack||e));process.exitCode=1}
 console.log('=== FIN AUDITORIA FINAL DE PRODUCCION ===');
}
