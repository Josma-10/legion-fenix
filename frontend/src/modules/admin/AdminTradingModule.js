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
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
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
      if (res.data?.success) {
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
  }, [editCapitalBs, editTasa, botToken, adminTelegramId, playAlertSound]);

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
      const res = await api.post('/admin/trading/analizar', {
        symbol: pairToAnalyze || selectedPair,
      });
      if (res.data.success) {
        setData((prev) => (prev ? { ...prev, mercado: res.data.analisis } : prev));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al consultar análisis de mercado.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Guardar configuración de tasa, capital y telegram
  const handleGuardarConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/config', {
        tasa_bs_usdt: Number(editTasa),
        capital_asignado_bs: Number(editCapitalBs),
        par_activo: selectedPair,
        telegram_bot_token: botToken,
        telegram_admin_id: adminTelegramId,
      });
      if (res.data.success) {
        setSuccess('Configuración y credenciales guardadas exitosamente.');
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la configuración.');
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar mensaje de prueba a Telegram
  const handleTestTelegram = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/trading/test-telegram');
      if (res.data.success) {
        setSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar mensaje de prueba a Telegram.');
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
        setSuccess(res.data.message);
        setShowRetiroModal(false);
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
      <div className="phoenix-card p-8 text-center text-neutral-400">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Módulo Exclusivo para Administrador Principal</h3>
        <p className="text-xs text-neutral-400 mt-1">No posees los privilegios requeridos para visualizar esta sección.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="phoenix-card p-12 text-center text-neutral-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-neutral-300">Cargando métricas de tesorería y mercado en tiempo real...</p>
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
    <div className="space-y-5 animate__animated animate__fadeIn">
      
      {/* ENCABEZADO INSTITUCIONAL ESTILO BIENES PÚBLICOS (PHOENIX ADMIN) */}
      <div className="phoenix-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Tesorería y Monitoreo Financiero
              </h2>
              <span className="badge-phoenix bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Dirección Administrativa
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Sistema de Gestión de Liquidez, Alertas Oficiales en Tiempo Real y Retiros a Banco de Venezuela
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Badge de Estado del Sistema */}
            <div className="badge-phoenix bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>{config.activo ? 'Sistema Activo' : 'Sistema en Línea'}</span>
            </div>

            {/* Modalidad Operativa */}
            <span
              className={`badge-phoenix px-3 py-1.5 border ${
                config.modo_simulacion
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {config.modo_simulacion ? 'Modo Simulación (Testnet)' : 'Operación Real'}
            </span>

            {/* Alternar Sonido */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
              className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            {/* Botón Iniciar / Pausar Motor */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleToggleMotor}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm ${
                config.activo
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {config.activo ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pausar Escáner</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>Iniciar Escáner</span>
                </>
              )}
            </button>

            {/* Acciones Rápidas */}
            <button
              type="button"
              onClick={() => setShowRetiroModal(true)}
              className="px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Retiro BDV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBinanceModal(true)}
              className="px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{binance.conectado ? 'Binance Conectado' : 'Conectar Binance'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Code2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Documentación</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> {error}
          </span>
          <button onClick={() => setError('')} className="text-xs underline hover:text-white">Cerrar</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {success}
          </span>
          <button onClick={() => setSuccess('')} className="text-xs underline hover:text-white">Cerrar</button>
        </div>
      )}

      {/* KPI METRIC CARDS (ESTILO OFICIAL INICIO.HTML DE BIENES PÚBLICOS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Presupuesto en Bolívares */}
        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-blue-500/10 text-blue-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              Bs. {Number(config.capital_asignado_bs || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              Presupuesto Asignado (Tasa: Bs. {Number(config.tasa_bs_usdt || 54.20).toFixed(2)})
            </p>
          </div>
        </div>

        {/* KPI 2: Equivalente en USDT */}
        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight truncate">
              ${Number(config.capital_disponible_usdt || 0).toFixed(2)} <span className="text-xs font-normal text-neutral-400">USDT</span>
            </h3>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {isMinimoBinanceOk ? 'Mínimo Binance Spot Cumplido' : '⚠️ Menor a 5.2 USDT'}
            </p>
          </div>
        </div>

        {/* KPI 3: Precio Spot Oficial */}
        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-indigo-500/10 text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              ${Number(mercado.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
              <span className={(mercado.cambio24h || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {(mercado.cambio24h || 0) >= 0 ? '+' : ''}{Number(mercado.cambio24h || 0).toFixed(2)}%
              </span>
              <span>• {selectedPair.replace('USDT', '')} Spot</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Estado Operativo */}
        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-amber-500/10 text-amber-400">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {config.activo ? 'Operativo' : 'En Pausa'}
            </h3>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {config.telegram_configured ? 'Telegram Vinculado ✓' : 'Telegram Pendiente ⚠️'}
            </p>
          </div>
        </div>

      </div>

      {/* FILA PRINCIPAL: TABLERO CUANTITATIVO + GESTIÓN ADMINISTRATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Panel Izquierdo (8 cols): Métricas de Mercado & Flujo de Órdenes */}
        <div className="lg:col-span-8 phoenix-card overflow-hidden flex flex-col justify-between">
          
          {/* Card Header estilo Phoenix */}
          <div className="px-5 py-3.5 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-sm text-white">Análisis de Mercado en Tiempo Real</h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector de Par */}
              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                {(config.pares_disponibles || ['SOLUSDT', 'BTCUSDT', 'ETHUSDT', 'BNBUSDT']).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPair(p);
                      handleAnalizar(p);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      selectedPair === p
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p.replace('USDT', '')}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={analyzing}
                onClick={() => handleAnalizar(selectedPair)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-blue-400' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 flex-1">
            
            {/* Rejilla de Métricas Oficiales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">Precio Spot</span>
                <span className="text-xl font-bold text-white block mt-0.5">
                  ${Number(mercado.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">Variación 24h</span>
                <span
                  className={`text-xl font-bold block mt-0.5 ${
                    (mercado.cambio24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {(mercado.cambio24h || 0) >= 0 ? '+' : ''}
                  {Number(mercado.cambio24h || 0).toFixed(2)}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">Rango 24h (Alto/Bajo)</span>
                <span className="text-xs font-semibold text-neutral-200 block mt-1">
                  ${Number(mercado.high24h || 0).toFixed(2)} / ${Number(mercado.low24h || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">RSI (14 Periodos)</span>
                <span
                  className={`text-xl font-bold block mt-0.5 ${
                    (mercado.rsi || 50) > 70
                      ? 'text-red-400'
                      : (mercado.rsi || 50) < 30
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {mercado.rsi || 50}
                </span>
              </div>
            </div>

            {/* Balance de Oferta y Demanda (Order Book Imbalance) */}
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Bids (Volumen Compra): {mercado.presion_compra || 50}%
                </span>
                <span className="text-red-400 flex items-center gap-1.5">
                  Asks (Volumen Venta): {mercado.presion_venta || 50}% <TrendingDown className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-700/60">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${mercado.presion_compra || 50}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${mercado.presion_venta || 50}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-400">
                Profundidad consolidada calculada sobre los 20 mejores niveles del libro de órdenes de Binance.
              </p>
            </div>

            {/* Tarjeta de Diagnóstico y Señal Técnica */}
            <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-400">Diagnóstico Técnico:</span>
                  <span
                    className={`badge-phoenix px-3 py-1 font-bold ${
                      mercado.senal === 'COMPRAR'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : mercado.senal?.includes('VENTA')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    }`}
                  >
                    {mercado.senal || 'ESPERAR'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 font-medium">Índice de Confianza:</span>
                  <span className="badge-phoenix bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {mercado.score || 50} / 100
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-white">Fundamento:</strong> {mercado.razon || 'Condiciones de mercado en rango de evaluación.'}
              </p>

              {/* Niveles de Stop-Loss y Take-Profit */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                    Stop-Loss (-{config.stop_loss_pct || 1.5}%)
                  </span>
                  <span className="text-sm font-bold text-rose-400 block mt-0.5">${mercado.stop_loss || '0.00'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                    Take-Profit (+{config.take_profit_pct || 2.5}%)
                  </span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">${mercado.take_profit || '0.00'}</span>
                </div>
              </div>

              {/* Botones de Operación Manual */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleEjecutarOrden('COMPRA')}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
                >
                  Ejecutar Compra {selectedPair.replace('USDT', '')} ({config.modo_simulacion ? 'Simulado' : 'Real'})
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !posicion.abierta}
                  onClick={() => handleEjecutarOrden('VENTA')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs transition ${
                    posicion.abierta
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/60'
                  }`}
                >
                  Cerrar Posición / Vender
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Panel Derecho (4 cols): Gestión Financiera & Alertas */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Tarjeta 1: Liquidación y Retiro a Banco de Venezuela (0102) */}
          <div className="phoenix-card overflow-hidden">
            <div className="px-5 py-3.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h4 className="font-semibold text-sm text-white">Retiro Banco de Venezuela</h4>
              </div>
              <span className="badge-phoenix bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Cuenta 0102
              </span>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-medium">Disponible</span>
                  <span className="text-base font-bold text-emerald-400">
                    ${Number(config.capital_disponible_usdt || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block font-medium">Estimado en BDV</span>
                  <span className="text-base font-bold text-white">
                    Bs. {(Number(config.capital_disponible_usdt || 0) * Number(config.tasa_bs_usdt || 54.2)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Flujo institucional vía Binance P2P oficial con verificación y acreditación directa en BDV en Línea.
              </p>

              <button
                type="button"
                onClick={() => setShowRetiroModal(true)}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Solicitar Liquidación / Retiro BDV</span>
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Presupuesto & Tasa Operativa */}
          <div className="phoenix-card overflow-hidden">
            <div className="px-5 py-3.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-sm text-white">Presupuesto y Tasa</h4>
            </div>

            <form onSubmit={handleGuardarConfig} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Capital Asignado (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editCapitalBs}
                  onChange={(e) => setEditCapitalBs(e.target.value)}
                  className="input-fenix text-xs font-semibold"
                  placeholder="Ej: 10000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tasa de Referencia (Bs. / USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editTasa}
                  onChange={(e) => setEditTasa(e.target.value)}
                  className="input-fenix text-xs font-semibold"
                  placeholder="Ej: 54.20"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-between">
                <span>Equivalente en Cartera:</span>
                <strong className="text-emerald-400 font-bold">
                  ${editTasa > 0 ? (editCapitalBs / editTasa).toFixed(2) : '0.00'} USDT
                </strong>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 text-xs font-semibold shadow-sm transition"
              >
                Actualizar Presupuesto
              </button>
            </form>
          </div>

          {/* Tarjeta 3: Alertas a Telegram (@LegionFenixbot) */}
          <div className="phoenix-card overflow-hidden">
            <div className="px-5 py-3.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h4 className="font-semibold text-sm text-white">Alertas Telegram</h4>
              </div>
              {config.telegram_configured ? (
                <span className="badge-phoenix bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" /> Conectado
                </span>
              ) : (
                <span className="badge-phoenix bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3 h-3" /> Pendiente
                </span>
              )}
            </div>

            <div className="p-5 space-y-3.5">
              {/* Asistente Rápido de 2 Pasos */}
              <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" /> Vinculación Oficial:
                </div>

                {/* Paso 1: Abrir el Bot */}
                <a
                  href="https://t.me/LegionFenixbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                    <span>Abrir <strong>@LegionFenixbot</strong> y pulsar <strong>INICIAR</strong></span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </a>

                {/* Paso 2: Detección automática en 1 Clic */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDetectarTelegram}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>2. Detectar y Vincular Mi Telegram Automáticamente</span>
                </button>
              </div>

              {/* Campos manuales */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="9292349620:AAHIEIX7fLe8Lc7XTrSCpTz35TlNKqrs7dI"
                    className="input-fenix text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Telegram Admin ID (Numérico)
                  </label>
                  <input
                    type="text"
                    value={adminTelegramId}
                    onChange={(e) => setAdminTelegramId(e.target.value)}
                    placeholder="Se completa automáticamente con el botón azul"
                    className="input-fenix text-xs font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleGuardarConfig}
                    className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
                  >
                    Guardar ID
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleTestTelegram}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3" /> Probar Alerta
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowTelegramHelp(true)}
                  className="text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" /> Asistente de configuración
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

      {/* REGISTRO HISTÓRICO DE OPERACIONES (TABLA ESTILO PHOENIX / BIENES PÚBLICOS) */}
      <div className="phoenix-card overflow-hidden">
        <div className="px-5 py-3.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-sm text-white">Registro Histórico de Señales y Operaciones</h4>
          </div>
          <span className="text-xs text-neutral-400">{historial.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table-phoenix">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Par Cripto</th>
                <th>Operación</th>
                <th>Precio Spot</th>
                <th>Monto (USDT / Bs.)</th>
                <th>Presión Compra</th>
                <th>RSI (14)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-neutral-500">
                    No se han registrado operaciones en esta sesión.
                  </td>
                </tr>
              ) : (
                historial.map((op) => (
                  <tr key={op.id}>
                    <td className="text-neutral-400 text-xs">
                      {new Date(op.fecha).toLocaleString('es-VE')}
                    </td>
                    <td className="font-semibold text-white">{op.par}</td>
                    <td>
                      <span
                        className={`badge-phoenix px-2.5 py-0.5 ${
                          op.tipo?.includes('COMPRA')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {op.tipo}
                      </span>
                    </td>
                    <td className="font-semibold">${Number(op.precio).toFixed(2)}</td>
                    <td>
                      ${Number(op.monto_usdt).toFixed(2)} <span className="text-neutral-400">({Number(op.equivalente_bs).toFixed(0)} Bs.)</span>
                    </td>
                    <td className="text-emerald-400 font-semibold">{op.presion_compra}%</td>
                    <td>{op.rsi}</td>
                    <td>
                      <span className="badge-phoenix bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {op.resultado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASISTENTE PARA TELEGRAM BOT */}
      {showTelegramHelp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="phoenix-card max-w-lg w-full p-6 space-y-4 shadow-xl border border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Instrucciones de Vinculación con @LegionFenixbot
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
                Tu bot oficial ya está registrado en el sistema. Para recibir las alertas solo debes seguir estos sencillos pasos:
              </p>

              <div className="space-y-2.5 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
                  <div>
                    <span className="font-semibold text-white">Abre el bot en Telegram:</span>
                    <p className="text-neutral-400 mt-0.5">
                      Haz clic en{' '}
                      <a href="https://t.me/LegionFenixbot" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">
                        @LegionFenixbot
                      </a>{' '}
                      y presiona el botón <strong>Iniciar</strong> (o envía <code>/start</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                  <div>
                    <span className="font-semibold text-white">Vincular con 1 Clic:</span>
                    <p className="text-neutral-400 mt-0.5">
                      Regresa a este panel y presiona el botón azul <strong>Detectar y Vincular Mi Telegram</strong>. Tu ID se guardará automáticamente y te llegará un mensaje de confirmación.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTelegramHelp(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONECTAR A CARTERAS DE CRIPTOMONEDAS (BINANCE SPOT) */}
      {showBinanceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="phoenix-card max-w-lg w-full p-6 space-y-4 shadow-xl border border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Conexión Oficial a Binance Spot API
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
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <strong>Protocolo de Seguridad:</strong> Habilita únicamente permisos de <em>Lectura</em> y <em>Spot Trading</em>. <strong>NUNCA habilites retiros (Withdrawals)</strong>.
              </div>

              <form onSubmit={handleConectarBinance} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Binance API Key
                  </label>
                  <input
                    type="password"
                    value={binanceKey}
                    onChange={(e) => setBinanceKey(e.target.value)}
                    placeholder="Clave pública de lectura y spot"
                    className="input-fenix text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Binance API Secret
                  </label>
                  <input
                    type="password"
                    value={binanceSecret}
                    onChange={(e) => setBinanceSecret(e.target.value)}
                    placeholder="Clave secreta"
                    className="input-fenix text-xs font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href="https://www.binance.com/es/my/settings/api-management"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Administrador API Binance
                  </a>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-sm"
                  >
                    Guardar y Conectar
                  </button>
                </div>
              </form>

              {binance.saldos && binance.saldos.length > 0 && (
                <div className="pt-3 border-t border-neutral-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-400 block">Saldos Detectados en Cartera:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {binance.saldos.map((s) => (
                      <div key={s.asset} className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800 flex justify-between">
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

      {/* MODAL: ASISTENTE DE RETIRO A BANCO DE VENEZUELA (0102) */}
      {showRetiroModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="phoenix-card max-w-lg w-full p-6 space-y-4 shadow-xl border border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Liquidación Oficial • Banco de Venezuela
                </h3>
              </div>
              <button
                onClick={() => setShowRetiroModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300">
              <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Disponible a Liquidar</span>
                  <span className="text-xl font-bold text-emerald-400">
                    ${Number(config.capital_disponible_usdt || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Acreditar en BDV</span>
                  <span className="text-xl font-bold text-white">
                    Bs. {(Number(config.capital_disponible_usdt || 0) * Number(config.tasa_bs_usdt || 54.2)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <strong>Protocolo de Tesorería:</strong> La liquidación se ejecuta mediante Binance P2P con comprobante oficial validado en BDV en Línea antes de liberar activos.
              </div>

              <ol className="list-decimal list-inside space-y-2 leading-relaxed text-neutral-300">
                <li>El motor se pausa preventivamente para congelar la posición de tesorería.</li>
                <li>Los USDT se liberan en el mercado P2P hacia cuenta bancaria 0102 BDV.</li>
                <li>Se valida el número de referencia y saldo en BDV en Línea.</li>
              </ol>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleNotificarRetiroTelegram}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Guía de Liquidación a Telegram</span>
                </button>

                <a
                  href="https://p2p.binance.com/es/trade/sell/USDT?fiat=VES&payment=BANK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Portal Binance P2P (Filtro Banco de Venezuela)</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRetiroModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENTACIÓN Y PROMPT MAESTRO */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="phoenix-card max-w-2xl w-full p-6 space-y-4 shadow-xl border border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Documentación del Sistema y Prompt Maestro
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
              Especificaciones de arquitectura técnica y reglas cuantitativas integradas en el sistema:
            </p>

            <pre className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-72 overflow-y-auto whitespace-pre-wrap">
              {PROMPT_MAESTRO_TEXT}
            </pre>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                MODULO_TRADING_ADMIN_LEGION_FENIX.md
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(PROMPT_MAESTRO_TEXT);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2500);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPrompt ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
