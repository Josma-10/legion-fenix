import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Check,
  Play,
  Pause,
  Trash2,
  Save,
  Plus,
  AlertCircle,
  MousePointer2,
  ArrowRight,
  Activity,
  ArrowUpDown,
  Target,
  Eye,
  EyeOff,
  Users,
  ChevronDown,
  Box,
  Link2,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';
import Pitch2DBoard from '../../components/Pitch2DBoard';
import {
  SCENARIO_PRESETS,
  MATERIAL_CATALOG,
  buildPresetSteps,
  createNumberedPlayerToken,
  createMaterialToken,
  getTokenId,
  getStepTokens,
  cloneStepWithTokens,
  applyLinearMoveSteps,
  applyPassMoveSteps,
  applyZigZagMoveSteps,
  applyAttackAndDefendCycleSteps,
  applyShootAtGoalSteps,
  extractTrajectoriesFromPasos,
} from '../../utils/tacticalMoves';

const DEFAULT_PRESET_BY_MODALIDAD = {
  Campo: '11v11_propio',
  F7: '7v7_propio',
  Sala: '5v5_sala',
};

const QUADRANT_TO_DISCIPLINE = {
  'Cuadrante Norte - Campo': 'Campo',
  'Cuadrante Sur - F7': 'F7',
  'Cancha Techada - Sala': 'Sala',
};

function extractBaseTokens(activeTactica, fallbackMod = 'Campo') {
  const f = activeTactica?.formacion_json;
  if (Array.isArray(f) && f.length > 0) {
    return f.map((j, i) => ({
      ...j,
      id: getTokenId(j, i),
      dorsal: j.dorsal ?? j.label ?? i + 1,
      label: j.label ?? String(j.dorsal ?? i + 1),
      rol: j.rol || 'JUG',
      team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
      color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
      x: Number(j.x ?? 50),
      y: Number(j.y ?? 50),
    }));
  }
  if (f && Array.isArray(f.jugadores) && f.jugadores.length > 0) {
    return f.jugadores.map((j, i) => ({
      ...j,
      id: getTokenId(j, i),
      dorsal: j.dorsal ?? j.label ?? i + 1,
      label: j.label ?? String(j.dorsal ?? i + 1),
      team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
      color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
      x: Number(j.x ?? 50),
      y: Number(j.y ?? 50),
    }));
  }
  const presetKey = DEFAULT_PRESET_BY_MODALIDAD[fallbackMod] || '11v11_propio';
  return buildPresetSteps(presetKey, 'jugadores')[0].jugadores;
}

function normalizePasos(activeTactica, fallbackMod = 'Campo') {
  const baseTokens = extractBaseTokens(activeTactica, fallbackMod);
  const mov = activeTactica?.movimientos_json;
  const rawList = Array.isArray(mov) ? mov : mov && Array.isArray(mov.pasos) ? mov.pasos : null;

  if (rawList && rawList.length > 0) {
    return rawList.map((p, idx) => {
      const srcPlayers = Array.isArray(p.jugadores)
        ? p.jugadores
        : Array.isArray(p.actores)
        ? p.actores
        : Array.isArray(p.players)
        ? p.players
        : baseTokens;
      return {
        descripcion: p.descripcion || p.label || `Paso ${idx + 1}`,
        jugadores: srcPlayers.map((j, i) => ({
          ...j,
          id: getTokenId(j, i),
          dorsal: j.dorsal ?? j.label ?? i + 1,
          label: j.label ?? String(j.dorsal ?? i + 1),
          team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
          color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
          x: Number(j.x ?? 50),
          y: Number(j.y ?? 50),
        })),
        balon: p.balon ? { ...p.balon } : p.ball ? { ...p.ball } : { x: 50, y: 55 },
      };
    });
  }

  return [
    {
      descripcion: 'Paso 1: Inicio / Formación Base',
      jugadores: baseTokens.map((j) => ({ ...j })),
      balon: { x: 50, y: 58 },
    },
  ];
}

function AccordionSection({ title, icon: Icon, badge, isOpen, onToggle, children }) {
  return (
    <div className="bg-[#141418] border border-neutral-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#1a1a21] transition"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-white">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-vinotinto/50 border border-vinotinto text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[560px] opacity-100 border-t border-neutral-800' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3.5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export default function TacticalSimulatorModule({
  tacticas = [],
  trabajos = [],
  categories = [],
  selectedCategoryFilter = '',
  initialTrabajoId = null,
  onCreated,
}) {
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryFilter || '');
  const [selectedId, setSelectedId] = useState(tacticas[0]?.id_tactica || null);
  const [linkedTrabajoId, setLinkedTrabajoId] = useState(
    initialTrabajoId ? String(initialTrabajoId) : ''
  );

  // Acordeón deslizante de submenús: 'opciones' | 'jugadores' | 'rivales' | 'materiales'
  const [openSection, setOpenSection] = useState('opciones');

  // Pasos 2D + Modos
  const [pasos, setPasos] = useState(() => buildPresetSteps('11v11_propio', 'jugadores'));
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [selectedTokenId, setSelectedTokenId] = useState('BALON');
  const [toolMode, setToolMode] = useState('move'); // move | pase_corto | pase_largo | recta | zigzag
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [boardModalidad, setBoardModalidad] = useState('Campo');
  const [customScenarioDirty, setCustomScenarioDirty] = useState(false);

  // Animación Play 2D
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(0.8);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);

  // Creación / Mensajes
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTactica, setNewTactica] = useState({
    id_categoria: selectedCategoryFilter || '',
    id_trabajo: initialTrabajoId ? String(initialTrabajoId) : '',
    nombre_sistema: '',
    modalidad: 'Campo',
    descripcion: '',
    pros: '',
    contras: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedCategoryFilter !== undefined) {
      setCategoryFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Cuando el entrenador salta desde "Trabajos y Cancha" con un trabajo específico
  useEffect(() => {
    if (!initialTrabajoId) return;
    const strId = String(initialTrabajoId);
    setLinkedTrabajoId(strId);
    const job = trabajos.find((t) => String(t.id_trabajo) === strId);
    if (job) {
      const mod = job.categoria_modalidad || QUADRANT_TO_DISCIPLINE[job.cuadrante] || 'Campo';
      setBoardModalidad(mod);
      setModalidadFilter(mod);
      if (job.id_categoria) setCategoryFilter(String(job.id_categoria));
      setNewTactica((prev) => ({
        ...prev,
        id_trabajo: strId,
        id_categoria: job.id_categoria ? String(job.id_categoria) : prev.id_categoria,
        modalidad: mod,
        nombre_sistema: prev.nombre_sistema || `Esquema: ${job.titulo}`.slice(0, 80),
        descripcion: prev.descripcion || job.descripcion_escrita || '',
      }));

      // Si ya existe una táctica ligada a ese trabajo, seleccionarla
      const linkedTac = tacticas.find((tc) => String(tc.id_trabajo) === strId);
      if (linkedTac) {
        setSelectedId(linkedTac.id_tactica);
        setCustomScenarioDirty(false);
      } else if (job.animacion_3d_json?.pasos?.length > 0) {
        setPasos(normalizePasos({ movimientos_json: job.animacion_3d_json }, mod));
        setCustomScenarioDirty(true);
      }
      setFeedback(`Trabajo vinculado: "${job.titulo}" (${job.espacio_cancha || 'Cancha'}). Diseña y guarda la pizarra 2D para esta tarea.`);
    }
  }, [initialTrabajoId, trabajos, tacticas]);

  const filteredTacticas = useMemo(() => {
    return tacticas.filter((t) => {
      if (modalidadFilter !== 'Todas' && t.modalidad !== modalidadFilter) return false;
      if (categoryFilter && String(t.id_categoria || '') !== String(categoryFilter)) return false;
      return true;
    });
  }, [tacticas, modalidadFilter, categoryFilter]);

  const activeTactica = useMemo(() => {
    if (filteredTacticas.length === 0) return null;
    return filteredTacticas.find((t) => t.id_tactica === selectedId) || filteredTacticas[0];
  }, [filteredTacticas, selectedId]);

  useEffect(() => {
    if (filteredTacticas.length > 0 && !filteredTacticas.some((t) => t.id_tactica === selectedId)) {
      setSelectedId(filteredTacticas[0].id_tactica);
    }
  }, [filteredTacticas, selectedId]);

  useEffect(() => {
    if (customScenarioDirty) return;
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);

    if (showNewForm) {
      const mod = newTactica.modalidad || 'Campo';
      setBoardModalidad(mod);
      setPasos(buildPresetSteps(DEFAULT_PRESET_BY_MODALIDAD[mod] || '11v11_propio', 'jugadores'));
      setSelectedTokenId('BALON');
      return;
    }

    if (activeTactica) {
      const mod = activeTactica.modalidad || 'Campo';
      setBoardModalidad(mod);
      if (activeTactica.id_trabajo) {
        setLinkedTrabajoId(String(activeTactica.id_trabajo));
      }
      const nextSteps = normalizePasos(activeTactica, mod);
      setPasos(nextSteps);
      const firstTok = nextSteps[0]?.jugadores?.[0];
      setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    } else {
      const catObj = categories.find((c) => String(c.id_categoria) === String(categoryFilter));
      const fallbackMod =
        modalidadFilter !== 'Todas' ? modalidadFilter : catObj?.modalidad || 'Campo';
      setBoardModalidad(fallbackMod);
      const presetKey = DEFAULT_PRESET_BY_MODALIDAD[fallbackMod] || '11v11_propio';
      const nextSteps = buildPresetSteps(presetKey, 'jugadores');
      setPasos(nextSteps);
      const firstTok = nextSteps[0]?.jugadores?.[0];
      setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    }
  }, [activeTactica, modalidadFilter, categoryFilter, categories, showNewForm, newTactica.modalidad, customScenarioDirty]);

  // Motor Play 2D
  useEffect(() => {
    if (!isPlaying || pasos.length < 2) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      return;
    }
    const tick = (ts) => {
      if (!lastFrameRef.current) lastFrameRef.current = ts;
      const dt = (ts - lastFrameRef.current) / 1000;
      lastFrameRef.current = ts;
      setPlayProgress((prev) => {
        const next = prev + dt * playSpeed;
        return next >= pasos.length - 1 ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, pasos.length, playSpeed]);

  const displayedState = useMemo(() => {
    if (pasos.length === 0) return { jugadores: [], balon: { x: 50, y: 50 }, descripcion: '' };
    if (!isPlaying) {
      const cur = pasos[Math.min(activeStepIdx, pasos.length - 1)];
      return {
        jugadores: getStepTokens(cur, 'jugadores'),
        balon: cur.balon || { x: 50, y: 50 },
        descripcion: cur.descripcion || '',
      };
    }

    const idxA = Math.min(Math.floor(playProgress), pasos.length - 1);
    const idxB = Math.min(idxA + 1, pasos.length - 1);
    const t = playProgress - idxA;
    const stepA = pasos[idxA];
    const stepB = pasos[idxB];

    const listA = getStepTokens(stepA, 'jugadores');
    const listB = getStepTokens(stepB, 'jugadores');

    const jugadores = listA.map((j, i) => {
      const jid = getTokenId(j, i);
      const target = listB.find((b, k) => getTokenId(b, k) === jid) || listB[i] || j;
      return {
        ...j,
        id: jid,
        x: j.x + (target.x - j.x) * t,
        y: j.y + (target.y - j.y) * t,
      };
    });

    const bA = stepA.balon || { x: 50, y: 50 };
    const bB = stepB.balon || bA;
    return {
      jugadores,
      balon: { x: bA.x + (bB.x - bA.x) * t, y: bA.y + (bB.y - bA.y) * t },
      descripcion: stepA.descripcion || '',
    };
  }, [pasos, isPlaying, activeStepIdx, playProgress]);

  const trajectories = useMemo(() => extractTrajectoriesFromPasos(pasos, 'jugadores'), [pasos]);

  const categoryFormationCount = useMemo(() => {
    const targetCat = categoryFilter || newTactica.id_categoria;
    if (!targetCat) return null;
    return tacticas.filter((t) => String(t.id_categoria || '') === String(targetCat)).length;
  }, [tacticas, categoryFilter, newTactica.id_categoria]);

  const currentTokens = getStepTokens(
    pasos[Math.min(activeStepIdx, Math.max(0, pasos.length - 1))],
    'jugadores'
  );

  // Detectar qué dorsales 1..22 están activos en cancha (propios y rivales)
  const activeOwnByDorsal = useMemo(() => {
    const map = new Map();
    currentTokens.forEach((t, idx) => {
      if (t.team === 'A' || t.team === 'GK') {
        map.set(Number(t.dorsal), getTokenId(t, idx));
      }
    });
    return map;
  }, [currentTokens]);

  const activeRivalByDorsal = useMemo(() => {
    const map = new Map();
    currentTokens.forEach((t, idx) => {
      if (t.team === 'B' || t.team === 'GK_B') {
        map.set(Number(t.dorsal), getTokenId(t, idx));
      }
    });
    return map;
  }, [currentTokens]);

  const handleToggleNumberedPlayer = (team, dorsal) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const existingTid =
      team === 'A' ? activeOwnByDorsal.get(dorsal) : activeRivalByDorsal.get(dorsal);
    if (existingTid) {
      setSelectedTokenId(existingTid);
      return;
    }
    const curStep = pasos[activeStepIdx] || pasos[0];
    const newTok = createNumberedPlayerToken(team, dorsal, getStepTokens(curStep, 'jugadores'));
    setPasos((prev) =>
      prev.map((step) => {
        const list = getStepTokens(step, 'jugadores');
        return cloneStepWithTokens(step, 'jugadores', [...list, { ...newTok }]);
      })
    );
    setSelectedTokenId(newTok.id);
  };

  const handleAddMaterial = (materialKey) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const curStep = pasos[activeStepIdx] || pasos[0];
    const newTok = createMaterialToken(materialKey, getStepTokens(curStep, 'jugadores'));
    setPasos((prev) =>
      prev.map((step) => {
        const list = getStepTokens(step, 'jugadores');
        return cloneStepWithTokens(step, 'jugadores', [...list, { ...newTok }]);
      })
    );
    setSelectedTokenId(newTok.id);
  };

  const handleRemoveSelectedToken = () => {
    if (!selectedTokenId || selectedTokenId === 'BALON') return;
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step) => {
        const remaining = getStepTokens(step, 'jugadores').filter(
          (t, i) => getTokenId(t, i) !== selectedTokenId
        );
        return cloneStepWithTokens(step, 'jugadores', remaining);
      })
    );
    setSelectedTokenId('BALON');
  };

  const handleClearMaterialsOnly = () => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step) => {
        const onlyPlayers = getStepTokens(step, 'jugadores').filter(
          (t) => t.team !== 'CONO' && t.team !== 'MAT'
        );
        return cloneStepWithTokens(step, 'jugadores', onlyPlayers);
      })
    );
  };

  const handleMoveToken = (tokenId, x, y) => {
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step, sIdx) => {
        if (sIdx !== activeStepIdx) return step;
        if (tokenId === 'BALON') {
          return { ...step, balon: { x, y, movKind: 'balon' } };
        }
        const updated = getStepTokens(step, 'jugadores').map((tok, idx) =>
          getTokenId(tok, idx) === tokenId ? { ...tok, x, y, movKind: 'recta' } : tok
        );
        return cloneStepWithTokens(step, 'jugadores', updated);
      })
    );
    setSelectedTokenId(tokenId);
  };

  const handlePitchClick = (x, y) => {
    setCustomScenarioDirty(true);
    if (toolMode === 'pase_corto' || toolMode === 'pase_largo') {
      const res = applyPassMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        destX: x,
        destY: y,
        kind: toolMode,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      setSelectedTokenId('BALON');
      return;
    }

    if (toolMode === 'zigzag') {
      const res = applyZigZagMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        targetId: selectedTokenId || 'BALON',
        destX: x,
        destY: y,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      return;
    }

    if (toolMode === 'recta') {
      const res = applyLinearMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        targetId: selectedTokenId || 'BALON',
        destX: x,
        destY: y,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      return;
    }

    handleMoveToken(selectedTokenId || 'BALON', x, y);
  };

  const handleApplyPreset = (presetKey) => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);
    setCustomScenarioDirty(true);
    const nextPasos = buildPresetSteps(presetKey, 'jugadores');
    setPasos(nextPasos);

    if (presetKey === '5v5_sala') setBoardModalidad('Sala');
    else if (presetKey === '7v7_f7' || presetKey === '7v7_propio') setBoardModalidad('F7');
    else if (presetKey === '11v11_propio' || presetKey === '11v11_completo') setBoardModalidad('Campo');

    const firstTok = nextPasos[0]?.jugadores?.[0];
    setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    setFeedback(`Escenario cargado: ${SCENARIO_PRESETS.find((p) => p.key === presetKey)?.label}.`);
  };

  const handleQuickAttackAndDefend = (targetMode) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const targetId =
      targetMode === 'TEAM_A'
        ? 'TEAM_A'
        : selectedTokenId && selectedTokenId !== 'BALON'
        ? selectedTokenId
        : 'TEAM_A';
    const res = applyAttackAndDefendCycleSteps({
      pasos,
      stepIdx: activeStepIdx,
      targetId,
      preferredKey: 'jugadores',
    });
    setPasos(res.pasos);
    setActiveStepIdx(res.nextStepIdx);
    setFeedback('Ciclo agregado: Subir en ataque y bajar a defender.');
  };

  const handleQuickShoot = (corner) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const shooterId =
      selectedTokenId && selectedTokenId !== 'BALON' ? selectedTokenId : null;
    const res = applyShootAtGoalSteps({
      pasos,
      stepIdx: activeStepIdx,
      shooterId,
      corner,
      preferredKey: 'jugadores',
    });
    setPasos(res.pasos);
    setActiveStepIdx(res.nextStepIdx);
    setFeedback('Remate al arco agregado en el paso siguiente.');
  };

  const handleAddStep = () => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) => {
      const last =
        prev[prev.length - 1] ||
        buildPresetSteps(DEFAULT_PRESET_BY_MODALIDAD[boardModalidad] || '11v11_propio', 'jugadores')[0];
      const nextStep = {
        descripcion: `Paso ${prev.length + 1}: Progresión Táctica`,
        jugadores: getStepTokens(last, 'jugadores').map((j) => ({ ...j })),
        balon: { ...(last.balon || { x: 50, y: 50 }) },
      };
      setActiveStepIdx(prev.length);
      return [...prev, nextStep];
    });
  };

  const handleRemoveCurrentStep = () => {
    if (pasos.length <= 1) return;
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const remaining = pasos.filter((_, idx) => idx !== activeStepIdx);
    setPasos(remaining);
    setActiveStepIdx((prev) => Math.max(0, Math.min(prev, remaining.length - 1)));
  };

  const handleSaveAnimationToExisting = async () => {
    setSaving(true);
    setFeedback('');
    setErrorMsg('');
    try {
      if (activeTactica) {
        await api.put(`/coach/tacticas/${activeTactica.id_tactica}`, {
          id_trabajo: linkedTrabajoId ? Number(linkedTrabajoId) : null,
          formacion_json: { jugadores: pasos[0]?.jugadores || [] },
          movimientos_json: { pasos },
        });
        setFeedback(
          `Pizarra "${activeTactica.nombre_sistema}" guardada${
            linkedTrabajoId ? ' y sincronizada con la tarea de Trabajos' : ''
          }.`
        );
      } else if (linkedTrabajoId) {
        await api.patch(`/coach/trabajos/${linkedTrabajoId}`, {
          animacion_3d_json: { pasos, modalidad: boardModalidad },
        });
        setFeedback('Movimientos 2D guardados directamente en el trabajo seleccionado de la agenda.');
      }
      setCustomScenarioDirty(false);
      if (onCreated) await onCreated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando movimientos 2D.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTactica = async (idTactica) => {
    setErrorMsg('');
    try {
      await api.delete(`/coach/tacticas/${idTactica}`);
      setCustomScenarioDirty(false);
      setFeedback('Formación eliminada de la categoría.');
      if (onCreated) await onCreated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error eliminando formación.');
    }
  };

  const handleSaveCustomTactica = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setFeedback('');

    const modTokens =
      pasos[0]?.jugadores?.length > 0
        ? pasos[0].jugadores
        : extractBaseTokens(null, newTactica.modalidad);

    try {
      const res = await api.post('/coach/tacticas', {
        ...newTactica,
        id_categoria: newTactica.id_categoria || categoryFilter || null,
        id_trabajo: newTactica.id_trabajo || linkedTrabajoId || null,
        formacion_json: { jugadores: modTokens },
        movimientos_json: { pasos },
      });
      setShowNewForm(false);
      setCustomScenarioDirty(false);
      setFeedback('Nueva formación guardada y vinculada al trabajo exitosamente.');
      if (onCreated) await onCreated(res.data.tactica);
      setSelectedId(res.data.tactica.id_tactica);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando nueva formación.');
    } finally {
      setSaving(false);
    }
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);
  const isLimitReached = categoryFormationCount !== null && categoryFormationCount >= 10;
  const linkedJobObj = trabajos.find((j) => String(j.id_trabajo) === String(linkedTrabajoId));

  return (
    <div className="space-y-5">
      {/* Barra superior: Modalidad + Categoría + Tarea de Trabajos vinculada + Nueva Formación */}
      <div className="card-fenix p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['Todas', 'Campo', 'F7', 'Sala'].map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => {
                setCustomScenarioDirty(false);
                setModalidadFilter(mod);
                if (mod !== 'Todas') {
                  setBoardModalidad(mod);
                  setNewTactica((prev) => ({ ...prev, modalidad: mod }));
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                modalidadFilter === mod
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#151515] border-neutral-800 text-texto-secundario hover:text-white'
              }`}
            >
              {mod === 'Todas' ? 'Todas las Canchas' : `Fútbol ${mod}`}
            </button>
          ))}

          <select
            className="input-fenix w-auto text-xs"
            value={categoryFilter}
            onChange={(e) => {
              const idCat = e.target.value;
              const catObj = categories.find((c) => String(c.id_categoria) === String(idCat));
              setCustomScenarioDirty(false);
              setCategoryFilter(idCat);
              setNewTactica((prev) => ({
                ...prev,
                id_categoria: idCat,
                modalidad: catObj?.modalidad || prev.modalidad,
              }));
              if (catObj?.modalidad) setBoardModalidad(catObj.modalidad);
            }}
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

          <select
            className="input-fenix w-auto text-xs border-amber-500/50 max-w-[260px]"
            value={linkedTrabajoId}
            onChange={(e) => {
              const jid = e.target.value;
              setLinkedTrabajoId(jid);
              setNewTactica((prev) => ({ ...prev, id_trabajo: jid }));
            }}
            title="Vincular pizarra a una tarea guardada en Trabajos y Cancha"
          >
            <option value="">Sin vincular a tarea específica</option>
            {trabajos
              .filter((t) => t.rol_autor !== 'FISIO')
              .map((tr) => (
                <option key={tr.id_trabajo} value={tr.id_trabajo}>
                  Tarea: {tr.titulo} ({String(tr.fecha).slice(0, 10)})
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {categoryFormationCount !== null && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                isLimitReached
                  ? 'bg-rojo-fuego/20 border-rojo-fuego text-rojo-fuego'
                  : 'bg-[#151515] border-neutral-700 text-green-400'
              }`}
            >
              {categoryFormationCount} / 10 Formaciones
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setShowNewForm(!showNewForm);
            }}
            disabled={isLimitReached && !showNewForm}
            className="btn-vinotinto text-xs disabled:opacity-45"
          >
            <PlusCircle className="w-4 h-4" />
            {isLimitReached ? 'Límite 10/10' : showNewForm ? 'Cerrar' : 'Guardar Como Nueva Formación'}
          </button>
        </div>
      </div>

      {linkedJobObj && (
        <div className="bg-amber-950/35 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-100">
            <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Tarea vinculada de Trabajos:</strong> {linkedJobObj.titulo} •{' '}
              {linkedJobObj.categoria_nombre || 'Club'} • {linkedJobObj.espacio_cancha} (
              {String(linkedJobObj.hora_inicio).slice(0, 5)}–{String(linkedJobObj.hora_fin).slice(0, 5)})
            </span>
          </div>
          {!activeTactica && (
            <button
              type="button"
              onClick={handleSaveAnimationToExisting}
              disabled={saving}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px]"
            >
              <Save className="w-3 h-3 inline mr-1" /> Guardar 2D directo en esta Tarea
            </button>
          )}
        </div>
      )}

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selector de sistemas guardados */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {filteredTacticas.map((t) => (
            <div key={t.id_tactica} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => {
                  setCustomScenarioDirty(false);
                  setShowNewForm(false);
                  setSelectedId(t.id_tactica);
                }}
                className={`px-3 py-1.5 rounded-l-lg text-xs font-bold border transition ${
                  activeTactica?.id_tactica === t.id_tactica && !showNewForm
                    ? 'bg-vinotinto border-rojo-fuego text-white shadow-fenix'
                    : 'bg-[#161616] border-neutral-800 text-texto-secundario hover:text-white'
                }`}
              >
                {t.nombre_sistema}{' '}
                <span className="text-[10px] opacity-80">
                  ({t.modalidad}
                  {t.trabajo_titulo ? ` • 📌 ${t.trabajo_titulo.slice(0, 18)}` : ''})
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTactica(t.id_tactica)}
                className="px-2 py-1.5 rounded-r-lg bg-[#1c1c1c] hover:bg-rojo-fuego border border-l-0 border-neutral-800 text-neutral-400 hover:text-white transition"
                title="Eliminar formación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setPlayProgress(0);
            setActiveStepIdx(0);
            setCustomScenarioDirty(false);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {/* Formulario Nueva Formación (Máx 10 por categoría) */}
      {showNewForm && (
        <form
          onSubmit={handleSaveCustomTactica}
          className="card-fenix p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-rojo-fuego/60 text-xs"
        >
          <input
            type="text"
            className="input-fenix"
            placeholder="Nombre sistema (ej: 1-4-3-3 Presión Alta)"
            value={newTactica.nombre_sistema}
            onChange={(e) => setNewTactica({ ...newTactica, nombre_sistema: e.target.value })}
            required
          />
          <select
            className="input-fenix"
            value={newTactica.modalidad}
            onChange={(e) => {
              setCustomScenarioDirty(false);
              setNewTactica({ ...newTactica, modalidad: e.target.value });
            }}
          >
            <option value="Campo">Fútbol Campo (11v11)</option>
            <option value="F7">Fútbol 7 (7v7)</option>
            <option value="Sala">Fútbol Sala (5v5)</option>
          </select>
          <select
            className="input-fenix"
            value={newTactica.id_trabajo || linkedTrabajoId}
            onChange={(e) => setNewTactica({ ...newTactica, id_trabajo: e.target.value })}
          >
            <option value="">Opcional: Vincular a Trabajo de Agenda</option>
            {trabajos
              .filter((t) => t.rol_autor !== 'FISIO')
              .map((tr) => (
                <option key={tr.id_trabajo} value={tr.id_trabajo}>
                  {tr.titulo} ({String(tr.fecha).slice(0, 10)})
                </option>
              ))}
          </select>
          <input
            type="text"
            className="input-fenix md:col-span-3"
            placeholder="Descripción del ejercicio táctico..."
            value={newTactica.descripcion}
            onChange={(e) => setNewTactica({ ...newTactica, descripcion: e.target.value })}
          />
          <textarea
            rows={2}
            className="input-fenix"
            placeholder="Ventajas / Pros tácticos..."
            value={newTactica.pros}
            onChange={(e) => setNewTactica({ ...newTactica, pros: e.target.value })}
            required
          />
          <textarea
            rows={2}
            className="input-fenix md:col-span-2"
            placeholder="Riesgos / Contras..."
            value={newTactica.contras}
            onChange={(e) => setNewTactica({ ...newTactica, contras: e.target.value })}
            required
          />
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 bg-neutral-800 rounded-lg"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-cta text-xs py-1.5 px-4">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar Formación'}
            </button>
          </div>
        </form>
      )}

      {/* PIZARRA 2D + MÓDULOS DESLIZANTES AMIGABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Tablero 2D + Controles Play y Pasos */}
        <div className="lg:col-span-7 card-fenix p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141418] border border-neutral-800 rounded-xl p-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {pasos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepIdx(idx);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                    !isPlaying && activeStepIdx === idx
                      ? 'bg-vinotinto border-rojo-fuego text-white'
                      : 'bg-[#1b1b20] border-neutral-700 text-neutral-300'
                  }`}
                >
                  Paso {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddStep}
                className="px-2 py-1 rounded text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-white inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Paso
              </button>
              {pasos.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveCurrentStep}
                  className="px-2 py-1 rounded text-[11px] font-bold bg-neutral-800 hover:bg-rojo-fuego text-neutral-300 hover:text-white"
                >
                  - Paso
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTrajectories(!showTrajectories)}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 inline-flex items-center gap-1"
              >
                {showTrajectories ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Líneas
              </button>
              <select
                className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] font-bold text-white"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={0.8}>1x</option>
                <option value={1.4}>1.5x</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (pasos.length < 2) {
                    setErrorMsg('Usa cualquier movimiento en Opciones (Pase Corto, Pase Largo, Línea Recta, Zig-Zag o Subir/Bajar) para animar.');
                    return;
                  }
                  setErrorMsg('');
                  setIsPlaying(!isPlaying);
                }}
                className="btn-cta text-xs py-1 px-3"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pausar' : 'Play 2D'}
              </button>
              {(activeTactica || linkedTrabajoId) && !showNewForm && (
                <button
                  type="button"
                  onClick={handleSaveAnimationToExisting}
                  disabled={saving}
                  className="btn-vinotinto text-xs py-1 px-3"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar
                </button>
              )}
            </div>
          </div>

          {pasos[activeStepIdx] && !isPlaying && (
            <input
              type="text"
              className="input-fenix text-xs"
              value={pasos[activeStepIdx].descripcion || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCustomScenarioDirty(true);
                setPasos((prev) =>
                  prev.map((st, idx) =>
                    idx === activeStepIdx ? { ...st, descripcion: val } : st
                  )
                );
              }}
              placeholder="Nota del paso actual (selecciona ficha y haz clic en cancha según la opción activa)..."
            />
          )}

          {isPlaying && (
            <p className="text-xs font-bold text-amber-300 px-1">
              ▶ Reproduciendo: {displayedState.descripcion}
            </p>
          )}

          <Pitch2DBoard
            modalidad={boardModalidad}
            tokens={displayedState.jugadores}
            balon={displayedState.balon}
            trajectories={trajectories}
            showTrajectories={showTrajectories}
            highlightSpace={linkedJobObj?.espacio_cancha || ''}
            selectedTokenId={selectedTokenId}
            isPlaying={isPlaying}
            interactive={!isPlaying}
            cursorCrosshair={toolMode !== 'move'}
            onSelectToken={(tid) => setSelectedTokenId(tid)}
            onMoveToken={handleMoveToken}
            onPitchClick={handlePitchClick}
          />

          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-neutral-300 pt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-yellow-300 inline-block" /> Pase Corto
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-orange-500 inline-block" /> Pase Largo
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Línea Recta
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Zig-Zag
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-purple-400 inline-block" /> Subir/Bajar
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500 inline-block" /> Remate
            </span>
          </div>
        </div>

        {/* Columna Derecha: Módulos Deslizantes Ordenados */}
        <div className="lg:col-span-5 space-y-3">
          {/* Submenú 1: Opciones de Movimiento y Pases */}
          <AccordionSection
            title="Opciones y Movimientos"
            icon={SlidersHorizontal}
            badge={toolMode.replace('_', ' ')}
            isOpen={openSection === 'opciones'}
            onToggle={() => setOpenSection(openSection === 'opciones' ? '' : 'opciones')}
          >
            <div className="flex items-center justify-between text-[11px] bg-[#0f0f13] border border-neutral-800 rounded-lg px-3 py-2">
              <span className="text-texto-secundario">
                Elemento seleccionado:{' '}
                <strong className="text-amber-300">
                  {selectedTokenId === 'BALON'
                    ? '⚽ Balón Principal'
                    : currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId)
                    ? `#${
                        currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId).dorsal
                      } (${currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId).rol})`
                    : 'Ninguno'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTokenId('BALON')}
                className="px-2 py-0.5 rounded bg-amber-400 text-black font-extrabold text-[10px]"
              >
                ⚽ Usar Balón
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setToolMode('move')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'move'
                    ? 'bg-white text-black border-white'
                    : 'bg-[#1b1b22] text-neutral-300 border-neutral-700 hover:text-white'
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" /> Arrastrar Libre
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('pase_corto');
                  setSelectedTokenId('BALON');
                }}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'pase_corto'
                    ? 'bg-yellow-300 text-black border-white'
                    : 'bg-[#1b1b22] text-yellow-200 border-neutral-700 hover:border-yellow-400'
                }`}
              >
                ⚽ Pase Corto
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('pase_largo');
                  setSelectedTokenId('BALON');
                }}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'pase_largo'
                    ? 'bg-orange-500 text-black border-white'
                    : 'bg-[#1b1b22] text-orange-300 border-neutral-700 hover:border-orange-400'
                }`}
              >
                ⚽ Pase Largo
              </button>
              <button
                type="button"
                onClick={() => setToolMode('recta')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'recta'
                    ? 'bg-emerald-500 text-black border-white'
                    : 'bg-[#1b1b22] text-emerald-300 border-neutral-700 hover:border-emerald-400'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" /> Línea Recta
              </button>
              <button
                type="button"
                onClick={() => setToolMode('zigzag')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'zigzag'
                    ? 'bg-cyan-400 text-black border-white'
                    : 'bg-[#1b1b22] text-cyan-300 border-neutral-700 hover:border-cyan-400'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Zig-Zag / Slalom
              </button>
              <button
                type="button"
                onClick={() => handleQuickAttackAndDefend('SELECTED')}
                className="px-3 py-2 rounded-lg font-bold border bg-purple-950/70 hover:bg-purple-800 text-purple-200 border-purple-500/60 inline-flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Subir y Bajar
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center rounded-lg border border-red-500/70 overflow-hidden text-[11px] flex-1">
                <span className="px-2 py-1.5 bg-red-950/80 text-red-200 font-bold inline-flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Remate:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('left')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold"
                >
                  ↖ Izq
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('center')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold border-x border-neutral-700"
                >
                  ↑ Centro
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('right')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold"
                >
                  ↗ Der
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-texto-secundario">
                Escenarios Rápidos (1v1 hasta 22 Jugadores):
              </p>
              <div className="flex flex-wrap gap-1">
                {SCENARIO_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleApplyPreset(p.key)}
                    className="px-2 py-1 rounded bg-[#1b1b22] hover:bg-vinotinto border border-neutral-700 text-[10px] font-bold text-neutral-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </AccordionSection>

          {/* Submenú 2: Jugadores Propios (1 al 22) */}
          <AccordionSection
            title="Jugadores Legión Fénix (1–22)"
            icon={Users}
            badge={`${activeOwnByDorsal.size} en cancha`}
            isOpen={openSection === 'jugadores'}
            onToggle={() => setOpenSection(openSection === 'jugadores' ? '' : 'jugadores')}
          >
            <p className="text-[11px] text-texto-secundario">
              Haz clic en cualquier dorsal del <strong className="text-white">#1 al #22</strong> para colocarlo en la cancha o seleccionarlo (#1 es Portero).
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((dorsal) => {
                const tid = activeOwnByDorsal.get(dorsal);
                const isSelected = tid && selectedTokenId === tid;
                return (
                  <button
                    key={`own-${dorsal}`}
                    type="button"
                    onClick={() => handleToggleNumberedPlayer('A', dorsal)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold border transition ${
                      isSelected
                        ? 'bg-amber-400 text-black border-white ring-2 ring-amber-300'
                        : tid
                        ? 'bg-vinotinto text-white border-rojo-fuego'
                        : 'bg-[#1b1b22] text-neutral-300 border-neutral-700 hover:border-vinotinto hover:text-white'
                    }`}
                  >
                    #{dorsal}
                  </button>
                );
              })}
            </div>
            {selectedTokenId && selectedTokenId !== 'BALON' && (
              <button
                type="button"
                onClick={handleRemoveSelectedToken}
                className="w-full py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-xs font-bold text-white"
              >
                Quitar Ficha Seleccionada de la Cancha
              </button>
            )}
          </AccordionSection>

          {/* Submenú 3: Rivales (1 al 22) */}
          <AccordionSection
            title="Rivales Numerados (1–22)"
            icon={Users}
            badge={`${activeRivalByDorsal.size} en cancha`}
            isOpen={openSection === 'rivales'}
            onToggle={() => setOpenSection(openSection === 'rivales' ? '' : 'rivales')}
          >
            <p className="text-[11px] text-texto-secundario">
              Selecciona cualquier dorsal rival del <strong className="text-cyan-300">#1 al #22</strong> para simular marcas, duelos o bloque rival.
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((dorsal) => {
                const tid = activeRivalByDorsal.get(dorsal);
                const isSelected = tid && selectedTokenId === tid;
                return (
                  <button
                    key={`riv-${dorsal}`}
                    type="button"
                    onClick={() => handleToggleNumberedPlayer('B', dorsal)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold border transition ${
                      isSelected
                        ? 'bg-amber-400 text-black border-white ring-2 ring-amber-300'
                        : tid
                        ? 'bg-cyan-700 text-white border-cyan-400'
                        : 'bg-[#1b1b22] text-cyan-200/80 border-neutral-700 hover:border-cyan-500'
                    }`}
                  >
                    R{dorsal}
                  </button>
                );
              })}
            </div>
            {selectedTokenId && selectedTokenId !== 'BALON' && (
              <button
                type="button"
                onClick={handleRemoveSelectedToken}
                className="w-full py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-xs font-bold text-white"
              >
                Quitar Ficha Seleccionada
              </button>
            )}
          </AccordionSection>

          {/* Submenú 4: Materiales (Conos, Tapas, Balones, Vallas, Aros, Escalera) */}
          <AccordionSection
            title="Materiales (Conos, Tapas, Vallas, Aros)"
            icon={Box}
            badge={
              currentTokens.filter((t) => t.team === 'CONO' || t.team === 'MAT').length
            }
            isOpen={openSection === 'materiales'}
            onToggle={() => setOpenSection(openSection === 'materiales' ? '' : 'materiales')}
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {MATERIAL_CATALOG.map((mat) => (
                <button
                  key={mat.key}
                  type="button"
                  onClick={() => handleAddMaterial(mat.key)}
                  className="px-3 py-2 rounded-lg bg-[#1b1b22] hover:bg-[#24242d] border border-neutral-700 text-left flex items-center justify-between transition"
                >
                  <span className="font-bold text-white">+ {mat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${mat.badge}`}>
                    {mat.short}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {selectedTokenId && selectedTokenId !== 'BALON' && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedToken}
                  className="flex-1 py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-[11px] font-bold text-white"
                >
                  Quitar Material Elegido
                </button>
              )}
              <button
                type="button"
                onClick={handleClearMaterialsOnly}
                className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200"
              >
                Limpiar Materiales
              </button>
            </div>
          </AccordionSection>

          {/* Ficha Pros / Contras del Esquema Seleccionado */}
          {activeTactica && (
            <div className="card-fenix p-4 space-y-2 text-xs border-l-4 border-l-vinotinto">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-lg font-extrabold text-white">
                  {activeTactica.nombre_sistema}
                </h4>
                <span className="text-[10px] text-rojo-fuego font-bold uppercase">
                  {activeTactica.modalidad}
                </span>
              </div>
              {activeTactica.descripcion && (
                <p className="text-texto-secundario">{activeTactica.descripcion}</p>
              )}
              <p className="text-green-300">
                <Sparkles className="w-3 h-3 inline mr-1" />
                <strong>Pros:</strong> {activeTactica.pros}
              </p>
              <p className="text-red-300">
                <ShieldAlert className="w-3 h-3 inline mr-1" />
                <strong>Contras:</strong> {activeTactica.contras}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
