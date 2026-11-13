import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function FichaMedicaViewModule({ activePlayer }) {
  if (!activePlayer) return null;

  return (
    <section className="card-fenix p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">
            EXPEDIENTE MÉDICO Y EVALUACIÓN PODOLÓGICA
          </h3>
          <p className="text-xs text-texto-secundario">
            Datos clínicos verificados por el Departamento de Fisioterapia Legión Fénix.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-rojo-fuego text-white text-xs font-extrabold">
          Tipo de Sangre: {activePlayer.grupo_sanguineo || 'N/D'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Evaluación Podológica</p>
          <p className="font-bold text-white mt-1">{activePlayer.evaluacion_podologica || 'Sin evaluar'}</p>
        </div>
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Biometría (Peso / Estatura)</p>
          <p className="font-bold text-white mt-1">
            {activePlayer.peso_kg || '--'} kg • {activePlayer.altura_m || '--'} m
          </p>
        </div>
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Condiciones Cardíacas</p>
          <p className="font-bold text-white mt-1">{activePlayer.condiciones_cardiacas || 'Ninguna'}</p>
        </div>
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Alergias</p>
          <p className="font-bold text-white mt-1">{activePlayer.alergias || 'Ninguna'}</p>
        </div>
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Póliza de Seguro Médico</p>
          <p className="font-bold text-white mt-1">{activePlayer.seguro_medico_poliza || 'N/A'}</p>
        </div>
        <div className="bg-[#151515] p-4 rounded-lg border border-neutral-800">
          <p className="text-xs text-texto-secundario">Contacto de Emergencia</p>
          <p className="font-bold text-white mt-1">
            {activePlayer.contacto_emergencia_nombre} ({activePlayer.contacto_emergencia_telefono})
          </p>
        </div>
      </div>

      {activePlayer.observaciones_fisio && (
        <div className="bg-[#151515] border border-vinotinto/60 rounded-lg p-4 text-xs space-y-1">
          <p className="font-bold text-rojo-fuego flex items-center gap-1.5 uppercase tracking-wider">
            <Stethoscope className="w-4 h-4" /> Observaciones del Fisioterapeuta
          </p>
          <p className="text-neutral-200 leading-relaxed">{activePlayer.observaciones_fisio}</p>
        </div>
      )}

      <div className="bg-green-950/30 border border-green-800/60 rounded-lg p-4 text-xs text-green-200 flex items-center justify-between">
        <span>
          <strong>Consentimiento Legal:</strong> Uso de imagen ({activePlayer.uso_imagen ? 'Autorizado' : 'Pendiente'}) • Exoneración médica ({activePlayer.exoneracion_medica ? 'Firmada' : 'Pendiente'})
        </span>
        <span className="font-semibold">Firma: {activePlayer.firma_representante || 'N/A'}</span>
      </div>
    </section>
  );
}
