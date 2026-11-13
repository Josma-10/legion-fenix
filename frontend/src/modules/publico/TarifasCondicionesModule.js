import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Trophy,
  Flame,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import { useBcvRate, formatBs, formatRate } from '../../utils/bcv';

export default function TarifasCondicionesModule() {
  const { bcv } = useBcvRate();
  const tasa = Number(bcv?.tasa_bcv || 0);

  return (
    <section id="tarifas" className="space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Temporada Oficial 2026 • Cuotas Institucionales
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            TARIFAS, MENSUALIDADES E INDUMENTARIA
          </h2>
          <p className="text-xs text-texto-secundario max-w-2xl mt-1">
            Estructura económica oficial transparente para atletas, representantes y categorías en Fútbol Campo, Fútbol 7 y Fútbol Sala.
          </p>
        </div>
        {tasa > 0 && (
          <div className="bg-[#141418] border border-amber-500/40 rounded-xl px-3.5 py-2 text-right self-start md:self-auto">
            <span className="text-[10px] text-texto-secundario uppercase block font-semibold">Tasa Oficial BCV Hoy</span>
            <span className="font-mono text-xs font-bold text-amber-300">1 USD / EUR ≈ {formatRate(tasa)} Bs.</span>
          </div>
        )}
      </div>

      {/* Grid de Tarifas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tarjeta 1: Inscripción General */}
        <div className="card-fenix p-6 flex flex-col justify-between border-rojo-fuego/40 hover:border-rojo-fuego transition space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-vinotinto/70 border border-rojo-fuego text-[10px] font-extrabold text-white uppercase tracking-wider">
                Matrícula Anual
              </span>
              <ShieldCheck className="w-5 h-5 text-rojo-fuego" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white">INSCRIPCIÓN GENERAL</h3>
              <p className="text-xs text-texto-secundario mt-1">
                Ficha federativa, seguro de campo, evaluación deportiva integral y registro institucional en plataforma.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white">15 €</span>
              <span className="text-xs text-texto-secundario font-semibold">/ cuota única</span>
            </div>
            {tasa > 0 && (
              <p className="text-[11px] text-amber-300 font-semibold">
                ≈ {formatBs(15 * tasa)} (al cambio BCV)
              </p>
            )}
            <Link
              href="/login"
              className="w-full btn-cta text-xs py-2 mt-2 inline-flex items-center justify-center gap-1.5"
            >
              Inscribir Atleta <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tarjeta 2: Mensualidad Formativa 0-17 años */}
        <div className="card-fenix p-6 flex flex-col justify-between border-amber-500/40 hover:border-amber-500 transition space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                Categorías Menores
              </span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white">MENSUALIDAD 0 – 17 AÑOS</h3>
              <p className="text-xs text-texto-secundario mt-1">
                Entrenamientos técnicos, preparación física, control podológico-médico y seguimiento pedagógico mensual.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-amber-300">10 €</span>
              <span className="text-xs text-texto-secundario font-semibold">/ mensual</span>
            </div>
            {tasa > 0 && (
              <p className="text-[11px] text-amber-300 font-semibold">
                ≈ {formatBs(10 * tasa)} (al cambio BCV)
              </p>
            )}
            <Link
              href="/login"
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5 transition"
            >
              Portal Representantes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tarjeta 3: Mensualidad Mayores > 18 años */}
        <div className="card-fenix p-6 flex flex-col justify-between border-neutral-700 hover:border-neutral-500 transition space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-600 text-[10px] font-extrabold text-neutral-300 uppercase tracking-wider">
                Categoría Mayor &amp; Libre
              </span>
              <Trophy className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white">MENSUALIDAD &gt; 18 AÑOS</h3>
              <p className="text-xs text-texto-secundario mt-1">
                Alto rendimiento competitivo, microciclos tácticos, análisis de video profesional y fisioterapia en cancha.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white">15 €</span>
              <span className="text-xs text-texto-secundario font-semibold">/ mensual</span>
            </div>
            {tasa > 0 && (
              <p className="text-[11px] text-amber-300 font-semibold">
                ≈ {formatBs(15 * tasa)} (al cambio BCV)
              </p>
            )}
            <Link
              href="/login"
              className="w-full btn-vinotinto text-xs py-2 inline-flex items-center justify-center gap-1.5"
            >
              Acceso a Entrenamientos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Indumentaria y Uniformes Oficiales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rojo-fuego">
                Armadura Oficial de Juego
              </span>
              <span className="text-xs font-bold text-white bg-neutral-800 px-2.5 py-0.5 rounded-full">
                Local / Visitante
              </span>
            </div>
            <h4 className="font-display text-2xl font-bold text-white mt-1">UNIFORME COMPLETO</h4>
            <p className="text-xs text-texto-secundario mt-1">
              Incluye Camiseta oficial sublimada de alta transpirabilidad + Short reforzado con escudo + Medias técnicas de compresión.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
            <div className="space-y-0.5">
              <span className="font-display text-3xl font-extrabold text-white">20 €</span>
              <span className="text-[11px] text-amber-400 font-semibold block">
                Tallas estándar (4 a XL) • Talla &gt; XL: <strong>25 €</strong>
              </span>
            </div>
            <a href="#tienda" className="btn-vinotinto text-xs py-2 px-4">
              Ver en Tienda
            </a>
          </div>
        </div>

        <div className="card-fenix p-5 border-l-4 border-l-dorado-fenix flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-dorado-fenix">
                Pieza Individual
              </span>
              <span className="text-xs font-bold text-white bg-neutral-800 px-2.5 py-0.5 rounded-full">
                Camisa de Juego
              </span>
            </div>
            <h4 className="font-display text-2xl font-bold text-white mt-1">UNIFORME (CAMISA SOLA)</h4>
            <p className="text-xs text-texto-secundario mt-1">
              Camisa de partido oficial (Rojo Fuego Local o Negro/Oro Élite Visitante) con número dorsal y escudo institucional.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
            <div className="space-y-0.5">
              <span className="font-display text-3xl font-extrabold text-white">10 €</span>
              <span className="text-[11px] text-amber-400 font-semibold block">
                Tallas estándar (4 a XL) • Talla &gt; XL: <strong>15 €</strong>
              </span>
            </div>
            <a href="#tienda" className="btn-vinotinto text-xs py-2 px-4">
              Ver en Tienda
            </a>
          </div>
        </div>
      </div>

      {/* BANNER OFICIAL PARA TORNEOS */}
      <div className="bg-gradient-to-r from-vinotinto/90 via-[#26050e] to-negro-fondo border-2 border-rojo-fuego/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rojo-fuego/20 border border-rojo-fuego flex items-center justify-center shrink-0">
            <CalendarClock className="w-6 h-6 text-rojo-fuego" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
              COMUNICADO OFICIAL DE COMPETICIÓN Y TORNEOS
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight mt-0.5">
              INSCRIPCIONES Y ARBITRAJES DE TORNEOS
            </h3>
            <p className="text-xs text-neutral-200 mt-1 font-semibold leading-relaxed">
              📢 <strong>SE AVISA E INFORMA 2 SEMANAS ANTES</strong> de cada fecha oficial o inicio de campeonato para coordinar cuadrantes, logística y convocatorias.
            </p>
          </div>
        </div>

        <Link
          href="/categorias"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shrink-0 transition shadow-lg inline-flex items-center gap-2"
        >
          Consultar Calendario de Categorías <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
