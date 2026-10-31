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


// Auditoría HTTP puntual de TODOS los enlaces internos de las 13 páginas del sitemap del PR #28.
if(process.env.GITHUB_HEAD_REF==='audit/pr28-http-links-fd8d238'){
  const {createHash}=await import('node:crypto');
  const {execFileSync}=await import('node:child_process');
  const commit='fd8d2387ffcb94a0d6deefc8621bede92b8b7808';
  const preview='https://aptitud-labs-git-auditoria-pre-df99de-aldo200908-lgtms-projects.vercel.app';
  const deployId='dpl_4VsFy39u8DkgWWYtKFb1WFW6CDA2';
  const host=new URL(preview).hostname;
  const allowedHosts=new Set([host,'aptitudlabs.com','www.aptitudlabs.com','aptitud-labs.vercel.app']);
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  const targetURL=input=>{const u=new URL(input,preview);u.searchParams.set('nocache','fd8d238');u.hash='';return u.href};
  const cache=new Map();
  async function http(input){
    const url=targetURL(input);
    if(cache.has(url))return cache.get(url);
    const promise=(async()=>{
      for(let attempt=1;attempt<=3;attempt++){
        try{
          const res=await fetch(url,{signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'follow',
            headers:{'User-Agent':'AptitudLabs-PR28-LinkAudit/1.0','Cache-Control':'no-cache','Pragma':'no-cache'}});
          const bytes=Buffer.from(await res.arrayBuffer());
          return {status:res.status,bytes,html:bytes.toString('utf8'),final:res.url,
            vercelCache:res.headers.get('x-vercel-cache')||'',vercelId:res.headers.get('x-vercel-id')||''};
        }catch(e){
          if(attempt===3)return {status:0,bytes:Buffer.alloc(0),html:'',final:url,error:String(e)};
          await new Promise(resolve=>setTimeout(resolve,300*attempt));
        }
      }
    })();
    cache.set(url,promise);
    return promise;
  }
  function getLinks(html){
    const result=[];
    const re=/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi;
    for(const m of html.matchAll(re)){
      let href=(m[1]??m[2]??m[3]??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");
      if(href)result.push({href,line:html.slice(0,m.index).split('\n').length});
    }
    return result;
  }
  function hasAnchor(html,fragment){
    const re=/\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    for(const m of html.matchAll(re))if((m[1]??m[2]??m[3])===fragment)return true;
    return false;
  }
  let failures=0,linkCount=0,passCount=0,checkedAnchors=0,missingAnchors=0;
  const broken=[];
  console.log('=== PR28 AUDITORIA HTTP REAL DE 13 PAGINAS ===');
  console.log('PR28 COMMIT ESPERADO: '+commit);
  console.log('PR28 URL PORTADA SIN CACHE: '+targetURL('/'));
  try{
    const xml=await http('/sitemap.xml');
    const locs=[...xml.html.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m=>m[1]);
    const paths=[...new Set(locs.map(s=>new URL(s).pathname))];
    console.log('SITEMAP HTTP='+xml.status+' TOTAL DE PAGINAS='+paths.length);
    if(xml.status!==200||paths.length!==13){failures++;console.log('::error::El sitemap no contiene exactamente 13 páginas disponibles');}
    const home=await http('/');
    console.log('PORTADA HTTP='+home.status+' URL='+home.final+' x-vercel-cache='+home.vercelCache+' x-vercel-id='+home.vercelId);
    console.log('PORTADA BYTES='+home.bytes.length);
    console.log('PORTADA SHA-256 PUBLICO='+hash(home.bytes));
    execFileSync('git',['fetch','--no-tags','--depth=1','origin',commit],{timeout:30000,maxBuffer:1024*1024});
    const original=execFileSync('git',['show',commit+':index.html'],{timeout:20000,maxBuffer:1024*1024});
    const extraScript=Buffer.from('<script async data-explicit-opt-in="true" data-deployment-id="'+deployId+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>','utf8');
    const injected=home.bytes.subarray(-extraScript.length).equals(extraScript);
    const sanitized=injected?home.bytes.subarray(0,home.bytes.length-extraScript.length):home.bytes;
    const equal=sanitized.equals(original);
    console.log('PORTADA SHA-256 ARCHIVO DEL COMMIT='+hash(original));
    console.log('PORTADA SHA-256 SIN SCRIPT DE VERCEL='+hash(sanitized));
    console.log('PORTADA SCRIPT VERCEL INYECTADO='+injected+' BYTES='+extraScript.length);
    console.log('PORTADA HTML CORRESPONDE EXACTAMENTE AL COMMIT='+equal);
    if(home.status!==200||!equal){failures++;console.log('::error::El HTML no corresponde al commit #28');}
    for(const [pi,path]of paths.entries()){
      const page=await http(path);
      console.log('=== PAGINA '+(pi+1)+'/13 '+path+' HTTP='+page.status+' ===');
      console.log('PAGINA URL='+targetURL(path));
      if(page.status!==200){failures++;broken.push({page:path,status:page.status,error:page.error||'Página no disponible'});continue;}
      const anchors=[];
      for(const item of getLinks(page.html)){
        let absolute;
        try{absolute=new URL(item.href,targetURL(path))}catch(e){failures++;broken.push({page:path,line:item.line,href:item.href,error:'URL inválida'});continue;}
        if(!['http:','https:'].includes(absolute.protocol)||!allowedHosts.has(absolute.hostname))continue;
        anchors.push({href:item.href,line:item.line,path:absolute.pathname,query:absolute.search,hash:absolute.hash});
      }
      console.log('PAGINA ENLACES INTERNOS ENCONTRADOS='+anchors.length);
      for(const entry of anchors){
        const dest=await http(entry.path+entry.query);
        let anchor='no-aplica';
        if(entry.hash.length>1){
          checkedAnchors++;
          let name;
          try{name=decodeURIComponent(entry.hash.slice(1))}catch(e){name=entry.hash.slice(1)}
          anchor=dest.status===200&&hasAnchor(dest.html,name)?'existe':'NO-EXISTE';
          if(anchor==='NO-EXISTE')missingAnchors++;
        }
        const ok=dest.status===200&&anchor!=='NO-EXISTE';
        linkCount++;
        if(ok)passCount++;else{failures++;broken.push({page:path,line:entry.line,href:entry.href,destination:entry.path+entry.query+entry.hash,status:dest.status,anchor})}
        console.log('ENLACE '+linkCount+' ORIGEN='+path+':'+entry.line+
          ' HREF='+JSON.stringify(entry.href)+' DESTINO='+JSON.stringify(entry.path+entry.query+entry.hash)+
          ' HTTP='+dest.status+' ANCLA='+anchor+' RESULTADO='+(ok?'OK':'ROTO'));
      }
    }
    console.log('=== RESULTADO AUDITORIA COMPLETA PR #28 ===');
    console.log('PAGINAS INDEXABLES='+paths.length);
    console.log('ENLACES INTERNOS TOTALES='+linkCount);
    console.log('ENLACES OK='+passCount);
    console.log('ANCLAS COMPROBADAS='+checkedAnchors);
    console.log('ANCLAS INEXISTENTES='+missingAnchors);
    console.log('ROTOS TOTALES='+broken.length);
    console.log('HTTP ENDPOINTS UNICOS='+cache.size);
    if(broken.length)console.log('DETALLE ENLACES ROTOS='+JSON.stringify(broken));
    if(failures||paths.length!==13){console.log('::error::Auditoria encontro '+failures+' fallos');process.exitCode=1}
    else console.log('PR #28 AUDITORIA APROBADA: cada href interno HTTP 200 y cada ancla encontrada.');
    console.log('=== FIN PR28 AUDITORIA HTTP REAL ===');
  }catch(e){console.log('::error::Falló auditoria HTTP PR28: '+(e.stack||String(e)));process.exitCode=1}
}
