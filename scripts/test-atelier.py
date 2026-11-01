#!/usr/bin/env python3
"""Atelier reconstruction: mobile/desktop screenshots and functional smoke tests.
Serves exact GitHub Pages output at its real /Aptitud-Labs/ path. No messages sent.
"""
from __future__ import annotations
import base64, json, os, tempfile, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

SITE=Path.cwd()/"_site"
OUT=Path.cwd()/"atelier-evidence"
OUT.mkdir(exist_ok=True)
(OUT/"screens").mkdir(exist_ok=True)
temp=tempfile.TemporaryDirectory()
(Path(temp.name)/"Aptitud-Labs").mkdir(exist_ok=True)
(Path(temp.name)/"Aptitud-Labs"/"studio-preview").symlink_to(SITE,target_is_directory=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=temp.name,**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE="http://127.0.0.1:%d/Aptitud-Labs/studio-preview/"%server.server_port
os.environ["no_proxy"]="localhost,127.0.0.1"
os.environ["NO_PROXY"]="localhost,127.0.0.1"
options=Options()
for opt in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1"]:
 options.add_argument(opt)
options.set_capability("goog:loggingPrefs",{"browser":"ALL"})
d=webdriver.Chrome(options=options)
wait=WebDriverWait(d,15)
result={"pages":[],"checks":[],"screenshots":[]}
def check(ok,description):
 if not ok:raise AssertionError(description)
 result["checks"].append(description)
 print("PASS",description,flush=True)
def js(source,*args):return d.execute_script(source,*args)
def load(route,width):
 d.set_window_size(width,860 if width<600 else 900)
 d.get(BASE+route)
 wait.until(lambda driver:driver.execute_script("return document.readyState==='complete'"))
 time.sleep(.15)
def snap(name,full=True):
 parameters={"format":"jpeg","quality":77,"captureBeyondViewport":True,"fromSurface":True}
 if full:
  dims=d.execute_cdp_cmd("Page.getLayoutMetrics",{})["cssContentSize"]
  parameters["clip"]={"x":0,"y":0,"width":min(int(dims["width"]),1400),"height":min(int(dims["height"]),12500),"scale":1}
 content=d.execute_cdp_cmd("Page.captureScreenshot",parameters)["data"]
 path=OUT/"screens"/(name+".jpg")
 path.write_bytes(base64.b64decode(content))
 result["screenshots"].append({"path":str(path.relative_to(Path.cwd())),"size":path.stat().st_size})
def scroll_all():
 h=js("return document.documentElement.scrollHeight")
 for pos in range(0,h,630):
  js("window.scrollTo(0,arguments[0])",pos)
  time.sleep(.035)
 js("window.scrollTo(0,0)")
 time.sleep(.7)
def check_page(route,name,width):
 load(route,width)
 check(js("return document.querySelectorAll('h1').length") == 1,f"{name} has exactly one H1 at {width}px")
 check(js("return document.documentElement.scrollWidth <= document.documentElement.clientWidth+2"),
       f"{name} no horizontal overflow at {width}px")
 check(js("return !!document.querySelector('link[href*=\"/assets/atelier.css\"]')"),
       f"{name} loads shared design at {width}px")
 check(not js("return [...document.querySelectorAll('link[rel=stylesheet]')].some(x=>/studio-v3|obsidian-ice-v4|motion-graphics-v5|futuristic-home/.test(x.href))"),
       f"{name} no legacy theme imports")
 if width==390:
  scroll_all()
  # A full-page screenshot may catch a lazy image before its observer fires.
  # Eagerly request all images for asset-integrity validation after scroll.
  js("document.querySelectorAll('img[loading=lazy]').forEach(x=>x.loading='eager')")
  try:
   WebDriverWait(d,12).until(lambda _:
       js("return [...document.images].every(x=>x.complete&&x.naturalWidth>0)"))
  except Exception:
   pass
  images=js("""return [...document.images].map(x=>({src:x.getAttribute('src'),ok:x.complete&&x.naturalWidth>0,complete:x.complete,naturalWidth:x.naturalWidth}))""")
  if any(not x["ok"] for x in images):
   print("IMAGE FAILURES",name,json.dumps([x for x in images if not x["ok"]]),flush=True)
  check(all(x["ok"] for x in images),f"{name} images decode after natural mobile scrolling")
  snap(name+"-mobile-full")
 else:
  scroll_all()
  snap(name+"-desktop")
 result["pages"].append({"route":route,"name":name,"width":width,"height":js("return document.documentElement.scrollHeight"),"css":js("return document.querySelectorAll('link[rel=stylesheet]').length"),
 "js":js("return document.querySelectorAll('script[src]').length")})
try:
 for width in (390,1280):
  for route,name in [("","inicio"),("proyectos/","portafolio"),("servicios/","servicios"),("planes/","planes"),("nfc-qr/","nfc"),("cotizar/","cotizar")]:
   check_page(route,name,width)
 load("",390)
 toggle=d.find_element(By.ID,"al-menu-toggle")
 toggle.click()
 check(toggle.get_attribute("aria-expanded")=="true" and d.find_element(By.ID,"al-mobile-menu").is_displayed(),"mobile menu opens")
 toggle.click()
 check(toggle.get_attribute("aria-expanded")=="false" and not d.find_element(By.ID,"al-mobile-menu").is_displayed(),"mobile menu closes")
 check(not d.find_elements(By.CSS_SELECTOR,"#motion-graphics,#v3-workbench,#mg-project-wall"),"homepage contains no demo wall")
 load("proyectos/",390)
 cards=d.find_elements(By.CSS_SELECTOR,"[data-al-kind]")
 check(len(cards)==7,"portfolio preserves seven projects")
 check(len(d.find_elements(By.CSS_SELECTOR,"[data-al-kind] a[href^='https://']"))>=7,"portfolio preserves external demo links")
 js('document.querySelector(\'[data-al-filter="herramientas"]\').click()')
 check(len([x for x in cards if x.is_displayed()])==2,"portfolio tool filter shows two systems")
 js('document.querySelector(\'[data-al-filter="web"]\').click()')
 check(len([x for x in cards if x.is_displayed()])==5,"portfolio web filter shows five websites")
 load("planes/",390)
 prices=[x.text for x in d.find_elements(By.CSS_SELECTOR,"[data-plan-price]")]
 check(len(prices)==3 and all("S/" in x for x in prices),"three pricing plan totals render")
 load("nfc-qr/",390)
 check(len(d.find_elements(By.CSS_SELECTOR,".nfc-product"))==6,"NFC catalog preserves six products")
 js("document.querySelector('.nfc-product button').click()")
 check(d.find_element(By.CSS_SELECTOR,".nfc-shop-overlay:not([hidden])").is_displayed(),"NFC detail dialog opens")
 js("document.querySelector('.nfc-add-cart').click()")
 check(d.find_element(By.CSS_SELECTOR,".nfc-cart-dialog").is_displayed(),"NFC cart opens after adding product")
 check("S/" in d.find_element(By.CSS_SELECTOR,".nfc-cart-total").text,"NFC cart calculates subtotal")
 js("document.querySelector('.nfc-cart-dialog .nfc-shop-close').click()")
 load("cotizar/",390)
 check(js("return [...document.querySelectorAll('[data-al-panel]')].filter(x=>!x.hidden).length") == 1,"quote shows one route at a time")
 js('document.querySelector(\'[data-al-choice="cotizador"]\').click()')
 check(not d.find_element(By.ID,"cotizador").find_element(By.XPATH,"..").get_attribute("hidden"),"quote calculator opens")
 check(js("return !!document.querySelector('#quote-total') && document.querySelector('#quote-total').textContent.includes('S/')"),"quote calculator computes total")
 js('document.querySelector(\'[data-quote-type="app"]\').click()')
 check(d.find_element(By.CSS_SELECTOR,'[data-quote-type="app"]').get_attribute("aria-pressed")=="true","quote calculator switches to application pricing")
 js('document.querySelector(\'[data-al-choice="contratar"]\').click()')
 check(d.find_element(By.ID,"brief-step-title").text!="","formal six-step brief is mounted")
 check(js("return [...document.querySelectorAll('[data-al-panel]')].filter(x=>!x.hidden).length") == 1,"formal brief hides other quote panels")
 load("cotizar/?plan=business#cotizador",390)
 check(not d.find_element(By.CSS_SELECTOR,'[data-al-panel="cotizador"]').get_attribute("hidden"),"pricing link selects calculator directly")
 check(js("return document.documentElement.scrollWidth <= document.documentElement.clientWidth+2"),"quote calculator no mobile overflow")
 for severity in d.get_log("browser"):
  if severity["level"]=="SEVERE" and "favicon" not in severity["message"].lower():
   print("BROWSER",severity["message"][:300],flush=True)
finally:
 d.quit()
 server.shutdown()
 server.server_close()
 temp.cleanup()
(OUT/"test-report.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print("ALL CHECKS PASSED",len(result["checks"]),flush=True)
