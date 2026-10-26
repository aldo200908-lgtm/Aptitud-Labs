/* Aptitud Labs — navegación y contacto. Sin analytics invasivos ni envíos automáticos. */
(function(){
'use strict';
const menu=document.getElementById('resource-menu'),toggle=document.getElementById('resource-menu-toggle'),close=document.getElementById('resource-menu-close');
if(menu&&toggle){
  function setMenu(open,restore){
    menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
    if(open){(close||menu.querySelector('a'))?.focus()}else if(restore){toggle.focus()}
  }
  toggle.addEventListener('click',()=>setMenu(menu.hidden,false));
  close?.addEventListener('click',()=>setMenu(false,true));
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false,false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();setMenu(false,true)}});
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))setMenu(false,false)});
}
const form=document.getElementById('briefForm');
if(form){
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const clean=(value,max=1500)=>String(value||'').trim().replace(/\s+/g,' ').slice(0,max);
    const nombre=clean(data.get('nombre'),90);
    const correo=clean(data.get('correo'),150)||'No indicado';
    const servicio=clean(data.get('servicio'),100);
    const presupuesto=clean(data.get('presupuesto'),80)||'Por definir';
    const detalle=clean(data.get('detalle'));
    const mensaje=['Hola, Aptitud Labs. Quisiera conversar sobre un proyecto.','Nombre: '+nombre,'Correo: '+correo,'Servicio: '+servicio,'Presupuesto aproximado: '+presupuesto,'Mi idea: '+detalle].join('\n');
    const channel=event.submitter?.dataset.contactChannel||'whatsapp';
    const url=channel==='email'?'mailto:aptitudlabs.studio@gmail.com?subject='+encodeURIComponent('Proyecto web - '+nombre)+'&body='+encodeURIComponent(mensaje):'https://wa.me/51937367296?text='+encodeURIComponent(mensaje);
    const status=document.getElementById('briefResult');
    if(status)status.textContent=channel==='email'?'Se abrirá tu aplicación de correo con el mensaje preparado. Revísalo y confirma el envío.':'Se abrirá WhatsApp con un mensaje preparado. Revísalo y confirma el envío. No enviamos mensajes automáticamente.';
    window.open(url,'_blank','noopener,noreferrer');
  });
}
const year=document.querySelector('[data-year]');
if(year)year.textContent=String(new Date().getFullYear());
})();
