import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, Sword, Goal } from 'lucide-react';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';

export default function MicrociclosModule({ microciclos = [], categories = [], onReload }) {
  const [showMicroForm, setShowMicroForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [microForm, setMicroForm] = useState({
    id_categoria: categories[0] ? String(categories[0].id_categoria) : '',
    titulo: '',
    semana_inicio: new Date().toISOString().slice(0, 10),
    semana_fin: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
    objetivo_principal: '',
    bloque_arqueros: '',
    bloque_defensivo: '',
    bloque_ofensivo: '',
    carga_estimada: 'Media-Alta',
  });

  useEffect(() => {
    if (categories.length > 0 && !microForm.id_categoria) {
      setMicroForm((prev) => ({
        ...prev,
        id_categoria: String(categories[0].id_categoria),
      }));
    }
  }, [categories, microForm.id_categoria]);

  const handleCreateMicrociclo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coach/microciclos', microForm);
      setShowMicroForm(false);
      setMicroForm((prev) => ({
        ...prev,
        titulo: '',
        objetivo_principal: '',
        bloque_arqueros: '',
        bloque_defensivo: '',
        bloque_ofensivo: '',
      }));
      if (onReload) await onReload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error guardando microciclo.');
    } finally {
      setSaving(false);
    }
  };

  const handleMicroEstado = async (id, estado) => {
    await api.patch(`/coach/microciclos/${id}/estado`, { estado });
    if (onReload) await onReload();
  };

  const handleDeleteMicrociclo = async (id) => {
    await api.delete(`/coach/microciclos/${id}`);
    if (onReload) await onReload();
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            PLANIFICACIÓN SEMANAL POR BLOQUES ESPECÍFICOS
          </h2>
          <p className="text-xs text-texto-secundario">
            Estructura metodológica dividida en Arqueros, Bloque Defensivo y Bloque Ofensivo.
          </p>
        </div>
        <button onClick={() => setShowMicroForm(!showMicroForm)} className="btn-cta text-xs">
          <Plus className="w-4 h-4" /> Nuevo Microciclo
        </button>
      </div>

      {showMicroForm && (
        <form onSubmit={handleCreateMicrociclo} className="card-fenix p-5 space-y-4 border-rojo-fuego/60">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-texto-secundario mb-1">Título del Microciclo*</label>
              <input
                type="text"
                className="input-fenix"
                placeholder="Ej: Microciclo #16 - Salida Lavolpiana y Presión"
                value={microForm.titulo}
                onChange={(e) => setMicroForm({ ...microForm, titulo: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-texto-secundario mb-1">Categoría*</label>
              <select
                className="input-fenix"
                value={microForm.id_categoria}
                onChange={(e) => setMicroForm({ ...microForm, id_categoria: e.target.value })}
              >
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
              <label className="block text-xs text-texto-secundario mb-1">Carga Estimada</label>
              <select
                className="input-fenix"
                value={microForm.carga_estimada}
                onChange={(e) => setMicroForm({ ...microForm, carga_estimada: e.target.value })}
              >
                <option value="Recuperación">Recuperación</option>
                <option value="Media">Media</option>
                <option value="Media-Alta">Media-Alta</option>
                <option value="Alta (Pre-Competitiva)">Alta (Pre-Competitiva)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-texto-secundario mb-1">Inicio Semana</label>
              <input
                type="date"
                className="input-fenix"
                value={microForm.semana_inicio}
                onChange={(e) => setMicroForm({ ...microForm, semana_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-texto-secundario mb-1">Fin Semana</label>
              <input
                type="date"
                className="input-fenix"
                value={microForm.semana_fin}
                onChange={(e) => setMicroForm({ ...microForm, semana_fin: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-texto-secundario mb-1">Objetivo Táctico Principal*</label>
              <input
                type="text"
                className="input-fenix"
                placeholder="Objetivo de rendimiento para la semana"
                value={microForm.objetivo_principal}
                onChange={(e) => setMicroForm({ ...microForm, objetivo_principal: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151515] p-3.5 rounded-lg border border-amber-500/40">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                <Goal className="w-4 h-4" /> Bloque 1: Arqueros*
              </label>
              <textarea
                rows={3}
                className="input-fenix text-xs"
                placeholder="Reflejos, juego aéreo, salidas con los pies..."
                value={microForm.bloque_arqueros}
                onChange={(e) => setMicroForm({ ...microForm, bloque_arqueros: e.target.value })}
                required
              />
            </div>
            <div className="bg-[#151515] p-3.5 rounded-lg border border-blue-500/40">
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-2">
                <Shield className="w-4 h-4" /> Bloque 2: Bloque Defensivo*
              </label>
              <textarea
                rows={3}
                className="input-fenix text-xs"
                placeholder="Basculación, coberturas, presión tras pérdida..."
                value={microForm.bloque_defensivo}
                onChange={(e) => setMicroForm({ ...microForm, bloque_defensivo: e.target.value })}
                required
              />
            </div>
            <div className="bg-[#151515] p-3.5 rounded-lg border border-rojo-fuego/50">
              <label className="flex items-center gap-1.5 text-xs font-bold text-rojo-fuego mb-2">
                <Sword className="w-4 h-4" /> Bloque 3: Bloque Ofensivo*
              </label>
              <textarea
                rows={3}
                className="input-fenix text-xs"
                placeholder="Progresión por pasillos, amplitud, definición..."
                value={microForm.bloque_ofensivo}
                onChange={(e) => setMicroForm({ ...microForm, bloque_ofensivo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowMicroForm(false)} className="px-4 py-2 rounded-lg bg-neutral-800 text-xs font-bold">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-cta text-xs">
              {saving ? 'Guardando...' : 'Publicar Microciclo'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {microciclos.map((mc) => (
          <div key={mc.id_microciclo} className="card-fenix p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-vinotinto font-bold text-white">
                    {mc.categoria_nombre} ({mc.categoria_modalidad})
                  </span>
                  <span className="text-texto-secundario">
                    {new Date(mc.semana_inicio).toLocaleDateString('es-VE')} al{' '}
                    {new Date(mc.semana_fin).toLocaleDateString('es-VE')}
                  </span>
                  <span className="text-rojo-fuego font-semibold">• Carga {mc.carga_estimada}</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-white">{mc.titulo}</h3>
                <p className="text-xs text-neutral-300 mt-1">
                  <strong className="text-white">Objetivo:</strong> {mc.objetivo_principal}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={mc.estado}
                  onChange={(e) => handleMicroEstado(mc.id_microciclo, e.target.value)}
                  className="bg-[#141414] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                >
                  <option value="Planificado">Planificado</option>
                  <option value="En Curso">En Curso</option>
                  <option value="Completado">Completado</option>
                </select>
                <button
                  onClick={() => handleDeleteMicrociclo(mc.id_microciclo)}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-rojo-fuego text-neutral-300 hover:text-white transition"
                  title="Eliminar microciclo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#151515] p-4 rounded-xl border-t-2 border-t-amber-400">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Goal className="w-4 h-4" /> Bloque Arqueros
                </h4>
                <p className="text-neutral-200 leading-relaxed">{mc.bloque_arqueros}</p>
              </div>
              <div className="bg-[#151515] p-4 rounded-xl border-t-2 border-t-blue-400">
                <h4 className="font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Bloque Defensivo
                </h4>
                <p className="text-neutral-200 leading-relaxed">{mc.bloque_defensivo}</p>
              </div>
              <div className="bg-[#151515] p-4 rounded-xl border-t-2 border-t-rojo-fuego">
                <h4 className="font-bold text-rojo-fuego uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sword className="w-4 h-4" /> Bloque Ofensivo
                </h4>
                <p className="text-neutral-200 leading-relaxed">{mc.bloque_ofensivo}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
