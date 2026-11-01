/* Native scroll choreography and accessible project viewer. No scroll hijack. */
(()=>{
'use strict';
if(!document.body.hasAttribute('data-portfolio-experience'))return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const mobile=matchMedia('(max-width: 620px)');
const root=document.documentElement;
const section=document.querySelector('.pf-feature-scroll');
const feature=document.querySelector('[data-pf-feature]');
const cards=[...document.querySelectorAll('[data-pf-card]')];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
let queued=false;
function paint(){
 queued=false;
 const full=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 root.style.setProperty('--pf-read',String(clamp(scrollY/full,0,1)));
 if(reduced.matches)return;
 if(section&&feature){
  const box=section.getBoundingClientRect();
  if(box.bottom>0&&box.top<innerHeight){
   const t=clamp((innerHeight*.55-box.top)/Math.max(1,box.height*.65),0,1);
   feature.style.setProperty('--pf-feature-y',((1-t)*25).toFixed(1)+'px');
   feature.style.setProperty('--pf-feature-rx',((1-t)*6).toFixed(2)+'deg');
   feature.style.setProperty('--pf-feature-ry',((1-t)*-4).toFixed(2)+'deg');
   feature.style.setProperty('--pf-feature-scale',(.96+t*.04).toFixed(4));
  }
 }
 if(!mobile.matches)cards.forEach(card=>{
  if(card.hidden)return;
  const box=card.getBoundingClientRect();
  if(box.bottom<0||box.top>innerHeight)return;
  const y=clamp((box.top-innerHeight*.5)/innerHeight*17,-15,15);
  card.style.setProperty('--pf-card-y',y.toFixed(1)+'px');
 });
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(paint)}}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('load',schedule,{once:true});
reduced.addEventListener('change',()=>{
 if(reduced.matches){
  document.querySelectorAll('.pf-is-pending').forEach(el=>el.classList.remove('pf-is-pending'));
  document.querySelectorAll('.pf-title-line>span,.pf-title-line>em').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
 }
 schedule();
});
schedule();
// The title is animated once; original text stays in place for accessibility.
if(!reduced.matches){
 document.querySelectorAll('.pf-title-line>span,.pf-title-line>em').forEach((el,index)=>{
  el.animate?.([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:950,delay:index*110,easing:'cubic-bezier(.16,1,.3,1)'});
 });
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.remove('pf-is-pending');observer.unobserve(entry.target)}
  }),{threshold:.04,rootMargin:'0px 0px 50px 0px'});
  cards.forEach(card=>{if(card.getBoundingClientRect().top>innerHeight)card.classList.add('pf-is-pending');observer.observe(card)});
 }
}
cards.forEach(card=>{
 const visual=card.querySelector('.pf-card-visual');
 visual.addEventListener('pointermove',event=>{
  if(reduced.matches||!fine.matches)return;
  const box=visual.getBoundingClientRect();
  visual.style.setProperty('--pf-card-rx',(((event.clientY-box.top)/box.height-.5)*-5).toFixed(2)+'deg');
  visual.style.setProperty('--pf-card-ry',(((event.clientX-box.left)/box.width-.5)*7).toFixed(2)+'deg');
 });
 visual.addEventListener('pointerleave',()=>{visual.style.removeProperty('--pf-card-rx');visual.style.removeProperty('--pf-card-ry')});
});
document.querySelectorAll('[data-next-filter]').forEach(button=>button.addEventListener('click',()=>{
 // Hidden cards may be revealed far below the observer's viewport; never leave them faded.
 cards.forEach(card=>card.classList.remove('pf-is-pending'));
 schedule();
}));
// All project data is embedded in the static document. No external preview dependency.
const source=document.getElementById('portfolio-project-data');
const dialog=document.getElementById('project-dialog');
if(!source||!dialog)return;
let projects;
try{projects=JSON.parse(source.textContent)}catch{return}
let active=0,opener=null;
const $=id=>document.getElementById(id);
function showProject(index,open=false){
 active=(index+projects.length)%projects.length;
 const project=projects[active];
 $('project-dialog-title').textContent=project.name;
 $('project-dialog-category').textContent=project.category;
 $('project-dialog-description').textContent=project.description;
 const image=$('project-dialog-image');
 image.src=project.image;image.alt='Captura de la demostración '+project.name;
 $('project-dialog-features').replaceChildren(...project.features.map(feature=>{const item=document.createElement('li');item.textContent=feature;return item}));
 $('project-dialog-demo').href=project.url;
 const params=new URLSearchParams({servicio:project.kind==='sistemas'?'sistemas':'web',referencia:project.name});
 $('project-dialog-contact').href='/Aptitud-Labs/cotizar/?'+params.toString();
 $('project-dialog-position').textContent=(active+1)+' de '+projects.length;
 if(open&&!dialog.open){
  dialog.showModal();
  document.body.classList.add('pf-dialog-open');
  if(!reduced.matches)dialog.animate?.([{opacity:0,translate:'0 20px'},{opacity:1,translate:'0 0'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 dialog.scrollTop=0;
}
document.querySelectorAll('[data-project-detail]').forEach(button=>button.addEventListener('click',()=>{
 const index=projects.findIndex(project=>project.id===button.dataset.projectDetail);
 if(index<0)return;
 opener=button;showProject(index,true);
}));
dialog.querySelector('[data-project-close]').addEventListener('click',()=>dialog.close());
dialog.querySelector('[data-project-prev]').addEventListener('click',()=>showProject(active-1));
dialog.querySelector('[data-project-next]').addEventListener('click',()=>showProject(active+1));
dialog.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();showProject(active+1)}
 if(event.key==='ArrowLeft'){event.preventDefault();showProject(active-1)}
});
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const box=dialog.getBoundingClientRect();
 if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
});
dialog.addEventListener('close',()=>{
 document.body.classList.remove('pf-dialog-open');
 opener?.focus({preventScroll:true});
});
})();
