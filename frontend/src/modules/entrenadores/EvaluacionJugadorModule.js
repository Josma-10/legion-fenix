import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  Users,
  Save,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { DISCIPLINES, groupCategoriesByDiscipline } from '../../utils/categories';

// Catálogo Profesional de Tests y Criterios Oficiales
export const TEST_CATALOG = {
  FISICA: {
    label: 'Evaluación Física',
    icon: Zap,
    color: 'from-amber-600 to-rojo-fuego',
    desc: 'Velocidad, resistencia aeróbica y potencia muscular',
    tests: [
      {
        id: 'vel_30m',
        name: 'Velocidad y Arranque (Sprint 30m)',
        field: 'fisica_velocidad',
        unit: 'seg',
        placeholder: 'Ej: 4.30',
        min: 3.5,
        max: 8.0,
        step: 0.05,
        defaultVal: 4.6,
        calculate: (val) => {
          const v = Number(val);
          if (v <= 4.1) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v <= 4.4) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v <= 4.7) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v <= 5.0) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v <= 5.4) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'cooper',
        name: 'Resistencia Aeróbica (Test de Cooper)',
        field: 'fisica_resistencia',
        unit: 'metros',
        placeholder: 'Ej: 2600',
        min: 1000,
        max: 4000,
        step: 50,
        defaultVal: 2500,
        calculate: (val) => {
          const v = Number(val);
          if (v >= 3000) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 2800) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 2600) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 2350) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 2100) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'salto_abalakov',
        name: 'Potencia / Salto Vertical (Abalakov)',
        field: 'fisica_fuerza',
        unit: 'cm',
        placeholder: 'Ej: 42',
        min: 15,
        max: 75,
        step: 1,
        defaultVal: 38,
        calculate: (val) => {
          const v = Number(val);
          if (v >= 50) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 44) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 38) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 32) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 26) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
    ],
  },
  TECNICA: {
    label: 'Evaluación Técnica con Balón',
    icon: Award,
    color: 'from-rojo-fuego to-vinotinto',
    desc: 'Control orientado, precisión de pase, regate y definición',
    tests: [
      {
        id: 'control_orientado',
        name: 'Control Orientado y Perfilamiento',
        field: 'tecnica_control',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.5',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'precision_pase',
        name: 'Precisión de Pase Corto y Largo',
        field: 'tecnica_pase',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.0',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'remate_definicion',
        name: 'Efectividad de Remate y Definición',
        field: 'tecnica_definicion',
        unit: 'aciertos/10',
        placeholder: 'Ej: 8',
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 7,
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9) return { score: 10.0, pct: 100, tag: 'Goleador Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 5) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
    ],
  },
  COORDINATIVA: {
    label: 'Evaluación Coordinativa y Agilidad',
    icon: Activity,
    color: 'from-cyan-600 to-blue-700',
    desc: 'Agilidad, cambio de dirección, equilibrio y ritmo motor',
    tests: [
      {
        id: 'illinois_test',
        name: 'Test de Agilidad Illinois (Cambio de Dirección)',
        field: 'coordinativa_agilidad',
        unit: 'seg',
        placeholder: 'Ej: 15.80',
        min: 13.0,
        max: 24.0,
        step: 0.1,
        defaultVal: 16.5,
        calculate: (val) => {
          const v = Number(val);
          if (v <= 15.0) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v <= 16.0) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v <= 17.2) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v <= 18.5) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v <= 20.0) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'escalera_coordinacion',
        name: 'Escalera de Coordinación y Frecuencia',
        field: 'coordinativa_ritmo',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.0',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'equilibrio_monopodal',
        name: 'Equilibrio Dinámico y Estabilidad',
        field: 'coordinativa_equilibrio',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 7.8',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
    ],
  },
};

export default function EvaluacionJugadorModule({
  categories = [],
  players = [],
  evaluaciones = [],
  selectedCategoryFilter = '',
  onReload,
}) {
  const [activeTestCategory, setActiveTestCategory] = useState('FISICA'); // FISICA | TECNICA | COORDINATIVA
  const [selectedTestId, setSelectedTestId] = useState('vel_30m');
  const [viewMode, setViewMode] = useState('group'); // 'group' | 'individual'

  const [activeDiscipline, setActiveDiscipline] = useState('Campo');
  const [catFilter, setCatFilter] = useState('');
  const [testValues, setTestValues] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Para modo individual
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const groupedCategories = useMemo(() => groupCategoriesByDiscipline(categories), [categories]);

  // Sincronizar filtro inicial
  useEffect(() => {
    if (selectedCategoryFilter) {
      setCatFilter(String(selectedCategoryFilter));
      const match = categories.find((c) => String(c.id_categoria) === String(selectedCategoryFilter));
      if (match?.disciplina) setActiveDiscipline(match.disciplina);
    } else if (categories.length > 0 && !catFilter) {
      const firstInCampo = categories.find((c) => c.disciplina === 'Campo') || categories[0];
      setCatFilter(String(firstInCampo.id_categoria));
    }
  }, [categories, selectedCategoryFilter, catFilter]);

  // Actualizar test seleccionado al cambiar de categoría
  useEffect(() => {
    const tests = TEST_CATALOG[activeTestCategory]?.tests || [];
    if (tests.length > 0 && !tests.some((t) => t.id === selectedTestId)) {
      setSelectedTestId(tests[0].id);
    }
  }, [activeTestCategory, selectedTestId]);

  const currentTest = useMemo(() => {
    const list = TEST_CATALOG[activeTestCategory]?.tests || [];
    return list.find((t) => t.id === selectedTestId) || list[0];
  }, [activeTestCategory, selectedTestId]);

  // Atletas filtrados por categoría activa
  const categoryPlayers = useMemo(() => {
    if (!catFilter) return players;
    return players.filter((p) => String(p.id_categoria) === String(catFilter));
  }, [players, catFilter]);

  // Inicializar valores de prueba por defecto para los atletas de la categoría
  useEffect(() => {
    if (!currentTest) return;
    const initialMap = {};
    categoryPlayers.forEach((p) => {
      initialMap[p.id_jugador] = currentTest.defaultVal;
    });
    setTestValues((prev) => ({ ...initialMap, ...prev }));
  }, [categoryPlayers, currentTest]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => String(c.id_categoria) === String(catFilter)),
    [categories, catFilter]
  );

  const activePlayer = useMemo(
    () =>
      categoryPlayers.find((p) => String(p.id_jugador) === String(selectedPlayerId)) ||
      categoryPlayers[0] ||
      null,
    [categoryPlayers, selectedPlayerId]
  );

  const handleTestValueChange = (idJugador, val) => {
    setTestValues((prev) => ({ ...prev, [idJugador]: val }));
  };

  const handleSaveBatch = async () => {
    if (categoryPlayers.length === 0) return;
    setSavingBatch(true);
    setFeedback('');
    setErrorMsg('');

    try {
      const records = categoryPlayers.map((p) => {
        const rawVal = testValues[p.id_jugador] ?? currentTest.defaultVal;
        const result = currentTest.calculate(rawVal);
        return {
          id_jugador: p.id_jugador,
          valor: rawVal,
          unidad: currentTest.unit,
          nota: result.score,
          porcentaje: result.pct,
          clasificacion: result.tag,
        };
      });

      const res = await api.post('/coach/evaluations/batch', {
        test_type: activeTestCategory,
        test_name: currentTest.name,
        records,
      });

      setFeedback(res.data.message || 'Evaluaciones grupales guardadas exitosamente.');
      if (onReload) await onReload();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar evaluaciones grupales.');
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TRES BOTONES PRINCIPALES DE EVALUACIÓN (FÍSICA, TÉCNICA, COORDINATIVA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TEST_CATALOG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTestCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTestCategory(key);
                setFeedback('');
                setErrorMsg('');
              }}
              className={`p-5 rounded-2xl border transition text-left flex flex-col justify-between gap-3 relative overflow-hidden group ${
                isActive
                  ? 'bg-gradient-to-br from-[#181820] to-[#121216] border-rojo-fuego shadow-fenix ring-1 ring-rojo-fuego/50 scale-[1.02]'
                  : 'bg-[#121216] border-neutral-800 hover:border-vinotinto hover:bg-[#16161c]'
              }`}
            >
              {isActive && (
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.color}`} />
              )}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-vinotinto/30 border border-vinotinto/50 flex items-center justify-center text-rojo-fuego">
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-rojo-fuego text-white border-white/20'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {config.tests.length} Pruebas
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-rojo-fuego transition">
                  {config.label}
                </h3>
                <p className="text-xs text-texto-secundario mt-1">{config.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 group-hover:text-white pt-2 border-t border-neutral-800/80">
                <span>{isActive ? '✓ Evaluación Activa' : 'Seleccionar Bloque'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-rojo-fuego" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. BARRA DE PRUEBA ESPECÍFICA Y SELECTOR DE DISCIPLINA / CATEGORÍA */}
      <div className="card-fenix p-5 space-y-4 border-l-4 border-l-rojo-fuego">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rojo-fuego">
              Pruebas Disponibles para: {TEST_CATALOG[activeTestCategory]?.label}
            </span>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {currentTest?.name}
            </h3>
          </div>

          {/* Selector de Pruebas del Bloque */}
          <div className="flex flex-wrap gap-2">
            {TEST_CATALOG[activeTestCategory]?.tests.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTestId(test.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  selectedTestId === test.id
                    ? 'bg-rojo-fuego border-white text-white shadow-fenix'
                    : 'bg-[#16161c] border-neutral-800 text-neutral-300 hover:border-vinotinto hover:text-white'
                }`}
              >
                {test.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. SELECTOR JERÁRQUICO DE CATEGORÍAS */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setActiveDiscipline(d.key);
                  const firstOfDisc = categories.find((c) => c.disciplina === d.key);
                  if (firstOfDisc) setCatFilter(String(firstOfDisc.id_categoria));
                }}
                className={`p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                  activeDiscipline === d.key
                    ? 'bg-vinotinto border-rojo-fuego text-white shadow'
                    : 'bg-[#151518] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span>{d.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-neutral-300">
                  9 Cat.
                </span>
              </button>
            ))}
          </div>

          {/* Submenú de las 9 categorías */}
          {groupedCategories
            .filter((g) => g.key === activeDiscipline)
            .map((group) => (
              <div
                key={group.key}
                className="bg-[#141418] border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center gap-1.5"
              >
                <span className="text-xs font-bold text-rojo-fuego mr-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Categoría:
                </span>
                {group.items.map((cat) => {
                  const isSelected = String(catFilter) === String(cat.id_categoria);
                  return (
                    <button
                      key={cat.id_categoria}
                      type="button"
                      onClick={() => setCatFilter(String(cat.id_categoria))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-rojo-fuego border-white text-white shadow-fenix'
                          : 'bg-[#1a1a20] border-neutral-800 text-neutral-300 hover:border-vinotinto hover:text-white'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-950/70 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {feedback}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/70 border border-rose-600 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" /> {errorMsg}
        </div>
      )}

      {/* 4. MODO GRUPO (EVALUACIÓN MASIVA POR CATEGORÍA) */}
      <div className="card-fenix p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-rojo-fuego" />
              Evaluación Grupal: {activeCategoryObj?.nombre || 'Categoría'} ({categoryPlayers.length} Atletas)
            </h3>
            <p className="text-xs text-texto-secundario mt-0.5">
              Ingresa la marca obtenida por cada atleta en <strong className="text-white">{currentTest.name}</strong> ({currentTest.unit}). El sistema clasifica y asigna el porcentaje automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={savingBatch || categoryPlayers.length === 0}
              className="btn-cta text-xs py-2.5 px-4 shadow-fenix flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingBatch ? 'Guardando...' : `Guardar Evaluación Grupal (${categoryPlayers.length})`}
            </button>
          </div>
        </div>

        {categoryPlayers.length === 0 ? (
          <div className="bg-[#121215] border border-dashed border-neutral-800 rounded-xl p-10 text-center space-y-2">
            <Users className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-neutral-300">
              No hay atletas registrados en {activeCategoryObj?.nombre || 'esta categoría'}.
            </p>
            <p className="text-xs text-texto-secundario">
              Selecciona otra categoría en el menú superior para evaluar a sus atletas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Dorsal & Atleta</th>
                  <th className="py-3 px-3">Posición / Pie</th>
                  <th className="py-3 px-3 text-center">Marca Registrada ({currentTest.unit})</th>
                  <th className="py-3 px-3 text-center">Clasificación & Porcentaje</th>
                  <th className="py-3 px-3 text-center">Puntaje</th>
                  <th className="py-3 px-3 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {categoryPlayers.map((player) => {
                  const val = testValues[player.id_jugador] ?? currentTest.defaultVal;
                  const res = currentTest.calculate(val);
                  return (
                    <tr
                      key={player.id_jugador}
                      className="hover:bg-[#16161c] transition group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-vinotinto/30 border border-vinotinto flex items-center justify-center font-display font-bold text-white text-sm">
                            #{player.dorsal || '--'}
                          </span>
                          <div>
                            <p className="font-bold text-white group-hover:text-rojo-fuego transition text-sm">
                              {player.nombre} {player.apellido}
                            </p>
                            <p className="text-[10px] text-texto-secundario">
                              ID Atleta #{player.id_jugador}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-neutral-300">
                        <span className="font-semibold">{player.posicion_habitual}</span>
                        <p className="text-[10px] text-texto-secundario">Pie: {player.pierna_habil || 'Derecho'}</p>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="number"
                            step={currentTest.step}
                            min={currentTest.min}
                            max={currentTest.max}
                            value={val}
                            onChange={(e) => handleTestValueChange(player.id_jugador, e.target.value)}
                            className="input-fenix w-28 text-center text-sm font-bold text-white bg-[#101014] border-neutral-700 py-1.5"
                          />
                          <span className="text-neutral-400 font-semibold">{currentTest.unit}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${res.cls}`}>
                            {res.tag} • {res.pct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-display text-base font-extrabold text-white">
                          {Number(res.score).toFixed(1)}
                          <span className="text-[10px] text-neutral-400 font-normal">/10</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerId(String(player.id_jugador))}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-vinotinto text-[11px] font-bold text-neutral-200 transition"
                        >
                          Ver Radar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {categoryPlayers.length > 0 && (
          <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-texto-secundario">
              * Las calificaciones se promedian y nutren la ficha deportiva del atleta automáticamente.
            </span>
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={savingBatch}
              className="btn-cta text-xs py-2 px-5 shadow-fenix flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingBatch ? 'Guardando...' : `Guardar Evaluación Grupal (${categoryPlayers.length} Atletas)`}
            </button>
          </div>
        )}
      </div>

      {/* 5. VISTA DE RADAR / EXPEDIENTE INDIVIDUAL (SI SE SELECCIONA UN ATLETA) */}
      {activePlayer && selectedPlayerId && (
        <div className="card-fenix p-6 space-y-4 border-vinotinto">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-rojo-fuego" />
              Expediente Deportivo Completo: {activePlayer.nombre} {activePlayer.apellido}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedPlayerId('')}
              className="text-xs font-bold text-neutral-400 hover:text-white"
            >
              Ocultar Radar ✕
            </button>
          </div>
          <PlayerCardModule player={activePlayer} compact />
        </div>
      )}
    </div>
  );
}
