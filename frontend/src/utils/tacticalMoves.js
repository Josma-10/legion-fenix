// Generador compartido de escenarios (1v1 hasta 22 jugadores) y movimientos tácticos 2D instantáneos

export const SCENARIO_PRESETS = [
  { key: '1v1', label: '1 vs 1 (Duelo)', modalidades: ['Campo', 'F7', 'Sala'], count: 2 },
  { key: '2v2', label: '2 vs 2 (Reducido)', modalidades: ['Campo', 'F7', 'Sala'], count: 4 },
  { key: '4v2', label: '4 vs 2 (Rondo)', modalidades: ['Campo', 'F7', 'Sala'], count: 6 },
  { key: '5v5_sala', label: '5 vs 5 (Sala • 10 Jug.)', modalidades: ['Sala', 'F7', 'Campo'], count: 10 },
  { key: '7v7_propio', label: '7 Propios (F7)', modalidades: ['F7', 'Campo'], count: 7 },
  { key: '7v7_f7', label: '7 vs 7 (F7 • 14 Jug.)', modalidades: ['F7', 'Campo'], count: 14 },
  { key: '11v11_propio', label: '11 Propios (1-4-3-3)', modalidades: ['Campo'], count: 11 },
  { key: '11v11_completo', label: '11 vs 11 (22 Jugadores)', modalidades: ['Campo'], count: 22 },
];

function clampX(val) {
  return Number(Math.max(5, Math.min(95, Number(val) || 50)).toFixed(1));
}

function clampY(val) {
  return Number(Math.max(4, Math.min(96, Number(val) || 50)).toFixed(1));
}

export function getTokenId(tok, idx = 0) {
  if (!tok) return `tok-${idx}`;
  return String(tok.id || `${tok.team || 'A'}-${tok.dorsal ?? tok.label ?? idx}-${tok.rol || 'J'}-${idx}`);
}

export function getStepTokens(step, preferredKey = 'jugadores') {
  if (!step) return [];
  if (Array.isArray(step[preferredKey])) return step[preferredKey];
  if (Array.isArray(step.jugadores)) return step.jugadores;
  if (Array.isArray(step.actores)) return step.actores;
  return [];
}

export function cloneStepWithTokens(step, preferredKey, nextTokens, extra = {}) {
  const normalized = nextTokens.map((tok, i) => ({
    ...tok,
    id: getTokenId(tok, i),
    dorsal: tok.dorsal ?? tok.label ?? i + 1,
    label: tok.label ?? String(tok.dorsal ?? i + 1),
  }));
  return {
    ...step,
    ...extra,
    [preferredKey]: normalized,
  };
}

function makeTok(id, dorsal, rol, team, color, x, y) {
  return {
    id,
    dorsal,
    label: String(dorsal),
    rol,
    team,
    color,
    x,
    y,
  };
}

export function getPresetTokens(presetKey) {
  switch (presetKey) {
    case '1v1':
      return {
        balon: { x: 48, y: 66 },
        tokens: [
          makeTok('A-10', 10, 'ATA', 'A', 'vinotinto', 50, 70),
          makeTok('B-4', 4, 'DEF', 'B', 'azul', 50, 34),
        ],
        titulo: 'Duelo 1 vs 1 (Superar marca y finalizar)',
      };

    case '2v2':
      return {
        balon: { x: 34, y: 68 },
        tokens: [
          makeTok('A-10', 10, 'ATA', 'A', 'vinotinto', 32, 70),
          makeTok('A-9', 9, 'ATA', 'A', 'rojo', 68, 66),
          makeTok('B-4', 4, 'DEF', 'B', 'azul', 36, 38),
          makeTok('B-5', 5, 'DEF', 'B', 'azul', 64, 38),
        ],
        titulo: 'Duelo 2 vs 2 (Pared, ruptura y cobertura)',
      };

    case '4v2':
      return {
        balon: { x: 30, y: 50 },
        tokens: [
          makeTok('A-6', 6, 'MCD', 'A', 'vinotinto', 50, 68),
          makeTok('A-8', 8, 'MC', 'A', 'vinotinto', 24, 48),
          makeTok('A-10', 10, 'MP', 'A', 'vinotinto', 76, 48),
          makeTok('A-9', 9, 'DC', 'A', 'rojo', 50, 26),
          makeTok('B-4', 4, 'PRES', 'B', 'azul', 42, 46),
          makeTok('B-5', 5, 'COBERT', 'B', 'azul', 59, 44),
        ],
        titulo: 'Rondo 4 vs 2 (Conservación y línea de pase)',
      };

    case '5v5_sala':
      return {
        balon: { x: 50, y: 50 },
        tokens: [
          // Equipo A (Vinotinto - ataca hacia arriba)
          makeTok('A-1', 1, 'POR', 'GK', 'oro', 50, 91),
          makeTok('A-4', 4, 'CIE', 'A', 'vinotinto', 50, 74),
          makeTok('A-7', 7, 'ALA', 'A', 'vinotinto', 20, 58),
          makeTok('A-10', 10, 'ALA', 'A', 'vinotinto', 80, 58),
          makeTok('A-9', 9, 'PIV', 'A', 'rojo', 50, 44),
          // Equipo B (Azul Rival - ataca hacia abajo)
          makeTok('B-1', 1, 'POR', 'GK_B', 'azul', 50, 9),
          makeTok('B-2', 2, 'CIE', 'B', 'azul', 50, 26),
          makeTok('B-8', 8, 'ALA', 'B', 'azul', 20, 41),
          makeTok('B-11', 11, 'ALA', 'B', 'azul', 80, 41),
          makeTok('B-9', 9, 'PIV', 'B', 'azul', 50, 56),
        ],
        titulo: 'Partido 5 vs 5 Fútbol Sala (10 Jugadores)',
      };

    case '7v7_propio':
      return {
        balon: { x: 50, y: 58 },
        tokens: [
          makeTok('A-1', 1, 'POR', 'GK', 'oro', 50, 90),
          makeTok('A-4', 4, 'DF', 'A', 'vinotinto', 30, 72),
          makeTok('A-5', 5, 'DF', 'A', 'vinotinto', 70, 72),
          makeTok('A-8', 8, 'MC', 'A', 'vinotinto', 22, 48),
          makeTok('A-10', 10, 'MC', 'A', 'vinotinto', 50, 45),
          makeTok('A-7', 7, 'MC', 'A', 'vinotinto', 78, 48),
          makeTok('A-9', 9, 'DC', 'A', 'rojo', 50, 20),
        ],
        titulo: 'Esquema 1-2-3-1 Fútbol 7 (7 Jugadores)',
      };

    case '7v7_f7':
      return {
        balon: { x: 50, y: 50 },
        tokens: [
          makeTok('A-1', 1, 'POR', 'GK', 'oro', 50, 91),
          makeTok('A-4', 4, 'DF', 'A', 'vinotinto', 32, 75),
          makeTok('A-5', 5, 'DF', 'A', 'vinotinto', 68, 75),
          makeTok('A-8', 8, 'INT', 'A', 'vinotinto', 20, 57),
          makeTok('A-10', 10, 'MC', 'A', 'vinotinto', 50, 56),
          makeTok('A-7', 7, 'EXT', 'A', 'vinotinto', 80, 57),
          makeTok('A-9', 9, 'DC', 'A', 'rojo', 50, 42),
          makeTok('B-1', 1, 'POR', 'GK_B', 'azul', 50, 9),
          makeTok('B-2', 2, 'DF', 'B', 'azul', 32, 24),
          makeTok('B-3', 3, 'DF', 'B', 'azul', 68, 24),
          makeTok('B-6', 6, 'MC', 'B', 'azul', 50, 38),
          makeTok('B-11', 11, 'EXT', 'B', 'azul', 20, 43),
          makeTok('B-7', 7, 'EXT', 'B', 'azul', 80, 43),
          makeTok('B-9', 9, 'DC', 'B', 'azul', 50, 59),
        ],
        titulo: 'Partido 7 vs 7 Fútbol 7 (14 Jugadores)',
      };

    case '11v11_completo':
      return {
        balon: { x: 50, y: 50 },
        tokens: [
          // 11 Jugadores Legión Fénix (Vinotinto)
          makeTok('A-1', 1, 'POR', 'GK', 'oro', 50, 92),
          makeTok('A-3', 3, 'LI', 'A', 'vinotinto', 15, 76),
          makeTok('A-4', 4, 'DFC', 'A', 'vinotinto', 38, 79),
          makeTok('A-5', 5, 'DFC', 'A', 'vinotinto', 62, 79),
          makeTok('A-2', 2, 'LD', 'A', 'vinotinto', 85, 76),
          makeTok('A-6', 6, 'MCD', 'A', 'vinotinto', 50, 66),
          makeTok('A-8', 8, 'MC', 'A', 'vinotinto', 30, 56),
          makeTok('A-10', 10, 'MC', 'A', 'vinotinto', 70, 56),
          makeTok('A-11', 11, 'EI', 'A', 'rojo', 18, 42),
          makeTok('A-7', 7, 'ED', 'A', 'rojo', 82, 42),
          makeTok('A-9', 9, 'DC', 'A', 'rojo', 50, 40),
          // 11 Jugadores Rival (Azul)
          makeTok('B-1', 1, 'POR', 'GK_B', 'azul', 50, 8),
          makeTok('B-2', 2, 'LD', 'B', 'azul', 15, 23),
          makeTok('B-4', 4, 'DFC', 'B', 'azul', 38, 20),
          makeTok('B-5', 5, 'DFC', 'B', 'azul', 62, 20),
          makeTok('B-3', 3, 'LI', 'B', 'azul', 85, 23),
          makeTok('B-6', 6, 'MCD', 'B', 'azul', 50, 33),
          makeTok('B-8', 8, 'MC', 'B', 'azul', 30, 43),
          makeTok('B-10', 10, 'MC', 'B', 'azul', 70, 43),
          makeTok('B-7', 7, 'ED', 'B', 'azul', 18, 59),
          makeTok('B-11', 11, 'EI', 'B', 'azul', 82, 59),
          makeTok('B-9', 9, 'DC', 'B', 'azul', 50, 58),
        ],
        titulo: 'Partido Completo 11 vs 11 (22 Jugadores)',
      };

    case '11v11_propio':
    default:
      return {
        balon: { x: 50, y: 58 },
        tokens: [
          makeTok('A-1', 1, 'POR', 'GK', 'oro', 50, 90),
          makeTok('A-3', 3, 'LI', 'A', 'vinotinto', 18, 73),
          makeTok('A-4', 4, 'DFC', 'A', 'vinotinto', 39, 76),
          makeTok('A-5', 5, 'DFC', 'A', 'vinotinto', 61, 76),
          makeTok('A-2', 2, 'LD', 'A', 'vinotinto', 82, 73),
          makeTok('A-6', 6, 'MCD', 'A', 'vinotinto', 50, 58),
          makeTok('A-8', 8, 'MC', 'A', 'vinotinto', 32, 46),
          makeTok('A-10', 10, 'MC', 'A', 'vinotinto', 68, 46),
          makeTok('A-11', 11, 'EI', 'A', 'rojo', 20, 26),
          makeTok('A-7', 7, 'ED', 'A', 'rojo', 80, 26),
          makeTok('A-9', 9, 'DC', 'A', 'rojo', 50, 17),
        ],
        titulo: 'Sistema 1-4-3-3 Fútbol Campo (11 Jugadores)',
      };
  }
}

export function buildPresetSteps(presetKey, preferredKey = 'jugadores') {
  const { balon, tokens, titulo } = getPresetTokens(presetKey);
  return [
    {
      descripcion: `Paso 1: Posición Inicial (${titulo})`,
      balon: { ...balon },
      [preferredKey]: tokens.map((t) => ({ ...t })),
    },
  ];
}

export const MATERIAL_CATALOG = [
  { key: 'CONO', label: 'Cono', short: 'CN', rol: 'CONO', color: 'cono', badge: 'bg-orange-500 text-black' },
  { key: 'TAPA', label: 'Tapa / Platillo', short: 'TP', rol: 'TAPA', color: 'tapa', badge: 'bg-yellow-400 text-black' },
  { key: 'BALON_EXTRA', label: 'Balón Extra', short: '⚽', rol: 'BALON_X', color: 'balonx', badge: 'bg-white text-black' },
  { key: 'VALLA', label: 'Valla', short: 'VL', rol: 'VALLA', color: 'valla', badge: 'bg-sky-400 text-black' },
  { key: 'ARO', label: 'Aro', short: 'AR', rol: 'ARO', color: 'aro', badge: 'bg-cyan-300 text-black' },
  { key: 'ESCALERA', label: 'Escalera', short: 'ES', rol: 'ESCALERA', color: 'escalera', badge: 'bg-amber-300 text-black' },
];

export const FISIO_EQUIPMENT_CATALOG = [
  { key: 'ATLETA', label: 'Atleta Paciente', short: 'ATL', rol: 'PACIENTE', color: 'rojo', team: 'A' },
  { key: 'FISIO', label: 'Fisioterapeuta', short: 'FT', rol: 'FISIO', color: 'verde', team: 'FISIO' },
  { key: 'CAMILLA', label: 'Camilla Clínica', short: 'CAM', rol: 'CAMILLA', color: 'camilla', team: 'MAT' },
  { key: 'BOSU', label: 'Bosu / Balance', short: 'BS', rol: 'BOSU', color: 'bosu', team: 'MAT' },
  { key: 'BANDA', label: 'Banda Elástica', short: 'BND', rol: 'BANDA', color: 'banda', team: 'MAT' },
  { key: 'FITBALL', label: 'Fitball Rehab', short: 'FB', rol: 'FITBALL', color: 'fitball', team: 'MAT' },
  { key: 'HIELO', label: 'Hielo / Crioterapia', short: 'ICE', rol: 'HIELO', color: 'hielo', team: 'MAT' },
  { key: 'VALLA', label: 'Valla Baja Rehab', short: 'VL', rol: 'VALLA', color: 'valla', team: 'MAT' },
  { key: 'ESCALERA', label: 'Escalera Coord.', short: 'ES', rol: 'ESCALERA', color: 'escalera', team: 'MAT' },
  { key: 'CONO', label: 'Cono Referencia', short: 'CN', rol: 'CONO', color: 'cono', team: 'CONO' },
];

export const FISIO_PRESETS = [
  {
    key: 'propiocepcion_tobillo',
    label: 'Propiocepción de Tobillo (Bosu + Conos)',
    titulo: 'Readaptación: Propiocepción y Estabilidad en Bosu',
    steps: [
      {
        descripcion: 'Paso 1: Posición en Zona Readaptación frente al Bosu y guía del Fisio',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 35, y: 80 },
          { id: 'FIS-ATL', dorsal: '10', label: '10', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 50, y: 86 },
          { id: 'FIS-BS1', dorsal: 'BS1', label: 'BS1', rol: 'BOSU', team: 'MAT', color: 'bosu', x: 50, y: 76 },
          { id: 'FIS-CN1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'cono', x: 38, y: 70 },
          { id: 'FIS-CN2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'cono', x: 62, y: 70 },
        ],
      },
      {
        descripcion: 'Paso 2: Apoyo unipodal 30s sobre Bosu + toque lateral de conos sin perder eje',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 38, y: 76 },
          { id: 'FIS-ATL', dorsal: '10', label: '10', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 50, y: 76, movKind: 'recta' },
          { id: 'FIS-BS1', dorsal: 'BS1', label: 'BS1', rol: 'BOSU', team: 'MAT', color: 'bosu', x: 50, y: 76 },
          { id: 'FIS-CN1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'cono', x: 38, y: 70 },
          { id: 'FIS-CN2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'cono', x: 62, y: 70 },
        ],
      },
      {
        descripcion: 'Paso 3: Desplazamiento controlado a cono derecho y regreso al centro',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 44, y: 74 },
          { id: 'FIS-ATL', dorsal: '10', label: '10', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 62, y: 70, movKind: 'zigzag' },
          { id: 'FIS-BS1', dorsal: 'BS1', label: 'BS1', rol: 'BOSU', team: 'MAT', color: 'bosu', x: 50, y: 76 },
          { id: 'FIS-CN1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'cono', x: 38, y: 70 },
          { id: 'FIS-CN2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'cono', x: 62, y: 70 },
        ],
      },
    ],
  },
  {
    key: 'estabilidad_rodilla',
    label: 'Estabilidad Rodilla LCA (Banda + Fitball)',
    titulo: 'Readaptación Muscular: Control Valgo con Banda y Fitball',
    steps: [
      {
        descripcion: 'Paso 1: Activación isométrica con banda elástica y soporte en Fitball',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 30, y: 82 },
          { id: 'FIS-ATL', dorsal: '9', label: '9', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 45, y: 82 },
          { id: 'FIS-BND1', dorsal: 'BN1', label: 'BN1', rol: 'BANDA', team: 'MAT', color: 'banda', x: 45, y: 76 },
          { id: 'FIS-FB1', dorsal: 'FB1', label: 'FB1', rol: 'FITBALL', team: 'MAT', color: 'fitball', x: 62, y: 82 },
        ],
      },
      {
        descripcion: 'Paso 2: Sentadilla excéntrica controlada y desplazamiento lateral con resistencia',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 40, y: 80 },
          { id: 'FIS-ATL', dorsal: '9', label: '9', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 56, y: 82, movKind: 'recta' },
          { id: 'FIS-BND1', dorsal: 'BN1', label: 'BN1', rol: 'BANDA', team: 'MAT', color: 'banda', x: 45, y: 76 },
          { id: 'FIS-FB1', dorsal: 'FB1', label: 'FB1', rol: 'FITBALL', team: 'MAT', color: 'fitball', x: 62, y: 82 },
        ],
      },
    ],
  },
  {
    key: 'agilidad_readaptacion',
    label: 'Retorno al Campo (Escalera + Vallas Bajas)',
    titulo: 'Readaptación Progresiva: Frecuencia en Escalera y Salto en Vallas',
    steps: [
      {
        descripcion: 'Paso 1: Inicio frente a escalera coordinativa con supervisión clínica',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 24, y: 78 },
          { id: 'FIS-ATL', dorsal: '7', label: '7', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 36, y: 88 },
          { id: 'FIS-ES1', dorsal: 'ES1', label: 'ES1', rol: 'ESCALERA', team: 'MAT', color: 'escalera', x: 48, y: 82 },
          { id: 'FIS-VL1', dorsal: 'VL1', label: 'VL1', rol: 'VALLA', team: 'MAT', color: 'valla', x: 64, y: 78 },
          { id: 'FIS-VL2', dorsal: 'VL2', label: 'VL2', rol: 'VALLA', team: 'MAT', color: 'valla', x: 76, y: 78 },
        ],
      },
      {
        descripcion: 'Paso 2: Skipping suave sin impacto brusco y aterrizaje estable tras valla',
        actores: [
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 52, y: 72 },
          { id: 'FIS-ATL', dorsal: '7', label: '7', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 78, y: 78, movKind: 'zigzag' },
          { id: 'FIS-ES1', dorsal: 'ES1', label: 'ES1', rol: 'ESCALERA', team: 'MAT', color: 'escalera', x: 48, y: 82 },
          { id: 'FIS-VL1', dorsal: 'VL1', label: 'VL1', rol: 'VALLA', team: 'MAT', color: 'valla', x: 64, y: 78 },
          { id: 'FIS-VL2', dorsal: 'VL2', label: 'VL2', rol: 'VALLA', team: 'MAT', color: 'valla', x: 76, y: 78 },
        ],
      },
    ],
  },
  {
    key: 'descarga_camilla',
    label: 'Descarga Muscular + Crioterapia (Camilla + Hielo)',
    titulo: 'Recuperación Clínica: Camilla + Liberación Miofascial + Hielo',
    steps: [
      {
        descripcion: 'Paso 1: Terapia manual en camilla y aplicación de crioterapia localizada (15 min)',
        actores: [
          { id: 'FIS-CAM', dorsal: 'CAM', label: 'CAM', rol: 'CAMILLA', team: 'MAT', color: 'camilla', x: 50, y: 82 },
          { id: 'FIS-ATL', dorsal: '11', label: '11', rol: 'PACIENTE', team: 'A', color: 'rojo', x: 50, y: 82 },
          { id: 'FIS-FT', dorsal: 'FT', label: 'FT', rol: 'FISIO', team: 'FISIO', color: 'verde', x: 36, y: 82 },
          { id: 'FIS-ICE', dorsal: 'ICE', label: 'ICE', rol: 'HIELO', team: 'MAT', color: 'hielo', x: 64, y: 82 },
        ],
      },
    ],
  },
];

export function createNumberedPlayerToken(team = 'A', dorsal = 10, existingTokens = []) {
  const num = Number(dorsal);
  const isOwn = team === 'A';
  const uid = `${isOwn ? 'A' : 'B'}-${num}-${Date.now().toString(36)}`;
  const sameTeamCount = existingTokens.filter((t) =>
    isOwn ? t.team === 'A' || t.team === 'GK' : t.team === 'B' || t.team === 'GK_B'
  ).length;
  const col = (sameTeamCount % 4) * 18 + 23;
  const row = Math.floor(sameTeamCount / 4) * 11;
  if (isOwn) {
    if (num === 1) return makeTok(uid, 1, 'POR', 'GK', 'oro', 50, 90);
    return makeTok(uid, num, num >= 9 ? 'ATA' : num <= 5 ? 'DEF' : 'MED', 'A', num >= 9 ? 'rojo' : 'vinotinto', clampX(col), clampY(76 - row));
  }
  if (num === 1) return makeTok(uid, 1, 'POR', 'GK_B', 'azul', 50, 10);
  return makeTok(uid, num, 'RIV', 'B', 'azul', clampX(col), clampY(24 + row));
}

export function createMaterialToken(materialKey = 'CONO', existingTokens = []) {
  const spec = MATERIAL_CATALOG.find((m) => m.key === materialKey) ||
    FISIO_EQUIPMENT_CATALOG.find((m) => m.key === materialKey) ||
    MATERIAL_CATALOG[0];
  const sameCount = existingTokens.filter((t) => t.rol === spec.rol || t.color === spec.color).length + 1;
  const uid = `${spec.key}-${Date.now().toString(36)}-${sameCount}`;
  const x = clampX(20 + ((existingTokens.length * 11) % 62));
  const y = clampY(42 + ((sameCount * 9) % 40));
  const label = `${spec.short}${sameCount > 1 || spec.short.length <= 2 ? sameCount : ''}`;
  return makeTok(uid, label, spec.rol, spec.team || (spec.key === 'CONO' ? 'CONO' : 'MAT'), spec.color, x, y);
}

export function createCustomToken(kind = 'A', existingTokens = []) {
  const idx = existingTokens.length + 1;
  const uid = `${kind}-${Date.now().toString(36)}-${idx}`;
  const x = Number((22 + ((idx * 13) % 58)).toFixed(1));
  const y = kind === 'B' ? 32 : kind === 'GK' ? 90 : kind === 'CONO' ? 50 : 62;

  if (kind === 'B') {
    const rivalCount = Math.min(22, existingTokens.filter((t) => t.team === 'B' || t.team === 'GK_B').length + 2);
    return makeTok(uid, rivalCount, 'RIV', 'B', 'azul', x, y);
  }
  if (kind === 'GK') {
    return makeTok(uid, 1, 'POR', 'GK', 'oro', 50, 90);
  }
  if (kind === 'CONO') {
    const coneCount = existingTokens.filter((t) => t.team === 'CONO' || t.rol === 'CONO').length + 1;
    return makeTok(uid, `C${coneCount}`, 'CONO', 'CONO', 'cono', x, y);
  }
  if (kind === 'FISIO') {
    return makeTok(uid, 'FT', 'FISIO', 'FISIO', 'verde', 34, 80);
  }
  if (MATERIAL_CATALOG.some((m) => m.key === kind) || FISIO_EQUIPMENT_CATALOG.some((m) => m.key === kind)) {
    return createMaterialToken(kind, existingTokens);
  }
  const ownCount = existingTokens.filter((t) => t.team === 'A' || t.team === 'GK').length + 2;
  const dorsal = Math.min(22, ownCount);
  return makeTok(uid, dorsal, 'JUG', 'A', 'vinotinto', x, y);
}

// Garantiza que exista un paso siguiente editable y actualiza posiciones + tipo de trayectoria inmediatamente
function ensureNextStep(pasos, stepIdx, preferredKey) {
  const cur = pasos[stepIdx];
  if (!cur) return { list: pasos, nextIdx: stepIdx };

  if (stepIdx < pasos.length - 1) {
    return { list: pasos.map((s) => ({ ...s })), nextIdx: stepIdx + 1 };
  }

  const curTokens = getStepTokens(cur, preferredKey).map((t, i) => ({
    ...t,
    id: getTokenId(t, i),
  }));
  const newStep = {
    descripcion: `Paso ${pasos.length + 1}: Acción Táctica`,
    ...(cur.balon ? { balon: { ...cur.balon } } : {}),
    [preferredKey]: curTokens,
  };
  return { list: [...pasos, newStep], nextIdx: stepIdx + 1 };
}

export function applyPassMoveSteps({ pasos, stepIdx, destX, destY, kind = 'pase_corto', preferredKey }) {
  const curStep = pasos[stepIdx];
  if (!curStep) return { pasos, nextStepIdx: stepIdx };
  const dx = clampX(destX);
  const dy = clampY(destY);
  const { list, nextIdx } = ensureNextStep(pasos, stepIdx, preferredKey);
  const curTokens = getStepTokens(list[stepIdx], preferredKey);
  const prevNextTokens = getStepTokens(list[nextIdx], preferredKey);

  list[nextIdx] = {
    ...list[nextIdx],
    descripcion: kind === 'pase_largo' ? 'Pase Largo / Cambio de Orientación' : 'Pase Corto Asociativo',
    balon: { x: dx, y: dy, movKind: kind },
    [preferredKey]: prevNextTokens.length > 0 ? prevNextTokens : curTokens.map((t) => ({ ...t })),
  };
  return { pasos: list, nextStepIdx: nextIdx };
}

/**
 * Mueve un jugador o balón en Línea Recta hacia (destX, destY) en el paso siguiente.
 */
export function applyLinearMoveSteps({ pasos, stepIdx, targetId, destX, destY, preferredKey }) {
  if (!pasos[stepIdx]) return { pasos, nextStepIdx: stepIdx };
  const dx = clampX(destX);
  const dy = clampY(destY);
  const { list, nextIdx } = ensureNextStep(pasos, stepIdx, preferredKey);

  const curTokens = getStepTokens(list[stepIdx], preferredKey);
  const prevNextTokens = getStepTokens(list[nextIdx], preferredKey);

  if (targetId === 'BALON') {
    list[nextIdx] = {
      ...list[nextIdx],
      descripcion: list[nextIdx].descripcion || `Pase / Conducción de Balón`,
      balon: { x: dx, y: dy, movKind: 'balon' },
      [preferredKey]: prevNextTokens.length > 0 ? prevNextTokens : curTokens.map((t) => ({ ...t })),
    };
    return { pasos: list, nextStepIdx: nextIdx };
  }

  const baseForNext = prevNextTokens.length > 0 ? prevNextTokens : curTokens;
  const updatedTokens = baseForNext.map((tok, idx) => {
    const id = getTokenId(tok, idx);
    if (id !== targetId) return tok;
    return { ...tok, x: dx, y: dy, movKind: 'recta' };
  });

  list[nextIdx] = cloneStepWithTokens(list[nextIdx], preferredKey, updatedTokens, {
    descripcion: `Desplazamiento en Línea Recta (#${
      updatedTokens.find((t, i) => getTokenId(t, i) === targetId)?.dorsal || ''
    })`,
  });

  return { pasos: list, nextStepIdx: nextIdx };
}

/**
 * Genera 4 puntos intermedios de Zig-Zag (slalom izquierda-derecha) desde la posición actual hasta (destX, destY)
 */
export function applyZigZagMoveSteps({ pasos, stepIdx, targetId, destX, destY, preferredKey }) {
  const curStep = pasos[stepIdx];
  if (!curStep) return { pasos, nextStepIdx: stepIdx };

  const dx = clampX(destX);
  const dy = clampY(destY);
  const curTokens = getStepTokens(curStep, preferredKey);

  let startX = 50;
  let startY = 50;
  if (targetId === 'BALON') {
    startX = curStep.balon?.x ?? 50;
    startY = curStep.balon?.y ?? 50;
  } else {
    const found = curTokens.find((t, idx) => getTokenId(t, idx) === targetId);
    if (!found) return { pasos, nextStepIdx: stepIdx };
    startX = found.x;
    startY = found.y;
  }

  const vx = dx - startX;
  const vy = dy - startY;
  const dist = Math.hypot(vx, vy) || 1;
  // Vector perpendicular normalizado para amplitud lateral del Zig-Zag
  const perpX = -vy / dist;
  const perpY = vx / dist;
  const amp = Math.max(6, Math.min(12, dist * 0.22));
  const fractions = [
    { t: 0.25, side: 1 },
    { t: 0.5, side: -1 },
    { t: 0.75, side: 1 },
    { t: 1.0, side: 0 },
  ];

  const tailAfter = pasos.slice(stepIdx + 1);
  const zigSteps = fractions.map((frac, zIdx) => {
    const px = clampX(startX + vx * frac.t + perpX * amp * frac.side);
    const py = clampY(startY + vy * frac.t + perpY * amp * frac.side);

    if (targetId === 'BALON') {
      return {
        descripcion: `Zig-Zag Balón (${zIdx + 1}/4)`,
        balon: { x: px, y: py, movKind: 'zigzag' },
        [preferredKey]: curTokens.map((t, i) => ({ ...t, id: getTokenId(t, i) })),
      };
    }

    return {
      descripcion: `Movimiento Zig-Zag / Slalom (${zIdx + 1}/4)`,
      balon: { ...(curStep.balon || { x: 50, y: 50 }) },
      [preferredKey]: curTokens.map((t, i) => {
        const tid = getTokenId(t, i);
        if (tid !== targetId) return { ...t, id: tid };
        return { ...t, id: tid, x: px, y: py, movKind: 'zigzag' };
      }),
    };
  });

  // Conservar últimos pasos posteriores si existían y reajustar posición final en el último paso de zig
  const head = pasos.slice(0, stepIdx + 1);
  return {
    pasos: [...head, ...zigSteps, ...tailAfter],
    nextStepIdx: head.length + zigSteps.length - 1,
  };
}

/**
 * Subir y Bajar a Defender de Una:
 * Crea ciclo completo en 2 pasos inmediatos: Sube a Ataque/Presión -> Baja rápido a Bloque Defensivo.
 */
export function applyAttackAndDefendCycleSteps({
  pasos,
  stepIdx,
  targetId = 'TEAM_A',
  preferredKey,
}) {
  const curStep = pasos[stepIdx];
  if (!curStep) return { pasos, nextStepIdx: stepIdx };

  const curTokens = getStepTokens(curStep, preferredKey);
  const moveTokenPredicate = (t, i) => {
    if (targetId && targetId !== 'TEAM_A' && targetId !== 'BALON') {
      return getTokenId(t, i) === targetId;
    }
    return (
      t.team !== 'B' &&
      t.team !== 'GK_B' &&
      t.team !== 'CONO' &&
      t.team !== 'MAT' &&
      t.team !== 'FISIO' &&
      t.rol !== 'POR'
    );
  };

  const stepUp = {
    descripcion: 'Subida rápida en Ataque / Presión Alta',
    balon: {
      x: curStep.balon?.x ?? 50,
      y: clampY((curStep.balon?.y ?? 50) - 18),
      movKind: 'defensa',
    },
    [preferredKey]: curTokens.map((t, i) => {
      const tid = getTokenId(t, i);
      if (!moveTokenPredicate(t, i)) return { ...t, id: tid };
      return {
        ...t,
        id: tid,
        y: clampY(t.y - 18),
        movKind: 'defensa',
      };
    }),
  };

  const stepDown = {
    descripcion: 'Repliegue inmediato: Bajar a Defender bloque compacto',
    balon: {
      x: curStep.balon?.x ?? 50,
      y: clampY((curStep.balon?.y ?? 50) + 14),
      movKind: 'defensa',
    },
    [preferredKey]: curTokens.map((t, i) => {
      const tid = getTokenId(t, i);
      if (!moveTokenPredicate(t, i)) return { ...t, id: tid };
      return {
        ...t,
        id: tid,
        y: clampY(Math.max(t.y + 12, 58)),
        movKind: 'defensa',
      };
    }),
  };

  const head = pasos.slice(0, stepIdx + 1);
  const tail = pasos.slice(stepIdx + 1);
  return {
    pasos: [...head, stepUp, stepDown, ...tail],
    nextStepIdx: head.length + 1,
  };
}

/**
 * Patear / Remate directo al Arco (Izquierda, Centro o Derecha de la portería superior)
 */
export function applyShootAtGoalSteps({
  pasos,
  stepIdx,
  shooterId = null,
  corner = 'center',
  preferredKey,
}) {
  const curStep = pasos[stepIdx];
  if (!curStep) return { pasos, nextStepIdx: stepIdx };

  const curTokens = getStepTokens(curStep, preferredKey);
  const goalX = corner === 'left' ? 42 : corner === 'right' ? 58 : 50;
  const goalY = 3.5;

  const { list, nextIdx } = ensureNextStep(pasos, stepIdx, preferredKey);
  const ballPos = curStep.balon || { x: 50, y: 30 };

  const updatedTokens = curTokens.map((t, i) => {
    const tid = getTokenId(t, i);
    if (!shooterId || tid !== shooterId) return { ...t, id: tid };
    return {
      ...t,
      id: tid,
      x: clampX(ballPos.x + (ballPos.x < goalX ? -2 : 2)),
      y: clampY(ballPos.y + 3),
      movKind: 'recta',
    };
  });

  list[nextIdx] = cloneStepWithTokens(list[nextIdx], preferredKey, updatedTokens, {
    descripcion: `Remate directo al arco (${corner === 'left' ? 'Palo Izquierdo' : corner === 'right' ? 'Palo Derecho' : 'Centro'})`,
    balon: { x: goalX, y: goalY, movKind: 'disparo' },
  });

  return { pasos: list, nextStepIdx: nextIdx };
}

/**
 * Extrae todas las líneas/flechas de trayectoria visibles en tiempo real entre pasos consecutivos.
 * Si un jugador tiene múltiples pasos seguidos con movKind === 'zigzag', los agrupa en una sola polilínea continua.
 */
export function extractTrajectoriesFromPasos(pasos = [], preferredKey = 'jugadores') {
  if (!Array.isArray(pasos) || pasos.length < 2) return [];

  const trajectories = [];

  // 1. Trayectoria de balón (agrupando pasos donde el balón cambia de posición)
  const ballSegments = [];
  for (let s = 0; s < pasos.length - 1; s++) {
    const bA = pasos[s]?.balon;
    const bB = pasos[s + 1]?.balon;
    if (!bA || !bB) continue;
    if (Math.hypot(bB.x - bA.x, bB.y - bA.y) >= 1.5) {
      ballSegments.push({
        from: { x: bA.x, y: bA.y },
        to: { x: bB.x, y: bB.y },
        kind: bB.movKind || 'balon',
      });
    }
  }
  ballSegments.forEach((seg, idx) => {
    trajectories.push({
      id: `ball-${idx}`,
      points: [seg.from, seg.to],
      kind: seg.kind,
      isBall: true,
    });
  });

  // 2. Trayectorias de jugadores
  const firstTokens = getStepTokens(pasos[0], preferredKey);
  const allTokenIds = new Set();
  pasos.forEach((step) => {
    getStepTokens(step, preferredKey).forEach((t, i) => allTokenIds.add(getTokenId(t, i)));
  });

  allTokenIds.forEach((tid) => {
    let activeChain = null;

    for (let s = 0; s < pasos.length - 1; s++) {
      const listA = getStepTokens(pasos[s], preferredKey);
      const listB = getStepTokens(pasos[s + 1], preferredKey);
      const tokA = listA.find((t, i) => getTokenId(t, i) === tid);
      const tokB = listB.find((t, i) => getTokenId(t, i) === tid);
      if (!tokA || !tokB) continue;

      const moved = Math.hypot(tokB.x - tokA.x, tokB.y - tokA.y) >= 1.5;
      if (!moved) {
        if (activeChain) {
          trajectories.push(activeChain);
          activeChain = null;
        }
        continue;
      }

      const kind = tokB.movKind || (tokA.team === 'B' ? 'defensa' : 'recta');
      if (kind === 'zigzag' && activeChain && activeChain.kind === 'zigzag') {
        activeChain.points.push({ x: tokB.x, y: tokB.y });
      } else {
        if (activeChain) trajectories.push(activeChain);
        activeChain = {
          id: `tok-${tid}-${s}`,
          points: [
            { x: tokA.x, y: tokA.y },
            { x: tokB.x, y: tokB.y },
          ],
          kind,
          dorsal: tokA.dorsal || tokA.label || '',
        };
      }
    }

    if (activeChain) {
      trajectories.push(activeChain);
    }
  });

  void firstTokens;
  return trajectories;
}
