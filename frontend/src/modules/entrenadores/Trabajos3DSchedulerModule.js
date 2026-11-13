import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Layers,
  CheckCircle2,
  AlertCircle,
  Crosshair,
} from 'lucide-react';
import api from '../../utils/api';
import { DISCIPLINES, groupCategoriesByDiscipline } from '../../utils/categories';

const QUADRANTS = [
  'Cuadrante Norte - Campo',
  'Cuadrante Sur - F7',
  'Cancha Techada - Sala',
];

const DISCIPLINE_TO_QUADRANT = {
  Campo: 'Cuadrante Norte - Campo',
  F7: 'Cuadrante Sur - F7',
  Sala: 'Cancha Techada - Sala',
};

const QUADRANT_TO_DISCIPLINE = {
  'Cuadrante Norte - Campo': 'Campo',
  'Cuadrante Sur - F7': 'F7',
  'Cancha Techada - Sala': 'Sala',
};

const PITCH_SPACES = [
  'Media Cancha Norte',
  'Media Cancha Sur',
  'Cancha Completa',
  'Tercio Central',
  'Zona Readaptación',
];

const CONFLICT_MAP = {
  'Cancha Completa': [
    'Cancha Completa',
    'Media Cancha Norte',
    'Media Cancha Sur',
    'Tercio Central',
    'Zona Readaptación',
  ],
  'Media Cancha Norte': ['Cancha Completa', 'Media Cancha Norte', 'Tercio Central'],
  'Media Cancha Sur': ['Cancha Completa', 'Media Cancha Sur', 'Tercio Central'],
  'Tercio Central': ['Cancha Completa', 'Media Cancha Norte', 'Media Cancha Sur', 'Tercio Central'],
  'Zona Readaptación': ['Cancha Completa', 'Zona Readaptación'],
};

export default function Trabajos3DSchedulerModule({
  mode = 'ENTRENADOR',
  categories = [],
  players = [],
  isAdmin = false,
  onOpenInTacticalBoard,
  onReloadDashboard,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeDisciplineTab, setActiveDisciplineTab] = useState('Todas');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [filterDate, setFilterDate] = useState(todayStr);
  const [showAllDates, setShowAllDates] = useState(true);
  const [filterQuadrant, setFilterQuadrant] = useState('Todos');

  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    bloque: mode === 'FISIO' ? 'Readaptación' : 'Táctico / Técnico',
    id_categoria: categories[0] ? String(categories[0].id_categoria) : '',
    id_jugador: '',
    descripcion_escrita: '',
    duracion_minutos: '45',
    fecha: todayStr,
    hora_inicio: '16:00',
    hora_fin: mode === 'FISIO' ? '16:45' : '17:00',
    cuadrante: 'Cuadrante Norte - Campo',
    espacio_cancha: mode === 'FISIO' ? 'Zona Readaptación' : 'Media Cancha Norte',
  });

  const groupedCategories = useMemo(() => groupCategoriesByDiscipline(categories), [categories]);

  const loadTrabajos = useCallback(async () => {
    try {
      const params = {};
      if (!showAllDates && filterDate) params.fecha = filterDate;
      const res = await api.get('/coach/trabajos', { params });
      setTrabajos(res.data.trabajos || []);
    } catch (err) {
      console.error('Error cargando agenda de trabajos:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate, showAllDates]);

  useEffect(() => {
    loadTrabajos();
  }, [loadTrabajos]);

  useEffect(() => {
    if (categories.length > 0 && !form.id_categoria) {
      const first = categories[0];
      setForm((prev) => ({
        ...prev,
        id_categoria: String(first.id_categoria),
        cuadrante: DISCIPLINE_TO_QUADRANT[first.modalidad] || prev.cuadrante,
      }));
    }
  }, [categories, form.id_categoria]);

  const filteredAgendaJobs = useMemo(() => {
    return trabajos.filter((j) => {
      if (filterQuadrant !== 'Todos' && j.cuadrante !== filterQuadrant) return false;
      if (selectedCategoryId && String(j.id_categoria || '') !== String(selectedCategoryId)) {
        return false;
      }
      return true;
    });
  }, [trabajos, filterQuadrant, selectedCategoryId]);

  const occupancySummary = useMemo(() => {
    const targetQuadrant =
      form.cuadrante ||
      (filterQuadrant !== 'Todos' ? filterQuadrant : 'Cuadrante Norte - Campo');
    const targetDate = form.fecha || filterDate || todayStr;
    const dayJobs = trabajos.filter(
      (j) => String(j.fecha).slice(0, 10) === targetDate && j.cuadrante === targetQuadrant
    );
    const hIni = form.hora_inicio || '16:00';
    const hFin = form.hora_fin || '17:00';

    const occupiedAtSelectedTime = dayJobs.filter((j) => {
      if (editingId && j.id_trabajo === editingId) return false;
      const jIni = String(j.hora_inicio).slice(0, 5);
      const jFin = String(j.hora_fin).slice(0, 5);
      return jIni < hFin && jFin > hIni;
    });

    return PITCH_SPACES.map((space) => {
      const conflicts = occupiedAtSelectedTime.filter((j) =>
        (CONFLICT_MAP[j.espacio_cancha] || [j.espacio_cancha]).includes(space)
      );
      return {
        space,
        free: conflicts.length === 0,
        conflicts,
      };
    });
  }, [trabajos, form.cuadrante, form.fecha, form.hora_inicio, form.hora_fin, filterQuadrant, filterDate, todayStr, editingId]);

  const handleSelectDiscipline = (discKey) => {
    setActiveDisciplineTab(discKey);
    if (discKey === 'Todas') {
      setSelectedCategoryId('');
      setFilterQuadrant('Todos');
      return;
    }
    const q = DISCIPLINE_TO_QUADRANT[discKey];
    setSelectedCategoryId('');
    setFilterQuadrant(q);
    setForm((prev) => ({ ...prev, cuadrante: q }));
  };

  const handleSelectCategoryPill = (cat) => {
    const discKey = cat.modalidad || 'Campo';
    const q = DISCIPLINE_TO_QUADRANT[discKey] || 'Cuadrante Norte - Campo';
    const nextStrId = String(cat.id_categoria);

    setActiveDisciplineTab(discKey);
    setSelectedCategoryId((prev) => (prev === nextStrId ? '' : nextStrId));
    setFilterQuadrant(q);
    setForm((prev) => ({
      ...prev,
      id_categoria: nextStrId,
      cuadrante: q,
    }));
  };

  const handleEditTrabajo = (job) => {
    setEditingId(job.id_trabajo);
    setShowForm(true);
    setErrorMsg('');
    setFeedback('');
    setForm({
      titulo: job.titulo || '',
      bloque: job.bloque || 'Táctico / Técnico',
      id_categoria: job.id_categoria ? String(job.id_categoria) : '',
      id_jugador: job.id_jugador ? String(job.id_jugador) : '',
      descripcion_escrita: job.descripcion_escrita || '',
      duracion_minutos: String(job.duracion_minutos || 30),
      fecha: String(job.fecha).slice(0, 10),
      hora_inicio: String(job.hora_inicio).slice(0, 5),
      hora_fin: String(job.hora_fin).slice(0, 5),
      cuadrante: job.cuadrante || 'Cuadrante Norte - Campo',
      espacio_cancha: job.espacio_cancha || 'Media Cancha Norte',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setFeedback('');

    const payload = {
      titulo: form.titulo,
      bloque: form.bloque,
      id_categoria: form.id_categoria || null,
      id_jugador: form.id_jugador || null,
      descripcion_escrita: form.descripcion_escrita,
      duracion_minutos: Number(form.duracion_minutos || 30),
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      cuadrante: form.cuadrante,
      espacio_cancha: form.espacio_cancha,
    };

    try {
      let res;
      if (editingId) {
        res = await api.patch(`/coach/trabajos/${editingId}`, payload);
      } else {
        res = await api.post('/coach/trabajos', payload);
      }
      setFeedback(res.data.message || 'Trabajo registrado en la agenda de cancha.');
      setEditingId(null);
      setForm((prev) => ({
        ...prev,
        titulo: '',
        descripcion_escrita: '',
      }));
      await loadTrabajos();
      if (onReloadDashboard) await onReloadDashboard();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando el trabajo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrabajo = async (id) => {
    setErrorMsg('');
    try {
      await api.delete(`/coach/trabajos/${id}`);
      setFeedback('Trabajo eliminado y espacio en cancha liberado.');
      await loadTrabajos();
      if (onReloadDashboard) await onReloadDashboard();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo eliminar este trabajo.');
    }
  };

  const visibleCategoryGroups = useMemo(() => {
    if (activeDisciplineTab === 'Todas') return groupedCategories;
    return groupedCategories.filter((g) => g.key === activeDisciplineTab);
  }, [groupedCategories, activeDisciplineTab]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Planificación Escrita y Ocupación Horaria Compartida
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            TRABAJOS POR CATEGORÍA, HORARIO Y ESPACIO EN CANCHA
          </h2>
          <p className="text-xs text-texto-secundario">
            Registra únicamente el trabajo de cada entrenador: categoría, hora, espacio exacto ocupado y modalidad (Sala, Fútbol 7 o Fútbol Campo). Luego puedes abrirlo directo en la Tabla de Juego 2D.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
            setErrorMsg('');
          }}
          className="btn-cta text-xs"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Ocultar Formulario' : 'Nuevo Trabajo en Cancha'}
        </button>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selector de Disciplina, Todas las Categorías y Disponibilidad en Tiempo Real */}
      <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-rojo-fuego space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-rojo-fuego">
              Modalidades y Disponibilidad en Tiempo Real
            </p>
            <h3 className="font-display text-lg font-bold text-white">
              FÚTBOL CAMPO, FÚTBOL 7 Y FÚTBOL SALA ({categories.length} Categorías)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectDiscipline('Todas')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                activeDisciplineTab === 'Todas'
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#151515] border-neutral-800 text-texto-secundario hover:text-white'
              }`}
            >
              Todas ({categories.length})
            </button>
            {DISCIPLINES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => handleSelectDiscipline(d.key)}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  activeDisciplineTab === d.key
                    ? 'bg-vinotinto border-rojo-fuego text-white'
                    : 'bg-[#151515] border-neutral-800 text-texto-secundario hover:text-white'
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {visibleCategoryGroups.map((group) => (
            <div
              key={group.key}
              className="bg-[#141417] border border-neutral-800 rounded-xl p-2.5 flex flex-wrap items-center gap-1.5"
            >
              <span className="px-2 py-1 rounded bg-vinotinto/40 border border-vinotinto text-[10px] font-extrabold text-white uppercase mr-1">
                {group.short} ({group.items.length})
              </span>
              {group.items.map((cat) => {
                const isSelectedCat = String(selectedCategoryId) === String(cat.id_categoria);
                return (
                  <button
                    key={cat.id_categoria}
                    type="button"
                    onClick={() => handleSelectCategoryPill(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      isSelectedCat
                        ? 'bg-rojo-fuego border-white text-white shadow'
                        : 'bg-[#1b1b20] border-neutral-800 text-neutral-300 hover:border-rojo-fuego/70 hover:text-white'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bg-[#131317] border border-neutral-800 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rojo-fuego" />
              Ocupación ({form.cuadrante} • {form.fecha} • {form.hora_inicio}–{form.hora_fin})
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllDates(true)}
                className={`px-2.5 py-1 rounded font-bold border ${
                  showAllDates
                    ? 'bg-vinotinto border-rojo-fuego text-white'
                    : 'bg-[#1a1a1f] border-neutral-700 text-neutral-300'
                }`}
              >
                Todos los Días
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAllDates(false);
                  setFilterDate(form.fecha);
                }}
                className={`px-2.5 py-1 rounded font-bold border ${
                  !showAllDates
                    ? 'bg-vinotinto border-rojo-fuego text-white'
                    : 'bg-[#1a1a1f] border-neutral-700 text-neutral-300'
                }`}
              >
                Solo Fecha Elegida
              </button>
              <input
                type="date"
                className="input-fenix w-auto text-xs py-1"
                value={form.fecha}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setForm((prev) => ({ ...prev, fecha: e.target.value }));
                }}
              />
              <input
                type="time"
                className="input-fenix w-auto text-xs py-1"
                value={form.hora_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, hora_inicio: e.target.value }))}
              />
              <input
                type="time"
                className="input-fenix w-auto text-xs py-1"
                value={form.hora_fin}
                onChange={(e) => setForm((prev) => ({ ...prev, hora_fin: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            {occupancySummary.map((slot) => (
              <button
                key={slot.space}
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setForm((prev) => ({ ...prev, espacio_cancha: slot.space }));
                }}
                className={`p-2.5 rounded-lg border text-left transition ${
                  form.espacio_cancha === slot.space ? 'ring-2 ring-rojo-fuego' : ''
                } ${
                  slot.free
                    ? 'bg-green-950/35 border-green-700/60 text-green-200 hover:bg-green-900/40'
                    : 'bg-rojo-fuego/15 border-rojo-fuego/60 text-red-200'
                }`}
              >
                <p className="font-bold truncate">{slot.space}</p>
                <p className="text-[10px] opacity-90 truncate">
                  {slot.free
                    ? '✓ Disponible (Clic para elegir)'
                    : `Ocupado (${slot.conflicts[0]?.rol_autor}: ${slot.conflicts[0]?.categoria_nombre || 'Club'})`}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario Escrito */}
        {showForm && (
          <form onSubmit={handleSubmit} className="lg:col-span-5 card-fenix p-5 border-rojo-fuego/60 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <h3 className="font-display text-xl font-bold text-white">
                {editingId ? 'EDITAR TRABAJO AGENDADO' : 'REGISTRAR TRABAJO EN CANCHA'}
              </h3>
              <span className="px-2 py-0.5 rounded bg-vinotinto text-white font-bold text-[10px]">
                {QUADRANT_TO_DISCIPLINE[form.cuadrante] || 'Campo'}
              </span>
            </div>

            <div>
              <label className="block text-texto-secundario mb-1 font-semibold">Título del Trabajo / Tarea*</label>
              <input
                type="text"
                className="input-fenix"
                placeholder="Ej: Transición ofensiva 4v3 + finalización"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Modalidad / Cancha*</label>
                <select
                  className="input-fenix"
                  value={form.cuadrante}
                  onChange={(e) => {
                    const q = e.target.value;
                    const mod = QUADRANT_TO_DISCIPLINE[q] || 'Campo';
                    setActiveDisciplineTab(mod);
                    setFilterQuadrant(q);
                    setForm({ ...form, cuadrante: q });
                  }}
                >
                  <option value="Cuadrante Norte - Campo">Fútbol Campo</option>
                  <option value="Cuadrante Sur - F7">Fútbol 7</option>
                  <option value="Cancha Techada - Sala">Fútbol Sala</option>
                </select>
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Espacio en Cancha*</label>
                <select
                  className="input-fenix"
                  value={form.espacio_cancha}
                  onChange={(e) => setForm({ ...form, espacio_cancha: e.target.value })}
                >
                  {PITCH_SPACES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Categoría</label>
                <select
                  className="input-fenix"
                  value={form.id_categoria}
                  onChange={(e) => {
                    const idCat = e.target.value;
                    const found = categories.find((c) => String(c.id_categoria) === String(idCat));
                    const quad = found ? DISCIPLINE_TO_QUADRANT[found.modalidad] : form.cuadrante;
                    setForm({ ...form, id_categoria: idCat, cuadrante: quad });
                  }}
                >
                  <option value="">General del Club</option>
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

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Bloque</label>
                <select
                  className="input-fenix"
                  value={form.bloque}
                  onChange={(e) => setForm({ ...form, bloque: e.target.value })}
                >
                  <option value="Táctico / Técnico">Táctico / Técnico</option>
                  <option value="Arqueros">Arqueros</option>
                  <option value="Defensivo">Defensivo</option>
                  <option value="Ofensivo">Ofensivo</option>
                  <option value="Físico / Coordinativo">Físico / Coordinativo</option>
                </select>
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Fecha*</label>
                <input
                  type="date"
                  className="input-fenix"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Duración (min)*</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  className="input-fenix"
                  value={form.duracion_minutos}
                  onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Hora Inicio*</label>
                <input
                  type="time"
                  className="input-fenix"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-texto-secundario mb-1 font-semibold">Hora Fin*</label>
                <input
                  type="time"
                  className="input-fenix"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-texto-secundario mb-1 font-semibold">Jugador Específico (Opcional)</label>
              <select
                className="input-fenix"
                value={form.id_jugador}
                onChange={(e) => setForm({ ...form, id_jugador: e.target.value })}
              >
                <option value="">Trabajo Grupal de Categoría</option>
                {players.map((p) => (
                  <option key={p.id_jugador} value={p.id_jugador}>
                    #{p.dorsal || '--'} {p.nombre} {p.apellido} ({p.categoria_nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-texto-secundario mb-1 font-semibold">Descripción Escrita del Trabajo*</label>
              <textarea
                rows={3}
                className="input-fenix"
                placeholder="Explica reglas, variantes, objetivos y materiales requeridos..."
                value={form.descripcion_escrita}
                onChange={(e) => setForm({ ...form, descripcion_escrita: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm((prev) => ({ ...prev, titulo: '', descripcion_escrita: '' }));
                  }}
                  className="px-3 py-2 rounded-lg bg-neutral-800 text-white font-bold"
                >
                  Cancelar Edición
                </button>
              )}
              <button type="submit" disabled={saving} className="btn-cta text-xs">
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Guardando...' : editingId ? 'Actualizar Trabajo' : 'Guardar Trabajo en Agenda'}
              </button>
            </div>
          </form>
        )}

        {/* Agenda Cronológica de Trabajos */}
        <div className={`${showForm ? 'lg:col-span-7' : 'lg:col-span-12'} card-fenix p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <h4 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rojo-fuego" />
              AGENDA DE CANCHA Y TRABAJOS ({filteredAgendaJobs.length})
            </h4>
            {(selectedCategoryId || filterQuadrant !== 'Todos') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('');
                  setFilterQuadrant('Todos');
                  setActiveDisciplineTab('Todas');
                }}
                className="text-xs font-bold text-rojo-fuego hover:underline"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-texto-secundario py-8 text-center">Cargando agenda...</p>
          ) : filteredAgendaJobs.length === 0 ? (
            <p className="text-xs text-texto-secundario bg-[#151515] border border-neutral-800 rounded-lg p-4">
              No hay trabajos programados con estos filtros. Registra el primer trabajo en el formulario izquierdo.
            </p>
          ) : (
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {filteredAgendaJobs.map((job) => {
                const isFisioJob = job.rol_autor === 'FISIO';
                const canModify = isAdmin || job.rol_autor === mode;
                const modLabel = QUADRANT_TO_DISCIPLINE[job.cuadrante] || job.categoria_modalidad || 'Campo';

                return (
                  <div
                    key={job.id_trabajo}
                    className="p-4 rounded-xl border bg-[#151515] border-neutral-800 hover:border-vinotinto/80 transition space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold ${
                              isFisioJob
                                ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                                : 'bg-vinotinto border border-rojo-fuego/60 text-white'
                            }`}
                          >
                            {job.rol_autor} • {job.autor_nombre}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-bold">
                            Fútbol {modLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-bold">
                            {job.espacio_cancha}
                          </span>
                          {job.categoria_nombre && (
                            <span className="text-white font-bold">• {job.categoria_nombre}</span>
                          )}
                        </div>
                        <h5 className="font-bold text-sm sm:text-base text-white">{job.titulo}</h5>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenInTacticalBoard && !isFisioJob && (
                          <button
                            type="button"
                            onClick={() => onOpenInTacticalBoard(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-vinotinto hover:bg-rojo-fuego text-white text-[11px] font-bold inline-flex items-center gap-1 transition"
                          >
                            <Crosshair className="w-3.5 h-3.5" /> Montar en Tabla 2D
                          </button>
                        )}
                        {canModify && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditTrabajo(job)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-vinotinto text-neutral-300 hover:text-white"
                              title="Editar trabajo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTrabajo(job.id_trabajo)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-rojo-fuego text-neutral-300 hover:text-white"
                              title="Eliminar trabajo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">{job.descripcion_escrita}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-texto-secundario pt-1.5 border-t border-neutral-800/80">
                      <span className="inline-flex items-center gap-1 text-white font-semibold">
                        <Clock className="w-3.5 h-3.5 text-rojo-fuego" />
                        {String(job.fecha).slice(0, 10)} • {String(job.hora_inicio).slice(0, 5)}–
                        {String(job.hora_fin).slice(0, 5)} ({job.duracion_minutos} min)
                      </span>
                      <span>{job.cuadrante}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
