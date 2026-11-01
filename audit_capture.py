#!/usr/bin/env python3
"""Screenshot-first independent full-site UX, visual, accessibility and technical audit.
Runs against the exact public gh-pages branch snapshot, served locally under /Aptitud-Labs/.
No forms submitted. All evidence belongs to an isolated audit branch, never gh-pages.
"""
from __future__ import annotations
import base64, json, os, re, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

ROOT = Path.cwd()
OUT = ROOT / "audit-evidence"
OUT.mkdir(exist_ok=True)
SCREENS = OUT / "screens"
SCREENS.mkdir(exist_ok=True)
PAGES = [
  ("01-inicio", ""),
  ("02-portafolio", "proyectos/"),
  ("03-servicios", "servicios/"),
  ("04-planes", "planes/"),
  ("05-nfc", "nfc-qr/"),
  ("06-cotizar", "cotizar/"),
  ("07-puno-seo", "diseno-web-puno/"),
  ("08-privacidad", "privacidad/"),
  ("09-juliaca-seo", "diseno-web-juliaca/"),
  ("10-soluciones", "soluciones/"),
]
TEMP = ROOT / "audit-served"
TEMP.mkdir(exist_ok=True)
link = TEMP / "Aptitud-Labs"
if not link.exists(): link.symlink_to(ROOT, target_is_directory=True)
class Quiet(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(TEMP),**kwargs)
    def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE="http://127.0.0.1:%d/Aptitud-Labs/"%server.server_port
options=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1"):
    options.add_argument(flag)
options.set_capability("goog:loggingPrefs",{"browser":"ALL"})
driver=webdriver.Chrome(options=options)
driver.set_page_load_timeout(35)
def capture(label,full=False,extra_clip=None):
    spec={"format":"jpeg","quality":64,"fromSurface":True,"captureBeyondViewport":True}
    if full:
        size=driver.execute_cdp_cmd("Page.getLayoutMetrics",{})["cssContentSize"]
        cw=min(int(size["width"]),1400)
        ch=min(int(size["height"]),8400)
        spec["clip"]={"x":0,"y":0,"width":cw,"height":ch,"scale":1}
    if extra_clip: spec["clip"]=extra_clip
    data=driver.execute_cdp_cmd("Page.captureScreenshot",spec)["data"]
    path=SCREENS/(label+".jpg");path.write_bytes(base64.b64decode(data))
    return {"path":str(path.relative_to(ROOT)),"bytes":path.stat().st_size}
def metrics():
    return driver.execute_script(r"""
    const root=document.documentElement,body=document.body,contentW=root.clientWidth;
    const isVisible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
    const links=[...document.querySelectorAll('a[href]')].map(x=>({label:(x.innerText||x.getAttribute('aria-label')||'').trim().slice(0,95),href:x.getAttribute('href'),target:x.getAttribute('target')||''}));
    const sections=[...document.querySelectorAll('main section,section')].filter(isVisible).map(x=>{const c=getComputedStyle(x),r=x.getBoundingClientRect();return {id:x.id,cls:x.className?.toString()?.slice(0,95),height:Math.round(r.height),bg:c.backgroundColor,padding:c.paddingTop,firstHeading:x.querySelector('h1,h2,h3')?.textContent?.trim().slice(0,100)||''}});
    const images=[...document.images].map(x=>({src:x.getAttribute('src'),alt:x.getAttribute('alt'),loaded:x.complete&&x.naturalWidth>0,w:x.naturalWidth,h:x.naturalHeight}));
    const overflows=[...document.querySelectorAll('body *')].filter(x=>{
      if(!isVisible(x))return false;
      const r=x.getBoundingClientRect(),style=getComputedStyle(x);
      return (r.left<-10||r.right>contentW+10) && style.position!=='fixed' && r.width>20;
    }).slice(0,20).map(x=>({tag:x.tagName,cls:(x.className||'').toString().slice(0,55),left:Math.round(x.getBoundingClientRect().left),right:Math.round(x.getBoundingClientRect().right)}));
    const unlabeledBtns=[...document.querySelectorAll('button,input[type=submit]')].filter(isVisible).filter(x=>!(x.innerText||x.value||x.getAttribute('aria-label')||x.getAttribute('title')||'').trim()).map(x=>x.outerHTML.slice(0,150));
    const inputFields=[...document.querySelectorAll('input,textarea,select')].filter(isVisible).map(x=>({name:x.name,type:x.type,required:x.required,label:x.labels?.[0]?.textContent.trim().slice(0,70)||'',placeholder:x.getAttribute('placeholder')||''}));
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const duplicateIDs=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
    const h=[...document.querySelectorAll('h1,h2,h3')].filter(isVisible).map(x=>({level:x.tagName,text:x.textContent.trim().slice(0,130)})).slice(0,55);
    const poorLinks=links.filter(x=>!x.label&&x.href&&!x.href.startsWith('#')).slice(0,20);
    const styles=[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.getAttribute('href'));
    const scripts=[...document.querySelectorAll('script[src]')].map(x=>x.getAttribute('src'));
    const contact=document.querySelector('#contacto');
    const contactPanel=contact?.querySelector('.contact-panel');
    const hero=document.querySelector('.home-studio-hero,.v3-portfolio-hero,.page-hero');
    return {
      title:document.title,meta:document.querySelector('meta[name=description]')?.content,
      canonical:document.querySelector('link[rel=canonical]')?.href||null,
      robots:document.querySelector('meta[name=robots]')?.content||null,
      h1Count:document.querySelectorAll('h1').length,headings:h,
      totalHeight:root.scrollHeight,clientWidth:contentW,scrollWidth:root.scrollWidth,
      sections,links,images,overflows,unlabeledBtns,inputFields,duplicateIDs,poorLinks,
      styles,scripts,htmlLang:root.lang,
      theme:body.dataset.theme||'',background:getComputedStyle(body).backgroundColor,
      heroBg:hero?getComputedStyle(hero).backgroundColor:null,
      contactBg:contact?getComputedStyle(contact).backgroundColor:null,
      contactPanelBg:contactPanel?getComputedStyle(contactPanel).backgroundColor:null,
      contactFormBg:contact?.querySelector('form')?getComputedStyle(contact.querySelector('form')).backgroundColor:null,
      prefersReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
      missingAlt:images.filter(x=>x.alt===null).length,
      menuButton:!!document.querySelector('#resource-menu-toggle'),
      fullInputs:document.querySelectorAll('input,select,textarea').length
    };
    """)
results={"sourceBranch":"gh-pages","browser":"Chromium headless","scope":"public GitHub Pages static snapshot","pages":[],"screens":[]}
try:
    driver.set_window_size(390,844)
    for label,relative in PAGES:
        url=BASE+relative
        print("AUDIT",label,flush=True)
        try:
            driver.get(url)
            time.sleep(.5)
            driver.execute_script("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)")
            m=metrics()
            m.update({"label":label,"route":"/Aptitud-Labs/"+relative})
            if label in ("01-inicio","02-portafolio","03-servicios","04-planes","05-nfc","06-cotizar"):
                results["screens"].append(capture(label+"-mobile-top"))
                # Scroll exactly as a visitor would so lazy photos, CSS reveals and
                # IntersectionObserver motion actually enter the viewport.
                for ypos in range(0,m["totalHeight"],570):
                    driver.execute_script("window.scrollTo(0,arguments[0])",ypos)
                    time.sleep(.065)
                driver.execute_script("window.scrollTo(0,0)")
                time.sleep(.75)
                m["afterScroll"]=metrics()
                results["screens"].append(capture(label+"-mobile-full",full=True))
                if m["totalHeight"]>8400:
                    height=min(2600,m["totalHeight"]-8400)
                    results["screens"].append(capture(label+"-mobile-bottom",extra_clip={"x":0,"y":m["totalHeight"]-height,"width":min(m["clientWidth"],390),"height":height,"scale":1}))
            if label=="01-inicio" and m["menuButton"]:
                el=driver.find_element(By.ID,"resource-menu-toggle")
                el.click();time.sleep(.2)
                m["menuOpened"]=driver.execute_script("return document.getElementById('resource-menu-toggle').getAttribute('aria-expanded')")
                results["screens"].append(capture(label+"-menu-open"))
                el.click()
            if label=="06-cotizar":
                m["formValidationPresent"]=bool(driver.execute_script("return document.querySelector('form input[required],form select[required]')"))
            try:
                m["browserLogs"]=[x["message"][:240] for x in driver.get_log("browser") if x["level"] in ("SEVERE","WARNING")][:25]
            except Exception:
                m["browserLogs"]=[]
            results["pages"].append(m)
            print("DONE",label,"height",m["totalHeight"],"CSS",len(m["styles"]),"broken",sum(not x["loaded"] for x in m["images"]),"overflow",m["scrollWidth"]-m["clientWidth"],flush=True)
        except Exception as e:
            results["pages"].append({"label":label,"error":str(e)[:900]})
            print("FAILED",label,str(e)[:200],flush=True)
    for label,relative in [("11-inicio-desktop",""),("12-portafolio-desktop","proyectos/")]:
        driver.set_window_size(1280,900)
        driver.get(BASE+relative);time.sleep(.6)
        m=metrics();m.update({"label":label,"route":"/Aptitud-Labs/"+relative})
        results["screens"].append(capture(label+"-top"))
        for ypos in range(0,m["totalHeight"],720):
            driver.execute_script("window.scrollTo(0,arguments[0])",ypos)
            time.sleep(.07)
        driver.execute_script("window.scrollTo(0,0)")
        time.sleep(.8)
        m["afterScroll"]=metrics()
        results["screens"].append(capture(label+"-full",full=True))
        results["pages"].append(m)
finally:
    driver.quit()
    server.shutdown()
    server.server_close()
(OUT/"report.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
print("AUDIT REPORT",str(OUT/"report.json"),"captures",len(results["screens"]),flush=True)
