import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/site-shell.js',import.meta.url),'utf8');
function load({legacy=null,obsidian=null,atelier=false,deny=false}={}){
 const listeners={},attrs={},root={dataset:{}},body={dataset:{},classList:{contains:v=>atelier&&v==='obsidian-ice'}},meta={content:''};
 const button={textContent:'',setAttribute:(k,v)=>attrs[k]=v,addEventListener:(e,fn)=>listeners[e]=fn};
 const values={'aptitud-portfolio-theme':legacy,'aptitud-obsidian-theme-v4':obsidian};
 const storage={
  getItem(k){if(deny)throw Error('Blocked');return values[k]??null;},
  setItem(k,v){if(deny)throw Error('Blocked');values[k]=v;}
 };
 runInNewContext(source,{document:{documentElement:root,body,getElementById:()=>button,querySelector:()=>meta},localStorage:storage});
 return {root,body,button,attrs,values,meta,click:()=>listeners.click()};
}
for(const saved of ['light','dark',null]){
 const x=load({legacy:saved}),expected=saved==='dark'?'dark':'light';
 assert.equal(x.root.dataset.theme,expected);assert.equal(x.body.dataset.theme,expected);
 assert.equal(x.attrs['aria-pressed'],String(expected==='dark'));
 x.click();assert.equal(x.root.dataset.theme,expected==='dark'?'light':'dark');
 assert.equal(x.values['aptitud-portfolio-theme'],x.root.dataset.theme);
}
for(const old of ['light','dark',null]){
 const x=load({legacy:old,atelier:true});
 assert.equal(x.root.dataset.theme,'dark','Obsidian ignores legacy light preference');
 assert.equal(x.meta.content,'#0a1016','Obsidian uses matte dark browser chrome');
 x.click();
 assert.equal(x.root.dataset.theme,'light');
 assert.equal(x.values['aptitud-obsidian-theme-v4'],'light');
 assert.equal(x.values['aptitud-portfolio-theme'],old,'Obsidian never overwrites legacy theme');
}
for(const chosen of ['light','dark']){
 const x=load({legacy:'dark',obsidian:chosen,atelier:true});
 assert.equal(x.root.dataset.theme,chosen,'explicit V4 preference is preserved');
}
const blocked=load({atelier:true,deny:true});
assert.equal(blocked.root.dataset.theme,'dark');
blocked.click();assert.equal(blocked.root.dataset.theme,'light');
assert.equal(blocked.attrs['aria-label'],'Activar modo oscuro');
console.log('Theme: separate V4 storage, legacy preference migration, toggle and blocked storage pass.');
