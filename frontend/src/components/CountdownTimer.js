import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0, expired: false });

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ dias: 0, horas: 0, minutos: 0, segundos: 0, expired: true });
        return;
      }
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diff / (1000 * 60)) % 60);
      const segundos = Math.floor((diff / 1000) % 60);
      setTimeLeft({ dias, horas, minutos, segundos, expired: false });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  if (timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-2 bg-rojo-fuego/20 border border-rojo-fuego text-white px-4 py-2 rounded-lg text-sm font-bold">
        <Clock className="w-4 h-4 text-rojo-fuego animate-pulse" />
        ¡DÍA DE PARTIDO EN CURSO!
      </div>
    );
  }

  const boxes = [
    { label: 'DÍAS', value: timeLeft.dias },
    { label: 'HORAS', value: timeLeft.horas },
    { label: 'MIN', value: timeLeft.minutos },
    { label: 'SEG', value: timeLeft.segundos },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {boxes.map((b) => (
        <div
          key={b.label}
          className="bg-[#121212] border border-vinotinto/80 rounded-lg px-3 py-2 text-center min-w-[58px] shadow"
        >
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-none">
            {String(b.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] tracking-widest text-rojo-fuego font-bold mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}
