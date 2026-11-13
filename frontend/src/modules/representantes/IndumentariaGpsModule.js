import React, { useState } from 'react';
import {
  Shirt,
  MapPin,
  Lock,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../../utils/api';

function resolveFallbackUniformImg(kitDesignado = '', posicion = '') {
  const isGK = String(posicion).toLowerCase().includes('portero') || String(posicion).toLowerCase().includes('arquero');
  const isAway =
    String(kitDesignado).toLowerCase().includes('visitante') ||
    String(kitDesignado).toLowerCase().includes('alternat') ||
    String(kitDesignado).toLowerCase().includes('blanc');
  if (isAway) {
    return isGK ? '/assets/uniforme-visitante-portero-kit.png' : '/assets/uniforme-visitante-jugador-kit.png';
  }
  return isGK ? '/assets/uniforme-local-portero-kit.png' : '/assets/uniforme-local-jugador-kit.png';
}

export default function IndumentariaGpsModule({
  activePlayer,
  nextFixture,
  bloqueoConvocatoria,
  onRsvpUpdated,
}) {
  const [busyRsvp, setBusyRsvp] = useState(false);

  if (!activePlayer) return null;

  const uniformImgSrc =
    nextFixture?.uniforme_img ||
    resolveFallbackUniformImg(nextFixture?.kit_designado, activePlayer.posicion_habitual);

  const handleConfirmMatchAttendance = async (estado) => {
    if (!nextFixture?.id_partido) return;
    setBusyRsvp(true);
    try {
      await api.patch(
        `/players/${activePlayer.id_jugador}/convocatorias/${nextFixture.id_partido}`,
        { estado }
      );
      if (onRsvpUpdated) await onRsvpUpdated(estado);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo actualizar tu asistencia al partido.');
    } finally {
      setBusyRsvp(false);
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card-fenix p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Shirt className="w-5 h-5 text-rojo-fuego" /> INDUMENTARIA Y CAMISA DEL JUEGO
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
                  <span className="px-2.5 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-700 font-bold">
                    {nextFixture.estado_convocatoria || 'Convocado / Por Confirmar'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#151515] p-3.5 rounded-lg border border-neutral-800">
            <p className="text-xs text-texto-secundario">Talla Camiseta</p>
            <p className="font-bold text-white text-lg">{activePlayer.talla_camiseta || 'N/D'}</p>
          </div>
          <div className="bg-[#151515] p-3.5 rounded-lg border border-neutral-800">
            <p className="text-xs text-texto-secundario">Talla Short</p>
            <p className="font-bold text-white text-lg">{activePlayer.talla_short || 'N/D'}</p>
          </div>
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
            {activePlayer.uniforme_entregado ? '✅ Entregado al atleta' : '⏳ Pendiente de entrega en utilería'}
          </p>
        </div>
      </div>

      <div className="card-fenix p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rojo-fuego" /> SEDE, GPS Y ASISTENCIA AL JUEGO
          </h3>
        </div>

        {nextFixture ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-rojo-fuego font-bold uppercase">{nextFixture.torneo}</span>
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
                    `https://maps.google.com/?q=${nextFixture.latitud || 10.480594},${nextFixture.longitud || -66.903606}`
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
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                Confirmar Asistencia a este Juego
              </p>
              {bloqueoConvocatoria ? (
                <p className="text-xs text-red-300">
                  La confirmación de asistencia se habilita al regularizar los pagos pendientes en el módulo de Pagos.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyRsvp}
                    onClick={() => handleConfirmMatchAttendance('Confirmado')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                      nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'bg-green-700 border-green-400 text-white'
                        : 'bg-green-950/60 hover:bg-green-700 border-green-700 text-green-200 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {nextFixture.estado_convocatoria === 'Confirmado'
                      ? 'Asistencia Confirmada ✓'
                      : 'Confirmar Asistencia'}
                  </button>
                  <button
                    type="button"
                    disabled={busyRsvp}
                    onClick={() => handleConfirmMatchAttendance('Descartado')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                      nextFixture.estado_convocatoria === 'Descartado'
                        ? 'bg-rojo-fuego border-white text-white'
                        : 'bg-neutral-900 hover:bg-rojo-fuego border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> No Puedo Asistir
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-texto-secundario">No hay partidos programados próximamente.</p>
        )}
      </div>
    </section>
  );
}
