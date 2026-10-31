/* KINETIC EDITORIAL — choreography coordinated by scroll and pointer.
 * Native APIs; no third-party animation libraries or background requests.
 */
(()=>{
 'use strict';
 const root=document.body;
 if(!root?.classList.contains('kinetic-editorial'))return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
 const $=(q,s=document)=>s.querySelector(q);
 const $$=(q,s=document)=>Array.from(s.querySelectorAll(q));
 const manifest=$('.fx-manifesto'), lines=$$('[data-fx-drift]'), stage=$('.fx-story-stage');
 const chapters=$$('[data-fx-chapter]'),captions={
  1:'01 — DEL CONCEPTO AL DISEÑO',
  2:'02 — MOVIMIENTO CON INTENCIÓN',
  3:'03 — UNA EXPERIENCIA QUE FUNCIONA'
 };
 const caption=$('#fx-stage-caption');
 let activeScene=0;

 function setScene(scene){
  if(scene===activeScene||!chapters.some(x=>Number(x.dataset.fxChapter)===scene))return;
  activeScene=scene;
  if(stage)stage.dataset.fxScene=String(scene);
  if(caption)caption.textContent=captions[scene]||captions[1];
  chapters.forEach(item=>item.classList.toggle('is-active',Number(item.dataset.fxChapter)===scene));
 }
 setScene(1);

 // Additional page-wide entrances: all elements retain their normal layout without JS.
 const animated=[
  ...$$('#resumen-servicios .section-top,#resumen-planes .section-top,#nfc .home-nfc-grid figure,#metodo .section-top,#preguntas .faq-grid>div:first-child,#contacto .contact-intro'),
  ...$$('.home-card,.home-plan,.process-three article,.fx-pastry-steps>div'),
  ...$$('.fx-demo-panel,.brief-form')
 ];
 if(!motion.matches&&'IntersectionObserver' in window){
  const intro=new IntersectionObserver(items=>{
   for(const item of items){
    if(!item.isIntersecting)continue;
    item.target.classList.add('kinetic-visible');
    intro.unobserve(item.target);
   }
  },{rootMargin:'0px 0px -24px 0px',threshold:.06});
  for(const item of animated){
   item.classList.add('kinetic-enter');
   intro.observe(item);
  }
  root.classList.add('kinetic-ready');
 }else animated.forEach(item=>item.classList.add('kinetic-visible'));

 // Scroll coordinates: one passive event, one animation frame, no layout writes in loops.
 let ticking=false;
 function paint(){
  ticking=false;
  if(motion.matches)return;
  const vh=Math.max(window.innerHeight,1);
  if(manifest&&lines.length){
   const b=manifest.getBoundingClientRect();
   if(b.bottom>0&&b.top<vh){
    const p=Math.max(0,Math.min(1,(vh-b.top)/(vh+b.height)));
    lines.forEach((line,i)=>{
     const distance=(p-.5)*(i===0?108:-93);
     const child=line.firstElementChild;
     if(child)child.style.transform='translate3d('+distance.toFixed(1)+'px,0,0)';
    });
   }
  }
  if(chapters.length){
   let choice=1,min=Infinity;
   for(const chapter of chapters){
    const rect=chapter.getBoundingClientRect();
    const center=rect.top+rect.height*.5;
    const distance=Math.abs(center-vh*.53);
    if(distance<min){min=distance;choice=Number(chapter.dataset.fxChapter)||1;}
   }
   if(stage){
    const bounds=stage.getBoundingClientRect();
    const block=$('.fx-motion-story');
    if(block){
     const parent=block.getBoundingClientRect();
     if(parent.top<vh&&parent.bottom>0)setScene(choice);
    }
   }
  }
 }
 function schedule(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 schedule();

 // Organic reveal on large product photographs. Touch interactions keep native behavior.
 if(fine.matches&&!motion.matches){
  $$('.fx-featured-art,.fx-project-media').forEach(item=>{
   let queued=false,x=50,y=50;
   item.addEventListener('pointermove',event=>{
    const b=item.getBoundingClientRect();
    x=Math.max(0,Math.min(100,((event.clientX-b.left)/Math.max(1,b.width))*100));
    y=Math.max(0,Math.min(100,((event.clientY-b.top)/Math.max(1,b.height))*100));
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
     queued=false;
     item.style.setProperty('--fx-spot-x',x.toFixed(1)+'%');
     item.style.setProperty('--fx-spot-y',y.toFixed(1)+'%');
    });
   },{passive:true});
  });

  // Small magnetic responses give the principal controls physicality.
  $$('.fx-hero-actions .button,.fx-feature-actions button,.fx-demo-load').forEach(button=>{
   button.addEventListener('pointermove',event=>{
    const r=button.getBoundingClientRect();
    const dx=(event.clientX-(r.left+r.width/2))/Math.max(1,r.width);
    const dy=(event.clientY-(r.top+r.height/2))/Math.max(1,r.height);
    button.style.transform='translate3d('+(dx*11).toFixed(1)+'px,'+(dy*9).toFixed(1)+'px,0)';
   },{passive:true});
   button.addEventListener('pointerleave',()=>{button.style.transform='';},{passive:true});
   button.addEventListener('blur',()=>{button.style.transform='';});
  });
 }

 // Cap scrolling motion on backgrounded tabs without hiding content.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 motion.addEventListener?.('change',()=>{
  if(motion.matches){
   lines.forEach(line=>{const child=line.firstElementChild;if(child)child.style.transform='';});
   animated.forEach(item=>item.classList.add('kinetic-visible'));
  }
  schedule();
 });
})();
