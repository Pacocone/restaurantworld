PWA ADD-ON (Android "Añadir a pantalla de inicio")

Archivos incluidos:
- manifest.json
- sw.js
- icons/icon-192.png
- icons/icon-512.png
- install.js

Dónde colocarlos en tu repo:
- En el raíz de tu GitHub Pages del proyecto: /restaurantworld/
  (quedaría https://pacocone.github.io/restaurantworld/manifest.json, etc.)

Cambios mínimos en tu index.html:
1) Dentro de <head> añade:
   <meta name="theme-color" content="#ff6d00">
   <link rel="manifest" href="/restaurantworld/manifest.json">

2) Justo antes de </body>, añade:
   <script src="/restaurantworld/install.js"></script>

   (Opcional) Si ya tienes un botón propio en la UI:
   <button id="btnInstallApp">⬇️ Instalar</button>
   El install.js usará ese botón si existe (si no, crea uno flotante).

Importante:
- El service worker se registra automáticamente desde install.js.
- Si cambias rutas/estructura, ajusta las referencias de /restaurantworld/ en manifest.json y sw.js.
- Tras subirlo, abre: https://pacocone.github.io/restaurantworld/?pwa=v1
  y en Android Chrome verás el botón "Instalar" (o Menú ⋮ → Instalar app).
- Si no aparece, borra datos del sitio (Almacenamiento) para limpiar el SW y vuelve a entrar.
