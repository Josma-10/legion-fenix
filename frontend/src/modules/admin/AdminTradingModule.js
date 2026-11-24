import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Send,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Code2,
  Wallet,
  Activity,
  Key,
  Volume2,
  VolumeX,
  HelpCircle,
  Smartphone,
  Clock,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';

export default function AdminTradingModule({ isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPair, setSelectedPair] = useState('SOLUSDT');
  const [analyzing, setAnalyzing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Estados de Configuración y Telegram
  const [editCapitalBs, setEditCapitalBs] = useState('');
  const [editTasa, setEditTasa] = useState('');
  const [botToken, setBotToken] = useState('');
  const [adminTelegramId, setAdminTelegramId] = useState('');

  // Estados de Conexión Binance
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');

  // Modales
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showRetiroModal, setShowRetiroModal] = useState(false);
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const prevSignalRef = useRef(null);

  // Sonido sintético de alerta vía Web Audio API
  const playAlertSound = useCallback((tipo) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (tipo === 'COMPRA') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      } else {
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.15); // C5
      }
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext no disponible o silenciado
    }
  }, [soundEnabled]);

  const fetchStatus = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/admin/trading/status');
      if (res.data && res.data.success) {
        setData(res.data);
        if (!editCapitalBs) setEditCapitalBs(res.data.config.capital_asignado_bs);
        if (!editTasa) setEditTasa(res.data.config.tasa_bs_usdt);
        if (res.data.config.par_activo) setSelectedPair(res.data.config.par_activo);
        if (!botToken && res.data.config.telegram_bot_token) {
          setBotToken(res.data.config.telegram_bot_token);
        }
        if (!adminTelegramId && res.data.config.telegram_admin_id) {
          setAdminTelegramId(res.data.config.telegram_admin_id);
        }

        // Detección de nueva señal para sonido
        const currSignal = res.data.mercado?.senal;
        if (currSignal && currSignal !== 'ESPERAR' && currSignal !== prevSignalRef.current) {
          prevSignalRef.current = currSignal;
          playAlertSound(currSignal === 'COMPRAR' ? 'COMPRA' : 'VENTA');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el motor de trading.');
    } finally {
      setLoading(false);
    }
  }, [editCapitalBs, editTasa, adminTelegramId, playAlertSound]);

  useEffect(() => {
    fetchStatus();
    // Sondeo de mercado cada 20 segundos para monitoreo constante
    const timer = setInterval(() => {
      fetchStatus();
    }, 20000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Iniciar / Detener Motor
  const handleToggleMotor = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/toggle');
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo alternar el estado del motor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Forzar análisis instantáneo
  const handleAnalizar = async (pairToAnalyze) => {
    setAnalyzing(true);
    setError('');
    try {
      const target = pairToAnalyze || selectedPair;
      const res = await api.post('/admin/trading/analizar', { symbol: target });
      if (res.data.success && data) {
        setData((prev) => ({
          ...prev,
          mercado: res.data.analisis,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al analizar el mercado.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Guardar Parámetros de Capital y Tasa
  const handleGuardarConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        capital_asignado_bs: Number(editCapitalBs),
        tasa_bs_usdt: Number(editTasa),
        par_activo: selectedPair,
      };
      if (botToken) payload.telegram_bot_token = botToken;
      if (adminTelegramId) payload.telegram_admin_id = adminTelegramId;

      const res = await api.post('/admin/trading/config', payload);
      if (res.data.success) {
        setSuccess('Configuración guardada y sincronizada.');
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar configuración.');
    } finally {
      setActionLoading(false);
    }
  };

  // Probar Alerta en Telegram
  const handleTestTelegram = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/test-telegram', {
        bot_token: botToken,
        admin_id: adminTelegramId,
      });
      if (res.data.success) {
        setSuccess('¡Alerta de prueba entregada exitosamente a tu Telegram!');
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar la alerta de prueba a Telegram.');
    } finally {
      setActionLoading(false);
    }
  };

  // Detectar y Vincular Telegram automáticamente desde /getUpdates
  const handleDetectarTelegram = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get('/admin/trading/detectar-telegram-id');
      if (res.data.encontrado) {
        setSuccess(res.data.message);
        setAdminTelegramId(res.data.chat_id);
        fetchStatus();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo detectar el ID de Telegram.');
    } finally {
      setActionLoading(false);
    }
  };

  // Disparar Guía de Retiro BDV a Telegram
  const handleNotificarRetiroTelegram = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/notificar-retiro-telegram');
      if (res.data.success) {
        setSuccess('¡Instrucciones de retiro enviadas directamente a tu chat de Telegram!');
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar la notificación de retiro a Telegram.');
    } finally {
      setActionLoading(false);
    }
  };

  // Conectar con cartera real de Binance
  const handleConectarBinance = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/conectar-binance', {
        api_key: binanceKey,
        api_secret: binanceSecret,
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setShowBinanceModal(false);
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con Binance API.');
    } finally {
      setActionLoading(false);
    }
  };

  // Ejecutar orden manual / simulada
  const handleEjecutarOrden = async (accion) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/simular-orden', {
        accion,
        par: selectedPair,
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al ejecutar orden.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card-fenix p-6 text-center text-neutral-400">
        <ShieldAlert className="w-12 h-12 text-rojo-fuego mx-auto mb-2" />
        <h3 className="text-lg font-bold text-white">Módulo Exclusivo para Administrador Principal</h3>
        <p className="text-xs mt-1">No posees los privilegios requeridos para visualizar esta herramienta.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="card-fenix p-12 text-center text-neutral-400">
        <RefreshCw className="w-8 h-8 animate-spin text-rojo-fuego mx-auto mb-2" />
        <p className="text-xs">Cargando métricas de mercado y motor de trading...</p>
      </div>
    );
  }

  const config = data?.config || {};
  const mercado = data?.mercado || {};
  const posicion = data?.posicion || {};
  const binance = data?.binance || {};
  const historial = data?.historial || [];

  const isMinimoBinanceOk = (config.capital_disponible_usdt || 0) >= 5.2;

  const PROMPT_MAESTRO_TEXT = `Actúa como un Arquitecto de Software FinTech Senior y Analista Cuantitativo (Quant) especializado en sistemas de trading algorítmico, microestructura de mercado y gestión de riesgos.

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
- Modo Simulación (Sandbox) por defecto.`;

  return (
    <div className="space-y-6">
      
      {/* BANNER SUPERIOR CON INDICADOR DE ESTADO & CONTROLES PRINCIPALES */}
      <div className="card-fenix p-5 border-l-4 border-l-amber-500 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Admin Only • FinTech Cuantitativo
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                config.modo_simulacion
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {config.modo_simulacion ? 'Modo Simulación (Testnet)' : 'Modo Operación Real'}
            </span>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
              className="p-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
            </button>
          </div>
          <h2 className="font-display text-2xl font-black text-white uppercase italic">
            Monitor de Flujo de Órdenes & Alertas en Tiempo Real
          </h2>
          <p className="text-xs text-neutral-400">
            Escaneo continuo cada 25s en Binance Spot, conexión directa a carteras y alertas instantáneas a Telegram.
          </p>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleToggleMotor}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition shadow-lg ${
              config.activo
                ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:brightness-110 border border-emerald-400/40'
            }`}
          >
            {config.activo ? (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                <span>Pausar Escáner</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                <span>Iniciar Escáner Continuo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowBinanceModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{binance.conectado ? 'Cartera Binance Conectada' : 'Conectar Binance'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRetiroModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Retiro BDV (0102)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPromptModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition"
          >
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Prompt Maestro</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/70 border border-red-600 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> {error}
          </span>
          <button onClick={() => setError('')} className="text-xs underline ml-2">Cerrar</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/70 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {success}
          </span>
          <button onClick={() => setSuccess('')} className="text-xs underline ml-2">Cerrar</button>
        </div>
      )}

      {/* METRICAS CLAVE DE CAPITAL & ESTADO OPERATIVO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Saldo Asignado en Bolívares */}
        <div className="card-fenix p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Presupuesto Bs.</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
            Bs. {Number(config.capital_asignado_bs || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
            Tasa: Bs. {Number(config.tasa_bs_usdt || 54.20).toFixed(2)} por USDT
          </span>
        </div>

        {/* Equivalente en USDT & Regla de 5.2 USDT */}
        <div className="card-fenix p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Capital en USDT</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            ${Number(config.capital_disponible_usdt || 0).toFixed(2)} <span className="text-xs font-sans text-neutral-400 font-normal">USDT</span>
          </p>
          <span className={`text-[10px] font-bold block mt-0.5 ${isMinimoBinanceOk ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isMinimoBinanceOk ? '✓ Cumple mínimo Binance (≥ 5.2 USDT)' : '⚠️ Menor a 5.2 USDT requerido'}
          </span>
        </div>

        {/* Estado del Motor Continuo */}
        <div className="card-fenix p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Escaneo Continuo</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${config.activo ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`}></span>
            <span className="font-display text-xl font-bold text-white uppercase">
              {config.activo ? 'Escaneando Cada 25s' : 'Detenido / En Pausa'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            {config.telegram_configured ? 'Alertas Telegram: Activas ✓' : 'Falta configurar Telegram ⚠️'}
          </span>
        </div>

        {/* Posición Actual / PnL */}
        <div className="card-fenix p-4 border-l-4 border-l-rojo-fuego">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Posición en Mercado</span>
            <TrendingUp className="w-4 h-4 text-rojo-fuego" />
          </div>
          <p className="font-display text-2xl font-black text-white mt-1">
            {posicion.abierta ? (
              <span className="text-amber-400">ABIERTA ({posicion.cantidad_cripto} {selectedPair.replace('USDT', '')})</span>
            ) : (
              <span className="text-neutral-400">EN LIQUIDEZ (USDT)</span>
            )}
          </p>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            {posicion.abierta ? `Precio entrada: $${posicion.precio_entrada}` : 'Esperando señal técnica real'}
          </span>
        </div>

      </div>

      {/* SECCIÓN PRINCIPAL: TABLERO CUANTITATIVO EN VIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel Izquierdo (8 cols): Métricas de Flujo de Órdenes & Gráfico de Presión */}
        <div className="lg:col-span-8 card-fenix p-5 space-y-5">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-neutral-400 uppercase">Par Monitoreado:</span>
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {(config.pares_disponibles || ['SOLUSDT', 'BTCUSDT', 'ETHUSDT', 'BNBUSDT']).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPair(p);
                      handleAnalizar(p);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedPair === p
                        ? 'bg-rojo-fuego text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p.replace('USDT', '/USDT')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={analyzing}
              onClick={() => handleAnalizar(selectedPair)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-amber-400' : ''}`} />
              <span>Analizar Ahora</span>
            </button>
          </div>

          {/* Resumen de Precio y Variación */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Precio Spot Actual</span>
              <span className="font-display text-2xl font-black text-white">
                ${Number(mercado.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Variación 24h</span>
              <span
                className={`font-display text-2xl font-black flex items-center gap-1 ${
                  (mercado.cambio24h || 0) >= 0 ? 'text-emerald-400' : 'text-rojo-fuego'
                }`}
              >
                {(mercado.cambio24h || 0) >= 0 ? '+' : ''}
                {Number(mercado.cambio24h || 0).toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Rango 24h Alto / Bajo</span>
              <span className="text-xs font-mono font-bold text-neutral-300">
                ${Number(mercado.high24h || 0).toFixed(2)} / ${Number(mercado.low24h || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">RSI (14 Periodos)</span>
              <span
                className={`font-display text-2xl font-black ${
                  (mercado.rsi || 50) > 70
                    ? 'text-rojo-fuego'
                    : (mercado.rsi || 50) < 30
                    ? 'text-emerald-400'
                    : 'text-amber-300'
                }`}
              >
                {mercado.rsi || 50}
              </span>
            </div>
          </div>

          {/* BARRA DE PRESIÓN DE COMPRA VS VENTA (ORDER BOOK IMBALANCE) */}
          <div className="space-y-2 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Presión Compradora (Bids): {mercado.presion_compra || 50}%
              </span>
              <span className="text-rojo-fuego flex items-center gap-1.5">
                Presión Vendedora (Asks): {mercado.presion_venta || 50}% <TrendingDown className="w-4 h-4" />
              </span>
            </div>

            <div className="w-full h-4 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                style={{ width: `${mercado.presion_compra || 50}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-700 transition-all duration-500"
                style={{ width: `${mercado.presion_venta || 50}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Calculado en base a la profundidad acumulada de los 20 mejores niveles del libro de órdenes oficial de Binance.
            </p>
          </div>

          {/* TARJETA DE RECOMENDACIÓN & SIGNAL SCORE */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase">Señal Detectada:</span>
                <span
                  className={`px-3 py-1 rounded-lg font-display text-lg font-black uppercase tracking-wider ${
                    mercado.senal === 'COMPRAR'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : mercado.senal?.includes('VENTA')
                      ? 'bg-red-500/20 text-rojo-fuego border border-red-500/40 animate-pulse'
                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  {mercado.senal || 'ESPERAR'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400">Score de Confianza:</span>
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-sm border border-amber-500/30">
                  {mercado.score || 50} / 100
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white">Fundamento Cuantitativo:</strong> {mercado.razon || 'Evaluando condiciones de mercado.'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80 text-xs font-mono">
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] uppercase">Stop-Loss Sugerido (-{config.stop_loss_pct || 1.5}%)</span>
                <span className="font-bold text-rojo-fuego">${mercado.stop_loss || '0.00'}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] uppercase">Take-Profit Sugerido (+{config.take_profit_pct || 2.5}%)</span>
                <span className="font-bold text-emerald-400">${mercado.take_profit || '0.00'}</span>
              </div>
            </div>

            {/* Botones de Acción Manual Inmediata */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleEjecutarOrden('COMPRA')}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow transition"
              >
                Comprar {selectedPair.replace('USDT', '')} ({config.modo_simulacion ? 'Simulado' : 'Real'})
              </button>
              <button
                type="button"
                disabled={actionLoading || !posicion.abierta}
                onClick={() => handleEjecutarOrden('VENTA')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  posicion.abierta
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white hover:brightness-110 shadow'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                Cerrar Posición / Vender
              </button>
            </div>
          </div>

        </div>

        {/* Panel Derecho (4 cols): Configuración de Presupuesto, Tasa & Telegram */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Ajuste de Presupuesto y Tasa */}
          <div className="card-fenix p-5 space-y-4">
            <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Presupuesto & Tasa
            </h3>

            <form onSubmit={handleGuardarConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  Capital en Bolívares (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editCapitalBs}
                  onChange={(e) => setEditCapitalBs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-rojo-fuego"
                  placeholder="Ej: 10000"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  Tasa de Referencia (Bs. / USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editTasa}
                  onChange={(e) => setEditTasa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-rojo-fuego"
                  placeholder="Ej: 54.20"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
                <span>Equivalente: </span>
                <strong className="text-emerald-400">
                  ${editTasa > 0 ? (editCapitalBs / editTasa).toFixed(2) : '0.00'} USDT
                </strong>
                {editTasa > 0 && editCapitalBs / editTasa < 5.2 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    ⚠️ Debe ser al menos 5.2 USDT para cumplir la orden mínima de Binance.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-rojo-fuego text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow transition"
              >
                Actualizar Presupuesto
              </button>
            </form>
          </div>

          {/* Configuración de Alertas Telegram con Asistente Rápido */}
          <div className="card-fenix p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" /> Alertas a Telegram
              </h3>
              {config.telegram_configured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" /> Bot Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" /> Pendiente Vincular
                </span>
              )}
            </div>

            {/* Asistente Rápido de 2 Pasos */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/40 via-neutral-900 to-indigo-950/40 border border-blue-500/25 space-y-2.5">
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" /> Conexión Instantánea con tu Bot:
              </div>

              {/* Paso 1: Abrir el Bot */}
              <a
                href="https://t.me/LegionFenixbot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-semibold transition group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Abrir <strong>@LegionFenixbot</strong> y pulsar <strong>INICIAR</strong></span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Paso 2: Detección automática en 1 Clic */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDetectarTelegram}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>2. Detectar y Vincular Mi Telegram Automáticamente</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="9292349620:AAHIEIX7fLe8Lc7XTrSCpTz35TlNKqrs7dI"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  Telegram Admin ID (Numérico)
                </label>
                <input
                  type="text"
                  value={adminTelegramId}
                  onChange={(e) => setAdminTelegramId(e.target.value)}
                  placeholder="Se detecta automáticamente al pulsar el botón azul"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleGuardarConfig}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition"
                >
                  Guardar ID
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleTestTelegram}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold transition hover:brightness-110 shadow flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3" /> Probar Alerta
                </button>
              </div>

              {/* Botón directo de ayuda */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowTelegramHelp(true)}
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" /> Ver Asistente Completo
                </button>
                <a
                  href="https://t.me/LegionFenixbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-mono"
                >
                  @LegionFenixbot
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* HISTORIAL DE OPERACIONES Y SEÑALES RECIENTES */}
      <div className="card-fenix p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Registro de Operaciones & Señales Ejecutadas
          </h3>
          <span className="text-xs text-neutral-400">Total registradas: {historial.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-900/60 border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Par</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Precio Spot</th>
                <th className="py-2.5 px-3">Monto (USDT / Bs.)</th>
                <th className="py-2.5 px-3">Presión Compra</th>
                <th className="py-2.5 px-3">RSI</th>
                <th className="py-2.5 px-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {historial.map((op) => (
                <tr key={op.id} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                    {new Date(op.fecha).toLocaleString('es-VE')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">{op.par}</td>
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        op.tipo?.includes('COMPRA')
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-rojo-fuego border border-red-500/30'
                      }`}
                    >
                      {op.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">${Number(op.precio).toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    ${Number(op.monto_usdt).toFixed(2)} <span className="text-neutral-500">({Number(op.equivalente_bs).toFixed(0)} Bs.)</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">{op.presion_compra}%</td>
                  <td className="py-2.5 px-3 font-sans">{op.rsi}</td>
                  <td className="py-2.5 px-3 font-sans font-bold text-neutral-200">{op.resultado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASISTENTE EN 1 MINUTO PARA TELEGRAM BOT */}
      {showTelegramHelp && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-display text-xl font-black text-white uppercase">
                  Cómo Obtener tu Bot Token en 1 Minuto
                </h3>
              </div>
              <button
                onClick={() => setShowTelegramHelp(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <p className="text-neutral-400">
                Telegram exige que el bot sea creado desde tu cuenta personal para garantizar que solo tú tengas control de tus alertas:
              </p>

              <div className="space-y-2.5 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
                  <div>
                    <span className="font-bold text-white">Abre @BotFather:</span>
                    <p className="text-neutral-400">
                      Haz clic en{' '}
                      <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">
                        Abrir @BotFather en Telegram
                      </a>{' '}
                      y pulsa <code>/start</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                  <div>
                    <span className="font-bold text-white">Escribe <code>/newbot</code>:</span>
                    <p className="text-neutral-400">
                      Escribe un nombre (ej: <code>FenixAlerts</code>) y un usuario terminado en <code>bot</code> (ej: <code>LegionFenix_trading_bot</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
                  <div>
                    <span className="font-bold text-white">Copia el Token:</span>
                    <p className="text-neutral-400">
                      Copia el código que te da (algo como <code>78129381:AAH...</code>) y pégalo en la casilla de Bot Token.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">4</span>
                  <div>
                    <span className="font-bold text-white">Obtén tu ID Numérico:</span>
                    <p className="text-neutral-400">
                      Abre{' '}
                      <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-bold">
                        @userinfobot
                      </a>
                      , dale <code>/start</code> y copia tu número de ID.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTelegramHelp(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500"
              >
                Listo, voy a pegarlo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONECTAR A CARTERAS REALES DE CRIPTOMONEDAS (BINANCE SPOT) */}
      {showBinanceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-xl font-black text-white uppercase">
                  Conexión a Carteras de Criptomonedas (Binance)
                </h3>
              </div>
              <button
                onClick={() => setShowBinanceModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <strong>Regla de Seguridad Obligatoria:</strong> Al crear tu API Key en Binance, activa <em>Habilitar lectura</em> y <em>Habilitar trading Spot</em>. <strong>NUNCA marques Habilitar retiros</strong>.
              </div>

              <form onSubmit={handleConectarBinance} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                    Binance API Key
                  </label>
                  <input
                    type="password"
                    value={binanceKey}
                    onChange={(e) => setBinanceKey(e.target.value)}
                    placeholder="Pega tu API Key de Binance"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                    Binance API Secret
                  </label>
                  <input
                    type="password"
                    value={binanceSecret}
                    onChange={(e) => setBinanceSecret(e.target.value)}
                    placeholder="Pega tu Secret de Binance"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href="https://www.binance.com/es/my/settings/api-management"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Crear Clave en Binance
                  </a>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition shadow"
                  >
                    Conectar Cartera Real
                  </button>
                </div>
              </form>

              {binance.saldos && binance.saldos.length > 0 && (
                <div className="pt-3 border-t border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">Saldos Detectados en Cartera:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {binance.saldos.map((s) => (
                      <div key={s.asset} className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex justify-between">
                        <span className="text-white font-bold">{s.asset}:</span>
                        <span className="text-emerald-400">{s.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASISTENTE DE RETIRO A BANCO DE VENEZUELA (0102) CONECTADO A TELEGRAM */}
      {showRetiroModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-xl font-black text-white uppercase">
                  Flujo de Retiro Seguro • Banco de Venezuela
                </h3>
              </div>
              <button
                onClick={() => setShowRetiroModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Disponible a Retirar</span>
                  <span className="font-display text-2xl font-black text-emerald-400">
                    ${Number(config.capital_disponible_usdt || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Monto Estimado en BDV</span>
                  <span className="font-display text-2xl font-black text-white">
                    Bs. {(Number(config.capital_disponible_usdt || 0) * Number(config.tasa_bs_usdt || 54.2)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <strong>Regla de Seguridad Financiera:</strong> Nunca uses bots de automatización de pantalla sobre BDV. El flujo legal y seguro es vía Binance P2P oficial con verificación en BDV en Línea.
              </div>

              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  <strong>Pausar el motor:</strong> Al solicitar retiro, el bot se pausa automáticamente para proteger tus fondos.
                </li>
                <li>
                  <strong>Mover fondos:</strong> Transfiere tus USDT desde billetera <strong>Spot</strong> a <strong>Fondos</strong> en Binance.
                </li>
                <li>
                  <strong>Binance P2P directo:</strong> Abre el mercado P2P filtrando <em>Banco de Venezuela / Pago Móvil</em>.
                </li>
                <li>
                  <strong>Verificación en BDV en Línea:</strong> Confirma con tu app de BDV que el dinero esté acreditado en tu cuenta antes de liberar la criptomoneda.
                </li>
              </ol>

              {/* Botón para enviar guía directamente a Telegram */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleNotificarRetiroTelegram}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow hover:brightness-110 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Guía y Enlace de Retiro a mi Telegram</span>
                </button>

                <a
                  href="https://p2p.binance.com/es/trade/sell/USDT?fiat=VES&payment=BANK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Binance P2P (Filtro Banco de Venezuela)</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRetiroModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider"
              >
                Cerrar Asistente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROMPT MAESTRO COPIABLE PARA IA (CURSOR / WINDSURF) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-display text-xl font-black text-white uppercase">
                  Prompt Maestro para Desarrolladores IA
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Puedes copiar y pegar este prompt en Cursor, Windsurf, Copilot o en un bot para expandir o generar scripts adicionales:
            </p>

            <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-72 overflow-y-auto whitespace-pre-wrap">
              {PROMPT_MAESTRO_TEXT}
            </pre>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-mono">
                Archivo guardado en: MODULO_TRADING_ADMIN_LEGION_FENIX.md
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(PROMPT_MAESTRO_TEXT);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPrompt ? '¡Copiado al portapapeles!' : 'Copiar Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
