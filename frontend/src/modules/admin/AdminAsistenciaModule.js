import React from 'react';
import { AlertTriangle, LogIn, LogOut, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';

export default function AdminAsistenciaModule({
  attendanceData = { records: [], alerts: [], categories: [] },
  fechaAsistencia,
  onChangeFecha,
  catFilter,
  onChangeCatFilter,
  onReload,
}) {
  const handleAttendanceAction = async (record, action) => {
    try {
      await api.post('/admin/attendance', {
        id_jugador: record.id_jugador,
        id_categoria: record.id_categoria,
        fecha: fechaAsistencia,
        cuadrante: record.cuadrante_asignado || 'Cuadrante Norte - Campo',
        action,
      });
      if (onReload) await onReload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error registrando asistencia.');
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 card-fenix p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              CONTROL DIARIO CHECK-IN / CHECK-OUT
            </h2>
            <p className="text-xs text-texto-secundario">
              Registro horario por cuadrante de entrenamiento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={fechaAsistencia}
              onChange={(e) => onChangeFecha(e.target.value)}
              className="input-fenix w-auto text-xs"
            />
            <select
              value={catFilter}
              onChange={(e) => onChangeCatFilter(e.target.value)}
              className="input-fenix w-auto text-xs"
            >
              <option value="">Todas las Categorías</option>
              {groupCategoriesByDiscipline(attendanceData.categories || []).map((group) => (
                <optgroup key={group.key} label={group.label}>
                  {group.items.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre} ({group.short})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-neutral-700 text-texto-secundario text-xs uppercase">
                <th className="py-2.5">Atleta</th>
                <th className="py-2.5">Cuadrante</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5">Horario In / Out</th>
                <th className="py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(attendanceData.records || []).map((rec) => (
                <tr key={rec.id_jugador} className="border-b border-neutral-800">
                  <td className="py-3">
                    <p className="font-bold text-white">
                      {rec.nombre} {rec.apellido}
                    </p>
                    <span className="text-[11px] text-texto-secundario">
                      {rec.categoria_disciplina ? `${rec.categoria_disciplina} • ` : ''}
                      {rec.categoria_nombre} • #{rec.dorsal || '--'}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-neutral-300">{rec.cuadrante_asignado}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        rec.estado_asistencia === 'Presente'
                          ? 'bg-green-950 text-green-300 border border-green-700'
                          : rec.estado_asistencia === 'Ausente'
                          ? 'bg-rojo-fuego text-white'
                          : rec.estado_asistencia === 'Justificado'
                          ? 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                          : 'bg-neutral-800 text-texto-secundario'
                      }`}
                    >
                      {rec.estado_asistencia}
                    </span>
                  </td>
                  <td className="py-3 text-[11px] text-neutral-300 font-mono">
                    {rec.hora_checkin
                      ? new Date(rec.hora_checkin).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}{' '}
                    /{' '}
                    {rec.hora_checkout
                      ? new Date(rec.hora_checkout).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </td>
                  <td className="py-3 text-right space-x-1.5">
                    <button
                      onClick={() => handleAttendanceAction(rec, 'checkin')}
                      className="px-2.5 py-1 rounded bg-green-800 hover:bg-green-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                      title="Check-In"
                    >
                      <LogIn className="w-3 h-3" /> In
                    </button>
                    <button
                      onClick={() => handleAttendanceAction(rec, 'checkout')}
                      disabled={!rec.hora_checkin}
                      className="px-2.5 py-1 rounded bg-vinotinto hover:bg-vinotinto-dark text-white text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40"
                      title="Check-Out"
                    >
                      <LogOut className="w-3 h-3" /> Out
                    </button>
                    <button
                      onClick={() => handleAttendanceAction(rec, 'ausente')}
                      className="px-2.5 py-1 rounded bg-rojo-fuego hover:bg-red-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                      title="Marcar Ausente"
                    >
                      <XCircle className="w-3 h-3" /> Ausente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas Automáticas de Inasistencia */}
      <div className="lg:col-span-4 card-fenix p-5 border-t-4 border-t-rojo-fuego space-y-4">
        <div className="flex items-center gap-2 text-rojo-fuego">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <h3 className="font-display text-xl font-extrabold text-white">
            ALERTAS DE INASISTENCIA (14 DÍAS)
          </h3>
        </div>
        <p className="text-xs text-texto-secundario">
          Atletas con 2 o más ausencias recientes que requieren contacto con su representante.
        </p>

        <div className="space-y-3">
          {(attendanceData.alerts || []).length === 0 ? (
            <p className="text-xs text-green-400 bg-green-950/30 border border-green-800 rounded-lg p-3">
              ✅ Sin alertas críticas de ausentismo en el periodo.
            </p>
          ) : (
            attendanceData.alerts.map((al) => (
              <div
                key={al.id_jugador}
                className="bg-[#151515] border border-rojo-fuego/60 rounded-lg p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">
                    {al.nombre} {al.apellido}
                  </span>
                  <span className="bg-rojo-fuego text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {al.ausencias_14d} Faltas
                  </span>
                </div>
                <p className="text-[11px] text-texto-secundario">{al.categoria_nombre}</p>
                <p className="text-xs text-neutral-300 pt-1">
                  Representante: <strong className="text-white">{al.representante_nombre}</strong>
                </p>
                <p className="text-xs text-rojo-fuego font-semibold">{al.representante_telefono}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
