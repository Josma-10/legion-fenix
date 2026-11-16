import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Menu,
  X,
  LogOut,
  Shield,
  Users,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { clearSession, getStoredUser } from '../utils/auth';

export default function Navbar({ subtitle = null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [router.asPath]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    router.push('/login');
  };

  const canSeeParents =
    user &&
    (user.rol === 'ADMINISTRADOR' || user.rol === 'REPRESENTANTE' || user.rol === 'ATLETA');
  const canSeeCoach = user && (user.rol === 'ADMINISTRADOR' || user.rol === 'ENTRENADOR');
  const canSeeFisio = user && (user.rol === 'ADMINISTRADOR' || user.rol === 'FISIO');
  const canSeeAdmin =
    user && (user.rol === 'ADMINISTRADOR' || user.rol === 'ANALISTA_ADMIN');
  const parentPortalLabel = user?.rol === 'ATLETA' ? 'Mi Portal Atleta' : 'Portal Representantes';
  const adminPortalLabel = user?.rol === 'ANALISTA_ADMIN' ? 'Panel Operativo' : 'Panel Admin';

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur border-b border-vinotinto/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Marca Institucional */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
          <img
            src="/assets/logo-legion-fenix.png"
            alt="Escudo Oficial Legión Fénix FC"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-[0_2px_10px_rgba(225,29,46,0.55)] group-hover:scale-105 transition shrink-0"
          />
          <div className="min-w-0">
            <div className="font-display text-lg sm:text-2xl font-extrabold tracking-wider text-white leading-none group-hover:text-rojo-fuego transition truncate">
              LEGIÓN <span className="text-rojo-fuego">FÉNIX</span> <span className="text-plata-fenix text-sm sm:text-lg">FC</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-texto-secundario tracking-wide truncate max-w-[140px] sm:max-w-[210px] xl:max-w-none">
              {subtitle || 'EST. 2020 • Rendirse Jamás'}
            </p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden xl:flex items-center gap-1.5 text-xs xl:text-sm">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition ${
              router.pathname === '/'
                ? 'bg-vinotinto text-white font-semibold'
                : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            Hinchada
          </Link>

          <Link
            href="/categorias"
            className={`px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
              router.pathname.startsWith('/categorias')
                ? 'bg-vinotinto text-white font-semibold'
                : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            Categorías
          </Link>

          <Link
            href="/#tarifas"
            className="px-3 py-2 rounded-lg text-texto-secundario hover:text-white hover:bg-neutral-800/70 transition"
          >
            Tarifas
          </Link>

          {canSeeParents && (
            <Link
              href="/portal-padres"
              className={`px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
                router.pathname.startsWith('/portal-padres')
                  ? 'bg-vinotinto text-white font-semibold'
                  : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
              }`}
            >
              <Users className="w-4 h-4" />
              {parentPortalLabel}
            </Link>
          )}

          {canSeeCoach && (
            <Link
              href="/portal-coach"
              className={`px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
                router.pathname.startsWith('/portal-coach')
                  ? 'bg-vinotinto text-white font-semibold'
                  : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Entrenadores
            </Link>
          )}

          {canSeeFisio && (
            <Link
              href="/portal-fisio"
              className={`px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
                router.pathname.startsWith('/portal-fisio')
                  ? 'bg-vinotinto text-white font-semibold'
                  : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              Portal Fisio
            </Link>
          )}

          {canSeeAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
                router.pathname.startsWith('/admin')
                  ? 'bg-vinotinto text-white font-semibold'
                  : 'text-texto-secundario hover:text-white hover:bg-neutral-800/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {adminPortalLabel}
            </Link>
          )}
        </nav>

        {/* Zona derecha: Estado de Sesión / Login + Menú Móvil */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user.nombre}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rojo-fuego">
                  <Shield className="w-3 h-3" /> {user.rol}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-neutral-800 hover:bg-rojo-fuego text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-cta text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 whitespace-nowrap inline-flex items-center gap-1.5 shadow-fuego"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Ingresar al Portal</span>
            </Link>
          )}

          {/* Botón menú móvil y tablet */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="xl:hidden p-2 rounded-lg bg-gris-tarjeta border border-neutral-800 hover:border-rojo-fuego text-white transition shrink-0"
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div className="xl:hidden bg-gris-tarjeta border-t border-neutral-800 px-4 py-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
          >
            Portal Público (Hinchada)
          </Link>
          <Link
            href="/categorias"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
          >
            Categorías y Disciplinas
          </Link>
          <Link
            href="/#tarifas"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40 text-amber-300"
          >
            Tarifas Oficiales (Bs.)
          </Link>
          {canSeeParents && (
            <Link
              href="/portal-padres"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
            >
              {parentPortalLabel}
            </Link>
          )}
          {canSeeCoach && (
            <Link
              href="/portal-coach"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
            >
              Portal Entrenadores
            </Link>
          )}
          {canSeeFisio && (
            <Link
              href="/portal-fisio"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
            >
              Portal Fisio y Clínica
            </Link>
          )}
          {canSeeAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-vinotinto/40"
            >
              {adminPortalLabel}
            </Link>
          )}
          <div className="pt-2 border-t border-neutral-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{user.nombre}</p>
                  <p className="text-xs text-rojo-fuego font-semibold">{user.rol}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-rojo-fuego text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-cta w-full text-sm"
              >
                Ingresar al Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
