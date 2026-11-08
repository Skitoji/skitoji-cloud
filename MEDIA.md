# Diario visual: fotografía y video

La sección Diario visual contiene un proyecto real de Behance y dos espacios reservados para fotografía y reel. Los espacios no solicitan archivos inexistentes ni muestran controles de reproducción hasta cargar un video real.

Para completarlos, copiar los medios a `skitoji-landing/assets/` y editar `skitoji-landing/studio-media.json`:

```json
{
  "photo": {
    "src": "/assets/proceso.webp",
    "alt": "Describe de forma concreta la fotografía que se muestra"
  },
  "video": {
    "src": "/assets/showreel.mp4",
    "poster": "/assets/showreel-poster.webp"
  }
}
```

Solo se admiten rutas del mismo origen bajo `/assets/`, sin parámetros ni segmentos `..`. Imágenes: JPG, JPEG, PNG, WebP, AVIF, GIF. Video: MP4, WebM, OGG. Comprobar compatibilidad real del códec en los navegadores usados; MP4 H.264 suele ser una opción práctica. `null` conserva el espacio reservado.

El video utiliza controles nativos, `playsinline` y precarga de metadatos; no tiene autoplay. Preparar medios optimizados y una imagen de portada. Si el video contiene diálogo o información sonora necesaria, añadir subtítulos WebVTT y su `<track>` en el HTML antes de publicarlo. No insertar video como sustituto de contenido textual esencial.

Mantener el proxy same-origin de `/api/contact`, las fuentes locales y la sincronización de `works.json`. La interfaz no contiene efectos de sonido ni motor Web Audio. Un reel real conserva sus controles nativos y puede incluir su propia pista de audio; nunca se reproduce automáticamente.

La referencia consultada fue [Studio KARO](https://www.karocrafts.com/): su presentación combina imagen, video y diseño editorial. Los modelos y el código de interacción del portafolio son propios; no se usan los assets ni la música de esa web. El proyector del footer se genera mediante geometría 3D y no necesita cargar otro video o imagen.
