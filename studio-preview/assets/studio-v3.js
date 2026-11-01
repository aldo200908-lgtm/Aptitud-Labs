/* Aptitud Labs — Studio V3 / small interactive art direction
   All controls progressive: markup shows a useful first project without JS.
   No external libraries, analytics, automatic messages, or timer-based carousels.
*/
(()=>{
 'use strict';
 const root=document.body;
 if(!root||!root.classList.contains('studio-v3'))return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
 const projects={
  maison:{
   name:'Maison Dulce',desc:'Tortas, movimiento y catálogo interactivo.',group:'01 / PASTELERÍA',
   title:'UNA PASTELERÍA QUE INVITA A EXPLORAR',tag:'EXPERIENCIA GASTRONÓMICA',
   main:'/Aptitud-Labs/studio-preview/assets/projects/maison-fresas.webp',alt:'Torta de fresas de la demostración Maison Dulce',
   accent:'/Aptitud-Labs/studio-preview/assets/projects/maison-chocolate.webp',url:'https://aldo200908-lgtm.github.io/Maison-Dulce-/'
  },
  caja:{
   name:'Caja Clara',desc:'Pantallas de ventas e inventario de ejemplo.',group:'02 / SISTEMA PARA NEGOCIOS',
   title:'UNA CAJA PARA ENTENDER CADA VENTA',tag:'INTERFAZ DE GESTIÓN',
   main:'/Aptitud-Labs/studio-preview/assets/projects/caja-cover.webp',alt:'Vista de la demostración de caja e inventario Caja Clara',
   accent:null,url:'https://aptitud-labs-demos.martinjobtpaz.chatgpt.site/caja/'
  },
  sushi:{
   name:'Sushi Ten Bento',desc:'Una presentación gastronómica con identidad japonesa.',group:'03 / GASTRONOMÍA',
   title:'UNA IDENTIDAD QUE SE RECONOCE DE INMEDIATO',tag:'DIRECCIÓN VISUAL GASTRONÓMICA',
   main:'/Aptitud-Labs/studio-preview/assets/projects/sushi-ten-bento-cover.png',alt:'Vista de la web conceptual Sushi Ten Bento',
   accent:null,url:'https://aldo200908-lgtm.github.io/sushi-ten-bento-/'
  }
 };
 const $=(selector,scope=document)=>scope.querySelector(selector);
 const $$=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
 const updateImage=(image,src,alt)=>{
  if(!image)return;
  if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  image.alt=alt;
 };
 const home=$('#v3-workbench');
 if(home){
  const main=$('#v3-workbench-main'),second=$('#v3-workbench-accent');
  const no=$('#v3-workbench-no'),name=$('#v3-workbench-name'),desc=$('#v3-workbench-desc');
  const buttons=$$('[data-v3-preview]',home);
  function choose(key){
   const p=projects[key];
   if(!p||home.dataset.v3Work===key&&buttons.some(b=>b.dataset.v3Preview===key&&b.getAttribute('aria-pressed')==='true'))return;
   home.dataset.v3Work=key;
   updateImage(main,p.main,p.alt);
   if(second){
    second.hidden=!p.accent;
    if(p.accent)updateImage(second,p.accent,'');
   }
   if(no)no.textContent=p.group;
   if(name)name.textContent=p.name;
   if(desc)desc.textContent=p.desc;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v3Preview===key)));
  }
  buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.v3Preview)));
  choose('maison');
 }
 const folio=$('#v3-folio-showcase');
 if(folio){
  const image=$('#v3-folio-main'),secondary=$('#v3-folio-secondary');
  const tag=$('#v3-folio-screen-tag'),label=$('#v3-folio-label'),count=$('#v3-folio-screen-count'),link=$('#v3-folio-open');
  const buttons=$$('[data-v3-case-control]',folio);
  function choose(key){
   const p=projects[key];
   if(!p)return;
   folio.dataset.v3Case=key;
   updateImage(image,p.main,p.alt);
   if(secondary){
    secondary.hidden=!p.accent;
    if(p.accent)updateImage(secondary,p.accent,'');
   }
   if(tag)tag.textContent=p.tag;
   if(label)label.textContent=p.title;
   if(count)count.textContent=(key==='maison'?'01':key==='caja'?'02':'03')+' / 03';
   if(link){link.href=p.url;link.setAttribute('aria-label','Abrir la demostración '+p.name+' en una pestaña nueva');}
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v3CaseControl===key)));
  }
  buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.v3CaseControl)));
  choose('maison');
 }
 // Assets are already part of this repository: predecode secondary views when possible
 // only on the two pages offering the visual selector.
 if(home||folio){
  const images=[projects.caja.main,projects.sushi.main];
  if('requestIdleCallback' in window){
   window.requestIdleCallback(()=>images.forEach(src=>{const img=new Image();img.decoding='async';img.src=src;}),{timeout:3500});
  }
 }
 // Carefully restrained parallax: one frame per pointer update and only on mouse.
 if(fine.matches&&!reduce.matches){
  const boards=$$('.v3-workbench-sheet,.v3-folio-screen');
  boards.forEach(board=>{
   let busy=false,x=0,y=0;
   board.addEventListener('pointermove',event=>{
    const r=board.getBoundingClientRect();
    x=((event.clientX-r.left)/Math.max(1,r.width)-.5)*8;
    y=((event.clientY-r.top)/Math.max(1,r.height)-.5)*6;
    if(busy)return;
    busy=true;
    requestAnimationFrame(()=>{
     busy=false;board.style.setProperty('--v3-pointer-x',x.toFixed(2)+'px');board.style.setProperty('--v3-pointer-y',y.toFixed(2)+'px');
    });
   },{passive:true});
   board.addEventListener('pointerleave',()=>{
    board.style.setProperty('--v3-pointer-x','0px');board.style.setProperty('--v3-pointer-y','0px');
   },{passive:true});
  });
 }
 // Scroll reveals are progressive: content stays visible for reduced motion / older browsers.
 if(!reduce.matches&&'IntersectionObserver' in window){
  const targets=$$('.v3-home-intro,.v3-workbench,.v3-folio-title-row,.v3-folio-showcase,.home-gateway-header,.v3-folio-notes,.v3-folio-tabs');
  const io=new IntersectionObserver(items=>{
   for(const item of items){if(item.isIntersecting){item.target.classList.add('v3-in');io.unobserve(item.target);}}
  },{threshold:.08,rootMargin:'0px 0px -25px 0px'});
  targets.forEach(t=>{t.classList.add('v3-observed');io.observe(t)});
 }
})();
