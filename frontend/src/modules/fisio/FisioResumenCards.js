import React from 'react';

export default function FisioResumenCards({ stats = {}, playersCount = 0 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card-fenix p-4 border-l-4 border-l-rojo-fuego">
        <p className="text-[11px] uppercase text-texto-secundario font-bold">En Tratamiento Activo</p>
        <p className="font-display text-3xl font-extrabold text-rojo-fuego mt-1">
          {stats.en_tratamiento || 0}
        </p>
      </div>
      <div className="card-fenix p-4 border-l-4 border-l-amber-500">
        <p className="text-[11px] uppercase text-texto-secundario font-bold">En Readaptación</p>
        <p className="font-display text-3xl font-extrabold text-amber-400 mt-1">
          {stats.readaptacion || 0}
        </p>
      </div>
      <div className="card-fenix p-4 border-l-4 border-l-green-500">
        <p className="text-[11px] uppercase text-texto-secundario font-bold">Altas Médicas</p>
        <p className="font-display text-3xl font-extrabold text-green-400 mt-1">
          {stats.alta_medica || 0}
        </p>
      </div>
      <div className="card-fenix p-4 border-l-4 border-l-vinotinto">
        <p className="text-[11px] uppercase text-texto-secundario font-bold">Fichas Bajo Control</p>
        <p className="font-display text-3xl font-extrabold text-white mt-1">
          {playersCount}
        </p>
      </div>
    </div>
  );
}
