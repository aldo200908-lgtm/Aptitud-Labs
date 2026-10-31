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


// Comprobación puntual y efímera de la vista previa ORIGINAL de PR #27.
// El PR #27 NO se modifica: así la rama sigue apuntando al commit 5b2dfd8.
if(process.env.GITHUB_HEAD_REF==='audit/pr27-preview-http-5b2dfd8'){
  const {createHash}=await import('node:crypto');
  const commit='5b2dfd825ea3d14f48d74c8a01f3cea8763de2bb';
  const preview='https://aptitud-labs-git-home-resumenes-final-aldo200908-lgtms-projects.vercel.app/?nocache=5b2dfd8';
  const {execFileSync}=await import('node:child_process');
  const options={signal:AbortSignal.timeout(25000),cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':'AptitudLabs-PreviewAudit/1.0'}};
  try{
    const response=await fetch(preview,options);
    const buffer=Buffer.from(await response.arrayBuffer());
    const html=buffer.toString('utf8');
    const sha=createHash('sha256').update(buffer).digest('hex');
    const occurrences=(needle)=>html.split(needle).length-1;
    const service=occurrences('VER SERVICIOS');
    const nfc=occurrences('EXPLORAR TIENDA');
    const subtitle=html.includes('Elige la modalidad que encaja con tu negocio');
    const webWeb=html.includes('WEB WEB'),iaIa=html.includes('IA IA');
    const labelPairs=[...html.matchAll(/<span class="al-summary-art-tag">([^<]*)<\/span>\s*<span class="al-summary-art-motif">([^<]*)<\/span>/g)];
    const visualDuplicates=labelPairs.filter(m=>m[1].split(/[^\p{L}\d]+/u).filter(Boolean).includes(m[2])).map(m=>m[1]+' / '+m[2]);
    // actions/checkout configura un token de lectura para commits del repositorio.
    // La lectura anónima raw.githubusercontent.com devuelve 404 si no es público.
    execFileSync('git',['fetch','--no-tags','--depth=1','origin',commit],{timeout:30000,maxBuffer:1024*1024});
    const expectedBuffer=execFileSync('git',['show',commit+':index.html'],{timeout:20000,maxBuffer:1024*1024});
    const expectedSha=createHash('sha256').update(expectedBuffer).digest('hex');
    const matchesOriginal=buffer.equals(expectedBuffer);
    let firstDiff=0;
    while(firstDiff<Math.min(buffer.length,expectedBuffer.length)&&buffer[firstDiff]===expectedBuffer[firstDiff])firstDiff++;
    const extraBytes=buffer.length-expectedBuffer.length;
    const singleInsertion=extraBytes>0&&buffer.subarray(firstDiff+extraBytes).equals(expectedBuffer.subarray(firstDiff));
    const vercelInjection=singleInsertion&&firstDiff===expectedBuffer.length&&
      buffer.subarray(firstDiff).toString('utf8')===
      '<script async data-explicit-opt-in="true" data-deployment-id="dpl_Hnx6U38rgCpfsTyCw3zxcPUTQvzF" src="https://vercel.live/_next-live/feedback/feedback.js"></script>';
    const previewMatchesCommit=matchesOriginal||vercelInjection;
    console.log('HTML fuente coincide con commit 5b2dfd8 tras excluir solo el script Vercel conocido: '+previewMatchesCommit);
    console.log('Despliegue Vercel de 5b2dfd8 confirmado en HTML: '+vercelInjection);
    console.log('Diferencia HTTP/original: bytes extra='+extraBytes+'; primer byte diferente='+firstDiff+'; inserción única='+singleInsertion);
    console.log('Contexto original: '+JSON.stringify(expectedBuffer.subarray(Math.max(0,firstDiff-120),firstDiff+230).toString('utf8')));
    console.log('Contexto Vercel: '+JSON.stringify(buffer.subarray(Math.max(0,firstDiff-120),firstDiff+400).toString('utf8')));
    if(singleInsertion)console.log('Bloque inyectado: '+JSON.stringify(buffer.subarray(firstDiff,firstDiff+extraBytes).toString('utf8')));
    console.log('=== EVIDENCIA HTTP — PR #27 COMMIT 5b2dfd8 ===');
    console.log('URL solicitada: '+preview);
    console.log('HTTP: '+response.status+'; URL final: '+response.url);
    console.log('content-type: '+(response.headers.get('content-type')||'ausente')+'; x-vercel-id: '+(response.headers.get('x-vercel-id')||'ausente')+'; x-vercel-cache: '+(response.headers.get('x-vercel-cache')||'ausente'));
    console.log('VER SERVICIOS: '+service);
    console.log('EXPLORAR TIENDA: '+nfc);
    console.log('Subtítulo exacto: '+subtitle);
    console.log('WEB WEB literal: '+webWeb);
    console.log('IA IA literal: '+iaIa);
    console.log('Motivos visualmente duplicados: '+JSON.stringify(visualDuplicates));
    console.log('Pares etiqueta/motivo: '+labelPairs.length);
    console.log('SHA-256 HTML obtenido: '+sha);
    console.log('SHA-256 index.html de commit '+commit+': '+expectedSha);
    console.log('HTML byte por byte igual al commit 5b2dfd8: '+matchesOriginal);
    console.log('Vercel response bytes: '+buffer.length+'; GitHub checkout bytes: '+expectedBuffer.length);
    if(!response.ok||service!==0||nfc!==1||!subtitle||webWeb||iaIa||visualDuplicates.length||labelPairs.length!==9||!previewMatchesCommit){
      console.log('::error::La vista previa no corresponde al HTML verificado del commit 5b2dfd8.');
      process.exitCode=1;
    }else{
      console.log('RESULTADO: APROBADO. La vista previa entrega el HTML original de 5b2dfd8, más únicamente el script de comentarios inyectado por Vercel.');
    }
    console.log('=== FIN EVIDENCIA HTTP ===');
  }catch(e){
    console.log('::error::No se pudo verificar el HTML de Vercel por HTTP: '+e.stack);
    process.exitCode=1;
  }
}
