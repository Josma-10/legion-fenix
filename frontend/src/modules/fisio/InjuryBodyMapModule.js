import React, { useEffect, useState } from 'react';
import { Activity, Plus, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const ANATOMICAL_ZONES = [
  { name: 'Cabeza / Cervical', x: 50, y: 12 },
  { name: 'Hombro Derecho', x: 35, y: 24 },
  { name: 'Hombro Izquierdo', x: 65, y: 24 },
  { name: 'Zona Lumbar', x: 50, y: 40 },
  { name: 'Aductor / Ingle', x: 46, y: 50 },
  { name: 'Cuádriceps Derecho', x: 42, y: 58 },
  { name: 'Isquiotibial Izquierdo', x: 58, y: 58 },
  { name: 'Rodilla Derecha', x: 43, y: 71 },
  { name: 'Rodilla Izquierda', x: 57, y: 71 },
  { name: 'Gemelo / Pantorrilla', x: 58, y: 80 },
  { name: 'Tobillo Derecho', x: 43, y: 88 },
  { name: 'Tobillo Izquierdo', x: 57, y: 88 },
];

export default function InjuryBodyMapModule({ injuries = [], players = [], onUpdated }) {
  const [selectedInjury, setSelectedInjury] = useState(injuries[0] || null);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [form, setForm] = useState({
    id_jugador: players[0]?.id_jugador || '',
    zona_anatomica: 'Tobillo Derecho',
    coord_x: 43,
    coord_y: 88,
    tipo_lesion: '',
    gravedad: 'Leve',
    fecha_lesion: new Date().toISOString().slice(0, 10),
    fecha_retorno_estimada: '',
    diagnostico: '',
    tratamiento: '',
    profesional_cargo: 'Lic. Ricardo Vásquez',
  });
  const [saving, setSaving] = useState(false);
  const [dischargeMsg, setDischargeMsg] = useState('');

  useEffect(() => {
    if (players.length > 0 && !form.id_jugador) {
      setForm((prev) => ({ ...prev, id_jugador: String(players[0].id_jugador) }));
    }
  }, [players, form.id_jugador]);

  const handleSvgClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    let nearest = ANATOMICAL_ZONES[0];
    let minDist = Infinity;
    for (const z of ANATOMICAL_ZONES) {
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = z;
      }
    }
    setForm((prev) => ({
      ...prev,
      coord_x: x,
      coord_y: y,
      zona_anatomica: nearest.name,
    }));
  };

  const handleCreateInjury = async (e) => {
    e.preventDefault();
    if (!form.id_jugador || !form.tipo_lesion) return;
    setSaving(true);
    setDischargeMsg('');
    try {
      await api.post('/fisio/injuries', form);
      setForm((prev) => ({ ...prev, tipo_lesion: '', diagnostico: '', tratamiento: '' }));
      if (onUpdated) onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRecoveryStatus = async (idLesion, estado_recuperacion) => {
    const res = await api.patch(`/fisio/injuries/${idLesion}`, { estado_recuperacion });
    if (estado_recuperacion === 'Alta Médica') {
      setDischargeMsg(
        res.data?.message ||
          'Alta Médica aplicada: historial eliminado para dejar solo atletas activos en tratamiento.'
      );
      setSelectedInjury(null);
    } else {
      setDischargeMsg('');
    }
    if (onUpdated) onUpdated();
  };

  const getPinColor = (gravedad, estado) => {
    if (estado === 'Alta Médica') return 'bg-green-500 border-white';
    if (gravedad === 'Severa') return 'bg-rojo-fuego border-white animate-pulse';
    if (gravedad === 'Moderada') return 'bg-amber-500 border-white';
    return 'bg-yellow-300 border-black';
  };

  const activeOnly = injuries.filter((inj) => inj.estado_recuperacion !== 'Alta Médica');
  const visibleInjuries =
    statusFilter === 'Todos'
      ? activeOnly
      : activeOnly.filter((inj) => inj.estado_recuperacion === statusFilter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Mapa Anatómico Interactivo */}
      <div className="lg:col-span-5 card-fenix p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-rojo-fuego" />
            Mapeo Anatómico de Lesiones
          </h4>
          <span className="text-[11px] text-texto-secundario">Clic para ubicar lesión</span>
        </div>

        <div
          onClick={handleSvgClick}
          className="relative w-full max-w-[290px] aspect-[3/5] mx-auto bg-[#141414] rounded-xl border border-neutral-800 cursor-crosshair overflow-hidden"
        >
          <svg viewBox="0 0 200 340" className="w-full h-full">
            <line x1="100" y1="10" x2="100" y2="330" stroke="rgba(122,0,30,0.3)" strokeDasharray="4 4" />
            <circle cx="100" cy="36" r="18" fill="#232323" stroke="#7A001E" strokeWidth="2" />
            <rect x="92" y="54" width="16" height="12" fill="#232323" />
            <path d="M62 72 Q100 62 138 72 L130 156 Q100 162 70 156 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
            <path d="M62 74 L42 130 L35 178 L46 180 L55 135 L68 90 Z" fill="#232323" stroke="#555" strokeWidth="1.5" />
            <path d="M138 74 L158 130 L165 178 L154 180 L145 135 L132 90 Z" fill="#232323" stroke="#555" strokeWidth="1.5" />
            <path d="M70 156 L98 156 L94 235 L89 306 L74 306 L76 235 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
            <path d="M130 156 L102 156 L106 235 L111 306 L126 306 L124 235 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
            <circle cx="85" cy="240" r="6" fill="none" stroke="#D32F2F" strokeOpacity="0.45" />
            <circle cx="115" cy="240" r="6" fill="none" stroke="#D32F2F" strokeOpacity="0.45" />
            <circle cx="82" cy="300" r="5" fill="none" stroke="#D32F2F" strokeOpacity="0.45" />
            <circle cx="118" cy="300" r="5" fill="none" stroke="#D32F2F" strokeOpacity="0.45" />
          </svg>

          <div
            style={{ left: `${form.coord_x}%`, top: `${form.coord_y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-dashed border-white bg-vinotinto/70 pointer-events-none"
          />

          {visibleInjuries.map((inj) => (
            <button
              key={inj.id_lesion}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInjury(inj);
              }}
              style={{ left: `${inj.coord_x}%`, top: `${inj.coord_y}%` }}
              title={`${inj.jugador_nombre} ${inj.jugador_apellido} - ${inj.zona_anatomica}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 shadow-lg transition-transform hover:scale-125 ${getPinColor(
                inj.gravedad,
                inj.estado_recuperacion
              )}`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-texto-secundario">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-300" /> Leve</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderada</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rojo-fuego" /> Severa</span>
        </div>
      </div>

      {/* Formulario Nuevo Registro + Pacientes Activos en Tratamiento */}
      <div className="lg:col-span-7 space-y-6">
        {dischargeMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dischargeMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateInjury} className="card-fenix p-5 space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-rojo-fuego" /> Registrar Reporte Clínico en Mapa
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="input-fenix"
              value={form.id_jugador}
              onChange={(e) => setForm({ ...form, id_jugador: e.target.value })}
              required
            >
              <option value="">Seleccionar Atleta</option>
              {players.map((p) => (
                <option key={p.id_jugador} value={p.id_jugador}>
                  {p.nombre} {p.apellido} ({p.categoria_nombre} • {p.categoria_modalidad})
                </option>
              ))}
            </select>
            <input
              type="text"
              className="input-fenix"
              value={form.zona_anatomica}
              onChange={(e) => setForm({ ...form, zona_anatomica: e.target.value })}
              placeholder="Zona anatómica (clic en mapa)"
              required
            />
            <input
              type="text"
              className="input-fenix"
              value={form.tipo_lesion}
              onChange={(e) => setForm({ ...form, tipo_lesion: e.target.value })}
              placeholder="Tipo de lesión (ej: Esguince Grado I)"
              required
            />
            <select
              className="input-fenix"
              value={form.gravedad}
              onChange={(e) => setForm({ ...form, gravedad: e.target.value })}
            >
              <option value="Leve">Gravedad: Leve</option>
              <option value="Moderada">Gravedad: Moderada</option>
              <option value="Severa">Gravedad: Severa</option>
            </select>
            <input
              type="text"
              className="input-fenix"
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
              placeholder="Diagnóstico médico"
            />
            <input
              type="text"
              className="input-fenix"
              value={form.tratamiento}
              onChange={(e) => setForm({ ...form, tratamiento: e.target.value })}
              placeholder="Protocolo de fisioterapia / tratamiento"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-texto-secundario">
              Coordenadas seleccionadas: ({form.coord_x}%, {form.coord_y}%)
            </span>
            <button type="submit" disabled={saving} className="btn-cta text-xs py-2 px-4">
              {saving ? 'Guardando...' : 'Registrar Lesión'}
            </button>
          </div>
        </form>

        <div className="card-fenix p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                Pacientes Activos en Tratamiento ({visibleInjuries.length})
              </h4>
              <p className="text-[11px] text-texto-secundario mt-0.5">
                Al otorgar <strong className="text-emerald-300">Alta Médica</strong>, el historial clínico del atleta se limpia automáticamente de esta lista.
              </p>
            </div>
            <select
              className="bg-neutral-900 border border-neutral-700 rounded-md px-2.5 py-1 text-xs text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos Activos</option>
              <option value="En Tratamiento">En Tratamiento</option>
              <option value="Readaptación">Readaptación</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {visibleInjuries.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-neutral-800 text-center text-xs text-texto-secundario">
                No hay pacientes activos en tratamiento bajo este filtro. Todos los atletas evaluados recibieron su Alta Médica.
              </div>
            ) : (
              visibleInjuries.map((inj) => (
              <div
                key={inj.id_lesion}
                onClick={() => setSelectedInjury(inj)}
                className={`p-3.5 rounded-lg border transition cursor-pointer ${
                  selectedInjury?.id_lesion === inj.id_lesion
                    ? 'bg-vinotinto/20 border-rojo-fuego'
                    : 'bg-[#151515] border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-bold text-white text-sm">
                        {inj.jugador_nombre} {inj.jugador_apellido}
                        <span className="text-xs text-texto-secundario font-normal ml-2">
                          ({inj.categoria_nombre} • Sangre {inj.grupo_sanguineo || 'N/D'})
                        </span>
                      </p>
                      {inj.reportado_por_rol === 'ENTRENADOR' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-extrabold">
                          Reportado por Entrenador — {inj.origen_reporte || 'Entrenamiento'}
                        </span>
                      )}
                      {inj.reportado_por_rol !== 'ENTRENADOR' && inj.origen_reporte && (
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-semibold">
                          {inj.origen_reporte}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rojo-fuego font-semibold mt-0.5">
                      {inj.zona_anatomica} — {inj.tipo_lesion} ({inj.gravedad})
                    </p>
                  </div>
                  <select
                    value={inj.estado_recuperacion}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleChangeRecoveryStatus(inj.id_lesion, e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 text-xs font-semibold rounded-md px-2 py-1 text-white"
                  >
                    <option value="En Tratamiento">En Tratamiento</option>
                    <option value="Readaptación">Readaptación</option>
                    <option value="Alta Médica">Alta Médica</option>
                  </select>
                </div>
                {inj.diagnostico && <p className="text-xs text-neutral-300 mt-2">{inj.diagnostico}</p>}
                {inj.tratamiento && (
                  <p className="text-xs text-texto-secundario mt-1">
                    <strong className="text-neutral-200">Tratamiento:</strong> {inj.tratamiento}
                  </p>
                )}
                {inj.evaluacion_podologica && (
                  <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Podología: {inj.evaluacion_podologica}
                  </p>
                )}
              </div>
            )))}
          </div>
        </div>
      </div>
    </div>
  );
}
