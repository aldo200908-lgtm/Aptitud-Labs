/* Aptitud Labs — one owner for scroll and 3D. Native scrolling, no dependencies. */
(()=>{
'use strict';
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-height: 650px) and (max-width: 620px)');
const staticScenes=()=>reduced.matches||compact.matches;
const cinema=document.querySelector('.service-cinema');
const copies=[...document.querySelectorAll('[data-scene]')];
const art=[...document.querySelectorAll('[data-scene-art]')];
const controls=[...document.querySelectorAll('[data-scene-button]')];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let pending=false,selected=-1;
function selectScene(index){
 selected=index;
 [...copies,...art].forEach(el=>{
  const active=Number(el.dataset.scene??el.dataset.sceneArt)===index;
  el.hidden=!active;
  el.setAttribute('aria-hidden',String(!active));
  // No queued transitions, clones, blur or retained outgoing text.
 });
 controls.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.sceneButton)===index)));
 cinema?.style.setProperty('--scene-index',index);
}
function paintScroll(){
 pending=false;
 if(!cinema||staticScenes())return;
 const box=cinema.getBoundingClientRect();
 const sticky=cinema.querySelector('.cinema-sticky');
 const top=parseFloat(getComputedStyle(sticky).top)||0;
 const distance=Math.max(1,box.height-sticky.offsetHeight);
 const progress=clamp((top-box.top)/distance,0,1);
 const index=Math.min(2,Math.floor(progress*3));
 if(index!==selected)selectScene(index);
 const visual=cinema.querySelector('.cinema-visual');
 if(box.bottom>0&&box.top<innerHeight)visual?.style.setProperty('transform',`rotateY(${(progress-.5)*9}deg)`);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(paintScroll)}}
function configureMotion(){
 root.classList.toggle('motion-enabled',!staticScenes());
 if(staticScenes()){
  [...copies,...art].forEach(el=>{el.hidden=false;el.removeAttribute('aria-hidden')});
  document.querySelectorAll('.is-pending').forEach(el=>el.classList.remove('is-pending'));
  selected=-1;
 }else if(cinema){selectScene(0);schedule()}
}
controls.forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.sceneButton);
 if(staticScenes()){copies[index]?.scrollIntoView({block:'center'});return}
 const sticky=cinema.querySelector('.cinema-sticky');
 const top=parseFloat(getComputedStyle(sticky).top)||0;
 const distance=Math.max(1,cinema.offsetHeight-sticky.offsetHeight);
 const y=scrollY+cinema.getBoundingClientRect().top-top+distance*((index+.5)/3);
 window.scrollTo({top:y,behavior:'instant'});
 selectScene(index);
}));
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
reduced.addEventListener('change',configureMotion);
compact.addEventListener('change',configureMotion);
configureMotion();
// Modest entrance animations. Content remains readable before JS and on errors.
if(!reduced.matches&&'IntersectionObserver' in window){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.remove('is-pending');io.unobserve(e.target)}
 }),{threshold:0,rootMargin:'0px 0px 40px 0px'});
 document.querySelectorAll('.motion-manifesto h2,.motion-process-grid>div,.work-door>div,.feature-card,.service-row-copy,.project-card,.price-card,.steps-grid>div').forEach(el=>{
  el.classList.add('motion-reveal');
  if(el.getBoundingClientRect().top>innerHeight)el.classList.add('is-pending');
  io.observe(el);
 });
}
// A real parametric trefoil surface, rendered locally without WebGL or downloads.
const canvas=document.getElementById('brand-sculpture');
if(!canvas)return;
const ctx=canvas.getContext('2d');
if(!ctx)return;
const stage=canvas.parentElement;
const N=120,M=12,TAU=Math.PI*2;
const points=[],normals=[];
const curve=t=>{const a=2+Math.cos(3*t);return [a*Math.cos(2*t),a*Math.sin(2*t),Math.sin(3*t)]};
const normalise=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(let i=0;i<N;i++){
 const t=i/N*TAU,c=curve(t),next=curve(t+.001),tangent=normalise(next.map((v,j)=>v-c[j]));
 const u=normalise(cross(tangent,[0,0,1])),v=cross(tangent,u);
 for(let j=0;j<M;j++){
  const a=j/M*TAU,n=u.map((x,k)=>x*Math.cos(a)+v[k]*Math.sin(a));
  points.push(c.map((x,k)=>x+n[k]*.39));normals.push(n);
 }
}
let width=0,height=0,visible=true,raf=0,lastTime=0;
function resize(){
 width=stage.clientWidth;height=stage.clientHeight;
 const dpr=Math.min(devicePixelRatio||1,1.6);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 draw(performance.now());
}
function draw(time){
 if(!width||!height)return;
 ctx.clearRect(0,0,width,height);
 const a=(reduced.matches?.65:time*.000065)+scrollY*.00016;
 const b=.52,c=-.38;
 const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
 function rotate(p){const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca,y=p[1]*cb-z*sb,zz=p[1]*sb+z*cb;return [x*cc-y*sc,x*sc+y*cc,zz]}
 const scale=Math.min(width,height)*.137;
 const rotated=points.map(rotate),rotNormals=normals.map(rotate);
 const projected=rotated.map(p=>{const perspective=9/(9-p[2]);return [width*.5+p[0]*scale*perspective,height*.48+p[1]*scale*perspective,p[2]]});
 const faces=[];
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){
  const ids=[i*M+j,((i+1)%N)*M+j,((i+1)%N)*M+(j+1)%M,i*M+(j+1)%M];
  faces.push({ids,z:ids.reduce((s,k)=>s+projected[k][2],0)/4});
 }
 faces.sort((a,b)=>a.z-b.z);
 for(const f of faces){
  const n=normalise(f.ids.reduce((s,k)=>s.map((x,j)=>x+rotNormals[k][j]),[0,0,0]));
  const diffuse=Math.max(0,n[0]*-.45+n[1]*-.55+n[2]*.7);
  const specular=Math.pow(Math.max(0,n[0]*-.25+n[1]*-.35+n[2]*.9),16);
  const tone=clamp(39+diffuse*138+specular*100,24,250);
  ctx.beginPath();f.ids.forEach((id,i)=>{const p=projected[id];if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1])});ctx.closePath();
  ctx.fillStyle=`rgb(${Math.round(tone*.94)} ${Math.round(tone*.98)} ${Math.round(Math.min(255,tone*1.04))})`;
  ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.65;ctx.stroke();
 }
 stage.classList.add('canvas-ready');
}
function loop(time){
 raf=0;
 if(!visible||document.hidden||reduced.matches)return;
 if(time-lastTime>32){draw(time);lastTime=time}
 raf=requestAnimationFrame(loop);
}
function start(){if(!raf&&visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(loop)}
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0}},{rootMargin:'80px'}).observe(stage);
if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else start()});
reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;draw(performance.now());start()});
resize();start();
})();
