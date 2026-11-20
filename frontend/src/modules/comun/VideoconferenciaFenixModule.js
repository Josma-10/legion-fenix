import React, { useEffect, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Users,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  MessageSquare,
  Shield,
  ExternalLink,
} from 'lucide-react';

const SALAS_PREDEFINIDAS = [
  {
    id: 'charla-tecnica',
    nombre: 'Charla Técnica & Táctica Oficial',
    desc: 'Análisis de rivales, pizarra interactiva y estrategia pre-partido.',
    categoria: 'Entrenadores & Plantel',
    badge: 'Táctica',
  },
  {
    id: 'asamblea-padres',
    nombre: 'Reunión de Padres & Representantes',
    desc: 'Asambleas informativas, viajes, logística de torneos y calendario escolar.',
    categoria: 'Dirección & Representantes',
    badge: 'Institucional',
  },
  {
    id: 'capacitacion-sub20-libre',
    nombre: 'Clase Formativa Sub-20 & Categoría Libre',
    desc: 'Sesión metodológica, preparación física y reglamento competitivo.',
    categoria: 'Juveniles & Adultos',
    badge: 'Formación',
  },
  {
    id: 'salud-nutricion',
    nombre: 'Aula Virtual de Readaptación & Fisio',
    desc: 'Recomendaciones de recuperación, prevención de lesiones y nutrición.',
    categoria: 'Cuerpo Médico & Atletas',
    badge: 'Médico',
  },
];

export default function VideoconferenciaFenixModule({ userRole = 'ENTRENADOR', userName = 'Usuario Fénix' }) {
  const [selectedSala, setSelectedSala] = useState(SALAS_PREDEFINIDAS[0]);
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [isCoachOrAdmin, setIsCoachOrAdmin] = useState(false);

  useEffect(() => {
    setIsCoachOrAdmin(['ADMINISTRADOR', 'ENTRENADOR'].includes(userRole));
  }, [userRole]);

  // Nombre de sala limpio para Jitsi
  const roomDomain = 'meet.jit.si';
  const cleanRoomCode = customRoomName.trim()
    ? `LegionFenix-${customRoomName.replace(/[^a-zA-Z0-9]/g, '')}`
    : `LegionFenix-${selectedSala.id}`;

  const meetUrl = `https://${roomDomain}/${cleanRoomCode}#userInfo.displayName="${encodeURIComponent(
    userName || 'Usuario'
  )}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  const handleCopyLink = () => {
    const inviteLink = `https://${roomDomain}/${cleanRoomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const inviteLink = `https://${roomDomain}/${cleanRoomCode}`;
    const text = `⚽ *Legión Fénix FC — Sala de Videoconferencia*\n\nTe invitamos a conectarte a la reunión: *${
      customRoomName || selectedSala.nombre
    }*\n\n🔗 Entra directamente aquí:\n${inviteLink}\n\n_¡Rendirse Jamás!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera del Módulo */}
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rojo-fuego/20 border border-rojo-fuego text-rojo-fuego text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> Fénix Virtual Hub
            </span>
            <span className="text-xs text-neutral-400 font-semibold">• Videoconferencias Remotas en Vivo</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            SALA VIRTUAL DE REUNIONES & CLASES REMOTAS
          </h2>
          <p className="text-xs text-texto-secundario max-w-2xl">
            Plataforma interactiva para charlas técnicas, videoanálisis táctico proyectado en pantalla, reuniones con representantes y clases para jugadores Sub-20 y Libres directamente desde el navegador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white inline-flex items-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? '¡Enlace Copiado!' : 'Copiar Enlace de Invitación'}
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white inline-flex items-center gap-2 transition shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            Compartir por WhatsApp
          </button>
        </div>
      </div>

      {/* Selector de Salas Temáticas y Estado de Conexión */}
      {!inCall && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-rojo-fuego" /> Selecciona la Sala de Reunión
            </h3>
            {isCoachOrAdmin && (
              <span className="text-[11px] text-amber-300 font-semibold">
                Rol: Anfitrión de Sala ({userRole})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SALAS_PREDEFINIDAS.map((sala) => {
              const active = selectedSala.id === sala.id && !customRoomName;
              return (
                <div
                  key={sala.id}
                  onClick={() => {
                    setSelectedSala(sala);
                    setCustomRoomName('');
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                    active
                      ? 'bg-gradient-to-br from-vinotinto/90 to-[#22070f] border-rojo-fuego text-white shadow-lg'
                      : 'bg-gris-tarjeta border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/40 border border-neutral-700 text-dorado-fenix">
                        {sala.badge}
                      </span>
                      <Video className={`w-4 h-4 ${active ? 'text-rojo-fuego' : 'text-neutral-500'}`} />
                    </div>
                    <h4 className="font-display text-sm font-bold leading-snug">
                      {sala.nombre}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {sala.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">{sala.categoria}</span>
                    <span className={`font-bold ${active ? 'text-amber-300' : 'text-neutral-500'}`}>
                      {active ? 'Seleccionada' : 'Elegir'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opción de Crear Sala Personalizada (Para Entrenadores o Administradores) */}
          {isCoachOrAdmin && (
            <div className="card-fenix p-4 border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-neutral-300">
                  ¿Deseas una sala con código privado para tu categoría?
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Ej: CharlaSub16-Final"
                  className="input-fenix py-1.5 text-xs font-mono"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setInCall(true)}
                  className="btn-vinotinto text-xs py-1.5 shrink-0"
                >
                  Abrir Sala Privada
                </button>
              </div>
            </div>
          )}

          {/* Tarjeta de Entrada a la Reunión */}
          <div className="card-fenix p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Sala Lista para Conectar
              </span>
              <h3 className="font-display text-xl font-bold text-white">
                {customRoomName ? `Sala Privada: ${customRoomName}` : selectedSala.nombre}
              </h3>
              <p className="text-xs text-texto-secundario">
                Ingresas como <strong className="text-white">{userName}</strong> ({userRole}). Podrás compartir pantalla para mostrar pizarras, videos y análisis tácticos en tiempo real.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setInCall(true)}
                className="btn-cta text-sm px-6 py-3 inline-flex items-center gap-2 shadow-fuego font-extrabold"
              >
                <Video className="w-4 h-4" />
                Unirse a la Reunión Ahora
              </button>
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                title="Abrir en pestaña independiente"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de la Videoconferencia Activa */}
      {inCall && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#111116] p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-white">
                  {customRoomName ? customRoomName : selectedSala.nombre}
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400 ml-2">
                  (Conectado como {userName})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                title="Copiar link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Invitar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInCall(false)}
                className="px-4 py-1.5 rounded-lg bg-rojo-fuego hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Finalizar / Salir</span>
              </button>
            </div>
          </div>

          {/* Iframe Seguro con WebRTC Jitsi Meet Embebido */}
          <div className="w-full h-[650px] rounded-xl overflow-hidden border border-neutral-800 bg-black shadow-2xl relative">
            <iframe
              src={meetUrl}
              allow="camera; microphone; display-capture; autoplay; clipboard-write; screen-wake-lock"
              className="w-full h-full border-0"
              title="Sala de Videoconferencia Fénix"
            />
          </div>
        </div>
      )}
    </div>
  );
}
