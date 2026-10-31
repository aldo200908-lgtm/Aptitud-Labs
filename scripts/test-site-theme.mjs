import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/site-shell.js',import.meta.url),'utf8');
function load(saved,deny=false){
 const listeners={},attrs={},root={dataset:{}},body={dataset:{}},meta={content:''};
 const button={textContent:'',setAttribute:(k,v)=>attrs[k]=v,addEventListener:(e,fn)=>listeners[e]=fn};
 const storage={getItem(){if(deny)throw Error('Blocked');return saved},setItem(k,v){if(deny)throw Error('Blocked');storage.saved=v}};
 runInNewContext(source,{document:{documentElement:root,body,getElementById:()=>button,querySelector:()=>meta},localStorage:storage});
 return {root,body,button,attrs,storage,click:()=>listeners.click()};
}
for(const saved of ['light','dark',null]){
 const x=load(saved);const expected=saved==='dark'?'dark':'light';
 assert.equal(x.root.dataset.theme,expected);assert.equal(x.body.dataset.theme,expected);
 assert.equal(x.attrs['aria-pressed'],String(expected==='dark'));
 x.click();assert.equal(x.root.dataset.theme,expected==='dark'?'light':'dark');
 assert.equal(x.storage.saved,x.root.dataset.theme);assert.equal(x.body.dataset.theme,x.root.dataset.theme);
}
const blocked=load(null,true);blocked.click();assert.equal(blocked.body.dataset.theme,'dark');
assert.equal(blocked.attrs['aria-label'],'Activar modo claro');
console.log('Theme: saved preferences, cross-page state, toggles and blocked storage pass.');
