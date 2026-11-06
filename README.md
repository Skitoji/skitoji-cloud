# skitoji.cloud — Portfolio

Portafolio personal de Samuel Monroy (SKITOJI) — Hypermedia Designer & Filmmaker.

Sitio estático multi-página desplegado en la raíz de `https://skitoji.cloud`, servido por Caddy
con rutas limpias (`/work`, `/about`, `/skills`, `/services`, `/contact`) y un formulario de
contacto con backend Python (stdlib, sin dependencias).

## Estructura

```
skitoji-landing/        Sitio estático (HTML/CSS/JS + fuentes self-hosted)
  index.html            Home
  work.html             Works (grid dinámico desde works.json)
  about.html            Sobre mí
  skills.html           Habilidades
  services.html         Servicios
  contact.html          Formulario de contacto
  style.css / app.js    CSS y JS compartidos (i18n, cursor, HUD, formulario)
  works.json            Works sincronizados desde Behance (RSS)
  fonts/                Fuentes self-hosted (woff2)

portfolio-form/         Backend del formulario (Python stdlib, sin deps)
  app.py                Handler /api/contact -> email (iCloud SMTP) + Discord (webhook)
  Dockerfile
  .env.example          Plantilla de variables de entorno (copiar a .env)

behance-sync/           Sync de works desde Behance (RSS público, sin API key)
  sync_behance.py       Genera works.json (escritura atómica)
  behance-categories.json  Mapeo manual galleryId -> categoría
```

## Backend del formulario

Variables de entorno (ver `.env.example`):

- `SMTP_HOST` / `SMTP_PORT` — iCloud SMTP (`smtp.mail.me.com:587`)
- `SMTP_USER` — Apple ID usado para entrar a iCloud
- `SMTP_PASS` — app-specific password de Apple
- `MAIL_TO` / `MAIL_FROM` — destino/origen del correo
- `DISCORD_WEBHOOK_URL` — webhook de Discord (opcional)

Anti-spam: honeypot (campo + tiempo), límite de body, rate-limit por IP + global,
sanitización de campos y validación de idioma.

## Deploy (Caddy)

Los archivos estáticos se sirven con `file_server` (sin rebuild). El formulario se expone
como reverse proxy:

```
skitoji.cloud {
    root * /srv/skitoji
    handle /api/contact {
        reverse_proxy portfolio-form:5000
    }
    try_files {path} {path}.html {path}/index.html
    file_server
    # + cabeceras de seguridad / CSP
}
```

> Nota: el `Caddyfile` completo del host no se incluye aquí (contiene rutas de otros
> servicios del homelab).
