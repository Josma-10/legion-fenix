import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Stethoscope, Box, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/Navbar';
import FisioResumenCards from '../../modules/fisio/FisioResumenCards';
import InjuryBodyMapModule from '../../modules/fisio/InjuryBodyMapModule';
import PodologiaBiometriaModule from '../../modules/fisio/PodologiaBiometriaModule';
import FisioRehabBoardModule from '../../modules/fisio/FisioRehabBoardModule';
import api from '../../utils/api';
import { useAuthGuard } from '../../utils/auth';

export default function PortalFisio() {
  const { user, checking } = useAuthGuard(['FISIO']);
  const [activeTab, setActiveTab] = useState('mapa'); // mapa | biometria | ejercicios3d
  const [data, setData] = useState({ injuries: [], players: [], stats: {} });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [fisioRes, catRes] = await Promise.all([
        api.get('/fisio/dashboard'),
        api.get('/categorias'),
      ]);
      setData(fisioRes.data);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Error cargando portal fisioterapia:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking && user) {
      loadDashboard();
    }
  }, [checking, user, loadDashboard]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-negro-fondo text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-vinotinto border-t-rojo-fuego rounded-full animate-spin mx-auto" />
          <p className="text-sm text-texto-secundario">Cargando Departamento de Fisioterapia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-negro-fondo text-white flex flex-col">
      <Navbar subtitle="Portal de Fisioterapia y Medicina Deportiva" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1">
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
            Departamento Fisioterapéutico • Legión Fénix FC
          </span>
        </div>

        <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego">
              Departamento Médico Legión Fénix
            </span>
            <h1 className="font-display text-3xl font-extrabold text-white">
              FISIOTERAPIA, LESIONES Y READAPTACIÓN EN CANCHA
            </h1>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-vinotinto/40 border border-vinotinto font-bold text-white shrink-0">
            Especialista: {user?.nombre}
          </span>
        </div>

        <FisioResumenCards stats={data.stats} playersCount={data.players.length} />

        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('mapa')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'mapa'
                ? 'bg-vinotinto text-white'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Pacientes Activos y Reportes Entrenadores
          </button>
          <button
            onClick={() => setActiveTab('biometria')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'biometria'
                ? 'bg-vinotinto text-white'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Evaluación Podológica y Biometría
          </button>
          <button
            onClick={() => setActiveTab('ejercicios3d')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'ejercicios3d'
                ? 'bg-vinotinto text-white'
                : 'bg-gris-tarjeta text-texto-secundario hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" /> Ejercicios Fisio 2D (Herramientas Clínicas)
          </button>
        </div>

        {activeTab === 'mapa' && (
          <InjuryBodyMapModule
            injuries={data.injuries}
            players={data.players}
            onUpdated={loadDashboard}
          />
        )}

        {activeTab === 'biometria' && (
          <PodologiaBiometriaModule players={data.players} onUpdated={loadDashboard} />
        )}

        {activeTab === 'ejercicios3d' && (
          <FisioRehabBoardModule
            categories={categories}
            players={data.players}
            isAdmin={user?.rol === 'ADMINISTRADOR'}
          />
        )}
      </main>
    </div>
  );
}
