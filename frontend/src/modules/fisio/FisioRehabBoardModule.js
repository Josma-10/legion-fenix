import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Timer,
  MousePointer2,
  ArrowRight,
  Activity,
  ChevronDown,
  Stethoscope,
} from 'lucide-react';
import api from '../../utils/api';
import Pitch2DBoard from '../../components/Pitch2DBoard';
import { groupCategoriesByDiscipline } from '../../utils/categories';
import {
  FISIO_EQUIPMENT_CATALOG,
  FISIO_PRESETS,
  createCustomToken,
  getTokenId,
  getStepTokens,
  cloneStepWithTokens,
  applyLinearMoveSteps,
  applyZigZagMoveSteps,
  extractTrajectoriesFromPasos,
} from '../../utils/tacticalMoves';

const QUADRANTS = [
  'Cuadrante Norte - Campo',
  'Cuadrante Sur - F7',
  'Cancha Techada - Sala',
];

const REHAB_SPACES = [
  'Zona Readaptación',
  'Media Cancha Sur',
  'Media Cancha Norte',
  'Tercio Central',
  'Cancha Completa',
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

const REHAB_BLOQUES = [
  'Readaptación',
  'Propiocepción',
  'Fortalecimiento Excéntrico',
  'Descarga y Crioterapia',
  'Retorno al Campo (RTP)',
];

function parseFisioAnim(animJson) {
  if (animJson && Array.isArray(animJson.pasos) && animJson.pasos.length > 0) {
    return animJson.pasos.map((st, idx) => ({
      descripcion: st.descripcion || `Fase ${idx + 1}: Rehabilitación`,
      actores: getStepTokens(st, 'actores').map((t, i) => ({
        ...t,
        id: getTokenId(t, i),
        x: Number(t.x ?? 50),
        y: Number(t.y ?? 80),
      })),
    }));
  }
  return FISIO_PRESETS[0].steps.map((s) => ({
    ...s,
    actores: s.actores.map((a) => ({ ...a })),
  }));
}

export default function FisioRehabBoardModule({
  categories = [],
  players = [],
  isAdmin = false,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Acordeón herramientas fisio: 'presets' | 'implementos' | 'movimiento'
  const [openToolMenu, setOpenToolMenu] = useState('implementos');

  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(0.75);
  const [editorStepIdx, setEditorStepIdx] = useState(0);
  const [selectedTokenId, setSelectedTokenId] = useState('FIS-ATL');
  const [toolMode, setToolMode] = useState('move'); // move | recta | zigzag

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const rafRef = useRef(null);
  const lastRef = useRef(null);

  const [form, setForm] = useState({
    titulo: FISIO_PRESETS[0].titulo,
    bloque: 'Readaptación',
    id_categoria: categories[0] ? String(categories[0].id_categoria) : '',
    id_jugador: players[0] ? String(players[0].id_jugador) : '',
    descripcion_escrita: '',
    duracion_minutos: '35',
    fecha: todayStr,
    hora_inicio: '16:00',
    hora_fin: '16:45',
    cuadrante: 'Cuadrante Norte - Campo',
    espacio_cancha: 'Zona Readaptación',
    pasos: parseFisioAnim(null),
  });

  const loadTrabajos = useCallback(async () => {
    try {
      const res = await api.get('/coach/trabajos');
      const all = res.data.trabajos || [];
      setTrabajos(all);
    } catch (err) {
      console.error('Error cargando agenda compartida fisio:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrabajos();
  }, [loadTrabajos]);

  const occupancySummary = useMemo(() => {
    const dayJobs = trabajos.filter(
      (j) => String(j.fecha).slice(0, 10) === form.fecha && j.cuadrante === form.cuadrante
    );
    const hIni = form.hora_inicio || '16:00';
    const hFin = form.hora_fin || '16:45';
    const atTime = dayJobs.filter((j) => {
      const jIni = String(j.hora_inicio).slice(0, 5);
      const jFin = String(j.hora_fin).slice(0, 5);
      return jIni < hFin && jFin > hIni;
    });

    return REHAB_SPACES.map((space) => {
      const conflicts = atTime.filter((j) =>
        (CONFLICT_MAP[j.espacio_cancha] || [j.espacio_cancha]).includes(space)
      );
      return { space, free: conflicts.length === 0, conflicts };
    });
  }, [trabajos, form.fecha, form.cuadrante, form.hora_inicio, form.hora_fin]);

  useEffect(() => {
    if (!isPlaying || form.pasos.length < 2) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
      return;
    }
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setPlayProgress((prev) => {
        const next = prev + dt * playSpeed;
        return next >= form.pasos.length - 1 ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, form.pasos.length, playSpeed]);

  const displayedFrame = useMemo(() => {
    const pasos = form.pasos;
    if (!pasos || pasos.length === 0) return { actores: [], desc: '' };
    if (!isPlaying) {
      const cur = pasos[Math.min(editorStepIdx, pasos.length - 1)];
      return { actores: getStepTokens(cur, 'actores'), desc: cur.descripcion || '' };
    }
    const idxA = Math.min(Math.floor(playProgress), pasos.length - 1);
    const idxB = Math.min(idxA + 1, pasos.length - 1);
    const t = playProgress - idxA;
    const stepA = pasos[idxA];
    const stepB = pasos[idxB];
    const listA = getStepTokens(stepA, 'actores');
    const listB = getStepTokens(stepB, 'actores');
    const actores = listA.map((a, i) => {
      const aid = getTokenId(a, i);
      const target = listB.find((b, j) => getTokenId(b, j) === aid) || listB[i] || a;
      return {
        ...a,
        id: aid,
        x: a.x + (target.x - a.x) * t,
        y: a.y + (target.y - a.y) * t,
      };
    });
    return { actores, desc: stepA.descripcion || '' };
  }, [form.pasos, isPlaying, editorStepIdx, playProgress]);

  const trajectories = useMemo(
    () => extractTrajectoriesFromPasos(form.pasos, 'actores'),
    [form.pasos]
  );

  const handleLoadFisioPreset = (preset) => {
    setIsPlaying(false);
    setPlayProgress(0);
    setEditorStepIdx(0);
    setForm((prev) => ({
      ...prev,
      titulo: preset.titulo,
      pasos: preset.steps.map((s) => ({
        ...s,
        actores: s.actores.map((a) => ({ ...a })),
      })),
    }));
    const firstTok = preset.steps[0]?.actores?.[1] || preset.steps[0]?.actores?.[0];
    if (firstTok) setSelectedTokenId(firstTok.id);
    setFeedback(`Protocolo clínico cargado: ${preset.label}`);
  };

  const handleAddFisioItem = (itemKey) => {
    setIsPlaying(false);
    const curStep = form.pasos[editorStepIdx] || form.pasos[0];
    const newTok = createCustomToken(itemKey, getStepTokens(curStep, 'actores'));
    setForm((prev) => ({
      ...prev,
      pasos: prev.pasos.map((st) => {
        const toks = getStepTokens(st, 'actores');
        return cloneStepWithTokens(st, 'actores', [...toks, { ...newTok }]);
      }),
    }));
    setSelectedTokenId(newTok.id);
  };

  const handleRemoveSelectedToken = () => {
    if (!selectedTokenId) return;
    setIsPlaying(false);
    setForm((prev) => ({
      ...prev,
      pasos: prev.pasos.map((st) => {
        const remaining = getStepTokens(st, 'actores').filter(
          (t, idx) => getTokenId(t, idx) !== selectedTokenId
        );
        return cloneStepWithTokens(st, 'actores', remaining);
      }),
    }));
    setSelectedTokenId('');
  };

  const handleMoveTokenOnPitch = (tid, x, y) => {
    setForm((prev) => ({
      ...prev,
      pasos: prev.pasos.map((st, idx) => {
        if (idx !== editorStepIdx) return st;
        const updated = getStepTokens(st, 'actores').map((tok, i) =>
          getTokenId(tok, i) === tid ? { ...tok, x, y, movKind: 'recta' } : tok
        );
        return cloneStepWithTokens(st, 'actores', updated);
      }),
    }));
    setSelectedTokenId(tid);
  };

  const handlePitchClick = (x, y) => {
    if (!selectedTokenId) return;
    if (toolMode === 'zigzag') {
      const res = applyZigZagMoveSteps({
        pasos: form.pasos,
        stepIdx: editorStepIdx,
        targetId: selectedTokenId,
        destX: x,
        destY: y,
        preferredKey: 'actores',
      });
      setForm((prev) => ({ ...prev, pasos: res.pasos }));
      setEditorStepIdx(res.nextStepIdx);
      return;
    }
    if (toolMode === 'recta') {
      const res = applyLinearMoveSteps({
        pasos: form.pasos,
        stepIdx: editorStepIdx,
        targetId: selectedTokenId,
        destX: x,
        destY: y,
        preferredKey: 'actores',
      });
      setForm((prev) => ({ ...prev, pasos: res.pasos }));
      setEditorStepIdx(res.nextStepIdx);
      return;
    }
    handleMoveTokenOnPitch(selectedTokenId, x, y);
  };

  const handleAddStep = () => {
    setIsPlaying(false);
    const last = form.pasos[form.pasos.length - 1] || { actores: [] };
    const nextStep = {
      descripcion: `Fase ${form.pasos.length + 1}: Progresión de Readaptación`,
      actores: getStepTokens(last, 'actores').map((a) => ({ ...a })),
    };
    setForm((prev) => ({ ...prev, pasos: [...prev.pasos, nextStep] }));
    setEditorStepIdx(form.pasos.length);
  };

  const handleSaveFisioExercise = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.post('/coach/trabajos', {
        titulo: form.titulo,
        bloque: form.bloque,
        id_categoria: form.id_categoria || null,
        id_jugador: form.id_jugador || null,
        descripcion_escrita: form.descripcion_escrita,
        duracion_minutos: Number(form.duracion_minutos || 35),
        fecha: form.fecha,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        cuadrante: form.cuadrante,
        espacio_cancha: form.espacio_cancha,
        animacion_3d_json: { pasos: form.pasos },
      });
      setFeedback(res.data.message || 'Ejercicio de fisioterapia agendado en zona libre.');
      await loadTrabajos();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando ejercicio de fisioterapia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFisioJob = async (id) => {
    try {
      await api.delete(`/coach/trabajos/${id}`);
      setFeedback('Sesión de fisioterapia eliminada.');
      await loadTrabajos();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo eliminar la sesión.');
    }
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);
  const currentTokens = getStepTokens(
    form.pasos[Math.min(editorStepIdx, Math.max(0, form.pasos.length - 1))],
    'actores'
  );

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 border-l-4 border-l-cyan-400">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5" /> Pizarra Exclusiva de Fisioterapia &amp; Readaptación 2D
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
          EJERCICIOS CLÍNICOS 2D Y DISPONIBILIDAD DE CANCHA
        </h2>
        <p className="text-xs text-texto-secundario mt-1">
          Visualiza qué sector ocupan los entrenadores en tu horario y diseña ejercicios exclusivamente con herramientas clínicas (Camilla, Bosu, Bandas, Fitball, Crioterapia, Escalera, Vallas y Atleta).
        </p>
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

      {/* Verificador de Disponibilidad frente a Entrenadores */}
      <div className="card-fenix p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Disponibilidad Real (Comparado contra Horarios de Entrenadores)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input-fenix w-auto text-xs py-1"
              value={form.cuadrante}
              onChange={(e) => setForm({ ...form, cuadrante: e.target.value })}
            >
              {QUADRANTS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input-fenix w-auto text-xs py-1"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <input
              type="time"
              className="input-fenix w-auto text-xs py-1"
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
            />
            <input
              type="time"
              className="input-fenix w-auto text-xs py-1"
              value={form.hora_fin}
              onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          {occupancySummary.map((slot) => (
            <button
              key={slot.space}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, espacio_cancha: slot.space }))}
              className={`p-2 rounded-lg border text-left transition ${
                form.espacio_cancha === slot.space ? 'ring-2 ring-cyan-400' : ''
              } ${
                slot.free
                  ? 'bg-emerald-950/35 border-emerald-700/60 text-emerald-200'
                  : 'bg-rojo-fuego/20 border-rojo-fuego/70 text-red-200'
              }`}
            >
              <p className="font-bold truncate">{slot.space}</p>
              <p className="text-[10px] opacity-90 truncate">
                {slot.free
                  ? '✓ Libre para Fisio'
                  : `Ocupado (${slot.conflicts[0]?.rol_autor}: ${slot.conflicts[0]?.categoria_nombre || 'Club'})`}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tablero Clínico 2D */}
        <div className="lg:col-span-7 card-fenix p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141418] border border-neutral-800 rounded-xl p-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {form.pasos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setEditorStepIdx(idx);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                    !isPlaying && editorStepIdx === idx
                      ? 'bg-cyan-600 border-white text-white'
                      : 'bg-[#1b1b20] border-neutral-700 text-neutral-300'
                  }`}
                >
                  Fase {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddStep}
                className="px-2 py-1 rounded text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                + Fase
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] font-bold text-white"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>1x</option>
                <option value={1.3}>1.5x</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (form.pasos.length < 2) {
                    setErrorMsg('Agrega al menos 2 fases o mueve al atleta con Línea Recta / Zig-Zag para reproducir.');
                    return;
                  }
                  setErrorMsg('');
                  setIsPlaying(!isPlaying);
                }}
                className="btn-cta text-xs py-1 px-3"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pausar' : 'Play Rehab 2D'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setPlayProgress(0);
                }}
                className="p-1.5 rounded bg-neutral-800 text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Pitch2DBoard
            modalidad={
              form.cuadrante === 'Cancha Techada - Sala'
                ? 'Sala'
                : form.cuadrante === 'Cuadrante Sur - F7'
                ? 'F7'
                : 'Campo'
            }
            tokens={displayedFrame.actores}
            hideBall={true}
            trajectories={trajectories}
            showTrajectories={true}
            highlightSpace={form.espacio_cancha}
            selectedTokenId={selectedTokenId}
            isPlaying={isPlaying}
            interactive={!isPlaying}
            cursorCrosshair={toolMode !== 'move'}
            onSelectToken={(tid) => setSelectedTokenId(tid)}
            onMoveToken={handleMoveTokenOnPitch}
            onPitchClick={handlePitchClick}
          />

          <div className="bg-[#151515] border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-white font-semibold">
              {displayedFrame.desc || 'Coloca implementos clínicos y mueve al atleta'}
            </span>
            <span className="text-cyan-300 font-bold inline-flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> {form.duracion_minutos} min • {form.espacio_cancha}
            </span>
          </div>
        </div>

        {/* Columna Derecha: Herramientas Exclusivas Fisio + Formulario + Agenda */}
        <div className="lg:col-span-5 space-y-4">
          {/* Acordeón 1: Implementos Clínicos */}
          <div className="bg-[#141418] border border-neutral-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenToolMenu(openToolMenu === 'implementos' ? '' : 'implementos')}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-extrabold uppercase text-cyan-300"
            >
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" /> Implementos Clínicos y Terapia
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openToolMenu === 'implementos' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openToolMenu === 'implementos' && (
              <div className="p-3.5 border-t border-neutral-800 space-y-3">
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {FISIO_EQUIPMENT_CATALOG.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleAddFisioItem(item.key)}
                      className="px-2.5 py-2 rounded-lg bg-[#1b1b22] hover:bg-cyan-950/60 border border-neutral-700 hover:border-cyan-500 text-left flex items-center justify-between transition"
                    >
                      <span className="font-bold text-white truncate">+ {item.label}</span>
                      <span className="text-[10px] font-mono text-cyan-300">{item.short}</span>
                    </button>
                  ))}
                </div>

                {/* Desplazamiento del Atleta */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setToolMode('move')}
                    className={`px-2.5 py-1.5 rounded font-bold border inline-flex items-center gap-1 ${
                      toolMode === 'move'
                        ? 'bg-white text-black border-white'
                        : 'bg-[#1b1b22] text-neutral-300 border-neutral-700'
                    }`}
                  >
                    <MousePointer2 className="w-3 h-3" /> Ubicar / Arrastrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setToolMode('recta')}
                    className={`px-2.5 py-1.5 rounded font-bold border inline-flex items-center gap-1 ${
                      toolMode === 'recta'
                        ? 'bg-emerald-500 text-black border-white'
                        : 'bg-[#1b1b22] text-emerald-300 border-neutral-700'
                    }`}
                  >
                    <ArrowRight className="w-3 h-3" /> Trayectoria Lineal
                  </button>
                  <button
                    type="button"
                    onClick={() => setToolMode('zigzag')}
                    className={`px-2.5 py-1.5 rounded font-bold border inline-flex items-center gap-1 ${
                      toolMode === 'zigzag'
                        ? 'bg-cyan-400 text-black border-white'
                        : 'bg-[#1b1b22] text-cyan-300 border-neutral-700'
                    }`}
                  >
                    <Activity className="w-3 h-3" /> Zig-Zag Propiocepción
                  </button>
                  {selectedTokenId && (
                    <button
                      type="button"
                      onClick={handleRemoveSelectedToken}
                      className="px-2.5 py-1.5 rounded font-bold bg-rojo-fuego text-white"
                    >
                      - Quitar Ficha
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {currentTokens.map((tok, i) => {
                    const tid = getTokenId(tok, i);
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => setSelectedTokenId(tid)}
                        className={`px-2 py-0.5 rounded font-bold border ${
                          selectedTokenId === tid
                            ? 'bg-amber-400 text-black border-white'
                            : 'bg-[#1b1b22] text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {tok.label} ({tok.rol})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 2: Protocolos Clínicos Pre-armados */}
          <div className="bg-[#141418] border border-neutral-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenToolMenu(openToolMenu === 'presets' ? '' : 'presets')}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-extrabold uppercase text-emerald-300"
            >
              <span>Protocolos Base de Fisioterapia ({FISIO_PRESETS.length})</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openToolMenu === 'presets' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openToolMenu === 'presets' && (
              <div className="p-3 border-t border-neutral-800 grid grid-cols-1 gap-1.5">
                {FISIO_PRESETS.map((pr) => (
                  <button
                    key={pr.key}
                    type="button"
                    onClick={() => handleLoadFisioPreset(pr)}
                    className="px-3 py-2 rounded-lg bg-[#1b1b22] hover:bg-emerald-950/50 border border-neutral-700 text-left text-xs font-bold text-white"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formulario Guardar Sesión Clínica */}
          <form onSubmit={handleSaveFisioExercise} className="card-fenix p-4 space-y-3 text-xs border-cyan-500/40">
            <h3 className="font-display text-lg font-bold text-white">
              RESERVAR ESPACIO Y GUARDAR SESIÓN FISIO
            </h3>
            <input
              type="text"
              className="input-fenix"
              placeholder="Título ejercicio clínico (ej: Readaptación Tobillo Derecho)"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="input-fenix"
                value={form.bloque}
                onChange={(e) => setForm({ ...form, bloque: e.target.value })}
              >
                {REHAB_BLOQUES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                className="input-fenix"
                value={form.id_jugador}
                onChange={(e) => setForm({ ...form, id_jugador: e.target.value })}
              >
                <option value="">Atleta (Opcional)</option>
                {players.map((p) => (
                  <option key={p.id_jugador} value={p.id_jugador}>
                    #{p.dorsal || '--'} {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              <select
                className="input-fenix"
                value={form.id_categoria}
                onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
              >
                <option value="">Categoría</option>
                {groupedCategories.map((g) => (
                  <optgroup key={g.key} label={g.label}>
                    {g.items.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="number"
                min="5"
                max="120"
                className="input-fenix"
                value={form.duracion_minutos}
                onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                placeholder="Minutos"
              />
            </div>
            <textarea
              rows={2}
              className="input-fenix"
              placeholder="Indicaciones clínicas, cargas de peso, series y precauciones..."
              value={form.descripcion_escrita}
              onChange={(e) => setForm({ ...form, descripcion_escrita: e.target.value })}
              required
            />
            <button type="submit" disabled={saving} className="btn-cta w-full text-xs">
              <Plus className="w-4 h-4" />
              {saving ? 'Verificando Disponibilidad...' : 'Agendar Ejercicio Fisio 2D'}
            </button>
          </form>

          {/* Agenda Compartida */}
          <div className="card-fenix p-4 space-y-2.5 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Agenda Compartida Entrenadores + Fisio ({trabajos.length})
            </h4>
            {loading ? (
              <p className="text-texto-secundario">Cargando...</p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {trabajos.map((job) => {
                  const isFisio = job.rol_autor === 'FISIO';
                  return (
                    <div
                      key={job.id_trabajo}
                      onClick={() => {
                        setSelectedId(job.id_trabajo);
                        if (isFisio && job.animacion_3d_json) {
                          setIsPlaying(false);
                          setEditorStepIdx(0);
                          setForm((prev) => ({
                            ...prev,
                            pasos: parseFisioAnim(job.animacion_3d_json),
                          }));
                        }
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer ${
                        selectedId === job.id_trabajo
                          ? 'border-cyan-400 bg-cyan-950/25'
                          : 'border-neutral-800 bg-[#151515]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isFisio ? 'bg-cyan-900 text-cyan-200' : 'bg-vinotinto text-white'
                          }`}
                        >
                          {job.rol_autor} • {job.espacio_cancha}
                        </span>
                        <span className="text-[10px] text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {String(job.fecha).slice(0, 10)} {String(job.hora_inicio).slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="font-bold text-white truncate">{job.titulo}</p>
                        {(isFisio || isAdmin) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFisioJob(job.id_trabajo);
                            }}
                            className="p-1 rounded bg-neutral-800 hover:bg-rojo-fuego text-neutral-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
