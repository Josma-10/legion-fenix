import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  Crosshair,
  Video,
  Users,
  Box,
  Award,
  HeartPulse,
  Shirt,
  Save,
  X,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Tv,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PlanificacionCampoModule from '../../modules/entrenadores/PlanificacionCampoModule';
import EjerciciosBibliotecaModule from '../../modules/entrenadores/EjerciciosBibliotecaModule';
import VideoconferenciaFenixModule from '../../modules/comun/VideoconferenciaFenixModule';
import TacticalSimulatorModule from '../../modules/entrenadores/TacticalSimulatorModule';
import EvaluacionJugadorModule from '../../modules/entrenadores/EvaluacionJugadorModule';
import CoachLesionesModule from '../../modules/entrenadores/CoachLesionesModule';
import VideosAnalisisModule from '../../modules/entrenadores/VideosAnalisisModule';
import PlantillaElegibilidadModule from '../../modules/entrenadores/PlantillaElegibilidadModule';
import api from '../../utils/api';
import { useAuthGuard } from '../../utils/auth';
import { groupCategoriesByDiscipline } from '../../utils/categories';

const SUBMODULES = [
  {
    key: 'planificacion',
    label: 'Planificación & Campo',
    desc: 'Microciclos y Sesiones',
    icon: ClipboardList,
  },
  {
    key: 'ejercicios',
    label: 'Biblioteca Tareas 2D',
    desc: '100+ Tareas y Ejercicios',
    icon: Sparkles,
  },
  {
    key: 'simulador',
    label: 'Tabla de Juego 2D',
    desc: 'Pizarra táctica y ejercicios',
    icon: Crosshair,
  },
  {
    key: 'videollamada',
    label: 'Aula Virtual & Videollamada',
    desc: 'Clases remotas y charlas',
    icon: Video,
  },
  {
    key: 'evaluacion',
    label: 'Evaluación de Rendimiento',
    desc: 'Física, Técnica y Coordinativa',
    icon: Award,
  },
  {
    key: 'lesiones',
    label: 'Lesiones & Fisio',
    desc: 'Parte médico y reportes',
    icon: HeartPulse,
  },
  {
    key: 'videos',
    label: 'Videoteca Análisis',
    desc: 'YouTube y clips',
    icon: Tv,
  },
  {
    key: 'plantilla',
    label: 'Plantilla para Convocatoria',
    desc: 'Categorías y convocatorias',
    icon: Users,
  },
];

export default function PortalCoach() {
  const { user, checking } = useAuthGuard(['ENTRENADOR']);
  const [activeTab, setActiveTab] = useState('planificacion');
  const [selectedTrabajoForBoard, setSelectedTrabajoForBoard] = useState(null);
  const [dashboard, setDashboard] = useState({
    tacticas: [],
    microciclos: [],
    videos: [],
    categories: [],
    players: [],
    upcomingMatches: [],
    trabajos: [],
    evaluaciones: [],
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [coachSizes, setCoachSizes] = useState({
    talla_camiseta: 'M',
    talla_short: 'M',
    talla_zapatos: '',
  });
  const [sizesModalOpen, setSizesModalOpen] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);
  const [sizesFeedback, setSizesFeedback] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const [res, meRes] = await Promise.all([
        api.get('/coach/dashboard', {
          params: selectedCategory ? { id_categoria: selectedCategory } : {},
        }),
        api.get('/auth/me').catch(() => null),
      ]);
      setDashboard(res.data);
      if (meRes?.data?.user) {
        setCoachSizes({
          talla_camiseta: meRes.data.user.talla_camiseta || 'M',
          talla_short: meRes.data.user.talla_short || 'M',
          talla_zapatos: meRes.data.user.talla_zapatos || '',
        });
      }
    } catch (err) {
      console.error('Error cargando portal entrenador:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const handleSaveCoachSizes = async (e) => {
    e.preventDefault();
    setSavingSizes(true);
    setSizesFeedback('');
    try {
      await api.patch('/auth/profile-sizes', coachSizes);
      setSizesFeedback('Tus tallas de camisa, shorts y zapatos han sido guardadas.');
      setTimeout(() => {
        setSizesModalOpen(false);
        setSizesFeedback('');
      }, 1200);
    } catch (err) {
      setSizesFeedback(err.response?.data?.error || 'Error guardando tus tallas.');
    } finally {
      setSavingSizes(false);
    }
  };

  useEffect(() => {
    if (!checking && user) {
      loadDashboard();
    }
  }, [checking, user, loadDashboard]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-negro-fondo text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-vinotinto border-t-rojo-fuego rounded-full animate-spin mx-auto" />
          <p className="text-sm text-texto-secundario">Cargando Dirección Técnica...</p>
        </div>
      </div>
    );
  }

  const filteredPlayers = selectedCategory
    ? dashboard.players.filter((p) => String(p.id_categoria) === String(selectedCategory))
    : dashboard.players;
  const groupedCategories = groupCategoriesByDiscipline(dashboard.categories || []);
  const aptosCount = filteredPlayers.filter((p) => p.estado_cuenta !== 'Moroso' && !p.en_enfermeria).length;
  const lesionadosCount = filteredPlayers.filter((p) => p.en_enfermeria || p.estado_clinico === 'Lesionado').length;
  const nextMatch = dashboard.upcomingMatches?.[0] || null;

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Portal de Entrenadores y Metodología • Gesdep Hub" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full flex-1">
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
            Panel Técnico Oficial • Legión Fénix FC
          </span>
        </div>

        {/* Cabecera Principal Institucional */}
        <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rojo-fuego/20 border border-rojo-fuego/60 text-rojo-fuego text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Dirección Técnica • {user?.nombre}
              </span>
              <span className="hidden sm:inline-block text-neutral-500">•</span>
              <span className="text-xs text-neutral-400 font-semibold">
                Legión Fénix FC (Metodología de Alto Rendimiento)
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-wide">
              PANEL TÉCNICO Y METODOLOGÍA
            </h1>
            <p className="text-xs text-texto-secundario max-w-2xl">
              Sistema integral de planificación, pizarras 2D interactivas, baremos físicos-técnicos y convocatorias oficiales por categoría y disciplina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSizesModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#181820] hover:bg-vinotinto border border-neutral-700 hover:border-rojo-fuego text-xs font-bold text-white inline-flex items-center gap-2 transition shadow-sm"
              title="Actualizar tallas de indumentaria del entrenador"
            >
              <Shirt className="w-4 h-4 text-amber-300" />
              <span>
                Mis Tallas: {coachSizes.talla_camiseta || '-'} / {coachSizes.talla_short || '-'} / Zap.{' '}
                {coachSizes.talla_zapatos || '--'}
              </span>
            </button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-fenix w-auto min-w-[210px] text-xs font-semibold"
            >
              <option value="">Todas las Categorías</option>
              {groupedCategories.map((group) => (
                <optgroup key={group.key} label={group.label}>
                  {group.items.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre} ({group.short})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Top Command Bar estilo Gesdep 4.0: Resumen Ejecutivo de Mando Deportivo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setActiveTab('plantilla')}
            className="cursor-pointer card-fenix p-3.5 border-l-4 border-l-cyan-500 hover:border-cyan-400 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                Plantilla Total
              </span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {filteredPlayers.length}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">
              {selectedCategory ? 'En categoría activa' : 'En todas las categorías'}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('plantilla')}
            className="cursor-pointer card-fenix p-3.5 border-l-4 border-l-emerald-500 hover:border-emerald-400 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Aptos Convocatoria
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-300 mt-1">
              {aptosCount}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">Al día y sin lesiones</p>
          </div>

          <div
            onClick={() => setActiveTab('lesiones')}
            className="cursor-pointer card-fenix p-3.5 border-l-4 border-l-amber-500 hover:border-amber-400 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                En Enfermería
              </span>
              <HeartPulse className="w-4 h-4 text-amber-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
              {lesionadosCount}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">Seguimiento fisioterapéutico</p>
          </div>

          <div className="card-fenix p-3.5 border-l-4 border-l-rojo-fuego">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                Próximo Compromiso
              </span>
              <Award className="w-4 h-4 text-rojo-fuego" />
            </div>
            {nextMatch ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-white truncate">
                  vs {nextMatch.rival}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {new Date(nextMatch.fecha_hora).toLocaleDateString('es-VE', {
                    day: 'numeric',
                    month: 'short',
                  })} • {nextMatch.categoria_nombre || nextMatch.modalidad}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 mt-1">Sin partidos programados</p>
            )}
          </div>
        </div>

        {/* Barra de Navegación Modular estilo Gesdep 4.0 */}
        <div className="border-b border-neutral-800 pb-3">
          <div className="flex flex-wrap items-center gap-2 py-1">
            {SUBMODULES.map((sub) => {
              const Icon = sub.icon;
              const active = activeTab === sub.key;

              // Conteos dinámicos en badges
              let badgeCount = null;
              if (sub.key === 'planificacion') badgeCount = (dashboard.microciclos?.length || 0) + (dashboard.trabajos?.length || 0) || null;
              if (sub.key === 'ejercicios') badgeCount = '100+';
              if (sub.key === 'videollamada') badgeCount = 'Live';
              if (sub.key === 'simulador') badgeCount = dashboard.tacticas?.length || null;
              if (sub.key === 'evaluacion') badgeCount = dashboard.evaluaciones?.length || null;
              if (sub.key === 'lesiones') badgeCount = lesionadosCount > 0 ? lesionadosCount : null;
              if (sub.key === 'plantilla') badgeCount = filteredPlayers.length || null;
              if (sub.key === 'videos') badgeCount = dashboard.videos?.length || null;

              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setActiveTab(sub.key)}
                  className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2.5 ${
                    active
                      ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                      : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs whitespace-nowrap">{sub.label}</span>
                      {badgeCount !== null && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            active
                              ? 'bg-rojo-fuego text-white'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'planificacion' && (
          <PlanificacionCampoModule
            microciclos={dashboard.microciclos || []}
            trabajos={dashboard.trabajos || []}
            categories={dashboard.categories}
            players={dashboard.players || []}
            isAdmin={user?.rol === 'ADMINISTRADOR'}
            onReloadDashboard={loadDashboard}
            onOpenInTacticalBoard={(job) => {
              setSelectedTrabajoForBoard(job.id_trabajo);
              setActiveTab('simulador');
            }}
          />
        )}

        {activeTab === 'ejercicios' && (
          <EjerciciosBibliotecaModule
            categories={dashboard.categories}
            onOpenInTacticalSimulator={(exercise) => {
              setActiveTab('simulador');
            }}
          />
        )}

        {activeTab === 'videollamada' && (
          <VideoconferenciaFenixModule
            userRole={user?.rol || 'ENTRENADOR'}
            userName={user?.nombre || 'Profesor Legión Fénix'}
          />
        )}

        {activeTab === 'simulador' && (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                TABLA DE JUEGO 2D (CAMPO, FÚTBOL 7 Y SALA)
              </h2>
              <p className="text-xs text-texto-secundario">
                Submenús deslizantes para Jugadores (1–22), Rivales (1–22), Materiales (conos, tapas, vallas, aros) y Pases/Movimientos vinculados a tus Trabajos.
              </p>
            </div>
            <TacticalSimulatorModule
              tacticas={dashboard.tacticas}
              trabajos={dashboard.trabajos || []}
              categories={dashboard.categories}
              players={dashboard.players || []}
              selectedCategoryFilter={selectedCategory}
              initialTrabajoId={selectedTrabajoForBoard}
              onCreated={loadDashboard}
            />
          </section>
        )}

        {activeTab === 'evaluacion' && (
          <EvaluacionJugadorModule
            categories={dashboard.categories}
            players={dashboard.players}
            evaluaciones={dashboard.evaluaciones || []}
            selectedCategoryFilter={selectedCategory}
            onReload={loadDashboard}
          />
        )}

        {activeTab === 'lesiones' && <CoachLesionesModule players={filteredPlayers} />}

        {activeTab === 'videos' && (
          <VideosAnalisisModule
            videos={dashboard.videos}
            categories={dashboard.categories}
            onReload={loadDashboard}
          />
        )}

        {activeTab === 'plantilla' && (
          <PlantillaElegibilidadModule
            players={dashboard.players || []}
            categories={dashboard.categories}
            upcomingMatches={dashboard.upcomingMatches || []}
            selectedCategoryFilter={selectedCategory}
            onReload={loadDashboard}
          />
        )}
      </main>

      {/* Modal Tallas del Entrenador */}
      {sizesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSizesModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCoachSizes}
            onClick={(e) => e.stopPropagation()}
            className="card-fenix max-w-md w-full p-6 border-vinotinto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                  Información del Entrenador
                </p>
                <h3 className="font-display text-2xl font-bold text-white">
                  INDUMENTARIA Y CALZADO
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSizesModalOpen(false)}
                className="p-1.5 rounded bg-neutral-800 hover:bg-rojo-fuego text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sizesFeedback && (
              <div className="bg-green-950/60 border border-green-600 text-green-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span>{sizesFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla de Camisa*
                </label>
                <select
                  className="input-fenix text-xs"
                  value={coachSizes.talla_camiseta}
                  onChange={(e) => setCoachSizes({ ...coachSizes, talla_camiseta: e.target.value })}
                >
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
                    <option key={s} value={s}>Talla {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla de Shorts*
                </label>
                <select
                  className="input-fenix text-xs"
                  value={coachSizes.talla_short}
                  onChange={(e) => setCoachSizes({ ...coachSizes, talla_short: e.target.value })}
                >
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
                    <option key={s} value={s}>Talla {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla de Zapatos*
                </label>
                <input
                  type="text"
                  className="input-fenix text-xs"
                  placeholder="Ej: 42"
                  value={coachSizes.talla_zapatos}
                  onChange={(e) => setCoachSizes({ ...coachSizes, talla_zapatos: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={savingSizes} className="btn-cta w-full text-xs py-2.5">
              <Save className="w-4 h-4" />
              {savingSizes ? 'Guardando...' : 'Guardar Mis Tallas'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
