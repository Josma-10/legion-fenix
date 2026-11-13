import React, { useRef, useState } from 'react';
import { getTokenId } from '../utils/tacticalMoves';

function getSpaceOverlayBox(espacio = '') {
  if (espacio === 'Media Cancha Norte') {
    return { top: '3%', height: '47%', bg: 'rgba(211, 47, 47, 0.16)', border: 'rgba(251, 191, 36, 0.65)' };
  }
  if (espacio === 'Media Cancha Sur') {
    return { top: '50%', height: '47%', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(52, 211, 153, 0.7)' };
  }
  if (espacio === 'Tercio Central') {
    return { top: '32%', height: '36%', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(251, 191, 36, 0.7)' };
  }
  if (espacio === 'Zona Readaptación') {
    return { top: '73%', height: '24%', bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.75)' };
  }
  if (espacio === 'Cancha Completa') {
    return { top: '3%', height: '94%', bg: 'rgba(122, 0, 30, 0.08)', border: 'rgba(255, 255, 255, 0.28)' };
  }
  return null;
}

function getTrajectoryStroke(kind) {
  switch (kind) {
    case 'pase_corto':
      return { color: '#fde047', dash: '3 3', width: 2.5, marker: 'url(#arrow-balon)' };
    case 'pase_largo':
      return { color: '#f97316', dash: '8 3', width: 3.1, marker: 'url(#arrow-pase-largo)' };
    case 'balon':
      return { color: '#fbbf24', dash: '6 4', width: 2.6, marker: 'url(#arrow-balon)' };
    case 'disparo':
      return { color: '#ef4444', dash: '', width: 3.4, marker: 'url(#arrow-disparo)' };
    case 'zigzag':
      return { color: '#22d3ee', dash: '4 3', width: 2.6, marker: 'url(#arrow-zigzag)' };
    case 'defensa':
      return { color: '#a855f7', dash: '5 3', width: 2.4, marker: 'url(#arrow-defensa)' };
    case 'recta':
    default:
      return { color: '#34d399', dash: '', width: 2.4, marker: 'url(#arrow-recta)' };
  }
}

/**
 * Cancha 2D completamente derecha y plana (0 grados), con diseño visual distinto según modalidad:
 * - 'Campo': Césped natural a franjas FIFA, área grande + área chica + semicírculo penal + 4 esquinas
 * - 'F7': Césped sintético brillante, área semicircular amplia F7 + líneas punteadas de fuera de juego
 * - 'Sala': Tabloncillo azul/vinotinto indoor 40x20, semicírculo de portería sólido, doble punto penal y zona de cambios
 */
export default function Pitch2DBoard({
  modalidad = 'Campo',
  tokens = [],
  balon = { x: 50, y: 50 },
  hideBall = false,
  trajectories = [],
  showTrajectories = true,
  highlightSpace = '',
  selectedTokenId = null,
  isPlaying = false,
  interactive = true,
  cursorCrosshair = false,
  onSelectToken,
  onMoveToken,
  onPitchClick,
  compactSize = false,
}) {
  const boardRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const didDragRef = useRef(false);

  const normMod = modalidad === 'Sala' ? 'Sala' : modalidad === 'F7' ? 'F7' : 'Campo';
  const spaceBox = highlightSpace ? getSpaceOverlayBox(highlightSpace) : null;

  const extractCoords = (clientX, clientY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = Number(Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100)).toFixed(1));
    const y = Number(Math.max(3, Math.min(97, ((clientY - rect.top) / rect.height) * 100)).toFixed(1));
    return { x, y };
  };

  const handlePointerMove = (e) => {
    if (!interactive || !draggingId || !boardRef.current || isPlaying) return;
    didDragRef.current = true;
    const { x, y } = extractCoords(e.clientX, e.clientY);
    if (onMoveToken) onMoveToken(draggingId, x, y);
  };

  const handleBoardClick = (e) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!interactive || !boardRef.current || isPlaying) return;
    const { x, y } = extractCoords(e.clientX, e.clientY);
    if (onPitchClick) onPitchClick(x, y);
  };

  const backgroundStyle =
    normMod === 'Sala'
      ? {
          background:
            'radial-gradient(circle at 50% 50%, #1c3a6e 0%, #13284d 68%, #0d1a33 100%)',
          boxShadow: 'inset 0 0 0 12px #58091d',
        }
      : normMod === 'F7'
      ? {
          background:
            'repeating-linear-gradient(180deg, #144d2a 0px, #144d2a 32px, #185b33 32px, #185b33 64px)',
        }
      : {
          background:
            'repeating-linear-gradient(180deg, #11361e 0px, #11361e 40px, #154225 40px, #154225 80px)',
        };

  return (
    <div
      ref={boardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDraggingId(null)}
      onPointerLeave={() => setDraggingId(null)}
      onClick={handleBoardClick}
      className={`relative w-full aspect-[3/4] ${
        compactSize ? 'max-h-[480px]' : 'max-h-[560px]'
      } mx-auto rounded-xl overflow-hidden select-none touch-none border-2 ${
        normMod === 'Sala'
          ? 'border-rojo-fuego/80'
          : normMod === 'F7'
          ? 'border-emerald-400/70'
          : 'border-emerald-600/80'
      } shadow-2xl ${cursorCrosshair ? 'cursor-crosshair' : ''}`}
      style={backgroundStyle}
    >
      {/* Etiqueta sutil de modalidad arriba */}
      <div className="absolute top-1.5 right-2.5 z-10 pointer-events-none">
        <span className="px-2 py-0.5 rounded bg-black/55 border border-white/15 text-[9px] font-extrabold uppercase tracking-widest text-white/85">
          {normMod === 'Sala'
            ? 'FÚTBOL SALA • 40×20m'
            : normMod === 'F7'
            ? 'FÚTBOL 7 • CÉSPED SINTÉTICO'
            : 'FÚTBOL CAMPO • 11 vs 11'}
        </span>
      </div>

      {/* Zona de espacio reservada (Agenda Coach / Fisio) */}
      {spaceBox && (
        <div
          className="absolute left-3 right-3 rounded-lg border-2 border-dashed pointer-events-none flex items-start justify-start p-2 z-0"
          style={{
            top: spaceBox.top,
            height: spaceBox.height,
            backgroundColor: spaceBox.bg,
            borderColor: spaceBox.border,
          }}
        >
          <span className="px-2 py-0.5 rounded bg-black/75 text-[10px] font-bold text-amber-200 border border-amber-400/40">
            Sector: {highlightSpace}
          </span>
        </div>
      )}

      {/* Marcaciones oficiales 2D diferenciadas por disciplina */}
      <svg
        viewBox="0 0 300 400"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {/* CAMPO 11v11 */}
        {normMod === 'Campo' && (
          <g stroke="rgba(255,255,255,0.62)" strokeWidth="2" fill="none">
            <rect x="14" y="14" width="272" height="372" />
            <line x1="14" y1="200" x2="286" y2="200" />
            <circle cx="150" cy="200" r="36" />
            <circle cx="150" cy="200" r="2.8" fill="white" />
            {/* Área Grande Superior + Chica + Semicírculo */}
            <rect x="66" y="14" width="168" height="60" />
            <rect x="108" y="14" width="84" height="22" />
            <path d="M 116 74 A 38 26 0 0 0 184 74" />
            <circle cx="150" cy="52" r="2.2" fill="white" />
            {/* Área Grande Inferior + Chica + Semicírculo */}
            <rect x="66" y="326" width="168" height="60" />
            <rect x="108" y="364" width="84" height="22" />
            <path d="M 116 326 A 38 26 0 0 1 184 326" />
            <circle cx="150" cy="348" r="2.2" fill="white" />
            {/* Arcos de esquina */}
            <path d="M 14 25 A 11 11 0 0 0 25 14" />
            <path d="M 275 14 A 11 11 0 0 0 286 25" />
            <path d="M 14 375 A 11 11 0 0 1 25 386" />
            <path d="M 275 386 A 11 11 0 0 1 286 375" />
            {/* Porterías */}
            <rect x="122" y="5" width="56" height="9" stroke="white" strokeWidth="2.4" />
            <rect x="122" y="386" width="56" height="9" stroke="white" strokeWidth="2.4" />
          </g>
        )}

        {/* FÚTBOL 7 */}
        {normMod === 'F7' && (
          <g stroke="rgba(255,255,255,0.68)" strokeWidth="2.1" fill="none">
            <rect x="20" y="16" width="260" height="368" rx="4" />
            <line x1="20" y1="200" x2="280" y2="200" />
            <circle cx="150" cy="200" r="31" />
            <circle cx="150" cy="200" r="2.6" fill="white" />
            {/* Líneas de zona fuera de juego F7 */}
            <line x1="20" y1="112" x2="280" y2="112" strokeDasharray="6 6" stroke="rgba(255,255,255,0.35)" />
            <line x1="20" y1="288" x2="280" y2="288" strokeDasharray="6 6" stroke="rgba(255,255,255,0.35)" />
            {/* Áreas amplias F7 con arco suave */}
            <path d="M 86 16 L 86 48 Q 150 86 214 48 L 214 16" />
            <circle cx="150" cy="54" r="2.2" fill="white" />
            <path d="M 86 384 L 86 352 Q 150 314 214 352 L 214 384" />
            <circle cx="150" cy="346" r="2.2" fill="white" />
            {/* Porterías F7 */}
            <rect x="120" y="6" width="60" height="10" stroke="white" strokeWidth="2.5" />
            <rect x="120" y="384" width="60" height="10" stroke="white" strokeWidth="2.5" />
          </g>
        )}

        {/* FÚTBOL SALA 40x20 */}
        {normMod === 'Sala' && (
          <g stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" fill="none">
            <rect x="24" y="18" width="252" height="364" />
            <line x1="24" y1="200" x2="276" y2="200" />
            <circle cx="150" cy="200" r="27" />
            <circle cx="150" cy="200" r="3" fill="white" />
            {/* Áreas semicirculares (D de Futsal 6m) */}
            <path d="M 84 18 A 66 56 0 0 0 216 18" />
            <path d="M 84 382 A 66 56 0 0 1 216 382" />
            {/* Puntos de penal (6m) y doble penal (10m) */}
            <circle cx="150" cy="54" r="2.4" fill="white" />
            <circle cx="150" cy="88" r="2.4" fill="#fbbf24" />
            <circle cx="150" cy="346" r="2.4" fill="white" />
            <circle cx="150" cy="312" r="2.4" fill="#fbbf24" />
            {/* Ticks zona de cambios laterales */}
            <line x1="20" y1="150" x2="28" y2="150" />
            <line x1="20" y1="250" x2="28" y2="250" />
            <line x1="272" y1="150" x2="280" y2="150" />
            <line x1="272" y1="250" x2="280" y2="250" />
            {/* Porterías Futsal */}
            <rect x="126" y="8" width="48" height="10" stroke="white" strokeWidth="2.6" />
            <rect x="126" y="382" width="48" height="10" stroke="white" strokeWidth="2.6" />
          </g>
        )}
      </svg>

      {/* Capa SVG de Trayectorias Tácticas Instantáneas */}
      {showTrajectories && trajectories.length > 0 && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="arrow-recta" markerWidth="5" markerHeight="5" refX="3.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#34d399" />
            </marker>
            <marker id="arrow-zigzag" markerWidth="5" markerHeight="5" refX="3.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#22d3ee" />
            </marker>
            <marker id="arrow-balon" markerWidth="5" markerHeight="5" refX="3.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#fbbf24" />
            </marker>
            <marker id="arrow-pase-largo" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#f97316" />
            </marker>
            <marker id="arrow-defensa" markerWidth="5" markerHeight="5" refX="3.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#a855f7" />
            </marker>
            <marker id="arrow-disparo" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
            </marker>
          </defs>

          {trajectories.map((traj) => {
            if (!traj.points || traj.points.length < 2) return null;
            const style = getTrajectoryStroke(traj.kind);
            const ptsStr = traj.points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polyline
                key={traj.id}
                points={ptsStr}
                fill="none"
                stroke={style.color}
                strokeWidth={style.width * 0.25}
                strokeDasharray={style.dash ? style.dash.replace(/\d+/g, (m) => Number(m) * 0.25) : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={style.marker}
                opacity="0.92"
              />
            );
          })}
        </svg>
      )}

      {/* Balón 2D */}
      {!hideBall && balon && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!interactive || isPlaying) return;
            didDragRef.current = false;
            setDraggingId('BALON');
            if (onSelectToken) onSelectToken('BALON');
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!interactive || isPlaying) return;
            if (onSelectToken) onSelectToken('BALON');
          }}
          style={{ left: `${balon.x}%`, top: `${balon.y}%` }}
          title="Balón (clic para elegir o arrastra en la cancha)"
          className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 ${
            interactive && !isPlaying ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full bg-white text-black border-2 border-black shadow-xl flex items-center justify-center text-xs transition-transform ${
              selectedTokenId === 'BALON'
                ? 'ring-4 ring-amber-400 scale-125'
                : 'hover:scale-110'
            }`}
          >
            ⚽
          </div>
        </div>
      )}

      {/* Jugadores, Materiales y Equipos Fisio 2D Derechos */}
      {tokens.map((tok, idx) => {
        const tid = getTokenId(tok, idx);
        const isSelected = selectedTokenId === tid;
        const rolUpper = String(tok.rol || '').toUpperCase();
        const isCone = tok.team === 'CONO' || rolUpper === 'CONO' || tok.color === 'cono';
        const isMaterialOrFisioEq =
          tok.team === 'MAT' ||
          ['TAPA', 'BALON_X', 'VALLA', 'ARO', 'ESCALERA', 'CAMILLA', 'BOSU', 'BANDA', 'FITBALL', 'HIELO'].includes(rolUpper);
        const isGK = rolUpper === 'POR' || tok.team === 'GK' || tok.color === 'oro';
        const isRival = tok.team === 'B' || tok.team === 'GK_B' || tok.color === 'azul';
        const isFisio = tok.team === 'FISIO' || rolUpper === 'FISIO' || tok.color === 'verde';
        const manyTokens = tokens.length >= 16;

        if (isCone) {
          return (
            <div
              key={tid}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!interactive || isPlaying) return;
                didDragRef.current = false;
                setDraggingId(tid);
                if (onSelectToken) onSelectToken(tid);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (interactive && !isPlaying && onSelectToken) onSelectToken(tid);
              }}
              style={{ left: `${tok.x}%`, top: `${tok.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${
                interactive && !isPlaying ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              }`}
            >
              <div
                className={`w-5 h-5 rotate-45 bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center ${
                  isSelected ? 'ring-4 ring-amber-300 scale-125' : ''
                }`}
              >
                <span className="-rotate-45 text-[8px] font-extrabold text-black">
                  {tok.label || 'C'}
                </span>
              </div>
            </div>
          );
        }

        if (isMaterialOrFisioEq) {
          let shapeCls = 'w-6 h-6 rounded-md bg-slate-200 text-black border-2 border-white';
          let iconText = tok.label || rolUpper.slice(0, 3);
          if (rolUpper === 'TAPA') {
            shapeCls = 'w-5 h-3.5 rounded-full bg-yellow-400 text-black border-2 border-white';
            iconText = tok.label || 'TP';
          } else if (rolUpper === 'BALON_X') {
            shapeCls = 'w-5 h-5 rounded-full bg-white text-black border-2 border-black';
            iconText = '⚽';
          } else if (rolUpper === 'VALLA') {
            shapeCls = 'w-9 h-3 rounded bg-sky-400 text-black border border-white';
            iconText = tok.label || 'VALLA';
          } else if (rolUpper === 'ARO') {
            shapeCls = 'w-6 h-6 rounded-full bg-transparent text-cyan-200 border-[3px] border-cyan-300';
            iconText = tok.label || 'AR';
          } else if (rolUpper === 'ESCALERA') {
            shapeCls = 'w-11 h-4 rounded-sm bg-amber-300/90 text-black border-2 border-dashed border-black';
            iconText = tok.label || 'ESC';
          } else if (rolUpper === 'CAMILLA') {
            shapeCls = 'w-12 h-6 rounded-md bg-sky-100 text-slate-900 border-2 border-sky-500';
            iconText = 'CAMILLA';
          } else if (rolUpper === 'BOSU') {
            shapeCls = 'w-7 h-5 rounded-t-full rounded-b-sm bg-cyan-500 text-black border-2 border-white';
            iconText = tok.label || 'BOSU';
          } else if (rolUpper === 'BANDA') {
            shapeCls = 'w-8 h-3 rounded-full bg-pink-500 text-white border border-white';
            iconText = tok.label || 'BND';
          } else if (rolUpper === 'FITBALL') {
            shapeCls = 'w-7 h-7 rounded-full bg-emerald-400 text-black border-2 border-white';
            iconText = tok.label || 'FB';
          } else if (rolUpper === 'HIELO') {
            shapeCls = 'w-6 h-5 rounded bg-cyan-200 text-sky-900 border-2 border-sky-400';
            iconText = '❄';
          }

          return (
            <div
              key={tid}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!interactive || isPlaying) return;
                didDragRef.current = false;
                setDraggingId(tid);
                if (onSelectToken) onSelectToken(tid);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (interactive && !isPlaying && onSelectToken) onSelectToken(tid);
              }}
              style={{ left: `${tok.x}%`, top: `${tok.y}%` }}
              title={`${rolUpper} (${tok.label || ''})`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${
                interactive && !isPlaying ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              }`}
            >
              <div
                className={`${shapeCls} shadow-lg flex items-center justify-center text-[8px] font-extrabold transition-transform ${
                  isSelected ? 'ring-4 ring-amber-300 scale-115' : 'hover:scale-105'
                }`}
              >
                {iconText}
              </div>
            </div>
          );
        }

        const badgeColor = isGK
          ? 'bg-amber-400 text-black border-white'
          : isRival
          ? 'bg-cyan-500 text-black border-white'
          : isFisio
          ? 'bg-emerald-500 text-black border-white'
          : tok.color === 'rojo'
          ? 'bg-rojo-fuego text-white border-white'
          : 'bg-vinotinto text-white border-rojo-fuego';

        const sizeCls = manyTokens ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 sm:w-9 sm:h-9 text-xs';

        return (
          <div
            key={tid}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (!interactive || isPlaying) return;
              didDragRef.current = false;
              setDraggingId(tid);
              if (onSelectToken) onSelectToken(tid);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && !isPlaying && onSelectToken) onSelectToken(tid);
            }}
            style={{ left: `${tok.x}%`, top: `${tok.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center ${
              interactive && !isPlaying ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
            }`}
          >
            <div
              className={`${sizeCls} rounded-full flex items-center justify-center font-extrabold border-2 shadow-lg transition-transform ${badgeColor} ${
                isSelected ? 'ring-4 ring-amber-300 scale-115' : 'group-hover:scale-110'
              }`}
            >
              {tok.dorsal ?? tok.label ?? idx + 1}
            </div>
            {(tok.nombre || tok.rol) && (
              <span className="mt-0.5 px-1.5 py-0.2 rounded bg-black/85 border border-white/20 text-[8px] sm:text-[9px] font-bold text-white leading-tight max-w-[80px] truncate text-center shadow">
                {tok.nombre ? tok.nombre.split(' ')[0] : tok.rol}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
