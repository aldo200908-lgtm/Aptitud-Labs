#!/usr/bin/env python3
"""Aptitud Labs Studio Next. Fresh semantic pages; legacy functional logic preserved.
Preview only at /Aptitud-Labs/rebuild/. No original source or current Pages root replaced.
"""
from __future__ import annotations
import html
import re
from pathlib import Path

BASE=Path.cwd()
OUT=BASE/"rebuild-output"
PREFIX="/Aptitud-Labs/rebuild/"
ASSETS="/Aptitud-Labs/assets/"
CONTACT="https://wa.me/51937367296"
MAIL="aptitudlabs.studio@gmail.com"
OUT.mkdir(exist_ok=True)
(OUT/"assets").mkdir(exist_ok=True)

def site(href):
    return PREFIX+href.lstrip("/")

def image(src):
    return ASSETS+src.lstrip("/")

def photo(src,alt,cls="",lazy=True,extra=""):
    return f'<img class="{cls}" src="{image(src)}" alt="{html.escape(alt,quote=True)}" loading="{"lazy" if lazy else "eager"}" decoding="async" {extra}>'

def link(href,text,cls="button",external=False):
    attrs=' target="_blank" rel="noopener noreferrer"' if external else ''
    return f'<a class="{cls}" href="{href}"{attrs}>{text}</a>'

def badge(text):
    return f'<span class="pill">{text}</span>'

def hero(headline,lead,visual,alt,small="",primary=None,secondary=None):
    buttons=(link(primary[0],primary[1]) if primary else '')+(link(secondary[0],secondary[1],"button button-outline") if secondary else '')
    return f'''<section class="hero section" aria-labelledby="page-title">
 <div class="wrap hero-grid"><div class="hero-content">
 <h1 id="page-title">{headline}</h1>
 <p class="hero-lead">{lead}</p>
 <div class="button-group">{buttons}</div>
 <p class="hero-foot">{small}</p></div>
 <div class="hero-art">{photo(visual,alt,"hero-art-photo",False,extra='fetchpriority="high"')}
 <span class="hero-art-mark" aria-hidden="true"></span></div></div></section>'''

def endcap(headline,copy="Cuéntanos qué necesitas y te ayudamos a definir el siguiente paso."):
    return f'''<section class="endcap section"><div class="wrap endcap-layout">
 <div><h2>{headline}</h2><p>{copy}</p></div>
 <div class="endcap-actions">{link(site("cotizar/"),"Solicitar una propuesta <span aria-hidden='true'>↗</span>")}{link(CONTACT,"Hablar por WhatsApp","text-link",True)}</div>
 </div></section>'''

def nav(route):
    def item(url,name,key):
        current=' aria-current="page"' if route==key else ""
        return f'<a href="{site(url)}"{current}>{name}</a>'
    return f'''<a href="#contenido" class="skip">Saltar al contenido</a>
<header class="site-header" id="site-header">
<div class="wrap header-row">
<a class="wordmark" href="{site("")}" aria-label="Aptitud Labs, ir al inicio">Aptitud<span> Labs.</span></a>
<nav class="desktop-nav" aria-label="Navegación principal">
{item("","Inicio","home")}{item("servicios/","Servicios","services")}{item("proyectos/","Portafolio","projects")}{item("planes/","Precios","plans")}{item("nfc-qr/","NFC + QR","nfc")}
</nav>
<a class="header-cta" href="{site("cotizar/")}">Cuéntanos tu idea <span aria-hidden="true">↗</span></a>
<button class="menu-toggle" id="resource-menu-toggle" type="button" aria-expanded="false" aria-controls="resource-menu" aria-label="Abrir menú"><span></span><span></span><span class="visually-hidden">Menú</span></button>
</div>
<nav id="resource-menu" class="mobile-menu" aria-label="Menú principal" hidden>
<div class="wrap"><button type="button" class="menu-close" id="resource-menu-close">Cerrar <span aria-hidden="true">×</span></button>
{item("","Inicio","home")}{item("servicios/","Servicios","services")}{item("proyectos/","Portafolio","projects")}{item("planes/","Planes y precios","plans")}{item("nfc-qr/","Tienda NFC + QR","nfc")}{item("cotizar/","Solicitar propuesta","quote")}
</div></nav></header>'''

def footer():
    return f'''<footer class="site-footer"><div class="wrap">
<div class="footer-top"><div><a href="{site("")}" class="wordmark">Aptitud<span> Labs.</span></a>
<p>Diseño web, aplicaciones y soluciones digitales.<br>Desde Puno, Perú.</p>
<a href="{CONTACT}" target="_blank" rel="noopener noreferrer">WhatsApp · +51 937 367 296</a></div>
<div class="footer-links"><strong>Explorar</strong><a href="{site("servicios/")}">Servicios</a><a href="{site("proyectos/")}">Portafolio</a><a href="{site("planes/")}">Precios</a><a href="{site("nfc-qr/")}">NFC + QR</a></div>
<div class="footer-links"><strong>Tu proyecto</strong><a href="{site("cotizar/")}">Cotizar</a><a href="{site("diseno-web-puno/")}">Diseño web en Puno</a><a href="{site("diseno-web-juliaca/")}">Diseño web en Juliaca</a><a href="{site("privacidad/")}">Privacidad y datos</a></div></div>
<div class="footer-bottom"><span>© <span data-year>2026</span> Aptitud Labs. Puno, Perú.</span><a href="mailto:{MAIL}">{MAIL}</a></div></div></footer>'''

def document(name,title,description,body,modules=(),scripts=()):
    css=f'<link rel="stylesheet" href="{site("assets/studio-next.css")}">'
    if "nfc" in modules:css+=f'<link rel="stylesheet" href="{ASSETS}nfc-store.css">'
    if "quote" in modules:css+=f'<link rel="stylesheet" href="{ASSETS}cotizador.css">'
    if "brief" in modules:css+=f'<link rel="stylesheet" href="{ASSETS}brief.css">'
    if modules:css+=f'<link rel="stylesheet" href="{site("assets/studio-next-widgets.css")}">'
    scriptSources=list(scripts)+["refresh.js"]
    js="".join(f'<script defer src="{ASSETS}{src}"></script>' for src in dict.fromkeys(scriptSources))
    js+=f'<script defer src="{site("assets/studio-next.js")}"></script>'
    out=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#11161b"><meta name="robots" content="noindex,nofollow">
<title>{html.escape(title)} | Aptitud Labs</title><meta name="description" content="{html.escape(description,quote=True)}">
<link rel="icon" href="/Aptitud-Labs/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
{css}</head><body class="studio-next" data-page="{name}" data-theme="dark">
{nav(name)}<main id="contenido">{body}</main>{footer()}{js}</body></html>'''
    route_dirs={"home":"","projects":"proyectos","services":"servicios","plans":"planes","nfc":"nfc-qr","quote":"cotizar"}
    where=OUT/route_dirs.get(name,name)
    where.mkdir(exist_ok=True,parents=True)
    (where/"index.html").write_text(out,encoding="utf-8")
    print(f"BUILD: {name} | {len(out)} bytes")

def section(title,description="",cls=""):
    return f'<div class="section-intro {cls}"><h2>{title}</h2>{f"<p>{description}</p>" if description else ""}</div>'

def feature(h,copy,visual,alt,href,cta="Conocer el servicio"):
    return f'''<a class="feature-card" href="{href}"><div class="feature-media">{photo(visual,alt)}</div>
    <div class="feature-copy"><h3>{h}</h3><p>{copy}</p><span class="inline-arrow">{cta} <span aria-hidden="true">↗</span></span></div></a>'''

# --- Home. Deliberately NO demo iframe, projects chooser, numbered headers or laboratory wall.
home=hero(
 "Tu negocio merece <em>algo más que una web.</em>",
 "Diseñamos páginas web, aplicaciones y sistemas que ayudan a presentar mejor tus servicios, atender consultas y trabajar con más orden.",
 "visuals/servicios-realista.webp","Composición conceptual de un espacio de trabajo digital",
 "Diseño y desarrollo en Puno · Atención a negocios de todo el Perú",
 (site("cotizar/"),"Hablemos de tu proyecto <span aria-hidden='true'>↗</span>"),
 (site("servicios/"),"Ver servicios"))
home+=f'''<section class="section quiet-section"><div class="wrap">
{section("Qué podemos construir para tu negocio.","Soluciones concretas para necesidades distintas.")}
<div class="feature-grid">
{feature("Páginas web","Una presentación clara de tus servicios, productos y formas de contacto.","visuals/servicios-realista.webp","Computadora y pantallas con interfaces digitales",site("servicios/") + "#web")}
{feature("Aplicaciones y sistemas","Herramientas para organizar ventas, clientes, inventario o procesos internos.","projects/caja-cover.webp","Pantalla de demostración de sistema Caja Clara",site("servicios/") + "#apps")}
{feature("Automatización e IA","Reducimos tareas repetitivas y conectamos herramientas donde más lo necesitas.","projects/pulso-cover.webp","Ejemplo de gestión de consultas Pulso",site("servicios/") + "#automatizacion")}
</div></div></section>'''
home+=f'''<section class="section studio-process"><div class="wrap process-grid">
<div>{section("Primero entendemos tu negocio. Después diseñamos.","No comenzamos escogiendo una plantilla. Conocemos qué quieres lograr, definimos las funciones y revisamos contigo el resultado.")}</div>
<div class="process-photo">{photo("visuals/planes-realista.webp","Composición conceptual de planificación de un proyecto digital")}</div></div></section>'''
home+=f'''<section class="section work-teaser"><div class="wrap work-teaser-grid">
<div class="teaser-visual">{photo("projects/maison-fresas.webp","Pastel de fresas del concepto Maison Dulce")}</div>
<div><h2>Así se ve nuestro trabajo.</h2><p>Explora siete proyectos de demostración: webs para negocios, catálogos y herramientas funcionales. Cada propuesta tiene su propia identidad.</p>
{link(site("proyectos/"),"Ver el portafolio <span aria-hidden='true'>↗</span>","button button-outline")}</div></div></section>'''
home+=endcap("¿Qué necesitas crear?")
document("home","Diseño web, apps y soluciones digitales en Puno","Webs, aplicaciones y sistemas a medida. Aptitud Labs trabaja con negocios de Puno, Juliaca y otras ciudades.",home)

# --- Portfolio: seven demos are maintained; no duplicate selectors/scroll walls.
PROJECTS=[
("Maison Dulce","Pastelería","web","projects/maison-fresas.webp","Un catálogo de tortas con movimiento, productos y pedido de demostración.","https://aldo200908-lgtm.github.io/Maison-Dulce-/"),
("Corte 01","Barbería","web","projects/barberia-cover.webp","Servicios, cortes y un recorrido para solicitar citas.","https://aptitud-labs-demos.martinjobtpaz.chatgpt.site/barberia/"),
("Luma Store","Tienda y catálogo","web","projects/tienda-cover.webp","Catálogo digital con filtros y bolsa de compra simulada.","https://aptitud-labs-demos.martinjobtpaz.chatgpt.site/tienda/"),
("Caja Clara","Gestión de ventas","sistemas","projects/caja-cover.webp","Registro de ventas e inventario con datos de ejemplo.","https://aptitud-labs-demos.martinjobtpaz.chatgpt.site/caja/"),
("Pulso","Seguimiento de clientes","sistemas","projects/pulso-cover.webp","Organiza consultas y seguimientos en un tablero de demostración.","https://aptitud-labs-demos.martinjobtpaz.chatgpt.site/pulso/"),
("Sushi Ten Bento","Gastronomía","web","projects/sushi-ten-bento-cover.png","Diseño gastronómico de inspiración japonesa, carta y presentación visual.","https://aldo200908-lgtm.github.io/sushi-ten-bento-/"),
("Allin Mikuy","Café y restobar","web","projects/allin-mikuy-cover.png","Menú digital y experiencia web para un restobar conceptual.","https://aldo200908-lgtm.github.io/Allin-mikuy-Caf-Restobar/"),
]
portfolio=f'''<section class="section portfolio-hero"><div class="wrap portfolio-intro">
 <div><h1>El trabajo <em>habla por nosotros.</em></h1><p>Una selección de webs, catálogos y herramientas que puedes abrir y explorar. Son conceptos y demostraciones; no los presentamos como encargos reales de clientes.</p>
 {link(site("cotizar/"),"Quiero algo así para mi negocio <span aria-hidden='true'>↗</span>","button")}</div>
 <div class="portfolio-cover">{photo("projects/maison-fresas.webp","Torta de fresas del proyecto Maison Dulce","",False,extra='fetchpriority="high"')}</div>
 </div></section>'''
portfolio+=f'''<section class="section gallery-section" id="proyectos"><div class="wrap">
 <div class="gallery-top">{section("Proyectos que puedes explorar.","Cada ejemplo tiene un enlace a su versión interactiva.")}
 <div class="filter-buttons" role="group" aria-label="Filtrar proyectos">
 <button type="button" data-next-filter="todos" aria-pressed="true">Todos</button>
 <button type="button" data-next-filter="web" aria-pressed="false">Webs y catálogos</button>
 <button type="button" data-next-filter="sistemas" aria-pressed="false">Sistemas</button>
 </div></div>
 <p class="visually-hidden" id="next-filter-status" aria-live="polite"></p>
 <div class="project-grid">'''
for i,(name,cat,kind,visual,copy,url) in enumerate(PROJECTS):
    featured=' project-featured' if i==0 else ''
    portfolio+=f'''<article class="project-card{featured}" data-next-kind="{kind}">
      <a class="project-media" href="{url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir la demostración {html.escape(name)}">{photo(visual,"Captura o imagen del proyecto "+name)}
       <span class="project-open" aria-hidden="true">↗</span></a>
      <div class="project-copy"><span class="project-category">{cat}</span><h3>{name}</h3><p>{copy}</p>
       <a href="{url}" target="_blank" rel="noopener noreferrer" class="text-link">Abrir demostración <span aria-hidden="true">↗</span></a></div>
    </article>'''
portfolio+='</div><p class="gallery-disclaimer">Estas son demostraciones con contenido y datos de ejemplo. Las funcionalidades y precios de cada proyecto son ilustrativos.</p></div></section>'
portfolio+=endcap("¿Quieres una web así, pero para tu negocio?","Podemos diseñar una propuesta adaptada a lo que vendes y cómo atiendes a tus clientes.")
document("projects","Portafolio de webs y aplicaciones","Siete demostraciones interactivas de Aptitud Labs: sitios para negocios, catálogos, herramientas y sistemas.",portfolio)

# --- Services
SERVICES=[
("web","Páginas web","Diseñamos sitios para presentar servicios, productos y recibir consultas desde cualquier dispositivo.","projects/sushi-ten-bento-cover.png","Ejemplo de una web gastronómica","Sitio adaptable, contenido estructurado, contacto, publicación y revisión del alcance."),
("apps","Aplicaciones y sistemas","Herramientas para procesos internos, inventario, ventas, clientes y nuevas ideas de negocio.","projects/caja-cover.webp","Sistema de demostración Caja Clara","Definición de funciones, interfaz, validación de datos y entrega acordada."),
("automatizacion","Automatización e inteligencia artificial","Automatizamos tareas repetitivas, consultas y organización de información.","projects/pulso-cover.webp","Tablero de seguimiento de consultas","Flujos definidos, integraciones disponibles y pruebas reales según la necesidad."),
("nfc","NFC y códigos QR","Conecta a tus clientes con tu carta, catálogo, contacto o página de reseñas en un toque.","visuals/nfc-realista.webp","Imagen conceptual de dispositivos y tarjetas NFC","Catálogo de productos, opciones de personalización y entrega por coordinar."),
]
services=hero("Soluciones digitales, <em>sin complicaciones.</em>","Construimos la herramienta que tu negocio necesita: desde una web hasta un sistema para organizar tu trabajo.","visuals/servicios-realista.webp","Espacio de trabajo digital con dispositivos",
"Revisamos cada proyecto según su objetivo y alcance",
(site("cotizar/"),"Contarnos qué necesitas <span aria-hidden='true'>↗</span>"))
services+='<section class="section"><div class="wrap service-list">'
for index,(id_,name,copy,visual,alt,deliverable) in enumerate(SERVICES):
    services+=f'''<article class="service-row" id="{id_}">
      <div class="service-row-photo">{photo(visual,alt)}</div>
      <div class="service-row-copy"><h2>{name}</h2><p>{copy}</p><p class="service-scope">{deliverable}</p>
      {link(site("cotizar/")+"?servicio="+id_,"Solicitar información <span aria-hidden='true'>↗</span>","text-link")}</div></article>'''
services+='</div></section>'
services+=f'''<section class="section narrow-section"><div class="wrap">{section("También podemos ayudarte con diseño gráfico y proyectos a medida.","Si tienes una idea distinta, descríbenos qué problema quieres resolver. Te indicaremos si podemos desarrollarla.")}</div></section>'''
services+=endcap("Hablemos de lo que necesita tu negocio.")
document("services","Servicios digitales","Desarrollo web, aplicaciones, sistemas, automatizaciones, IA y productos NFC para empresas y negocios.",services)

# --- Plans: preserve original price calculation, plan names, gift details.
plans=hero("Una inversión clara <em>desde el inicio.</em>","Estos precios orientativos sirven para comenzar a conversar. El alcance, los materiales y el mantenimiento se acuerdan por escrito.","visuals/planes-realista.webp","Concepto visual de presupuesto y planificación","Los importes finales dependen del trabajo que necesites",
(site("cotizar/")+"#cotizador","Calcular mi presupuesto <span aria-hidden='true'>↗</span>"))
plans+=f'''<section class="section pricing-section" id="planes"><div class="wrap">
{section("Elige un punto de partida.","Cada proyecto se ajusta a tu negocio. Los servicios adicionales se cotizan aparte.")}
<div class="pricing-grid">
<article class="price-card"><h3>Web Esencial</h3><p class="price-amount">Desde <strong data-plan-price="essential">S/ 249</strong></p><p>Para comenzar a mostrar tu negocio en internet.</p>
<ul><li>Diseño adaptable a celular</li><li>Presentación básica del negocio</li><li>Contacto por WhatsApp</li><li>Textos y fotos proporcionados por el cliente</li></ul>
<span class="nfc-gift" data-nfc-gift="essential"></span>{link(site("cotizar/")+"?plan=essential#cotizador","Personalizar este plan <span aria-hidden='true'>↗</span>","button button-outline")}</article>
<article class="price-card price-featured"><h3>Web Negocio</h3><p class="price-amount">Desde <strong data-plan-price="business">S/ 419</strong></p><p>Para presentar más servicios y recibir consultas.</p>
<ul><li>Hasta tres secciones de contenido</li><li>Galería de fotos o servicios</li><li>Formulario de consultas</li><li>Diseño adaptable a celular</li></ul>
<span class="nfc-gift" data-nfc-gift="business"></span>{link(site("cotizar/")+"?plan=business#cotizador","Personalizar este plan <span aria-hidden='true'>↗</span>","button")}</article>
<article class="price-card"><h3>Apps y sistemas</h3><p class="price-amount">Desde <strong data-plan-price="custom">S/ 690</strong></p><p>Una primera versión con funciones acordadas.</p>
<ul><li>Evaluación de requisitos</li><li>Funciones priorizadas</li><li>Propuesta técnica personalizada</li><li>Pruebas y entrega definidas</li></ul>
<span class="nfc-gift" data-nfc-gift="custom"></span>{link(site("cotizar/")+"?plan=custom#cotizador","Consultar mi proyecto <span aria-hidden='true'>↗</span>","button button-outline")}</article>
</div>
<p class="pricing-note">Los precios son referenciales. Dominio, hosting, mantenimiento, comisiones de terceros y cambios de alcance pueden generar costos adicionales. No se cobra nada en esta web.</p>
</div></section>'''
plans+=f'''<section class="section narrow-section"><div class="wrap">
{section("Lo que definimos antes de empezar.","Acordamos entregables, fechas, revisiones, materiales que nos compartirás y cualquier costo recurrente. Sin compromisos que no hayas aprobado.")}
<div class="simple-details"><details><summary>¿El dominio está incluido?</summary><p>Se cotiza de forma separada cuando lo necesitas. Puedes utilizar uno que ya tengas.</p></details>
<details><summary>¿Puedo ampliar un plan?</summary><p>Sí. Revisamos las funciones adicionales y confirmamos el nuevo alcance por escrito.</p></details>
<details><summary>¿Cómo se realiza el pago?</summary><p>Coordinamos las condiciones directamente antes de comenzar. El sitio no procesa pagos.</p></details></div>
</div></section>'''
plans+=endcap("Define tu proyecto con una propuesta clara.")
document("plans","Planes y precios","Web Esencial desde S/249, Web Negocio desde S/419 y apps/sistemas desde S/690. Simula el presupuesto.",plans,scripts=["pricing.js","pricing-plans.js","nfc-store.js"])

# --- NFC. Keep the actual original interactive cart and product builder.
raw_nfc=(BASE/"nfc-qr/index.html").read_text(encoding="utf-8")
shop_match=re.search(r'<section\b[^>]*\bid="nfc-shop"[\s\S]*?</section>',raw_nfc)
assert shop_match,"Original working NFC catalog missing"
shop=shop_match.group()
shop=re.sub(r'<div class="eyebrow">.*?</div>',"",shop, count=1)
shop=shop.replace('Tu conexión.<br><i>Tu diseño.</i>','Elige tus productos NFC.')
shop=re.sub(r'<section class="section-pad nfc-store"', '<section class="section nfc-store"',shop,count=1)
shop=shop.replace('class="shell"','class="wrap"',1)
nfc=hero("Conecta con tus clientes <em>en un toque.</em>","Tarjetas, llaveros y soportes NFC con QR para compartir tu catálogo, carta, contacto o enlace de reseñas.","visuals/nfc-realista.webp","Composición conceptual de soporte NFC, tarjetas y teléfono",
"Consulta compatibilidad, disponibilidad y entrega antes de pagar",
(site("nfc-qr/")+"#nfc-shop","Ver productos <span aria-hidden='true'>↗</span>"))
nfc+=shop
nfc+=f'''<section class="section narrow-section"><div class="wrap">{section("Un enlace, muchas posibilidades.","Puedes configurar tu NFC o QR para abrir tu página, carta digital, WhatsApp, reseñas o redes sociales.")}<div class="steps-grid">
<div><h3>Elige el producto</h3><p>Tarjeta, llavero o soporte según cómo lo utilizarás.</p></div>
<div><h3>Personalízalo</h3><p>Indícanos el enlace, diseño y cantidad que necesitas.</p></div>
<div><h3>Confirma tu pedido</h3><p>Revisamos disponibilidad, importe final y envío por WhatsApp.</p></div>
</div><div class="simple-details"><details><summary>¿Todos los teléfonos reconocen NFC?</summary><p>No todos. Por eso los productos también pueden incluir QR para abrir el mismo enlace.</p></details>
<details><summary>¿El envío está incluido?</summary><p>No. Se calcula antes de confirmar el pedido según la ciudad de destino.</p></details>
</div></div></section>'''
nfc+=endcap("¿Necesitas un producto personalizado?","Cuéntanos cómo piensas utilizarlo y te ayudaremos a elegir el formato.")
document("nfc","Tienda NFC y QR","Tarjetas, llaveros y soportes NFC con QR para negocios en Puno y Perú. Compra por unidad y consulta envío.",nfc,modules=["nfc"],scripts=["nfc-store.js"])

# --- Quote page: take the exact working original calculator / formal wizard / quick form.
raw_quote=(BASE/"cotizar/index.html").read_text(encoding="utf-8")
def extract(section_id):
    result=re.search(r'<section\b[^>]*\bid="'+section_id+r'"[\s\S]*?</section>',raw_quote)
    assert result, "Working quote component missing: "+section_id
    return result.group()
consult=extract("consulta")
calculator=extract("cotizador")
formal=extract("contratar")
consult=re.sub(r'<div class="eyebrow">[^<]*</div>','',consult,count=1)
consult=consult.replace('Cuéntanos qué necesita<br>tu negocio.','Cuéntanos qué necesitas.')
consult=consult.replace('class="shell contact-panel"','class="wrap contact-panel"')
consult=consult.replace('<p>¿Ya conoces el alcance? <a href="/cotizar/#contratar">Completa la solicitud de contratación ↗</a></p>','')
calculator=re.sub(r'<div class="eyebrow">[^<]*</div>','',calculator,count=1)
calculator=calculator.replace('Diseña tu idea.<br><i>Calcula tu presupuesto.</i>','Calcula un presupuesto orientativo.')
formal=re.sub(r'<div class="eyebrow">[^<]*</div>','',formal,count=1)
formal=formal.replace('¿Listo para contratar?<br><i>Cuéntanos tu proyecto.</i>','Solicita una propuesta formal.')
quote=f'''<section class="section quote-hero"><div class="wrap quote-hero-inner">
<h1>Empecemos por <em>tu idea.</em></h1>
<p>No necesitas saber de tecnología para conversar con nosotros. Elige cómo prefieres comenzar.</p>
<div class="quote-choices" role="group" aria-label="Cómo comenzar tu proyecto">
<button data-quote-tab="consulta" aria-pressed="true" type="button"><strong>Hacer una consulta</strong><span>Cuéntanos lo esencial.</span></button>
<button data-quote-tab="cotizador" aria-pressed="false" type="button"><strong>Calcular un precio</strong><span>Explora opciones y costos.</span></button>
<button data-quote-tab="contratar" aria-pressed="false" type="button"><strong>Solicitar contratación</strong><span>Completa los detalles del proyecto.</span></button>
</div></div></section>
<div class="quote-panels">
<div data-quote-panel="consulta">{consult}</div>
<div data-quote-panel="cotizador" hidden>{calculator}</div>
<div data-quote-panel="contratar" hidden>{formal}</div>
</div>'''
document("quote","Cotizador y contacto","Haz una consulta rápida, calcula un presupuesto o solicita una propuesta formal en Aptitud Labs.",quote,modules=["quote","brief"],scripts=["pricing.js","nfc-store.js","cotizador.js","brief.js"])

# Secondary local SEO routes use new shared shell but keep content tailored to each audience.
LANDINGS=[
("diseno-web-puno","Diseño web en Puno","Tu negocio en Puno puede tener una web que explique claramente lo que ofrece.","Una página rápida, adaptable a celulares, con información útil y contacto por WhatsApp.","projects/maison-fresas.webp","Servicios web para Puno","Pastelerías, restaurantes, tiendas, hoteles y profesionales pueden presentar su trabajo sin depender únicamente de redes sociales."),
("diseno-web-juliaca","Diseño web en Juliaca","Presenta tu negocio en Juliaca con una web hecha a medida.","Catálogos, información de servicios, contacto y funciones adaptadas a cómo vendes.","projects/tienda-cover.webp","Comercio y servicios en Juliaca","Desde una tienda hasta un negocio de servicios, podemos crear un sitio que muestre tus productos y facilite las consultas."),
("web-para-restaurantes","Páginas web para restaurantes","Tu carta y tus platos merecen una buena presentación.","Webs para restaurantes, cafeterías y restobares, con menú, fotos, ubicación y pedidos por WhatsApp.","projects/allin-mikuy-cover.png","Presenta tu carta","Haz más fácil que las personas descubran tus platos, precios, horarios y ubicación."),
("web-para-barberias","Páginas web para barberías","Tus mejores cortes, en primer plano.","Un sitio para mostrar cortes, servicios, precios, horarios y solicitud de citas.","projects/barberia-cover.webp","Muestra tu trabajo","Ayuda a que nuevos clientes vean tu estilo y puedan escribirte para reservar.")
]
for key,name,headline,lead,pic,h2,body in LANDINGS:
    content=hero(headline,lead,pic,"Vista del proyecto de demostración relacionado",name,(site("cotizar/"),"Pedir una propuesta <span aria-hidden='true'>↗</span>"))
    content+=f'''<section class="section narrow-section"><div class="wrap">{section(h2,body)}<div class="steps-grid">
    <div><h3>Diseño adaptable</h3><p>Una experiencia clara en celulares, tabletas y computadoras.</p></div>
    <div><h3>Contenido útil</h3><p>Servicios, fotografías y la información que tus clientes necesitan.</p></div>
    <div><h3>Contacto sencillo</h3><p>Un camino directo a WhatsApp o al formulario de consultas.</p></div>
    </div></div></section>'''
    content+=endcap("¿Hablamos de tu negocio?")
    document(key,name,lead,content)

# Privacy route: conserve current legal notice as a distinct readable page
raw_privacy=(BASE/"privacidad/index.html").read_text(encoding="utf-8")
m=re.search(r'<main[^>]*>([\s\S]*?)</main>',raw_privacy)
if m:
    legal=m.group(1)
    legal=re.sub(r'<header\b[\s\S]*?</header>','',legal)
    legal=re.sub(r'<h1[^>]*>[\s\S]*?</h1>','',legal,count=1)
    privacy='<section class="section legal-section"><div class="wrap"><h1>Privacidad y datos personales</h1><div class="legal-body">'+legal+'</div></div></section>'
else:
    privacy='<section class="section"><div class="wrap"><h1>Privacidad y datos personales</h1><p>Para consultas sobre los datos facilitados, escríbenos a <a href="mailto:'+MAIL+'">'+MAIL+'</a>.</p></div></section>'
document("privacidad","Privacidad y datos personales","Información sobre uso de datos personales y formularios de Aptitud Labs.",privacy)
# Keep the old route semantics: /soluciones/ goes to services.
sol=OUT/"soluciones";sol.mkdir(exist_ok=True)
(sol/"index.html").write_text('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url='+site("servicios/")+'"><title>Servicios | Aptitud Labs</title><p><a href="'+site("servicios/")+'">Ver servicios</a></p></html>',encoding="utf-8")

# Validation: route/asset links, project count, scripts, no older CSS/JS versions.
pages=list(OUT.rglob("index.html"))
assert len(pages)==12, f"Expected 12 pages, got {len(pages)}"
h=(OUT/"index.html").read_text()
assert "mg-motion" not in h and "v3-workbench" not in h
assert h.count('data-next-kind=')==0
portfolio_html=(OUT/"projects"/"index.html").read_text()
assert portfolio_html.count("data-next-kind=")==7
assert "allow-same-origin" not in portfolio_html
quote_html=(OUT/"quote"/"index.html").read_text()
for key in ("#quote-total",'id="briefForm"','id="quote-total"','id="brief-next"','data-quote-panel="consulta"','data-quote-panel="cotizador"','data-quote-panel="contratar"'):
    if key=="#quote-total":continue
    assert key in quote_html,key
assert (OUT/"nfc"/"index.html").read_text().count('id="nfc-products"')==1
assert all("noindex,nofollow" in p.read_text() for p in pages)
print("PASS: clean multipage rebuild, original interactive modules preserved.")
