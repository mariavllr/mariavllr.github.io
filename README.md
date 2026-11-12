# Portfolio de María Villar

Web estática (HTML, CSS y JavaScript sin dependencias) pensada para publicarse en GitHub Pages.

## Estructura

```
index.html                  Portada en inglés: hero, trabajo, investigación, arte, sobre mí, contacto
projects/wfc/index.html     Caso de estudio del generador WFC (con el explicador interactivo)
projects/fitoon/index.html  Caso de estudio de Fitoon
projects/segorbe/index.html Caso de estudio de Guardianes de Segorbe
es/                         Versión en español (misma estructura)
404.html                    Página de error
assets/css/style.css        Todos los estilos (colores y fuentes arriba del todo, en :root)
assets/js/main.js           Animaciones, isla de demo, explicador WFC y builds de itch.io
assets/img/                 Imágenes, favicon y og.jpg (vista previa al compartir el enlace)
.nojekyll                   Le dice a GitHub Pages que sirva los archivos tal cual
```

Todas las rutas son relativas, así que puedes abrir `index.html` con doble clic y verla en local sin servidor.

## Publicar en GitHub Pages

1. Crea un repositorio público llamado exactamente `mariavllr.github.io`.
2. Sube el contenido de esta carpeta a la raíz del repositorio (no la carpeta en sí):
   ```
   git init
   git add .
   git commit -m "Primera versión del portfolio"
   git branch -M main
   git remote add origin https://github.com/mariavllr/mariavllr.github.io.git
   git push -u origin main
   ```
3. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. En uno o dos minutos estará en https://mariavllr.github.io

Cada `git push` posterior actualiza la web sola.

## Cambiar contenido

- **Textos:** directamente en el HTML de cada página.
- **Imágenes:** guarda el archivo en `assets/img/` y cambia el `src`. Los huecos pendientes son `<div class="ph">` con un texto a mano que dice qué va ahí; sustitúyelos por:
  ```html
  <img src="assets/img/fitoon.webp" alt="Descripción de la imagen">
  ```
  En las páginas de proyecto la ruta empieza por `../../assets/img/`.
- **Peso:** exporta en WebP o JPG a 1200–1600 px de ancho. Intenta que cada imagen pese menos de 300 KB.
- **GIF al pasar el ratón:** añade `data-gif` a una imagen y se cambiará al pasar por encima:
  ```html
  <img src="assets/img/fitoon.webp" data-gif="assets/img/fitoon.gif" alt="...">
  ```
  Para GIFs grandes, mejor un vídeo corto en MP4 (avísame y lo adapto).
- **Pendientes:** busca `class="todo"` y `class="ph"` para encontrar todo lo que falta por rellenar.

## Builds jugables desde itch.io

Las builds viven en itch.io y se cargan en la web al pulsar el botón (así la portada carga rápido).

1. Sube la build WebGL a itch.io como proyecto HTML ("This file will be played in the browser"). Puedes dejar la compresión de Unity por defecto: itch.io la sirve bien.
2. En itch.io: **Edit game → Distribute → Embed game** y copia la URL del `src` del iframe.
3. Pégala en el atributo `data-embed` del hueco, y en `data-itch` la página normal del juego:
   - **Portada:** en `index.html`, el `<div class="frame sketch play" ...>`.
   - **Página WFC:** en `projects/wfc/index.html`, los dos `<div class="play play-slot" ...>` (generador y juego de colocar fichas).
   ```html
   data-embed="https://itch.io/embed-upload/123456?color=FFF8E7" data-itch="https://mariavllr.itch.io/wfc-generator"
   ```
- Mientras `data-embed` esté vacío, la portada muestra la isla de demo hecha en JavaScript y los huecos de la página WFC dicen "Playable build coming soon".
- En móvil, el botón lleva a la página de itch.io en vez de cargar la build dentro.

## Versión en español

La web está en dos idiomas. El inglés está en la raíz y el español en la carpeta `es/`, con la misma estructura:

```
index.html                  ↔  es/index.html
projects/wfc/index.html     ↔  es/projects/wfc/index.html
projects/fitoon/index.html  ↔  es/projects/fitoon/index.html
projects/segorbe/index.html ↔  es/projects/segorbe/index.html
```

- El botón **EN / ES** de la cabecera lleva a la misma página en el otro idioma (y conserva la sección en la que estabas).
- **Cuando cambies un texto, cámbialo en las dos versiones.** Las imágenes, vídeos, CSS y JS son compartidos: en las páginas de `es/` las rutas llevan un `../` más (`../assets/...`, `../../../assets/...`).
- Los textos que escribe el JavaScript (contador de la isla, explicador WFC, botones de jugar) están en los dos idiomas al principio de `assets/js/main.js`, en `TXT`.
- Cada página indica a Google su versión en el otro idioma con `<link rel="alternate" hreflang="...">`. Si cambias de dominio, sustituye también esas URLs.

## Dominio propio (más adelante)

1. Compra el dominio (por ejemplo `mariavillar.dev`).
2. En **Settings → Pages → Custom domain** escríbelo y guarda. GitHub crea un archivo `CNAME` en el repositorio.
3. En tu proveedor de dominio, apunta los DNS a GitHub Pages siguiendo su guía: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
4. Activa **Enforce HTTPS**.
5. Busca y sustituye `https://mariavllr.github.io/` por tu dominio en todos los HTML (inglés y `es/`) y en `404.html`. Afecta a la vista previa al compartir, la URL canónica y los enlaces entre idiomas.

## Colores y fuentes

Al principio de `assets/css/style.css`, en `:root`: crema, mantequilla, naranja, cielo, hierba y tinta, con su versión para modo oscuro debajo. Fuentes de Google Fonts: Bricolage Grotesque (títulos), Figtree (texto) y Caveat (anotaciones a mano).
