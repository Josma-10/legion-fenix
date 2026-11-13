import React, { useState } from 'react';
import { Plus, DollarSign, Scale, Sliders } from 'lucide-react';
import api from '../../utils/api';

export default function AdminFinanzasEquilibrioModule({
  financeData = {},
  isAdmin = false,
  onReload,
  onFeedback,
}) {
  const [movForm, setMovForm] = useState({
    tipo: 'Ingreso',
    categoria_contable: 'Mensualidades',
    concepto: '',
    monto: '',
    cuadrante: 'Cuadrante Norte - Campo',
    fecha_movimiento: new Date().toISOString().slice(0, 10),
    referencia: '',
  });
  const [editingQuadrant, setEditingQuadrant] = useState(null);

  const handleAddMovimiento = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/finance/movimientos', movForm);
      setMovForm((prev) => ({ ...prev, concepto: '', monto: '', referencia: '' }));
      if (onFeedback) onFeedback('Movimiento contable registrado y punto de equilibrio recalculado.');
      if (onReload) await onReload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error registrando movimiento.');
    }
  };

  const handleSaveQuadrant = async (e) => {
    e.preventDefault();
    if (!editingQuadrant) return;
    await api.patch(`/admin/finance/cuadrantes/${editingQuadrant.id_cuadrante}`, editingQuadrant);
    setEditingQuadrant(null);
    if (onFeedback) onFeedback('Parámetros operativos del cuadrante actualizados.');
    if (onReload) await onReload();
  };

  const cuadrantes = financeData.cuadrantes || [];
  const movimientos = financeData.movimientos || [];

  return (
    <section className="space-y-8">
      {/* Punto de Equilibrio Operativo por Cuadrante */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-rojo-fuego" />
            PUNTO DE EQUILIBRIO OPERATIVO POR CUADRANTE DE ENTRENAMIENTO
          </h2>
          <p className="text-xs text-texto-secundario">
            Fórmula: PE (Atletas) = Costo Fijo Mensual ÷ (Cuota Promedio − Costo Variable por Atleta)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {cuadrantes.map((q) => {
            const isProfitable = q.estado_equilibrio === 'Sobre Equilibrio';
            return (
              <div
                key={q.id_cuadrante}
                className={`card-fenix p-5 space-y-4 border-t-4 ${
                  isProfitable ? 'border-t-green-500' : 'border-t-rojo-fuego'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                      Modalidad {q.modalidad}
                    </span>
                    <h3 className="font-display text-xl font-bold text-white">{q.nombre_cuadrante}</h3>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setEditingQuadrant({ ...q })}
                      className="p-1.5 rounded bg-neutral-800 hover:bg-vinotinto text-neutral-300"
                      title="Editar parámetros de equilibrio (Solo Admin)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#151515] p-3 rounded-lg border border-neutral-800">
                  <div>
                    <p className="text-texto-secundario">Atletas Activos / PE</p>
                    <p className="font-display text-2xl font-extrabold text-white">
                      {q.atletas_activos} <span className="text-sm text-texto-secundario">/ {q.punto_equilibrio_atletas}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-texto-secundario">Ingreso PE Mensual</p>
                    <p className="font-display text-2xl font-extrabold text-rojo-fuego">
                      ${q.punto_equilibrio_ingreso.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-texto-secundario">Cobertura Operativa</span>
                    <span className={isProfitable ? 'text-green-400' : 'text-amber-400'}>
                      {q.cobertura_porcentaje}% ({q.estado_equilibrio})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isProfitable ? 'bg-green-500' : 'bg-rojo-fuego'
                      }`}
                      style={{ width: `${Math.min(q.cobertura_porcentaje, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-neutral-800 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-texto-secundario">Costo Fijo / Var. Atleta:</span>
                    <span>${q.costo_fijo_mensual} / ${q.costo_variable_atleta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-texto-secundario">Cuota Promedio / Margen:</span>
                    <span>${q.cuota_mensual_promedio} / ${q.margen_contribucion}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-texto-secundario">Balance Real Registrado:</span>
                    <span className={q.balance_real_cuadrante >= 0 ? 'text-green-400' : 'text-rojo-fuego'}>
                      ${q.balance_real_cuadrante.toFixed(2)} (Ing ${q.ingresos_reales} - Egr ${q.egresos_reales})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulario edición parámetros de cuadrante */}
      {editingQuadrant && (
        <form onSubmit={handleSaveQuadrant} className="card-fenix p-5 border-rojo-fuego space-y-3">
          <h4 className="font-bold text-white text-sm">
            Ajustar Estructura de Costos — {editingQuadrant.nombre_cuadrante}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-texto-secundario mb-1">Costo Fijo Mensual ($)</label>
              <input
                type="number"
                step="0.01"
                className="input-fenix"
                value={editingQuadrant.costo_fijo_mensual}
                onChange={(e) =>
                  setEditingQuadrant({ ...editingQuadrant, costo_fijo_mensual: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-texto-secundario mb-1">Costo Variable / Atleta ($)</label>
              <input
                type="number"
                step="0.01"
                className="input-fenix"
                value={editingQuadrant.costo_variable_atleta}
                onChange={(e) =>
                  setEditingQuadrant({ ...editingQuadrant, costo_variable_atleta: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-texto-secundario mb-1">Cuota Promedio ($)</label>
              <input
                type="number"
                step="0.01"
                className="input-fenix"
                value={editingQuadrant.cuota_mensual_promedio}
                onChange={(e) =>
                  setEditingQuadrant({ ...editingQuadrant, cuota_mensual_promedio: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-texto-secundario mb-1">Capacidad Atletas</label>
              <input
                type="number"
                className="input-fenix"
                value={editingQuadrant.capacidad_atletas}
                onChange={(e) =>
                  setEditingQuadrant({ ...editingQuadrant, capacidad_atletas: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingQuadrant(null)} className="px-3 py-1.5 bg-neutral-800 rounded text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn-cta text-xs py-1.5">Recalcular Equilibrio</button>
          </div>
        </form>
      )}

      {/* Libro Contable Ingresos/Egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form onSubmit={handleAddMovimiento} className="lg:col-span-4 card-fenix p-5 space-y-3">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rojo-fuego" /> REGISTRAR MOVIMIENTO
          </h3>
          <select
            className="input-fenix"
            value={movForm.tipo}
            onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}
          >
            <option value="Ingreso">Ingreso (+)</option>
            <option value="Egreso">Egreso (-)</option>
          </select>
          <input
            type="text"
            className="input-fenix"
            placeholder="Categoría (Nómina, Alquiler, Tienda...)"
            value={movForm.categoria_contable}
            onChange={(e) => setMovForm({ ...movForm, categoria_contable: e.target.value })}
            required
          />
          <input
            type="text"
            className="input-fenix"
            placeholder="Concepto descriptivo"
            value={movForm.concepto}
            onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              className="input-fenix"
              placeholder="Monto ($)"
              value={movForm.monto}
              onChange={(e) => setMovForm({ ...movForm, monto: e.target.value })}
              required
            />
            <input
              type="date"
              className="input-fenix"
              value={movForm.fecha_movimiento}
              onChange={(e) => setMovForm({ ...movForm, fecha_movimiento: e.target.value })}
            />
          </div>
          <select
            className="input-fenix"
            value={movForm.cuadrante}
            onChange={(e) => setMovForm({ ...movForm, cuadrante: e.target.value })}
          >
            <option value="Cuadrante Norte - Campo">Cuadrante Norte - Campo</option>
            <option value="Cuadrante Sur - F7">Cuadrante Sur - F7</option>
            <option value="Cancha Techada - Sala">Cancha Techada - Sala</option>
            <option value="Administración General">Administración General</option>
          </select>
          <button type="submit" className="btn-cta w-full text-xs">
            <Plus className="w-4 h-4" /> Guardar Asiento Contable
          </button>
        </form>

        <div className="lg:col-span-8 card-fenix p-5">
          <h3 className="font-display text-xl font-bold text-white mb-4">
            BALANCE CONTABLE DE INGRESOS Y EGRESOS
          </h3>
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-neutral-700 text-texto-secundario uppercase">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Concepto</th>
                  <th className="py-2">Cuadrante</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id_movimiento} className="border-b border-neutral-800">
                    <td className="py-2.5 text-neutral-400">
                      {new Date(m.fecha_movimiento).toLocaleDateString('es-VE')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          m.tipo === 'Ingreso'
                            ? 'bg-green-950 text-green-300'
                            : 'bg-rojo-fuego/20 text-rojo-fuego'
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <p className="font-semibold text-white">{m.concepto}</p>
                      <span className="text-[10px] text-texto-secundario">{m.categoria_contable}</span>
                    </td>
                    <td className="py-2.5 text-neutral-300">{m.cuadrante}</td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        m.tipo === 'Ingreso' ? 'text-green-400' : 'text-rojo-fuego'
                      }`}
                    >
                      {m.tipo === 'Ingreso' ? '+' : '-'}${Number(m.monto).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
