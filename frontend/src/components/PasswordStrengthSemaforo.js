import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';

export function evaluatePasswordSemaforo(password = '') {
  const pwd = String(password || '');
  const checks = {
    length: pwd.length >= 8 && pwd.length <= 20,
    upper: /[A-ZÁÉÍÓÚÑ]/.test(pwd),
    lower: /[a-záéíóúñ]/.test(pwd),
    number: /[0-9]/.test(pwd),
    symbol: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(pwd),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const isValid = passedCount === 5;

  let level = 'empty';
  let statusText = 'Ingresa una clave (8–20 car., mayús., minús., número y signo)';
  if (pwd.length > 0) {
    if (isValid) {
      level = 'green';
      statusText = 'Segura — Clave aceptada (Semáforo Verde)';
    } else if (pwd.length > 20) {
      level = 'red';
      statusText = 'Máximo 20 caracteres permitidos';
    } else if (passedCount >= 3) {
      level = 'yellow';
      statusText = `Intermedia (${passedCount}/5) — Completa los requisitos restantes`;
    } else {
      level = 'red';
      statusText = `Débil (${passedCount}/5) — Agrega mayús., minús., números y signos`;
    }
  }

  return { checks, passedCount, isValid, level, statusText };
}

export default function PasswordStrengthSemaforo({ password = '' }) {
  const { checks, passedCount, level, statusText } = evaluatePasswordSemaforo(password);

  const items = [
    { key: 'length', label: '8–20 caracteres', ok: checks.length },
    { key: 'upper', label: 'Mayúscula (A-Z)', ok: checks.upper },
    { key: 'lower', label: 'Minúscula (a-z)', ok: checks.lower },
    { key: 'number', label: 'Número (0-9)', ok: checks.number },
    { key: 'symbol', label: 'Signo (!@#$*)', ok: checks.symbol },
  ];

  const barWidth = password ? `${Math.max(12, Math.round((passedCount / 5) * 100))}%` : '0%';
  const barColor =
    level === 'green'
      ? 'bg-green-500'
      : level === 'yellow'
      ? 'bg-amber-400'
      : level === 'red'
      ? 'bg-rojo-fuego'
      : 'bg-neutral-700';

  const textColor =
    level === 'green'
      ? 'text-green-400'
      : level === 'yellow'
      ? 'text-amber-300'
      : level === 'red'
      ? 'text-rojo-fuego'
      : 'text-texto-secundario';

  return (
    <div className="mt-2 bg-[#141414] border border-neutral-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-rojo-fuego" />
          Semáforo de Seguridad
        </span>

        {/* 3 Luces del Semáforo */}
        <div className="flex items-center gap-1.5 bg-[#0d0d0d] px-2 py-1 rounded-full border border-neutral-800">
          <span
            title="Rojo: Débil"
            className={`w-2.5 h-2.5 rounded-full transition ${
              level === 'red'
                ? 'bg-rojo-fuego shadow-[0_0_8px_#D32F2F]'
                : 'bg-neutral-800'
            }`}
          />
          <span
            title="Amarillo: Intermedia"
            className={`w-2.5 h-2.5 rounded-full transition ${
              level === 'yellow'
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-neutral-800'
            }`}
          />
          <span
            title="Verde: Segura y válida"
            className={`w-2.5 h-2.5 rounded-full transition ${
              level === 'green'
                ? 'bg-green-500 shadow-[0_0_8px_#22c55e]'
                : 'bg-neutral-800'
            }`}
          />
        </div>
      </div>

      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: barWidth }} />
      </div>

      <p className={`text-[11px] font-semibold ${textColor}`}>{statusText}</p>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {items.map((it) => (
          <span
            key={it.key}
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
              it.ok
                ? 'bg-green-950/60 border-green-700/70 text-green-300'
                : 'bg-[#101010] border-neutral-800 text-neutral-400'
            }`}
          >
            {it.ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5 text-neutral-600" />}
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
