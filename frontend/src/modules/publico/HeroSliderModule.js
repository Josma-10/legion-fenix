import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';
import { resolveAssetUrl } from '../../utils/media';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-1',
    badge: 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
    title: 'RENACE EN LA CANCHA CON LA LEGIÓN FÉNIX',
    subtitle:
      'Formación integral de alto rendimiento en Fútbol Campo, Fútbol 7 y Fútbol Sala. Disciplina táctica, medicina deportiva e inteligencia de juego.',
    ctaLabel: 'Inscribir Atleta',
    ctaHref: '/login?tab=register&tipo=representante',
    accent: 'from-vinotinto/95 via-[#240009]/90 to-negro-fondo',
    tipoMedia: null,
    mediaUrl: null,
  },
  {
    id: 'default-2',
    badge: 'ALTO RENDIMIENTO & TECNOLOGÍA',
    title: 'PORTAL INTELIGENTE PARA FAMILIAS Y ENTRENADORES',
    subtitle:
      'Control de asistencia, fichas médico-podológicas, evaluación biomecánica con IA, simulador 2D y pagos en tiempo real a tasa BCV.',
    ctaLabel: 'Ingresar al Portal',
    ctaHref: '/login',
    accent: 'from-[#36060b]/95 via-[#18070a]/90 to-negro-fondo',
    tipoMedia: null,
    mediaUrl: null,
  },
  {
    id: 'default-3',
    badge: 'INDUMENTARIA OFICIAL LOCAL & VISITANTE',
    title: 'VISTE LA ARMADURA ROJO FUEGO Y ORO ÉLITE',
    subtitle:
      'Adquiere los nuevos uniformes oficiales de Local (Rojo Fuego & Negro) y Visitante (Negro & Dorado Élite) para Jugador y Portero en nuestra Tienda Oficial.',
    ctaLabel: 'Ver Uniformes en Tienda',
    ctaHref: '#tienda',
    accent: 'from-negro-fondo via-[#28060d]/90 to-[#1f1606]',
    tipoMedia: null,
    mediaUrl: null,
  },
];

export default function HeroSliderModule({ nextMatch = null, slides = [], loading = false }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);

  const allSlides = useMemo(() => {
    const customSlides = (slides || [])
      .filter((s) => s && s.activo !== false && s.media_url)
      .map((s) => ({
        id: `custom-${s.id_slide}`,
        badge: s.badge || 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
        title: s.titulo,
        subtitle: s.subtitulo || '',
        ctaLabel: s.cta_label || 'Inscribir Atleta',
        ctaHref: s.cta_href || '/login?tab=register&tipo=representante',
        accent: 'from-vinotinto/90 via-[#200008]/80 to-negro-fondo/90',
        tipoMedia: s.tipo_media === 'Video' ? 'Video' : 'Foto',
        mediaUrl: resolveAssetUrl(s.media_url),
      }));

    if (customSlides.length > 0) {
      return [...customSlides, ...DEFAULT_HERO_SLIDES];
    }
    return DEFAULT_HERO_SLIDES;
  }, [slides]);

  useEffect(() => {
    if (slideIdx >= allSlides.length) {
      setSlideIdx(0);
    }
  }, [allSlides.length, slideIdx]);

  useEffect(() => {
    const active = allSlides[slideIdx];
    const delayMs = active?.tipoMedia === 'Video' ? 12000 : 6500;
    const interval = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % allSlides.length);
    }, delayMs);
    return () => clearInterval(interval);
  }, [allSlides, slideIdx]);

  const currentSlide = allSlides[slideIdx] || DEFAULT_HERO_SLIDES[0];

  return (
    <section className="relative overflow-hidden border-b border-rojo-fuego/40 w-full max-w-full">
      <div
        className={`bg-gradient-to-br ${currentSlide.accent} transition-all duration-500 relative overflow-hidden w-full`}
      >
        {/* Fondo Multimedia Dinámico (Foto de Jugadores o Video Corto Promocional) */}
        {currentSlide.mediaUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {currentSlide.tipoMedia === 'Video' ? (
              <video
                key={currentSlide.mediaUrl}
                src={currentSlide.mediaUrl}
                autoPlay
                muted={videoMuted}
                loop
                playsInline
                className="w-full h-full object-cover opacity-55"
              />
            ) : (
              <img
                src={currentSlide.mediaUrl}
                alt={currentSlide.title}
                className="w-full h-full object-cover opacity-50 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0E]/92 via-[#1c040b]/75 to-[#0B0B0E]/82" />
          </div>
        )}

        {/* Resplandor sutil del Escudo Oficial en fondo cuando no hay media */}
        {!currentSlide.mediaUrl && (
          <img
            src="/assets/logo-legion-fenix.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block pointer-events-none select-none absolute right-0 bottom-0 w-[300px] h-[300px] object-contain opacity-[0.07]"
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/logo-legion-fenix.png"
                alt="Escudo Oficial Legión Fénix FC"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_22px_rgba(225,29,46,0.65)] shrink-0"
              />
              <span className="inline-flex items-center gap-2 bg-negro-fondo/80 border border-rojo-fuego/70 text-rojo-fuego text-[11px] sm:text-xs font-extrabold px-3.5 py-1.5 rounded-full tracking-widest">
                <Flame className="w-3.5 h-3.5 shrink-0" /> {currentSlide.badge}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white drop-shadow">
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p className="text-sm sm:text-base text-neutral-200 max-w-2xl leading-relaxed">
                {currentSlide.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={currentSlide.ctaHref} className="btn-cta">
                {currentSlide.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#fixture"
                className="px-5 py-2.5 rounded-lg bg-[#0B0B0E]/85 hover:bg-neutral-900 border border-neutral-700 text-sm font-semibold text-white transition"
              >
                Ver Próximos Partidos
              </a>
              {currentSlide.tipoMedia === 'Video' && (
                <button
                  type="button"
                  onClick={() => setVideoMuted((m) => !m)}
                  className="px-3 py-2.5 rounded-lg bg-black/70 hover:bg-vinotinto border border-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1.5 transition"
                  title={videoMuted ? 'Activar sonido del video' : 'Silenciar video'}
                >
                  {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {videoMuted ? 'Sonido' : 'Silenciar'}
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#0B0B0E]/90 backdrop-blur border border-rojo-fuego/50 rounded-2xl p-5 sm:p-6 shadow-fenix space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego">
                  Próximo Compromiso Oficial
                </span>
                {nextMatch && (
                  <span className="text-[11px] font-bold bg-vinotinto px-2.5 py-0.5 rounded-full">
                    {nextMatch.categoria_nombre || nextMatch.modalidad}
                  </span>
                )}
              </div>

              {nextMatch ? (
                <>
                  <div>
                    <p className="text-xs text-texto-secundario">{nextMatch.torneo}</p>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                      Legión Fénix <span className="text-rojo-fuego">VS</span> {nextMatch.rival}
                    </h2>
                  </div>

                  <CountdownTimer targetDate={nextMatch.fecha_hora} />

                  <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-300">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rojo-fuego" />
                      {new Date(nextMatch.fecha_hora).toLocaleString('es-VE', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rojo-fuego" />
                      {nextMatch.sede}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-texto-secundario py-4">
                  {loading
                    ? 'Sincronizando calendario oficial...'
                    : 'Próximamente se publicará el siguiente compromiso oficial.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {allSlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSlideIdx(idx)}
                aria-label={`Ir al slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === slideIdx ? 'w-8 bg-rojo-fuego' : 'w-2.5 bg-neutral-600 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlideIdx((prev) => (prev - 1 + allSlides.length) % allSlides.length)}
              aria-label="Slide anterior"
              className="p-2 rounded-full bg-black/50 hover:bg-vinotinto border border-neutral-700 text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSlideIdx((prev) => (prev + 1) % allSlides.length)}
              aria-label="Slide siguiente"
              className="p-2 rounded-full bg-black/50 hover:bg-vinotinto border border-neutral-700 text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
