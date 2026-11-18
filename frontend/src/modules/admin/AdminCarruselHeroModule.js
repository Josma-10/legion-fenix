import React, { useCallback, useEffect, useState } from 'react';
import {
  Film,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../utils/api';
import { resolveAssetUrl } from '../../utils/media';

export default function AdminCarruselHeroModule() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    badge: 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
    titulo: '',
    subtitulo: '',
    tipo_media: 'Foto',
    media_url: '',
    cta_label: 'Inscribir Atleta',
    cta_href: '/login?tab=register&tipo=representante',
    orden: 1,
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const loadSlides = useCallback(async () => {
    try {
      const res = await api.get('/public/hero-slides', { params: { all: '1' } });
      setSlides(res.data.slides || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error cargando slides del carrusel principal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (selected) {
      const isVid = selected.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(selected.name);
      setForm((prev) => ({ ...prev, tipo_media: isVid ? 'Video' : 'Foto' }));
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl('');
    }
  };

  const handleCreateSlide = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');

    if (!form.titulo.trim()) {
      setErrorMsg('Ingresa un título llamativo para el slide del carrusel.');
      return;
    }
    if (!file && !form.media_url.trim()) {
      setErrorMsg('Sube una foto o video corto, o pega un enlace multimedia válido.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('badge', form.badge.trim());
      fd.append('titulo', form.titulo.trim());
      fd.append('subtitulo', form.subtitulo.trim());
      fd.append('tipo_media', form.tipo_media);
      fd.append('cta_label', form.cta_label.trim() || 'Inscribir Atleta');
      fd.append('cta_href', form.cta_href.trim() || '/login?tab=register&tipo=representante');
      fd.append('orden', String(form.orden || 1));
      if (file) {
        fd.append('archivo', file);
      } else {
        fd.append('media_url', form.media_url.trim());
      }

      const res = await api.post('/public/hero-slides', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback(res.data?.message || 'Slide publicado exitosamente en el carrusel principal.');
      setForm({
        badge: 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
        titulo: '',
        subtitulo: '',
        tipo_media: 'Foto',
        media_url: '',
        cta_label: 'Inscribir Atleta',
        cta_href: '/login?tab=register&tipo=representante',
        orden: slides.length + 2,
      });
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      await loadSlides();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo publicar el slide.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (slide) => {
    setErrorMsg('');
    setFeedback('');
    try {
      await api.patch(`/public/hero-slides/${slide.id_slide}`, { activo: !slide.activo });
      setFeedback(
        !slide.activo
          ? `Slide "${slide.titulo}" activado en la página principal.`
          : `Slide "${slide.titulo}" ocultado del carrusel principal.`
      );
      await loadSlides();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo actualizar el estado del slide.');
    }
  };

  const handleDeleteSlide = async (slide) => {
    if (!window.confirm(`¿Eliminar definitivamente el slide "${slide.titulo}" del carrusel?`)) {
      return;
    }
    setErrorMsg('');
    setFeedback('');
    try {
      await api.delete(`/public/hero-slides/${slide.id_slide}`);
      setFeedback(`Slide "${slide.titulo}" eliminado.`);
      await loadSlides();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo eliminar el slide.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Módulo Multimedia Analista / Administración
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
          CARRUSEL PRINCIPAL (FOTOS DE JUGADORES Y VIDEOS PROMOCIONALES)
        </h2>
        <p className="text-xs text-texto-secundario mt-1">
          Sube fotografías de los atletas en acción o videos cortos promocionales (.mp4, .webm, .mov). Todo lo que publiques activo aquí aparece automáticamente en el carrusel superior de la página de inicio sin necesidad de tocar código.
        </p>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario Publicar Slide */}
        <form onSubmit={handleCreateSlide} className="lg:col-span-5 card-fenix p-5 space-y-3.5">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-rojo-fuego" /> Agregar Foto o Video al Carrusel
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_media: 'Foto' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                form.tipo_media === 'Foto'
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#141418] border-neutral-800 text-neutral-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Fotografía
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_media: 'Video' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                form.tipo_media === 'Video'
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#141418] border-neutral-800 text-neutral-300'
              }`}
            >
              <Film className="w-4 h-4" /> Video Corto
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Subir Archivo ({form.tipo_media === 'Video' ? 'MP4, WEBM o MOV' : 'JPG, PNG o WEBP'})
            </label>
            <label className="input-fenix text-xs flex items-center justify-between cursor-pointer hover:border-rojo-fuego">
              <span className="truncate text-neutral-300">
                {file
                  ? file.name
                  : form.tipo_media === 'Video'
                  ? 'Seleccionar video promocional corto...'
                  : 'Seleccionar fotografía de jugadores/club...'}
              </span>
              <Upload className="w-4 h-4 text-rojo-fuego shrink-0 ml-2" />
              <input
                type="file"
                accept={form.tipo_media === 'Video' ? '.mp4,.webm,.mov,.m4v' : '.jpg,.jpeg,.png,.webp'}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {!file && (
            <div>
              <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                O pegar URL directa de imagen/video (opcional si subes archivo)
              </label>
              <input
                type="url"
                className="input-fenix text-xs"
                placeholder="https://..."
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
          )}

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-vinotinto bg-black aspect-video flex items-center justify-center">
              {form.tipo_media === 'Video' ? (
                <video
                  src={previewUrl}
                  controls
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Título Principal del Slide*
            </label>
            <input
              type="text"
              className="input-fenix text-xs"
              placeholder="Ej: NUESTRA CANTERA EN ACCIÓN — TEMPORADA 2026"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Descripción / Subtítulo
            </label>
            <textarea
              rows={2}
              className="input-fenix text-xs"
              placeholder="Ej: Inscripciones abiertas desde Bebés Sub-6 hasta categoría Libre..."
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                Etiqueta Superior (Badge)
              </label>
              <input
                type="text"
                className="input-fenix text-xs"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                Orden de Aparición
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="input-fenix text-xs"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                Texto Botón Acción
              </label>
              <input
                type="text"
                className="input-fenix text-xs"
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                Destino del Botón
              </label>
              <select
                className="input-fenix text-xs"
                value={form.cta_href}
                onChange={(e) => setForm({ ...form, cta_href: e.target.value })}
              >
                <option value="/login?tab=register&tipo=representante">Inscripción Menores</option>
                <option value="/login?tab=register&tipo=adulto">Inscripción Mayores</option>
                <option value="/categorias">Explorar Categorías</option>
                <option value="#tienda">Tienda Oficial</option>
                <option value="#tarifas">Tarifas Oficiales</option>
                <option value="/login">Ingresar al Portal</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-cta w-full text-xs py-2.5">
            <Upload className="w-4 h-4" />
            {submitting ? 'Subiendo y publicando...' : 'Publicar en el Carrusel Principal'}
          </button>
        </form>

        {/* Lista de Slides Activos e Inactivos */}
        <div className="lg:col-span-7 card-fenix p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-display text-xl font-bold text-white">
              SLIDES CONFIGURADOS ({slides.length})
            </h3>
            <span className="text-[11px] text-texto-secundario">
              Se muestran en vivo en la portada
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-texto-secundario py-8 text-center">Cargando slides...</p>
          ) : slides.length === 0 ? (
            <div className="bg-[#141418] border border-dashed border-neutral-800 rounded-xl p-8 text-center space-y-2">
              <Film className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-bold text-neutral-300">
                Aún no has publicado fotos ni videos personalizados.
              </p>
              <p className="text-xs text-texto-secundario max-w-md mx-auto">
                Actualmente el carrusel muestra los 3 slides institucionales por defecto. En cuanto publiques una foto o video promocional aquí, aparecerá de primero en la página principal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((s) => {
                const mediaSrc = resolveAssetUrl(s.media_url);
                return (
                  <div
                    key={s.id_slide}
                    className={`bg-[#141418] border rounded-xl p-3.5 flex flex-col sm:flex-row gap-3.5 items-center ${
                      s.activo ? 'border-vinotinto/70' : 'border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="w-full sm:w-36 h-24 rounded-lg overflow-hidden bg-black border border-neutral-800 shrink-0 flex items-center justify-center relative">
                      {s.tipo_media === 'Video' ? (
                        <video
                          src={mediaSrc}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={s.titulo}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-extrabold text-amber-300 uppercase">
                        {s.tipo_media} #{s.orden}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <p className="text-[10px] font-bold text-rojo-fuego uppercase truncate">
                        {s.badge}
                      </p>
                      <h4 className="font-bold text-sm text-white truncate">{s.titulo}</h4>
                      {s.subtitulo && (
                        <p className="text-xs text-texto-secundario line-clamp-2">{s.subtitulo}</p>
                      )}
                      <p className="text-[10px] text-neutral-400">
                        Botón: <strong className="text-white">{s.cta_label}</strong> •{' '}
                        {s.activo ? '🟢 Visible en portada' : '⚪ Oculto'}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-vinotinto text-white text-[11px] font-bold inline-flex items-center gap-1 transition"
                      >
                        {s.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {s.activo ? 'Ocultar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-rojo-fuego text-red-200 hover:text-white border border-rojo-fuego/50 text-[11px] font-bold inline-flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
