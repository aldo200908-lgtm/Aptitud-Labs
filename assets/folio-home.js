/* Progressive enhancement: no network calls or message sending. */
(function(){
 'use strict';
 const body=document.body;
 if(!body.classList.contains('al-folio-home'))return;
 const toggle=document.getElementById('folio-theme');
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 function applyTheme(theme){
  body.dataset.theme=theme;
  if(toggle){toggle.textContent=theme==='dark'?'Claro':'Oscuro';toggle.setAttribute('aria-label',theme==='dark'?'Activar modo claro':'Activar modo oscuro');toggle.setAttribute('aria-pressed',String(theme==='dark'))}
  if(themeMeta)themeMeta.content=theme==='dark'?'#11141a':'#fcfcfd';
 }
 let saved=null;
 try{saved=localStorage.getItem('aptitud-portfolio-theme')}catch{}
 applyTheme(saved==='dark'?'dark':'light');
 toggle?.addEventListener('click',function(){const next=body.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('aptitud-portfolio-theme',next)}catch{}});
 const navLinks=[...document.querySelectorAll('.desktop-links a[href^="#"]')];
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;navLinks.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}},{rootMargin:'-20% 0px -60% 0px',threshold:0});
  navLinks.forEach(a=>{const el=document.getElementById(a.hash.slice(1));if(el)observer.observe(el)});
 }
 const role=document.getElementById('folio-role');
 if(role&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const roles=['Diseño y desarrollo web','Aplicaciones y sistemas','Automatización e IA'];let index=0,step=roles[0].length,deleting=true;let timer;
  function tick(){const text=roles[index];step+=deleting?-1:1;role.textContent=text.slice(0,step);let delay=deleting?35:65;if(step===0){deleting=false;index=(index+1)%roles.length;delay=300}else if(step===text.length&&!deleting){deleting=true;delay=2500}timer=setTimeout(tick,delay)}
  timer=setTimeout(tick,2800);
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)timer=setTimeout(tick,500)});
 }
})();
