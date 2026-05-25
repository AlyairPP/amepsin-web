# AMEPSIN Salud Mental — Página web

Página web estática para AMEPSIN (Asociación Mexicana de Psicología y Neurociencias), clínica de psicoterapia en Puebla.

Dominio: **www.amepsin.com.mx**

---

## 🚀 Cómo publicar la web GRATIS en GitHub Pages

Tienes el dominio comprado en GoDaddy y cuenta en GitHub. Estos son los pasos exactos para tenerla online en ~15 minutos.

### 1. Crear el repositorio en GitHub

1. Entra a [github.com](https://github.com) con tu cuenta.
2. Click en el botón **"New"** (verde, arriba a la izquierda) → **"New repository"**.
3. Rellena:
   - **Repository name**: `amepsin-web` (o el nombre que prefieras)
   - **Visibility**: marca **"Public"** (necesario para GitHub Pages gratis)
   - **NO** marques ninguna casilla de "Add a README", "gitignore" ni "license".
4. Click en **"Create repository"**.

### 2. Subir los archivos

En la pantalla siguiente verás la opción **"uploading an existing file"**. Click ahí.

Arrastra **todo el contenido** de esta carpeta (el `index.html`, la carpeta `img/`, el archivo `CNAME`, este `README.md`) a la zona de arrastrar.

> ⚠️ **Importante**: arrastra el CONTENIDO de la carpeta, no la carpeta entera. Es decir, al final en el repo debes ver `index.html` en la raíz, no `amepsin-web/index.html`.

Cuando estén subidos, abajo escribe un mensaje de commit (ej: "primera versión") y click **"Commit changes"**.

### 3. Activar GitHub Pages

1. Ve a la pestaña **"Settings"** del repositorio.
2. En la barra lateral, busca **"Pages"**.
3. En **"Source"** elige `Deploy from a branch`.
4. En **"Branch"** selecciona `main` y la carpeta `/ (root)`. Click **"Save"**.
5. Espera 1-2 minutos. Verás un mensaje verde: **"Your site is live at https://TU-USUARIO.github.io/amepsin-web/"**.

🎉 Tu web ya está online en esa URL. Ahora vamos a conectarle tu dominio.

### 4. Conectar tu dominio amepsin.com.mx (GoDaddy)

En GoDaddy:

1. Entra a [godaddy.com](https://godaddy.com) → **Mis productos** → **Dominios** → click en `amepsin.com.mx`.
2. Click en **"DNS"** o **"Administrar DNS"**.
3. **Borra los registros A y CNAME existentes** que apunten al "parking" de GoDaddy (los que tengan @ o www y un valor genérico).
4. **Añade estos registros**:

   | Tipo  | Nombre | Valor              | TTL  |
   |-------|--------|--------------------|------|
   | A     | @      | 185.199.108.153    | 1h   |
   | A     | @      | 185.199.109.153    | 1h   |
   | A     | @      | 185.199.110.153    | 1h   |
   | A     | @      | 185.199.111.153    | 1h   |
   | CNAME | www    | TU-USUARIO.github.io | 1h |

   (Sustituye `TU-USUARIO` por tu nombre de usuario de GitHub. Sin el `/amepsin-web` al final, solo el dominio github.io)

5. **Guarda los cambios**.

### 5. Configurar el dominio en GitHub

1. Vuelve a GitHub → tu repositorio → **Settings → Pages**.
2. En **"Custom domain"** escribe: `www.amepsin.com.mx` y click **Save**.
3. GitHub creará/usará el archivo `CNAME` (ya viene incluido en este proyecto).
4. Espera unos minutos. Cuando GitHub verifique el dominio (puede tardar de 10 min a 24h), marca también **"Enforce HTTPS"**.

### 6. ¡Listo!

Tu web estará accesible en:
- 🌐 `https://www.amepsin.com.mx` (principal)
- 🌐 `https://amepsin.com.mx` (redirige automáticamente)

Los cambios pueden tardar hasta 24h en propagarse por DNS pero suelen estar en 1-2 horas.

---

## 📁 Estructura del proyecto

```
amepsin-web/
├── index.html              ← Página principal (todo está aquí)
├── CNAME                   ← Dominio personalizado para GitHub Pages
├── README.md               ← Este archivo (instrucciones)
└── img/
    ├── portada/
    │   └── portada.jpg     ← Imagen de hero/portada
    └── instalaciones/
        └── stills_*.jpg    ← Fotos de las instalaciones (10)
```

---

## ✏️ Cómo editar el contenido

Todo el texto y la estructura está en **`index.html`**. Puedes abrirlo con cualquier editor (incluso Bloc de notas) y modificarlo.

### Para cambiar textos
Busca el texto que quieras cambiar (Ctrl+F) y edítalo. Por ejemplo el titular de portada:

```html
<h1>Vuelve a sentirte bien con acompañamiento psicológico profesional</h1>
```

### Para cambiar precios
Busca `$300`, `$400`, `$1,000` y modifica.

### Para añadir más fotos a la galería
1. Coloca la imagen nueva en `img/instalaciones/`.
2. En `index.html` busca la sección `<div class="gallery">` y duplica un bloque:
   ```html
   <div class="gallery-item"><img src="img/instalaciones/NOMBRE_IMAGEN.jpg" alt="Descripción" loading="lazy"></div>
   ```

### Para usar tus capturas reales de reseñas
Tienes **33 capturas de reseñas reales** en tu Drive. Si quieres mostrarlas en lugar de los testimonios escritos:

1. Crea la carpeta `img/testimonios/` dentro del proyecto.
2. Sube ahí las capturas con nombres como `resena-01.png`, `resena-02.png`, etc.
3. Reemplaza la sección `<section class="alt testimonios" id="testimonios">` por una galería de imágenes (similar a la de Instalaciones).
4. *⚠️ Antes de publicarlas, asegúrate de tener consentimiento de los pacientes y oculta nombres/datos personales.*

### Para cambiar el logo
Actualmente uso un círculo azul con la letra "A" como logo provisional. Cuando tengas el logo oficial:

1. Sube el archivo (idealmente PNG con fondo transparente) a `img/logo/logo.png`.
2. En `index.html` busca el bloque `<div class="logo-mark">A</div>` y reemplázalo por:
   ```html
   <div class="logo-mark"><img src="img/logo/logo.png" alt="AMEPSIN" style="width:100%;height:100%;object-fit:contain;background:transparent"></div>
   ```
3. Quita el `background` gradient del CSS `.logo-mark` si el logo no es circular.

### Para añadir o quitar preguntas del FAQ
En la sección `<div class="faq">` cada pregunta es un bloque:

```html
<div class="faq-item">
  <div class="faq-question">¿Pregunta aquí?</div>
  <div class="faq-answer"><p>Respuesta aquí.</p></div>
</div>
```

Copia, pega y modifica.

---

## 🛠️ Características incluidas

- ✅ Diseño responsive (móvil, tablet, escritorio)
- ✅ Navegación fluida con scroll suave
- ✅ Menú hamburguesa en móvil
- ✅ Galería con lightbox (click para ampliar, teclas ← → para navegar, Esc para cerrar)
- ✅ FAQ con acordeón (clic para abrir/cerrar)
- ✅ Botones flotantes de WhatsApp y llamada (móvil y escritorio)
- ✅ Mapa de Google Maps integrado
- ✅ Iconos de redes sociales (Instagram, Facebook)
- ✅ Optimizado para SEO (meta tags, alt en imágenes, semántica HTML)
- ✅ Fuentes Google Fonts (Inter + Playfair Display)
- ✅ Carga rápida (imágenes optimizadas, sin frameworks pesados)
- ✅ Sin dependencias de servidor — funciona como sitio estático

---

## 📝 Notas finales

- **Logo**: ahora muestra el texto "AMEPSIN" con un círculo azul como marcador. Cuando me pases el logo oficial lo integro.
- **Reseñas escritas**: los 6 testimonios de la sección "Reseñas" son textos representativos. Puedes reemplazarlos por reseñas reales (con permiso del paciente) o por capturas de pantalla anonimizadas.
- **Email del formulario**: por ahora la web no tiene formulario de contacto interno (el botón principal abre WhatsApp, que es más directo y lo que pediste). Si más adelante quieres añadir un formulario de email, te lo conecto con un servicio gratuito tipo Formspree.

---

## ❓ ¿Algo no funciona?

Errores comunes:

- **"GitHub Pages no carga"**: espera 5 min más. Verifica en Settings → Pages que aparezca el mensaje verde "Your site is live at...".
- **"El dominio no apunta a mi web"**: los cambios DNS de GoDaddy tardan hasta 24h. Mientras tanto usa la URL `TU-USUARIO.github.io/amepsin-web/`.
- **"HTTPS no está disponible"**: GitHub necesita verificar el dominio primero. Cuando aparezca activable la opción "Enforce HTTPS", márcala.

Si algo se atasca, dime exactamente qué pasa y lo solucionamos.
