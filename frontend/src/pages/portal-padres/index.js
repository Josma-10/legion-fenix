import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Shirt,
  HeartPulse,
  UserPlus,
  Lock,
  CheckCircle2,
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
                <p className="text-xs text-texto-secundario">
                  {activePlayer.categoria_disciplina ? `${activePlayer.categoria_disciplina} • ` : ''}
                  {activePlayer.categoria_nombre} ({activePlayer.categoria_modalidad}) • Dorsal #{activePlayer.dorsal || 'S/N'} • {activePlayer.posicion_habitual}
                </p>
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

        {/* Submódulos del Portal */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'info' ? 'bg-vinotinto text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> Información del Jugador
          </button>
          <button
            onClick={() => setActiveTab('bandeja')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'bandeja' ? 'bg-vinotinto text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" /> Bandeja de Entrada
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rojo-fuego text-white text-[10px] font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'pagos' ? 'bg-vinotinto text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" /> Pagos, QR y Semáforo
          </button>
          <button
            onClick={() => setActiveTab('logistica')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'logistica' ? 'bg-vinotinto text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Shirt className="w-4 h-4" /> Indumentaria y GPS
          </button>
          <button
            onClick={() => setActiveTab('medica')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'medica' ? 'bg-vinotinto text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4" /> Ficha Médica y Podología
          </button>
          {user?.rol !== 'ATLETA' && (
            <button
              onClick={() => setActiveTab('registro')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                activeTab === 'registro' ? 'bg-rojo-fuego text-white' : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Inscribir Atleta (5 Etapas)
            </button>
          )}
        </div>

        {activeTab === 'info' && activePlayer && (
          <div className="space-y-6">
            <PlayerCardModule
              player={activePlayer}
              evaluation={evalHistory[0] || activePlayer}
            />

            <section className="card-fenix p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rojo-fuego" />
                  SESIONES Y TRABAJOS ASIGNADOS ({assignedDrills.length})
                </h3>
                <span className="text-[11px] text-texto-secundario">
                  Planificados por Entrenadores y Fisioterapia
                </span>
              </div>
              {assignedDrills.length === 0 ? (
                <p className="text-xs text-texto-secundario">
                  No hay sesiones específicas agendadas para los próximos días.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedDrills.map((d) => (
                    <div
                      key={d.id_trabajo}
                      className="bg-[#151515] border border-neutral-800 rounded-xl p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{d.titulo}</span>
                        <span className="px-2 py-0.5 rounded bg-vinotinto/40 border border-vinotinto text-[10px] font-bold text-white">
                          {d.rol_autor}
                        </span>
                      </div>
                      <p className="text-neutral-300">{d.descripcion_escrita}</p>
                      <p className="text-[11px] text-amber-300 font-semibold">
                        {String(d.fecha).slice(0, 10)} • {String(d.hora_inicio).slice(0, 5)}–
                        {String(d.hora_fin).slice(0, 5)} • {d.espacio_cancha} ({d.cuadrante})
                      </p>
                    </div>
                  ))}
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
              setFeedbackMsg(`Asistencia al juego registrada como "${estado}".`);
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
            bloqueoConvocatoria={bloqueoConvocatoria}
            onRsvpUpdated={async (estado) => {
              setFeedbackMsg(`Confirmación de juego actualizada: ${estado}.`);
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
      </main>

      {players.length === 0 && activeTab !== 'registro' && (
        <div className="fixed bottom-4 right-4 bg-vinotinto text-white px-4 py-3 rounded-lg text-xs flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4" /> Registra tu primer atleta para ver su ficha y semáforo de pagos.
        </div>
      )}
    </div>
  );
}
