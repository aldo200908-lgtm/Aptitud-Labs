/* Aptitud Labs / Atelier: only necessary interactions.
   All presentation remains legible with JS disabled. */
(()=>{
 'use strict';
 const $=(sel,root=document)=>root.querySelector(sel);
 const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
 const menu=$('#al-mobile-menu'),toggle=$('#al-menu-toggle');
 function setMenu(open){
  if(!menu||!toggle)return;
  menu.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
  if(open)menu.querySelector('a')?.focus();
  else if(menu.contains(document.activeElement))toggle.focus();
 }
 toggle?.addEventListener('click',()=>setMenu(menu.hidden));
 menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden)setMenu(false)});
 document.addEventListener('click',e=>{
  if(menu&&!menu.hidden&&!menu.contains(e.target)&&!toggle?.contains(e.target))setMenu(false);
 });
 // Portfolio projects are separate from the homepage.
 const filters=$$('[data-al-filter]');
 const work=$$('[data-al-kind]');
 const status=$('#al-filter-status');
 function filter(kind){
  const v=['todos','web','herramientas'].includes(kind)?kind:'todos';
  let count=0;
  for(const card of work){
   card.hidden=v!=='todos'&&card.dataset.alKind!==v;
   if(!card.hidden)count++;
  }
  filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.alFilter===v)));
  if(status)status.textContent=count+' proyectos disponibles.';
 }
 filters.forEach(b=>b.addEventListener('click',()=>filter(b.dataset.alFilter)));
 // Quote steps are mutually exclusive: one useful route at a time.
 const choices=$$('[data-al-choice]');
 const panels=$$('[data-al-panel]');
 function choose(target,focus=false){
  const current=['consulta','cotizador','contratar'].includes(target)?target:'consulta';
  choices.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.alChoice===current)));
  panels.forEach(el=>el.hidden=el.dataset.alPanel!==current);
  if(focus){
   const selected=panels.find(el=>el.dataset.alPanel===current);
   const heading=selected?.querySelector('h2');
   heading?.setAttribute('tabindex','-1');
   heading?.focus({preventScroll:true});
   selected?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
 }
 choices.forEach(el=>el.addEventListener('click',()=>choose(el.dataset.alChoice,true)));
 function currentFromUrl(){
  const hash=window.location.hash.slice(1);
  const params=new URLSearchParams(window.location.search);
  if(['consulta','cotizador','contratar'].includes(hash))return hash;
  if(params.has('plan'))return 'cotizador';
  return 'consulta';
 }
 if(panels.length){
  choose(currentFromUrl());
  window.addEventListener('hashchange',()=>choose(currentFromUrl()));
 }

})();
