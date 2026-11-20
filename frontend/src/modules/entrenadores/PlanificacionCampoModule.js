import React, { useState } from 'react';
import {
  ClipboardList,
  Box,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Crosshair,
  Shield,
  Sword,
  Goal,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import MicrociclosModule from './MicrociclosModule';
import Trabajos3DSchedulerModule from './Trabajos3DSchedulerModule';

export default function PlanificacionCampoModule({
  microciclos = [],
  trabajos = [],
  categories = [],
  players = [],
  isAdmin = false,
  onOpenInTacticalBoard,
  onReloadDashboard,
}) {
  const [subView, setSubView] = useState('ambos'); // 'ambos', 'microciclos', 'cancha'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera Unificada */}
      <div className="card-fenix p-5 border-l-4 border-l-vinotinto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-vinotinto/30 border border-vinotinto text-white text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rojo-fuego" /> Planificación Táctica & Trabajo en Cancha
            </span>
            <span className="text-xs text-neutral-400 font-semibold">• Módulo Unificado</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            MICROCICLOS & TRABAJO DE CAMPO
          </h2>
          <p className="text-xs text-texto-secundario max-w-2xl">
            Centro de control unificado: sincroniza los objetivos pedagógicos semanales (Porteros, Defensa, Ataque) con la asignación horaria de espacios en cancha, cuadrantes y tareas de entrenamiento.
          </p>
        </div>

        {/* Selector de Vista Interna */}
        <div className="flex items-center gap-1.5 bg-[#121216] p-1.5 rounded-xl border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('ambos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              subView === 'ambos'
                ? 'bg-vinotinto text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Vista Integral
          </button>
          <button
            type="button"
            onClick={() => setSubView('microciclos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subView === 'microciclos'
                ? 'bg-vinotinto text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Microciclos ({microciclos.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('cancha')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subView === 'cancha'
                ? 'bg-vinotinto text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Cancha & Horarios ({trabajos.length})
          </button>
        </div>
      </div>

      {/* Vista de Microciclos Semanales */}
      {(subView === 'ambos' || subView === 'microciclos') && (
        <div className="space-y-4">
          {subView === 'ambos' && (
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rojo-fuego" />
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                1. Planificación de Microciclos Semanales (Objetivos & Bloques)
              </h3>
            </div>
          )}
          <MicrociclosModule
            microciclos={microciclos}
            categories={categories}
            onReload={onReloadDashboard}
          />
        </div>
      )}

      {/* Separador cuando están ambos activos */}
      {subView === 'ambos' && (
        <div className="border-t border-neutral-800/80 my-6" />
      )}

      {/* Vista de Trabajo en Cancha y Agenda */}
      {(subView === 'ambos' || subView === 'cancha') && (
        <div className="space-y-4">
          {subView === 'ambos' && (
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-dorado-fenix" />
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                2. Programación de Sesiones en Cancha, Espacios y Cuadrantes
              </h3>
            </div>
          )}
          <Trabajos3DSchedulerModule
            mode="ENTRENADOR"
            categories={categories}
            players={players}
            isAdmin={isAdmin}
            onReloadDashboard={onReloadDashboard}
            onOpenInTacticalBoard={onOpenInTacticalBoard}
          />
        </div>
      )}
    </div>
  );
}
