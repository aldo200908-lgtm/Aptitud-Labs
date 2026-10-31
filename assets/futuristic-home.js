/* Aptitud Labs · Futuristic homepage interaction layer.
 * No analytics, no automatic external requests, no external script dependencies.
 */
(()=>{
 'use strict';
 const root=document.body;
 if(!root.classList.contains('futuristic-home'))return;
 const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
 const pointerQuery=window.matchMedia('(hover: hover) and (pointer: fine)');
 const reduced=()=>motionQuery.matches;
 const $=(selector,scope=document)=>scope.querySelector(selector);
 const $$=(selector,scope=document)=>Array.from(scope.querySelectorAll(selector));

 // Animations stay purely decorative: no-JS and reduced-motion remain fully readable.
 const reveal=$$('.fx-reveal');
 if(!reduced()&&'IntersectionObserver' in window){
  root.classList.add('fx-ready');
  const io=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    entry.target.classList.add('fx-visible');
    io.unobserve(entry.target);
   }
  },{threshold:.05,rootMargin:'0px 0px -25px 0px'});
  reveal.forEach(node=>io.observe(node));
 }else reveal.forEach(node=>node.classList.add('fx-visible'));

 // Narrow progress strip, updated at most once per frame.
 let scheduled=false;
 function frame(){
  scheduled=false;
  const span=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  const current=Math.max(0,Math.min(1,window.scrollY/span));
  root.style.setProperty('--fx-progress',current.toFixed(4));
 }
 function requestFrame(){if(!scheduled){scheduled=true;requestAnimationFrame(frame)}}
 window.addEventListener('scroll',requestFrame,{passive:true});
 window.addEventListener('resize',requestFrame,{passive:true});
 requestFrame();

 // Subtle scene perspective on desktop; disabled on touch and reduced motion.
 const scene=$('#fx-hero-scene');
 if(scene&&pointerQuery.matches&&!reduced()){
  let aimX=0,aimY=0,queued=false;
  function renderTilt(){queued=false;scene.style.setProperty('--fx-rot-x',aimX.toFixed(2)+'deg');scene.style.setProperty('--fx-rot-y',aimY.toFixed(2)+'deg')}
  scene.addEventListener('pointermove',e=>{
    const bounds=scene.getBoundingClientRect();
    const x=(e.clientX-bounds.left)/bounds.width-.5;
    const y=(e.clientY-bounds.top)/bounds.height-.5;
    aimX=Math.max(-5,Math.min(5,-y*7));
    aimY=Math.max(-7,Math.min(7,x*10));
    if(!queued){queued=true;requestAnimationFrame(renderTilt)}
  },{passive:true});
  scene.addEventListener('pointerleave',()=>{aimX=0;aimY=0;if(!queued){queued=true;requestAnimationFrame(renderTilt)}});

  // Small perspective lift on the project images—no movement that interferes with click.
  $$('.fx-project-card').forEach(card=>{
    const media=$('.fx-project-media',card);
    if(!media)return;
    media.addEventListener('pointermove',e=>{
      const rect=media.getBoundingClientRect();
      const x=(e.clientX-rect.left)/rect.width;
      const y=(e.clientY-rect.top)/rect.height;
      media.style.setProperty('--pointer-x',(x*100).toFixed(1)+'%');
      media.style.setProperty('--pointer-y',(y*100).toFixed(1)+'%');
    },{passive:true});
  });
 }

 // Filter seven actual examples; project feature is included in category counts.
 const controls=$$('[data-future-filter]');
 const projects=$$('[data-future-kind]', $('#fx-project-grid')||document);
 const status=$('#fx-filter-status');
 function filterProjects(value){
  const choice=['todos','web','herramientas'].includes(value)?value:'todos';
  let count=0;
  for(const project of projects){
   const show=choice==='todos'||project.dataset.futureKind===choice;
   project.hidden=!show;
   if(show)count++;
  }
  controls.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.futureFilter===choice)));
  if(status)status.textContent=count+(count===1?' experiencia disponible.':' experiencias disponibles.');
 }
 controls.forEach(button=>button.addEventListener('click',()=>filterProjects(button.dataset.futureFilter)));
 filterProjects('todos');

 // Click-to-load iframe: external demo content never starts downloading automatically.
 // The link to the full page remains available if browser privacy policy blocks embedding.
 const launch=$('#fx-launch-demo');
 const activate=$('#fx-demo-load');
 const frameEl=$('#fx-demo-frame');
 const placeholder=$('#fx-demo-placeholder');
 const panel=$('#fx-demo-panel');
 const url='https://aldo200908-lgtm.github.io/Maison-Dulce-/';
 let activated=false;
 function showPreview(){
  if(!frameEl||!placeholder)return;
  if(!activated){
   frameEl.src=url;
   frameEl.hidden=false;
   placeholder.hidden=true;
   activated=true;
   if(activate)activate.textContent='Vista interactiva activada ✓';
  }
  panel?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'center'});
 }
 launch?.addEventListener('click',showPreview);
 activate?.addEventListener('click',showPreview);

 // Never animate content when hidden tabs or reduced-motion preferences apply.
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  requestFrame();
 });
})();
