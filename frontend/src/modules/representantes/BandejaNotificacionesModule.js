import React, { useState } from 'react';
import {
  Inbox,
  Wallet,
  Calendar,
  CheckCircle2,
  XCircle,
  Mail,
  MessageCircle,
  Check,
  Shirt,
  MapPin,
} from 'lucide-react';
import api from '../../utils/api';

function channelStatusBadge(label, status) {
  if (status === 'Enviado') {
    return (
      <span className="px-2 py-0.5 rounded bg-green-950/70 border border-green-600 text-green-300 text-[10px] font-bold">
        {label}: Enviado
      </span>
    );
  }
  if (status === 'Pendiente_Config') {
    return (
      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/70 text-amber-200 text-[10px] font-semibold">
        {label}: Sin config. servidor
      </span>
    );
  }
  if (status === 'Error') {
    return (
      <span className="px-2 py-0.5 rounded bg-red-950/70 border border-rojo-fuego text-red-200 text-[10px] font-bold">
        {label}: Error envío
      </span>
    );
  }
  return null;
}

export default function BandejaNotificacionesModule({
  notifications = [],
  onMarkRead,
  onConfirmAttendance,
  onGoToPayTx,
}) {
  const [filterType, setFilterType] = useState('TODOS'); // TODOS | PAGO_PROXIMO | CONVOCATORIA
  const [busyId, setBusyId] = useState(null);

  const visible = notifications.filter((n) =>
    filterType === 'TODOS' ? true : n.tipo === filterType
  );

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const handleMarkAsRead = async (id) => {
    setBusyId(`read-${id}`);
    try {
      await api.patch(`/players/notifications/${id}/read`);
      if (onMarkRead) await onMarkRead(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleRsvp = async (notif, estado) => {
    const idJugador = notif.id_jugador;
    const idPartido = notif.metadata_json?.id_partido;
    if (!idJugador || !idPartido) return;
    setBusyId(`rsvp-${notif.id_notificacion}`);
    try {
      await api.patch(`/players/${idJugador}/convocatorias/${idPartido}`, { estado });
      if (!notif.leida) {
        await api.patch(`/players/notifications/${notif.id_notificacion}/read`).catch(() => {});
      }
      if (onConfirmAttendance) await onConfirmAttendance(estado, notif);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="card-fenix p-5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-rojo-fuego">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Inbox className="w-4 h-4" /> Bandeja de Entrada Automática ({unreadCount} sin leer)
          </span>
          <h2 className="font-display text-2xl font-extrabold text-white mt-0.5">
            AVISOS DE PAGOS (5 DÍAS ANTES) Y CONVOCATORIAS
          </h2>
          <p className="text-xs text-texto-secundario">
            Recibe recordatorios 5 días antes de cada mensualidad, arbitraje o inscripción, más confirmaciones de partido con el uniforme obligatorio.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { key: 'TODOS', label: `Todos (${notifications.length})` },
            { key: 'PAGO_PROXIMO', label: 'Pagos Pendientes' },
            { key: 'CONVOCATORIA', label: 'Convocatorias de Juego' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                filterType === f.key
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#151515] border-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card-fenix p-8 text-center text-sm text-texto-secundario">
          No tienes mensajes en esta bandeja por el momento.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((n) => {
            const isPayment = n.tipo === 'PAGO_PROXIMO';
            const isConv = n.tipo === 'CONVOCATORIA';
            const meta = n.metadata_json || {};

            return (
              <div
                key={n.id_notificacion}
                className={`card-fenix p-5 border-l-4 space-y-3 transition ${
                  isConv ? 'border-l-emerald-400' : 'border-l-amber-400'
                } ${!n.leida ? 'ring-1 ring-rojo-fuego/60 bg-[#171417]' : 'opacity-90'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      {!n.leida && (
                        <span className="px-2 py-0.5 rounded-full bg-rojo-fuego text-white font-extrabold uppercase">
                          Nuevo
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold">
                        {isConv ? '⚽ Convocatoria Oficial' : '💳 Recordatorio de Pago (5 días antes)'}
                      </span>
                      {n.jugador_nombre && (
                        <span className="text-amber-300 font-bold">
                          Atleta: #{n.dorsal || '--'} {n.jugador_nombre} {n.jugador_apellido}
                        </span>
                      )}
                      {channelStatusBadge(<><Mail className="w-3 h-3 inline mr-0.5" />Email</>, n.email_estado)}
                      {channelStatusBadge(<><MessageCircle className="w-3 h-3 inline mr-0.5" />WhatsApp</>, n.whatsapp_estado)}
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">{n.titulo}</h3>
                  </div>

                  <span className="text-[11px] text-texto-secundario">
                    {new Date(n.fecha_creacion).toLocaleString('es-VE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                  {n.mensaje}
                </p>

                {/* Detalle visual de Convocatoria (Uniforme + Sede + Botones Confirmar) */}
                {isConv && (
                  <div className="bg-[#121215] border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {meta.uniforme_img && (
                        <img
                          src={meta.uniforme_img}
                          alt={meta.uniforme || 'Uniforme Convocado'}
                          className="w-16 h-16 rounded-lg object-contain bg-[#0c0c0f] border border-vinotinto/60 p-1 shrink-0"
                        />
                      )}
                      <div className="text-xs space-y-1">
                        {meta.uniforme && (
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <Shirt className="w-3.5 h-3.5 text-rojo-fuego" /> Uniforme:{' '}
                            <span className="text-amber-300">{meta.uniforme}</span>
                          </p>
                        )}
                        {meta.sede && (
                          <p className="text-neutral-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {meta.sede}
                          </p>
                        )}
                        {meta.fecha_hora && (
                          <p className="text-texto-secundario flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />{' '}
                            {new Date(meta.fecha_hora).toLocaleString('es-VE', {
                              dateStyle: 'full',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {meta.id_partido && n.id_jugador && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busyId === `rsvp-${n.id_notificacion}`}
                          onClick={() => handleRsvp(n, 'Confirmado')}
                          className="px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirmar Asistencia
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `rsvp-${n.id_notificacion}`}
                          onClick={() => handleRsvp(n, 'Descartado')}
                          className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-rojo-fuego text-neutral-200 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-4 h-4" /> No Puedo Asistir
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones de Pago + Marcar como Leído */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {isPayment && onGoToPayTx && (
                      <button
                        type="button"
                        onClick={() => onGoToPayTx(meta.id_transaccion || n.id_transaccion)}
                        className="btn-cta text-xs py-1.5 px-4"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Ya Pagué / Ir a Reportar Pago
                      </button>
                    )}
                  </div>

                  {!n.leida && (
                    <button
                      type="button"
                      disabled={busyId === `read-${n.id_notificacion}`}
                      onClick={() => handleMarkAsRead(n.id_notificacion)}
                      className="text-xs font-bold text-neutral-300 hover:text-white inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-green-400" /> Marcar como leído
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
