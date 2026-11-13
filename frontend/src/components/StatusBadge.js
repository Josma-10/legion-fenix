import React from 'react';

export default function StatusBadge({ estado }) {
  switch (estado) {
    case 'Pagado':
    case 'Solvente':
      return (
        <span className="inline-flex items-center gap-1.5 bg-green-950/90 border border-green-700/60 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {estado === 'Pagado' ? 'Pagado / Solvente' : 'Solvente'}
        </span>
      );
    case 'Pendiente':
      return (
        <span className="inline-flex items-center gap-1.5 bg-yellow-950/90 border border-yellow-600/60 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          Pendiente
        </span>
      );
    case 'Vencido':
    case 'Moroso':
      return (
        <span className="inline-flex items-center gap-1.5 bg-rojo-fuego text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-fuego">
          <span className="w-2 h-2 rounded-full bg-white" />
          Moroso (Bloqueado)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center bg-neutral-800 text-texto-secundario px-3 py-1 rounded-full text-xs font-semibold">
          {estado}
        </span>
      );
  }
}
