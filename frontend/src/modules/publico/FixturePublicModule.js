import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export default function FixturePublicModule({
  fixtures = [],
  modalidadFilter = 'Todas',
  onChangeModalidadFilter,
}) {
  const filteredFixtures =
    modalidadFilter === 'Todas'
      ? fixtures
      : fixtures.filter((f) => f.modalidad === modalidadFilter);

  return (
    <section id="fixture" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego">
            Calendario Competitivo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            FIXTURE OFICIAL Y RESULTADOS
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'Todas', label: 'Todas las Disciplinas' },
            { key: 'Campo', label: 'Equipo de Fútbol Campo' },
            { key: 'F7', label: 'Equipo de Fútbol 7' },
            { key: 'Sala', label: 'Equipo de Sala' },
          ].map((mod) => (
            <button
              key={mod.key}
              onClick={() => onChangeModalidadFilter(mod.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                modalidadFilter === mod.key
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-gris-tarjeta border-neutral-800 text-texto-secundario hover:text-white'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFixtures.map((match) => (
          <div key={match.id_partido} className="card-fenix p-5 flex flex-col justify-between gap-4 hover:border-vinotinto transition">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-vinotinto/40 border border-vinotinto text-white font-bold">
                  {match.categoria_disciplina || match.modalidad} • {match.categoria_nombre || 'Club'}
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    match.estado === 'Finalizado'
                      ? 'bg-neutral-800 text-neutral-300'
                      : 'bg-rojo-fuego/20 text-rojo-fuego'
                  }`}
                >
                  {match.estado}
                </span>
              </div>

              <p className="text-xs text-texto-secundario">{match.torneo}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-xl font-bold text-white">
                  Legión Fénix vs {match.rival}
                </h3>
                {match.estado === 'Finalizado' && (
                  <span className="font-display text-2xl font-extrabold text-rojo-fuego shrink-0">
                    {match.goles_fenix} - {match.goles_rival}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs text-texto-secundario">
              <p className="flex items-center gap-2 text-neutral-300">
                <Calendar className="w-3.5 h-3.5 text-rojo-fuego shrink-0" />
                {new Date(match.fecha_hora).toLocaleString('es-VE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rojo-fuego shrink-0" />
                {match.sede}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
