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


// Comprobación HTTP de release #27, independiente de la rama que se publicará.
if(process.env.GITHUB_HEAD_REF==='audit/release-20261030-preview'){
 const {createHash}=await import('node:crypto');
 const {execFileSync}=await import('node:child_process');
 const commit='7d135c65a2778e277c82edfab942fabffbb60b29';
 const preview='https://aptitud-labs-git-home-resumenes-final-aldo200908-lgtms-projects.vercel.app/?nocache=7d135c65';
 const vercelId='dpl_D9bJSKcJq1mQK3YpJxyPp6VVKiQT';
 const sha=buf=>createHash('sha256').update(buf).digest('hex');
 console.log('=== RELEASE PREVIEW #27 HTTP ===');
 console.log('COMMIT SOLICITADO='+commit);
 console.log('VISTA PREVIA URL='+preview);
 try{
  const response=await fetch(preview,{signal:AbortSignal.timeout(25000),cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':'AptitudLabs-ReleaseValidation'}});
  const buffer=Buffer.from(await response.arrayBuffer());
  const html=buffer.toString('utf8');
  const count=x=>html.split(x).length-1;
  console.log('VISTA PREVIA HTTP='+response.status+' FINAL='+response.url+' CACHE='+(response.headers.get('x-vercel-cache')||'ausente'));
  const checks={
   'VER TODOS LOS SERVICIOS':count('VER TODOS LOS SERVICIOS')===1,
   'Elige la modalidad que encaja con tu negocio':html.includes('Elige la modalidad que encaja con tu negocio'),
   'Desde S/ 249':html.includes('Desde S/ 249'),
   'Desde S/ 419':html.includes('Desde S/ 419'),
   'Desde S/ 690':html.includes('Desde S/ 690'),
   'Tarifas orientativas exactas':html.includes('Tarifas orientativas de desarrollo inicial. El precio final se confirma por escrito; dominio, hosting, mantenimiento y opciones adicionales se cotizan por separado.'),
   'Visual conceptual. Los diseños':html.includes('Visual conceptual. Los diseños'),
   'sin texto anterior de tarifas':!html.includes('ya publicadas en nuestra página de planes'),
   'sin puntuación NFC anterior':!html.includes('Visual conceptual; Los diseños'),
   'Nuestro trabajo intacto':html.includes('Proyectos seleccionados')&&html.includes('href="#trabajo-destacado"'),
   'un único Explorar Tienda':count('EXPLORAR TIENDA')===1
  };
  for(const [name,ok] of Object.entries(checks))console.log('PREVIEW '+name+'='+ok);
  console.log('PREVIEW CTA SERVICIOS CONTEO='+count('VER TODOS LOS SERVICIOS'));
  console.log('PREVIEW CTA TIENDA CONTEO='+count('EXPLORAR TIENDA'));
  console.log('PREVIEW HTML SHA-256='+sha(buffer));
  execFileSync('git',['fetch','--no-tags','--depth=1','origin',commit],{timeout:30000,maxBuffer:1024*1024});
  const orig=execFileSync('git',['show',commit+':index.html'],{timeout:20000,maxBuffer:1024*1024});
  const injected=Buffer.from('<script async data-explicit-opt-in="true" data-deployment-id="'+vercelId+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>');
  const hasInjected=buffer.subarray(-injected.length).equals(injected);
  const cleaned=hasInjected?buffer.subarray(0,buffer.length-injected.length):buffer;
  console.log('PREVIEW SHA-256 INDEX COMMIT='+sha(orig));
  console.log('PREVIEW VERCEL SCRIPT='+hasInjected+' BYTES='+injected.length);
  console.log('PREVIEW HTML ES EXACTO COMMIT='+cleaned.equals(orig));
  console.log('PREVIEW DEPLOYMENT ID='+vercelId);
  if(response.status!==200||!cleaned.equals(orig)||Object.values(checks).some(x=>!x)){
    console.log('::error::La vista previa #27 no superó el control de release');process.exitCode=1;
  }else console.log('RESULTADO PR27: APROBADO PARA FUSION');
 }catch(e){console.log('::error::Verificación fallida: '+(e.stack||e));process.exitCode=1}
 console.log('=== FIN RELEASE PREVIEW #27 ===');
}
