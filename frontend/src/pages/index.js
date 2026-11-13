import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import HeroSliderModule from '../modules/publico/HeroSliderModule';
import DisciplinasGrid from '../modules/categorias/DisciplinasGrid';
import FixturePublicModule from '../modules/publico/FixturePublicModule';
import TarifasCondicionesModule from '../modules/publico/TarifasCondicionesModule';
import TiendaOficialModule from '../modules/tienda/TiendaOficialModule';
import NoticiasMuralModule from '../modules/publico/NoticiasMuralModule';
import HinchadaMediaSocialModule from '../modules/publico/HinchadaMediaSocialModule';
import api from '../utils/api';

export default function HomePublico() {
  const [data, setData] = useState({
    nextMatch: null,
    fixtures: [],
    news: [],
    products: [],
    sponsors: [],
    gallery: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [modalidadFilter, setModalidadFilter] = useState('Todas');

  const loadHome = async () => {
    try {
      const res = await api.get('/public/home');
      setData(res.data);
    } catch (err) {
      console.error('Error cargando portal público:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Portal Oficial de la Hinchada" />

      <HeroSliderModule nextMatch={data.nextMatch} loading={loading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16 flex-1 w-full">
        <DisciplinasGrid
          categories={data.categories}
          onSelectDisciplineFixture={setModalidadFilter}
        />

        <TarifasCondicionesModule />

        <FixturePublicModule
          fixtures={data.fixtures}
          modalidadFilter={modalidadFilter}
          onChangeModalidadFilter={setModalidadFilter}
        />

        <TiendaOficialModule products={data.products} />

        <HinchadaMediaSocialModule
          gallery={data.gallery || []}
          onMediaCreated={loadHome}
        />

        <NoticiasMuralModule news={data.news} sponsors={data.sponsors} />
      </main>

      <footer className="border-t border-rojo-fuego/30 bg-[#08080a] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-texto-secundario">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-legion-fenix.png"
              alt="Escudo Legión Fénix FC"
              className="w-9 h-9 object-contain"
            />
            <div>
              <p className="font-bold text-white">Club &amp; Academia Legión Fénix FC</p>
              <p className="text-[11px] text-texto-secundario">
                © {new Date().getFullYear()} • EST. 2020 • Rendirse Jamás
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/categorias" className="hover:text-white">Categorías y Disciplinas</Link>
            <Link href="/login" className="hover:text-white">Portal Representantes</Link>
            <Link href="/login" className="hover:text-white">Cuerpo Técnico</Link>
            <Link href="/login" className="hover:text-white">Fisioterapia</Link>
            <Link href="/login" className="hover:text-white">Administración</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
