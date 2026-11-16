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
  Hash,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Trophy,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import {
  DISCIPLINES,
  groupCategoriesByDiscipline,
  AGE_CATEGORY_ORDER,
  isEligibleForPromotion,
  getCategoryTier,
} from '../../utils/categories';

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
  onReload = null,
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

  const [activeDiscipline, setActiveDiscipline] = useState('Campo');
  const groupedCategories = useMemo(() => groupCategoriesByDiscipline(categories), [categories]);

  // Modal para asignación de dorsal único
  const [dorsalModalPlayer, setDorsalModalPlayer] = useState(null);
  const [dorsalInput, setDorsalInput] = useState('');
  const [savingDorsal, setSavingDorsal] = useState(false);

  // Modal para préstamo / refuerzo a categoría superior
  const [loanModalPlayer, setLoanModalPlayer] = useState(null);
  const [loanTargetCatId, setLoanTargetCatId] = useState('');
  const [loanNewDorsal, setLoanNewDorsal] = useState('');
  const [savingLoan, setSavingLoan] = useState(false);

  const [attendanceRows, setAttendanceRows] = useState([]);
  const [draftStatus, setDraftStatus] = useState({});
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [convokingId, setConvokingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedCategoryFilter !== undefined && selectedCategoryFilter !== '') {
      setCatFilter(selectedCategoryFilter);
      const cat = categories.find((c) => String(c.id_categoria) === String(selectedCategoryFilter));
      if (cat && cat.modalidad) {
        setActiveDiscipline(cat.modalidad);
      }
    }
  }, [selectedCategoryFilter, categories]);

  useEffect(() => {
    if (upcomingMatches.length > 0 && !selectedPartidoId) {
      setSelectedPartidoId(String(upcomingMatches[0].id_partido));
    }
  }, [upcomingMatches, selectedPartidoId]);

  // Inicializar categoría activa si está vacía
  useEffect(() => {
    if (!catFilter && categories.length > 0) {
      const firstInCampo = categories.find((c) => c.modalidad === 'Campo' || c.disciplina?.includes('Campo')) || categories[0];
      setCatFilter(String(firstInCampo.id_categoria));
    }
  }, [categories, catFilter]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => String(c.id_categoria) === String(catFilter)),
    [categories, catFilter]
  );

  // Atletas visibles filtrados estrictamente por la categoría activa para evitar desorden
  const visibleRoster = useMemo(() => {
    if (!catFilter) {
      if (categories.length > 0) {
        return players.filter((p) => String(p.id_categoria) === String(categories[0].id_categoria));
      }
      return [];
    }
    return players.filter((p) => String(p.id_categoria) === String(catFilter));
  }, [players, catFilter, categories]);

  // Mapa de dorsales ocupados en la categoría activa
  const takenDorsalsInCategory = useMemo(() => {
    const map = {};
    visibleRoster.forEach((p) => {
      if (p.dorsal !== null && p.dorsal !== undefined) {
        map[Number(p.dorsal)] = `${p.nombre} ${p.apellido}`;
      }
    });
    return map;
  }, [visibleRoster]);

  // KPIs de la categoría activa
  const kpiStats = useMemo(() => {
    const total = visibleRoster.length;
    let aptos = 0;
    let noAptos = 0;
    visibleRoster.forEach((p) => {
      const moroso = p.estado_cuenta === 'Moroso';
      const lesionado = Boolean(p.lesionado);
      const blocked = moroso || lesionado || p.puede_jugar === false;
      if (blocked) noAptos++;
      else aptos++;
    });
    return { total, aptos, noAptos };
  }, [visibleRoster]);

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

  // Abrir Modal de Dorsal Único
  const openDorsalModal = (player) => {
    setDorsalModalPlayer(player);
    setDorsalInput(player.dorsal ? String(player.dorsal) : '');
    setFeedback('');
    setErrorMsg('');
  };

  // Guardar Dorsal Único
  const handleSaveDorsal = async (e) => {
    e.preventDefault();
    if (!dorsalModalPlayer) return;
    setSavingDorsal(true);
    setFeedback('');
    setErrorMsg('');

    const targetNum = dorsalInput.trim() !== '' ? Number(dorsalInput.trim()) : null;

    // Validación de unicidad local
    if (targetNum !== null) {
      const occupyingPlayer = takenDorsalsInCategory[targetNum];
      if (occupyingPlayer && Number(dorsalModalPlayer.dorsal) !== targetNum) {
        setErrorMsg(
          `El dorsal #${targetNum} ya está asignado a ${occupyingPlayer} en esta categoría. Debes elegir un número disponible.`
        );
        setSavingDorsal(false);
        return;
      }
    }

    try {
      const res = await api.patch(`/coach/players/${dorsalModalPlayer.id_jugador}/dorsal`, {
        dorsal: targetNum,
        id_categoria: activeCategoryObj?.id_categoria,
      });
      setFeedback(res.data.message || `Dorsal #${targetNum || 'S/N'} asignado a ${dorsalModalPlayer.nombre}.`);
      setDorsalModalPlayer(null);
      if (onReload) onReload();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo asignar el dorsal.');
    } finally {
      setSavingDorsal(false);
    }
  };

  // Abrir Modal de Préstamo / Refuerzo
  const openLoanModal = (player) => {
    setLoanModalPlayer(player);
    setLoanTargetCatId('');
    setLoanNewDorsal('');
    setFeedback('');
    setErrorMsg('');
  };

  // Ejecutar Préstamo / Refuerzo
  const handleExecuteLoan = async (e) => {
    e.preventDefault();
    if (!loanModalPlayer || !loanTargetCatId) return;

    // Validar regla de promoción: solo hacia categorías superiores
    const targetCat = categories.find((c) => String(c.id_categoria) === String(loanTargetCatId));
    if (!targetCat) {
      setErrorMsg('Selecciona una categoría destino válida.');
      return;
    }

    const currentCatName = loanModalPlayer.categoria_nombre || activeCategoryObj?.nombre;
    const isAllowed = isEligibleForPromotion(currentCatName, targetCat.nombre);

    if (!isAllowed) {
      setErrorMsg(
        `⛔ Infracción de Reglamento Oficial: Un atleta de ${currentCatName} no puede bajar a jugar en una categoría inferior (${targetCat.nombre}). Solo se permiten refuerzos hacia categorías superiores.`
      );
      return;
    }

    setSavingLoan(true);
    setFeedback('');
    setErrorMsg('');

    try {
      const res = await api.post(`/coach/players/${loanModalPlayer.id_jugador}/prestamo`, {
        target_id_categoria: Number(loanTargetCatId),
        new_dorsal: loanNewDorsal.trim() !== '' ? Number(loanNewDorsal.trim()) : null,
      });
      setFeedback(
        res.data.message ||
          `Atleta ${loanModalPlayer.nombre} ${loanModalPlayer.apellido} reforzado exitosamente en ${targetCat.nombre}.`
      );
      setLoanModalPlayer(null);
      if (onReload) onReload();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al ejecutar préstamo de categoría.');
    } finally {
      setSavingLoan(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* 1. SELECTOR JERÁRQUICO DE CATEGORÍAS */}
      <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-rojo-fuego space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rojo-fuego">
              Selección de Categoría y Convocatoria
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              Plantilla para Convocatoria: {activeCategoryObj?.nombre || 'Selecciona Categoría'} ({visibleRoster.length} Atletas)
            </h3>
          </div>
          <span className="text-xs text-texto-secundario">
            Mostrando exclusivamente los atletas inscritos en esta categoría
          </span>
        </div>

        {/* 3 BOTONES PRINCIPALES DE DISCIPLINA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DISCIPLINES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                setActiveDiscipline(d.key);
                const firstOfDisc = categories.find(
                  (c) => c.modalidad === d.key || c.disciplina?.includes(d.key)
                );
                if (firstOfDisc) setCatFilter(String(firstOfDisc.id_categoria));
              }}
              className={`p-3 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                activeDiscipline === d.key
                  ? 'bg-vinotinto border-rojo-fuego text-white shadow-fuego'
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

        {/* SUBMENÚ DE LAS 9 CATEGORÍAS */}
        {groupedCategories
          .filter((g) => g.key === activeDiscipline)
          .map((group) => (
            <div
              key={group.key}
              className="bg-[#141418] border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center gap-1.5"
            >
              <span className="text-xs font-bold text-rojo-fuego mr-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Categoría:
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

      {/* 2. STATS KPI CARDS ESTILO PHOENIX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-rojo-fuego/20 text-rojo-fuego border border-rojo-fuego/40">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-2xl text-white leading-tight">
              {kpiStats.total}
            </h3>
            <p className="text-[11px] text-texto-secundario truncate font-medium">
              Atletas en {activeCategoryObj?.nombre || 'Categoría'}
            </p>
          </div>
        </div>

        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-2xl text-emerald-400 leading-tight">
              {kpiStats.aptos}
            </h3>
            <p className="text-[11px] text-texto-secundario truncate font-medium">
              Aptos para Convocatoria
            </p>
          </div>
        </div>

        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-red-950/70 text-rojo-fuego border border-rojo-fuego/40">
            <Lock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-2xl text-rojo-fuego leading-tight">
              {kpiStats.noAptos}
            </h3>
            <p className="text-[11px] text-texto-secundario truncate font-medium">
              No Aptos (Lesión / Pago)
            </p>
          </div>
        </div>

        <div className="phoenix-kpi">
          <div className="phoenix-icon-box bg-amber-950/70 text-amber-400 border border-amber-500/40">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-2xl text-amber-300 leading-tight truncate">
              {upcomingMatches.length} PJ
            </h3>
            <p className="text-[11px] text-texto-secundario truncate font-medium">
              Partidos Programados
            </p>
          </div>
        </div>
      </div>

      {/* 3. TABS: PLANTILLA PARA CONVOCATORIA vs PASAR ASISTENCIA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('plantilla')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              subTab === 'plantilla'
                ? 'bg-vinotinto text-white shadow-fenix'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Plantilla para Convocatoria ({visibleRoster.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('asistencia')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              subTab === 'asistencia'
                ? 'bg-vinotinto text-white shadow-fenix'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Pasar Asistencia (Entrenamientos y Juegos)
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. SUBTAB 1: TABLA DE PLANTILLA Y GESTIÓN DE DORSALES / REFUERZOS */}
      {subTab === 'plantilla' && (
        <div className="card-fenix p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                PLANTILLA PARA CONVOCATORIA ({visibleRoster.length})
              </h2>
              <p className="text-xs text-texto-secundario">
                Dorsales únicos por categoría. Los atletas solo pueden subir prestados a categorías superiores.
              </p>
            </div>
            <div className="text-xs text-neutral-400">
              Categoría Activa: <strong className="text-white">{activeCategoryObj?.nombre}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-phoenix min-w-[860px]">
              <thead>
                <tr>
                  <th className="sort">Dorsal</th>
                  <th className="sort">Atleta</th>
                  <th>Categoría</th>
                  <th>Valoración</th>
                  <th>Estado Médico</th>
                  <th>Solvencia Pago</th>
                  <th>¿Puede Jugar?</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRoster.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-texto-secundario text-xs">
                      No hay atletas inscritos en esta categoría. Selecciona otra categoría en la parte superior.
                    </td>
                  </tr>
                ) : (
                  visibleRoster.map((p) => {
                    const moroso = p.estado_cuenta === 'Moroso';
                    const lesionado = Boolean(p.lesionado);
                    const blocked = moroso || lesionado || p.puede_jugar === false;
                    const hasScore = Number(p.puntaje_global || 0) > 0;
                    return (
                      <tr key={p.id_jugador}>
                        {/* Dorsal Único con botón de asignación */}
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => openDorsalModal(p)}
                            className="inline-flex items-center gap-1 font-display text-lg font-extrabold text-white bg-vinotinto/40 hover:bg-vinotinto px-2.5 py-1 rounded-lg border border-vinotinto transition group"
                            title="Asignar o modificar dorsal único para esta categoría"
                          >
                            <span>#{p.dorsal || '--'}</span>
                            <Hash className="w-3 h-3 text-neutral-400 group-hover:text-white" />
                          </button>
                        </td>

                        {/* Nombre del Atleta */}
                        <td className="py-3">
                          <p className="font-bold text-white">
                            {p.nombre} {p.apellido}
                          </p>
                          <p className="text-[11px] text-texto-secundario">
                            {p.posicion_habitual} • Pie: {p.pierna_habil || 'Derecho'}
                          </p>
                        </td>

                        {/* Categoría */}
                        <td className="py-3 text-xs text-neutral-300">
                          {p.categoria_nombre}
                        </td>

                        {/* Valoración Global */}
                        <td className="py-3 text-xs font-extrabold">
                          {hasScore ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-600/60 text-cyan-300">
                              {Number(p.puntaje_global).toFixed(1)}/10
                            </span>
                          ) : (
                            <span className="text-neutral-500">S/E</span>
                          )}
                        </td>

                        {/* Estado Médico */}
                        <td className="py-3 text-xs">
                          {lesionado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rojo-fuego/20 border border-rojo-fuego text-red-200 font-bold">
                              <HeartPulse className="w-3 h-3" /> {p.lesion_zona || 'Lesionado'}
                            </span>
                          ) : (
                            <span className="text-green-400 font-semibold text-xs">Sano</span>
                          )}
                        </td>

                        {/* Solvencia Pago */}
                        <td className="py-3">
                          <StatusBadge estado={p.estado_cuenta} />
                        </td>

                        {/* ¿Puede Jugar? */}
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

                        {/* Acciones: Refuerzo / Préstamo + Ver Ficha */}
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openLoanModal(p)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 inline-flex items-center gap-1 transition"
                              title="Prestar como refuerzo a una categoría superior"
                            >
                              <ArrowUpRight className="w-3 h-3 text-amber-400" /> Préstamo
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPlayer(p)}
                              className="px-2.5 py-1 rounded-lg bg-vinotinto/40 hover:bg-vinotinto border border-vinotinto text-xs font-bold text-white inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ficha
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUBTAB 2: PASAR ASISTENCIA Y CONVOCATORIAS */}
      {subTab === 'asistencia' && (
        <div className="card-fenix p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                LISTA DE ASISTENCIA ({tipoSesion.toUpperCase()})
              </h2>
              <p className="text-xs text-texto-secundario">
                Marca la asistencia de los atletas para la sesión o convoca al próximo partido oficial.
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
                {savingAtt ? 'Guardando...' : 'Guardar Lista'}
              </button>
            </div>
          </div>

          {loadingAtt ? (
            <div className="py-12 text-center text-xs text-texto-secundario">
              Cargando lista de asistencia de la categoría...
            </div>
          ) : attendanceRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-texto-secundario">
              No hay atletas registrados en esta categoría para pasar asistencia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-phoenix min-w-[700px]">
                <thead>
                  <tr>
                    <th>Dorsal</th>
                    <th>Atleta</th>
                    <th>Estado Médico</th>
                    <th>Solvencia</th>
                    <th>Asistencia</th>
                    {tipoSesion === 'Juego' && <th className="text-right">Convocatoria</th>}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((r) => {
                    const currentVal = draftStatus[r.id_jugador] || 'Presente';
                    const isBlocked = r.estado_cuenta === 'Moroso' || r.lesionado;
                    return (
                      <tr key={r.id_jugador}>
                        <td className="py-3 font-display font-bold text-white">
                          #{r.dorsal || '--'}
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-white">
                            {r.nombre} {r.apellido}
                          </p>
                          <p className="text-[11px] text-texto-secundario">{r.posicion_habitual}</p>
                        </td>
                        <td className="py-3 text-xs">
                          {r.lesionado ? (
                            <span className="text-red-400 font-bold">Lesionado</span>
                          ) : (
                            <span className="text-green-400">Sano</span>
                          )}
                        </td>
                        <td className="py-3">
                          <StatusBadge estado={r.estado_cuenta} />
                        </td>
                        <td className="py-3">
                          <div className="inline-flex rounded-lg border border-neutral-800 p-0.5 bg-black/30">
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setDraftStatus((prev) => ({
                                    ...prev,
                                    [r.id_jugador]: opt.value,
                                  }))
                                }
                                className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                                  currentVal === opt.value
                                    ? opt.cls
                                    : 'text-neutral-400 hover:text-white'
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
                              onClick={() => handleQuickConvoke(r)}
                              disabled={convokingId === r.id_jugador || isBlocked}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition inline-flex items-center gap-1 ${
                                isBlocked
                                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                  : 'bg-vinotinto hover:bg-rojo-fuego text-white'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              {convokingId === r.id_jugador ? 'Enviando...' : 'Convocar'}
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

      {/* 6. MODAL ASIGNAR DORSAL ÚNICO POR CATEGORÍA */}
      {dorsalModalPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDorsalModalPlayer(null)}
        >
          <div
            className="card-fenix max-w-md w-full p-6 space-y-4 border-rojo-fuego"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-rojo-fuego" /> Asignar Dorsal Único
              </h3>
              <button
                type="button"
                onClick={() => setDorsalModalPlayer(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-300 space-y-1">
              <p>
                Atleta:{' '}
                <strong className="text-white">
                  {dorsalModalPlayer.nombre} {dorsalModalPlayer.apellido}
                </strong>
              </p>
              <p>
                Categoría:{' '}
                <strong className="text-amber-400">{activeCategoryObj?.nombre}</strong>
              </p>
              <p className="text-texto-secundario text-[11px]">
                En cada categoría los dorsales son únicos e irrepetibles. El sistema impedirá asignar un número ya tomado.
              </p>
            </div>

            <form onSubmit={handleSaveDorsal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Número de Camiseta / Dorsal (1 a 99)*
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  className="input-fenix text-lg font-display font-bold text-center"
                  placeholder="Ej: 10"
                  value={dorsalInput}
                  onChange={(e) => setDorsalInput(e.target.value)}
                  autoFocus
                />
                {dorsalInput && takenDorsalsInCategory[Number(dorsalInput)] && Number(dorsalModalPlayer.dorsal) !== Number(dorsalInput) && (
                  <p className="text-[11px] text-rojo-fuego mt-1 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    Ocupado por {takenDorsalsInCategory[Number(dorsalInput)]}
                  </p>
                )}
              </div>

              {/* Muestra de dorsales ya ocupados */}
              <div className="bg-[#121215] border border-neutral-800 rounded-xl p-3 text-[11px] space-y-1">
                <span className="font-bold text-neutral-400 block">Dorsales en uso en esta categoría:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {Object.keys(takenDorsalsInCategory).length === 0 ? (
                    <span className="text-neutral-500">Ningún dorsal asignado todavía.</span>
                  ) : (
                    Object.entries(takenDorsalsInCategory).map(([num, name]) => (
                      <span
                        key={num}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          Number(dorsalModalPlayer.dorsal) === Number(num)
                            ? 'bg-rojo-fuego text-white'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                        title={`${name}`}
                      >
                        #{num} ({name.split(' ')[0]})
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDorsalModalPlayer(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDorsal}
                  className="btn-cta text-xs py-2 px-5"
                >
                  {savingDorsal ? 'Guardando...' : 'Asignar Dorsal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL PRÉSTAMO / REFUERZO A CATEGORÍA SUPERIOR */}
      {loanModalPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLoanModalPlayer(null)}
        >
          <div
            className="card-fenix max-w-lg w-full p-6 space-y-4 border-amber-500/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" /> Préstamo / Refuerzo de Atleta
              </h3>
              <button
                type="button"
                onClick={() => setLoanModalPlayer(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#121215] border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
              <p>
                Atleta:{' '}
                <strong className="text-white">
                  {loanModalPlayer.nombre} {loanModalPlayer.apellido}
                </strong>
              </p>
              <p>
                Categoría actual de origen:{' '}
                <strong className="text-rojo-fuego">{loanModalPlayer.categoria_nombre || activeCategoryObj?.nombre}</strong>
              </p>
              <p className="text-[11px] text-amber-300 leading-relaxed font-semibold">
                ⚠️ Regla Oficial Fénix: El atleta solo puede jugar prestado como refuerzo en una categoría SUPERIOR. No se permite descender a una categoría inferior. El entrenador debe asignarle un dorsal disponible en la nueva categoría.
              </p>
            </div>

            <form onSubmit={handleExecuteLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Categoría de Destino (Solo Categorías Superiores)*
                </label>
                <select
                  value={loanTargetCatId}
                  onChange={(e) => setLoanTargetCatId(e.target.value)}
                  className="input-fenix text-xs"
                  required
                >
                  <option value="">Selecciona categoría de refuerzo...</option>
                  {categories.map((c) => {
                    const currentName = loanModalPlayer.categoria_nombre || activeCategoryObj?.nombre;
                    const allowed = isEligibleForPromotion(currentName, c.nombre);
                    const isSame = String(c.id_categoria) === String(loanModalPlayer.id_categoria);
                    return (
                      <option
                        key={c.id_categoria}
                        value={c.id_categoria}
                        disabled={!allowed || isSame}
                      >
                        {c.nombre} ({c.disciplina || c.modalidad})
                        {isSame ? ' — Categoría actual' : !allowed ? ' — ⛔ Bloqueado (Inferior)' : ' — ✅ Refuerzo Permitido'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Nuevo Dorsal en Categoría Destino (Opcional o según disponibilidad)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  className="input-fenix text-xs"
                  placeholder="Ej: 15 (Dejar vacío para definir en cancha)"
                  value={loanNewDorsal}
                  onChange={(e) => setLoanNewDorsal(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoanModalPlayer(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLoan || !loanTargetCatId}
                  className="btn-cta text-xs py-2 px-5 bg-amber-600 hover:bg-amber-500"
                >
                  {savingLoan ? 'Procesando...' : 'Confirmar Refuerzo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL EXPEDIENTE COMPLETO DEL ATLETA */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="relative w-full max-w-4xl my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-rojo-fuego hover:bg-red-700 text-white shadow-lg flex items-center justify-center border border-white/20"
              title="Cerrar ficha"
            >
              <X className="w-4 h-4" />
            </button>
            <PlayerCardModule player={selectedPlayer} />
          </div>
        </div>
      )}
    </section>
  );
}
