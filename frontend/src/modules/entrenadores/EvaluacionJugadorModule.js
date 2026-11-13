import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, AlertCircle } from 'lucide-react';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';

export default function EvaluacionJugadorModule({
  categories = [],
  players = [],
  evaluaciones = [],
  selectedCategoryFilter = '',
  onReload,
}) {
  const [catFilter, setCatFilter] = useState(selectedCategoryFilter || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [scores, setScores] = useState({
    fisica_velocidad: 7.5,
    fisica_resistencia: 7.5,
    fisica_fuerza: 7.0,
    tecnica_control: 8.0,
    tecnica_pase: 8.0,
    tecnica_definicion: 7.5,
    coordinativa_agilidad: 7.8,
    coordinativa_equilibrio: 7.6,
    coordinativa_ritmo: 7.7,
    fortalezas: '',
    debilidades: '',
    observaciones: '',
  });

  useEffect(() => {
    if (selectedCategoryFilter !== undefined) {
      setCatFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  const filteredPlayers = useMemo(() => {
    if (!catFilter) return players;
    return players.filter((p) => String(p.id_categoria) === String(catFilter));
  }, [players, catFilter]);

  useEffect(() => {
    if (
      filteredPlayers.length > 0 &&
      !filteredPlayers.some((p) => String(p.id_jugador) === String(selectedPlayerId))
    ) {
      setSelectedPlayerId(String(filteredPlayers[0].id_jugador));
    }
  }, [filteredPlayers, selectedPlayerId]);

  const activePlayer = useMemo(
    () =>
      filteredPlayers.find((p) => String(p.id_jugador) === String(selectedPlayerId)) ||
      filteredPlayers[0] ||
      null,
    [filteredPlayers, selectedPlayerId]
  );

  useEffect(() => {
    if (!activePlayer) return;
    setScores({
      fisica_velocidad: Number(activePlayer.fisica_velocidad || 7.0),
      fisica_resistencia: Number(activePlayer.fisica_resistencia || 7.0),
      fisica_fuerza: Number(activePlayer.fisica_fuerza || 7.0),
      tecnica_control: Number(activePlayer.tecnica_control || 7.0),
      tecnica_pase: Number(activePlayer.tecnica_pase || 7.0),
      tecnica_definicion: Number(activePlayer.tecnica_definicion || 7.0),
      coordinativa_agilidad: Number(activePlayer.coordinativa_agilidad || 7.0),
      coordinativa_equilibrio: Number(activePlayer.coordinativa_equilibrio || 7.0),
      coordinativa_ritmo: Number(activePlayer.coordinativa_ritmo || 7.0),
      fortalezas: activePlayer.fortalezas || '',
      debilidades: activePlayer.debilidades || '',
      observaciones: activePlayer.observaciones_evaluacion || '',
    });
  }, [activePlayer]);

  const computedPreview = useMemo(() => {
    const scoreFisica = Number(
      (
        (Number(scores.fisica_velocidad) +
          Number(scores.fisica_resistencia) +
          Number(scores.fisica_fuerza)) /
        3
      ).toFixed(2)
    );
    const scoreTecnica = Number(
      (
        (Number(scores.tecnica_control) +
          Number(scores.tecnica_pase) +
          Number(scores.tecnica_definicion)) /
        3
      ).toFixed(2)
    );
    const scoreCoordinativa = Number(
      (
        (Number(scores.coordinativa_agilidad) +
          Number(scores.coordinativa_equilibrio) +
          Number(scores.coordinativa_ritmo)) /
        3
      ).toFixed(2)
    );
    const puntajeGlobal = Number(
      ((scoreFisica + scoreTecnica + scoreCoordinativa) / 3).toFixed(2)
    );
    const porcentajeGlobal = Math.max(0, Math.min(100, Math.round(puntajeGlobal * 10)));

    return {
      ...scores,
      score_fisica: scoreFisica,
      score_tecnica: scoreTecnica,
      score_coordinativa: scoreCoordinativa,
      puntaje_global: puntajeGlobal,
      porcentaje_global: porcentajeGlobal,
      fortalezas:
        scores.fortalezas ||
        activePlayer?.fortalezas ||
        'Velocidad y Arranque|Control y Regate|Agilidad y Cambios',
      debilidades: scores.debilidades || activePlayer?.debilidades || '',
    };
  }, [scores, activePlayer]);

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!activePlayer) return;
    setSaving(true);
    setErrorMsg('');
    setFeedback('');

    try {
      const res = await api.post('/coach/evaluations', {
        id_jugador: activePlayer.id_jugador,
        fisica_velocidad: scores.fisica_velocidad,
        fisica_resistencia: scores.fisica_resistencia,
        fisica_fuerza: scores.fisica_fuerza,
        tecnica_control: scores.tecnica_control,
        tecnica_pase: scores.tecnica_pase,
        tecnica_definicion: scores.tecnica_definicion,
        coordinativa_agilidad: scores.coordinativa_agilidad,
        coordinativa_equilibrio: scores.coordinativa_equilibrio,
        coordinativa_ritmo: scores.coordinativa_ritmo,
        fortalezas: scores.fortalezas || undefined,
        debilidades: scores.debilidades || undefined,
        observaciones: scores.observaciones,
      });
      setFeedback(res.data.message || 'Evaluación manual guardada exitosamente.');
      if (onReload) await onReload();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando la evaluación del jugador.');
    } finally {
      setSaving(false);
    }
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);
  const playerHistory = evaluaciones.filter(
    (ev) => activePlayer && String(ev.id_jugador) === String(activePlayer.id_jugador)
  );

  const renderSlider = (key, label) => (
    <div key={key} className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-300 font-semibold">{label}</span>
        <span className="font-mono font-extrabold text-white">
          {Number(scores[key]).toFixed(1)} / 10
        </span>
      </div>
      <input
        type="range"
        min="0.1"
        max="10"
        step="0.1"
        value={scores[key]}
        onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        className="w-full accent-rojo-fuego cursor-pointer"
      />
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 border-l-vinotinto">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Submódulo Evaluación Manual del Entrenador
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            EVALUACIÓN FÍSICA, TÉCNICA CON BALÓN Y COORDINATIVA
          </h2>
          <p className="text-xs text-texto-secundario">
            Evalúa manualmente en cancha de <strong className="text-white">0.1</strong> a{' '}
            <strong className="text-rojo-fuego">10.0 puntos</strong>. El promedio y porcentaje se actualizan automáticamente en la tarjeta visual y gráfica de rendimiento del atleta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <select
            className="input-fenix w-auto text-xs min-w-[210px]"
            value={activePlayer?.id_jugador || ''}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
          >
            {filteredPlayers.map((p) => (
              <option key={p.id_jugador} value={p.id_jugador}>
                #{p.dorsal || '--'} {p.nombre} {p.apellido} ({p.categoria_nombre})
              </option>
            ))}
          </select>
        </div>
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

      {activePlayer && (
        <>
          <PlayerCardModule player={activePlayer} evaluation={computedPreview} />

          <form onSubmit={handleSubmitEvaluation} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-fenix p-4 space-y-3 border-t-4 border-t-amber-500">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-amber-400">1. ÁREA FÍSICA</h3>
                    <span className="text-xs font-extrabold text-white bg-neutral-800 px-2 py-0.5 rounded">
                      {computedPreview.score_fisica.toFixed(1)}
                    </span>
                  </div>
                  {renderSlider('fisica_velocidad', 'Velocidad y Arranque')}
                  {renderSlider('fisica_resistencia', 'Resistencia Aeróbica')}
                  {renderSlider('fisica_fuerza', 'Fuerza en Duelos')}
                </div>

                <div className="card-fenix p-4 space-y-3 border-t-4 border-t-rojo-fuego">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-rojo-fuego">2. TÉCNICA BALÓN</h3>
                    <span className="text-xs font-extrabold text-white bg-neutral-800 px-2 py-0.5 rounded">
                      {computedPreview.score_tecnica.toFixed(1)}
                    </span>
                  </div>
                  {renderSlider('tecnica_control', 'Control y Regate')}
                  {renderSlider('tecnica_pase', 'Precisión de Pase')}
                  {renderSlider('tecnica_definicion', 'Definición al Arco')}
                </div>

                <div className="card-fenix p-4 space-y-3 border-t-4 border-t-cyan-400">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-cyan-300">3. COORDINATIVA</h3>
                    <span className="text-xs font-extrabold text-white bg-neutral-800 px-2 py-0.5 rounded">
                      {computedPreview.score_coordinativa.toFixed(1)}
                    </span>
                  </div>
                  {renderSlider('coordinativa_agilidad', 'Agilidad y Cambios')}
                  {renderSlider('coordinativa_equilibrio', 'Equilibrio Postural')}
                  {renderSlider('coordinativa_ritmo', 'Ritmo y Reacción')}
                </div>
              </div>

              <div className="card-fenix p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-texto-secundario uppercase mb-1">
                      Fortalezas Clave (separadas por |)
                    </label>
                    <input
                      type="text"
                      className="input-fenix text-xs"
                      placeholder="Ej: Control Orientado|Velocidad Explosiva"
                      value={scores.fortalezas}
                      onChange={(e) => setScores({ ...scores, fortalezas: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-texto-secundario uppercase mb-1">
                      Aspectos a Mejorar (separados por |)
                    </label>
                    <input
                      type="text"
                      className="input-fenix text-xs"
                      placeholder="Ej: Perfil no hábil|Definición bajo presión"
                      value={scores.debilidades}
                      onChange={(e) => setScores({ ...scores, debilidades: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto-secundario uppercase mb-1">
                    Observaciones del Entrenador
                  </label>
                  <textarea
                    rows={2}
                    className="input-fenix text-xs"
                    placeholder="Conclusiones de la evaluación manual en campo y plan de mejora..."
                    value={scores.observaciones}
                    onChange={(e) => setScores({ ...scores, observaciones: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                  <div>
                    <p className="text-xs text-texto-secundario">Valor Global Resultante:</p>
                    <p className="font-display text-2xl font-extrabold text-white">
                      {computedPreview.puntaje_global.toFixed(1)} / 10{' '}
                      <span className="text-green-400 text-lg">({computedPreview.porcentaje_global}%)</span>
                    </p>
                  </div>
                  <button type="submit" disabled={saving} className="btn-cta text-xs py-2.5 px-5">
                    <CheckCircle2 className="w-4 h-4" />
                    {saving ? 'Guardando Nota...' : 'Guardar Evaluación Manual'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 card-fenix p-5 space-y-3">
              <h3 className="font-display text-lg font-bold text-white border-b border-neutral-800 pb-2">
                HISTORIAL DEL ATLETA ({playerHistory.length})
              </h3>
              {playerHistory.length === 0 ? (
                <p className="text-xs text-texto-secundario">
                  Aún no hay evaluaciones previas registradas para este jugador.
                </p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {playerHistory.map((ev) => (
                    <div
                      key={ev.id_evaluacion}
                      className="bg-[#141414] border border-neutral-800 rounded-lg px-3 py-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {new Date(ev.fecha_evaluacion).toLocaleDateString('es-VE')}
                        </span>
                        <span className="font-extrabold text-green-400">
                          {Number(ev.puntaje_global).toFixed(1)}/10 ({ev.porcentaje_global}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-texto-secundario">
                        Física {Number(ev.score_fisica).toFixed(1)} • Técnica{' '}
                        {Number(ev.score_tecnica).toFixed(1)} • Coord.{' '}
                        {Number(ev.score_coordinativa).toFixed(1)}
                      </p>
                      {ev.observaciones && (
                        <p className="text-[11px] text-neutral-300 italic">{ev.observaciones}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </>
      )}
    </section>
  );
}
