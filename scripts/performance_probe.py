#!/usr/bin/env python3
"""Laboratory-only performance diagnostics for the live Puno landing page.

These numbers are NOT PageSpeed Insights / CrUX / Core Web Vitals field data.
Run in GitHub Actions' Chrome on a simulated mid-range mobile connection.
No rankings or SEO performance claims should be inferred from these numbers.
"""
import json
import os
import shutil
import statistics
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

URL=os.environ.get("PERF_TARGET_URL","https://aptitudlabs.com/diseno-web-puno/")
SAMPLES=2
METRICS_SCRIPT="""
window.__aptMetrics={lcp:0,cls:0};
try {new PerformanceObserver(list=>{for(const e of list.getEntries())window.__aptMetrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch(e){}
try {new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__aptMetrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch(e){}
"""
def run():
    opts=Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=390,844")
    executable=shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if executable:opts.binary_location=executable
    rows=[]
    driver=webdriver.Chrome(options=opts)
    try:
        driver.set_page_load_timeout(40)
        driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",{"width":390,"height":844,"deviceScaleFactor":2.75,"mobile":True})
        driver.execute_cdp_cmd("Network.enable",{})
        # Synthetic conditions; real users' devices and connections vary widely.
        driver.execute_cdp_cmd("Network.emulateNetworkConditions",{
            "offline":False,"latency":100,"downloadThroughput":200000,
            "uploadThroughput":75000,"connectionType":"cellular4g"})
        driver.execute_cdp_cmd("Emulation.setCPUThrottlingRate",{"rate":4})
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument",{"source":METRICS_SCRIPT})
        for index in range(SAMPLES):
            driver.get(URL)
            time.sleep(3)
            data=driver.execute_script("""
                const n=performance.getEntriesByType('navigation')[0];
                const r=performance.getEntriesByType('resource');
                return {title:document.title,h1:document.querySelectorAll('h1').length,
                  mobileOverflow:document.documentElement.scrollWidth-window.innerWidth,
                  ttfb:Math.round(n.responseStart-n.requestStart),
                  domContentLoaded:Math.round(n.domContentLoadedEventEnd-n.startTime),
                  load:Math.round(n.loadEventEnd-n.startTime),
                  lcp:Math.round(window.__aptMetrics?.lcp||0),
                  cls:Math.round((window.__aptMetrics?.cls||0)*1000)/1000,
                  resources:r.length,
                  transferBytes:r.reduce((a,x)=>a+(x.transferSize||0),0)};
            """)
            print("Muestra",index+1,json.dumps(data,ensure_ascii=False))
            if data["h1"]!=1 or data["mobileOverflow"]>2: raise RuntimeError("Fallo estructural o desbordamiento en móvil")
            rows.append(data)
        for k in ("ttfb","domContentLoaded","load","lcp","cls","transferBytes"):
            print(f"Mediana {k}: {statistics.median(row[k] for row in rows)}")
        print("Sondeo de rendimiento sintético completado. No es una puntuación oficial de PageSpeed.")
    finally:
        driver.quit()
if __name__=="__main__":run()
