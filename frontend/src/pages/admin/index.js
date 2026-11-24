import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
// Cambiar a false o eliminar si se desea desactivar/retirar fácilmente
const ENABLE_TRADING_MODULE = true;

export default function AdminPanel() {
  const { user, checking } = useAuthGuard(['ADMINISTRADOR', 'ANALISTA_ADMIN']);
  const [activeTab, setActiveTab] = useState('asistencia'); // asistencia | finanzas | cobranzas | clinica | usuarios | mensajeria

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
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const isAdmin = user?.rol === 'ADMINISTRADOR';

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

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-negro-fondo text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-vinotinto border-t-rojo-fuego rounded-full animate-spin mx-auto" />
          <p className="text-sm text-texto-secundario">Cargando Centro Operativo...</p>
        </div>
      </div>
    );
  }

  const resumen = financeData.resumen || {};

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar
        subtitle={
          isAdmin
            ? 'Panel Administrador General y Control Total'
            : 'Panel Analista Administrativo (Asistencia, Cobranza y Tienda)'
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1">
        {/* Barra de Retorno y Navegación Rápida */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/';
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white transition px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-rojo-fuego" />
            Volver a la página anterior
          </button>
          <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
            Panel de Control Administrativo • Legión Fénix FC
          </span>
        </div>

        {/* Cabecera Identificando Rol */}
        <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-rojo-fuego flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego">
              {isAdmin ? 'Dirección General — Permisos Totales' : 'Analista Administrativo — Gestión Operativa'}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              {isAdmin ? 'ADMINISTRACIÓN CENTRAL LEGIÓN FÉNIX' : 'OPERACIONES FINANCIERAS Y ASISTENCIA'}
            </h1>
          </div>
          <span className="px-3 py-1 rounded-full bg-vinotinto/40 border border-vinotinto text-xs font-bold text-white">
            {user?.nombre} • {user?.rol}
          </span>
        </div>

        {/* Accesos directos filtrados por rol */}
        <AdminAccesosModulosBanner userRole={user?.rol} />

        {/* KPIs Globales */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card-fenix p-4 border-l-4 border-l-green-500">
            <p className="text-[11px] uppercase text-texto-secundario font-bold">Total Ingresos</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-green-400 mt-1">
              ${Number(resumen.total_ingresos || 0).toFixed(2)}
            </p>
          </div>
          <div className="card-fenix p-4 border-l-4 border-l-rojo-fuego">
            <p className="text-[11px] uppercase text-texto-secundario font-bold">Total Egresos</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-rojo-fuego mt-1">
              ${Number(resumen.total_egresos || 0).toFixed(2)}
            </p>
          </div>
          <div className="card-fenix p-4 border-l-4 border-l-vinotinto">
            <p className="text-[11px] uppercase text-texto-secundario font-bold">Balance Neto</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${Number(resumen.balance_neto || 0).toFixed(2)}
            </p>
          </div>
          <div className="card-fenix p-4 border-l-4 border-l-amber-500">
            <p className="text-[11px] uppercase text-texto-secundario font-bold">Alertas Inasistencia</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              {attendanceData.alerts?.length || 0} Atletas
            </p>
          </div>
          <div className="card-fenix p-4 border-l-4 border-l-red-500 col-span-2 lg:col-span-1">
            <p className="text-[11px] uppercase text-texto-secundario font-bold">Por Validar / Morosos</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {resumen.comprobantes_por_validar || 0} /{' '}
              <span className="text-rojo-fuego">{resumen.atletas_morosos || 0}</span>
            </p>
          </div>
        </div>

        {feedback && (
          <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs sm:text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> {feedback}
            </span>
            <button onClick={() => setFeedback('')} className="text-xs underline">Ocultar</button>
          </div>
        )}

        {/* Barra de Navegación Modular estilo Gesdep 4.0 */}
        <div className="border-b border-neutral-800 pb-3">
          <div className="flex flex-wrap items-center gap-2 py-1">
            <button
              type="button"
              onClick={() => setActiveTab('asistencia')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'asistencia'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'asistencia' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Asistencia Check-In/Out</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('finanzas')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'finanzas'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'finanzas' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Contabilidad y Equilibrio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cobranzas')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'cobranzas'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'cobranzas' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Comprobantes y Tienda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('carrusel')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'carrusel'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Film className={`w-4 h-4 shrink-0 ${activeTab === 'carrusel' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Carrusel Principal</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinica')}
                  className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'clinica'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                      : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <HeartPulse className={`w-4 h-4 shrink-0 ${activeTab === 'clinica' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
                  <span className="text-xs whitespace-nowrap">Clínica y Lesiones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('usuarios')}
                  className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'usuarios'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                      : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'usuarios' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
                  <span className="text-xs whitespace-nowrap">Usuarios y Permisos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mensajeria')}
                  className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                    activeTab === 'mensajeria'
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                      : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <QrCode className={`w-4 h-4 shrink-0 ${activeTab === 'mensajeria' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
                  <span className="text-xs whitespace-nowrap">Mensajería QR y Gmail</span>
                </button>

                {ENABLE_TRADING_MODULE && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('trading')}
                    className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                      activeTab === 'trading'
                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 border-amber-400 text-white shadow-fenix font-bold'
                        : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/50 font-semibold'
                    }`}
                  >
                    <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'trading' ? 'text-amber-300' : 'text-amber-400'}`} />
                    <span className="text-xs whitespace-nowrap">Trading & Alertas</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                      ADMIN
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
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
            <div className="card-fenix p-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-vinotinto">
              <div>
                <p className="text-xs font-bold text-white">
                  Módulo Independiente de Fisioterapia Disponible
                </p>
                <p className="text-[11px] text-texto-secundario">
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
      </main>
    </div>
  );
}
