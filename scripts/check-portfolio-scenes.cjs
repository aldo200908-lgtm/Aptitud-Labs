// Exercise native scroll jumps, reverse direction, touch navigation and reduced motion.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('assets/portfolio-experience.js','utf8');
let y=0;const frames=[],listeners={},styles={},classes=new Set();
const name={animate(){},getAnimations(){return[]}};
const scenes=Array.from({length:7},(_,i)=>({dataset:{tone:'project'+i,exScene:String(i)},hidden:i!==0,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},querySelectorAll(){return[name]},querySelector(){return name},scrollIntoView(){}}));
const nav=scenes.map((_,i)=>({dataset:{exNav:String(i)},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this[k]=f}}));
const control=()=>({addEventListener(k,f){this[k]=f}}),prev=control(),next=control(),counter={textContent:''};
const stage={dataset:{},offsetHeight:724,style:{setProperty(k,v){styles[k]=v},removeProperty(k){delete styles[k]}},querySelector:s=>s==='[data-ex-counter]'?counter:s==='[data-ex-prev]'?prev:next,addEventListener(){},getBoundingClientRect:()=>({left:0,top:76,width:1200,height:724})};
const theatre={offsetHeight:5520,getBoundingClientRect:()=>({top:76-y,bottom:5596-y})};
const reduced={matches:false,addEventListener(k,f){this.change=f}},compact={matches:false,addEventListener(k,f){this.change=f}},other={matches:false};
const document={body:{hasAttribute(){return true},classList:{toggle(k,v){v?classes.add(k):classes.delete(k)}}},querySelector:s=>s==='.ex-theatre'?theatre:stage,querySelectorAll:s=>s==='[data-ex-scene]'?scenes:s==='[data-ex-nav]'?nav:[],getElementById:()=>null};
const env={document,matchMedia:s=>s.includes('prefers')?reduced:s.includes('max-height')?compact:other,getComputedStyle:()=>({top:'76px'}),requestAnimationFrame:f=>frames.push(f),innerHeight:800,window:{addEventListener(k,f){listeners[k]=f},scrollTo(o){y=o.top;listeners.scroll?.()}}};
Object.defineProperty(env,'scrollY',{get:()=>y});vm.runInNewContext(code,env);
const flush=()=>{while(frames.length)frames.shift()()};flush();
for(const index of [0,6,1,5,2,4,3,0]){
 y=(5520-724)*((index+.48)/7);listeners.scroll();flush();
 assert.equal(scenes.filter(s=>!s.hidden).length,1);assert.equal(scenes[index].hidden,false);
 assert.equal(counter.textContent,(index+1)+' de 7');
 assert.equal(nav.filter(n=>n.attrs['aria-pressed']==='true').length,1);
}
next.click();flush();assert.equal(counter.textContent,'2 de 7');prev.click();flush();assert.equal(counter.textContent,'1 de 7');
reduced.matches=true;reduced.change();flush();assert(scenes.every(s=>!s.hidden));assert(!classes.has('ex-live'));
reduced.matches=false;reduced.change();flush();assert.equal(scenes.filter(s=>!s.hidden).length,1);
compact.matches=true;compact.change();flush();assert(scenes.every(s=>!s.hidden));
console.log('PASS: 7 scenes, fast jumps/reverse, next/previous, reduced motion and short-screen fallback');
