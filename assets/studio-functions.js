/* Aptitud Labs / Studio Next.
   Only task-driven interaction: unobtrusive reveal, project filtering,
   quote path selection. Legacy pricing, NFC and WhatsApp logic remain intact.
*/
(()=>{
 'use strict';
 document.documentElement.classList.add('js-enhanced');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 // Portfolio filtering: all seven demos remain reachable.
 const filters=[...document.querySelectorAll('[data-next-filter]')];
 const projects=[...document.querySelectorAll('[data-next-kind]')];
 const filterStatus=document.getElementById('next-filter-status');
 function filter(kind){
  let count=0;
  projects.forEach(p=>{
   p.hidden=!(kind==='todos'||p.dataset.nextKind===kind);
   if(!p.hidden)count++;
  });
  filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.nextFilter===kind)));
  if(filterStatus)filterStatus.textContent=count+' proyectos disponibles.';
 }
 filters.forEach(b=>b.addEventListener('click',()=>filter(b.dataset.nextFilter)));
 // Multi-route quoting: show only one process, preserve the original modules.
 const tabs=[...document.querySelectorAll('[data-quote-tab]')];
 const panels=[...document.querySelectorAll('[data-quote-panel]')];
 const valid=new Set(['consulta','cotizador','contratar']);
 function openQuote(route,scroll=false){
  if(!valid.has(route)||!tabs.length)return;
  tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.quoteTab===route)));
  panels.forEach(panel=>panel.hidden=panel.dataset.quotePanel!==route);
  if(scroll){
   const active=document.getElementById(route);
   active?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
  }
 }
 function chooseFromLocation(){
  const hash=location.hash.replace('#','');
  const plan=new URLSearchParams(location.search).has('plan');
  openQuote(valid.has(hash)?hash:(plan?'cotizador':'consulta'));
 }
 tabs.forEach(b=>b.addEventListener('click',()=>{
  const route=b.dataset.quoteTab;
  openQuote(route,true);
  if(history.replaceState)history.replaceState(null,'','#'+route);
 }));
 document.querySelectorAll('.quote-panels a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
  const route=a.getAttribute('href').slice(1);
  if(valid.has(route))openQuote(route);
 }));
 window.addEventListener('hashchange',chooseFromLocation);
 window.addEventListener('aptitud:quote-to-brief',()=>{
  // If a visitor sends a quote to the hiring wizard, automatically expose it.
  // The old calculator emits this event only for the formal hand-off.
  openQuote('contratar');
 });
 chooseFromLocation();
 // Graceful fallback for broken image files: no stock imagery or fake demos.
 document.querySelectorAll('.hero-art-photo,.feature-media img,.project-media img,.service-row-photo img').forEach(img=>{
  img.addEventListener('error',()=>{img.classList.add('image-unavailable');img.alt='Imagen no disponible';},{once:true});
 });
 document.querySelectorAll('[data-year]').forEach(y=>y.textContent=String(new Date().getFullYear()));
})();
