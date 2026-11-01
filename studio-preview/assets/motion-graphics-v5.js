/* Aptitud Labs | Motion Graphics V5
   Scroll-driven scene orchestration inspired by the user's reference videos:
   mask/kinetic type + 3D project wall + controlled lighting. No autoplay video.
   Single passive scroll listener, one rAF, no external libraries.
*/
(()=>{
 'use strict';
 const body=document.body;
 if(!body||!body.classList.contains('obsidian-ice'))return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const lerp=(a,b,t)=>a+(b-a)*t;
 const $=(q,scope=document)=>scope.querySelector(q);
 const $$=(q,scope=document)=>Array.from(scope.querySelectorAll(q));
 const reel=$('[data-mg-reel]');
 const wall=$('[data-mg-wall]');
 const sections=[reel,wall].filter(Boolean);
 if(!sections.length&&!$('.service-card,.al-card'))return;
 const names=['01 / La idea toma forma.','02 / Diseñamos la experiencia.','03 / El resultado se mueve.'];
 const wallNames=['01 / MAISON DULCE','02 / CAJA CLARA','03 / SUSHI TEN BENTO','04 / CORTE 01'];
 const faces=reel?$$('.mg-motion-face',reel):[];
 const cards=wall?$$('.mg-wall-card',wall):[];
 const mobile=window.matchMedia('(max-width: 700px)');
 let queued=false,scrollY=0,frame=0;

 // Read progress once per section; when not in viewport, avoid transform work.
 function measure(section){
  const box=section.getBoundingClientRect(),vh=window.innerHeight;
  const total=Math.max(1,box.height-vh);
  return {t:clamp(-box.top/total,0,1),visible:box.bottom>=0&&box.top<=vh};
 }
 function paintDeck(elements,index,progress,stageWidth,mode){
  // Translate around one camera focal point; cards past the focus recede in Z.
  const scene=progress*(elements.length-1);
  const radius=clamp(stageWidth*(mode==='wall'?.32:.3),mobile.matches?80:110,mode==='wall'?285:240);
  const amplitude=mobile.matches?26:42;
  elements.forEach((el,i)=>{
   const offset=i-scene;
   const abs=Math.abs(offset);
   const x=offset*radius;
   const y=Math.min(abs*amplitude,125)+(i%2===0?-7:7);
   const z=140-abs*(mobile.matches?140:165);
   const turn=-offset*(mobile.matches?18:24);
   const alpha=clamp(1-abs*.47,.12,1);
   const scale=clamp(1-abs*.095,.7,1);
   el.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),calc(-50% + '+y.toFixed(1)+'px),'+z.toFixed(1)+'px) rotateY('+turn.toFixed(1)+'deg) scale('+scale.toFixed(3)+')';
   el.style.opacity=alpha.toFixed(3);
   el.style.filter='saturate('+clamp(1.07-abs*.18,.55,1.07).toFixed(2)+')';
   el.style.zIndex=String(10+Math.round(10-abs*3));
  });
  return clamp(Math.round(scene),0,elements.length-1);
 }
 function paintReel(){
  if(!reel)return;
  if(reduce.matches){reel.dataset.mgPhase='0';return;}
  const v=measure(reel);if(!v.visible)return;
  const {t}=v;
  reel.style.setProperty('--mg-progress',t.toFixed(4));
  reel.style.setProperty('--mg-ring',(t*205).toFixed(1)+'deg');
  reel.style.setProperty('--mg-ribbon-y',((t-.5)*135).toFixed(1)+'px');
  reel.style.setProperty('--mg-a-x',(-t*190).toFixed(1)+'px');
  reel.style.setProperty('--mg-a-y',(-t*50).toFixed(1)+'px');
  reel.style.setProperty('--mg-a-opacity',(.51-t*.18).toFixed(2));
  reel.style.setProperty('--mg-b-x',(t*100-40).toFixed(1)+'px');
  reel.style.setProperty('--mg-b-y',(t*18).toFixed(1)+'px');
  reel.style.setProperty('--mg-b-opacity',(.30+t*.1).toFixed(2));
  reel.style.setProperty('--mg-c-x',(t*155-70).toFixed(1)+'px');
  reel.style.setProperty('--mg-c-y',(t*45).toFixed(1)+'px');
  reel.style.setProperty('--mg-c-opacity',(.27+t*.22).toFixed(2));
  const layer=$('.mg-motion-gallery',reel);
  if(!layer)return;
  const selected=paintDeck(faces,0,t,layer.clientWidth,'reel');
  const last=reel.dataset.mgPhase;
  if(last!==String(selected)){
   reel.dataset.mgPhase=String(selected);
   const caption=$('#mg-chapter',reel);
   if(caption)caption.textContent=names[selected];
  }
 }
 function paintWall(){
  if(!wall)return;
  if(reduce.matches){wall.dataset.mgFrame='0';return;}
  const v=measure(wall);if(!v.visible)return;
  const t=v.t;
  wall.style.setProperty('--mg-wall-progress',t.toFixed(4));
  const layer=$('.mg-wall-track',wall);
  if(!layer)return;
  const selected=paintDeck(cards,0,t,layer.clientWidth,'wall');
  if(wall.dataset.mgFrame!==String(selected)){
   wall.dataset.mgFrame=String(selected);
   const caption=$('#mg-wall-caption',wall);
   if(caption)caption.textContent=wallNames[selected];
  }
 }
 function onFrame(){
  queued=false;
  if(reel)paintReel();
  if(wall)paintWall();
 }
 const tick=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(onFrame);
 };
 if(sections.length){
  window.addEventListener('scroll',tick,{passive:true});
  window.addEventListener('resize',tick,{passive:true});
  // Images may change intrinsic sizing after decode; recompute camera.
  window.addEventListener('load',tick,{once:true});
  tick();
 }
 // Reference-grade image transitions when visitors select a different demo.
 // No automatic carousel that could frustrate mobile visitors.
 if(!reduce.matches&&typeof MutationObserver!=='undefined'){
  ['#v3-workbench-main','#v3-folio-main'].forEach(selector=>{
   const img=$(selector);if(!img)return;
   let last=img.getAttribute('src');
   const observer=new MutationObserver(()=>{
    const next=img.getAttribute('src');
    if(!next||next===last)return;
    last=next;
    if(!img.animate)return;
    img.getAnimations().forEach(a=>{if(a.playState==='running'&&a.effect?.getTiming?.().duration===630)a.cancel()});
    img.animate([
     {opacity:.16,clipPath:'inset(0 60% 0 0)',filter:'blur(9px)',transform:'translateX(18px) scale(1.04)'},
     {opacity:1,clipPath:'inset(0 0% 0 0)',filter:'blur(0px)',transform:'translateX(0) scale(1)'}
    ],{duration:630,easing:'cubic-bezier(.16,1,.3,1)'});
   });
   observer.observe(img,{attributes:true,attributeFilter:['src']});
  });
 }
 // Small sections inherit the same choreography, never hidden until scrolling.
 if(!reduce.matches&&'IntersectionObserver' in window){
  const entries=$$('.service-card,.al-card,.home-belief-steps>div');
  const io=new IntersectionObserver(list=>{
   list.forEach(item=>{
    if(!item.isIntersecting)return;
    io.unobserve(item.target);
    if(!item.target.animate)return;
    item.target.animate([
     {opacity:.72,transform:'translateY(18px)',clipPath:'inset(0 0 13% 0)'},
     {opacity:1,transform:'translateY(0px)',clipPath:'inset(0 0 0% 0)'}
    ],{duration:730,easing:'cubic-bezier(.16,1,.3,1)'});
   });
  },{threshold:.13,rootMargin:'0px 0px -10px 0px'});
  entries.forEach(el=>io.observe(el));
 }
 body.classList.add('mg-motion-in');
 reduce.addEventListener?.('change',()=>{
  if(reduce.matches){
   for(const el of [...faces,...cards]){
    el.style.removeProperty('transform');el.style.removeProperty('opacity');el.style.removeProperty('filter');
   }
  }else tick();
 });
})();
