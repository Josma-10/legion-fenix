import React, { useState, useEffect, useCallback } from 'react';
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

  // Estados de Configuración Rápida
  const [editCapitalBs, setEditCapitalBs] = useState('');
  const [editTasa, setEditTasa] = useState('');
  const [botToken, setBotToken] = useState('');
  const [adminTelegramId, setAdminTelegramId] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showRetiroModal, setShowRetiroModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/admin/trading/status');
      if (res.data && res.data.success) {
        setData(res.data);
        if (!editCapitalBs) setEditCapitalBs(res.data.config.capital_asignado_bs);
        if (!editTasa) setEditTasa(res.data.config.tasa_bs_usdt);
        if (res.data.config.par_activo) setSelectedPair(res.data.config.par_activo);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el motor de trading.');
    } finally {
      setLoading(false);
    }
  }, [editCapitalBs, editTasa]);

  useEffect(() => {
    fetchStatus();
    // Sondeo de mercado cada 30 segundos si el motor está activo
    const timer = setInterval(() => {
      fetchStatus();
    }, 30000);
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
    e.preventDefault();
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
        setSuccess('Parámetros guardados y sincronizados.');
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
        setSuccess('¡Alerta de prueba enviada con éxito a tu Telegram!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar la alerta de prueba a Telegram.');
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
          </div>
          <h2 className="font-display text-2xl font-black text-white uppercase italic">
            Monitor de Flujo de Órdenes & Alertas en Tiempo Real
          </h2>
          <p className="text-xs text-neutral-400">
            Cálculo de presión compradora/vendedora en Binance Spot, gestión de capital Bs./USDT y alertas a Telegram.
          </p>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="flex flex-wrap items-center gap-2.5">
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
                <span>Pausar Motor</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                <span>Iniciar Motor Automático</span>
              </>
            )}
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

        {/* Estado del Motor */}
        <div className="card-fenix p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Estado del Motor</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${config.activo ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`}></span>
            <span className="font-display text-xl font-bold text-white uppercase">
              {config.activo ? 'Monitoreando Activo' : 'Detenido / En Pausa'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            Intervalo de escaneo: Cada 60s
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
            {posicion.abierta ? `Precio entrada: $${posicion.precio_entrada}` : 'Esperando señal técnica'}
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

            {/* Barra gráfica de volumen relativo */}
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
                <span className="text-xs font-bold text-neutral-400 uppercase">Señal Sugerida:</span>
                <span
                  className={`px-3 py-1 rounded-lg font-display text-lg font-black uppercase tracking-wider ${
                    mercado.senal === 'COMPRAR'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : mercado.senal?.includes('VENTA')
                      ? 'bg-red-500/20 text-rojo-fuego border border-red-500/40'
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
              <strong className="text-white">Fundamento Técnico:</strong> {mercado.razon || 'Evaluando condiciones de mercado.'}
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

          {/* Configuración de Alertas Telegram */}
          <div className="card-fenix p-5 space-y-4">
            <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Alertas a Telegram
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Token de @BotFather"
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
                  placeholder="Tu ID de @userinfobot"
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
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-bold transition hover:brightness-110 shadow"
                >
                  Probar Alerta
                </button>
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

      {/* MODAL: ASISTENTE DE RETIRO A BANCO DE VENEZUELA (0102) */}
      {showRetiroModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <strong>Regla de Seguridad Financiera:</strong> Nunca uses bots de automatización de pantalla (RPA) sobre la web de BDV. El flujo correcto es vía Binance P2P oficial con verificación en BDV en Línea.
              </div>

              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  <strong>Pausar el motor:</strong> El bot se pausará automáticamente para evitar que abra nuevas operaciones con los fondos a retirar.
                </li>
                <li>
                  <strong>Mover fondos:</strong> Transfiere tus USDT desde la billetera <strong>Spot</strong> a la billetera de <strong>Fondos</strong> en Binance.
                </li>
                <li>
                  <strong>Binance P2P:</strong> Ve a la app oficial de Binance ➔ <em>Trading P2P</em> ➔ Selecciona <em>Vender USDT</em> ➔ Filtra por método: <em>Banco de Venezuela / Pago Móvil</em>.
                </li>
                <li>
                  <strong>Verificación en BDV en Línea:</strong> Confirma con tu app de BDV que el dinero esté disponible en tu cuenta antes de liberar la criptomoneda.
                </li>
              </ol>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRetiroModal(false)}
                className="px-4 py-2 rounded-xl bg-rojo-fuego text-white text-xs font-bold uppercase tracking-wider"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROMPT MAESTRO COPIABLE PARA IA (CURSOR / WINDSURF) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
