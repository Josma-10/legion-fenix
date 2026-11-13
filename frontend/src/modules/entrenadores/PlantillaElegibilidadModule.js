import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Lock,
  CheckCircle2,
  Eye,
  X,
  ClipboardCheck,
  Users,
  HeartPulse,
  Send,
  AlertCircle,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';

const ATTENDANCE_OPTIONS = [
  { value: 'Presente', label: 'Presente', cls: 'bg-green-900/60 border-green-500 text-green-200' },
  { value: 'Retardo', label: 'Retardo', cls: 'bg-amber-900/60 border-amber-500 text-amber-200' },
  { value: 'Ausente', label: 'Ausente', cls: 'bg-red-950/80 border-rojo-fuego text-red-200' },
  { value: 'Justificado', label: 'Justificado', cls: 'bg-cyan-950/70 border-cyan-500 text-cyan-200' },
];

export default function PlantillaElegibilidadModule({
  players = [],
  categories = [],
  upcomingMatches = [],
  selectedCategoryFilter = '',
}) {
  const [subTab, setSubTab] = useState('plantilla'); // plantilla | asistencia
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(todayStr);
  const [tipoSesion, setTipoSesion] = useState('Entrenamiento');
  const [catFilter, setCatFilter] = useState(selectedCategoryFilter || '');
  const [selectedPartidoId, setSelectedPartidoId] = useState(
    upcomingMatches[0] ? String(upcomingMatches[0].id_partido) : ''
  );

  const [attendanceRows, setAttendanceRows] = useState([]);
  const [draftStatus, setDraftStatus] = useState({});
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [convokingId, setConvokingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedCategoryFilter !== undefined) {
      setCatFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  useEffect(() => {
    if (upcomingMatches.length > 0 && !selectedPartidoId) {
      setSelectedPartidoId(String(upcomingMatches[0].id_partido));
    }
  }, [upcomingMatches, selectedPartidoId]);

  const loadAttendance = useCallback(async () => {
    setLoadingAtt(true);
    setErrorMsg('');
    try {
      const res = await api.get('/coach/attendance', {
        params: {
          fecha,
          tipo_sesion: tipoSesion,
          ...(catFilter ? { id_categoria: catFilter } : {}),
        },
      });
      const list = res.data.records || [];
      setAttendanceRows(list);
      const map = {};
      list.forEach((r) => {
        map[r.id_jugador] = r.asistencia_estado || 'Presente';
      });
      setDraftStatus(map);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error cargando lista de asistencia.');
    } finally {
      setLoadingAtt(false);
    }
  }, [fecha, tipoSesion, catFilter]);

  useEffect(() => {
    if (subTab === 'asistencia') {
      loadAttendance();
    }
  }, [subTab, loadAttendance]);

  const handleSaveAllAttendance = async () => {
    if (attendanceRows.length === 0) return;
    setSavingAtt(true);
    setFeedback('');
    setErrorMsg('');
    try {
      const entries = attendanceRows.map((r) => ({
        id_jugador: r.id_jugador,
        estado: draftStatus[r.id_jugador] || 'Presente',
      }));
      const res = await api.post('/coach/attendance', {
        fecha,
        tipo_sesion: tipoSesion,
        entries,
      });
      setFeedback(
        res.data.message || `Lista de ${tipoSesion} del ${fecha} guardada (${entries.length} jugadores).`
      );
      await loadAttendance();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando la asistencia.');
    } finally {
      setSavingAtt(false);
    }
  };

  const handleQuickConvoke = async (playerRow) => {
    if (!selectedPartidoId) {
      setErrorMsg('Selecciona un partido próximo en la parte superior para convocar y notificar.');
      return;
    }
    setConvokingId(playerRow.id_jugador);
    setFeedback('');
    setErrorMsg('');
    try {
      const res = await api.post('/coach/convocatorias', {
        id_partido: Number(selectedPartidoId),
        id_jugador: playerRow.id_jugador,
      });
      setFeedback(res.data.message || `Convocatoria enviada a ${playerRow.nombre}.`);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo convocar al jugador.');
    } finally {
      setConvokingId(null);
    }
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);

  const visibleRoster = useMemo(() => {
    if (!catFilter) return players;
    return players.filter((p) => String(p.id_categoria) === String(catFilter));
  }, [players, catFilter]);

  return (
    <section className="space-y-6">
      {/* Submenú Interno: Plantilla y Fichas vs Pasar Asistencia */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('plantilla')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              subTab === 'plantilla'
                ? 'bg-vinotinto text-white shadow-fenix'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Plantilla y Fichas ({visibleRoster.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('asistencia')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              subTab === 'asistencia'
                ? 'bg-vinotinto text-white shadow-fenix'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Pasar Asistencia (Entrenamientos y Juegos)
          </button>
        </div>

        <select
          className="input-fenix w-auto text-xs"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Todas las Categorías</option>
          {groupedCategories.map((g) => (
            <optgroup key={g.key} label={g.label}>
              {g.items.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre} ({g.short})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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

      {selectedPlayer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rojo-fuego">
              Vista Detallada — Información del Jugador
            </span>
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-rojo-fuego text-xs font-bold text-white inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cerrar Ficha
            </button>
          </div>
          <PlayerCardModule player={selectedPlayer} />
        </div>
      )}

      {/* SUBMENÚ 1: PLANTILLA Y ELEGIBILIDAD */}
      {subTab === 'plantilla' && (
        <div className="card-fenix p-5">
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            PLANTILLA Y ELEGIBILIDAD PARA CONVOCATORIA ({visibleRoster.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-neutral-700 text-texto-secundario text-xs uppercase">
                  <th className="py-2.5">Dorsal</th>
                  <th className="py-2.5">Atleta</th>
                  <th className="py-2.5">Categoría</th>
                  <th className="py-2.5">Valoración</th>
                  <th className="py-2.5">Estado Médico</th>
                  <th className="py-2.5">Solvencia Pago</th>
                  <th className="py-2.5">¿Puede Jugar?</th>
                  <th className="py-2.5 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {visibleRoster.map((p) => {
                  const moroso = p.estado_cuenta === 'Moroso';
                  const lesionado = Boolean(p.lesionado);
                  const blocked = moroso || lesionado || p.puede_jugar === false;
                  const hasScore = Number(p.puntaje_global || 0) > 0;
                  return (
                    <tr key={p.id_jugador} className="border-b border-neutral-800">
                      <td className="py-3 font-display text-xl font-extrabold text-rojo-fuego">
                        #{p.dorsal || '--'}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-white">
                          {p.nombre} {p.apellido}
                        </p>
                        <p className="text-[11px] text-texto-secundario">
                          {p.posicion_habitual} • {p.pierna_habil}
                        </p>
                      </td>
                      <td className="py-3 text-xs text-neutral-300">
                        {p.categoria_nombre} ({p.categoria_modalidad})
                      </td>
                      <td className="py-3 text-xs font-extrabold">
                        {hasScore ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-600/60 text-cyan-300">
                            {Number(p.puntaje_global).toFixed(1)}/10 ({p.porcentaje_global}%)
                          </span>
                        ) : (
                          <span className="text-neutral-500">S/E</span>
                        )}
                      </td>
                      <td className="py-3 text-xs">
                        {lesionado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rojo-fuego/20 border border-rojo-fuego text-red-200 font-bold">
                            <HeartPulse className="w-3 h-3" /> {p.lesion_zona || 'Lesionado'}
                          </span>
                        ) : (
                          <span className="text-green-400 font-semibold text-xs">Sano</span>
                        )}
                      </td>
                      <td className="py-3">
                        <StatusBadge estado={p.estado_cuenta} />
                      </td>
                      <td className="py-3">
                        {blocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rojo-fuego">
                            <Lock className="w-3.5 h-3.5" /> No Apto{' '}
                            {lesionado ? '(Lesión)' : moroso ? '(Moroso)' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sí Puede Jugar
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPlayer(p)}
                          className="px-2.5 py-1 rounded-lg bg-vinotinto/40 hover:bg-vinotinto border border-vinotinto text-xs font-bold text-white inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Info
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMENÚ 2: PASAR ASISTENCIA (ENTRENAMIENTOS Y JUEGOS) + CONVOCATORIA */}
      {subTab === 'asistencia' && (
        <div className="card-fenix p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                PASAR LISTA DE ASISTENCIA ({tipoSesion.toUpperCase()})
              </h2>
              <p className="text-xs text-texto-secundario">
                Visualiza al instante si cada jugador está sano o lesionado, su solvencia económica y si está habilitado para jugar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex rounded-lg border border-neutral-700 overflow-hidden">
                {['Entrenamiento', 'Juego'].map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => setTipoSesion(ts)}
                    className={`px-3 py-1.5 font-bold transition ${
                      tipoSesion === ts
                        ? 'bg-rojo-fuego text-white'
                        : 'bg-[#151515] text-neutral-300 hover:text-white'
                    }`}
                  >
                    {ts}
                  </button>
                ))}
              </div>

              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input-fenix w-auto text-xs py-1.5"
              />

              {tipoSesion === 'Juego' && upcomingMatches.length > 0 && (
                <select
                  value={selectedPartidoId}
                  onChange={(e) => setSelectedPartidoId(e.target.value)}
                  className="input-fenix w-auto text-xs py-1.5"
                >
                  {upcomingMatches.map((m) => (
                    <option key={m.id_partido} value={m.id_partido}>
                      vs {m.rival} ({new Date(m.fecha_hora).toLocaleDateString('es-VE')})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleSaveAllAttendance}
                disabled={savingAtt || attendanceRows.length === 0}
                className="btn-cta text-xs py-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {savingAtt ? 'Guardando Lista...' : 'Guardar Lista del Día'}
              </button>
            </div>
          </div>

          {loadingAtt ? (
            <p className="text-xs text-texto-secundario py-6 text-center">Cargando jugadores...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                <thead>
                  <tr className="border-b border-neutral-700 text-texto-secundario uppercase">
                    <th className="py-2.5">Jugador</th>
                    <th className="py-2.5">Categoría</th>
                    <th className="py-2.5">¿Puede Jugar?</th>
                    <th className="py-2.5">Estado Médico</th>
                    <th className="py-2.5">Solvencia</th>
                    <th className="py-2.5">Marcar Asistencia ({fecha})</th>
                    {tipoSesion === 'Juego' && <th className="py-2.5 text-right">Convocar y Avisar</th>}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row) => {
                    const curState = draftStatus[row.id_jugador] || 'Presente';
                    const isLesionado = Boolean(row.lesionado);
                    const isMoroso = row.solvencia === 'Moroso';
                    const canPlay = row.puede_jugar !== false && !isLesionado && !isMoroso;

                    return (
                      <tr key={row.id_jugador} className="border-b border-neutral-800/80 hover:bg-neutral-900/40">
                        <td className="py-3">
                          <span className="font-display text-base font-extrabold text-rojo-fuego mr-2">
                            #{row.dorsal || '--'}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {row.nombre} {row.apellido}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-300">
                          {row.categoria_nombre} ({row.categoria_modalidad})
                        </td>
                        <td className="py-3 font-bold">
                          {canPlay ? (
                            <span className="text-green-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Apto para Jugar
                            </span>
                          ) : (
                            <span className="text-rojo-fuego inline-flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" /> Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {isLesionado ? (
                            <span className="px-2 py-0.5 rounded bg-red-950/70 border border-rojo-fuego text-red-200 font-bold">
                              Lesión: {row.lesion_zona}
                            </span>
                          ) : (
                            <span className="text-green-400 font-semibold">Sano</span>
                          )}
                        </td>
                        <td className="py-3">
                          <StatusBadge estado={row.solvencia || 'Solvente'} />
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setDraftStatus((prev) => ({
                                    ...prev,
                                    [row.id_jugador]: opt.value,
                                  }))
                                }
                                className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
                                  curState === opt.value
                                    ? opt.cls
                                    : 'bg-[#161616] border-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        {tipoSesion === 'Juego' && (
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              disabled={!canPlay || convokingId === row.id_jugador}
                              onClick={() => handleQuickConvoke(row)}
                              className="px-2.5 py-1.5 rounded-lg bg-vinotinto hover:bg-rojo-fuego disabled:opacity-35 text-white font-bold text-[11px] inline-flex items-center gap-1 transition"
                              title={
                                canPlay
                                  ? 'Convocar y enviar Email + WhatsApp + Bandeja'
                                  : 'No se puede convocar si está lesionado o moroso'
                              }
                            >
                              <Send className="w-3 h-3" />
                              {convokingId === row.id_jugador ? 'Enviando...' : 'Convocar'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
