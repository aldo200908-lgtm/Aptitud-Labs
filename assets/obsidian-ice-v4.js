/* APTITUD LABS — Obsidian Ice motion controller.
   Physical depth on pointer-capable devices, scroll composition and progressive UI.
   No canvas/WebGL dependency, no third-party script, no background network requests.
*/
(()=>{
 'use strict';
 const body=document.body;
 if(!body||!body.classList.contains('obsidian-ice'))return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=window.matchMedia('(hover: hover) and (pointer: fine)');
 const $=(s,root=document)=>root.querySelector(s);
 const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 // Keep current page obvious even though every section is a distinct URL.
 const route=location.pathname.replace(/\/+$/,'')||'/';
 $$('.desktop-links a,.menu-panel a').forEach(link=>{
  try{
   const p=new URL(link.href,location.href);
   if(p.origin!==location.origin)return;
   if((p.pathname.replace(/\/+$/,'')||'/')===route)link.setAttribute('aria-current','page');
  }catch{}
 });

 // Page progress line uses transforms only, never blocks touch targets.
 const bar=document.createElement('div');
 bar.className='v4-reading-line';bar.setAttribute('aria-hidden','true');
 body.append(bar);
 let busy=false;
 const hero=$('.v3-home-hero'),folio=$('.v3-portfolio-hero');
 function onFrame(){
  busy=false;
  const y=window.scrollY||0,range=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  body.style.setProperty('--v4-scroll',(clamp(y/range,0,1)).toFixed(4));
  if(reduce.matches)return;
  const scene=hero||folio;
  if(scene){
   const box=scene.getBoundingClientRect();
   if(box.bottom>=0&&box.top<window.innerHeight){
    const progress=clamp((0-box.top)/Math.max(1,box.height),0,1);
    scene.style.setProperty('--v4-scene-scroll',progress.toFixed(4));
   }
  }
 }
 function requestFrame(){if(!busy){busy=true;requestAnimationFrame(onFrame)}}
 window.addEventListener('scroll',requestFrame,{passive:true});
 window.addEventListener('resize',requestFrame,{passive:true});
 requestFrame();

 // Offset optical light follows pointer; 3D adjusts at most one frame per pointermove.
 // Mobile gets a static rich composition with equal visibility of project samples.
 if(pointer.matches&&!reduce.matches){
  const targets=$$('.v3-workbench-sheet,.v3-folio-screen');
  for(const stage of targets){
   let x=0,y=0,sx=50,sy=50,queued=false;
   function paint(){
    queued=false;
    stage.style.setProperty('--v4-rotate-x',(-y*5).toFixed(2)+'deg');
    stage.style.setProperty('--v4-rotate-y',(x*6).toFixed(2)+'deg');
    stage.style.setProperty('--v4-spot-x',sx.toFixed(1)+'%');
    stage.style.setProperty('--v4-spot-y',sy.toFixed(1)+'%');
   }
   stage.addEventListener('pointermove',event=>{
    const r=stage.getBoundingClientRect();
    const px=clamp((event.clientX-r.left)/Math.max(1,r.width),0,1);
    const py=clamp((event.clientY-r.top)/Math.max(1,r.height),0,1);
    x=(px-.5)*2;y=(py-.5)*2;sx=px*100;sy=py*100;
    if(!queued){queued=true;requestAnimationFrame(paint);}
   },{passive:true});
   stage.addEventListener('pointerleave',()=>{
    x=0;y=0;sx=50;sy=50;if(!queued){queued=true;requestAnimationFrame(paint);}
   },{passive:true});
  }
  // Magnetic micro-movement only for the CTA surfaces, with no focus/keyboard motion.
  $$('.v3-button,.v3-button-ghost,.nav-cta').forEach(button=>{
   button.addEventListener('pointermove',event=>{
    const r=button.getBoundingClientRect();
    const x=(event.clientX-r.left)/Math.max(1,r.width)-.5;
    const y=(event.clientY-r.top)/Math.max(1,r.height)-.5;
    button.style.translate=(x*7).toFixed(1)+'px '+(y*5).toFixed(1)+'px';
   },{passive:true});
   const reset=()=>{button.style.translate='';};
   button.addEventListener('pointerleave',reset,{passive:true});
   button.addEventListener('blur',reset);
  });
 }

 // Deliberately reveal only secondary elements. Hero / product details never wait for scroll.
 if(!reduce.matches&&'IntersectionObserver' in window){
  const targets=$$('.home-gateway-header,.home-belief-grid,.v3-folio-notes .folio-intro-heading,.fx-work .fx-section-heading,.fx-story-head,.section-top,.quote-head');
  const io=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting){entry.target.classList.add('v4-seen');io.unobserve(entry.target);}
   }
  },{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  targets.forEach((el)=>{el.classList.add('v4-scroll-reveal');io.observe(el);});
  body.classList.add('v4-observing');
 }
 // Restore all content instantly when user's motion preference changes.
 reduce.addEventListener?.('change',()=>{
  if(reduce.matches){
   $$('.v4-scroll-reveal').forEach(x=>x.classList.add('v4-seen'));
   $$('.v3-workbench-sheet,.v3-folio-screen').forEach(x=>{
    x.style.removeProperty('--v4-rotate-x');x.style.removeProperty('--v4-rotate-y');
   });
  }
  requestFrame();
 });
})();
