import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, Shield, UserCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoginForm from '../modules/auth/LoginForm';
import RegisterRepresentanteForm from '../modules/auth/RegisterRepresentanteForm';
import RegisterAdultoForm from '../modules/auth/RegisterAdultoForm';
import { getHomeRouteForRole, getStoredUser } from '../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [regType, setRegType] = useState('representante'); // 'representante' | 'adulto'
  const [error, setError] = useState('');

  useEffect(() => {
    const existing = getStoredUser();
    if (existing?.rol) {
      router.replace(getHomeRouteForRole(existing.rol));
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.tab === 'register') {
      setMode('register');
    } else if (router.query.tab === 'login') {
      setMode('login');
    }
    if (router.query.tipo === 'adulto') {
      setRegType('adulto');
    } else if (router.query.tipo === 'representante' || router.query.tipo === 'menor') {
      setRegType('representante');
    }
  }, [router.isReady, router.query]);

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Autenticación Unificada RBAC" />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div
          className={`w-full card-fenix p-5 sm:p-8 border-vinotinto/70 shadow-fenix transition-all duration-300 ${
            isRegister ? 'max-w-3xl' : 'max-w-md'
          }`}
        >
          <div className="text-center mb-6">
            <img
              src="/assets/logo-legion-fenix.png"
              alt="Escudo Oficial Legión Fénix FC"
              className="w-24 h-24 mx-auto mb-3 object-contain drop-shadow-[0_6px_18px_rgba(225,29,46,0.5)]"
            />
            <h1 className="font-display text-3xl font-extrabold tracking-wide text-white">
              LEGIÓN <span className="text-rojo-fuego">FÉNIX FC</span>
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-plata-fenix mt-0.5">
              EST. 2020 • Rendirse Jamás
            </p>
            <p className="text-xs text-texto-secundario mt-1.5">
              Representantes, Atletas Mayores, Entrenadores, Fisioterapeutas y Administración
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] rounded-lg border border-neutral-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 rounded-md text-xs font-bold transition ${
                mode === 'login' ? 'bg-vinotinto text-white' : 'text-texto-secundario hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 rounded-md text-xs font-bold transition ${
                mode === 'register' ? 'bg-vinotinto text-white' : 'text-texto-secundario hover:text-white'
              }`}
            >
              Nuevo Registro
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <LoginForm onError={setError} onSuccessRedirect={(route) => router.push(route)} />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-[#121212] rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setRegType('representante');
                    setError('');
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                    regType === 'representante'
                      ? 'bg-vinotinto text-white border border-rojo-fuego/60'
                      : 'text-texto-secundario hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Representante (Menores)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegType('adulto');
                    setError('');
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                    regType === 'adulto'
                      ? 'bg-rojo-fuego text-white'
                      : 'text-texto-secundario hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Mayor de Edad (Sub-20 / Libre)
                </button>
              </div>

              {regType === 'representante' ? (
                <RegisterRepresentanteForm
                  onError={setError}
                  onSuccessRedirect={(route) => router.push(route)}
                />
              ) : (
                <RegisterAdultoForm
                  onError={setError}
                  onSwitchToRepresentante={() => {
                    setRegType('representante');
                    setError('');
                  }}
                  onSuccessRedirect={(route) => router.push(route)}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
