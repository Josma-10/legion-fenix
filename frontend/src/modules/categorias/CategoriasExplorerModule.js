import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layers,
  Users,
  Calendar,
  MapPin,
  Shield,
  Plus,
  Edit3,
  CheckCircle2,
  X,
  ArrowRight,
  Eye,
  Sparkles,
  ClipboardList,
  Compass,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { DISCIPLINES, groupCategoriesByDiscipline, AGE_CATEGORY_ORDER } from '../../utils/categories';

export default function CategoriasExplorerModule({ user = null, initialCategoryId = null }) {
  const [categories, setCategories] = useState([]);
  const [activeDiscipline, setActiveDiscipline] = useState('Campo');
  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId || null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Gestión Admin (Crear / Editar)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formState, setFormState] = useState({
    nombre: '',
    modalidad: 'Campo',
    edad_min: '4',
    edad_max: '6',
    cuadrante_asignado: 'Cuadrante Norte - Campo',
  });
  const [feedback, setFeedback] = useState('');

  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get('/categorias');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Error cargando categorías:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategoryDetail = useCallback(async (idCategoria) => {
    if (!idCategoria) return;
    setLoadingDetail(true);
    setSelectedPlayerCard(null);
    try {
      const res = await api.get(`/categorias/${idCategoria}`);
      setSelectedDetail(res.data);
      setSelectedCatId(idCategoria);
    } catch (err) {
      console.error('Error cargando detalle de categoría:', err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Agrupación por disciplina
  const grouped = useMemo(() => groupCategoriesByDiscipline(categories), [categories]);

  // Lista de las categorías de la disciplina activa
  const activeGroup = useMemo(
    () => grouped.find((g) => g.key === activeDiscipline) || grouped[0] || { items: [] },
    [grouped, activeDiscipline]
  );

  // Al cargar las categorías o cambiar de disciplina, seleccionar automáticamente la primera
  useEffect(() => {
    if (activeGroup && activeGroup.items && activeGroup.items.length > 0) {
      // Si la categoría seleccionada actual no pertenece a la disciplina activa, seleccionar la primera de la disciplina
      const existsInActive = activeGroup.items.some((c) => String(c.id_categoria) === String(selectedCatId));
      if (!existsInActive) {
        const first = activeGroup.items[0];
        setSelectedCatId(first.id_categoria);
        loadCategoryDetail(first.id_categoria);
      }
    }
  }, [activeGroup, selectedCatId, loadCategoryDetail]);

  // Manejar selección inicial si viene por query param
  useEffect(() => {
    if (initialCategoryId && categories.length > 0) {
      const cat = categories.find((c) => String(c.id_categoria) === String(initialCategoryId));
      if (cat) {
        const mod = cat.modalidad || (cat.disciplina?.includes('Sala') ? 'Sala' : cat.disciplina?.includes('7') ? 'F7' : 'Campo');
        setActiveDiscipline(mod);
        loadCategoryDetail(cat.id_categoria);
      }
    }
  }, [initialCategoryId, categories, loadCategoryDetail]);

  const handleSelectDiscipline = (discKey) => {
    setActiveDiscipline(discKey);
    const grp = grouped.find((g) => g.key === discKey);
    if (grp && grp.items.length > 0) {
      const first = grp.items[0];
      setSelectedCatId(first.id_categoria);
      loadCategoryDetail(first.id_categoria);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setFeedback('');
    try {
      if (editingCat) {
        await api.patch(`/categorias/${editingCat.id_categoria}`, formState);
        setFeedback(`Categoría "${formState.nombre}" actualizada.`);
      } else {
        await api.post('/categorias', formState);
        setFeedback(`Nueva categoría "${formState.nombre}" agregada.`);
      }
      setShowCreateForm(false);
      setEditingCat(null);
      await loadCategories();
      if (editingCat && selectedDetail?.category?.id_categoria === editingCat.id_categoria) {
        await loadCategoryDetail(editingCat.id_categoria);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar la categoría.');
    }
  };

  const openEditModal = (cat) => {
    setEditingCat(cat);
    setFormState({
      nombre: cat.nombre,
      modalidad: cat.modalidad || 'Campo',
      edad_min: String(cat.edad_min),
      edad_max: String(cat.edad_max),
      cuadrante_asignado: cat.cuadrante_asignado || 'Cuadrante Norte - Campo',
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-texto-secundario">
        Cargando estructura deportiva de disciplinas y categorías...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. CABECERA Y SELECTOR PRINCIPAL DE LAS 3 DISCIPLINAS */}
      <div className="card-fenix p-5 sm:p-6 border-l-4 border-l-rojo-fuego space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Estructura Oficial Legión Fénix FC
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              DISCIPLINAS Y CATEGORÍAS (BEBÉS A LIBRE)
            </h1>
            <p className="text-xs text-texto-secundario mt-0.5">
              Selecciona una disciplina para desplegar sus categorías en la columna izquierda y ver toda su información técnica a la derecha.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingCat(null);
                setFormState({
                  nombre: '',
                  modalidad: activeDiscipline,
                  edad_min: '4',
                  edad_max: '6',
                  cuadrante_asignado: 'Cuadrante Norte - Campo',
                });
                setShowCreateForm(!showCreateForm);
              }}
              className="btn-cta text-xs py-2 self-start md:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Categoría
            </button>
          )}
        </div>

        {/* 3 BOTONES PRINCIPALES DE LAS DISCIPLINAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {DISCIPLINES.map((d) => {
            const isActive = activeDiscipline === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => handleSelectDiscipline(d.key)}
                className={`p-3.5 sm:p-4 rounded-xl border text-left transition duration-200 flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-vinotinto to-[#8f0024] border-rojo-fuego text-white shadow-fuego ring-1 ring-rojo-fuego/50 scale-[1.01]'
                    : 'bg-[#15151a] border-neutral-800 text-neutral-300 hover:border-vinotinto hover:text-white'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                    {d.key === 'Campo' ? '⚽ 11 vs 11' : d.key === 'F7' ? '🥅 7 vs 7' : '⚡ 5 vs 5 Futsal'}
                  </span>
                  <p className="font-display font-bold text-sm sm:text-base leading-tight">
                    {d.label}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/40 border border-white/10 text-neutral-200 shrink-0">
                  9 Cat.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> {feedback}
        </div>
      )}

      {/* FORMULARIO ADMIN (MODAL / INLINE) */}
      {isAdmin && showCreateForm && (
        <form onSubmit={handleSaveCategory} className="card-fenix p-5 border-rojo-fuego space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-white">
              {editingCat ? `Editar Categoría: ${editingCat.nombre}` : 'Crear Nueva Categoría'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setEditingCat(null);
              }}
              className="p-1.5 rounded bg-neutral-800 text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              className="input-fenix"
              placeholder="Nombre (ej: Sub-13)"
              value={formState.nombre}
              onChange={(e) => setFormState({ ...formState, nombre: e.target.value })}
              required
            />
            <select
              className="input-fenix"
              value={formState.modalidad}
              onChange={(e) => setFormState({ ...formState, modalidad: e.target.value })}
            >
              <option value="Campo">Equipo de Fútbol Campo</option>
              <option value="F7">Equipo de Fútbol 7</option>
              <option value="Sala">Equipo de Sala</option>
            </select>
            <input
              type="number"
              className="input-fenix"
              placeholder="Edad Mín."
              value={formState.edad_min}
              onChange={(e) => setFormState({ ...formState, edad_min: e.target.value })}
              required
            />
            <input
              type="number"
              className="input-fenix"
              placeholder="Edad Máx."
              value={formState.edad_max}
              onChange={(e) => setFormState({ ...formState, edad_max: e.target.value })}
              required
            />
            <select
              className="input-fenix"
              value={formState.cuadrante_asignado}
              onChange={(e) => setFormState({ ...formState, cuadrante_asignado: e.target.value })}
            >
              <option value="Cuadrante Norte - Campo">Cuadrante Norte - Campo</option>
              <option value="Cuadrante Sur - F7">Cuadrante Sur - F7</option>
              <option value="Cancha Techada - Sala">Cancha Techada - Sala</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-cta text-xs">
              {editingCat ? 'Guardar Cambios' : 'Registrar Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* 2. LAYOUT MASTER-DETAIL: LISTA A LA IZQUIERDA, DETALLE A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA VERTICAL DE CATEGORÍAS */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="card-fenix p-4 space-y-2 border-neutral-800">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="navbar-vertical-label text-rojo-fuego p-0">
                <Users className="w-3.5 h-3.5" /> Categorías de {activeGroup.short || activeGroup.label}
              </span>
              <span className="text-[10px] text-texto-secundario font-bold">
                {activeGroup.items.length} etapas
              </span>
            </div>

            {/* Listado de botones de categorías */}
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
              {activeGroup.items.map((cat) => {
                const isSelected = String(selectedCatId) === String(cat.id_categoria);
                return (
                  <button
                    key={cat.id_categoria}
                    type="button"
                    onClick={() => loadCategoryDetail(cat.id_categoria)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 shrink-0 sm:shrink ${
                      isSelected
                        ? 'bg-gradient-to-r from-vinotinto to-rojo-fuego text-white border-rojo-fuego shadow-fuego font-bold scale-[1.01]'
                        : 'bg-[#151519] border-neutral-800/80 text-neutral-300 hover:border-vinotinto hover:bg-vinotinto/20 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold truncate">
                        {cat.nombre}
                      </p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-neutral-200' : 'text-texto-secundario'}`}>
                        {cat.edad_max >= 90 ? '21+ años' : `${cat.edad_min}–${cat.edad_max} años`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-black/40 text-white' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {cat.total_atletas || 0}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(cat);
                          }}
                          className="text-neutral-400 hover:text-white p-1 rounded hover:bg-black/30"
                          title="Editar categoría"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA: INFORMACIÓN DETALLADA Y ACCESOS DIRECTOS */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          {loadingDetail ? (
            <div className="card-fenix p-12 text-center text-texto-secundario text-sm space-y-2">
              <div className="w-8 h-8 border-2 border-rojo-fuego border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cargando información oficial de la categoría...</p>
            </div>
          ) : selectedDetail?.category ? (
            <div className="space-y-6 animate-fadeIn">
              {/* HEADER HERO DE LA CATEGORÍA SELECCIONADA */}
              <div className="card-fenix p-5 sm:p-6 border-l-4 border-l-vinotinto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> {selectedDetail.category.disciplina}
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
                      {selectedDetail.category.nombre}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-vinotinto text-xs font-bold text-white shadow-sm">
                      {selectedDetail.players?.length || 0} Atletas Inscritos
                    </span>
                    <span className="px-3 py-1 rounded-full bg-rojo-fuego/20 border border-rojo-fuego/40 text-rojo-fuego text-xs font-bold">
                      {selectedDetail.category.edad_max >= 90
                        ? '21+ años'
                        : `${selectedDetail.category.edad_min} a ${selectedDetail.category.edad_max} años`}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300">
                  Espacio asignado:{' '}
                  <strong className="text-white">{selectedDetail.category.cuadrante_asignado}</strong>.
                  La metodología Fénix asegura sesiones sincronizadas con hidratación y preparación física adaptada a esta edad.
                </p>

                {/* ACCESOS DIRECTOS EN LA CATEGORÍA */}
                <div className="pt-3 border-t border-neutral-800">
                  <span className="navbar-vertical-label text-neutral-400 p-0 mb-2">
                    <Compass className="w-3 h-3 text-rojo-fuego" /> Accesos Directos de la Categoría
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Link
                      href="/login"
                      className="p-2.5 rounded-xl bg-[#181820] hover:bg-vinotinto/40 border border-neutral-800 hover:border-rojo-fuego text-center transition group hover-shadow"
                    >
                      <Plus className="w-4 h-4 text-rojo-fuego mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-white block">Inscribir Atleta</span>
                      <span className="text-[9px] text-texto-secundario block">Nueva Ficha</span>
                    </Link>

                    <Link
                      href="/portal-coach"
                      className="p-2.5 rounded-xl bg-[#181820] hover:bg-vinotinto/40 border border-neutral-800 hover:border-rojo-fuego text-center transition group hover-shadow"
                    >
                      <ClipboardList className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-white block">Pizarra 2D</span>
                      <span className="text-[9px] text-texto-secundario block">Táctica y Tareas</span>
                    </Link>

                    <Link
                      href="/portal-padres"
                      className="p-2.5 rounded-xl bg-[#181820] hover:bg-vinotinto/40 border border-neutral-800 hover:border-rojo-fuego text-center transition group hover-shadow"
                    >
                      <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-white block">Portal Padres</span>
                      <span className="text-[9px] text-texto-secundario block">Representantes</span>
                    </Link>

                    <Link
                      href="/portal-fisio"
                      className="p-2.5 rounded-xl bg-[#181820] hover:bg-vinotinto/40 border border-neutral-800 hover:border-rojo-fuego text-center transition group hover-shadow"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-[11px] font-bold text-white block">Fisio &amp; Salud</span>
                      <span className="text-[9px] text-texto-secundario block">Podología / Rehab</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* PLANTILLA OFICIAL DE ATLETAS */}
              <div className="card-fenix p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-rojo-fuego" />
                    Plantilla Oficial de {selectedDetail.category.nombre} ({selectedDetail.players?.length || 0})
                  </h3>
                  <Link
                    href="/login"
                    className="text-xs font-bold text-rojo-fuego hover:text-white inline-flex items-center gap-1 transition"
                  >
                    Inscribir Atleta <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {(!selectedDetail.players || selectedDetail.players.length === 0) ? (
                  <div className="bg-[#121215] border border-dashed border-neutral-800 rounded-xl p-8 text-center space-y-2">
                    <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-300">
                      No hay atletas inscritos aún en esta categoría.
                    </p>
                    <p className="text-xs text-texto-secundario">
                      Los atletas registrados en {selectedDetail.category.nombre} aparecerán automáticamente aquí con su dorsal y posición.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedDetail.players.map((p) => {
                      const openPlayerCard = () =>
                        setSelectedPlayerCard({
                          ...p,
                          categoria_modalidad: selectedDetail.category.modalidad,
                          categoria_nombre: selectedDetail.category.nombre,
                        });
                      return (
                        <div
                          key={p.id_jugador}
                          onClick={openPlayerCard}
                          className="bg-[#141418] border border-neutral-800 hover:border-vinotinto rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group hover-shadow"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-10 h-10 rounded-xl bg-vinotinto/30 border border-vinotinto flex items-center justify-center font-display font-extrabold text-base text-white shrink-0">
                              #{p.dorsal || '--'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-rojo-fuego transition truncate">
                                {p.nombre} {p.apellido}
                              </p>
                              <p className="text-xs text-texto-secundario truncate">
                                {p.posicion_habitual} • Pie: {p.pierna_habil || 'Derecho'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {p.puntaje_global && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-600/50 text-cyan-200">
                                {Number(p.puntaje_global).toFixed(1)}/10
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPlayerCard();
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-vinotinto/40 hover:bg-vinotinto border border-vinotinto text-white transition"
                            >
                              <Eye className="w-3 h-3" /> Ficha
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CALENDARIO DE PARTIDOS Y CUADRANTE ASIGNADO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Partidos Oficiales */}
                <div className="card-fenix p-5 space-y-3">
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                    <Calendar className="w-4 h-4 text-rojo-fuego" />
                    Partidos Oficiales ({selectedDetail.fixtures?.length || 0})
                  </h3>

                  {(!selectedDetail.fixtures || selectedDetail.fixtures.length === 0) ? (
                    <p className="text-xs text-texto-secundario">
                      Sin compromisos oficiales programados actualmente para {selectedDetail.category.nombre}.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDetail.fixtures.map((f) => (
                        <div
                          key={f.id_partido}
                          className="bg-[#141418] border border-neutral-800 rounded-xl p-3 text-xs space-y-1.5 hover-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">vs {f.rival}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rojo-fuego/20 text-rojo-fuego font-bold">
                              {f.estado}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-rojo-fuego" />
                            {new Date(f.fecha_hora).toLocaleString('es-VE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-xs text-texto-secundario flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rojo-fuego" /> {f.sede}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cuadrante y Metodología */}
                <div className="card-fenix p-5 space-y-3 bg-[#111115] border-vinotinto/40">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-dorado-fenix" /> Espacio Oficial de Cancha
                  </h4>
                  <p className="text-base font-bold text-white">
                    {selectedDetail.category.cuadrante_asignado}
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    La distribución sectorizada de canchas en el Complejo Legión Fénix permite que cada categoría trabaje con dimensiones y microciclos diseñados específicamente para su edad cronológica y desarrollo biológico.
                  </p>
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Modalidad: <strong>{selectedDetail.category.disciplina}</strong></span>
                    <span>Código: #{selectedDetail.category.id_categoria}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-fenix p-12 text-center text-texto-secundario text-sm">
              Selecciona una categoría de la columna izquierda para desplegar su ficha oficial.
            </div>
          )}
        </section>
      </div>

      {/* MODAL FICHA DEPORTIVA DEL JUGADOR */}
      {selectedPlayerCard && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedPlayerCard(null)}
        >
          <div
            className="relative w-full max-w-4xl my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPlayerCard(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-rojo-fuego hover:bg-red-700 text-white shadow-lg flex items-center justify-center border border-white/20"
              title="Cerrar ficha"
            >
              <X className="w-4 h-4" />
            </button>
            <PlayerCardModule player={selectedPlayerCard} compact />
          </div>
        </div>
      )}
    </div>
  );
}
