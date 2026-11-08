# skitoji.cloud — Samuel Monroy / SKITOJI

Portafolio personal de Samuel Monroy, Hypermedia Designer & Filmmaker en Cartagena, Colombia.

Sitio estático de una sola página, sin dependencias ni compilación. About me y Skills comparten sección. Incluye proyectos sincronizados desde Behance, servicios, contacto, español/inglés, diseño responsive y una escultura 3D procedural animada con controles de pausa y malla. La escultura empieza a girar al cargar. Con movimiento reducido gira más despacio y no se inclina con el puntero; el botón permite pausarla. Se suspende temporalmente fuera de pantalla o al ocultar la pestaña.

## Estructura

```text
skitoji-landing/
  index.html                 Portafolio completo, contenido inicial accesible sin JS
  style.css                  Diseño responsive + fuentes locales
  interactive.css            Laboratorio de encuadre, herramientas, franja y proyector
  app.js                     Idiomas, navegación, filtros, sync y formulario
  scene.js                   Nudo del hero, malla inicial y giro automático
  camera.js                  Cámara 3D procedural con despiece y recomposición
  workbench.js               Formatos de entrega, herramientas y control de la franja
  studio.js                  Cuatro capítulos, scrub, piezas y diario visual
  projector.js               Proyector 3D, bobinas, luz y pausa
  editorial.js               Lector de notas y copiar correo
  studio-media.json          Fotografía/reel opcionales del mismo origen
  assets/                    Símbolo Flujo vectorial (azul, tinta y marfil)
  favicon.svg                Icono local
  about.html, skills.html    Compatibilidad: redirigen a /#about y /#skills
  work.html, services.html, contact.html   Compatibilidad con rutas anteriores
  works.json                 Proyectos sincronizados desde Behance
  fonts/                     Fuentes self-hosted existentes
portfolio-form/              Backend Python stdlib de /api/contact
behance-sync/                Sincronizador RSS existente
  sync_behance.py
  behance-categories.json
tests/                       Verificaciones sin dependencias
DEPLOY.md                    Guía para el asistente de la VPS
BRAND.md                     Identidad Flujo y uso del logo
```

## Contenido e interacción

- Navegación por anclas: `/#work`, `/#about`, `/#skills`, `/#services`, `/#contact`.
- About me y Skills juntos; Adobe Animate, Autodesk Maya y Autodesk 3ds Max añadidos a las herramientas existentes, sin porcentajes de dominio.
- `works.json` mantiene el contrato `{updated, source, projects:[{id,title,url,cover,description,year,category}]}`. Los proyectos se actualizan al cargar; si falla el feed, permanece la selección inicial guardada en HTML. Las categorías nuevas generan filtros automáticamente.
- Los títulos y descripciones de proyectos conservan el idioma del contenido original de Behance. La interfaz se traduce entre ES/EN y guarda la preferencia cuando el navegador lo permite.
- Teclado, foco visible, etiquetas de formulario, estados de envío y menú móvil con Escape. Sin cursor personalizado ni contenido oculto al fallar JS.
- No se añaden dependencias, fuentes remotas, `eval`, handlers inline ni estilos inline. Las portadas siguen usando los enlaces HTTPS de Behance.

## Identidad e interacciones

Logo seleccionado Flujo en SVG, integrado en navegación, favicon, About me y footer. Su introducción breve respeta movimiento reducido y no bloquea el sitio. Ver [BRAND.md](BRAND.md).

El hero conserva su nudo 3D en malla. La escena de proceso utiliza una cámara cinematográfica que se acerca, se desarma y se recompone en cuatro capítulos, con pausa, malla, deslizador e inspección de piezas. El cierre incorpora un proyector 3D con bobinas animadas, pausa y control de intensidad de luz: de la captura a la pantalla.

El laboratorio de encuadre compara formatos 16:9, 4:3 y 9:16, calcula la altura para un ancho de entrega y permite mostrar una guía de tercios. Las 18 herramientas son botones: muestran su aplicación en el flujo de trabajo y enlazan con la etapa correspondiente de la cámara. La franja de disciplinas se desplaza de forma continua, con pausa explícita, pausa por foco/puntero y estado inicial estático si se solicita movimiento reducido.

El diario visual utiliza scroll horizontal nativo con contador y permite añadir fotografía/reel; ver [MEDIA.md](MEDIA.md). Las notas se leen en un diálogo accesible y se conserva la acción de copiar correo. No hay botón, motor ni efectos de sonido de interfaz. La experiencia completa se documenta en [EXPERIENCE.md](EXPERIENCE.md).

El [kit de Flujo para redes](brand/skitoji-flujo-kit.zip) incluye 42 gráficos en SVG/PDF, PNG transparentes y avatares con margen para recorte circular.

## Comprobaciones

Desde la raíz del repositorio, con Node 18+ y Python 3:

```bash
node --check skitoji-landing/app.js
node --check skitoji-landing/scene.js
node tests/portfolio.test.cjs
node tests/scene.test.cjs
node tests/camera.test.cjs
node tests/workbench.test.cjs
node tests/studio.test.cjs
node tests/projector.test.cjs
node tests/editorial.test.cjs
python3 tests/check_static.py
```

Las comprobaciones cubren enlaces seguros, feed, estados del formulario, anclas, rutas antiguas, traducciones, labels, cálculo de dimensiones, estados de interacción y geometría 3D. La revisión de composición e interacciones se realiza con Chromium y Playwright. El formulario se prueba con una respuesta local simulada; la entrega real de correo, la CSP y el dominio se verifican en staging. El estado de publicación se debe comprobar en la VPS.

## Backend del formulario

Se conserva el backend existente sin cambios. El frontend envía JSON al mismo origen en `/api/contact`, incluyendo `website` vacío y `form_time` en milisegundos. Espera al mínimo anti-spam del backend y solo muestra éxito si `ok` es verdadero y al menos uno de `email` o `discord` confirma entrega. Los errores conservan lo escrito y se anuncian de forma accesible. Sin JS, el botón queda deshabilitado y está disponible el enlace de correo.

Variables de entorno (ver `portfolio-form/.env.example`, nunca subir `.env`):

- `SMTP_HOST` / `SMTP_PORT`: iCloud SMTP (`smtp.mail.me.com:587`).
- `SMTP_USER` / `SMTP_PASS`: usuario y contraseña de aplicación.
- `MAIL_TO` / `MAIL_FROM`: destinatario y remitente.
- `DISCORD_WEBHOOK_URL`: notificación opcional.

Anti-spam existente: honeypot, tiempo mínimo, límite de body y rate limit por IP/global.

## Caddy

Se conserva el esquema de publicación actual, sirviendo `skitoji-landing/` en la raíz del dominio:

```caddyfile
skitoji.cloud {
    root * /srv/skitoji
    handle /api/contact {
        reverse_proxy portfolio-form:5000
    }
    try_files {path} {path}.html {path}/index.html
    file_server
    # Mantener las cabeceras de seguridad / CSP del host.
}
```

El Caddyfile completo no está en el repositorio. Ver [DEPLOY.md](DEPLOY.md) para comprobar las rutas, aplicar en staging y publicar conservando el backend, las fuentes y la sincronización de Behance.
