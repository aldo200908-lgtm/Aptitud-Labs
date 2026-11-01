# Gestión local de Aptitud Labs

Abre `gestion-local.html` en un navegador de confianza, preferiblemente descargando el archivo al equipo antes de usarlo. No lo enlaces desde la web pública.

Funciona exclusivamente en ese navegador mediante `localStorage` (sin sincronización, servidor ni control de acceso). **No es un panel privado apto para producción**, no recibe solicitudes automáticamente y no debe utilizarse con información sensible o compartirse como portal de clientes. Copias en CSV se almacenan donde tú decidas. No existe cifrado de datos locales.

Puedes registrar manualmente códigos de solicitudes recibidas por WhatsApp, estados y importes; exportar CSV; calcular tasa de aceptación sobre registros manuales; modificar tarifas de referencia y exportar un JSON de propuesta. La actualización de tarifas publicadas exige revisar el JSON y editar `assets/pricing.js` + precios de funciones en `assets/cotizador.js` mediante el flujo de GitHub y su despliegue.

Para un auténtico CRM privado faltan: proveedor de identidad, base de datos con autorización a nivel fila, almacenamiento cifrado, recepción autenticada de solicitudes, política de retención y copia de seguridad. No usar contraseñas incrustadas en HTML ni exponer claves de servicio en el cliente.
