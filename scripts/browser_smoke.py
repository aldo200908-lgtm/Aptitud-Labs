#!/usr/bin/env python3
"""Pruebas reales de interacción con Chromium; sin enviar mensajes ni contactar servicios externos.

Requiere: Python 3, Chromium/Chrome y Selenium 4.
python scripts/browser_smoke.py
"""
from __future__ import annotations

import functools
import os
import re
import shutil
import tempfile
import threading
import time
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select, WebDriverWait

ROOT = Path(__file__).resolve().parent.parent
ERRORS = []
CHECKS = 0


class SilentHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def check(condition, message):
    global CHECKS
    CHECKS += 1
    if not condition:
        ERRORS.append(message)
        print("  ✗", message, flush=True)
    else:
        print("  ✓", message, flush=True)


def wait(driver, test, timeout=12):
    return WebDriverWait(driver, timeout).until(test)


def run():
    chrome = (
        shutil.which("google-chrome")
        or shutil.which("google-chrome-stable")
        or shutil.which("chromium")
        or shutil.which("chromium-browser")
    )
    if not chrome:
        raise RuntimeError("No hay Chromium/Chrome en este runner; prueba no ejecutada")

    os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    os.environ["no_proxy"] = "localhost,127.0.0.1"

    handler = functools.partial(SilentHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"

    with tempfile.TemporaryDirectory(prefix="aptitud-qa-") as downloads:
        options = Options()
        options.binary_location = chrome
        options.page_load_strategy = "eager"
        for flag in (
            "--headless=new",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--window-size=1280,900",
        ):
            options.add_argument(flag)
        options.add_experimental_option(
            "prefs",
            {
                "download.default_directory": downloads,
                "download.prompt_for_download": False,
                "download.directory_upgrade": True,
                "safebrowsing.enabled": True,
            },
        )
        driver = None
        try:
            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(25)
            driver.execute_cdp_cmd(
                "Page.setDownloadBehavior",
                {"behavior": "allow", "downloadPath": downloads},
            )

            # Sitio comercial: menú y formulario de WhatsApp sin salir del navegador.
            driver.get(base + "/")
            wait(driver, lambda d: d.find_element(By.ID, "briefForm"))
            check(driver.title.startswith("Diseño de Páginas Web"), "Portada con título comercial")
            check(len(driver.find_elements(By.TAG_NAME, "h1")) == 1, "Portada tiene un solo H1")

            toggle = driver.find_element(By.ID, "resource-menu-toggle")
            toggle.click()
            wait(driver, lambda d: d.find_element(By.ID, "resource-menu-toggle").get_attribute("aria-expanded") == "true")
            check(not driver.find_element(By.ID, "resource-menu").get_attribute("hidden"), "Menú abre y muestra contenido")
            driver.switch_to.active_element.send_keys(Keys.ESCAPE)
            wait(driver, lambda d: d.find_element(By.ID, "resource-menu-toggle").get_attribute("aria-expanded") == "false")
            check(driver.switch_to.active_element.get_attribute("id") == "resource-menu-toggle", "Escape devuelve el foco al menú")

            driver.execute_script(
                "window.__qaWhatsApp=null; window.open=(url)=>{window.__qaWhatsApp=url;return {};};"
            )
            driver.find_element(By.NAME, "nombre").send_keys("Persona QA")
            Select(driver.find_element(By.NAME, "servicio")).select_by_visible_text("Diseño o desarrollo web")
            driver.find_element(By.NAME, "detalle").send_keys(
                "Quisiera conocer opciones para un negocio pequeño, con contacto por WhatsApp."
            )
            send_button = driver.find_element(By.CSS_SELECTOR, "[data-contact-channel='whatsapp']")
            driver.execute_script("arguments[0].scrollIntoView({block:'center',behavior:'instant'});",send_button)
            time.sleep(0.7)  # las animaciones de revelado terminan antes del clic
            obscurer = driver.execute_script("""
                const r=arguments[0].getBoundingClientRect();
                const x=Math.round(r.x+r.width/2), y=Math.round(r.y+r.height/2);
                const hit=document.elementFromPoint(x,y);
                return {x,y,viewport:innerHeight,top:hit?.tagName,classes:hit?.className,
                  button:arguments[0].contains(hit)};
            """,send_button)
            print("Diagnóstico clic WhatsApp:",obscurer,flush=True)
            send_button.click()
            outgoing = wait(driver, lambda d: d.execute_script("return window.__qaWhatsApp"))
            check(outgoing.startswith("https://wa.me/51937367296?text="), "WhatsApp usa el número de Aptitud Labs")
            check("Persona QA" in unquote(outgoing) and "No indicado" in unquote(outgoing),
                  "El mensaje conserva nombre y correo opcional")

            driver.set_window_size(390, 844)
            driver.get(base + "/")
            wait(driver, lambda d: d.find_element(By.ID, "hero-title"))
            dimensions = driver.execute_script(
                "return [document.documentElement.scrollWidth, window.innerWidth]"
            )
            check(dimensions[0] <= dimensions[1] + 2, "La portada no tiene scroll horizontal a 390px")

            # Aptitud Web: no exporta un contacto ficticio; la versión generada funciona.
            driver.set_window_size(1280, 900)
            driver.get(base + "/aptitud-web/")
            wait(driver, lambda d: d.find_element(By.ID, "export"))
            phone = driver.find_element(By.CSS_SELECTOR, '[data-key="phone"]')
            check(phone.get_attribute("value") == "", "Editor empieza sin WhatsApp inventado")
            driver.find_element(By.ID, "export").click()
            check("WhatsApp válido" in driver.find_element(By.ID, "toast").text,
                  "No exporta con número de WhatsApp ausente")

            phone.send_keys("51987654321")
            name = driver.find_element(By.CSS_SELECTOR, '[data-key="name"]')
            name.clear()
            name.send_keys("Norte & Sur <Demo>")
            description = driver.find_element(By.CSS_SELECTOR, '[data-key="description"]')
            description.clear()
            description.send_keys("Atención & calidad <sin riesgos>")
            check(
                driver.find_element(By.ID, "pvButton").get_attribute("href")
                == "https://wa.me/51987654321",
                "Botón en vista previa apunta al número configurado",
            )
            driver.find_element(By.ID, "export").click()

            generated = Path(downloads) / "index.html"
            wait(driver, lambda _d: generated.exists() and generated.stat().st_size > 2000)
            html = generated.read_text(encoding="utf-8")
            check(len(re.findall(r"<h1\b", html)) == 1, "HTML exportado tiene un H1")
            check('id="contacto"' in html and 'href="#contacto"' in html,
                  "Enlace Contacto conserva su destino")
            check('https://wa.me/51987654321' in html, "CTA exportado conserva WhatsApp real")
            check("<title>Norte &amp; Sur &lt;Demo&gt;</title>" in html,
                  "Título HTML escapa caracteres peligrosos")
            check('content="Atención &amp; calidad &lt;sin riesgos&gt;"' in html,
                  "Metadescripción HTML correctamente escapada")
            check('id="pvHeadline"' not in html and "data-key=" not in html,
                  "La exportación no incluye controles del editor")
            check("@media(max-width:640px)" in html, "Exportación conserva estilo responsive")

            driver.get(base + "/resources/navbars/")
            wait(driver, lambda d: len(d.find_elements(By.TAG_NAME, "iframe")) == 5)
            check(
                all((frame.get_attribute("sandbox") or "") == "allow-scripts"
                    for frame in driver.find_elements(By.TAG_NAME, "iframe")),
                "Demostraciones aisladas con sandbox",
            )
        finally:
            if driver is not None:
                driver.quit()
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        ERRORS.append(f"Excepción durante navegador: {type(exc).__name__}: {exc}")
        print("  ✗", ERRORS[-1], flush=True)
    print(f"Pruebas de navegador: {CHECKS} aserciones; {len(ERRORS)} errores.")
    if ERRORS:
        raise SystemExit(1)
