import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, HeartPulse, Plus } from 'lucide-react';
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

export default function CoachLesionesModule({ players = [] }) {
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    id_jugador: players[0]?.id_jugador ? String(players[0].id_jugador) : '',
    origen_reporte: 'Entrenamiento',
    zona_anatomica: 'Tobillo Derecho',
    coord_x: 43,
    coord_y: 88,
    tipo_lesion: '',
    gravedad: 'Leve',
    diagnostico: '',
  });

  const loadClinicalOverview = useCallback(async () => {
    try {
      const res = await api.get('/fisio/dashboard');
      setInjuries(res.data.injuries || []);
    } catch (err) {
      console.error('Error cargando estado médico de plantilla:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinicalOverview();
  }, [loadClinicalOverview]);

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
      const d = Math.hypot(z.x - x, z.y - y);
      if (d < minDist) {
        minDist = d;
        nearest = z;
      }
    }
    setForm((prev) => ({ ...prev, coord_x: x, coord_y: y, zona_anatomica: nearest.name }));
  };

  const handleReportInjury = async (e) => {
    e.preventDefault();
    if (!form.id_jugador || !form.tipo_lesion) return;
    setSaving(true);
    setFeedback('');
    setErrorMsg('');
    try {
      const res = await api.post('/fisio/report-injury', form);
      setFeedback(res.data.message);
      setForm((prev) => ({ ...prev, tipo_lesion: '', diagnostico: '' }));
      await loadClinicalOverview();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error enviando reporte al departamento médico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4" /> Comunicación Directa Cuerpo Técnico ↔ Fisioterapia
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
          REPORTAR LESIÓN EN JUEGO / ENTRENAMIENTO Y VER PARTE MÉDICO
        </h2>
        <p className="text-xs text-texto-secundario mt-1">
          Consulta qué jugadores se encuentran lesionados o en readaptación y reporta nuevas molestias en cancha para que el Fisioterapeuta las evalúe y otorgue el alta médica.
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
          <AlertTriangle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario Reporte con Mapa Anatómico */}
        <div className="lg:col-span-5 card-fenix p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-rojo-fuego" /> Indicar Zona Lesionada
            </h3>
            <span className="text-[11px] text-texto-secundario">Clic en el cuerpo</span>
          </div>

          <div
            onClick={handleSvgClick}
            className="relative w-full max-w-[230px] aspect-[3/5] mx-auto bg-[#141414] rounded-xl border border-neutral-800 cursor-crosshair overflow-hidden"
          >
            <svg viewBox="0 0 200 340" className="w-full h-full">
              <circle cx="100" cy="36" r="18" fill="#232323" stroke="#7A001E" strokeWidth="2" />
              <path d="M62 72 Q100 62 138 72 L130 156 Q100 162 70 156 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
              <path d="M62 74 L42 130 L35 178 L46 180 L55 135 L68 90 Z" fill="#232323" stroke="#555" strokeWidth="1.5" />
              <path d="M138 74 L158 130 L165 178 L154 180 L145 135 L132 90 Z" fill="#232323" stroke="#555" strokeWidth="1.5" />
              <path d="M70 156 L98 156 L94 235 L89 306 L74 306 L76 235 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
              <path d="M130 156 L102 156 L106 235 L111 306 L126 306 L124 235 Z" fill="#232323" stroke="#7A001E" strokeWidth="2" />
            </svg>
            <div
              style={{ left: `${form.coord_x}%`, top: `${form.coord_y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white bg-rojo-fuego/80 animate-pulse pointer-events-none"
            />
          </div>

          <form onSubmit={handleReportInjury} className="space-y-2.5 text-xs">
            <select
              className="input-fenix"
              value={form.id_jugador}
              onChange={(e) => setForm({ ...form, id_jugador: e.target.value })}
              required
            >
              <option value="">Seleccionar Atleta</option>
              {players.map((p) => (
                <option key={p.id_jugador} value={p.id_jugador}>
                  {p.nombre} {p.apellido} ({p.categoria_nombre})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="input-fenix"
                value={form.origen_reporte}
                onChange={(e) => setForm({ ...form, origen_reporte: e.target.value })}
              >
                <option value="Entrenamiento">En Entrenamiento</option>
                <option value="Partido">En Partido</option>
              </select>
              <select
                className="input-fenix"
                value={form.gravedad}
                onChange={(e) => setForm({ ...form, gravedad: e.target.value })}
              >
                <option value="Leve">Gravedad: Leve</option>
                <option value="Moderada">Gravedad: Moderada</option>
                <option value="Severa">Gravedad: Severa</option>
              </select>
            </div>

            <input
              type="text"
              className="input-fenix"
              value={form.zona_anatomica}
              onChange={(e) => setForm({ ...form, zona_anatomica: e.target.value })}
              placeholder="Zona lesionada"
              required
            />
            <input
              type="text"
              className="input-fenix"
              value={form.tipo_lesion}
              onChange={(e) => setForm({ ...form, tipo_lesion: e.target.value })}
              placeholder="Síntoma o molestia (ej: Tirón en isquiotibial)"
              required
            />
            <textarea
              rows={2}
              className="input-fenix"
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
              placeholder="¿Cómo ocurrió la jugada para que el fisio la evalúe?"
            />
            <button type="submit" disabled={saving} className="btn-cta w-full text-xs">
              {saving ? 'Enviando Reporte...' : 'Enviar Reporte al Fisioterapeuta'}
            </button>
          </form>
        </div>

        {/* Estado Médico Actual de Jugadores (Solo Lectura para Entrenador) */}
        <div className="lg:col-span-7 card-fenix p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rojo-fuego" />
              PARTE MÉDICO ACTUAL Y SEGUIMIENTO DEL FISIOTERAPEUTA ({injuries.length})
            </h3>
          </div>

          {loading ? (
            <p className="text-xs text-texto-secundario py-8 text-center">Cargando parte médico...</p>
          ) : injuries.length === 0 ? (
            <p className="text-xs text-texto-secundario py-6 text-center">
              Sin lesiones reportadas en la plantilla.
            </p>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {injuries.map((inj) => {
                const isCleared = inj.estado_recuperacion === 'Alta Médica';
                return (
                  <div
                    key={inj.id_lesion}
                    className={`p-3.5 rounded-xl border ${
                      isCleared
                        ? 'bg-green-950/20 border-green-800/50'
                        : 'bg-[#151515] border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-white text-sm">
                          {inj.jugador_nombre} {inj.jugador_apellido}
                          <span className="text-xs text-texto-secundario font-normal ml-2">
                            ({inj.categoria_nombre})
                          </span>
                        </p>
                        <p className="text-xs text-rojo-fuego font-semibold">
                          {inj.zona_anatomica} — {inj.tipo_lesion} ({inj.gravedad})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inj.origen_reporte && (
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                            {inj.origen_reporte}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            isCleared
                              ? 'bg-green-900/70 text-green-300'
                              : inj.estado_recuperacion === 'Readaptación'
                              ? 'bg-amber-900/60 text-amber-300'
                              : 'bg-rojo-fuego/25 text-red-200'
                          }`}
                        >
                          {inj.estado_recuperacion}
                        </span>
                      </div>
                    </div>

                    {inj.diagnostico && (
                      <p className="text-xs text-neutral-300 mt-2">{inj.diagnostico}</p>
                    )}
                    {inj.tratamiento && (
                      <p className="text-xs text-cyan-300 mt-1">
                        <strong>Tratamiento Fisio:</strong> {inj.tratamiento}
                      </p>
                    )}
                    <p className="text-[10px] text-texto-secundario mt-1.5">
                      Reportado: {new Date(inj.fecha_lesion).toLocaleDateString('es-VE')} •{' '}
                      {inj.reportado_por_rol ? `Origen ${inj.reportado_por_rol} • ` : ''}
                      Especialista a cargo: {inj.profesional_cargo || 'Por asignar'}
                    </p>
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
