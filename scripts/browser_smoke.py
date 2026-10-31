#!/usr/bin/env python3
"""Pruebas reales de interacción con Chromium; sin enviar mensajes ni contactar servicios externos.

Requiere: Python 3, Chromium/Chrome y Selenium 4.
python scripts/browser_smoke.py
"""
from __future__ import annotations

import functools
import json
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

    def end_headers(self):
        # Mismo CSP definido en vercel.json para detectar bloqueos reales.
        self.send_header("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; frame-src 'self'; form-action 'self'")
        super().end_headers()


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
        options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
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

            # Test the collapsed menu at a mobile width, then the inquiry on desktop.
            driver.set_window_size(390, 844)
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

            driver.set_window_size(1280, 900)

            # La portada navega con window.location.href, no con window.open.
            # Registrar la navegación real sin contactar a WhatsApp ni enviar mensajes.
            driver.execute_cdp_cmd("Network.enable", {})
            driver.execute_cdp_cmd("Page.enable", {})
            driver.execute_cdp_cmd("Network.setBlockedURLs", {"urls": ["*://wa.me/*"]})
            driver.get_log("performance")  # descartar tráfico anterior

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
            def attempted_whatsapp_navigation(d):
                for entry in d.get_log("performance"):
                    try:
                        event = json.loads(entry["message"])["message"]
                        method, params = event.get("method"), event.get("params", {})
                        if method == "Network.requestWillBeSent":
                            url = params.get("request", {}).get("url", "")
                        elif method == "Page.frameRequestedNavigation":
                            url = params.get("url", "")
                        else:
                            continue
                        if url.startswith("https://wa.me/51937367296?text="):
                            return url
                    except (ValueError, KeyError, TypeError):
                        continue
                return False

            outgoing = wait(driver, attempted_whatsapp_navigation)
            check(outgoing.startswith("https://wa.me/51937367296?text="), "WhatsApp usa el número de Aptitud Labs")
            check("Persona QA" in unquote(outgoing) and "No indicado" in unquote(outgoing),
                  "El mensaje conserva nombre y correo opcional")

            # Una navegación externa bloqueada puede dejar la pestaña de prueba
            # sin procesar entradas WebDriver; continuar en una pestaña nueva.
            old_tab = driver.current_window_handle
            driver.switch_to.new_window("tab")
            new_tab = driver.current_window_handle
            driver.switch_to.window(old_tab)
            driver.close()
            driver.switch_to.window(new_tab)
            driver.execute_cdp_cmd("Network.setBlockedURLs", {"urls": []})

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
            # Con 'eager', el DOM puede existir antes que los manejadores JS.
            wait(driver, lambda d: d.execute_script(
                "return document.readyState === 'complete' "
                "&& typeof exportSite === 'function' "
                "&& typeof document.getElementById('export').onclick === 'function'"
            ))
            phone = driver.find_element(By.CSS_SELECTOR, '[data-key="phone"]')
            check(phone.get_attribute("value") == "", "Editor empieza sin WhatsApp inventado")
            driver.find_element(By.ID, "export").click()
            denied = driver.execute_script("return document.getElementById('toast').textContent")
            no_download = not list(Path(downloads).glob("*.html"))
            check("WhatsApp válido" in denied and no_download,
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

            # Abrir el archivo exportado sin el editor ni backend.
            driver.get(generated.as_uri())
            wait(driver, lambda d: len(d.find_elements(By.TAG_NAME, "h1")) == 1)
            driver.set_window_size(375, 812)
            driver.find_element(By.CSS_SELECTOR, 'a[href="#contacto"]').click()
            wait(driver, lambda d: d.execute_script("return location.hash") == "#contacto")
            check(driver.find_element(By.ID, "contacto").is_displayed(),
                  "HTML autónomo navega al contacto")
            check(
                driver.execute_script("return document.documentElement.scrollWidth <= window.innerWidth + 2"),
                "HTML autónomo responsive sin desbordamiento a 375px"
            )

            # Página de Puno: prueba de conversión y prueba de ancho móvil.
            driver.set_window_size(1280, 900)
            driver.get(base + "/diseno-web-puno/")
            wait(driver, lambda d: d.find_element(By.ID, "punoQuoteForm"))
            check(len(driver.find_elements(By.CSS_SELECTOR, "h1")) == 1,
                  "Diseño web Puno: exactamente un H1")
            check(len(driver.find_elements(By.CSS_SELECTOR, "#trabajos-web-puno .proof-card")) == 2,
                  "Diseño web Puno: dos trabajos etiquetados como demostración")
            check(len(driver.find_elements(By.CSS_SELECTOR, "link[rel='canonical'][href='https://aptitudlabs.com/diseno-web-puno/']")) == 1,
                  "Diseño web Puno: canonical correcto")
            driver.execute_script("window.__punoQA=null; window.open=(url)=>{window.__punoQA=url;return {};};")
            quote = driver.find_element(By.ID, "punoQuoteForm")
            driver.execute_script("arguments[0].scrollIntoView({block:'center',behavior:'instant'})", quote)
            driver.find_element(By.CSS_SELECTOR, "#punoQuoteForm button[type='submit']").click()
            check(driver.execute_script("return window.__punoQA") is None,
                  "Diseño web Puno: no se prepara mensaje con campos vacíos")
            driver.find_element(By.ID, "punoNombre").send_keys("Tienda & Café QA")
            Select(driver.find_element(By.ID, "punoRubro")).select_by_visible_text("Restaurante o cafetería")
            Select(driver.find_element(By.ID, "punoObjetivo")).select_by_visible_text("Mostrar productos o una carta digital")
            driver.find_element(By.ID, "punoDetalle").send_keys("Quiero ver catálogo con QR.")
            driver.execute_script("arguments[0].scrollIntoView({block:'center',behavior:'instant'});",driver.find_element(By.CSS_SELECTOR, "#punoQuoteForm button[type='submit']"))
            time.sleep(0.35)
            driver.find_element(By.CSS_SELECTOR, "#punoQuoteForm button[type='submit']").click()
            outgoing = wait(driver, lambda d: d.execute_script("return window.__punoQA"))
            decoded = unquote(outgoing)
            check(outgoing.startswith("https://wa.me/51937367296?text="),
                  "Diseño web Puno: WhatsApp apunta al contacto real")
            check("Tienda & Café QA" in decoded and "Restaurante o cafetería" in decoded and "carta digital" in decoded,
                  "Diseño web Puno: los datos se conservan en la consulta")
            check("no se ha enviado automáticamente" in driver.find_element(By.ID, "punoQuoteStatus").text,
                  "Diseño web Puno: se aclara que todavía falta enviar el mensaje")
            for width in (320,375,390):
                driver.set_window_size(width, 840)
                dimensions = driver.execute_script("return [document.documentElement.scrollWidth,window.innerWidth]")
                check(dimensions[0] <= dimensions[1]+2,
                      f"Diseño web Puno: sin scroll lateral a {width}px")

            for sector in ("/web-para-barberias/", "/web-para-restaurantes/"):
                driver.get(base + sector)
                wait(driver, lambda d: len(d.find_elements(By.TAG_NAME, "h1")) == 1)
                check(len(driver.find_elements(By.CSS_SELECTOR, "a[href^='https://wa.me/']")) > 0,
                      f"{sector}: CTA funcional de WhatsApp")
                check(
                    driver.execute_script("return document.documentElement.scrollWidth <= window.innerWidth + 2"),
                    f"{sector}: sin desbordamiento móvil a 375px",
                )

            driver.set_window_size(320, 740)
            driver.get(base + "/")
            wait(driver, lambda d: d.find_element(By.ID, "briefForm"))
            check(
                driver.execute_script("return document.documentElement.scrollWidth <= window.innerWidth + 2"),
                "Portada sin desbordamiento móvil a 320px",
            )

            # Nueva identidad visual: inspeccionar anchos críticos en las siete landings.
            for route in (
                "/", "/soluciones/", "/nfc-qr/", "/diseno-web-puno/",
                "/diseno-web-juliaca/", "/web-para-restaurantes/",
                "/web-para-barberias/",
            ):
                for width in (320, 390):
                    driver.set_window_size(width, 840)
                    driver.get(base + route)
                    wait(driver, lambda d: len(d.find_elements(By.TAG_NAME, "h1")) == 1)
                    check(
                        driver.execute_script(
                            "return document.documentElement.scrollWidth <= window.innerWidth + 2"
                        ),
                        f"{route}: rediseño sin desbordamiento móvil a {width}px",
                    )
                check(
                    driver.execute_script(
                        "return !!document.querySelector('link[href=\"/assets/refresh.css\"]')"
                    ),
                    f"{route}: utiliza el nuevo sistema visual compartido",
                )
            driver.set_window_size(1280, 900)

            # Shared theme: exercise real computed contrast on legacy conversion surfaces.
            for route, selectors in (
                ("/planes/", (".al-plans .section-title", ".al-card h3", ".al-price")),
                ("/cotizar/", (".quote-addons legend", ".brief-step-title")),
                ("/nfc-qr/", (".asset-guide strong", ".nfc-product h3", ".nfc-checkout-info label")),
            ):
                driver.get(base + route)
                theme = wait(driver, lambda d: d.find_element(By.ID, "site-theme"))
                if driver.execute_script("return document.body.dataset.theme") != "dark":
                    theme.click()
                for selector in selectors:
                    ratio = driver.execute_script(r"""
                        const el=document.querySelector(arguments[0]);
                        if(!el) return 0;
                        const rgba=s=>(s.match(/[\d.]+/g)||[]).map(Number);
                        const fg=rgba(getComputedStyle(el).color);
                        let node=el,bg=[255,255,255,1];
                        while(node){
                          const c=rgba(getComputedStyle(node).backgroundColor);
                          if(c.length>=3&&(c[3]===undefined||c[3]>=0.99)){bg=c;break}
                          node=node.parentElement;
                        }
                        const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4})
                          .reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
                        const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
                    """, selector)
                    check(ratio >= 4.5, f"{route} {selector}: contraste oscuro {ratio:.2f}:1")

            # Public examples owned by the studio: mobile layout and real primary interactions.
            demos_origin = "https://aptitud-labs-demos.martinjobtpaz.chatgpt.site"
            for slug in ("barberia", "tienda", "caja", "pulso"):
                driver.set_window_size(390, 844)
                driver.get(demos_origin + "/" + slug + "/")
                wait(driver, lambda d: len(d.find_elements(By.TAG_NAME, "h1")) == 1)
                check(driver.execute_script("return document.documentElement.scrollWidth <= innerWidth + 2"),
                      f"Demo {slug}: sin desbordamiento a 390px")
                check("DEMO INTERACTIVA" in driver.find_element(By.CLASS_NAME, "demo-ribbon").text,
                      f"Demo {slug}: identifica datos ficticios")
                if slug == "caja":
                    driver.find_element(By.CSS_SELECTOR, "#product-buttons button").click()
                    driver.find_element(By.ID, "confirm").click()
                    check("4.50" in driver.find_element(By.ID, "revenue").text,
                          "Demo caja: venta actualiza el resumen")
                if slug == "pulso":
                    Select(driver.find_element(By.CSS_SELECTOR, "select[aria-label='Etapa de Negocio Aurora']")).select_by_value("propuesta")
                    check(driver.find_element(By.ID, "tasks-count").text == "1",
                          "Demo Pulso: transición crea tarea simulada")
            driver.set_window_size(1280, 900)

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
