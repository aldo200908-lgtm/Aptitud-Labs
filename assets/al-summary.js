/* Aptitud Labs — efectos de entrada para resúmenes de portada. */
(function(){
"use strict";
const sections=[...document.querySelectorAll(".al-summary")];
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
for(const section of sections){
 if(section.dataset.alSummaryReady==="true")continue;
 section.dataset.alSummaryReady="true";
 const reveals=[...section.querySelectorAll(".al-summary-reveal")];
 const cards=[...section.querySelectorAll(".al-summary-card")];
 if(reduced||!("IntersectionObserver" in window)){
  reveals.forEach(el=>el.classList.add("al-summary-visible"));
  cards.forEach(el=>el.classList.add("al-summary-done"));
  continue;
 }
 cards.forEach(card=>card.addEventListener("transitionend",event=>{
  if(event.target===card&&event.propertyName==="opacity")card.classList.add("al-summary-done");
 }));
 section.classList.add("al-summary-enhanced");
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   entry.target.classList.add("al-summary-visible");
   observer.unobserve(entry.target);
  });
 },{threshold:.08,rootMargin:"0px 0px 40px 0px"});
 reveals.forEach(el=>observer.observe(el));
}
})();
