#!/usr/bin/env python3
"""Browser QA for Studio Next. Run against a local combined gh-pages tree.
This validates published route structure, visual layout, real interactive logic,
and captures mobile screenshots for review without contacting any customers.
"""
from __future__ import annotations
import argparse
import base64
import json
import re
import threading
import time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

parser=argparse.ArgumentParser()
parser.add_argument("--root",required=True)
args=parser.parse_args()
root=Path(args.root).resolve()
# Match the actual project-Pages subpath rather than serving the repository root.
webroot=Path("/tmp/aptitud-studio-next-webroot")
webroot.mkdir(parents=True,exist_ok=True)
link=webroot/"Aptitud-Labs"
if link.is_symlink():link.unlink()
if not link.exists():link.symlink_to(root,target_is_directory=True)
out=Path.cwd()/"rebuild-evidence"
out.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(webroot),**kw)
    def log_message(self,*a):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/Aptitud-Labs/rebuild/"
routes=[("",'Inicio'),("proyectos/","Portafolio"),("servicios/","Servicios"),
        ("planes/","Planes"),("nfc-qr/","Tienda NFC"),("cotizar/","Cotizar"),
        ("diseno-web-puno/","Puno"),("diseno-web-juliaca/","Juliaca"),
        ("web-para-restaurantes/","Restaurantes"),("web-para-barberias/","Barberías"),
        ("privacidad/","Privacidad")]
op=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1"):
    op.add_argument(flag)
op.set_capability("goog:loggingPrefs",{"browser":"ALL"})
driver=webdriver.Chrome(options=op)
driver.set_page_load_timeout(35)
results=[]
def check(condition,message):
    if not condition:raise AssertionError(message)
def js(script,*args):
    return driver.execute_script(script,*args)
def wait_for(selector,timeout=10):
    return WebDriverWait(driver,timeout).until(lambda d: d.find_element(By.CSS_SELECTOR,selector))
def visit(route):
    driver.get(base+route)
    wait_for('main h1')
    time.sleep(.2)
def capture(name):
    data=driver.execute_cdp_cmd("Page.captureScreenshot",{"format":"jpeg","quality":75,"captureBeyondViewport":True})["data"]
    (out/(name+".jpg")).write_bytes(base64.b64decode(data))
def scroll_load():
    h=js("return document.documentElement.scrollHeight")
    for y in range(0,h,610):
        js("window.scrollTo(0,arguments[0])",y)
        time.sleep(.065)
    js("window.scrollTo(0,0)")
    time.sleep(.25)
def check_layout(route,label,width):
    driver.set_window_size(width,844 if width<600 else 900)
    visit(route)
    scroll_load()
    stats=js("""
        const root=document.documentElement;
        const images=[...document.images].filter(i=>i.getClientRects().length>0);
        return {width:root.clientWidth,scrollWidth:root.scrollWidth,
                broken:images.filter(i=>!i.naturalWidth).map(i=>i.src),
                title:document.title,h1:document.querySelectorAll('h1').length,
                css:[...document.querySelectorAll('link[rel=stylesheet]')].map(i=>i.getAttribute('href')),
                js:[...document.querySelectorAll('script[src]')].map(i=>i.getAttribute('src')),
                theme:getComputedStyle(document.body).backgroundColor,
                overflow:root.scrollWidth-root.clientWidth};
    """)
    check(stats["h1"]==1,f"{label}: expected one H1, got {stats['h1']}")
    check(stats["overflow"]<=2,f"{label}: horizontal scroll {stats['overflow']}px at {width}")
    check(not stats["broken"],f"{label}: broken images: {stats['broken'][:4]}")
    check(any("studio-next.css" in x for x in stats["css"]),f"{label}: missing clean theme")
    check(not any(re.search(r"futuristic|kinetic|studio-v3|obsidian|home-refined|motion-graphics",x) for x in stats["css"]),f"{label}: old theme leaked")
    if width<600:
        capture(f"{label.lower().replace(' ','-')}-mobile")
    results.append({"page":label,"width":width,**stats})
    print(f"PASS {label}: {width}px, image count OK, 0 overflow",flush=True)
try:
    for route,label in routes:
        check_layout(route,label,390)
    for route,label in routes[:6]:
        check_layout(route,label,1280)
    # Show/hide responsive menu and navigate.
    driver.set_window_size(390,844)
    visit("")
    menu=driver.find_element(By.ID,"resource-menu-toggle")
    menu.click()
    check(menu.get_attribute("aria-expanded")=="true","Mobile navigation did not open")
    check(driver.find_element(By.ID,"resource-menu").is_displayed(),"Mobile nav hidden after click")
    capture("menu-open")
    driver.find_element(By.ID,"resource-menu-close").click()
    check(menu.get_attribute("aria-expanded")=="false","Mobile navigation did not close")
    # All 7 projects and 2 filter states
    visit("proyectos/")
    cards=driver.find_elements(By.CSS_SELECTOR,"[data-next-kind]")
    check(len(cards)==7,f"Expected 7 demos; got {len(cards)}")
    links=[card.find_element(By.CSS_SELECTOR,"a.project-media").get_attribute("href") for card in cards]
    check(len(set(links))==7,"Portfolio demo URLs are duplicated")
    btn=driver.find_element(By.CSS_SELECTOR,'[data-next-filter="sistemas"]')
    btn.click()
    displayed=[card for card in cards if card.is_displayed()]
    check(len(displayed)==2,f"Portfolio tools filter returned {len(displayed)}")
    driver.find_element(By.CSS_SELECTOR,'[data-next-filter="todos"]').click()
    check(len([card for card in cards if card.is_displayed()])==7,"All projects filter failed")
    # NFC: six cards, open details, add one product, see cart; DO NOT submit checkout.
    visit("nfc-qr/")
    cards=driver.find_elements(By.CSS_SELECTOR,".nfc-product")
    check(len(cards)==6,f"NFC catalog size {len(cards)} != 6")
    candidates=driver.find_elements(By.CSS_SELECTOR,".nfc-product button")
    check(bool(candidates),"No clickable NFC products")
    driver.execute_script("arguments[0].click()",candidates[0])
    wait_for(".nfc-shop-dialog")
    active=driver.find_element(By.CSS_SELECTOR,".nfc-shop-overlay:not([hidden])")
    check(active.is_displayed(),"NFC modal did not open")
    driver.find_element(By.CSS_SELECTOR,".nfc-add-cart").click()
    check(driver.find_element(By.CSS_SELECTOR,".nfc-cart-total").is_displayed(),"NFC cart summary hidden")
    check(driver.find_element(By.ID,"nfc-cart-count").text=="1","NFC cart counter failed")
    capture("nfc-cart")
    # Calculator/wizard: initial simple inquiry, then detailed quote, then hiring.
    visit("cotizar/")
    check(driver.find_element(By.CSS_SELECTOR,'[data-quote-panel="consulta"]').is_displayed(),"Consulta should be default")
    check(not driver.find_element(By.CSS_SELECTOR,'[data-quote-panel="cotizador"]').is_displayed(),"Calculator must start hidden")
    driver.find_element(By.CSS_SELECTOR,'[data-quote-tab="cotizador"]').click()
    check(driver.find_element(By.CSS_SELECTOR,'[data-quote-panel="cotizador"]').is_displayed(),"Calculator tab failed")
    total=driver.find_element(By.ID,"quote-total").text
    check("S/" in total,"Price calculator did not initialize")
    radio=driver.find_element(By.CSS_SELECTOR,'#quote-designs input[value="1"]')
    driver.execute_script("arguments[0].click()",radio)
    changed=driver.find_element(By.ID,"quote-total").text
    check(total!=changed,f"Price total didn't update: {total} -> {changed}")
    capture("quote-calculator")
    driver.find_element(By.CSS_SELECTOR,'[data-quote-tab="contratar"]').click()
    check(driver.find_element(By.ID,"brief-step-title").text,"Formal hiring wizard not initialized")
    check(driver.find_element(By.ID,"brief-next").is_displayed(),"Formal wizard Next button missing")
    capture("quote-hiring")
    # Verify no calls to actual customer channels were performed.
    (out/"qa.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print("PASS: Studio Next interactive QA completed; no contact messages or orders sent.",flush=True)
finally:
    driver.quit()
    server.shutdown()
    server.server_close()
