import React from 'react';
import { Star, ShieldAlert, Award } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/media';
import { calculateAgeFromBirthDate } from '../../utils/categories';

function getPositionCode(pos = '') {
  const p = pos.toLowerCase();
  if (p.includes('arquero') || p.includes('portero')) return 'POR';
  if (p.includes('central') || p.includes('cierre')) return 'DFC';
  if (p.includes('lateral')) return 'LAT';
  if (p.includes('extremo') || p.includes('ala')) return 'EXT';
  if (p.includes('delantero') || p.includes('pívot') || p.includes('pivot')) return 'DEL';
  if (p.includes('volante') || p.includes('creativo')) return 'MCO';
  return 'MED';
}

// 12 zonas de la cancha vertical (4 filas x 3 cols: filas top->bottom = Ataque, Media-Alta, Media-Baja, Defensa)
function getHeatmapZones(pos = '') {
  const p = pos.toLowerCase();
  if (p.includes('arquero') || p.includes('portero')) {
    return [0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0.2, 1, 0.2];
  }
  if (p.includes('central') || p.includes('cierre')) {
    return [0, 0, 0, 0, 0.25, 0, 0.3, 0.85, 0.3, 0.5, 1, 0.5];
  }
  if (p.includes('lateral')) {
    return [0.4, 0, 0.4, 0.75, 0.2, 0.75, 0.9, 0.3, 0.9, 0.65, 0.2, 0.65];
  }
  if (p.includes('extremo') || p.includes('ala')) {
    return [0.95, 0.65, 0.95, 0.75, 0.85, 0.75, 0.2, 0.45, 0.2, 0, 0, 0];
  }
  if (p.includes('delantero') || p.includes('pívot') || p.includes('pivot')) {
    return [0.7, 1, 0.7, 0.35, 0.85, 0.35, 0, 0.3, 0, 0, 0, 0];
  }
  if (p.includes('volante') || p.includes('creativo')) {
    return [0.45, 0.8, 0.45, 0.7, 1, 0.7, 0.35, 0.65, 0.35, 0, 0.15, 0];
  }
  // Mediocentro mixto / Polivalente
  return [0.25, 0.5, 0.25, 0.55, 0.95, 0.55, 0.5, 0.95, 0.5, 0.2, 0.35, 0.2];
}

export default function PlayerCardModule({ player, evaluation = null, compact = false }) {
  if (!player) return null;

  const evalData = evaluation || player;
  const hasEval =
    evalData.puntaje_global !== null &&
    evalData.puntaje_global !== undefined &&
    Number(evalData.puntaje_global) > 0;

  const globalScore = hasEval ? Number(evalData.puntaje_global) : null;
  const globalPct = hasEval
    ? Number(evalData.porcentaje_global || Math.round(globalScore * 10))
    : null;

  const to100 = (val, fallback = 50) => {
    const num = Number(val);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return Math.max(10, Math.min(100, Math.round(num * 10)));
  };

  const radarStats = [
    { label: 'TIR', val: to100(evalData.tecnica_definicion) },
    { label: 'PAS', val: to100(evalData.tecnica_pase) },
    {
      label: 'FZA',
      val: to100(
        ((Number(evalData.fisica_fuerza || 5) + Number(evalData.fisica_resistencia || 5)) / 2)
      ),
    },
    {
      label: 'COO',
      val: to100(
        ((Number(evalData.coordinativa_agilidad || 5) +
          Number(evalData.coordinativa_equilibrio || 5) +
          Number(evalData.coordinativa_ritmo || 5)) /
          3)
      ),
    },
    { label: 'VEL', val: to100(evalData.fisica_velocidad) },
    { label: 'DRI', val: to100(evalData.tecnica_control) },
  ];

  // Hexágono radar SVG
  const cx = 64;
  const cy = 62;
  const maxR = 40;
  const hexPoint = (idx, ratio) => {
    const angle = -Math.PI / 2 + idx * (Math.PI / 3);
    return [
      Number((cx + Math.cos(angle) * maxR * ratio).toFixed(1)),
      Number((cy + Math.sin(angle) * maxR * ratio).toFixed(1)),
    ];
  };

  const outerPolygon = radarStats.map((_, i) => hexPoint(i, 1).join(',')).join(' ');
  const midPolygon = radarStats.map((_, i) => hexPoint(i, 0.55).join(',')).join(' ');
  const valuePolygon = radarStats
    .map((s, i) => hexPoint(i, hasEval ? s.val / 100 : 0.5).join(','))
    .join(' ');

  const dominantFoot = String(player.pierna_habil || 'Derecha').toLowerCase();
  const leftFootActive = dominantFoot.includes('izq') || dominantFoot.includes('ambi');
  const rightFootActive = dominantFoot.includes('der') || dominantFoot.includes('ambi');

  const zones = getHeatmapZones(player.posicion_habitual);
  const posCode = getPositionCode(player.posicion_habitual);
  const ageValue =
    player.edad !== undefined && player.edad !== null
      ? player.edad
      : calculateAgeFromBirthDate(player.fecha_nacimiento);

  const strengthsList = (evalData.fortalezas || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const weaknessesList = (evalData.debilidades || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  const displayName = `${player.nombre || ''} ${player.apellido || ''}`.trim().toUpperCase();
  const photoUrl = resolveAssetUrl(player.foto_url, '/assets/avatar-player.svg');

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-vinotinto/80 shadow-fenix bg-gradient-to-br from-[#16191f] via-[#121216] to-[#0a0a0d] ${
        compact ? 'text-xs' : ''
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Columna Izquierda + Centro: Información del Jugador */}
        <div className="lg:col-span-8 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Información del jugador
            </h3>
            <div className="flex items-center gap-2 text-[11px]">
              {hasEval ? (
                <span className="px-2.5 py-0.5 rounded-full bg-green-950/70 border border-green-600/70 text-green-300 font-bold">
                  Valoración: {globalScore.toFixed(1)} / 10 ({globalPct}%)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-semibold">
                  Sin evaluación técnica registrada
                </span>
              )}
            </div>
          </div>

          <p className="font-display text-xl sm:text-2xl font-extrabold tracking-wide text-white">
            {displayName}
          </p>

          {/* Fila Superior: Rating + Pie Hábil | Radar Hexagonal | Mini Mapa Cancha */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Score & Pies */}
            <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-start justify-between gap-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-vinotinto text-white text-[11px] font-extrabold tracking-wider border border-rojo-fuego/60">
                  {posCode}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold leading-none text-white">
                    {hasEval ? globalPct : '--'}
                  </span>
                  {hasEval && (
                    <span className="text-xs font-bold text-cyan-300">
                      ({globalScore.toFixed(1)})
                    </span>
                  )}
                </div>
              </div>

              {/* Icono Dual de Botines / Pie Hábil */}
              <div className="flex items-center gap-2" title={`Pie hábil: ${player.pierna_habil || 'Derecha'}`}>
                <svg viewBox="0 0 64 46" className="w-14 h-10">
                  {/* Pie Izquierdo */}
                  <path
                    d="M17 6 C12 6, 9 12, 10 20 C11 26, 10 31, 11 37 C12 41, 18 42, 22 39 C25 36, 25 29, 24 23 C23 16, 23 6, 17 6 Z"
                    fill={leftFootActive ? '#22d3ee' : '#3a3d45'}
                    stroke="#0d0d10"
                    strokeWidth="1.5"
                  />
                  {/* Pie Derecho */}
                  <path
                    d="M47 6 C52 6, 55 12, 54 20 C53 26, 54 31, 53 37 C52 41, 46 42, 42 39 C39 36, 39 29, 40 23 C41 16, 41 6, 47 6 Z"
                    fill={rightFootActive ? '#22d3ee' : '#3a3d45'}
                    stroke="#0d0d10"
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="text-[10px] text-neutral-300 font-semibold leading-tight">
                  Pie:
                  <br />
                  <strong className="text-white">{player.pierna_habil || 'Derecha'}</strong>
                </span>
              </div>
            </div>

            {/* Gráfica Radar Hexagonal */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <svg viewBox="0 0 128 124" className="w-36 h-32">
                <polygon
                  points={outerPolygon}
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                />
                <polygon
                  points={midPolygon}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                {radarStats.map((_, i) => {
                  const [x2, y2] = hexPoint(i, 1);
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="0.8"
                    />
                  );
                })}
                <polygon
                  points={valuePolygon}
                  fill={hasEval ? 'rgba(34, 211, 238, 0.36)' : 'rgba(122, 0, 30, 0.35)'}
                  stroke={hasEval ? '#22d3ee' : '#D32F2F'}
                  strokeWidth="1.8"
                />
                {radarStats.map((stat, i) => {
                  const [lx, ly] = hexPoint(i, 1.24);
                  return (
                    <text
                      key={stat.label}
                      x={lx}
                      y={ly + 3}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="700"
                      fill="#e5e7eb"
                    >
                      {stat.label}
                    </text>
                  );
                })}
              </svg>
              {hasEval && (
                <div className="flex items-center gap-2 text-[10px] text-texto-secundario -mt-1">
                  <span>Fís: <strong className="text-white">{Number(evalData.score_fisica || 0).toFixed(1)}</strong></span>
                  <span>•</span>
                  <span>Téc: <strong className="text-white">{Number(evalData.score_tecnica || 0).toFixed(1)}</strong></span>
                  <span>•</span>
                  <span>Coo: <strong className="text-white">{Number(evalData.score_coordinativa || 0).toFixed(1)}</strong></span>
                </div>
              )}
            </div>

            {/* Mini Cancha Heatmap de Influencia */}
            <div className="sm:col-span-4 flex flex-col items-center">
              <svg
                viewBox="0 0 90 120"
                className="w-24 h-32 rounded border border-white/25 bg-[#101419]"
              >
                {/* 12 celdas heatmap */}
                {zones.map((intensity, idx) => {
                  const row = Math.floor(idx / 3);
                  const col = idx % 3;
                  const fill =
                    intensity >= 0.85
                      ? '#a3e635'
                      : intensity >= 0.55
                      ? '#2dd4bf'
                      : intensity > 0
                      ? 'rgba(45, 212, 191, 0.35)'
                      : 'transparent';
                  return (
                    <rect
                      key={idx}
                      x={4 + col * 27.3}
                      y={4 + row * 28}
                      width="27.3"
                      height="28"
                      fill={fill}
                      fillOpacity={intensity > 0 ? 0.72 : 0}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="0.6"
                    />
                  );
                })}
                {/* Líneas cancha */}
                <rect x="4" y="4" width="82" height="112" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
                <line x1="4" y1="60" x2="86" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                <circle cx="45" cy="60" r="10" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <rect x="24" y="4" width="42" height="16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <rect x="24" y="100" width="42" height="16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
              </svg>
              <span className="text-[10px] text-texto-secundario mt-1">Mapa de Acción</span>
            </div>
          </div>

          {/* Tabla Metadatos estilo Ficha Técnica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs pt-1">
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Disciplina</span>
              <span className="font-bold text-white uppercase">
                {player.categoria_modalidad || 'Campo'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Categoría</span>
              <span className="font-bold text-white uppercase">
                {player.categoria_nombre || 'Por asignar'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Posición / Dorsal</span>
              <span className="font-bold text-white">
                {player.posicion_habitual || 'Polivalente'} (#{player.dorsal || 'S/N'})
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Edad</span>
              <span className="font-bold text-white">
                {ageValue !== null && ageValue !== undefined ? `${ageValue} años` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Documento / Cédula</span>
              <span className="font-bold text-amber-300 font-mono">
                {player.dni_cedula || '--'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Estatura / Peso</span>
              <span className="font-bold text-white">
                {player.altura_m ? `${player.altura_m} m` : '--'} /{' '}
                {player.peso_kg ? `${player.peso_kg} kg` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Club</span>
              <span className="font-bold text-rojo-fuego uppercase">Legión Fénix</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Talla Camisa / Shorts</span>
              <span className="font-bold text-white">
                {player.talla_camiseta || 'N/D'} / {player.talla_short || 'N/D'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-neutral-400">Talla Zapatos</span>
              <span className="font-bold text-amber-300">
                {player.talla_zapatos || 'Por registrar'}
              </span>
            </div>
          </div>

          {/* Fortalezas y Debilidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Fortalezas Destacadas
              </p>
              {strengthsList.length > 0 ? (
                <div className="space-y-1">
                  {strengthsList.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-white/10 text-neutral-100"
                    >
                      <span>{st}</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500">
                  Pendiente evaluación técnica del entrenador.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rojo-fuego" /> Aspectos a Mejorar
              </p>
              {weaknessesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {weaknessesList.map((wk, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-rojo-fuego/15 border border-rojo-fuego/40 text-red-200 font-semibold"
                    >
                      {wk}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500">
                  Rendimiento equilibrado en todos los bloques.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Retrato Oficial del Jugador */}
        <div className="lg:col-span-4 relative bg-gradient-to-b from-vinotinto/40 via-[#18070d] to-[#0a0a0d] flex flex-col items-center justify-end p-5 min-h-[260px] border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <img
              src="/assets/logo-legion-fenix.png"
              alt="Legión Fénix FC"
              className="w-10 h-10 object-contain drop-shadow"
            />
            <span className="font-display text-3xl font-extrabold text-white/30">
              #{player.dorsal || '--'}
            </span>
          </div>

          <img
            src={photoUrl}
            alt={displayName}
            className="w-44 h-52 sm:w-52 sm:h-60 object-cover rounded-2xl border-2 border-vinotinto/80 shadow-2xl bg-[#101015] mt-8"
          />

          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">
              Ficha Deportiva Legión Fénix
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
