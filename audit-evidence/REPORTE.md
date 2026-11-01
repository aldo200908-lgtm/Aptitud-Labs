# Auditoría integral — Aptitud Labs

**Fecha:** 31 de octubre de 2026 (hora de Perú).  
**Versión auditada:** GitHub Pages, rama \`gh-pages\`, contenido servido en \`https://aldo200908-lgtm.github.io/Aptitud-Labs/\`.  
**Alcance:** Inicio, Portafolio, Servicios, Planes, NFC + QR, Cotizar, páginas locales de Puno/Juliaca, Privacidad y redirección de Soluciones.  
**Entorno de prueba:** Chromium automatizado, 390 × 844 px (móvil) y 1280 × 900 px (escritorio). Capturas completas y del menú, medición DOM y CSS computado.  
**No se modificó la web de producción ni se envió ninguna consulta o compra real.**

## Diagnóstico ejecutivo

El sitio **sí funciona como demostración de capacidad** y ofrece CTA, propuestas de valor, servicios y precios concretos, pero **todavía no se percibe como una misma marca de estudio premium**. Conviven diferentes sistemas visuales de distintas versiones, se repiten demasiadas experiencias, hay secciones muy extensas y en Portafolio se mezclan fondos de baja legibilidad con controles de demostración.

**Decisión de rediseño recomendada:** rehacer un sistema compartido de diseño y las plantillas de cada ruta, **no seguir acumulando CSS V12/V13 ni añadir más efectos sobre lo existente**. Mantener las imágenes aprovechables, el contenido funcional y las integraciones, pero reemplazar el sistema de presentación.

## Evidencia visual

| Pantalla | Captura |
|---|---|
| Inicio móvil completo | [01 — Inicio](screens/01-inicio-mobile-full.jpg) |
| Inicio con menú abierto | [01 — Menú](screens/01-inicio-menu-open.jpg) |
| Portafolio móvil | [02 — Portafolio](screens/02-portafolio-mobile-full.jpg) |
| Portafolio, contacto final | [02 — Contacto](screens/02-portafolio-mobile-bottom.jpg) |
| Servicios móvil | [03 — Servicios](screens/03-servicios-mobile-full.jpg) |
| Planes móvil | [04 — Planes](screens/04-planes-mobile-full.jpg) |
| Tienda NFC móvil | [05 — NFC](screens/05-nfc-mobile-full.jpg) |
| Cotizador móvil | [06 — Cotizar](screens/06-cotizar-mobile-full.jpg) |
| Inicio escritorio | [11 — Inicio escritorio](screens/11-inicio-desktop-full.jpg) |
| Portafolio escritorio | [12 — Portafolio escritorio](screens/12-portafolio-desktop-full.jpg) |

Los datos técnicos completos de 12 capturas/estados se guardan en [report.json](report.json).

## Hallazgos prioritarios

**P0 — Corregir antes de considerar la web terminada**

1. **Identidad fragmentada.** Inicio usa grafito, las páginas principales un azul casi negro, el formulario final del Portafolio un fondo crema y verde oscuro, y las páginas SEO todavía un tema claro antiguo. El visitante cambia de universo visual al navegar. Evidencia: Inicio, Portafolio (contacto final), página Puno.
2. **Contraste deficiente en Portafolio.** Las tarjetas secundarias de proyectos tienen textos muy claros sobre paneles crema: el texto y los vínculos se vuelven difíciles de leer. El panel de contacto de Portafolio presenta un título de bajo contraste sobre verde oscuro. Evidencia: captura 02 y su final.
3. **Arquitectura de código superpuesta.** Inicio carga **17 hojas de estilo y 10 scripts externos**; Portafolio, **11 hojas y 9 scripts**. Conviven \`futuristic-home\`, \`kinetic-editorial\`, \`studio-v3\`, \`obsidian-ice-v4\`, \`motion-graphics-v5\` y ajustes V6–V11. Produce regresiones de CSS y hace difícil mantener calidad.
4. **Portafolio sobredimensionado.** Aproximadamente **15 759 px de alto en 390 px de ancho** para siete proyectos. Se presentan tres recorridos de obras (selección inicial, muro cinematográfico y catálogo completo) más capítulos sobre movimientos. El usuario que quiere ver proyectos debe atravesar contenido redundante.
5. **Cotizar contiene tres tareas distintas a la vez.** Consulta rápida + cotizador detallado + cuestionario de contratación. La página mide aproximadamente **9 511 px** en móvil. La progresión de una sola pregunta a una consulta útil se pierde entre demasiadas decisiones.
6. **Estilos previos aparecen todavía en rutas concretas.** Se verificó que el contacto del Inicio quedó corregido a grafito mediante CSS computado. En Portafolio no: su sección de contacto todavía marca \`rgb(231, 222, 210)\` en el fondo y conserva estética heredada.

**P1 — Alto impacto en diferenciación y conversión**

7. **Rótulos decorativos repetitivos.** «01 / …», «EDITION 04», «TRACKING 01–04», «MOTION LAB» y etiquetas tipo interfaz de ingeniería hacen que el conjunto recuerde una demo de plantilla o IA. La marca del usuario debe expresarse en fotografía, tipografía y recorrido, no en números arbitrarios.
8. **Titulares demasiado abstractos.** «Una gran conexión», «Un gran comienzo», «Se explora», «Una buena idea merece…». Deben explicar la oferta y el beneficio real, no repetir frases aspiracionales.
9. **Inicio puede ser más directo.** H1 principal y fotos funcionan mejor después del último cambio, pero dos grandes bloques de promesas preceden al detalle concreto de servicios. Conviene: oferta en hero → 3 servicios → cómo trabajamos → prueba de trabajo → contacto. Ninguna web interactiva en Inicio.
10. **Portafolio no distingue suficientemente la muestra del proyecto real.** Los conceptos están identificados como demos (punto positivo), pero las obras reales o atribuidas deberían tener permisos y datos propios, y las ideas ficticias seguir rotuladas inequívocamente. No presentar testimonios, conversiones ni clientes inexistentes.
11. **Demasiados efectos y etapas narrativas.** La animación acompaña una tarea; no debe forzar scroll ni cambiar escenas cuando el visitante intenta leer. Priorizar entradas de texto con máscara y transiciones de imagen moderadas, dejando la interacción 3D en los detalles del Portafolio.
12. **Servicios tiene seis tarjetas de peso similar.** Los cuatro ejes principales (web, apps/sistemas, automatización, NFC) deben verse diferenciados. «Identidad» y «Algo que no está aquí» como complementos o CTA final, no competir al mismo nivel.
13. **La tienda NFC repite inventario, formatos, proceso y modalidades.** Hay **6 productos** y un carrito/consulta por WhatsApp; todo lo demás puede comprimirse en una explicación del uso, materiales, FAQ y un CTA. La ruta mide **9 797 px** en móvil.
14. **Planes muy extensos antes de decidir.** Los tres precios están visibles (**desde S/249, S/419 y S/690**), una fortaleza, pero siguen bloques largos de condiciones y servicios. Usar una comparación breve con detalles expandibles y una sola acción de «Personalizar presupuesto».
15. **Cotizar requiere simplificación radical.** La gran lista de extras de precio y 6 pasos de contratación son demasiado exigentes para alguien que solo quiere hablar. Convertir el proceso en tres caminos claros con navegación por pasos y progreso real.
16. **Navegación móvil sobrecargada.** El menú abierto muestra diez enlaces y variantes muy parecidas: «Consulta rápida», «Calcular presupuesto» y «Solicitud de contratación». Agrupar las tres en «Cotizar» con subsecciones internas. Mostrar una CTA principal constante.
17. **Botón de tema ambiguo.** El botón dice «Claro» cuando la página está oscura; eso parece el tema activo, aunque en realidad invita a cambiarlo. Preferir icono + «Cambiar apariencia» accesible u opción dentro del menú.
18. **Diferentes rutas, diferentes acabados.** Las landings SEO de Puno/Juliaca usan el tema claro anterior y carecen en gran medida de imágenes reales; actualizar la plantilla compartida sin perder contenido local y URLs.

**P2 — Calidad y mantenimiento**

19. **Etiquetas de tamaño pequeño y exceso de espaciado.** Hay abundante metadato en 7–10 px y encabezados con mucho margen. Priorizar texto principal 16–18 px, secundarios 14 px y mínimo adecuado para controles móviles.
20. **Advertencia de seguridad del iframe en Portafolio.** Chromium detectó una combinación \`allow-scripts\` + \`allow-same-origin\` en un iframe sandbox. Revisar restricciones o abrir demos externas separadamente.
21. **Formularios y textos repetidos.** Se repite el mismo formulario de consulta en Inicio, Portafolio y Cotizar. Un solo módulo reutilizable y un flujo de contacto coherente reducen discrepancias.
22. **Medición y SEO deben estar diferenciados entre vista previa y producción.** Pages incluye \`noindex,nofollow\` intencionadamente, correcto para el preview. No tomar resultados de SEO del preview como diagnóstico de \`aptitudlabs.com\`; revisarlos por separado.
23. **URLs auxiliares publicadas.** \`/soluciones/\` redirige a Servicios y \`/resources/navbars/\` exhibe una muestra aparte de menús. Retirarlas del menú principal y, si no son parte del negocio, dejarlas fuera de la publicación pública.
24. **La previsualización tiene deuda en pruebas.** Las pruebas antiguas siguen esperando selectores de versiones ya reemplazadas. Reescribir QA por tareas reales y rasgos visuales del nuevo sistema, con capturas base y chequeos de contraste/flujo.

## Hallazgos positivos comprobados

- La página principal tiene **un H1** por ruta comprobada.
- En las páginas medidas no se encontró desbordamiento horizontal general en 390 px; el menú móvil **sí abre**.
- Los archivos locales declarados en las rutas principales existen en \`gh-pages\` (sin faltantes).
- Las imágenes que inicialmente parecían «rotas» por carga diferida **sí se cargaron al hacer scroll** en las seis páginas principales en móvil; no clasificarlas como 404.
- El Inicio ya tiene el contacto corregido a grafito: fondo \`rgb(17,23,28)\`, panel \`rgb(26,35,43)\`, formulario \`rgb(18,27,35)\`.
- Las tarifas iniciales, las diferencias entre compra NFC y presupuestar proyectos, y las advertencias de «proyecto de demostración» existen. Hay valor que conservar.

## Recorrido de reemplazo, página por página

### 1. Inicio — primera prioridad
**Conservar:** nombre, oferta de diseño/tecnología, fotografía principal y CTA de conversación.  
**Eliminar:** etiquetas técnicas, fraseo repetido, banderines tipo dashboard, presentaciones de webs interactivas y dobles tarjetas genéricas.  
**Nuevo orden:** hero contundente («Páginas web, sistemas y automatización para negocios»), tres servicios con fotografía útil, diferenciadores concretos, proceso en tres frases, muestra visual mínima enlazada al Portafolio, CTA/contacto sencillo.  
**Ritmo:** movimiento de titulares con mascarilla; imagen con entrada suave; sin scroll-lock.

### 2. Portafolio — segunda prioridad
**Conservar:** siete demos, imágenes reales de pantalla, enlaces públicos, etiquetas de «concepto», filtro simple por tipo y posibilidad de probar.  
**Eliminar:** selección inicial duplicada, «motion wall» de scroll y capítulos de autoexplicación sobre animaciones.  
**Nuevo orden:** proyecto destacado Maison Dulce (foto), rejilla editorial de seis proyectos distintos, filtro pequeño, ficha individual por proyecto con enlace a abrir y volver, CTA de presupuesto.  
**Accesibilidad:** fondos/contrastes coherentes; nunca blanco sobre crema.

### 3. Servicios
Cuatro ofertas principales, cada una con alcance, para quién es, entregables y proyecto de ejemplo (sin presentar demos como clientes). Complementos al final. Acción «Solicitar propuesta» visible sin recorrer toda la página.

### 4. Planes y precios
Comparación de **Esencial (desde S/249)**, **Negocio (desde S/419)** y **Apps/Sistemas (desde S/690)** con lo incluido y excluido, nota de servicios periódicos y enlace a estimación. Validar condiciones y regalos NFC antes de exhibirlos.

### 5. NFC + QR
Hero con producto fotográfico, lista de seis productos con precio o «consultar», vista detallada opcional, resumen de carrito y WhatsApp, materiales/compatibilidad/FAQ al pie. Suprimir la segunda galería que duplica productos y excesivas explicaciones.

### 6. Cotizar
Tres caminos en una sola puerta: «Hablar con Aptitud Labs», «Estimar precio» y «Solicitar contratación». Cada camino debe mostrar solo los campos relevantes. El formulario formal se completa únicamente cuando el visitante lo elige.

### 7. Páginas locales y legales
Conservar URLs y contexto de Puno, Juliaca, restaurantes y barberías. Montarlas sobre los mismos componentes de marca y enlazarlas a Servicios, Portafolio y Cotizar. Privacidad con legibilidad y contenido legal actualizado.

## Nuevo sistema visual propuesto

- **Negro tinta:** \`#11161B\`, superficies grafito \`#1C242A\`.
- **Celeste desaturado:** \`#B7D8E0\` como acento puntual (acciones y navegación).
- **Blanco cálido:** \`#F0F1ED\` para texto principal; gris \`#ACB9C0\` para secundarios.
- **Sin verde oliva, beige de plantilla, resplandores intensos, numeración de secciones, marcas «EDITION» ni cintas de laboratorio.**
- Un solo lenguaje de tipografía y escala; variaciones sutiles (serif solo donde realmente ayude al título). Textos pensados para la lectura, no para decorar la maqueta.
- **Motion graphics profesional:** secuencias cortas de 300–700 ms, máscara tipográfica, cambios de composición y profundidad sin mover controles interactivos ni atrapar el scroll. Respetar \`prefers-reduced-motion\`.

## Plan de implementación

**Fase A — Cimientos:** nueva rama aislada \`redesign/aptitud-studio\`; extraer datos/links; definir tokens, header, footer, botones, formularios y 4–5 CSS organizados por función. No continuar parcheando V3–V11.

**Fase B — Inicio + Portafolio:** primero las dos páginas principales, con QA de 360/390/430 y escritorio; capturas basales, contraste, navegación y animaciones.

**Fase C — Conversión:** Servicios, Planes, NFC, Cotizar. Hacer el flujo rápido antes que la decoración.

**Fase D — Rutas locales y QA final:** páginas SEO/legal y pruebas integrales. Publicar primero en GitHub Pages; promover a Vercel cuando todas las pruebas estén en verde y la revisión en Android sea satisfactoria.

## Criterios de aceptación antes de reemplazar la versión actual

1. Todas las páginas comparten paleta, tipografía, menú, footer y CTA.
2. Ninguna tarjeta o párrafo importante se vuelve ilegible en móvil o modo claro.
3. Inicio no incluye galerías interactivas; todo ese comportamiento vive en Portafolio.
4. Portafolio tiene siete fichas fáciles de abrir, sin etapas duplicadas.
5. Los tres procesos de Cotizar no aparecen juntos de forma interminable.
6. El catálogo NFC conserva precio, imágenes, producto detallado y pedido por WhatsApp.
7. Todos los enlaces y assets son válidos; cero scroll horizontal accidental a 360/390/430 px.
8. El motion se ve fluido en Android real y se desactiva de forma correcta con movimiento reducido.
9. No se envían compras ni formularios durante QA; las pruebas de navegación, validación y selección pasan.
10. La web pública solo se cambia tras revisión completa en la vista previa.

## Límites de esta auditoría

- Las capturas se generaron en Chromium, no en el Android concreto del usuario. Falta validar rendimiento de animaciones reales en su dispositivo y enlaces externos al hacer clic.
- No se completó una transacción, solicitud formal o pago; no se certifica la entrega de mensajes de WhatsApp.
- No se ejecutó un estudio Lighthouse o una certificación WCAG; se señalan **riesgos** a verificar.
- Los datos de SEO e indexación de \`aptitudlabs.com\` no se evalúan a partir de este preview.
- Las imágenes y screenshots de proyectos se tratan como demostraciones; no se certifica una relación comercial real a partir de la apariencia del sitio.
