import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../components/Navbar';
import CategoriasExplorerModule from '../../modules/categorias/CategoriasExplorerModule';
import { getStoredUser } from '../../utils/auth';

export default function CategoriasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const initialCategoryId = router.query.id ? Number(router.query.id) : null;

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Estructura Deportiva: Campo, Fútbol 7 y Sala" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-4">
        {/* Barra de Retorno y Navegación Rápida */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/';
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white transition px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-rojo-fuego" />
            Volver a la página anterior
          </button>
          <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
            Estructura Formativa • Legión Fénix FC
          </span>
        </div>

        <CategoriasExplorerModule user={user} initialCategoryId={initialCategoryId} />
      </main>
    </div>
  );
}
