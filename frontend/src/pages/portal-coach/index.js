import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  Crosshair,
  Video,
  Users,
  Box,
  Award,
  HeartPulse,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import MicrociclosModule from '../../modules/entrenadores/MicrociclosModule';
import Trabajos3DSchedulerModule from '../../modules/entrenadores/Trabajos3DSchedulerModule';
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
    key: 'microciclos',
    label: 'Microciclos',
    desc: '3 Bloques semanales',
    icon: ClipboardList,
  },
  {
    key: 'trabajos3d',
    label: 'Trabajo en Cancha',
    desc: 'Hora, espacio y modalidad',
    icon: Box,
  },
  {
    key: 'simulador',
    label: 'Tabla de Juego 2D',
    desc: 'Pizarra táctica y ejercicios',
    icon: Crosshair,
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
    icon: Video,
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
  const [activeTab, setActiveTab] = useState('microciclos');
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

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get('/coach/dashboard', {
        params: selectedCategory ? { id_categoria: selectedCategory } : {},
      });
      setDashboard(res.data);
    } catch (err) {
      console.error('Error cargando portal entrenador:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

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

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Portal de Entrenadores y Metodología" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1">
        {/* Cabecera + Filtro Global de Categoría */}
        <div className="card-fenix p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-rojo-fuego">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego">
              Cuerpo Técnico Legión Fénix • {user?.nombre}
            </span>
            <h1 className="font-display text-3xl font-extrabold text-white">
              DIRECCIÓN TÉCNICA Y METODOLOGÍA
            </h1>
            <p className="text-xs text-texto-secundario mt-1">
              Módulo estructurado por submódulos: microciclos, trabajos de cancha por horario y espacio, tabla de juego 2D, evaluación manual, asistencia y enlace clínico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-fenix w-auto min-w-[230px]"
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

        {/* Grid de Submódulos Organizados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {SUBMODULES.map((sub) => {
            const Icon = sub.icon;
            const active = activeTab === sub.key;
            return (
              <button
                key={sub.key}
                type="button"
                onClick={() => setActiveTab(sub.key)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                  active
                    ? 'bg-vinotinto border-rojo-fuego text-white shadow-fenix'
                    : 'bg-gris-tarjeta border-neutral-800 text-texto-secundario hover:text-white hover:border-vinotinto/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-rojo-fuego'}`} />
                <div>
                  <p className="text-xs font-extrabold leading-tight">{sub.label}</p>
                  <p className="text-[10px] opacity-75 truncate mt-0.5">{sub.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {activeTab === 'microciclos' && (
          <MicrociclosModule
            microciclos={dashboard.microciclos}
            categories={dashboard.categories}
            onReload={loadDashboard}
          />
        )}

        {activeTab === 'trabajos3d' && (
          <Trabajos3DSchedulerModule
            mode="ENTRENADOR"
            categories={dashboard.categories}
            players={dashboard.players}
            isAdmin={user?.rol === 'ADMINISTRADOR'}
            onReloadDashboard={loadDashboard}
            onOpenInTacticalBoard={(job) => {
              setSelectedTrabajoForBoard(job.id_trabajo);
              setActiveTab('simulador');
            }}
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
            players={filteredPlayers}
            categories={dashboard.categories}
            upcomingMatches={dashboard.upcomingMatches || []}
            selectedCategoryFilter={selectedCategory}
          />
        )}
      </main>
    </div>
  );
}
