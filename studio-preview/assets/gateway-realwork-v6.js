/* Aptitud Labs / V6 — real-work gateways.
 * Once-only image reveals, no motion loops and no interference with links.
 */
(()=>{
 'use strict';
 const cards=Array.from(document.querySelectorAll('.v6-realwork-card'));
 if(!cards.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!('IntersectionObserver' in window))return;
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   observer.unobserve(entry.target);
   const card=entry.target;
   const images=Array.from(card.querySelectorAll('img'));
   images.forEach((image,index)=>{
    if(typeof image.animate!=='function')return;
    image.animate([
     {opacity:.45,transform:'translateY(18px) scale(1.045)',filter:'saturate(.75) blur(3px)'},
     {opacity:1,transform:'translateY(0) scale(1)',filter:'saturate(1.08) blur(0)'}
    ],{
     duration:720+index*160,
     delay:index*95,
     easing:'cubic-bezier(.16,1,.3,1)'
    });
   });
  });
 },{rootMargin:'0px 0px -18px 0px',threshold:.2});
 cards.forEach(card=>observer.observe(card));
})();
