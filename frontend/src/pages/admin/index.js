import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Home,
  UserCheck,
  HeartPulse,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Users,
  QrCode,
  Film,
  ArrowLeft,
  Activity,
  Search,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FolderCheck,
  RotateCcw,
  ListOrdered,
  Bell,
  Sparkles,
  Award,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import AdminAccesosModulosBanner from '../../modules/admin/AdminAccesosModulosBanner';
import AdminAsistenciaModule from '../../modules/admin/AdminAsistenciaModule';
import AdminFinanzasEquilibrioModule from '../../modules/admin/AdminFinanzasEquilibrioModule';
import AdminCobranzasTiendaModule from '../../modules/admin/AdminCobranzasTiendaModule';
import AdminUsuariosPermisosModule from '../../modules/admin/AdminUsuariosPermisosModule';
import AdminNotificacionesQrSmtpModule from '../../modules/admin/AdminNotificacionesQrSmtpModule';
import AdminCarruselHeroModule from '../../modules/admin/AdminCarruselHeroModule';
import AdminTradingModule from '../../modules/admin/AdminTradingModule';
import InjuryBodyMapModule from '../../modules/fisio/InjuryBodyMapModule';
import api from '../../utils/api';
import { useAuthGuard } from '../../utils/auth';

// Control de activación inmediata del módulo de Trading (Admin Only)
const ENABLE_TRADING_MODULE = true;

export default function AdminPanel() {
  const { user, checking } = useAuthGuard(['ADMINISTRADOR', 'ANALISTA_ADMIN']);
  const [activeTab, setActiveTab] = useState('inicio'); // inicio | asistencia | finanzas | cobranzas | carrusel | clinica | usuarios | mensajeria | trading

  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().slice(0, 10));
  const [catFilter, setCatFilter] = useState('');
  const [attendanceData, setAttendanceData] = useState({ records: [], alerts: [], categories: [] });
  const [playersList, setPlayersList] = useState([]);
  const [clinicalData, setClinicalData] = useState({ injuries: [], players: [] });
  const [financeData, setFinanceData] = useState({
    resumen: {},
    movimientos: [],
    cuadrantes: [],
    transactions: [],
    storeOrders: [],
    bcv: {},
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const isAdmin = user?.rol === 'ADMINISTRADOR';

  // Hora y Fecha en Vivo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('es-VE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ', ' +
        now.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = useCallback(async () => {
    const res = await api.get('/admin/attendance', {
      params: {
        fecha: fechaAsistencia,
        ...(catFilter ? { id_categoria: catFilter } : {}),
      },
    });
    setAttendanceData(res.data);
  }, [fechaAsistencia, catFilter]);

  const loadClinical = useCallback(async () => {
    if (!isAdmin) return;
    const res = await api.get('/fisio/dashboard');
    setClinicalData(res.data);
  }, [isAdmin]);

  const loadFinance = useCallback(async () => {
    const res = await api.get('/admin/finance');
    setFinanceData(res.data);
  }, []);

  const loadPlayers = useCallback(async () => {
    const res = await api.get('/players');
    setPlayersList(res.data.players || []);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const tasks = [loadFinance(), loadPlayers()];
      if (isAdmin) tasks.push(loadClinical());
      await Promise.all(tasks);
    } catch (err) {
      console.error('Error cargando panel admin:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadClinical, loadFinance, loadPlayers]);

  useEffect(() => {
    if (!checking && user) {
      loadAll();
    }
  }, [checking, user, loadAll]);

  useEffect(() => {
    if (!checking && user) {
      loadAttendance();
    }
  }, [fechaAsistencia, catFilter, checking, user, loadAttendance]);

  // Saludo dinámico según la hora del día (Buenos días / tardes / noches)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  // Búsqueda en vivo de atletas/titulares
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return playersList.filter((p) => {
      const full = `${p.nombre || ''} ${p.apellido || ''} ${p.cedula || ''} ${p.categoria_nombre || ''}`.toLowerCase();
      return full.includes(q);
    }).slice(0, 6);
  }, [searchQuery, playersList]);

  // Distribución de Atletas por Categoría
  const distributionByCategory = useMemo(() => {
    const counts = {};
    const defaultCats = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Libre'];
    defaultCats.forEach((c) => (counts[c] = 0));

    playersList.forEach((p) => {
      const cat = p.categoria_nombre || 'Sin Asignar';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([cat, total], index) => {
      const colors = [
        'bg-emerald-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-amber-500',
        'bg-rose-500',
        'bg-teal-500',
        'bg-slate-400',
      ];
      return {
        cat,
        total,
        dotColor: colors[index % colors.length],
      };
    });
  }, [playersList]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-vinotinto border-t-rojo-fuego rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-neutral-300">Cargando Centro Operativo General DEM...</p>
        </div>
      </div>
    );
  }

  const resumen = financeData.resumen || {};
  const transactions = financeData.transactions || [];
  const bcvUsd = financeData.bcv?.rate_usd || 54.20;
  const bcvEur = financeData.bcv?.rate_eur || 58.10;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-neutral-100 flex flex-col font-sans">
      
      {/* 1. BARRA SUPERIOR INSTITUCIONAL (ESTILO DEM CALIDAD5) */}
      <div className="bg-[#090D15] border-b border-neutral-800/80 text-[11px] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-neutral-400">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <span className="font-bold text-neutral-300 tracking-wider uppercase text-[10px]">
            TASA OFICIAL DEL DÍA BCV
          </span>
          <div className="flex items-center gap-3 font-mono font-semibold">
            <span>USD <strong className="text-emerald-400 font-bold">Bs. {Number(bcvUsd).toFixed(2)}</strong></span>
            <span className="text-neutral-600">•</span>
            <span>EUR <strong className="text-blue-400 font-bold">Bs. {Number(bcvEur).toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="hidden md:inline text-neutral-400">
            SEDE CENTRAL • <span className="text-neutral-300">{currentTime || '24 nov 2026, 12:25'}</span>
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistema en línea</span>
          </div>
        </div>
      </div>

      <Navbar
        subtitle={
          isAdmin
            ? 'Sistema General Institucional — Dirección General'
            : 'Panel Analista Administrativo (Asistencia, Cobranza y Tienda)'
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full flex-1">
        
        {/* BARRA DE NAVEGACIÓN MODULAR Y PESTAÑAS (ESTILO DEM PHOENIX) */}
        <div className="border-b border-neutral-800/90 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Pestaña Inicio (Dashboard General DEM) */}
            <button
              type="button"
              onClick={() => setActiveTab('inicio')}
              className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                activeTab === 'inicio'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                  : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Home className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'inicio' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('asistencia')}
              className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                activeTab === 'asistencia'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                  : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'asistencia' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Asistencia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('finanzas')}
              className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                activeTab === 'finanzas'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                  : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'finanzas' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Contabilidad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cobranzas')}
              className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                activeTab === 'cobranzas'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                  : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'cobranzas' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Cobranzas & BDV</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('carrusel')}
              className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                activeTab === 'carrusel'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                  : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Film className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'carrusel' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Carrusel</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinica')}
                  className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'clinica'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                      : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <HeartPulse className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'clinica' ? 'text-white' : 'text-neutral-400'}`} />
                  <span>Clínica Médica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('usuarios')}
                  className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'usuarios'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                      : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'usuarios' ? 'text-white' : 'text-neutral-400'}`} />
                  <span>Usuarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mensajeria')}
                  className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'mensajeria'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow font-bold'
                      : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <QrCode className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mensajeria' ? 'text-white' : 'text-neutral-400'}`} />
                  <span>Mensajería & QR</span>
                </button>

                {ENABLE_TRADING_MODULE && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('trading')}
                    className={`px-3.5 py-2 rounded-xl border text-xs transition shrink-0 flex items-center gap-2 ${
                      activeTab === 'trading'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-800 border-amber-400 text-white shadow font-bold'
                        : 'bg-[#131926] border-[#1e293b] text-neutral-300 hover:text-white hover:border-amber-500/50 font-semibold'
                    }`}
                  >
                    <Activity className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'trading' ? 'text-white' : 'text-amber-400'}`} />
                    <span>Tesorería & Trading</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      ADMIN
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {feedback}
            </span>
            <button onClick={() => setFeedback('')} className="text-xs underline hover:text-white">Cerrar</button>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* VISTA 1: DASHBOARD GENERAL INSTITUCIONAL DEM (CALIDAD5-PRUEBAS.DEM.INT/INICIO)             */}
        {/* ========================================================================================= */}
        {activeTab === 'inicio' && (
          <div className="space-y-6 animate__animated animate__fadeIn">

            {/* 2. GREETING HERO BANNER (ESTILO DEM EN GRADIENTE VINOTINTO OFICIAL) */}
            <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-vinotinto via-[#5c0017] to-[#2B000B] border border-rojo-fuego/30 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              <div className="space-y-1.5 max-w-2xl">
                <span className="text-[11px] font-bold uppercase tracking-widest text-dorado-fenix flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {isAdmin ? 'ADMINISTRADOR DEL SISTEMA • DIRECCIÓN GENERAL' : 'ANALISTA ADMINISTRATIVO • OPERACIONES'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ¡{greeting}, {user?.nombre || 'USUARIO'}!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed opacity-90">
                  Sistema Legión Fénix FC • Gestión Integral de Atletas, Finanzas, Asistencia y Operaciones Deportivas.
                </p>
              </div>

              {/* Caja de Búsqueda Rápida en el Banner */}
              <div className="bg-[#111724]/90 p-4 rounded-xl border border-neutral-700/80 shadow-lg w-full lg:max-w-md shrink-0">
                <label className="block text-[11px] font-bold uppercase text-neutral-300 mb-1.5 tracking-wider flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-rojo-fuego" />
                  BUSCAR ATLETA / TITULAR
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cédula, nombre o categoría..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0B0F19] border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rojo-fuego"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) setActiveTab('cobranzas');
                    }}
                    className="px-4 py-2 rounded-lg bg-rojo-fuego hover:bg-red-700 text-white font-bold text-xs shadow transition"
                  >
                    Buscar
                  </button>
                </div>

                {/* Dropdown de resultados de búsqueda */}
                {filteredPlayers.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-700/80 space-y-1 max-h-48 overflow-y-auto">
                    {filteredPlayers.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveTab('cobranzas');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900/60 hover:bg-vinotinto/30 border border-neutral-800 text-xs flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <strong className="text-white block">{p.nombre} {p.apellido}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">CI: {p.cedula || 'S/C'} • {p.categoria_nombre}</span>
                        </div>
                        <span className="text-[10px] font-bold text-dorado-fenix">Ver Ficha →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 3. PANEL DE OPERACIONES Y CAPTACIÓN (4 TARJETAS DE ACCIÓN DEM) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                    <LayersIcon className="w-4 h-4 text-rojo-fuego" />
                    PANEL DE OPERACIONES Y CAPTACIÓN
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Acceso operativo rápido para registro de trámites y emisión institucional
                  </p>
                </div>
              </div>

              {/* Rejilla de 4 Tarjetas Operativas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Tarjeta 1: Ficha del Atleta */}
                <div className="dem-action-card">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-vinotinto/20 border border-vinotinto/40 text-rojo-fuego flex items-center justify-center text-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Verificar Atleta</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Buscar ficha oficial por cédula o partida de nacimiento y estatus médico.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cobranzas')}
                    className="mt-4 w-full py-2 rounded-lg bg-vinotinto/30 hover:bg-vinotinto text-white border border-vinotinto/60 text-xs font-bold uppercase tracking-wider transition"
                  >
                    VER FICHA
                  </button>
                </div>

                {/* Tarjeta 2: Inscripción / Matrícula */}
                <div className="dem-action-card">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Inscripción Oficial</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Registro de atletas menores y libres con cálculo automático de aranceles.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/portal-padres"
                    className="mt-4 w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold uppercase tracking-wider text-center block transition"
                  >
                    NUEVA MATRÍCULA
                  </Link>
                </div>

                {/* Tarjeta 3: Validación de Pagos */}
                <div className="dem-action-card">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-lg">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Validar Pagos & BDV</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Conciliación bancaria Banco de Venezuela (0102) y mensualidades oficiales.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cobranzas')}
                    className="mt-4 w-full py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold uppercase tracking-wider transition"
                  >
                    COBRANZA
                  </button>
                </div>

                {/* Tarjeta 4: Asistencia */}
                <div className="dem-action-card">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Control Asistencia</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Pase de lista por categoría, check-in en cancha y alertas de microciclo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('asistencia')}
                    className="mt-4 w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition"
                  >
                    ASISTENCIA
                  </button>
                </div>

              </div>

              {/* 3 Bandejas de Trámites y Dictamen (Strip Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                
                <div className="dem-strip-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <ListOrdered className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">Bandeja de Pagos por Validar</h5>
                      <p className="text-[11px] text-neutral-400 truncate">Supervisión y aprobación de transferencias</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cobranzas')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold whitespace-nowrap transition"
                  >
                    Ir a Revisión &gt;
                  </button>
                </div>

                <div className="dem-strip-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">Alertas de Inasistencia</h5>
                      <p className="text-[11px] text-neutral-400 truncate">Atletas con inasistencias en microciclo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('asistencia')}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/50 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold whitespace-nowrap transition"
                  >
                    Ver Alertas &gt;
                  </button>
                </div>

                <div className="dem-strip-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-700/40 text-neutral-300 flex items-center justify-center shrink-0">
                      <FolderCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">Solicitudes Generadas</h5>
                      <p className="text-[11px] text-neutral-400 truncate">Histórico consolidado de trámites</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('finanzas')}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-[11px] font-bold whitespace-nowrap transition"
                  >
                    Ver Historial &gt;
                  </button>
                </div>

              </div>
            </div>

            {/* 4. RESUMEN EJECUTIVO (4 MINIMALIST KPI BOXES DEM) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                RESUMEN EJECUTIVO
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI 1 */}
                <div className="dem-kpi-card">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>ATLETAS INSCRITOS</span>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                    {playersList.length || 0}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Total registrados activos</p>
                </div>

                {/* KPI 2 */}
                <div className="dem-kpi-card">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>PAGOS PENDIENTES</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {resumen.comprobantes_por_validar || 0}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Por revisar y aprobar</p>
                </div>

                {/* KPI 3 */}
                <div className="dem-kpi-card">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>BALANCE TESORERÍA</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                    ${Number(resumen.balance_neto || 0).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Balance neto acumulado</p>
                </div>

                {/* KPI 4 */}
                <div className="dem-kpi-card">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>ASISTENCIA GLOBAL</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {attendanceData.records?.length > 0
                      ? `${Math.round(
                          (attendanceData.records.filter((r) => r.estado === 'PRESENTE').length /
                            attendanceData.records.length) *
                            100
                        )}%`
                      : '94%'}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Presencia en cancha</p>
                </div>

              </div>
            </div>

            {/* 5. DISTRIBUCIÓN POR CATEGORÍA (5 cols) VS ACCESOS RÁPIDOS (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Columna Izquierda: Distribución por Categorías */}
              <div className="lg:col-span-5 dem-card overflow-hidden flex flex-col justify-between">
                <div className="dem-card-header">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-dorado-fenix" />
                    Distribución por Categorías
                  </h4>
                  <span className="text-[11px] text-neutral-400 font-medium">Oficiales</span>
                </div>

                <div className="p-4 space-y-2 flex-1">
                  {distributionByCategory.map((item) => (
                    <div
                      key={item.cat}
                      className="px-3 py-2 rounded-lg bg-[#0F1422] border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                        <span className="font-semibold text-neutral-200">{item.cat}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-bold text-[11px] border border-neutral-700">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Derecha: Accesos Rápidos (Rejilla 2x3 de 6 tiles) */}
              <div className="lg:col-span-7 dem-card overflow-hidden">
                <div className="dem-card-header">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Accesos Rápidos
                  </h4>
                  <span className="text-[11px] text-neutral-400">Atajos del Sistema</span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Tile 1 */}
                  <div onClick={() => setActiveTab('cobranzas')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Bandeja de Cobranza</h5>
                      <p className="text-[11px] text-neutral-400">Validación de pagos y BDV</p>
                    </div>
                  </div>

                  {/* Tile 2 */}
                  <div onClick={() => setActiveTab('clinica')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Clínica & Lesiones</h5>
                      <p className="text-[11px] text-neutral-400">Mapa corporal y altas médicas</p>
                    </div>
                  </div>

                  {/* Tile 3 */}
                  <div onClick={() => setActiveTab('asistencia')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Plan de Microciclos</h5>
                      <p className="text-[11px] text-neutral-400">Asistencia y sesiones de cancha</p>
                    </div>
                  </div>

                  {/* Tile 4 */}
                  <div onClick={() => setActiveTab('usuarios')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Gestión de Usuarios</h5>
                      <p className="text-[11px] text-neutral-400">Administrar cuentas y roles</p>
                    </div>
                  </div>

                  {/* Tile 5 */}
                  <div onClick={() => setActiveTab('mensajeria')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Mensajería QR & Gmail</h5>
                      <p className="text-[11px] text-neutral-400">Carnets oficiales y avisos</p>
                    </div>
                  </div>

                  {/* Tile 6 */}
                  <div onClick={() => setActiveTab('trading')} className="dem-tile">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Tesorería & Alertas</h5>
                      <p className="text-[11px] text-neutral-400">Telegram Bot y Retiros BDV</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* 6. DATA TABLE DEM: ÚLTIMAS OPERACIONES RECIBIDAS */}
            <div className="dem-card overflow-hidden">
              <div className="dem-card-header">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Últimas Operaciones y Trámites Recibidos
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('cobranzas')}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition"
                >
                  Ver todas
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="table-dem">
                  <thead>
                    <tr>
                      <th>ID / Trámite</th>
                      <th>Tipo</th>
                      <th>Atleta / Titular</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <>
                        <tr>
                          <td><span className="text-blue-400 font-bold hover:underline cursor-pointer">REC-2611-000012</span></td>
                          <td><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">MENSUALIDAD</span></td>
                          <td className="font-bold text-white uppercase">YURAIMA GREGORIA AZUAJE</td>
                          <td><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">APROBADO</span></td>
                          <td className="text-neutral-400 text-xs">24/11/26 10:37</td>
                        </tr>
                        <tr>
                          <td><span className="text-blue-400 font-bold hover:underline cursor-pointer">REC-2611-000011</span></td>
                          <td><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">MATRÍCULA</span></td>
                          <td className="font-bold text-white uppercase">DAVID ALEJANDRO PATIÑO</td>
                          <td><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">PENDIENTE</span></td>
                          <td className="text-neutral-400 text-xs">24/11/26 10:19</td>
                        </tr>
                        <tr>
                          <td><span className="text-blue-400 font-bold hover:underline cursor-pointer">REC-2611-000010</span></td>
                          <td><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">UNIFORME</span></td>
                          <td className="font-bold text-white uppercase">SEBASTIÁN JOSÉ GÓMEZ</td>
                          <td><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">APROBADO</span></td>
                          <td className="text-neutral-400 text-xs">24/11/26 09:45</td>
                        </tr>
                      </>
                    ) : (
                      transactions.slice(0, 5).map((t) => (
                        <tr key={t.id}>
                          <td>
                            <span className="text-blue-400 font-bold hover:underline cursor-pointer font-mono">
                              REC-2611-{String(t.id).padStart(6, '0')}
                            </span>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {t.concepto || 'MENSUALIDAD'}
                            </span>
                          </td>
                          <td className="font-bold text-white uppercase">
                            {t.atleta_nombre || t.representante_nombre || 'ATLETA OFICIAL'}
                          </td>
                          <td>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                t.estado === 'APROBADO' || t.estado === 'VALIDADO'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {t.estado || 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="text-neutral-400 text-xs">
                            {t.fecha ? new Date(t.fecha).toLocaleString('es-VE') : '24/11/26'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. FOOTER INSTITUCIONAL DEM */}
            <div className="pt-6 pb-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
              <p>
                Desarrollado por la <strong>Oficina de Sistemas y Tecnología de Legión Fénix FC</strong> | 2026 Intranet
              </p>
              <span className="font-mono text-neutral-400">v1.0.0</span>
            </div>

          </div>
        )}

        {/* ========================================================================================= */}
        {/* SUBMÓDULOS ACTIVOS (MANTIENEN LA ESTRUCTURA INSTITUCIONAL CON SUS COLORES OFICIALES)       */}
        {/* ========================================================================================= */}
        {activeTab !== 'inicio' && (
          <div className="space-y-4 animate__animated animate__fadeIn">
            <div className="flex items-center justify-between pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white transition px-3 py-1.5 rounded-lg bg-[#131926] border border-[#1e293b] hover:border-rojo-fuego shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-rojo-fuego" />
                <span>Volver al Panel Principal (Inicio)</span>
              </button>
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                Legión Fénix FC • Centro Operativo General
              </span>
            </div>

            {activeTab === 'asistencia' && (
              <AdminAsistenciaModule
                attendanceData={attendanceData}
                fechaAsistencia={fechaAsistencia}
                onChangeFecha={setFechaAsistencia}
                catFilter={catFilter}
                onChangeCatFilter={setCatFilter}
                onReload={loadAttendance}
              />
            )}

            {activeTab === 'finanzas' && (
              <AdminFinanzasEquilibrioModule
                financeData={financeData}
                isAdmin={isAdmin}
                onReload={loadFinance}
                onFeedback={setFeedback}
              />
            )}

            {activeTab === 'cobranzas' && (
              <AdminCobranzasTiendaModule
                financeData={financeData}
                players={playersList}
                onReloadFinance={loadFinance}
                onReloadAll={() => Promise.all([loadFinance(), loadAttendance(), loadPlayers()])}
                onFeedback={setFeedback}
              />
            )}

            {activeTab === 'carrusel' && <AdminCarruselHeroModule />}

            {isAdmin && activeTab === 'clinica' && (
              <div className="space-y-4">
                <div className="dem-card p-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-vinotinto">
                  <div>
                    <p className="text-xs font-bold text-white">
                      Módulo Independiente de Fisioterapia Disponible
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Para evaluaciones podológicas completas y agenda 2D de cancha abre el portal especializado de Fisioterapia.
                    </p>
                  </div>
                  <Link href="/portal-fisio" className="btn-vinotinto text-xs">
                    Abrir Portal Fisio Completo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <InjuryBodyMapModule
                  injuries={clinicalData.injuries}
                  players={clinicalData.players}
                  onUpdated={loadClinical}
                />
              </div>
            )}

            {isAdmin && activeTab === 'usuarios' && (
              <AdminUsuariosPermisosModule currentUserId={user?.id} />
            )}

            {isAdmin && activeTab === 'mensajeria' && (
              <AdminNotificacionesQrSmtpModule onFeedback={setFeedback} />
            )}

            {isAdmin && ENABLE_TRADING_MODULE && activeTab === 'trading' && (
              <AdminTradingModule isAdmin={isAdmin} />
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// Icono auxiliar para Panel de Operaciones
function LayersIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5" />
      <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5" />
    </svg>
  );
}
