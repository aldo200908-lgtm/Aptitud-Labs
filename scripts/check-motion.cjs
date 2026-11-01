// Exercise the scroll controller under jumps/reversals and preference changes.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
let top=0;const listeners={},classes=new Set();
const make=(kind,i)=>({dataset:{[kind]:String(i)},hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,v){this[k]=v},scrollIntoView(){}});
const copies=[0,1,2].map(i=>make('scene',i)),art=[0,1,2].map(i=>make('sceneArt',i)),buttons=[0,1,2].map(i=>make('sceneButton',i));
const sticky={offsetHeight:724};const cinema={offsetHeight:2560,getBoundingClientRect:()=>({top,bottom:top+2560,height:2560}),querySelector:s=>s==='.cinema-sticky'?sticky:null,style:{setProperty(){}}};
const reduced={matches:false,addEventListener(k,f){this.change=f}},compact={matches:false,addEventListener(k,f){this.change=f}};
const sandbox={document:{documentElement:{classList:{toggle(k,v){v?classes.add(k):classes.delete(k)}}},querySelector:s=>s==='.service-cinema'?cinema:null,querySelectorAll:s=>s==='[data-scene]'?copies:s==='[data-scene-art]'?art:s==='[data-scene-button]'?buttons:[],getElementById:()=>null},window:{addEventListener(k,f){listeners[k]=f},scrollTo(){}},matchMedia:s=>s.includes('prefers')?reduced:compact,requestAnimationFrame:f=>f(),getComputedStyle:()=>({top:'76px'}),innerHeight:800,scrollY:0};
vm.runInNewContext(fs.readFileSync('assets/studio-motion.js','utf8'),sandbox);
for(const [progress,expected] of [[0,0],[.5,1],[1,2],[.03,0],[.99,2],[.4,1],[0,0]]){
 top=76-progress*(2560-724);listeners.scroll();
 assert.deepEqual(copies.filter(e=>!e.hidden).map(e=>Number(e.dataset.scene)),[expected]);
 assert.equal(art.filter(e=>!e.hidden).length,1);
 assert.equal(buttons.filter(e=>e.attrs['aria-pressed']==='true').length,1);
}
reduced.matches=true;reduced.change();assert(copies.every(e=>!e.hidden));assert(!classes.has('motion-enabled'));
reduced.matches=false;reduced.change();assert.equal(copies.filter(e=>!e.hidden).length,1);
compact.matches=true;compact.change();assert(copies.every(e=>!e.hidden));assert(!classes.has('motion-enabled'));
console.log('PASS: fast scroll/reverse, single active scene, reduced motion and short mobile fallback');
