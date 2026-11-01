/* Aptitud Labs — Cinematic Scroll Architecture v1
   Scroll-driven scene construction. Native scrolling, no scroll hijacking.
   Design layer only; no changes to catalogue, carts, forms or price logic. */
(() => {
 'use strict';
 const root=document.body, reduce=matchMedia('(prefers-reduced-motion: reduce)');
 if(!root?.classList.contains('al-theme')) return;
 const $=(sel,scope=document)=>scope.querySelector(sel);
 const $$=(sel,scope=document)=>Array.from(scope.querySelectorAll(sel));
 const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
 const lerp=(a,b,t)=>a+(b-a)*t;
 const ease=t=>1-Math.pow(1-clamp(t),3);
 const reduced=()=>reduce.matches;
 const prefix=location.pathname.includes('/Aptitud-Labs/studio-preview/')?'/Aptitud-Labs/studio-preview/':'/';
 const path=location.pathname.replace(/\/+$/,'/')||'/';
 const home=path==='/' || path==='/Aptitud-Labs/studio-preview/';
 const hero=home?$('.al-hero'):null;
 let story=null,track=null,stage=null,plates=[],shots=[],copy=[],marquee=null;
 const onScreen=el=>{const b=el.getBoundingClientRect(),h=innerHeight;return b.bottom>=-h*.4&&b.top<=h*1.4};
 function createHome(){
  root.classList.add('al-cinema-home');
  const photo=$('.al-hero-photo',hero);
  if(!photo) return;
  const old=$('.al-depth-stage',photo);
  if(old)old.remove();
  const art=document.createElement('div');
  art.className='cin-hero-art';
  art.setAttribute('aria-hidden','true');
  art.innerHTML='<div class="cin-axis"></div><div class="cin-diagonal"></div>'+
    '<div class="cin-disk"></div><div class="cin-disk cin-disk--two"></div>'+
    Array.from({length:8},(_,i)=>'<div class="cin-plate '+(i===4?'cin-plate--core':i%3===1?'cin-plate--wire':'')+'" data-cin-plate="'+i+'">'+(i===4?'<span class="cin-core-sign">A<i>.</i></span>':'')+'</div>').join('')+
    '<div class="cin-crosshair"></div><span class="cin-side-note">APTITUD LABS · EXPERIENCIAS DIGITALES</span>'+
    '<span class="cin-hero-track"><i></i></span>';
  photo.appendChild(art);
  stage=art;plates=$$('.cin-plate',art);
  const chapterData=[
   {title:'Páginas web que <em>presentan tu negocio.</em>',description:'Catálogos, reservas y páginas que permiten conocer tus productos y servicios desde cualquier dispositivo.',link:'servicios/#web',cta:'Explorar diseño web',image:'servicios-realista.webp',alt:'Dispositivos que representan una experiencia de diseño web'},
   {title:'Aplicaciones para <em>trabajar mejor.</em>',description:'Herramientas para pedidos, inventario, ventas y las tareas que hoy llevas manualmente.',link:'servicios/#apps',cta:'Conocer apps y sistemas',image:'planes-realista.webp',alt:'Composición visual sobre herramientas y planificación digital'},
   {title:'Automatización <em>y NFC.</em>',description:'Conecta tus canales, facilita las consultas y comparte información en segundos.',link:'nfc-qr/',cta:'Explorar NFC y automatización',image:'nfc-realista.webp',alt:'Tarjetas NFC y un teléfono como representación del servicio'}
  ];
  story=document.createElement('section');
  story.className='al-cinema-story';
  story.setAttribute('aria-label','Servicios de Aptitud Labs: diseño web, aplicaciones y automatización');
  const copyHtml=chapterData.map((x,i)=>'<article class="cin-story-copy'+(i===0?' is-active':'')+'" data-cin-scene="'+i+'">'+
   '<h2>'+x.title+'</h2><p>'+x.description+'</p><a href="'+prefix+x.link+'">'+x.cta+' ↗</a></article>').join('');
  const shotHtml=chapterData.map((x,i)=>'<figure class="cin-story-shot" data-cin-shot="'+i+'">'+
   '<span class="cin-frame-outline"></span><div class="cin-photo-frame"><img loading="lazy" decoding="async" src="'+prefix+'assets/visuals/'+x.image+'" alt="'+x.alt+'"></div>'+
   '<span class="cin-frame-rail"></span><span class="cin-frame-cut"></span></figure>').join('');
  story.innerHTML='<div class="cin-story-pin"><span class="cin-story-grain" aria-hidden="true"></span>'+
   '<span class="cin-story-watermark" aria-hidden="true">A.</span>'+
   '<div class="cin-story-grid"><div class="cin-story-copy-stack">'+copyHtml+'</div>'+
   '<div class="cin-story-visuals">'+shotHtml+'</div></div>'+
   '<span class="cin-story-overline" aria-hidden="true">DISEÑO · DESARROLLO · AUTOMATIZACIÓN</span>'+
   '<span class="cin-story-stroke" aria-hidden="true"><i></i></span>'+
   '<span class="cin-story-end" aria-hidden="true">DESPLÁZATE PARA EXPLORAR</span></div>';
  hero.insertAdjacentElement('afterend',story);
  copy=$$('.cin-story-copy',story);shots=$$('.cin-story-shot',story);
  marquee=document.createElement('div');
  marquee.className='cin-marquee';
  marquee.setAttribute('aria-hidden','true');
  marquee.innerHTML='<div class="cin-marquee-rail">'+
   Array.from({length:4},()=>'<b>PÁGINAS WEB</b><span>APLICACIONES</span><b>AUTOMATIZACIÓN</b><span>NFC + QR</span>').join('')+'</div>';
  const services=$('#servicios');
  services?.insertAdjacentElement('beforebegin',marquee);
  track=$('.cin-hero-track i',art);
 }
 if(hero)createHome();
 const cards=$$('.al-service-tile,.al-work-card,.al-price-card,.nfc-product');
 const heads=$$('.al-section-title,.al-title');
 const sections=$$('.al-section,.al-feature-strip article');
 cards.forEach((card,i)=>{card.classList.add('al-cinema-scrub-card');card.dataset.cinSide=(i%2===0?'1':'-1')});
 heads.forEach(h=>h.classList.add('cin-reveal-heading'));
 sections.forEach(el=>{
   if(el.classList.contains('al-section')&&!$('.cin-section-draw',el)){
     const line=document.createElement('div');line.className='cin-section-draw';line.setAttribute('aria-hidden','true');
     el.prepend(line);
   }
 });
 const catalog=$('#nfc-products');
 if(catalog&&'MutationObserver' in window){
  new MutationObserver(()=>{
    $$('.nfc-product:not(.al-cinema-scrub-card)',catalog).forEach((card,i)=>{
      card.classList.add('al-cinema-scrub-card');card.dataset.cinSide=(i%2===0?'1':'-1');
    });
    schedule();
  }).observe(catalog,{childList:true});
 }
 let scheduled=false;
 let lastH=0;
 function animateHero(h){
  if(!hero||!stage)return;
  const r=hero.getBoundingClientRect();
  const range=Math.max(1,r.height-h);
  const p=clamp(-r.top/range);
  const assembled=ease(clamp((p-.06)/.83));
  const release=ease(clamp((p-.64)/.36));
  const heroVars=hero.style;
  heroVars.setProperty('--cin-text-y',(-84*release).toFixed(2)+'px');
  heroVars.setProperty('--cin-text-opacity',(1-release*.91).toFixed(3));
  heroVars.setProperty('--cin-track',p.toFixed(4));
  const dir=[[-110,-92,-200,-33,47,-13],[135,91,-290,30,-49,22],[-99,112,105,-26,-40,21],[101,-92,180,26,55,-21],[-12,0,200,-17,29,0],[120,46,-20,18,-33,-18],[-70,-25,-120,-19,38,12],[66,128,-340,36,41,18]];
  plates.forEach((el,i)=>{
    const [dx,dy,dz,rx,ry,rz]=dir[i];
    const zTarget=(i-4)*35;
    const swirl=release*(i%2?1:-1);
    el.style.setProperty('--cx',lerp(dx,0,assembled).toFixed(1)+'px');
    el.style.setProperty('--cy',lerp(dy,0,assembled).toFixed(1)+'px');
    el.style.setProperty('--cz',(lerp(dz,zTarget,assembled)-release*120).toFixed(1)+'px');
    el.style.setProperty('--crx',(lerp(rx,0,assembled)+swirl*27).toFixed(2)+'deg');
    el.style.setProperty('--cry',(lerp(ry,0,assembled)+swirl*49).toFixed(2)+'deg');
    el.style.setProperty('--crz',(lerp(rz,0,assembled)+release*(i%2?12:-12)).toFixed(2)+'deg');
  });
  stage.style.opacity=(1-release*.72).toFixed(3);
  stage.style.transform='translate3d(0,'+(-p*28).toFixed(1)+'px,0) rotateX('+((.5-assembled)*9).toFixed(2)+'deg) scale('+(1+p*.13-release*.17).toFixed(3)+')';
  $$('.cin-disk',stage).forEach((el,i)=>el.style.setProperty('--cin-disk-angle',((i?1:-1)*p*190).toFixed(1)+'deg'));
 }
 function animateStory(h){
  if(!story)return;
  const rect=story.getBoundingClientRect();
  const distance=Math.max(1,rect.height-h);
  const p=clamp(-rect.top/distance);
  const current=p*2;
  story.style.setProperty('--cin-story-progress',p.toFixed(4));
  story.style.setProperty('--cin-watermark',(-p*130).toFixed(1)+'px');
  copy.forEach((el,i)=>{
    const d=current-i,near=Math.abs(d),opacity=clamp(1-near);
    el.style.setProperty('--cin-opacity',opacity.toFixed(4));
    el.style.setProperty('--cin-shift',(d<0?near*68:-near*49).toFixed(2)+'px');
    el.style.setProperty('--cin-blur',(near*7).toFixed(2)+'px');
    el.classList.toggle('is-active',opacity>.48);
    el.setAttribute('aria-hidden',opacity>.48?'false':'true');
    const link=el.querySelector('a');
    if(link)link.tabIndex=opacity>.48?0:-1;
  });
  shots.forEach((el,i)=>{
    const d=current-i,near=Math.abs(d),opacity=clamp(1-near);
    el.style.setProperty('--cin-opacity',opacity.toFixed(4));
    el.style.setProperty('--cin-x',(d*88).toFixed(1)+'px');
    el.style.setProperty('--cin-y',(-near*38).toFixed(1)+'px');
    el.style.setProperty('--cin-z',(-near*320).toFixed(1)+'px');
    el.style.setProperty('--cin-ry',(d*-23).toFixed(2)+'deg');
    el.style.setProperty('--cin-rx',(d*7).toFixed(2)+'deg');
    el.style.setProperty('--cin-scale',(1-near*.11).toFixed(3));
    el.style.setProperty('--cin-img-scale',(1.08+near*.14).toFixed(3));
    el.style.setProperty('--cin-img-y',((d)*12).toFixed(1)+'px');
  });
 }
 function animateCards(h){
  for(const el of document.querySelectorAll('.al-cinema-scrub-card:not([hidden])')){
    if(!onScreen(el))continue;
    const rect=el.getBoundingClientRect();
    const progress=ease(clamp((h*.89-rect.top)/(h*.7)));
    const remainder=1-progress;
    const side=+(el.dataset.cinSide||'1');
    el.style.setProperty('--cin-card-rise',(remainder*108).toFixed(2)+'px');
    el.style.setProperty('--cin-card-rot',(remainder*19).toFixed(2)+'deg');
    el.style.setProperty('--cin-card-yaw',(remainder*side*13).toFixed(2)+'deg');
    el.style.setProperty('--cin-card-scale',(1-remainder*.1).toFixed(4));
    el.style.setProperty('--cin-card-alpha',(1-remainder*.67).toFixed(3));
    el.style.setProperty('--cin-wipe',(remainder*.96).toFixed(4));
    el.style.setProperty('--cin-img-zoom',(1.05+remainder*.18).toFixed(3));
    el.style.setProperty('--cin-img-shift',(remainder*21).toFixed(2)+'px');
  }
 }
 function animateHeadings(h){
  heads.forEach(el=>{
    if(!onScreen(el))return;
    const r=el.getBoundingClientRect();
    const p=ease(clamp((h*.96-r.top)/(h*.53)));
    const remainder=1-p;
    el.style.setProperty('--cin-clip',(remainder*55).toFixed(2)+'%');
    el.style.setProperty('--cin-head-rise',(remainder*63).toFixed(1)+'px');
    el.style.setProperty('--cin-head-alpha',(1-remainder*.45).toFixed(3));
  });
  sections.forEach(el=>{
    if(!onScreen(el))return;
    const r=el.getBoundingClientRect();
    const p=ease(clamp((h*.83-r.top)/(h*.7)));
    el.style.setProperty('--cin-line',p.toFixed(4));
  });
  if(marquee&&onScreen(marquee)){
    const rect=marquee.getBoundingClientRect();
    const shift=clamp((h-rect.top)/(h+rect.height));
    marquee.style.setProperty('--cin-marquee-x',(-shift*340).toFixed(1)+'px');
  }
 }
 function frame(){
  scheduled=false;
  if(reduced())return;
  const h=window.innerHeight||768;
  if(hero&&onScreen(hero))animateHero(h);
  if(story&&onScreen(story))animateStory(h);
  animateCards(h);animateHeadings(h);
  lastH=h;
 }
 function schedule(){if(!scheduled&&!reduced()){scheduled=true;requestAnimationFrame(frame)}}
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 reduce.addEventListener?.('change',()=>{
  if(reduced()){
   cards.forEach(el=>{for(const prop of ['--cin-card-rise','--cin-card-rot','--cin-card-yaw','--cin-card-scale','--cin-card-alpha','--cin-wipe','--cin-img-zoom','--cin-img-shift'])el.style.removeProperty(prop)});
   heads.forEach(el=>{for(const prop of ['--cin-clip','--cin-head-rise','--cin-head-alpha'])el.style.removeProperty(prop)});
   copy.forEach((el,i)=>{el.style.removeProperty('--cin-opacity');el.style.removeProperty('--cin-blur');el.style.removeProperty('--cin-shift');el.removeAttribute('aria-hidden');el.querySelector('a')?.removeAttribute('tabindex')});
   shots.forEach(el=>el.style.removeProperty('--cin-opacity'));
  }else schedule();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();