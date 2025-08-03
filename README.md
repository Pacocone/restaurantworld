# restaurantworld (Firebase, resumen mínimo público)

✅ Cada usuario elige su **usuario** al abrir la app.  
✅ Se publica automáticamente un **resumen mínimo** con: **nombre del restaurante, ciudad, clasificación (rating), precio medio y enlace a Google Maps**.  
✅ En **Amigos**, cualquiera lo ve escribiendo el usuario (no hay descargas manuales).

## Configuración inicial (una vez)
1) Firebase Console → crea proyecto.
2) **Authentication** → *Sign-in method* → **Anonymous = ON**.
3) **Firestore** → crear base de datos (modo producción).
4) **Reglas Firestore** → pega y publica:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{uname} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid
                    && !exists(/databases/$(database)/documents/profiles/$(uname));
      allow update, delete: if request.auth != null
                            && resource.data.ownerUid == request.auth.uid;
    }
  }
}
```
5) Copia la configuración Web del SDK y pégala en **firebase-config.js**.

## Publicar en GitHub Pages
- Sube esta carpeta al repo `restaurantworld` (rama `main`, raíz).  
- Activa Pages sobre `main` y `/ (root)` → `https://<tu_usuario>.github.io/restaurantworld/`.

## Cómo se guarda el resumen
Documento en `profiles/<usuario>`:
```json
{
  "username": "ejemplo",
  "restaurants": [
    {"name":"Sol", "city":"Madrid", "rating":4.5, "avgPrice":28.0, "mapsUrl":"https://www.google.com/maps/search/Sol Madrid"}
  ],
  "ownerUid":"...",
  "updatedAt": "..."
}
```
