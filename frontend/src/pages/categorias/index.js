import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <CategoriasExplorerModule user={user} initialCategoryId={initialCategoryId} />
      </main>
    </div>
  );
}
