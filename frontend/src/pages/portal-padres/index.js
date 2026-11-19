import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Shirt,
  HeartPulse,
  UserPlus,
  Lock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Award,
  Clock,
  Inbox,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import PlayerCardModule from '../../modules/jugadores/PlayerCardModule';
import BandejaNotificacionesModule from '../../modules/representantes/BandejaNotificacionesModule';
import PagosSemaforoModule from '../../modules/representantes/PagosSemaforoModule';
import IndumentariaGpsModule from '../../modules/representantes/IndumentariaGpsModule';
import FichaMedicaViewModule from '../../modules/representantes/FichaMedicaViewModule';
import StepperRegistroAtleta from '../../modules/representantes/StepperRegistroAtleta';
import api from '../../utils/api';
import { useAuthGuard } from '../../utils/auth';
import { resolveAssetUrl } from '../../utils/media';

export default function PortalPadres() {
  const { user, checking } = useAuthGuard(['REPRESENTANTE', 'ATLETA']);
  const [activeTab, setActiveTab] = useState('info'); // info | bandeja | pagos | logistica | medica | registro
  const [players, setPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [preselectedTxId, setPreselectedTxId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [busyTrainingId, setBusyTrainingId] = useState(null);
  const [busyQuickMatch, setBusyQuickMatch] = useState(false);

  // Estado para modal de actualización de documento (Cédula / Partida)
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTipo, setDocTipo] = useState('V');
  const [docNum, setDocNum] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState('');

  const handleOpenDocModal = (player) => {
    if (!player) return;
    const raw = (player.dni_cedula || '').trim();
    let tipo = 'V';
    let num = raw;
    if (raw.startsWith('PN:')) {
      tipo = 'PN';
      num = raw.slice(3);
    } else if (raw.startsWith('PN-')) {
      tipo = 'PN';
      num = raw.slice(3);
    } else if (raw.startsWith('E-')) {
      tipo = 'E';
      num = raw.slice(2);
    } else if (raw.startsWith('V-')) {
      tipo = 'V';
      num = raw.slice(2);
    }
    setDocTipo(tipo);
    setDocNum(num);
    setDocError('');
    setDocModalOpen(true);
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    const activeCurrent = dossier?.player || players.find((p) => p.id_jugador === selectedPlayerId);
    if (!activeCurrent) return;
    const cleanNum = (docNum || '').trim().replace(/\s+/g, '');
    if (!cleanNum) {
      setDocError('Ingresa el número de cédula o código de partida de nacimiento.');
      return;
    }
    const finalDoc = docTipo === 'PN' ? `PN:${cleanNum}` : `${docTipo}-${cleanNum}`;
    setDocSubmitting(true);
    setDocError('');
    try {
      await api.patch(`/players/${activeCurrent.id_jugador}/documento`, { dni_cedula: finalDoc });
      setPlayers((prev) =>
        prev.map((p) => (p.id_jugador === activeCurrent.id_jugador ? { ...p, dni_cedula: finalDoc } : p))
      );
      if (dossier?.player) {
        setDossier((prev) => ({
          ...prev,
          player: { ...prev.player, dni_cedula: finalDoc },
        }));
      }
      setFeedbackMsg(`Documento de identidad actualizado exitosamente a: ${finalDoc}`);
      setDocModalOpen(false);
      setTimeout(() => setFeedbackMsg(''), 5000);
    } catch (err) {
      setDocError(err.response?.data?.error || 'No se pudo actualizar el documento.');
    } finally {
      setDocSubmitting(false);
    }
  };

  const loadPlayersAndCategories = useCallback(async () => {
    try {
      const [playersRes, catRes, notifRes] = await Promise.all([
        api.get('/players'),
        api.get('/categorias'),
        api.get('/players/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);
      const list = playersRes.data.players || [];
      setPlayers(list);
      setCategories(catRes.data.categories || []);
      setNotifications(notifRes.data.notifications || []);
      if (list.length > 0) {
        setSelectedPlayerId((prev) => prev || list[0].id_jugador);
      } else {
        setActiveTab('registro');
      }
    } catch (err) {
      console.error('Error cargando atletas:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get('/players/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
      // ignorar si falla refresco secundario
    }
  }, []);

  const loadPlayerDossier = useCallback(async (idJugador) => {
    if (!idJugador) return;
    try {
      const res = await api.get(`/players/${idJugador}`);
      setDossier(res.data);
    } catch (err) {
      console.error('Error cargando expediente:', err.message);
    }
  }, []);

  useEffect(() => {
    if (!checking && user) {
      loadPlayersAndCategories();
    }
  }, [checking, user, loadPlayersAndCategories]);

  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerDossier(selectedPlayerId);
    }
  }, [selectedPlayerId, loadPlayerDossier]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-negro-fondo text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-vinotinto border-t-rojo-fuego rounded-full animate-spin mx-auto" />
          <p className="text-sm text-texto-secundario">Cargando Portal del Atleta y Representantes...</p>
        </div>
      </div>
    );
  }

  const activePlayer = dossier?.player || players.find((p) => p.id_jugador === selectedPlayerId);
  const transactions = dossier?.transactions || [];
  const nextFixture = dossier?.nextFixture;
  const assignedDrills = dossier?.assignedDrills || [];
  const evalHistory = dossier?.evalHistory || [];
  const bloqueoConvocatoria = dossier?.bloqueoConvocatoria || activePlayer?.estado_cuenta === 'Moroso';
  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Portal de Representantes y Atletas Mayores" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1">
        {/* Cabecera y Selector de Atleta */}
        <div className="card-fenix p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-vinotinto">
          <div className="flex items-center gap-4">
            <img
              src={resolveAssetUrl(activePlayer?.foto_url, '/assets/avatar-player.svg')}
              alt="Foto atleta"
              className="w-14 h-14 rounded-xl object-cover border-2 border-vinotinto bg-[#121212]"
            />
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                {activePlayer
                  ? `${activePlayer.nombre} ${activePlayer.apellido}`
                  : 'Registro de Nuevo Atleta'}
              </h1>
              {activePlayer && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-secundario mt-1">
                  <span>{activePlayer.categoria_disciplina ? `${activePlayer.categoria_disciplina} • ` : ''}</span>
                  <span>{activePlayer.categoria_nombre} ({activePlayer.categoria_modalidad})</span>
                  <span>• Dorsal #{activePlayer.dorsal || 'S/N'}</span>
                  <span>• {activePlayer.posicion_habitual}</span>
                  <div className="inline-flex items-center gap-1.5 ml-1 bg-black/60 px-2 py-0.5 rounded border border-neutral-700 text-amber-300 font-mono text-[11px]">
                    <span>Doc: {activePlayer.dni_cedula || 'N/D'}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDocModal(activePlayer)}
                      className="text-xs hover:text-white transition ml-1 text-rojo-fuego hover:underline font-sans font-bold flex items-center gap-0.5"
                      title="Editar Cédula o cambiar Partida de Nacimiento a Cédula"
                    >
                      ✏️ {activePlayer.dni_cedula?.startsWith('PN') ? 'Pasar a Cédula' : 'Modificar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {players.length > 0 && (
              <select
                value={selectedPlayerId || ''}
                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                className="input-fenix w-auto min-w-[210px]"
              >
                {players.map((p) => (
                  <option key={p.id_jugador} value={p.id_jugador}>
                    {p.nombre} {p.apellido} ({p.categoria_nombre})
                  </option>
                ))}
              </select>
            )}
            {activePlayer && <StatusBadge estado={activePlayer.estado_cuenta} />}
          </div>
        </div>

        {/* Banner Alerta Morosidad */}
        {activePlayer && bloqueoConvocatoria && (
          <div className="bg-rojo-fuego/20 border-2 border-rojo-fuego rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-rojo-fuego shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-white text-sm">
                  CONVOCATORIA BLOQUEADA POR MOROSIDAD (SEMÁFORO ROJO)
                </h2>
                <p className="text-xs text-red-200 mt-0.5">
                  El atleta presenta obligaciones vencidas. Sube tu comprobante con &quot;Ya Pagué&quot; en el módulo financiero para habilitar nuevamente su convocatoria oficial.
                </p>
              </div>
            </div>
            <button onClick={() => setActiveTab('pagos')} className="btn-cta text-xs shrink-0">
              Regularizar Pagos
            </button>
          </div>
        )}

        {feedbackMsg && (
          <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Barra de Navegación Modular estilo Gesdep Connect */}
        <div className="border-b border-neutral-800 pb-3">
          <div className="flex flex-wrap items-center gap-2 py-1">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'info'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Award className={`w-4 h-4 shrink-0 ${activeTab === 'info' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Ficha e Info Deportiva</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bandeja')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'bandeja'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Inbox className={`w-4 h-4 shrink-0 ${activeTab === 'bandeja' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Bandeja de Avisos</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rojo-fuego text-white text-[10px] font-extrabold shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pagos')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'pagos'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Wallet className={`w-4 h-4 shrink-0 ${activeTab === 'pagos' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Pagos, QR y Semáforo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logistica')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'logistica'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <Shirt className={`w-4 h-4 shrink-0 ${activeTab === 'logistica' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Indumentaria y GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medica')}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                activeTab === 'medica'
                  ? 'bg-gradient-to-r from-vinotinto via-[#5c0017] to-vinotinto border-rojo-fuego text-white shadow-fenix font-bold'
                  : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-semibold'
              }`}
            >
              <HeartPulse className={`w-4 h-4 shrink-0 ${activeTab === 'medica' ? 'text-rojo-fuego' : 'text-neutral-400'}`} />
              <span className="text-xs whitespace-nowrap">Ficha Médica y Podología</span>
            </button>

            {user?.rol !== 'ATLETA' && (
              <button
                type="button"
                onClick={() => setActiveTab('registro')}
                className={`px-3.5 py-2.5 rounded-xl border text-left transition shrink-0 flex items-center gap-2 ${
                  activeTab === 'registro'
                    ? 'bg-rojo-fuego border-red-500 text-white shadow-fuego font-bold'
                    : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white hover:border-rojo-fuego/60 font-semibold'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="text-xs whitespace-nowrap">Inscribir Nuevo Atleta</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'info' && activePlayer && (
          <div className="space-y-6">
            <PlayerCardModule
              player={activePlayer}
              evaluation={evalHistory[0] || activePlayer}
            />

            {/* Confirmación rápida de Próximo Juego */}
            {nextFixture && (
              <section className="card-fenix p-5 border-l-4 border-l-rojo-fuego space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Próximo Juego Oficial • {nextFixture.torneo}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                      Legión Fénix vs {nextFixture.rival}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      {new Date(nextFixture.fecha_hora).toLocaleString('es-VE', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}{' '}
                      • {nextFixture.sede}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'bg-green-950/70 border-green-500 text-green-300'
                        : nextFixture.estado_convocatoria === 'Descartado'
                        ? 'bg-red-950/70 border-rojo-fuego text-red-200'
                        : 'bg-neutral-900 border-amber-500/60 text-amber-300'
                    }`}
                  >
                    {nextFixture.estado_convocatoria === 'Confirmado'
                      ? 'Asistencia Confirmada ✓'
                      : nextFixture.estado_convocatoria === 'Descartado'
                      ? 'No Puedo Asistir'
                      : 'Pendiente por Confirmar'}
                  </span>
                </div>

                {bloqueoConvocatoria ? (
                  <p className="text-xs text-red-300">
                    Debes regularizar tus pagos en el módulo financiero para confirmar asistencia a este juego.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={busyQuickMatch}
                      onClick={async () => {
                        setBusyQuickMatch(true);
                        try {
                          await api.patch(
                            `/players/${activePlayer.id_jugador}/convocatorias/${nextFixture.id_partido}`,
                            { estado_convocatoria: 'Confirmado', estado: 'Confirmado' }
                          );
                          setFeedbackMsg('Asistencia al juego confirmada exitosamente.');
                          await loadPlayerDossier(selectedPlayerId);
                        } catch (err) {
                          alert(err.response?.data?.error || 'No se pudo confirmar asistencia.');
                        } finally {
                          setBusyQuickMatch(false);
                        }
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                        nextFixture.estado_convocatoria === 'Confirmado'
                          ? 'bg-green-700 border-green-400 text-white shadow'
                          : 'bg-green-950/60 hover:bg-green-700 border-green-700 text-green-200 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {busyQuickMatch
                        ? 'Guardando...'
                        : nextFixture.estado_convocatoria === 'Confirmado'
                        ? 'Asistencia Confirmada ✓'
                        : 'Confirmar Asistencia al Juego'}
                    </button>
                    <button
                      type="button"
                      disabled={busyQuickMatch}
                      onClick={async () => {
                        setBusyQuickMatch(true);
                        try {
                          await api.patch(
                            `/players/${activePlayer.id_jugador}/convocatorias/${nextFixture.id_partido}`,
                            { estado_convocatoria: 'Descartado', estado: 'Descartado' }
                          );
                          setFeedbackMsg('Se notificó al cuerpo técnico que no podrás asistir al juego.');
                          await loadPlayerDossier(selectedPlayerId);
                        } catch (err) {
                          alert(err.response?.data?.error || 'No se pudo registrar tu respuesta.');
                        } finally {
                          setBusyQuickMatch(false);
                        }
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition ${
                        nextFixture.estado_convocatoria === 'Descartado'
                          ? 'bg-rojo-fuego border-white text-white shadow'
                          : 'bg-neutral-900 hover:bg-rojo-fuego border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> No Puedo Asistir
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Entrenamientos y Sesiones Asignadas con Confirmación de Asistencia */}
            <section className="card-fenix p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rojo-fuego" />
                  ENTRENAMIENTOS Y SESIONES ASIGNADAS ({assignedDrills.length})
                </h3>
                <span className="text-[11px] text-texto-secundario">
                  Confirma si asistirás o avisa si no puedes asistir
                </span>
              </div>
              {assignedDrills.length === 0 ? (
                <p className="text-xs text-texto-secundario">
                  No hay sesiones de entrenamiento agendadas para los próximos días.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {assignedDrills.map((d) => {
                    const isConfirmed = d.estado_asistencia_jugador === 'Confirmado';
                    const isDeclined = d.estado_asistencia_jugador === 'No_Asiste';
                    const isBusy = busyTrainingId === d.id_trabajo;

                    const respondTraining = async (estado) => {
                      setBusyTrainingId(d.id_trabajo);
                      try {
                        await api.patch(
                          `/players/${activePlayer.id_jugador}/entrenamientos/${d.id_trabajo}`,
                          { estado }
                        );
                        setFeedbackMsg(
                          estado === 'Confirmado'
                            ? `Asistencia confirmada para el entrenamiento "${d.titulo}".`
                            : `Se avisó inasistencia al entrenamiento "${d.titulo}".`
                        );
                        await loadPlayerDossier(selectedPlayerId);
                      } catch (err) {
                        alert(err.response?.data?.error || 'No se pudo registrar tu asistencia.');
                      } finally {
                        setBusyTrainingId(null);
                      }
                    };

                    return (
                      <div
                        key={d.id_trabajo}
                        className="bg-[#151515] border border-neutral-800 rounded-xl p-4 text-xs space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-sm">{d.titulo}</span>
                            <span className="px-2 py-0.5 rounded bg-vinotinto/40 border border-vinotinto text-[10px] font-bold text-white shrink-0">
                              {d.rol_autor}
                            </span>
                          </div>
                          <p className="text-neutral-300">{d.descripcion_escrita}</p>
                          <p className="text-[11px] text-amber-300 font-semibold">
                            {String(d.fecha).slice(0, 10)} • {String(d.hora_inicio).slice(0, 5)}–
                            {String(d.hora_fin).slice(0, 5)} • {d.espacio_cancha} ({d.cuadrante})
                          </p>
                        </div>

                        <div className="pt-2 border-t border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-texto-secundario">Tu estado:</span>
                            <span
                              className={`font-bold ${
                                isConfirmed
                                  ? 'text-green-400'
                                  : isDeclined
                                  ? 'text-rojo-fuego'
                                  : 'text-amber-300'
                              }`}
                            >
                              {isConfirmed
                                ? '✓ Confirmado'
                                : isDeclined
                                ? '✕ No puedo asistir'
                                : 'Por confirmar'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => respondTraining('Confirmado')}
                              className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 border transition ${
                                isConfirmed
                                  ? 'bg-green-700 border-green-400 text-white'
                                  : 'bg-green-950/60 hover:bg-green-700 border-green-700 text-green-200 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isBusy ? '...' : isConfirmed ? 'Confirmado ✓' : 'Confirmar Asistencia'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => respondTraining('No_Asiste')}
                              className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 border transition ${
                                isDeclined
                                  ? 'bg-rojo-fuego border-white text-white'
                                  : 'bg-neutral-900 hover:bg-rojo-fuego border-neutral-700 text-neutral-300 hover:text-white'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {isDeclined ? 'No Asistiré' : 'No Puedo Asistir'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'bandeja' && (
          <BandejaNotificacionesModule
            notifications={notifications}
            onMarkRead={loadNotifications}
            onConfirmAttendance={async (estado) => {
              setFeedbackMsg(
                estado === 'Confirmado'
                  ? 'Asistencia al juego confirmada exitosamente.'
                  : 'Se notificó que no podrás asistir al juego.'
              );
              await Promise.all([loadNotifications(), loadPlayerDossier(selectedPlayerId)]);
            }}
            onGoToPayTx={(txId) => {
              setPreselectedTxId(txId || null);
              setActiveTab('pagos');
            }}
          />
        )}

        {activeTab === 'pagos' && (
          <PagosSemaforoModule
            activePlayer={activePlayer}
            transactions={transactions}
            bcvInitial={dossier?.bcv || null}
            preselectedTxId={preselectedTxId}
            onReceiptUploaded={async () => {
              setFeedbackMsg('Comprobante enviado correctamente. En revisión administrativa.');
              await loadPlayerDossier(selectedPlayerId);
            }}
          />
        )}

        {activeTab === 'logistica' && (
          <IndumentariaGpsModule
            activePlayer={activePlayer}
            nextFixture={nextFixture}
            upcomingMatches={dossier?.upcomingMatches || []}
            bloqueoConvocatoria={bloqueoConvocatoria}
            onRsvpUpdated={async (estado) => {
              setFeedbackMsg(
                estado === 'Confirmado'
                  ? 'Asistencia al juego confirmada exitosamente.'
                  : 'Se registró que no podrás asistir al juego.'
              );
              await loadPlayerDossier(selectedPlayerId);
            }}
            onSizesUpdated={async () => {
              setFeedbackMsg('Tallas de indumentaria y calzado del jugador actualizadas.');
              await loadPlayerDossier(selectedPlayerId);
            }}
          />
        )}

        {activeTab === 'medica' && <FichaMedicaViewModule activePlayer={activePlayer} />}

        {activeTab === 'registro' && user?.rol !== 'ATLETA' && (
          <StepperRegistroAtleta
            user={user}
            categories={categories}
            onRegistered={async (newPlayer) => {
              setFeedbackMsg(`¡Atleta ${newPlayer.nombre} ${newPlayer.apellido} inscrito oficialmente!`);
              await loadPlayersAndCategories();
              setSelectedPlayerId(newPlayer.id_jugador);
              setActiveTab('pagos');
            }}
          />
        )}

        {/* Modal Modificar Documento / Cédula */}
        {docModalOpen && activePlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="card-fenix w-full max-w-md p-6 border-l-4 border-l-amber-400 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400">🪪</span> Actualizar Documento de Identidad
                </h3>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="text-neutral-400 hover:text-white text-lg font-bold px-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-texto-secundario">
                Actualiza el documento oficial de <strong>{activePlayer.nombre} {activePlayer.apellido}</strong>. Si el menor ya obtuvo su Cédula, puedes cambiar de Partida de Nacimiento (PN) a Cédula (V / E).
              </p>

              {docError && (
                <div className="bg-red-950/60 border border-red-500/60 text-red-200 p-2.5 rounded text-xs">
                  {docError}
                </div>
              )}

              <form onSubmit={handleSaveDoc} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-texto-secundario mb-1">
                    Tipo y Número de Documento*
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="input-fenix w-32 shrink-0 font-bold text-xs"
                      value={docTipo}
                      onChange={(e) => setDocTipo(e.target.value)}
                    >
                      <option value="V">V- (Ven.)</option>
                      <option value="E">E- (Ext.)</option>
                      <option value="PN">PN: (Partida)</option>
                    </select>
                    <input
                      type="text"
                      className="input-fenix flex-1 min-w-0 text-xs font-mono font-bold"
                      value={docNum}
                      onChange={(e) => setDocNum(e.target.value.replace(/\s+/g, ''))}
                      placeholder={
                        docTipo === 'PN'
                          ? 'Nº Acta o Código Partida'
                          : docTipo === 'E'
                          ? 'Ej: 84123456'
                          : 'Ej: 32123456'
                      }
                      required
                    />
                  </div>
                  {docTipo === 'PN' && (
                    <p className="text-[10px] text-amber-400/90 mt-1">
                      *Código de Partida de Nacimiento para menores de 9 años sin cédula.
                    </p>
                  )}
                  {docTipo !== 'PN' && (
                    <p className="text-[10px] text-green-400 mt-1">
                      *Cédula de Identidad Oficial (Cédula venezolana o extranjera).
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setDocModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300"
                    disabled={docSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-cta text-xs font-bold"
                    disabled={docSubmitting}
                  >
                    {docSubmitting ? 'Guardando...' : 'Guardar Documento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {players.length === 0 && activeTab !== 'registro' && (
        <div className="fixed bottom-4 right-4 bg-vinotinto text-white px-4 py-3 rounded-lg text-xs flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4" /> Registra tu primer atleta para ver su ficha y semáforo de pagos.
        </div>
      )}
    </div>
  );
}
