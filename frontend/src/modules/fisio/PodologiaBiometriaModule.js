import React, { useEffect, useState } from 'react';
import { HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function PodologiaBiometriaModule({ players = [], onUpdated }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    players[0] ? String(players[0].id_jugador) : ''
  );
  const [form, setForm] = useState({
    grupo_sanguineo: 'O+',
    evaluacion_podologica: '',
    peso_kg: '',
    altura_m: '',
    alergias: '',
    condiciones_cardiacas: '',
    seguro_medico_poliza: '',
    observaciones_fisio: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(String(players[0].id_jugador));
    }
  }, [players, selectedPlayerId]);

  useEffect(() => {
    const player = players.find((p) => String(p.id_jugador) === String(selectedPlayerId));
    if (!player) return;
    setForm({
      grupo_sanguineo: player.grupo_sanguineo || 'O+',
      evaluacion_podologica: player.evaluacion_podologica || 'Pisada Neutra - Arco Normal',
      peso_kg: player.peso_kg || '',
      altura_m: player.altura_m || '',
      alergias: player.alergias || 'Ninguna',
      condiciones_cardiacas: player.condiciones_cardiacas || 'Sin alteraciones',
      seguro_medico_poliza: player.seguro_medico_poliza || '',
      observaciones_fisio: player.observaciones_fisio || '',
    });
  }, [selectedPlayerId, players]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    setSaving(true);
    setFeedback('');
    setError('');
    try {
      await api.patch(`/fisio/medical-records/${selectedPlayerId}`, form);
      setFeedback('Evaluación biométrica, podológica y notas clínicas actualizadas correctamente.');
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la ficha médica.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-fenix p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rojo-fuego" />
            EVALUACIÓN PODOLÓGICA, BIOMETRÍA Y OBSERVACIONES
          </h3>
          <p className="text-xs text-texto-secundario">
            Actualiza la ficha clínica del atleta directamente en su expediente compartido con padres y cuerpo técnico.
          </p>
        </div>

        <select
          className="input-fenix w-auto min-w-[260px]"
          value={selectedPlayerId}
          onChange={(e) => {
            setSelectedPlayerId(e.target.value);
            setFeedback('');
            setError('');
          }}
        >
          {players.map((p) => (
            <option key={p.id_jugador} value={p.id_jugador}>
              {p.nombre} {p.apellido} ({p.categoria_nombre} • {p.categoria_modalidad})
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" /> {feedback}
        </div>
      )}
      {error && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Grupo Sanguíneo</label>
            <select
              className="input-fenix"
              value={form.grupo_sanguineo}
              onChange={(e) => setForm({ ...form, grupo_sanguineo: e.target.value })}
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Evaluación Podológica</label>
            <input
              type="text"
              className="input-fenix"
              value={form.evaluacion_podologica}
              onChange={(e) => setForm({ ...form, evaluacion_podologica: e.target.value })}
              placeholder="Pisada Neutra / Pronador..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input-fenix"
              value={form.peso_kg}
              onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Estatura (m)</label>
            <input
              type="number"
              step="0.01"
              className="input-fenix"
              value={form.altura_m}
              onChange={(e) => setForm({ ...form, altura_m: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Alergias</label>
            <input
              type="text"
              className="input-fenix"
              value={form.alergias}
              onChange={(e) => setForm({ ...form, alergias: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Condiciones Cardíacas</label>
            <input
              type="text"
              className="input-fenix"
              value={form.condiciones_cardiacas}
              onChange={(e) => setForm({ ...form, condiciones_cardiacas: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">Póliza Seguro Médico</label>
            <input
              type="text"
              className="input-fenix"
              value={form.seguro_medico_poliza}
              onChange={(e) => setForm({ ...form, seguro_medico_poliza: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Observaciones y Recomendaciones del Fisioterapeuta
          </label>
          <textarea
            rows={3}
            className="input-fenix"
            placeholder="Ej: Recomendar trabajo propioceptivo de tobillo antes de sesiones de alta intensidad..."
            value={form.observaciones_fisio}
            onChange={(e) => setForm({ ...form, observaciones_fisio: e.target.value })}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-cta text-xs">
            {saving ? 'Guardando Ficha...' : 'Guardar Evaluación Clínica'}
          </button>
        </div>
      </form>
    </div>
  );
}
