# Aptitud Labs — Sitio corporativo

Sitio estático editorial de Aptitud Labs, publicado en Vercel.

## Estructura

- `index.html`: portada, servicios, proyectos y formulario que **prepara** mensajes para WhatsApp o correo (no envía ni guarda datos automáticamente).
- `soluciones/`: cartera de servicios y paquetes configurables.
- `diseno-web-puno/` y `diseno-web-juliaca/`: páginas de servicio locales.
- `web-para-barberias/` y `web-para-restaurantes/`: páginas para clientes de esos sectores.
- `nfc-qr/`: NFC y códigos QR.
- `resources/navbars/`: ejemplos interactivos y prompts.
- `aptitud-web/`: editor experimental, no indexable y enlazado desde el portafolio.
- `privacidad/`: información sobre los datos y proveedores externos.

## Publicación

Vercel usa `vercel.json`. Al añadir una página nueva:

1. Agregar su `index.html` al array `builds` para que realmente se publique.
2. Crear su ruta legible en `routes`, antes de `handle: filesystem`.
3. Agregar enlaces internos y, para páginas que se deban indexar, actualizar `sitemap.xml`.
4. Incluir título, descripción, URL canónica, H1 y enlace a privacidad.

**Importante:** la imagen `assets/hero/aptitud-hero-background.png` contiene datos JPEG; Vercel configura el encabezado `Content-Type: image/jpeg` para ese recurso. Evita cambiar la extensión sin actualizar todas las referencias.

## Verificaciones

Ejecutar desde la raíz con Node.js 20 o superior:

```bash
node scripts/check-site.mjs
```

El workflow `.github/workflows/quality.yml` automatiza estos controles en pushes y pull requests. Comprueba enlaces internos, sitemap, metadatos, rutas, archivos y sintaxis de JavaScript.

Además, el workflow instala Selenium y ejecuta `python scripts/browser_smoke.py` en Chromium para comprobar menú, formulario, móviles de 320–390 px, páginas sectoriales y exportación del editor. Ejecuta `node scripts/check-live.mjs` para verificar que el dominio `.com` y el alias Vercel responden, y comprobar endpoints publicados. Este diagnóstico es **informativo**: un build exitoso no garantiza accesibilidad desde todos los países o redes.

La configuración de Vercel también aplica una política CSP para limitar recursos externos; las pruebas de navegador la reproducen localmente para detectar incompatibilidades.

Las pruebas estáticas **no sustituyen** las pruebas visuales en celular y computadora, Lighthouse/PageSpeed, Search Console ni la verificación de enlaces externos.

## Contacto, privacidad y mantenimiento

Las consultas se preparan para WhatsApp `+51 937 367 296` o `aptitudlabs.studio@gmail.com`; la persona debe confirmar el envío en su aplicación. No escribir «mensaje enviado» si no existe un backend con respuesta confirmada.

No incluir credenciales ni tokens en el sitio. Antes de integrar analítica, cookies, píxeles publicitarios o un backend de leads, revisar y actualizar la página de privacidad.

Los casos de estudio y conceptos visuales deben etiquetarse con transparencia; no presentar ejemplos, prototipos o demostraciones como clientes reales.
