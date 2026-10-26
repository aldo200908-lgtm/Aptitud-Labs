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
// Diagnóstico no bloqueante: el estado de publicación requiere revisión humana.
