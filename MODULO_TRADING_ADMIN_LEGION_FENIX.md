# Especificación Técnica: Módulo de Trading Algorítmico y Alertas (Admin Only) — Legión Fénix

## 1. Objetivo del Módulo
Integrar un submódulo exclusivo para el **Administrador Principal (`role === 'ADMINISTRADOR'`)** dentro de **Legión Fénix** que permita:
1. Monitorear en tiempo real la presión de compra/venta del mercado cripto (Binance Spot) y activos financieros.
2. Ejecutar ciclos simulados o automatizados de compra/venta en mercado Spot con presupuesto configurable en Bolívares (`Bs.`) y equivalente en `USDT`.
3. Controlar el motor tanto desde la **interfaz web de Administración de Legión Fénix** como de forma remota mediante un **Bot privado de Telegram** vinculado únicamente al `TELEGRAM_ADMIN_ID`.
4. Gestionar el flujo de fondeo y retiro hacia el **Banco de Venezuela (0102)** mediante Pago Móvil / Transferencia P2P segura sin exponer permisos de retiro en la API.
5. Arquitectura 100% modular y desacoplada: puede activarse o removerse con un simple switch sin afectar ninguna función del club.

---

## 2. Reglas de Seguridad y Control de Acceso (Estricto)
- **Aislamiento de Rol (RBAC):** Todas las rutas web, endpoints API (`/api/admin/trading/*`) validan estrictamente la sesión activa del Administrador Principal (`ADMINISTRADOR`). Cualquier usuario con otro rol recibe `HTTP 403 Forbidden`.
- **Doble Factor y Whitelist:**
  - El Bot de Telegram ignora cualquier mensaje o comando cuyo `chat_id` / `user_id` no coincida exactamente con `TELEGRAM_ADMIN_ID`.
  - Las claves API de Binance deben configurarse **únicamente** con permisos de *Lectura* y *Spot Trading* (prohibido habilitar *Withdrawals / Retiros*) y restringidas a la IP del servidor.
- **Validación Operativa Venezuela / Binance:**
  - El fondeo `Bs. -> USDT` y el retiro `USDT -> Banco de Venezuela (Pago Móvil)` se realizan mediante flujo asistido con alerta en tiempo real.
  - Validación automática de monto mínimo de Binance Spot (`>= 5.2 USDT` por orden).
  - **Circuit Breaker:** Detención preventiva si la pérdida diaria acumulada supera el `2%` del capital asignado.

---

## 3. Arquitectura e Integración en Legión Fénix

```text
c:\Users\josma\Desktop\Legion Fenix/
├── backend/
│   └── src/
│       └── modules/
│           └── admin/
│               ├── admin.routes.js          # Rutas protegidas checkRole(['ADMINISTRADOR'])
│               └── trading.controller.js    # Motor de lectura de mercado, indicadores y Telegram
├── frontend/
│   └── src/
│       ├── modules/
│       │   └── admin/
│       │       └── AdminTradingModule.js    # Vista visual interactiva Admin Only
│       └── pages/
│           └── admin/
│               └── index.js                 # Pestaña "Trading & Alertas" activable con flag
├── MODULO_TRADING_ADMIN_LEGION_FENIX.md     # Documentación técnica y Prompt Maestro
└── .env                                     # Variables de entorno seguras
```

---

## 4. Variables de Entorno Recomendadas (.env)
```env
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
TELEGRAM_ADMIN_ID=tu_id_numerico_de_telegram
BINANCE_API_KEY=tu_api_key_sin_retiros
BINANCE_API_SECRET=tu_api_secret
TRADING_SANDBOX_MODE=true
```

---

## 5. Prompt Maestro para Entornos IA (Cursor, Windsurf, Copilot)
```plaintext
Actúa como un Arquitecto de Software FinTech Senior y Analista Cuantitativo (Quant) especializado en sistemas de trading algorítmico, microestructura de mercado y gestión de riesgos.

Necesito desarrollar un sistema profesional de monitoreo, análisis de flujo de órdenes y alertas de compra/venta en tiempo real para criptomonedas y acciones, diseñado para operar legalmente desde Venezuela mediante conexiones API oficiales y seguras.

### 1. Arquitectura y Conectividad
- Lenguaje y Stack: Python 3.11+ / Node.js con arquitectura asíncrona, endpoints REST/WebSockets para el panel de Legión Fénix.
- Conectores: Binance Spot API oficial (lectura de libro de órdenes, velas OHLCV, RSI, EMA, CVD).
- Motor de Alertas: Integración Telegram Bot privada para TELEGRAM_ADMIN_ID.

### 2. Lógica Cuantitativa y Tasa de Compra/Venta
1. Presión Compradora vs. Vendedora: Taker Buy Volume vs. Taker Sell Volume y profundidad en el libro de órdenes (Order Book Imbalance).
2. Tendencia: EMAs 9 y 21, RSI 14 con niveles de sobrecompra (>70) y sobreventa (<30).
3. Señales: COMPRA FUERTE (score >= 80), VENTA / TOMA DE GANANCIAS (score <= 20), ESPERAR.
4. Mínimo operativo en Binance: 5.2 USDT por orden.

### 3. Reglas de Seguridad
- Permisos mínimos: Lectura y Spot (CERO retiros).
- Fondeo y retiro hacia Banco de Venezuela mediante flujo P2P verificado.
- Modo Simulación (Sandbox) por defecto.
```
