# Guía de Despliegue Global (Acceso Mundial con HTTPS) — Legión Fénix

Esta guía detalla cómo publicar la plataforma **Legión Fénix** en la nube para que jugadores, representantes, entrenadores, fisioterapeutas, analistas administrativos e hinchada accedan desde cualquier país o teléfono móvil con dominio propio y certificado SSL (`https://`).

---

## Arquitectura Recomendada en Producción

| Capa | Servicio Cloud Recomendado | Carpeta del Repositorio | Función Principal |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | **Neon.tech** o **Supabase** (PostgreSQL gestionado) | `backend/database/` | Persistencia relacional de jugadores, evaluaciones, finanzas, clínica y agenda 3D |
| **Media & Videos** | **Cloudinary** | `backend/src/config/cloudinary.js` | Fotos de carnet, comprobantes de Pago Móvil y videos móviles del evaluador (`MP4/MOV/WEBM`) |
| **Backend API** | **Render**, **Railway** o **Fly.io** (Node.js) | `backend/` | API REST Express, JWT/RBAC, subida de archivos y análisis comparativo de video |
| **Frontend Web** | **Vercel** (Next.js) | `frontend/` | Portales modulares, Simulador 2D, Cancha 3D, Tienda Oficial y responsive móvil |

---

## Paso 1: Crear la Base de Datos PostgreSQL en la Nube

1. Crea una cuenta en **Neon.tech** o **Supabase** y genera un nuevo proyecto PostgreSQL (región recomendada: US East o la más cercana a tus usuarios).
2. Copia la cadena de conexión **`DATABASE_URL`** (formato `postgresql://usuario:clave@host/neondb?sslmode=require`).
   > Nota: [db.js](backend/src/config/db.js) ya detecta automáticamente conexiones externas mediante `DATABASE_URL` y habilita `ssl: { rejectUnauthorized: false }`.
3. Inicializa las tablas y categorías oficiales ejecutando desde tu PC (en `backend/`) usando temporalmente la URL de la nube:

```powershell
cd "c:\Users\josma\Desktop\Legion Fenix\backend"
$env:DATABASE_URL="postgresql://usuario:clave@host/legion_fenix?sslmode=require"
node database/initDb.js
```

> Alternativa manual: Copia y ejecuta primero [schema.sql](backend/database/schema.sql) y luego [seed.sql](backend/database/seed.sql) en el **SQL Editor** de Neon/Supabase.

---

## Paso 2: Configurar Cloudinary (Imágenes, Comprobantes y Videos Móviles)

Los servidores Node.js en la nube (Render/Railway/Fly) usan discos efímeros: si se reinician, cualquier archivo guardado en `/uploads` local se borra. Por eso en producción global es **obligatorio** activar Cloudinary:

1. Crea una cuenta gratuita en **cloudinary.com**.
2. En el Dashboard copia:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. El backend ya soporta automáticamente imágenes (`JPG`, `PNG`, `WEBP`), comprobantes (`PDF`) y videos grabados desde celular (`MP4`, `MOV`, `WEBM`, `M4V`) hasta **100 MB** cuando detecta esas 3 variables.

---

## Paso 3: Desplegar el Backend API (`backend/`) en Render o Railway

1. Sube tu repositorio a GitHub/GitLab (asegurándote de **no subir** `.env`, `.pgdata/` ni `node_modules/`).
2. Crea un nuevo **Web Service** conectado al repositorio:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` *(ejecuta `node server.js`)*
   - **Health Check Path:** `/api/health`
3. Configura las siguientes **Variables de Entorno** en Render/Railway:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://usuario:clave@host/legion_fenix?sslmode=require
JWT_SECRET=<GENERAR_CLAVE_ALEATORIA_DE_64_CARACTERES>
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://legionfenix.vercel.app
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
GEMINI_API_KEY=tu_clave_google_gemini_aistudio
GEMINI_MODEL=gemini-2.5-flash
```

> Consejo: En `JWT_SECRET`, genera una clave criptográfica aleatoria (p. ej. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). No uses claves de desarrollo.
> Puedes colocar múltiples orígenes separados por coma en `FRONTEND_URL` (ejemplo: `https://clublegionfenix.com,https://www.clublegionfenix.com`).

4. Una vez desplegado, anota la URL pública HTTPS de tu API, por ejemplo: `https://legion-fenix-api.onrender.com`. Prueba abrir `/api/health` en tu navegador para confirmar `"status": "ok"`.

---

## Paso 4: Desplegar el Frontend Next.js (`frontend/`) en Vercel

1. En **vercel.com**, importa el mismo repositorio y selecciona:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** *(dejar por defecto para Next.js)*
2. Agrega la variable de entorno en Vercel:

```env
NEXT_PUBLIC_API_URL=https://legion-fenix-api.onrender.com/api
```

3. Haz clic en **Deploy**. Cuando Vercel te entregue el dominio (`https://tu-proyecto.vercel.app`), vuelve al panel de tu Backend (Render/Railway) y actualiza `FRONTEND_URL` para que coincida exactamente (sin `/` al final) y reinicia el servicio backend.

---

## Paso 5: Dominio Personalizado y Checklist de Seguridad Global

1. **Dominio propio (opcional):** Conecta tu dominio (ej. `www.clublegionfenix.com`) desde *Settings → Domains* en Vercel y apunta los registros DNS (`A` / `CNAME`) indicados; Vercel emite el certificado SSL/HTTPS global de forma automática y gratuita. Si usas subdominio para el backend (`api.clublegionfenix.com`), agrégalo igual en Render/Railway y actualiza `NEXT_PUBLIC_API_URL` y `FRONTEND_URL`.
2. **Rotación obligatoria de claves iniciales:**
   - Nada más iniciar sesión en producción, entra como Administrador en **`/admin` → Gestión de Usuarios y Permisos** y crea un nuevo usuario Administrador personal con una contraseña fuerte validada en **Verde** por el Semáforo (`8–20` caracteres, mayúsculas, minúsculas, números y símbolos) o actualiza el registro en base de datos, desactivando cuentas de prueba.
3. **Verificación de Pago Móvil y Carga Móvil:**
   - Realiza un pedido o abono real de prueba desde un teléfono móvil verificando que `/assets/qr-pago-movil.png` cargue nítido, el capture suba directo a Cloudinary y el video móvil MP4/MOV del evaluador se procese sin errores de CORS ni timeouts.
4. **Respaldos y Monitoreo:**
   - Activa snapshots diarios en Neon/Supabase y vigila los logs HTTP en Render/Railway + Analytics en Vercel.
