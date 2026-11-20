import React, { useEffect, useState } from 'react';
import {
  Camera,
  Video,
  Play,
  X,
  Plus,
  Share2,
  Instagram,
  Youtube,
  MessageCircle,
  Globe,
  Calendar,
  Upload,
  Radio,
  ExternalLink,
  Flame,
  Settings,
  Tv,
} from 'lucide-react';
import api from '../../utils/api';

function extractYoutubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
  const match = String(url).match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }
  return null;
}

const SOCIAL_CHANNELS = [
  {
    name: 'Instagram Oficial',
    handle: '@legionfenixfc',
    desc: 'Galería de partidos, entrenamientos y goles de la jornada.',
    href: 'https://www.instagram.com/legionfenixfc/',
    colorClass: 'border-pink-500/40 hover:border-pink-400 bg-gradient-to-br from-pink-950/30 to-[#141414]',
    badgeClass: 'text-pink-400',
    icon: Instagram,
  },
  {
    name: 'TikTok Legión Fénix',
    handle: '@legionfenixfc',
    desc: 'Transmisiones en vivo, jugadas en cancha y tras bastidores.',
    href: 'https://www.tiktok.com/@legionfenixfc',
    colorClass: 'border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-br from-cyan-950/30 to-[#141414]',
    badgeClass: 'text-cyan-400',
    icon: Share2,
  },
  {
    name: 'YouTube Oficial',
    handle: 'Legión Fénix FC TV',
    desc: 'Partidos en vivo, resúmenes completos y transmisiones HD.',
    href: 'https://www.youtube.com/@LegionFenixFC',
    colorClass: 'border-red-500/40 hover:border-red-400 bg-gradient-to-br from-red-950/30 to-[#141414]',
    badgeClass: 'text-rojo-fuego',
    icon: Youtube,
  },
  {
    name: 'WhatsApp Comunidad',
    handle: '+58 412-9688713',
    desc: 'Canal directo para hinchada, pruebas de talento y atención al club.',
    href: 'https://wa.me/584129688713?text=Hola%20Legi%C3%B3n%20F%C3%A9nix%20FC%2C%20quiero%20informaci%C3%B3n%20del%20club.',
    colorClass: 'border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-br from-emerald-950/30 to-[#141414]',
    badgeClass: 'text-emerald-400',
    icon: MessageCircle,
  },
];

export default function HinchadaMediaSocialModule({ gallery = [], onMediaCreated }) {
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [eventoFilter, setEventoFilter] = useState('Todos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [canPublish, setCanPublish] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Estado de Transmisión en Vivo (TikTok Live / YouTube Live)
  const [liveConfig, setLiveConfig] = useState({
    active: true,
    titulo: 'Partido Oficial en Directo: Legión Fénix Sub-16 vs UCV FC',
    categoria: 'Sub-16 & Juveniles',
    plataforma: 'TikTok',
    url: 'https://www.tiktok.com/@legionfenixfc/live',
    estado: 'En Vivo',
  });
  const [showLiveSettings, setShowLiveSettings] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Video',
    categoria_evento: 'Juego',
    media_url: '',
    fecha_evento: new Date().toISOString().slice(0, 10),
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('legion_fenix_user') : null;
      if (raw) {
        const user = JSON.parse(raw);
        if (['ADMINISTRADOR', 'ENTRENADOR', 'ANALISTA_ADMIN'].includes(user?.rol)) {
          setCanPublish(true);
        }
      }
      const savedLive = localStorage.getItem('legion_live_config');
      if (savedLive) {
        setLiveConfig(JSON.parse(savedLive));
      }
    } catch {
      setCanPublish(false);
    }
  }, []);

  const handleSaveLiveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('legion_live_config', JSON.stringify(liveConfig));
    setShowLiveSettings(false);
    setFeedback('Configuración del en vivo actualizada.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const filteredGallery = gallery.filter((item) => {
    const okTipo = tipoFilter === 'Todos' || item.tipo === tipoFilter;
    const okEvento = eventoFilter === 'Todos' || item.categoria_evento === eventoFilter;
    return okTipo && okEvento;
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('descripcion', form.descripcion);
      formData.append('tipo', form.tipo);
      formData.append('categoria_evento', form.categoria_evento);
      formData.append('fecha_evento', form.fecha_evento);
      if (file) {
        formData.append('archivo', file);
      } else if (form.media_url.trim()) {
        formData.append('media_url', form.media_url.trim());
      }

      const res = await api.post('/public/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback(res.data?.message || 'Material publicado en la galería de la hinchada.');
      setForm({
        titulo: '',
        descripcion: '',
        tipo: 'Video',
        categoria_evento: 'Juego',
        media_url: '',
        fecha_evento: new Date().toISOString().slice(0, 10),
      });
      setFile(null);
      setShowForm(false);
      if (onMediaCreated) onMediaCreated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo publicar el contenido multimedia.');
    } finally {
      setSubmitting(false);
    }
  };

  const youtubeEmbed = selectedItem?.tipo === 'Video' ? extractYoutubeEmbedUrl(selectedItem.media_url) : null;
  const liveYoutubeEmbed = extractYoutubeEmbedUrl(liveConfig.url);

  return (
    <>
      <section id="hinchada" className="space-y-8 animate-fadeIn">
        {/* Encabezado Hinchada */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Galería de La Hinchada y Comunidad
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
              FOTOS Y VIDEOS: JUEGOS Y ENTRENAMIENTOS
            </h2>
            <p className="text-xs sm:text-sm text-texto-secundario mt-1 max-w-2xl">
              Revive las mejores postales y resúmenes audiovisuales de nuestros partidos oficiales y sesiones formativas, y conecta con las redes oficiales de Legión Fénix FC.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {canPublish && (
              <>
                <button
                  type="button"
                  onClick={() => setShowLiveSettings((v) => !v)}
                  className="px-3.5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white inline-flex items-center gap-2 transition"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  Configurar En Vivo
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="btn-cta text-xs py-2.5 px-4 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {showForm ? 'Cerrar Formulario' : 'Cargar Foto / Video / Jugada'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* BANNER OFICIAL DE TRANSMISIÓN EN VIVO (FÉNIX TV LIVE) */}
        {liveConfig.active && (
          <div className="card-fenix overflow-hidden border-2 border-rojo-fuego shadow-2xl relative">
            <div className="bg-gradient-to-r from-vinotinto via-[#5c0017] to-negro-tarjeta p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    🔴 EN VIVO AHORA
                  </span>
                  <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                    Fénix TV • {liveConfig.plataforma}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                  {liveConfig.titulo}
                </h3>
                <p className="text-xs text-neutral-300">
                  Transmitiendo señal en directo para toda la hinchada y comunidad de Legión Fénix FC ({liveConfig.categoria}).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={liveConfig.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cta text-xs py-2.5 px-5 inline-flex items-center gap-2 font-extrabold shadow-fuego"
                >
                  <Tv className="w-4 h-4" />
                  Ver en {liveConfig.plataforma}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Reproductor Embebido si es YouTube o Contenedor Visual si es TikTok */}
            <div className="bg-black/90 p-2 sm:p-4 flex items-center justify-center">
              {liveYoutubeEmbed ? (
                <div className="w-full max-w-4xl h-[380px] sm:h-[460px] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                  <iframe
                    src={liveYoutubeEmbed}
                    title="Transmisión en Vivo Legión Fénix FC"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full max-w-3xl p-8 rounded-xl bg-gradient-to-br from-[#121218] to-black border border-neutral-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                    <Share2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-bold text-white">
                      Transmisión Activa en TikTok Live Oficial
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                      Conéctate al Live en TikTok desde tu teléfono o computadora para disfrutar la narración, interactuar con el chat y alentar al equipo en vivo.
                    </p>
                  </div>
                  <a
                    href={liveConfig.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 text-white font-extrabold text-xs transition shadow-lg"
                  >
                    Abrir TikTok Live @legionfenixfc
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Configuración del En Vivo (Admin / Entrenador) */}
        {showLiveSettings && canPublish && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLiveSettings(false)}
          >
            <form
              onSubmit={handleSaveLiveSettings}
              onClick={(e) => e.stopPropagation()}
              className="card-fenix max-w-lg w-full p-6 border-rojo-fuego space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rojo-fuego" />
                  CONFIGURAR TRANSMISIÓN EN VIVO (LIVE)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLiveSettings(false)}
                  className="text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#141419] border border-neutral-800">
                  <span className="font-bold text-white">¿Activar Señal en Vivo?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveConfig.active}
                      onChange={(e) => setLiveConfig({ ...liveConfig, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rojo-fuego" />
                  </label>
                </div>

                <div>
                  <label className="block text-texto-secundario mb-1">Título del Partido / Transmisión*</label>
                  <input
                    type="text"
                    className="input-fenix"
                    placeholder="Ej: Final Torneo Clausura Fénix FC vs Caracas SC"
                    value={liveConfig.titulo}
                    onChange={(e) => setLiveConfig({ ...liveConfig, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-texto-secundario mb-1">Plataforma*</label>
                    <select
                      className="input-fenix"
                      value={liveConfig.plataforma}
                      onChange={(e) => setLiveConfig({ ...liveConfig, plataforma: e.target.value })}
                    >
                      <option value="TikTok">TikTok Live</option>
                      <option value="YouTube">YouTube Live</option>
                      <option value="Twitch">Twitch</option>
                      <option value="Facebook">Facebook Live</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-texto-secundario mb-1">Categoría</label>
                    <input
                      type="text"
                      className="input-fenix"
                      placeholder="Ej: Sub-16, Libre..."
                      value={liveConfig.categoria}
                      onChange={(e) => setLiveConfig({ ...liveConfig, categoria: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-texto-secundario mb-1">Enlace del Live / Stream URL*</label>
                  <input
                    type="text"
                    className="input-fenix font-mono"
                    placeholder="https://www.tiktok.com/@legionfenixfc/live o https://youtube.com/live/..."
                    value={liveConfig.url}
                    onChange={(e) => setLiveConfig({ ...liveConfig, url: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowLiveSettings(false)}
                  className="px-4 py-2 rounded bg-neutral-800 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-cta text-xs py-2 px-5 font-bold">
                  Guardar Configuración Live
                </button>
              </div>
            </form>
          </div>
        )}

        {feedback && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200">
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Formulario para Subir Fotos / Videos de Partidos o Entrenamientos */}
        {canPublish && showForm && (
          <form onSubmit={handleUpload} className="card-fenix p-5 border-vinotinto/60 space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-rojo-fuego" /> Cargar Resumen de Juego, Clip o Fotografía
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                className="input-fenix"
                placeholder="Título (ej: Goles vs Halcones Sub-14)"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
              <select
                className="input-fenix"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Video">Tipo: Video / Jugada</option>
                <option value="Foto">Tipo: Foto</option>
              </select>
              <select
                className="input-fenix"
                value={form.categoria_evento}
                onChange={(e) => setForm({ ...form, categoria_evento: e.target.value })}
              >
                <option value="Juego">Momento: Juego Oficial</option>
                <option value="Entrenamiento">Momento: Entrenamiento</option>
              </select>
              <input
                type="date"
                className="input-fenix"
                value={form.fecha_evento}
                onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })}
              />
              <input
                type="text"
                className="input-fenix sm:col-span-2"
                placeholder="URL de YouTube/TikTok/Drive (opcional si subes archivo directamente)"
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <input
                type="text"
                className="input-fenix"
                placeholder="Descripción breve del partido o jugada clave"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-vinotinto file:text-white hover:file:bg-rojo-fuego"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="btn-cta text-xs py-2 px-5">
                {submitting ? 'Publicando...' : 'Publicar en Hinchada'}
              </button>
            </div>
          </form>
        )}

        {/* Controles de Filtro */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121215] border border-neutral-800 rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-texto-secundario mr-1">
              Formato:
            </span>
            {['Todos', 'Foto', 'Video'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tipoFilter === t
                    ? 'bg-vinotinto text-white border border-rojo-fuego'
                    : 'bg-[#1a1a1d] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                {t === 'Todos' ? 'Todos' : t === 'Foto' ? 'Fotos' : 'Videos'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-texto-secundario mr-1">
              Escenario:
            </span>
            {['Todos', 'Juego', 'Entrenamiento'].map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => setEventoFilter(ev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  eventoFilter === ev
                    ? 'bg-rojo-fuego text-white'
                    : 'bg-[#1a1a1d] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                {ev === 'Todos' ? 'Juegos y Entrenamientos' : ev === 'Juego' ? 'Juegos' : 'Entrenamientos'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Galería Hinchada */}
        {filteredGallery.length === 0 ? (
          <div className="card-fenix p-8 text-center text-sm text-texto-secundario">
            No hay fotos o videos disponibles con este filtro por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => {
              const isVideo = item.tipo === 'Video';
              const previewImg = isVideo
                ? item.thumbnail_url || '/assets/news-match.svg'
                : item.media_url || '/assets/news-academy.svg';
              return (
                <article
                  key={item.id_media}
                  onClick={() => setSelectedItem(item)}
                  className="card-fenix overflow-hidden cursor-pointer group hover:border-rojo-fuego/80 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 bg-[#161616] overflow-hidden">
                      <img
                        src={previewImg}
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded bg-vinotinto/90 text-white text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                          {isVideo ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                          {item.tipo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-black/75 border border-neutral-700 text-amber-300 text-[10px] font-bold uppercase">
                          {item.categoria_evento}
                        </span>
                      </div>
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="w-12 h-12 rounded-full bg-rojo-fuego/90 group-hover:scale-110 transition flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-white text-base leading-snug">{item.titulo}</h3>
                      {item.descripcion && (
                        <p className="text-xs text-texto-secundario line-clamp-2">{item.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      {item.fecha_evento ? new Date(item.fecha_evento).toLocaleDateString('es-VE') : 'Reciente'}
                    </span>
                    <span className="text-rojo-fuego font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                      {isVideo ? 'Reproducir video →' : 'Ampliar foto →'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal de Vista Detallada de Foto o Video */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="card-fenix max-w-3xl w-full overflow-hidden border-rojo-fuego"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-vinotinto text-white text-[10px] font-bold uppercase">
                    {selectedItem.tipo} • {selectedItem.categoria_evento}
                  </span>
                  <h3 className="font-bold text-white text-base truncate">{selectedItem.titulo}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
                {selectedItem.tipo === 'Video' ? (
                  youtubeEmbed ? (
                    <div className="w-full aspect-video">
                      <iframe
                        src={youtubeEmbed}
                        title={selectedItem.titulo}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      src={selectedItem.media_url}
                      controls
                      autoPlay
                      className="w-full max-h-[65vh] object-contain"
                    />
                  )
                ) : (
                  <img
                    src={selectedItem.media_url}
                    alt={selectedItem.titulo}
                    className="w-full max-h-[65vh] object-contain"
                  />
                )}
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-neutral-300">{selectedItem.descripcion || 'Sin descripción adicional.'}</p>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
                  <span>Fecha: {selectedItem.fecha_evento ? new Date(selectedItem.fecha_evento).toLocaleDateString('es-VE') : 'N/A'}</span>
                  <a
                    href={selectedItem.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Ver original <Globe className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canales Oficiales de Redes Sociales */}
        <div className="pt-6 border-t border-neutral-800">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-dorado-fenix">
              Comunidad y Redes Oficiales
            </span>
            <h3 className="font-display text-2xl font-extrabold text-white mt-1">
              SÍGUENOS EN NUESTROS CANALES DIGITALES
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOCIAL_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`card-fenix p-4 border transition hover:-translate-y-1 block ${ch.colorClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${ch.badgeClass}`} />
                    <span className="text-[10px] font-bold text-neutral-400">Canal Oficial</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{ch.name}</h4>
                  <p className="text-xs text-amber-300 font-mono mt-0.5">{ch.handle}</p>
                  <p className="text-[11px] text-neutral-400 mt-2">{ch.desc}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
