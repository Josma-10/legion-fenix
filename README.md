# Plataforma Integral Legión Fénix 🔥⚽

Plataforma web desacoplada y organizada por módulos independientes por dominio para la gestión deportiva, médica, fisioterapéutica, financiera, táctica y comunitaria del club y academia **Legión Fénix**.

## 1. Arquitectura y Stack Tecnológico

- **Frontend:** Next.js 14 (React, Pages Router) + Tailwind CSS + Lucide Icons + Axios + `qrcode.react`.
  - Paleta institucional: Negro Grafito (`#121212`), Gris Tarjeta (`#1E1E1E`), Vinotinto (`#7A001E`) y Rojo Fuego (`#D32F2F`).
- **Backend:** Node.js + Express estructurado en módulos independientes por dominio (`modules/<dominio>/{model,service,controller,routes}`), configuración (`config`) y middlewares (`JWT + RBAC`).
- **Base de Datos:** PostgreSQL con esquema relacional normalizado (`backend/database/schema.sql` y `backend/database/seed.sql`), incluyendo 27 categorías en 3 disciplinas (`Equipo de Fútbol Campo`, `Equipo de Fútbol 7`, `Equipo de Sala`, desde `Bebés (Sub-6)` hasta `Libre`).
- **Almacenamiento Multimedia:** Integración con `Multer` + `Cloudinary` (`CLOUDINARY_*`) compatible con fotos, comprobantes PDF/imagen y videos móviles (`MP4`, `MOV`, `WEBM` hasta 100 MB), con respaldo automático en disco local (`backend/uploads/`).
- **Seguridad:** JWT + RBAC de 6 roles (`ADMINISTRADOR`, `ANALISTA_ADMIN`, `ENTRENADOR`, `FISIO`, `REPRESENTANTE`, `ATLETA`) con contraseñas cifradas en Bcrypt (10 rondas) y **Semáforo de Seguridad** (`8–20` caracteres, mayúsculas, minúsculas, números y símbolos) en registros y creación de cuentas.

---

## 2. Estructura Modular del Proyecto

```text
Legion Fenix/
├── backend/
│   ├── database/
│   │   ├── schema.sql                    # Esquema DDL completo en PostgreSQL
│   │   ├── seed.sql                      # Datos iniciales (6 roles, 27 categorías, trabajos 2D, tasa BCV, evaluaciones)
│   │   └── initDb.js                     # Script automatizado de creación y poblado (--reset)
│   ├── src/
│   │   ├── config/                       # db.js (SSL cloud auto) y cloudinary.js
│   │   ├── middlewares/                  # auth.js (verifyToken, optionalVerifyToken, checkRole)
│   │   ├── services/                     # bcvService.js (Tasa BCV) y geminiVideoService.js (Google Gemini Video AI)
│   │   ├── modules/
│   │   │   ├── auth/                     # Login unificado, política de clave, registro representante y adulto (+ BCV)
│   │   │   ├── categorias/               # Catálogo de 27 categorías, plantillas + ficha técnica jugador
│   │   │   ├── representantes/           # Expediente completo del atleta, ficha médica, dorsal, stepper
│   │   │   ├── pagos/                    # Semáforo financiero, Pago Móvil oficial + QR + Bs. tasa BCV diaria, aprobación y bloqueo
│   │   │   ├── entrenadores/             # Microciclos, Trabajos 2D + agenda cancha, Simulador 2D (máx 10/cat), Evaluación + IA Gemini Video
│   │   │   ├── fisio/                    # Mapa de lesiones SVG, reportes Coach->Fisio, podología, agenda 2D fisio
│   │   │   ├── admin/                    # Asistencia Check-In/Out, alertas 14d, contabilidad, equilibrio, tienda, usuarios RBAC
│   │   │   └── publico/                  # Portal hinchada, fixtures, noticias, sponsors y tienda oficial (USD + Bs. BCV)
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/assets/                    # Escudo SVG, avatar base y qr-pago-movil.png oficial
│   ├── src/
│   │   ├── components/                   # Shared UI: Navbar, StatusBadge, PasswordStrengthSemaforo, PaymentMethodsBox, Pitch2DBoard
│   │   ├── modules/
│   │   │   ├── auth/                     # LoginForm (con Semáforo visual), RegisterRepresentanteForm, RegisterAdultoForm
│   │   │   ├── categorias/               # DisciplinasGrid, CategoriasExplorerModule (con modal Ficha del Jugador)
│   │   │   ├── jugadores/                # PlayerCardModule (radar hexagonal, mapa influencia, pie hábil, retrato)
│   │   │   ├── representantes/           # PagosSemaforoModule, IndumentariaGpsModule, FichaMedicaViewModule, StepperRegistroAtleta
│   │   │   ├── entrenadores/             # MicrociclosModule, Trabajos3DSchedulerModule (2D derecho), TacticalSimulatorModule (2D + submenú táctico), EvaluacionJugadorModule, CoachLesionesModule, VideosAnalisisModule, PlantillaElegibilidadModule
│   │   │   ├── fisio/                    # FisioResumenCards, InjuryBodyMapModule (alertas Entrenador), PodologiaBiometriaModule
│   │   │   ├── admin/                    # AdminAccesosModulosBanner, AdminUsuariosPermisosModule, AdminAsistenciaModule, AdminFinanzasEquilibrioModule, AdminCobranzasTiendaModule
│   │   │   ├── publico/                  # HeroSliderModule, FixturePublicModule, NoticiasMuralModule
│   │   │   └── tienda/                   # TiendaOficialModule (Carrito + Pago Móvil oficial QR + Bs. BCV + Verificación)
│   │   ├── pages/
│   │   │   ├── index.js                  # Portal Público (Hinchada, Tienda y Disciplinas)
│   │   │   ├── login.js                  # Autenticación Unificada y Nuevo Registro
│   │   │   ├── categorias/index.js       # Explorador Independiente de Categorías y Plantillas
│   │   │   ├── portal-padres/index.js    # Portal Representantes y Atletas Mayores
│   │   │   ├── portal-coach/index.js     # Portal Entrenadores, Trabajos 2D, Simulador 2D y Evaluador
│   │   │   ├── portal-fisio/index.js     # Portal Fisioterapia, Lesiones, Podología y Ejercicios 2D
│   │   │   └── admin/index.js            # Centro de Comando Administrativo y Analista Admin
│   │   ├── styles/globals.css
│   │   └── utils/                        # api.js, auth.js, bcv.js, categories.js, media.js, tacticalMoves.js
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
├── DEPLOY_GLOBAL.md                      # Guía completa para publicar en la nube con acceso mundial HTTPS
└── README.md
```

---

## 3. Instalación y Puesta en Marcha Local

### Paso 1: Configurar el Backend y Base de Datos PostgreSQL

1. Copia `backend/.env.example` a `backend/.env` y ajusta tus credenciales de PostgreSQL (`DB_USER`, `DB_PASSWORD`, `DB_NAME=legion_fenix`, `DB_PORT=5433`).
2. Instala dependencias e inicializa la base de datos:

```powershell
cd "c:\Users\josma\Desktop\Legion Fenix\backend"
npm install
npm run db:init
```

3. Inicia el servidor API (puerto `4000`):

```powershell
npm run dev
```

### Paso 2: Configurar e Iniciar el Frontend

1. Opcionalmente copia `frontend/.env.example` a `frontend/.env.local` (por defecto apunta a `http://localhost:4000/api`).
2. Instala dependencias y arranca Next.js (puerto `3000`):

```powershell
cd "c:\Users\josma\Desktop\Legion Fenix\frontend"
npm install
npm run dev
```

---

## 4. Despliegue Global en Producción (Acceso Mundial)

Para alojar **Legión Fénix** en Internet con dominio propio, HTTPS y soporte multimedia global desde cualquier teléfono móvil (Vercel + Render/Railway + Neon/Supabase + Cloudinary), consulta la guía paso a paso en [DEPLOY_GLOBAL.md](./DEPLOY_GLOBAL.md).

> **Política de Seguridad:** El acceso al sistema nunca exhibe contraseñas administrativas ni credenciales de prueba en la interfaz de inicio de sesión. Las cuentas base de desarrollo están definidas únicamente en `backend/database/seed.sql` y deben rotarse antes de salir a producción.

---

## 5. Módulos Separados del Sistema

1. **Módulo Público & Tienda Oficial (`/`):** Hero slider, cronómetro en vivo, resumen de 27 categorías, fixture filtrable, carrito con monto automático en USD + Bolívares (`Bs.`) calculado al vuelo con la **tasa oficial del BCV del día** y checkout verificado mediante **Pago Móvil Banco de Venezuela + QR oficial**, referencia bancaria, teléfono y capture de pantalla.
2. **Módulo Categorías y Disciplinas (`/categorias`):** Gestión y exploración dedicada de las 27 categorías (`Equipo de Fútbol Campo`, `Equipo de Fútbol 7`, `Equipo de Sala`, desde `Bebés (Sub-6)` hasta `Libre`) con apertura interactiva de la **Información del Jugador** (radar hexagonal, pie hábil, heatmap y foto).
3. **Módulo Autenticación y Nuevo Registro (`/login`):** Login unificado con **Semáforo de Clave** (`8–20` chars, mayúscula, minúscula, número, símbolo) + registro dual (`Representante` para menores y auto-inscripción `Mayor de Edad` para `Sub-20`/`Libre` con cálculo automático BCV del arancel de inscripción).
4. **Módulo Representantes y Atletas (`/portal-padres`):** Pagos con monto pendiente exacto calculado automáticamente en **USD y Bs. (tasa BCV del día)**, QR oficial y datos copiables, semáforo financiero (`Solvente`, `Pendiente`, `Moroso` con bloqueo de convocatorias), Información del Jugador, ejercicios asignados (solo lectura), stepper de 5 etapas, indumentaria/GPS y ficha médica.
5. **Módulo Entrenadores (`/portal-coach`):** Organizado en submódulos independientes: Microciclos por bloque, **Trabajos 2D & Control de Espacios** (pizarra plana y derecha 2D con todas las 27 categorías y disponibilidad de cancha en primer plano, superficies distintas para Campo/F7/Sala y escenarios desde `1v1` hasta `22 jugadores`), **Tabla de Juego 2D** (carga inmediata al seleccionar + **Submenú de Movimientos Instantáneos**: Línea de Balón, Línea Recta, Zig-Zag, Subir y Bajar a Defender, Patear al Arco, máx. **10 formaciones por categoría**), **Evaluación del Jugador** (`0–10` + carga/análisis de video móvil conectado a la tarjeta del jugador), **Reporte de Lesiones a Fisio** y elegibilidad.
6. **Módulo Fisioterapia (`/portal-fisio`):** KPIs clínicos, recepción de alertas de lesiones reportadas por Entrenadores (`Partido`/`Entrenamiento`), mapeo anatómico SVG interactivo, evolución y `Alta Médica` exclusiva del fisio, editor podológico/biométrico y **Ejercicios Fisio 2D** en pizarra plana compartida por hora con Entrenadores.
7. **Módulo Administrativo y Analista Administrativo (`/admin`):** Separación granular por rol: `ADMINISTRADOR` controla gestión de usuarios/roles, parámetros estructurales de cuadrantes y auditoría total; `ANALISTA_ADMIN` gestiona asistencia Check-In/Out, alertas 14d, libro contable y verificación de pagos/tienda (con tasa BCV y monto Bs. auditado) sin acceso a edición clínica, táctica o permisos.

