/* Full-screen native-scroll portfolio. Exactly one active scene in motion mode. */
(()=>{
'use strict';
if(!document.body.hasAttribute('data-portfolio-experience'))return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-height: 600px)');
const mobile=matchMedia('(max-width: 620px)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const theatre=document.querySelector('.ex-theatre');
const stage=document.querySelector('[data-ex-stage]');
const scenes=[...document.querySelectorAll('[data-ex-scene]')];
const nav=[...document.querySelectorAll('[data-ex-nav]')];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const staticMode=()=>reduced.matches||compact.matches;
let selected=-1,queued=false;
function setScene(index){
 selected=index;
 scenes.forEach((scene,i)=>{
  scene.querySelectorAll('.ex-name,.ex-image-button').forEach(el=>el.getAnimations?.().forEach(animation=>animation.cancel()));
  const active=i===index;
  scene.hidden=!active;
  scene.setAttribute('aria-hidden',String(!active));
  if(active&&!staticMode()){
   const name=scene.querySelector('.ex-name');
   name?.animate?.([{opacity:.25,translate:'0 25px'},{opacity:1,translate:'0 0'}],{duration:460,easing:'cubic-bezier(.16,1,.3,1)'});
   const image=scene.querySelector('.ex-image-button');
   image?.animate?.([{opacity:.3,clipPath:'inset(0 0 17% 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:560,easing:'cubic-bezier(.16,1,.3,1)'});
  }
 });
 stage.dataset.tone=scenes[index].dataset.tone;
 stage.querySelector('[data-ex-counter]').textContent=(index+1)+' de '+scenes.length;
 nav.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.exNav)===index)));
}
function measure(){
 const box=theatre.getBoundingClientRect();
 const top=parseFloat(getComputedStyle(stage).top)||0;
 const distance=Math.max(1,theatre.offsetHeight-stage.offsetHeight);
 return {box,top,distance,progress:clamp((top-box.top)/distance,0,1)};
}
function paint(){
 queued=false;
 if(staticMode()||!stage||!scenes.length)return;
 const {box,progress}=measure();
 const scaled=progress*scenes.length;
 const index=Math.min(scenes.length-1,Math.floor(scaled));
 const phase=clamp(scaled-index,0,1);
 if(index!==selected)setScene(index);
 stage.style.setProperty('--ex-progress',progress.toFixed(4));
 if(box.bottom<0||box.top>innerHeight)return;
 stage.style.setProperty('--ex-ry',(-10+phase*(mobile.matches?16:20)).toFixed(2)+'deg');
 stage.style.setProperty('--ex-rx',(4-phase*8).toFixed(2)+'deg');
 stage.style.setProperty('--ex-rz',(1.5-phase*3).toFixed(2)+'deg');
 stage.style.setProperty('--ex-y',((.5-phase)*(mobile.matches?16:25)).toFixed(1)+'px');
 stage.style.setProperty('--ex-scale',(.96+Math.sin(phase*Math.PI)*.04).toFixed(4));
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(paint)}}
function configure(){
 document.body.classList.toggle('ex-live',!staticMode());
 if(staticMode()){
  scenes.forEach(scene=>{scene.hidden=false;scene.removeAttribute('aria-hidden');scene.querySelectorAll('.ex-name,.ex-image-button').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel()))});
  selected=-1;
 }else schedule();
}
function goToProject(index){
 const target=(index+scenes.length)%scenes.length;
 if(staticMode()){scenes[target].scrollIntoView({block:'start',behavior:'instant'});return}
 const {box,top,distance}=measure();
 const destination=scrollY+box.top-top+distance*((target+.48)/scenes.length);
 window.scrollTo({top:destination,behavior:'instant'});
 setScene(target);
 schedule();
}
if(stage&&theatre&&scenes.length){
 nav.forEach(button=>button.addEventListener('click',()=>goToProject(Number(button.dataset.exNav))));
 document.querySelectorAll('[data-ex-jump]').forEach(button=>button.addEventListener('click',()=>goToProject(Number(button.dataset.exJump))));
 stage.querySelector('[data-ex-prev]').addEventListener('click',()=>goToProject(selected-1));
 stage.querySelector('[data-ex-next]').addEventListener('click',()=>goToProject(selected+1));
 stage.addEventListener('pointermove',event=>{
  if(staticMode()||!fine.matches)return;
  const box=stage.getBoundingClientRect();
  stage.style.setProperty('--ex-pointer-ry',(((event.clientX-box.left)/box.width-.5)*5).toFixed(2)+'deg');
  stage.style.setProperty('--ex-pointer-rx',(((event.clientY-box.top)/box.height-.5)*-3).toFixed(2)+'deg');
 });
 stage.addEventListener('pointerleave',()=>{stage.style.removeProperty('--ex-pointer-ry');stage.style.removeProperty('--ex-pointer-rx')});
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule,{once:true});
 reduced.addEventListener('change',configure);
 compact.addEventListener('change',configure);
 configure();
}
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
