/* Shared theme preference. Contact data is never stored here. */
(()=>{'use strict';
 const button=document.getElementById('site-theme');
 const root=document.documentElement,body=document.body;
 function apply(theme){root.dataset.theme=theme;body.dataset.theme=theme;
  if(button){button.textContent=theme==='dark'?'Claro':'Oscuro';button.setAttribute('aria-label',theme==='dark'?'Activar modo claro':'Activar modo oscuro');button.setAttribute('aria-pressed',String(theme==='dark'))}
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?(body?.classList?.contains('obsidian-ice')?'#0a1016':'#111923'):'#f7fafc';
 }
 let saved;try{saved=localStorage.getItem('aptitud-portfolio-theme')}catch{}
 apply(saved==='dark'||(saved!=='light'&&body?.classList?.contains('obsidian-ice'))?'dark':'light');
 button?.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';apply(next);try{localStorage.setItem('aptitud-portfolio-theme',next)}catch{}});
})();
