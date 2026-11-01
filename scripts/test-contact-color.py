#!/usr/bin/env python3
"""Regression: contact section must render graphite, never olive green."""
from __future__ import annotations

import functools
import os
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(__file__).resolve().parent.parent

def main() -> None:
    chrome = (
        shutil.which("google-chrome")
        or shutil.which("google-chrome-stable")
        or shutil.which("chromium")
        or shutil.which("chromium-browser")
    )
    if not chrome:
        raise RuntimeError("Chromium unavailable; color regression cannot be validated")
    os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    os.environ["no_proxy"] = "localhost,127.0.0.1"
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT)),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    options = Options()
    options.binary_location = chrome
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        for width in (390, 1280):
            driver.set_window_size(width, 860)
            driver.get(base + "/")
            WebDriverWait(driver, 15).until(
                lambda d: d.execute_script("return !!document.getElementById('contacto')")
            )
            colors = driver.execute_script("""
                const section=document.querySelector('#contacto');
                const panel=section.querySelector('.contact-panel');
                const form=section.querySelector('.brief-form');
                const style=(el)=>getComputedStyle(el).backgroundColor;
                const sheet=[...document.styleSheets].some(s=>s.href&&
                  s.href.includes('/assets/home-contact-v11.css'));
                return {section:style(section),panel:style(panel),form:style(form),
                        sheet,theme:document.body.dataset.theme,
                        sectionWidth:section.getBoundingClientRect().width,
                        innerWidth:document.documentElement.clientWidth};
            """)
            print(f"Contact computed colors at {width}px: {colors}", flush=True)
            assert colors["sheet"], "The versioned contact stylesheet was not linked"
            assert colors["section"] == "rgb(17, 23, 28)", "Contact section still has wrong color"
            assert colors["panel"] == "rgb(26, 35, 43)", "Contact panel still has wrong color"
            assert colors["form"] == "rgb(18, 27, 35)", "Form should use consistent graphite"
            assert colors["theme"] == "dark", "New visitors must default to matte dark"
            assert colors["sectionWidth"] <= colors["innerWidth"] + 2, "Mobile horizontal overflow"
        print("PASS: no olive green remains in rendered contact section.", flush=True)
    finally:
        if driver:
            driver.quit()
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
