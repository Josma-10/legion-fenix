import React, { useState } from 'react';
import { Newspaper, Award, ArrowRight, X } from 'lucide-react';

export default function NoticiasMuralModule({ news = [], sponsors = [] }) {
  const [selectedNews, setSelectedNews] = useState(null);

  return (
    <>
      {/* NOTICIAS DESTACADAS */}
      <section id="noticias" className="space-y-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" /> Actualidad del Club
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            NOTICIAS DESTACADAS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <article
              key={item.id_noticia}
              className="card-fenix overflow-hidden flex flex-col justify-between group hover:border-rojo-fuego/70 transition"
            >
              <div>
                <div className="relative h-44 bg-[#161616] overflow-hidden">
                  <img
                    src={item.imagen_url || '/assets/news-match.svg'}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-vinotinto text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded">
                    {item.categoria_noticia}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-white leading-snug">{item.titulo}</h3>
                  <p className="text-sm text-texto-secundario mt-2 line-clamp-3">{item.resumen}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setSelectedNews(item)}
                  className="text-xs font-bold text-rojo-fuego hover:text-white inline-flex items-center gap-1 transition"
                >
                  Leer crónica completa <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MURAL DE PATROCINADORES */}
      <section id="patrocinadores" className="card-fenix p-6 sm:p-8 border-vinotinto/50">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego inline-flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Aliados Institucionales
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            MURAL DE PATROCINADORES
          </h2>
          <p className="text-xs sm:text-sm text-texto-secundario mt-1">
            Empresas e instituciones que impulsan la formación deportiva y médica de nuestra cantera.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {sponsors.map((sp) => (
            <div
              key={sp.id_patrocinador}
              className="bg-[#151515] border border-neutral-800 hover:border-rojo-fuego rounded-xl p-4 flex flex-col items-center text-center transition"
            >
              <img
                src={sp.logo_url || '/assets/sponsor-gold.svg'}
                alt={sp.nombre}
                className="w-full h-16 object-contain mb-2"
              />
              <span className="text-xs font-bold text-white">{sp.nombre}</span>
              <span className="text-[10px] text-texto-secundario mt-0.5">{sp.rubro}</span>
              <span className="mt-2 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-vinotinto/40 text-white">
                Nivel {sp.nivel}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Modal lector de noticia */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-fenix max-w-2xl w-full overflow-hidden border-vinotinto">
            <div className="relative h-52 bg-[#161616]">
              <img
                src={selectedNews.imagen_url || '/assets/news-match.svg'}
                alt={selectedNews.titulo}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-rojo-fuego"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <span className="text-xs font-bold uppercase text-rojo-fuego">
                {selectedNews.categoria_noticia}
              </span>
              <h3 className="font-display text-2xl font-extrabold text-white">
                {selectedNews.titulo}
              </h3>
              <p className="text-sm text-neutral-200 leading-relaxed">{selectedNews.contenido}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
