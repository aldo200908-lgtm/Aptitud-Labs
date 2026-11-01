/* Shared theme preference. Obsidian Ice V4 has its own theme key:
 * historic "light" selections from the previous look must not carry over.
 * From V4 onward the visitor's new explicit preference is respected.
 */
(()=>{'use strict';
 const button=document.getElementById('site-theme');
 const root=document.documentElement,body=document.body;
 const atelier=!!body?.classList?.contains('obsidian-ice');
 const storageKey=atelier?'aptitud-obsidian-theme-v4':'aptitud-portfolio-theme';
 function apply(theme){
  root.dataset.theme=theme;body.dataset.theme=theme;
  if(button){
   button.textContent=theme==='dark'?'Claro':'Oscuro';
   button.setAttribute('aria-label',theme==='dark'?'Activar modo claro':'Activar modo oscuro');
   button.setAttribute('aria-pressed',String(theme==='dark'));
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=theme==='dark'?(atelier?'#0a1016':'#111923'):'#eff5f8';
 }
 let saved;
 try{saved=localStorage.getItem(storageKey)}catch{}
 apply(atelier?(saved==='light'?'light':'dark'):(saved==='dark'?'dark':'light'));
 button?.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  apply(next);
  try{localStorage.setItem(storageKey,next)}catch{}
 });
})();
