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
} from 'lucide-react';
import api from '../../utils/api';

function extractYoutubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
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
    desc: 'Retos técnicos, jugadas en cancha y detrás de cámaras.',
    href: 'https://www.tiktok.com/@legionfenixfc',
    colorClass: 'border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-br from-cyan-950/30 to-[#141414]',
    badgeClass: 'text-cyan-400',
    icon: Share2,
  },
  {
    name: 'YouTube Oficial',
    handle: 'Legión Fénix FC TV',
    desc: 'Resúmenes completos de juegos, torneos y análisis táctico.',
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

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Foto',
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
    } catch {
      setCanPublish(false);
    }
  }, []);

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
        tipo: 'Foto',
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

  return (
    <>
      <section id="hinchada" className="space-y-8">
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

          {canPublish && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="btn-cta text-xs py-2.5 px-4 flex items-center gap-2 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> {showForm ? 'Cerrar Formulario' : 'Subir Foto / Video'}
            </button>
          )}
        </div>

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

        {/* Formulario para Entrenador / Admin / Analista */}
        {canPublish && showForm && (
          <form onSubmit={handleUpload} className="card-fenix p-5 border-vinotinto/60 space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-rojo-fuego" /> Publicar Nuevo Material en Galería Hinchada
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
                <option value="Foto">Tipo: Foto</option>
                <option value="Video">Tipo: Video</option>
              </select>
              <select
                className="input-fenix"
                value={form.categoria_evento}
                onChange={(e) => setForm({ ...form, categoria_evento: e.target.value })}
              >
                <option value="Juego">Momento: Juego</option>
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
                placeholder="URL de imagen o enlace de YouTube/video (opcional si subes archivo)"
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <input
                type="text"
                className="input-fenix"
                placeholder="Descripción breve del partido o entrenamiento"
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
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rojo-fuego" />
                      {item.fecha_evento ? String(item.fecha_evento).slice(0, 10) : 'Reciente'}
                    </span>
                    <span className="text-rojo-fuego font-bold group-hover:text-white transition">
                      {isVideo ? 'Reproducir video →' : 'Ampliar foto →'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* REDES SOCIALES OFICIALES DEL EQUIPO */}
        <div className="card-fenix p-6 sm:p-8 border-vinotinto/50 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Conecta con el Club
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                REDES SOCIALES OFICIALES DE LEGIÓN FÉNIX FC
              </h3>
            </div>
            <span className="text-xs text-texto-secundario">
              Sigue cada convocatoria, marcador en vivo y jornadas formativas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOCIAL_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-xl border p-4 transition flex flex-col justify-between gap-3 ${ch.colorClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white text-sm">{ch.name}</p>
                      <p className={`text-xs font-extrabold mt-0.5 ${ch.badgeClass}`}>{ch.handle}</p>
                    </div>
                    <Icon className={`w-5 h-5 shrink-0 ${ch.badgeClass}`} />
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">{ch.desc}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Visor de Foto o Video */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-fenix max-w-3xl w-full overflow-hidden border-vinotinto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                  {selectedItem.tipo} • {selectedItem.categoria_evento}
                </span>
                <h3 className="font-bold text-white text-base">{selectedItem.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-rojo-fuego text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[70vh]">
              {selectedItem.tipo === 'Video' ? (
                youtubeEmbed ? (
                  <iframe
                    src={youtubeEmbed}
                    title={selectedItem.titulo}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedItem.media_url}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh]"
                  />
                )
              ) : (
                <img
                  src={selectedItem.media_url}
                  alt={selectedItem.titulo}
                  className="max-h-[65vh] w-auto object-contain mx-auto"
                />
              )}
            </div>
            {selectedItem.descripcion && (
              <div className="px-5 py-3 text-xs text-neutral-300 border-t border-neutral-800">
                {selectedItem.descripcion}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
