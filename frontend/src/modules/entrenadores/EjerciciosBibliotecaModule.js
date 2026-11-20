import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Plus,
  Search,
  SlidersHorizontal,
  Flame,
  Shield,
  Zap,
  Lock,
  Crosshair,
  Users,
  Target,
  ShieldAlert,
  Activity,
  Smile,
  Box,
  RotateCw,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Save,
  Trash2,
  Share2,
} from 'lucide-react';
import Pitch2DBoard from '../../components/Pitch2DBoard';
import {
  SECCIONES_EJERCICIOS,
  EJERCICIOS_PREDETERMINADOS,
} from '../../utils/ejerciciosData';

const SECTION_ICONS = {
  todos: SlidersHorizontal,
  calentamientos: Flame,
  juegos_ludicos: Smile,
  rondos: RotateCw,
  posesiones: Shield,
  reducidos: Box,
  transiciones: Zap,
  defensivo: Lock,
  finalizaciones: Crosshair,
  sistemas: Users,
  balon_parado: Target,
  porteros: ShieldAlert,
  fisico: Activity,
};

export default function EjerciciosBibliotecaModule({
  onOpenInTacticalSimulator,
  onAssignToScheduler,
  categories = [],
}) {
  const [seccionActiva, setSeccionActiva] = useState('todos');
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(EJERCICIOS_PREDETERMINADOS[0]);

  // Lista de ejercicios (predeterminados + personalizados guardados por el entrenador)
  const [customEjercicios, setCustomEjercicios] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // Estado de reproducción y animación 2D del ejercicio seleccionado
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  // Formulario de edición o creación de ejercicio
  const [editForm, setEditForm] = useState(null);

  // Cargar ejercicios personalizados de localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('legion_custom_ejercicios');
      if (stored) {
        setCustomEjercicios(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const allExercises = useMemo(() => {
    return [...customEjercicios, ...EJERCICIOS_PREDETERMINADOS];
  }, [customEjercicios]);

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchSeccion = seccionActiva === 'todos' || ex.seccion === seccionActiva;
      const matchModalidad = modalidadFilter === 'Todas' || ex.modalidad === modalidadFilter;
      const q = busqueda.toLowerCase().trim();
      const matchQuery =
        !q ||
        ex.titulo.toLowerCase().includes(q) ||
        ex.objetivo.toLowerCase().includes(q) ||
        ex.seccion.toLowerCase().includes(q) ||
        (ex.espacio && ex.espacio.toLowerCase().includes(q));
      return matchSeccion && matchModalidad && matchQuery;
    });
  }, [allExercises, seccionActiva, modalidadFilter, busqueda]);

  // Si el ejercicio actual ya no está en los filtrados, seleccionar el primero disponible
  useEffect(() => {
    if (filteredExercises.length > 0 && !filteredExercises.some((e) => e.id === selectedExercise?.id)) {
      setSelectedExercise(filteredExercises[0]);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  }, [filteredExercises, selectedExercise]);

  // Motor de Animación 2D por pasos
  useEffect(() => {
    if (isPlaying && selectedExercise?.pasos && selectedExercise.pasos.length > 1) {
      const stepDuration = 2800 / playbackSpeed;
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => (prev + 1) % selectedExercise.pasos.length);
      }, stepDuration);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, selectedExercise, playbackSpeed]);

  const handleSelectExercise = (ex) => {
    setSelectedExercise(ex);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsEditing(false);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleResetAnimation = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  // Abrir en la Pizarra Táctica 2D completa
  const handleOpenInBoard = () => {
    if (onOpenInTacticalSimulator) {
      onOpenInTacticalSimulator({
        titulo: selectedExercise.titulo,
        modalidad: selectedExercise.modalidad,
        pasos: selectedExercise.pasos,
      });
    }
  };

  // Guardar edición rápida
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;

    const updatedList = allExercises.map((ex) => (ex.id === editForm.id ? editForm : ex));
    const onlyCustom = updatedList.filter((ex) => ex.isCustom || ex.id.startsWith('cust-'));
    if (!editForm.isCustom) {
      // convert to custom
      const newCustom = { ...editForm, id: `cust-${Date.now()}`, isCustom: true };
      setCustomEjercicios([newCustom, ...customEjercicios]);
      localStorage.setItem('legion_custom_ejercicios', JSON.stringify([newCustom, ...customEjercicios]));
      setSelectedExercise(newCustom);
    } else {
      setCustomEjercicios(onlyCustom);
      localStorage.setItem('legion_custom_ejercicios', JSON.stringify(onlyCustom));
      setSelectedExercise(editForm);
    }
    setIsEditing(false);
  };

  // Crear nuevo ejercicio
  const handleCreateNew = (e) => {
    e.preventDefault();
    const newEx = {
      ...editForm,
      id: `cust-${Date.now()}`,
      isCustom: true,
      pasos: [
        {
          descripcion: 'Fase 1: Disposición inicial del ejercicio',
          jugadores: [
            { id: 'J-1', dorsal: 10, label: '10', rol: 'ATA', team: 'A', color: 'vinotinto', x: 45, y: 65 },
            { id: 'J-2', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 55, y: 65 },
            { id: 'D-1', dorsal: 4, label: '4', rol: 'DEF', team: 'B', color: 'azul', x: 50, y: 35 },
          ],
          balon: { x: 47, y: 63 },
          trajectories: [{ kind: 'pase_corto', from: { x: 47, y: 63 }, to: { x: 50, y: 45 } }],
        },
      ],
    };
    const nextList = [newEx, ...customEjercicios];
    setCustomEjercicios(nextList);
    localStorage.setItem('legion_custom_ejercicios', JSON.stringify(nextList));
    setSelectedExercise(newEx);
    setShowNewModal(false);
    setCurrentStepIndex(0);
  };

  const activeStep = selectedExercise?.pasos?.[currentStepIndex] || selectedExercise?.pasos?.[0] || {
    jugadores: [],
    balon: { x: 50, y: 50 },
    trajectories: [],
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera del Banco de Tareas y Ejercicios */}
      <div className="card-fenix p-5 border-l-4 border-l-dorado-fenix flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-dorado-fenix/20 border border-dorado-fenix text-dorado-fenix text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Metodología Tareas Fútbol Base
            </span>
            <span className="text-xs text-neutral-400 font-semibold">• 100+ Tareas Predeterminadas y Editables</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            BIBLIOTECA DE TAREAS Y EJERCICIOS 2D
          </h2>
          <p className="text-xs text-texto-secundario max-w-2xl">
            Catálogo metodológico estructurado en 12 bloques formativos con simulación animada en 2D, fichas técnicas completas y total capacidad de edición personalizada para el entrenador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditForm({
                titulo: '',
                seccion: 'rondos',
                modalidad: 'Campo',
                espacio: 'Media Cancha Norte',
                duracion: '15 min',
                jugadoresCount: '8 jugadores',
                materiales: ['Balones', 'Conos', 'Petos'],
                objetivo: '',
                descripcion: '',
                consignas: ['Mantener intensidad', 'Comunicación constante'],
                variantes: ['A 1 solo toque'],
              });
              setShowNewModal(true);
            }}
            className="btn-cta text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Crear Tarea Propia
          </button>
        </div>
      </div>

      {/* Barra de Filtros: 12 Secciones con Scroll Horizontal Ergonómico */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              className="input-fenix pl-9 text-xs"
              placeholder="Buscar por ejercicio, objetivo (ej: rondo 4v2, 1v1, centros, salida)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-semibold">Modalidad:</span>
            {['Todas', 'Campo', 'F7', 'Sala'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setModalidadFilter(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  modalidadFilter === mod
                    ? 'bg-vinotinto border-rojo-fuego text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Las 12 Secciones en Botones Píldora Deslizables */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {SECCIONES_EJERCICIOS.map((sec) => {
            const IconComponent = SECTION_ICONS[sec.key] || SlidersHorizontal;
            const active = seccionActiva === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setSeccionActiva(sec.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 border ${
                  active
                    ? 'bg-rojo-fuego text-white border-rojo-fuego shadow-md'
                    : 'bg-gris-tarjeta text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-black/30 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Principal: Grid Dividido (Lado Izquierdo Lista de Ejercicios, Lado Derecho Cancha 2D y Ficha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMNA IZQUIERDA: Selector de Tareas (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span className="font-bold uppercase tracking-wider">
              {filteredExercises.length} Ejercicios Disponibles
            </span>
            <span className="text-[11px] text-amber-400">Clic para simular</span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredExercises.length === 0 ? (
              <div className="card-fenix p-6 text-center text-neutral-500 text-xs">
                No se encontraron ejercicios en esta sección con los filtros actuales.
              </div>
            ) : (
              filteredExercises.map((ex) => {
                const isSelected = selectedExercise?.id === ex.id;
                return (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-vinotinto/80 to-[#22070f] border-rojo-fuego text-white shadow-lg'
                        : 'bg-gris-tarjeta border-neutral-800/80 hover:border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/40 border border-neutral-700 text-amber-300">
                        {ex.seccion.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                        <Clock className="w-3 h-3 text-neutral-500" /> {ex.duracion}
                        <span className="text-neutral-600">•</span>
                        <span className="text-neutral-300 font-bold">{ex.modalidad}</span>
                      </div>
                    </div>

                    <h4 className="font-display text-sm font-bold leading-tight">
                      {ex.titulo}
                    </h4>

                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {ex.objetivo}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rojo-fuego" /> {ex.espacio}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ex.jugadoresCount}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Pizarra 2D Animada y Ficha Técnica Completa (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedExercise ? (
            <>
              {/* Cancha 2D Animada y Controles de Reproducción */}
              <div className="card-fenix p-4 sm:p-5 border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rojo-fuego/20 text-rojo-fuego border border-rojo-fuego/50">
                        Simulador 2D Dinámico
                      </span>
                      <span className="text-xs text-neutral-400">
                        Paso {currentStepIndex + 1} de {selectedExercise.pasos?.length || 1}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {selectedExercise.titulo}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition ${
                        isPlaying
                          ? 'bg-amber-500 hover:bg-amber-600 text-black'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pausar' : 'Reproducir'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetAnimation}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                      title="Reiniciar a la Fase 1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-neutral-800 border border-neutral-700 rounded-lg text-xs px-2 py-1.5 text-white font-bold outline-none cursor-pointer"
                    >
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2.0x</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleOpenInBoard}
                      className="btn-vinotinto text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
                      title="Modificar posiciones, trayectorias y jugadores en la Pizarra Táctica 2D"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Editar en Pizarra</span>
                    </button>
                  </div>
                </div>

                {/* Explicación de la Fase Actual */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-semibold">
                    {activeStep.descripcion || 'Fase del ejercicio'}
                  </span>
                  <div className="flex gap-1">
                    {selectedExercise.pasos?.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentStepIndex(idx);
                        }}
                        className={`w-5 h-5 rounded text-[10px] font-bold ${
                          currentStepIndex === idx
                            ? 'bg-rojo-fuego text-white'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lienzo Cancha 2D */}
                <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                  <Pitch2DBoard
                    modalidad={selectedExercise.modalidad}
                    tokens={activeStep.jugadores || []}
                    balon={activeStep.balon || { x: 50, y: 50 }}
                    trajectories={activeStep.trajectories || []}
                    highlightSpace={selectedExercise.espacio}
                    interactive={false}
                    showTrajectories={true}
                    isPlaying={isPlaying}
                  />
                </div>
              </div>

              {/* Ficha Técnica Metodológica del Ejercicio */}
              <div className="card-fenix p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ficha Técnica y Consignas Metodológicas
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(JSON.parse(JSON.stringify(selectedExercise)));
                      setIsEditing(true);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar Parámetros
                  </button>
                </div>

                {/* Métricas del ejercicio en grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#121216] p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Duración</span>
                    <span className="text-white font-bold">{selectedExercise.duracion}</span>
                  </div>
                  <div className="bg-[#121216] p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Jugadores</span>
                    <span className="text-white font-bold">{selectedExercise.jugadoresCount}</span>
                  </div>
                  <div className="bg-[#121216] p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Espacio Cancha</span>
                    <span className="text-white font-bold">{selectedExercise.espacio}</span>
                  </div>
                  <div className="bg-[#121216] p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Modalidad</span>
                    <span className="text-amber-300 font-bold">{selectedExercise.modalidad}</span>
                  </div>
                </div>

                {/* Objetivo Táctico */}
                <div>
                  <h5 className="text-xs font-bold text-rojo-fuego uppercase tracking-wider mb-1">
                    Objetivo Principal
                  </h5>
                  <p className="text-xs text-neutral-200 bg-[#141419] p-3 rounded-lg border border-neutral-800">
                    {selectedExercise.objetivo}
                  </p>
                </div>

                {/* Desarrollo y Explicación */}
                <div>
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Desarrollo y Reglas de la Tarea
                  </h5>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-[#141419] p-3 rounded-lg border border-neutral-800">
                    {selectedExercise.descripcion}
                  </p>
                </div>

                {/* Consignas del Entrenador */}
                {selectedExercise.consignas && selectedExercise.consignas.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      Consignas Clave de Corrección
                    </h5>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {selectedExercise.consignas.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 bg-[#121216] p-2 rounded border border-neutral-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variantes Metodológicas */}
                {selectedExercise.variantes && selectedExercise.variantes.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-dorado-fenix uppercase tracking-wider mb-1">
                      Progresiones y Variantes
                    </h5>
                    <ul className="space-y-1 text-xs text-neutral-400">
                      {selectedExercise.variantes.map((v, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-dorado-fenix font-bold">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materiales Requeridos */}
                <div>
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Materiales Necesarios
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.materiales?.map((mat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-xs font-semibold"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card-fenix p-12 text-center text-neutral-400">
              Selecciona un ejercicio de la lista para visualizar su simulación 2D.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Editar Parámetros del Ejercicio */}
      {isEditing && editForm && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEditing(false)}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="card-fenix max-w-xl w-full p-6 space-y-4 border-rojo-fuego max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">
                Editar Tarea: {editForm.titulo}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-texto-secundario mb-1">Título del Ejercicio*</label>
                <input
                  type="text"
                  className="input-fenix"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-texto-secundario mb-1">Duración</label>
                  <input
                    type="text"
                    className="input-fenix"
                    value={editForm.duracion}
                    onChange={(e) => setEditForm({ ...editForm, duracion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-texto-secundario mb-1">Jugadores</label>
                  <input
                    type="text"
                    className="input-fenix"
                    value={editForm.jugadoresCount}
                    onChange={(e) => setEditForm({ ...editForm, jugadoresCount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-texto-secundario mb-1">Objetivo Metodológico</label>
                <textarea
                  className="input-fenix h-16"
                  value={editForm.objetivo}
                  onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-texto-secundario mb-1">Descripción y Reglas</label>
                <textarea
                  className="input-fenix h-24"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded bg-neutral-800 text-white text-xs font-bold"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-cta text-xs inline-flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para Crear Nueva Tarea desde Cero */}
      {showNewModal && editForm && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <form
            onSubmit={handleCreateNew}
            onClick={(e) => e.stopPropagation()}
            className="card-fenix max-w-xl w-full p-6 space-y-4 border-dorado-fenix max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">
                Crear Nueva Tarea Táctica
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-texto-secundario mb-1">Título de la Tarea*</label>
                <input
                  type="text"
                  className="input-fenix"
                  placeholder="Ej: Rondo 5v2 con Salida por Fuera"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-texto-secundario mb-1">Sección Metodológica*</label>
                  <select
                    className="input-fenix"
                    value={editForm.seccion}
                    onChange={(e) => setEditForm({ ...editForm, seccion: e.target.value })}
                  >
                    {SECCIONES_EJERCICIOS.filter((s) => s.key !== 'todos').map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-texto-secundario mb-1">Modalidad*</label>
                  <select
                    className="input-fenix"
                    value={editForm.modalidad}
                    onChange={(e) => setEditForm({ ...editForm, modalidad: e.target.value })}
                  >
                    <option value="Campo">Fútbol Campo (11v11)</option>
                    <option value="F7">Fútbol 7</option>
                    <option value="Sala">Fútbol Sala</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-texto-secundario mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    className="input-fenix"
                    value={editForm.duracion}
                    onChange={(e) => setEditForm({ ...editForm, duracion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-texto-secundario mb-1">Nº Jugadores</label>
                  <input
                    type="text"
                    className="input-fenix"
                    value={editForm.jugadoresCount}
                    onChange={(e) => setEditForm({ ...editForm, jugadoresCount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-texto-secundario mb-1">Objetivo de la Tarea*</label>
                <textarea
                  className="input-fenix h-16"
                  placeholder="Ej: Estimular la presión tras pérdida y circulación en pocos toques..."
                  value={editForm.objetivo}
                  onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-texto-secundario mb-1">Explicación del Ejercicio*</label>
                <textarea
                  className="input-fenix h-20"
                  placeholder="Detallar las dimensiones del campo, reglas, rotaciones..."
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded bg-neutral-800 text-white text-xs font-bold"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-cta text-xs inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Registrar en mi Biblioteca
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
