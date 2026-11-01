/* Aptitud Labs — one owner for scroll and 3D. Native scrolling, no dependencies. */
(()=>{
'use strict';
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-height: 650px) and (max-width: 620px)');
const staticScenes=()=>reduced.matches||compact.matches;
const cinema=document.querySelector('.service-cinema');
const copies=[...document.querySelectorAll('[data-scene]')];
const art=[...document.querySelectorAll('[data-scene-art]')];
const controls=[...document.querySelectorAll('[data-scene-button]')];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let pending=false,selected=-1;
function selectScene(index){
 selected=index;
 [...copies,...art].forEach(el=>{
  const active=Number(el.dataset.scene??el.dataset.sceneArt)===index;
  el.getAnimations?.().forEach(animation=>animation.cancel());
  el.hidden=!active;
  if(active&&!staticScenes()&&el.animate)el.animate([{opacity:.5,translate:"0 12px"},{opacity:1,translate:"0 0"}],{duration:350,easing:"cubic-bezier(.2,.8,.2,1)"});
  el.setAttribute('aria-hidden',String(!active));
  // No queued transitions, clones, blur or retained outgoing text.
 });
 controls.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.sceneButton)===index)));
 cinema?.style.setProperty('--scene-index',index);
}
function paintScroll(){
 pending=false;
 if(!cinema||staticScenes())return;
 const box=cinema.getBoundingClientRect();
 const sticky=cinema.querySelector('.cinema-sticky');
 const top=parseFloat(getComputedStyle(sticky).top)||0;
 const distance=Math.max(1,box.height-sticky.offsetHeight);
 const progress=clamp((top-box.top)/distance,0,1);
 const index=Math.min(2,Math.floor(progress*3));
 if(index!==selected)selectScene(index);

}
function schedule(){if(!pending){pending=true;requestAnimationFrame(paintScroll)}}
function configureMotion(){
 root.classList.toggle('motion-enabled',!staticScenes());
 if(staticScenes()){
  [...copies,...art].forEach(el=>{el.hidden=false;el.removeAttribute('aria-hidden')});
  document.querySelectorAll('.is-pending').forEach(el=>el.classList.remove('is-pending'));
  selected=-1;
 }else if(cinema){selectScene(0);schedule()}
}
controls.forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.sceneButton);
 if(staticScenes()){copies[index]?.scrollIntoView({block:'center'});return}
 const sticky=cinema.querySelector('.cinema-sticky');
 const top=parseFloat(getComputedStyle(sticky).top)||0;
 const distance=Math.max(1,cinema.offsetHeight-sticky.offsetHeight);
 const y=scrollY+cinema.getBoundingClientRect().top-top+distance*((index+.5)/3);
 window.scrollTo({top:y,behavior:'instant'});
 selectScene(index);
}));
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
reduced.addEventListener('change',configureMotion);
compact.addEventListener('change',configureMotion);
configureMotion();
// Modest entrance animations. Content remains readable before JS and on errors.
if(!reduced.matches&&'IntersectionObserver' in window){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.remove('is-pending');io.unobserve(e.target)}
 }),{threshold:0,rootMargin:'0px 0px 40px 0px'});
 document.querySelectorAll('.motion-manifesto h2,.motion-process-grid>div,.work-door>div,.feature-card,.service-row-copy,.project-card,.price-card,.steps-grid>div').forEach(el=>{
  el.classList.add('motion-reveal');
  if(el.getBoundingClientRect().top>innerHeight)el.classList.add('is-pending');
  io.observe(el);
 });
}
})();
