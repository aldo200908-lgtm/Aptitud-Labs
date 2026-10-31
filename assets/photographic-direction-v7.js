/* V7 — no missing-image regression. The selected photographs are generated
 * concept imagery, and should never be mistaken for actual client photography.
 * Until the binary WebP files are uploaded into /assets/visuals, the existing
 * live project media remain usable rather than showing broken image icons.
 */
(()=>{
 'use strict';
 const candidates=document.querySelectorAll('.v7-card-photo,.v7-hero-photo');
 const ready=img=>{
  if(!img||!img.naturalWidth)return;
  const owner=img.closest('.v7-photographic-card,.v7-photographic-hero');
  owner?.classList.add('v7-photo-ready');
  if(owner?.dataset.v7Photo)owner.dataset.v7Photo='ready';
 };
 candidates.forEach(img=>{
  if(img.complete&&img.naturalWidth>0){ready(img);return;}
  if(img.complete&&!img.naturalWidth){img.hidden=true;return;}
  img.addEventListener('load',()=>ready(img),{once:true});
  img.addEventListener('error',()=>{img.hidden=true;}, {once:true});
 });
})();
