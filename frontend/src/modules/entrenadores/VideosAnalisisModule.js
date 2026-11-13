import React, { useEffect, useState } from 'react';
import { Plus, Trash2, PlayCircle, Upload } from 'lucide-react';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';

function extractYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    const v = parsed.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}`;
    if (parsed.pathname.includes('/embed/')) return url;
    return null;
  } catch {
    return null;
  }
}

export default function VideosAnalisisModule({ videos = [], categories = [], onReload }) {
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeVideo, setActiveVideo] = useState(videos[0] || null);
  const [videoForm, setVideoForm] = useState({
    id_categoria: categories[0] ? String(categories[0].id_categoria) : '',
    titulo: '',
    descripcion: '',
    tipo_fuente: 'YouTube',
    video_url: '',
    etiqueta_tactica: 'Ofensivo',
    file: null,
  });

  useEffect(() => {
    if (categories.length > 0 && !videoForm.id_categoria) {
      setVideoForm((prev) => ({
        ...prev,
        id_categoria: String(categories[0].id_categoria),
      }));
    }
  }, [categories, videoForm.id_categoria]);

  useEffect(() => {
    if (videos.length > 0 && !activeVideo) {
      setActiveVideo(videos[0]);
    }
  }, [videos, activeVideo]);

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('id_categoria', videoForm.id_categoria);
      formData.append('titulo', videoForm.titulo);
      formData.append('descripcion', videoForm.descripcion);
      formData.append('tipo_fuente', videoForm.tipo_fuente);
      formData.append('etiqueta_tactica', videoForm.etiqueta_tactica);

      if (videoForm.tipo_fuente === 'Archivo' && videoForm.file) {
        formData.append('video_file', videoForm.file);
      } else {
        formData.append('video_url', videoForm.video_url);
      }

      const res = await api.post('/coach/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowVideoForm(false);
      setVideoForm((prev) => ({ ...prev, titulo: '', descripcion: '', video_url: '', file: null }));
      setActiveVideo(res.data.video);
      if (onReload) await onReload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error registrando video.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    await api.delete(`/coach/videos/${id}`);
    if (activeVideo?.id_video === id) setActiveVideo(null);
    if (onReload) await onReload();
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            VIDEOTECA DE ANÁLISIS TÁCTICO Y YOUTUBE
          </h2>
          <p className="text-xs text-texto-secundario">
            Integra enlaces tácticos de YouTube o sube grabaciones de partidos directamente a la nube.
          </p>
        </div>
        <button onClick={() => setShowVideoForm(!showVideoForm)} className="btn-cta text-xs">
          <Plus className="w-4 h-4" /> Agregar Video de Análisis
        </button>
      </div>

      {showVideoForm && (
        <form onSubmit={handleAddVideo} className="card-fenix p-5 space-y-4 border-rojo-fuego/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              className="input-fenix"
              placeholder="Título del análisis*"
              value={videoForm.titulo}
              onChange={(e) => setVideoForm({ ...videoForm, titulo: e.target.value })}
              required
            />
            <select
              className="input-fenix"
              value={videoForm.id_categoria}
              onChange={(e) => setVideoForm({ ...videoForm, id_categoria: e.target.value })}
            >
              {groupedCategories.map((group) => (
                <optgroup key={group.key} label={group.label}>
                  {group.items.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre} ({group.short})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              className="input-fenix"
              value={videoForm.etiqueta_tactica}
              onChange={(e) => setVideoForm({ ...videoForm, etiqueta_tactica: e.target.value })}
            >
              <option value="Ofensivo">Enfoque: Ofensivo</option>
              <option value="Defensivo">Enfoque: Defensivo</option>
              <option value="Arqueros">Enfoque: Arqueros</option>
              <option value="Transiciones">Enfoque: Transiciones</option>
              <option value="Balón Parado">Enfoque: Balón Parado</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <select
              className="input-fenix"
              value={videoForm.tipo_fuente}
              onChange={(e) => setVideoForm({ ...videoForm, tipo_fuente: e.target.value })}
            >
              <option value="YouTube">Enlace de YouTube</option>
              <option value="Archivo">Subir Grabación MP4 (Cloudinary/Cloud)</option>
            </select>

            {videoForm.tipo_fuente === 'YouTube' ? (
              <input
                type="url"
                className="input-fenix md:col-span-2"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoForm.video_url}
                onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                required
              />
            ) : (
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="btn-vinotinto text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {videoForm.file ? videoForm.file.name : 'Seleccionar Video MP4'}
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, file: e.target.files?.[0] || null })
                    }
                  />
                </label>
              </div>
            )}
          </div>

          <input
            type="text"
            className="input-fenix"
            placeholder="Notas tácticas y minutos clave a observar..."
            value={videoForm.descripcion}
            onChange={(e) => setVideoForm({ ...videoForm, descripcion: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowVideoForm(false)} className="px-4 py-2 bg-neutral-800 rounded-lg text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-cta text-xs">
              {saving ? 'Publicando...' : 'Guardar en Videoteca'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-fenix p-4 space-y-3">
          {activeVideo ? (
            <>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-neutral-800">
                {activeVideo.tipo_fuente === 'YouTube' && extractYouTubeEmbedUrl(activeVideo.video_url) ? (
                  <iframe
                    className="w-full h-full"
                    src={extractYouTubeEmbedUrl(activeVideo.video_url)}
                    title={activeVideo.titulo}
                    allowFullScreen
                  />
                ) : (
                  <video controls className="w-full h-full" src={activeVideo.video_url} />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-rojo-fuego">
                    {activeVideo.etiqueta_tactica} • {activeVideo.categoria_nombre}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white">{activeVideo.titulo}</h3>
                  <p className="text-xs text-texto-secundario mt-1">{activeVideo.descripcion}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-texto-secundario py-20 text-center">
              Selecciona un video de la lista para iniciar el análisis.
            </p>
          )}
        </div>

        <div className="lg:col-span-4 card-fenix p-4 space-y-3 max-h-[500px] overflow-y-auto">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-texto-secundario">
            Sesiones Disponibles ({videos.length})
          </h4>
          {videos.map((v) => (
            <div
              key={v.id_video}
              onClick={() => setActiveVideo(v)}
              className={`p-3 rounded-lg border cursor-pointer transition flex items-start justify-between gap-2 ${
                activeVideo?.id_video === v.id_video
                  ? 'bg-vinotinto/30 border-rojo-fuego'
                  : 'bg-[#151515] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <PlayCircle className="w-5 h-5 text-rojo-fuego shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white leading-snug">{v.titulo}</p>
                  <span className="text-[10px] text-texto-secundario">
                    {v.etiqueta_tactica} • {v.tipo_fuente}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVideo(v.id_video);
                }}
                className="text-neutral-500 hover:text-rojo-fuego p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
