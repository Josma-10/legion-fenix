import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight } from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';

const HERO_SLIDES = [
  {
    badge: 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
    title: 'RENACE EN LA CANCHA CON LA LEGIÓN FÉNIX',
    subtitle:
      'Formación integral de alto rendimiento en Fútbol Campo, Fútbol 7 y Fútbol Sala. Disciplina táctica, medicina deportiva e inteligencia de juego.',
    ctaLabel: 'Inscribir Atleta',
    ctaHref: '/login?tab=register&tipo=representante',
    accent: 'from-vinotinto/95 via-[#240009]/90 to-negro-fondo',
  },
  {
    badge: 'ALTO RENDIMIENTO & TECNOLOGÍA',
    title: 'PORTAL INTELIGENTE PARA FAMILIAS Y ENTRENADORES',
    subtitle:
      'Control de asistencia, fichas médico-podológicas, evaluación biomecánica con IA, simulador 2D y pagos en tiempo real a tasa BCV.',
    ctaLabel: 'Ingresar al Portal',
    ctaHref: '/login',
    accent: 'from-[#36060b]/95 via-[#18070a]/90 to-negro-fondo',
  },
  {
    badge: 'INDUMENTARIA OFICIAL LOCAL & VISITANTE',
    title: 'VISTE LA ARMADURA ROJO FUEGO Y ORO ÉLITE',
    subtitle:
      'Adquiere los nuevos uniformes oficiales de Local (Rojo Fuego & Negro) y Visitante (Negro & Dorado Élite) para Jugador y Portero en nuestra Tienda Oficial.',
    ctaLabel: 'Ver Uniformes en Tienda',
    ctaHref: '#tienda',
    accent: 'from-negro-fondo via-[#28060d]/90 to-[#1f1606]',
  },
];

export default function HeroSliderModule({ nextMatch = null, loading = false }) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <section className="relative overflow-hidden border-b border-rojo-fuego/40 w-full max-w-full">
      <div className={`bg-gradient-to-br ${currentSlide.accent} transition-all duration-500 relative overflow-hidden w-full`}>
        {/* Resplandor sutil del Escudo Oficial en fondo */}
        <img
          src="/assets/logo-legion-fenix.png"
          alt=""
          aria-hidden="true"
          className="hidden lg:block pointer-events-none select-none absolute right-0 bottom-0 w-[300px] h-[300px] object-contain opacity-[0.07]"
        />

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
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
              {currentSlide.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-200 max-w-2xl leading-relaxed">
              {currentSlide.subtitle}
            </p>

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
                    : 'Conecta el backend/PostgreSQL para visualizar el cronómetro del próximo partido.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlideIdx(idx)}
                aria-label={`Ir al slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === slideIdx ? 'w-8 bg-rojo-fuego' : 'w-2.5 bg-neutral-600'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="p-2 rounded-lg bg-[#121212]/70 border border-neutral-700 hover:border-rojo-fuego"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="p-2 rounded-lg bg-[#121212]/70 border border-neutral-700 hover:border-rojo-fuego"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
