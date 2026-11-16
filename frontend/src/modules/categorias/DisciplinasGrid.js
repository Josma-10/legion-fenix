import React from 'react';
import Link from 'next/link';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { groupCategoriesByDiscipline } from '../../utils/categories';

export default function DisciplinasGrid({ categories = [], onSelectDisciplineFixture }) {
  const groupedTeams = groupCategoriesByDiscipline(categories);

  return (
    <section id="equipos" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Estructura Deportiva Oficial
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            DISCIPLINAS Y CATEGORÍAS (BEBÉS A LIBRE)
          </h2>
          <p className="text-xs sm:text-sm text-texto-secundario mt-1">
            Formación completa en las tres modalidades del club con ruta desde Bebés (Sub-6) hasta categoría Libre.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href="/categorias" className="btn-vinotinto text-xs">
            Explorar Plantillas <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login?tab=register&tipo=representante" className="btn-cta text-xs">
            Nuevo Registro <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {groupedTeams.map((disc) => (
          <div
            key={disc.key}
            className="card-fenix p-5 sm:p-6 border-t-4 border-t-vinotinto hover:border-rojo-fuego/80 transition flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {disc.quadrant}
                  </span>
                  <h3 className="font-display text-2xl font-extrabold text-white mt-0.5">
                    {disc.label}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-vinotinto text-white text-[11px] font-bold shrink-0">
                  {disc.items.length || 9} Cat.
                </span>
              </div>

              <p className="text-xs text-texto-secundario">{disc.description}</p>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {disc.items.map((cat) => (
                  <Link
                    key={cat.id_categoria}
                    href={`/categorias?id=${cat.id_categoria}`}
                    className="bg-[#151515] hover:bg-vinotinto/30 border border-neutral-800 hover:border-rojo-fuego rounded-lg px-2 py-2 text-center transition"
                  >
                    <p className="text-xs font-bold text-white leading-tight">{cat.nombre}</p>
                    <p className="text-[10px] text-texto-secundario mt-0.5">
                      {cat.edad_max >= 90 ? '21+ años' : `${cat.edad_min}-${cat.edad_max} años`}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
              <a
                href="#fixture"
                onClick={() => onSelectDisciplineFixture && onSelectDisciplineFixture(disc.key)}
                className="px-3 py-1.5 rounded-lg bg-[#151515] hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white transition"
              >
                Ver Fixture
              </a>
              <Link
                href="/login?tab=register&tipo=representante"
                className="text-xs font-bold text-rojo-fuego hover:text-white inline-flex items-center gap-1 transition"
              >
                Inscribir en {disc.short} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
