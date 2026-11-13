import React, { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { DISCIPLINES, groupCategoriesByDiscipline } from '../../utils/categories';

export default function CategoriasExplorerModule({ user = null, initialCategoryId = null }) {
  const [categories, setCategories] = useState([]);
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
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
    } catch (err) {
      console.error('Error cargando detalle de categoría:', err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (initialCategoryId) {
      loadCategoryDetail(initialCategoryId);
    }
  }, [initialCategoryId, loadCategoryDetail]);

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
      modalidad: cat.modalidad,
      edad_min: String(cat.edad_min),
      edad_max: String(cat.edad_max),
      cuadrante_asignado: cat.cuadrante_asignado || 'Cuadrante Norte - Campo',
    });
    setShowCreateForm(true);
  };

  const grouped = groupCategoriesByDiscipline(categories).filter(
    (g) => modalidadFilter === 'Todas' || g.key === modalidadFilter
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-texto-secundario">
        Cargando estructura de disciplinas y categorías...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera de Filtro por Disciplina */}
      <div className="card-fenix p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 border-l-vinotinto">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Módulo de Categorías y Disciplinas
          </span>
          <h1 className="font-display text-3xl font-extrabold text-white mt-1">
            EQUIPO DE CAMPO, FÚTBOL 7 Y SALA (BEBÉS A LIBRE)
          </h1>
          <p className="text-xs text-texto-secundario mt-1">
            Haz clic en cualquier categoría para consultar su plantilla de jugadores, cuadrante operativo y calendario de partidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'Todas', label: `Todas (${categories.length})` },
            ...DISCIPLINES.map((d) => ({ key: d.key, label: d.label })),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setModalidadFilter(tab.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                modalidadFilter === tab.key
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#151515] border-neutral-800 text-texto-secundario hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => {
                setEditingCat(null);
                setFormState({
                  nombre: '',
                  modalidad: 'Campo',
                  edad_min: '4',
                  edad_max: '6',
                  cuadrante_asignado: 'Cuadrante Norte - Campo',
                });
                setShowCreateForm(!showCreateForm);
              }}
              className="btn-cta text-xs py-2"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Categoría
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" /> {feedback}
        </div>
      )}

      {/* Formulario Admin para Crear / Editar Categoría */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Grupos de Categorías */}
        <div className={`${selectedDetail ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
          {grouped.map((disc) => (
            <div key={disc.key} className="card-fenix p-5 space-y-4 border-t-4 border-t-vinotinto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rojo-fuego flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {disc.quadrant}
                  </span>
                  <h2 className="font-display text-2xl font-extrabold text-white">{disc.label}</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-vinotinto text-xs font-bold text-white">
                  {disc.items.length} Categorías
                </span>
              </div>

              <div
                className={`grid gap-3 ${
                  selectedDetail ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9'
                }`}
              >
                {disc.items.map((cat) => {
                  const isSelected = selectedDetail?.category?.id_categoria === cat.id_categoria;
                  return (
                    <div
                      key={cat.id_categoria}
                      onClick={() => loadCategoryDetail(cat.id_categoria)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-vinotinto/30 border-rojo-fuego shadow-fenix'
                          : 'bg-[#151515] border-neutral-800 hover:border-vinotinto'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold text-sm text-white leading-tight">{cat.nombre}</p>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(cat);
                            }}
                            className="text-neutral-400 hover:text-white p-0.5"
                            title="Editar categoría"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-texto-secundario">
                        {cat.edad_max >= 90 ? '21+ años' : `${cat.edad_min}–${cat.edad_max} años`}
                      </p>
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-300 flex items-center gap-1">
                          <Users className="w-3 h-3 text-rojo-fuego" /> {cat.total_atletas || 0}
                        </span>
                        <span className="text-neutral-400">{cat.proximos_partidos || 0} PJ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Panel Detalle de Categoría Seleccionada */}
        {selectedDetail && (
          <aside className="lg:col-span-5 card-fenix p-5 border-vinotinto space-y-5 sticky top-20">
            <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-rojo-fuego">
                  {selectedDetail.category.disciplina}
                </span>
                <h3 className="font-display text-2xl font-extrabold text-white">
                  {selectedDetail.category.nombre}
                </h3>
                <p className="text-xs text-texto-secundario">
                  {selectedDetail.category.cuadrante_asignado} •{' '}
                  {selectedDetail.category.edad_max >= 90
                    ? '21+ años'
                    : `${selectedDetail.category.edad_min} a ${selectedDetail.category.edad_max} años`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDetail(null);
                  setSelectedPlayerCard(null);
                }}
                className="p-1.5 rounded bg-neutral-800 hover:bg-rojo-fuego"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <p className="text-xs text-texto-secundario py-6 text-center">Cargando plantilla...</p>
            ) : (
              <>
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                    <span>Plantilla Inscrita ({selectedDetail.players.length})</span>
                    <Link href="/login" className="text-rojo-fuego hover:underline inline-flex items-center gap-1">
                      Inscribir <ArrowRight className="w-3 h-3" />
                    </Link>
                  </h4>

                  {selectedDetail.players.length === 0 ? (
                    <p className="text-xs text-texto-secundario bg-[#151515] border border-neutral-800 rounded-lg p-3">
                      No hay atletas activos asignados aún en esta categoría.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                            className="bg-[#151515] border border-neutral-800 hover:border-vinotinto rounded-lg p-2.5 flex items-center justify-between gap-2 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg bg-vinotinto/40 border border-vinotinto flex items-center justify-center font-display font-extrabold text-sm text-white">
                                #{p.dorsal || '--'}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                                  {p.nombre} {p.apellido}
                                </p>
                                <p className="text-[10px] text-texto-secundario">
                                  {p.posicion_habitual} • Pie: {p.pierna_habil}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {p.puntaje_global && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-600/50 text-cyan-200">
                                  {Number(p.puntaje_global).toFixed(1)}/10
                                </span>
                              )}
                              {p.estado_cuenta && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-200">
                                  {p.estado_cuenta}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPlayerCard();
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-vinotinto/40 hover:bg-vinotinto border border-vinotinto text-white"
                              >
                                <Eye className="w-3 h-3" /> Ver Info
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-neutral-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
                    Partidos de la Categoría ({selectedDetail.fixtures.length})
                  </h4>
                  {selectedDetail.fixtures.length === 0 ? (
                    <p className="text-xs text-texto-secundario">Sin compromisos publicados para esta categoría.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDetail.fixtures.map((f) => (
                        <div key={f.id_partido} className="bg-[#151515] border border-neutral-800 rounded-lg p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">vs {f.rival}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rojo-fuego/20 text-rojo-fuego font-bold">
                              {f.estado}
                            </span>
                          </div>
                          <p className="text-[11px] text-texto-secundario flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-rojo-fuego" />
                            {new Date(f.fecha_hora).toLocaleString('es-VE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-[11px] text-texto-secundario flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-rojo-fuego" /> {f.sede}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {/* Modal Ficha Deportiva y Valores del Jugador */}
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
