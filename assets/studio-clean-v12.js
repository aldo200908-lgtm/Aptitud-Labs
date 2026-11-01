/* Aptitud Labs / clean interaction layer. No scroll jacking, JS image carousels or artificial counters. */
(()=>{'use strict';
 const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
 const menu=$('#resource-menu'),btn=$('#resource-menu-toggle');
 function setMenu(open,restore=false){if(!menu||!btn)return;menu.hidden=!open;btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');if(open)menu.querySelector('a')?.focus();else if(restore)btn.focus()}
 btn?.addEventListener('click',()=>setMenu(menu.hidden));
 menu?.querySelectorAll('a').forEach(x=>x.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden)setMenu(false,true)});
 document.addEventListener('click',e=>{if(menu&&!menu.hidden&&!menu.contains(e.target)&&!btn?.contains(e.target))setMenu(false)});
 const year=$('[data-year]');if(year)year.textContent=new Date().getFullYear();
 const filter=$('[data-gallery-filters]');
 if(filter){const cards=$$('[data-project-kind]'),status=$('#gallery-status');
  $$('button[data-filter]',filter).forEach(button=>button.addEventListener('click',()=>{
   const choice=button.dataset.filter;let count=0;
   cards.forEach(card=>{card.hidden=choice!=='todos'&&card.dataset.projectKind!==choice;if(!card.hidden)count++});
   $$('button[data-filter]',filter).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   if(status)status.textContent=count+' demostraciones disponibles.';
  }));
 }
 const quoteSwitcher=$('[data-quote-switcher]');
 if(quoteSwitcher){const paths=$$('[data-quote-path]'),buttons=$$('button[data-show-quote]',quoteSwitcher);
  function activate(choice,fromClick=false){
   if(!paths.some(p=>p.dataset.quotePath===choice))choice='consulta';
   paths.forEach(p=>p.hidden=p.dataset.quotePath!==choice);
   buttons.forEach(b=>{const active=b.dataset.showQuote===choice;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
   if(fromClick){history.replaceState(null,'','#'+(choice==='estimador'?'cotizador':choice==='solicitud'?'contratar':'consulta'));const dest=$('[data-quote-path="'+choice+'"]');dest?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  }
  buttons.forEach(b=>b.addEventListener('click',()=>activate(b.dataset.showQuote,true)));
  function fromHash(){return location.hash==='#cotizador'?'estimador':location.hash==='#contratar'?'solicitud':'consulta'}
  activate(fromHash());
  window.addEventListener('hashchange',()=>activate(fromHash()));
  $$('a[href="#cotizador"],a[href="#contratar"],a[href="#consulta"]').forEach(a=>a.addEventListener('click',()=>{
   const hash=a.getAttribute('href');activate(hash==='#cotizador'?'estimador':hash==='#contratar'?'solicitud':'consulta');
  }));
 }
 // The actual contact form stays on /cotizar/; it never submits to a server.
 const form=$('#briefForm');
 form?.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const d=new FormData(form),clean=(v,n=1500)=>String(v||'').trim().replace(/\s+/g,' ').slice(0,n);
  const name=clean(d.get('nombre'),90),service=clean(d.get('servicio'),100),description=clean(d.get('detalle')),mail=clean(d.get('correo'),150);
  const message=['Hola, Aptitud Labs. Quisiera consultar sobre un proyecto.','Nombre: '+name,'Servicio: '+service,'Idea: '+description,...(mail?['Correo: '+mail]:[])].join('\n');
  const channel=e.submitter?.dataset.contactChannel||'whatsapp';
  const url=channel==='email'?'mailto:aptitudlabs.studio@gmail.com?subject='+encodeURIComponent('Consulta de '+name)+'&body='+encodeURIComponent(message):'https://wa.me/51937367296?text='+encodeURIComponent(message);
  $('#briefResult').textContent=channel==='email'?'Tu correo está preparado. Revísalo antes de enviarlo.':'Tu mensaje de WhatsApp está preparado. Revísalo antes de enviarlo.';
  window.location.href=url;
 });
 // Trigger progressive motion only when visible. Static content remains available with no JS.
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduce&&'IntersectionObserver' in window){
  const els=$$('.reveal');const obs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');obs.unobserve(entry.target)})},{threshold:.08,rootMargin:'0px 0px -18px 0px'});
  document.body.classList.add('motion-ready');els.forEach(el=>obs.observe(el));
 }
})();
