import React, { useEffect, useState } from 'react';
import {
  Shirt,
  MapPin,
  Lock,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  AlertCircle,
} from 'lucide-react';
import api from '../../utils/api';

function resolveFallbackUniformImg(kitDesignado = '', posicion = '') {
  const isGK =
    String(posicion).toLowerCase().includes('portero') ||
    String(posicion).toLowerCase().includes('arquero');
  const isAway =
    String(kitDesignado).toLowerCase().includes('visitante') ||
    String(kitDesignado).toLowerCase().includes('alternat') ||
    String(kitDesignado).toLowerCase().includes('blanc');
  if (isAway) {
    return isGK
      ? '/assets/uniforme-visitante-portero-kit.png'
      : '/assets/uniforme-visitante-jugador-kit.png';
  }
  return isGK
    ? '/assets/uniforme-local-portero-kit.png'
    : '/assets/uniforme-local-jugador-kit.png';
}

const SIZE_OPTIONS = ['4', '6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function IndumentariaGpsModule({
  activePlayer,
  nextFixture,
  upcomingMatches = [],
  bloqueoConvocatoria,
  onRsvpUpdated,
  onSizesUpdated,
}) {
  const [busyMatchId, setBusyMatchId] = useState(null);
  const [rsvpError, setRsvpError] = useState('');
  const [editingSizes, setEditingSizes] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);
  const [sizesMsg, setSizesMsg] = useState('');
  const [sizesForm, setSizesForm] = useState({
    talla_camiseta: activePlayer?.talla_camiseta || 'M',
    talla_short: activePlayer?.talla_short || 'M',
    talla_zapatos: activePlayer?.talla_zapatos || '',
  });

  useEffect(() => {
    if (activePlayer) {
      setSizesForm({
        talla_camiseta: activePlayer.talla_camiseta || 'M',
        talla_short: activePlayer.talla_short || 'M',
        talla_zapatos: activePlayer.talla_zapatos || '',
      });
    }
  }, [activePlayer]);

  if (!activePlayer) return null;

  const uniformImgSrc =
    nextFixture?.uniforme_img ||
    resolveFallbackUniformImg(nextFixture?.kit_designado, activePlayer.posicion_habitual);

  const handleConfirmMatchAttendance = async (idPartido, estado) => {
    if (!idPartido) return;
    setBusyMatchId(idPartido);
    setRsvpError('');
    try {
      await api.patch(`/players/${activePlayer.id_jugador}/convocatorias/${idPartido}`, {
        estado_convocatoria: estado,
        estado,
      });
      if (onRsvpUpdated) await onRsvpUpdated(estado);
    } catch (err) {
      setRsvpError(
        err.response?.data?.error || 'No se pudo actualizar tu asistencia al partido.'
      );
    } finally {
      setBusyMatchId(null);
    }
  };

  const handleSaveSizes = async (e) => {
    e.preventDefault();
    setSavingSizes(true);
    setSizesMsg('');
    try {
      await api.patch(`/players/${activePlayer.id_jugador}/sizes`, sizesForm);
      setSizesMsg('Tallas de camisa, shorts y zapatos actualizadas.');
      setEditingSizes(false);
      if (onSizesUpdated) await onSizesUpdated();
    } catch (err) {
      setSizesMsg(err.response?.data?.error || 'Error guardando tallas.');
    } finally {
      setSavingSizes(false);
    }
  };

  const otherMatches = (upcomingMatches || []).filter(
    (m) => m && nextFixture && m.id_partido !== nextFixture.id_partido
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* COLUMNA IZQUIERDA: INDUMENTARIA Y TALLAS */}
      <div className="card-fenix p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Shirt className="w-5 h-5 text-rojo-fuego" /> INDUMENTARIA Y TALLAS
          </h3>
          <span className="text-xs font-bold bg-vinotinto px-3 py-1 rounded-full">
            Dorsal #{activePlayer.dorsal || 'S/N'}
          </span>
        </div>

        {nextFixture ? (
          <div className="bg-[#151515] border border-vinotinto/60 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 rounded-xl bg-[#0e0e12] border border-neutral-800 p-2 flex items-center justify-center shrink-0">
              <img
                src={uniformImgSrc}
                alt={nextFixture.kit_designado || 'Uniforme Designado Legión Fénix FC'}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-[11px] uppercase tracking-widest text-rojo-fuego font-bold">
                Camiseta / Uniforme Obligatorio para este Juego
              </p>
              <p className="text-base font-extrabold text-white">{nextFixture.kit_designado}</p>
              <p className="text-xs text-neutral-300">
                Presentarse 45 minutos antes con dorsal #{activePlayer.dorsal || '--'} y medias oficiales.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span>Convocatoria:</span>
                {bloqueoConvocatoria ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rojo-fuego text-white font-bold inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueado por Morosidad
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border font-bold ${
                      nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'bg-green-950 text-green-300 border-green-700'
                        : nextFixture.estado_convocatoria === 'Descartado'
                        ? 'bg-red-950 text-red-300 border-rojo-fuego'
                        : 'bg-neutral-800 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {nextFixture.estado_convocatoria === 'Descartado'
                      ? 'No Puedo Asistir'
                      : nextFixture.estado_convocatoria || 'Por Confirmar'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Tallas del Jugador (Camisa, Shorts y Zapatos) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
              Tallas Registradas del Jugador
            </p>
            <button
              type="button"
              onClick={() => setEditingSizes(!editingSizes)}
              className="text-xs font-bold text-amber-300 hover:text-white inline-flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editingSizes ? 'Cancelar' : 'Actualizar Tallas'}
            </button>
          </div>

          {sizesMsg && (
            <p className="text-xs text-green-300 bg-green-950/50 border border-green-700/60 px-3 py-2 rounded-lg">
              {sizesMsg}
            </p>
          )}

          {editingSizes ? (
            <form
              onSubmit={handleSaveSizes}
              className="bg-[#151515] border border-vinotinto/60 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                    Talla Camisa
                  </label>
                  <select
                    className="input-fenix text-xs"
                    value={sizesForm.talla_camiseta}
                    onChange={(e) => setSizesForm({ ...sizesForm, talla_camiseta: e.target.value })}
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>Talla {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                    Talla Shorts
                  </label>
                  <select
                    className="input-fenix text-xs"
                    value={sizesForm.talla_short}
                    onChange={(e) => setSizesForm({ ...sizesForm, talla_short: e.target.value })}
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>Talla {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                    Talla Zapatos
                  </label>
                  <input
                    type="text"
                    className="input-fenix text-xs"
                    placeholder="Ej: 36 / 41"
                    value={sizesForm.talla_zapatos}
                    onChange={(e) => setSizesForm({ ...sizesForm, talla_zapatos: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingSizes}
                className="btn-cta text-xs py-2 w-full"
              >
                <Save className="w-3.5 h-3.5" />
                {savingSizes ? 'Guardando...' : 'Guardar Tallas del Jugador'}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-[#151515] p-3.5 rounded-lg border border-neutral-800 text-center">
                <p className="text-[11px] text-texto-secundario">Talla Camisa</p>
                <p className="font-bold text-white text-lg mt-0.5">
                  {activePlayer.talla_camiseta || 'N/D'}
                </p>
              </div>
              <div className="bg-[#151515] p-3.5 rounded-lg border border-neutral-800 text-center">
                <p className="text-[11px] text-texto-secundario">Talla Shorts</p>
                <p className="font-bold text-white text-lg mt-0.5">
                  {activePlayer.talla_short || 'N/D'}
                </p>
              </div>
              <div className="bg-[#151515] p-3.5 rounded-lg border border-amber-500/30 text-center">
                <p className="text-[11px] text-texto-secundario">Talla Zapatos</p>
                <p className="font-bold text-amber-300 text-lg mt-0.5">
                  {activePlayer.talla_zapatos || 'N/D'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-texto-secundario space-y-1 pt-1">
          <p>
            <strong className="text-white">Kit Titular:</strong>{' '}
            {activePlayer.kit_titular_color || 'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto'}
          </p>
          <p>
            <strong className="text-white">Kit Alternativo:</strong>{' '}
            {activePlayer.kit_alternativo_color || 'Visitante Blanco con Franja Vinotinto'}
          </p>
          <p>
            <strong className="text-white">Estado de Entrega:</strong>{' '}
            {activePlayer.uniforme_entregado
              ? '✅ Entregado al atleta'
              : '⏳ Pendiente de entrega en utilería'}
          </p>
        </div>
      </div>

      {/* COLUMNA DERECHA: SEDE, GPS Y ASISTENCIA A JUEGOS */}
      <div className="card-fenix p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rojo-fuego" /> SEDE, GPS Y ASISTENCIA AL JUEGO
          </h3>
        </div>

        {rsvpError && (
          <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
            <span>{rsvpError}</span>
          </div>
        )}

        {nextFixture ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-rojo-fuego font-bold uppercase">
                {nextFixture.torneo}
              </span>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">
                Legión Fénix vs {nextFixture.rival}
              </h4>
              <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rojo-fuego" />
                {new Date(nextFixture.fecha_hora).toLocaleString('es-VE', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="bg-[#151515] border border-neutral-800 rounded-xl p-4 space-y-2">
              <p className="font-bold text-white text-sm">{nextFixture.sede}</p>
              <p className="text-xs text-texto-secundario">{nextFixture.direccion_sede}</p>
              {nextFixture.latitud && nextFixture.longitud && (
                <p className="text-[11px] font-mono text-neutral-400">
                  GPS: {nextFixture.latitud}, {nextFixture.longitud}
                </p>
              )}
              <div className="pt-2">
                <a
                  href={
                    nextFixture.gps_url ||
                    `https://maps.google.com/?q=${nextFixture.latitud || 10.480594},${
                      nextFixture.longitud || -66.903606
                    }`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cta text-xs py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Ruta GPS en Google Maps
                </a>
              </div>
            </div>

            {/* Confirmación de Asistencia al Partido */}
            <div className="bg-[#141418] border border-vinotinto/70 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Confirmar Asistencia a este Juego
                </p>
                {nextFixture.estado_convocatoria && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'bg-green-900/70 text-green-300'
                        : 'bg-red-900/70 text-red-200'
                    }`}
                  >
                    {nextFixture.estado_convocatoria === 'Confirmado'
                      ? 'Confirmado ✓'
                      : 'No Puedo Asistir'}
                  </span>
                )}
              </div>
              {bloqueoConvocatoria ? (
                <p className="text-xs text-red-300">
                  La confirmación de asistencia se habilita al regularizar los pagos pendientes en el módulo de Pagos.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyMatchId === nextFixture.id_partido}
                    onClick={() =>
                      handleConfirmMatchAttendance(nextFixture.id_partido, 'Confirmado')
                    }
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                      nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'bg-green-700 border-green-400 text-white shadow'
                        : 'bg-green-950/60 hover:bg-green-700 border-green-700 text-green-200 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {busyMatchId === nextFixture.id_partido
                      ? 'Guardando...'
                      : nextFixture.estado_convocatoria === 'Confirmado'
                      ? 'Asistencia Confirmada ✓'
                      : 'Confirmar Asistencia'}
                  </button>
                  <button
                    type="button"
                    disabled={busyMatchId === nextFixture.id_partido}
                    onClick={() =>
                      handleConfirmMatchAttendance(nextFixture.id_partido, 'Descartado')
                    }
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                      nextFixture.estado_convocatoria === 'Descartado'
                        ? 'bg-rojo-fuego border-white text-white shadow'
                        : 'bg-neutral-900 hover:bg-rojo-fuego border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {nextFixture.estado_convocatoria === 'Descartado'
                      ? 'Inasistencia Avisada'
                      : 'No Puedo Asistir'}
                  </button>
                </div>
              )}
            </div>

            {/* Otros Próximos Partidos */}
            {otherMatches.length > 0 && !bloqueoConvocatoria && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-texto-secundario">
                  Otros Juegos Programados ({otherMatches.length})
                </p>
                <div className="space-y-2">
                  {otherMatches.map((m) => (
                    <div
                      key={m.id_partido}
                      className="bg-[#151515] border border-neutral-800 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-bold text-white">vs {m.rival}</span>
                        <span className="text-[11px] text-amber-300">
                          {new Date(m.fecha_hora).toLocaleDateString('es-VE')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyMatchId === m.id_partido}
                          onClick={() => handleConfirmMatchAttendance(m.id_partido, 'Confirmado')}
                          className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold border transition ${
                            m.estado_convocatoria === 'Confirmado'
                              ? 'bg-green-700 border-green-400 text-white'
                              : 'bg-green-950/50 hover:bg-green-700 border-green-700 text-green-200'
                          }`}
                        >
                          ✓ Confirmar Asistencia
                        </button>
                        <button
                          type="button"
                          disabled={busyMatchId === m.id_partido}
                          onClick={() => handleConfirmMatchAttendance(m.id_partido, 'Descartado')}
                          className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold border transition ${
                            m.estado_convocatoria === 'Descartado'
                              ? 'bg-rojo-fuego border-white text-white'
                              : 'bg-neutral-900 hover:bg-rojo-fuego border-neutral-700 text-neutral-300'
                          }`}
                        >
                          ✕ No Puedo Asistir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-texto-secundario">
            No hay partidos programados próximamente.
          </p>
        )}
      </div>
    </section>
  );
}
