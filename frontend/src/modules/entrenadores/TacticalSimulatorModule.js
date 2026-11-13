import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Check,
  Play,
  Pause,
  Trash2,
  Save,
  Plus,
  AlertCircle,
  MousePointer2,
  ArrowRight,
  Activity,
  ArrowUpDown,
  Target,
  Eye,
  EyeOff,
  Users,
  ChevronDown,
  Box,
  Link2,
  SlidersHorizontal,
  Flame,
  Zap,
  Compass,
  Trophy,
  Eraser,
  UserCheck,
} from 'lucide-react';
import api from '../../utils/api';
import { groupCategoriesByDiscipline } from '../../utils/categories';
import Pitch2DBoard from '../../components/Pitch2DBoard';
import {
  SCENARIO_PRESETS,
  MATERIAL_CATALOG,
  buildPresetSteps,
  createNumberedPlayerToken,
  createMaterialToken,
  getTokenId,
  getStepTokens,
  cloneStepWithTokens,
  applyLinearMoveSteps,
  applyPassMoveSteps,
  applyZigZagMoveSteps,
  applyAttackAndDefendCycleSteps,
  applyShootAtGoalSteps,
  extractTrajectoriesFromPasos,
} from '../../utils/tacticalMoves';

export const ESTILOS_JUEGO_PRO = [
  {
    key: 'gegenpressing',
    nombre: 'Gegenpressing (Presión Tras Pérdida)',
    filosofia: 'Acoso asfixiante e inmediato tras pérdida de balón, reducción de espacios, orientación forzada a banda y salida vertical veloz al recuperar.',
    foco: 'Intensidad física, anticipación táctica y bloque alto.',
    badge: 'Bloque Alto',
    buildSteps: () => [
      {
        descripcion: 'Fase 1: Pérdida en campo rival y acoso inmediato al poseedor',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 88 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 38, y: 55 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 62, y: 55 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 82, y: 44 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 18, y: 44 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 50, y: 40 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 34, y: 30 },
          { id: 'JUG-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 64, y: 28 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 74, y: 18 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 26, y: 18 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 48, y: 16 },
          { id: 'RIV-4', dorsal: 4, label: '4', rol: 'DEF', team: 'B', color: 'azul', x: 50, y: 12 },
          { id: 'RIV-6', dorsal: 6, label: '6', rol: 'MED', team: 'B', color: 'azul', x: 42, y: 22 },
        ],
        balon: { x: 49, y: 14 },
      },
      {
        descripcion: 'Fase 2: Asedio 3v1 en zona activa y corte de líneas de escape',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 84 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 38, y: 48 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 62, y: 48 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 78, y: 38 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 22, y: 38 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 50, y: 32 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 38, y: 22 },
          { id: 'JUG-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 60, y: 20 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 64, y: 14 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 32, y: 15 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 49, y: 13 },
          { id: 'RIV-4', dorsal: 4, label: '4', rol: 'DEF', team: 'B', color: 'azul', x: 50, y: 11 },
          { id: 'RIV-6', dorsal: 6, label: '6', rol: 'MED', team: 'B', color: 'azul', x: 44, y: 21 },
        ],
        balon: { x: 49, y: 13 },
      },
    ],
  },
  {
    key: 'ataque_posicional',
    nombre: 'Ataque Posicional (Juego de Posición)',
    filosofia: 'Ocupación racional con máxima amplitud y profundidad. Fijación de marcas centrales para generar el tercer hombre en pasillos interiores.',
    foco: 'Paciencia en circulación, perfiles orientados y ventaja posicional.',
    badge: 'Juego Asociativo',
    buildSteps: () => [
      {
        descripcion: 'Estructura 1-4-3-3 abierta: Extremos en línea de cal y laterales en pasillo interno',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 90 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 35, y: 70 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 65, y: 70 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 72, y: 56 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 28, y: 56 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 50, y: 60 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 38, y: 44 },
          { id: 'JUG-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 62, y: 44 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 88, y: 32 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 12, y: 32 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 50, y: 25 },
        ],
        balon: { x: 50, y: 58 },
      },
    ],
  },
  {
    key: 'salida_lavolpiana',
    nombre: 'Salida Lavolpiana',
    filosofia: 'Descenso del pivote (#6) entre los centrales (#4 y #5) formando línea de 3 para impulsar a los laterales (#2 y #3) a zonas de ataque.',
    foco: 'Superioridad numérica 3v2 en primera fase de iniciación.',
    badge: 'Iniciación Baja',
    buildSteps: () => [
      {
        descripcion: 'Pivote defensivo incrustado entre centrales, laterales proyectados a mitad de cancha',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 92 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 26, y: 78 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 50, y: 80 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 74, y: 78 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 10, y: 52 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 90, y: 52 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 38, y: 58 },
          { id: 'JUG-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 62, y: 58 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 22, y: 34 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 78, y: 34 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 50, y: 28 },
          { id: 'RIV-9', dorsal: 9, label: '9', rol: 'DEL', team: 'B', color: 'azul', x: 42, y: 72 },
          { id: 'RIV-11', dorsal: 11, label: '11', rol: 'DEL', team: 'B', color: 'azul', x: 58, y: 72 },
        ],
        balon: { x: 50, y: 78 },
      },
    ],
  },
  {
    key: 'bloque_medio',
    nombre: 'Bloque Medio Compacto 1-4-4-2',
    filosofia: 'Compacidad máxima entre líneas (20-22 metros). Basculación zonal sincronizada que cierra carriles centrales y orienta hacia afuera.',
    foco: 'Densidad central, coberturas y temporización.',
    badge: 'Defensa Zonal',
    buildSteps: () => [
      {
        descripcion: 'Línea de 4 defensores + 4 mediocampistas basculando en bloque compacto',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 88 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 20, y: 68 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 40, y: 68 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 60, y: 68 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 80, y: 68 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'MI', team: 'A', color: 'vinotinto', x: 22, y: 52 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MC', team: 'A', color: 'vinotinto', x: 42, y: 52 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 58, y: 52 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'MD', team: 'A', color: 'vinotinto', x: 78, y: 52 },
          { id: 'JUG-10', dorsal: 10, label: '10', rol: 'SD', team: 'A', color: 'vinotinto', x: 45, y: 38 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 55, y: 38 },
        ],
        balon: { x: 50, y: 48 },
      },
    ],
  },
  {
    key: 'transicion_rapida',
    nombre: 'Transición Ofensiva Rápida (Contragolpe)',
    filosofia: 'Aceleración vertical con 3 o 4 toques hacia extremos tras recuperación en campo propio, buscando la espalda de la zaga rival desorganizada.',
    foco: 'Pase filtrado veloz y desmarque en ruptura.',
    badge: 'Contragolpe',
    buildSteps: () => [
      {
        descripcion: 'Robo de balón en tercio medio y pase filtrado a extremos que pican al espacio',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 90 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 38, y: 72 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 62, y: 72 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 48, y: 64 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 54, y: 55 },
          { id: 'JUG-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 18, y: 38 },
          { id: 'JUG-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 82, y: 36 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 52, y: 24 },
        ],
        balon: { x: 50, y: 62 },
      },
    ],
  },
  {
    key: 'repliegue_bajo',
    nombre: 'Repliegue Bajo y Protección de Área',
    filosofia: 'Defensa en los últimos 28 metros, blindando el carril central y forzando centros desfavorables para ganar el juego aéreo y segundas jugadas.',
    foco: 'Bloque defensivo de área y achique de disparos.',
    badge: 'Bloque Bajo',
    buildSteps: () => [
      {
        descripcion: 'Línea compacta frente al área chica y pivotes tapando la frontal',
        jugadores: [
          { id: 'JUG-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 92 },
          { id: 'JUG-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 24, y: 80 },
          { id: 'JUG-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 42, y: 81 },
          { id: 'JUG-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 58, y: 81 },
          { id: 'JUG-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 76, y: 80 },
          { id: 'JUG-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 40, y: 72 },
          { id: 'JUG-8', dorsal: 8, label: '8', rol: 'MC', team: 'A', color: 'vinotinto', x: 60, y: 72 },
          { id: 'JUG-9', dorsal: 9, label: '9', rol: 'DC', team: 'A', color: 'rojo', x: 50, y: 55 },
        ],
        balon: { x: 50, y: 65 },
      },
    ],
  },
];

export const EJERCICIOS_TAREAS_PRO = [
  {
    key: 'rondo_4v4_3',
    titulo: 'Rondo Posicional 4v4 + 3 Comodines',
    categoria_tarea: 'Conservación & Tercer Hombre',
    objetivo: 'Mantener posesión en cuadrado 20x20m encontrando al comodín interior para descargar a la banda opuesta con máxima velocidad.',
    duracion: '4 bloques de 4 min',
    buildSteps: () => [
      {
        descripcion: 'Paso 1: Inicio en cuadrado delimitado por 4 conos',
        jugadores: [
          { id: 'CONO-1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'naranja', x: 25, y: 25 },
          { id: 'CONO-2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'naranja', x: 75, y: 25 },
          { id: 'CONO-3', dorsal: 'C3', label: 'C3', rol: 'CONO', team: 'CONO', color: 'naranja', x: 75, y: 75 },
          { id: 'CONO-4', dorsal: 'C4', label: 'C4', rol: 'CONO', team: 'CONO', color: 'naranja', x: 25, y: 75 },
          { id: 'JUG-1', dorsal: 2, label: '2', rol: 'LAT', team: 'A', color: 'vinotinto', x: 25, y: 50 },
          { id: 'JUG-2', dorsal: 3, label: '3', rol: 'LAT', team: 'A', color: 'vinotinto', x: 75, y: 50 },
          { id: 'JUG-3', dorsal: 4, label: '4', rol: 'EXT', team: 'A', color: 'vinotinto', x: 50, y: 25 },
          { id: 'JUG-4', dorsal: 5, label: '5', rol: 'EXT', team: 'A', color: 'vinotinto', x: 50, y: 75 },
          { id: 'COM-1', dorsal: 6, label: '6', rol: 'COM', team: 'A', color: 'oro', x: 50, y: 50 },
          { id: 'COM-2', dorsal: 8, label: '8', rol: 'COM', team: 'A', color: 'oro', x: 35, y: 35 },
          { id: 'COM-3', dorsal: 10, label: '10', rol: 'COM', team: 'A', color: 'oro', x: 65, y: 65 },
          { id: 'DEF-1', dorsal: 4, label: '4', rol: 'PRES', team: 'B', color: 'azul', x: 42, y: 44 },
          { id: 'DEF-2', dorsal: 5, label: '5', rol: 'PRES', team: 'B', color: 'azul', x: 58, y: 44 },
          { id: 'DEF-3', dorsal: 7, label: '7', rol: 'PRES', team: 'B', color: 'azul', x: 42, y: 56 },
          { id: 'DEF-4', dorsal: 9, label: '9', rol: 'PRES', team: 'B', color: 'azul', x: 58, y: 56 },
        ],
        balon: { x: 27, y: 50 },
      },
      {
        descripcion: 'Paso 2: Pase al comodín interior #6 y descarga rápida al extremo #3',
        jugadores: [
          { id: 'CONO-1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'naranja', x: 25, y: 25 },
          { id: 'CONO-2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'naranja', x: 75, y: 25 },
          { id: 'CONO-3', dorsal: 'C3', label: 'C3', rol: 'CONO', team: 'CONO', color: 'naranja', x: 75, y: 75 },
          { id: 'CONO-4', dorsal: 'C4', label: 'C4', rol: 'CONO', team: 'CONO', color: 'naranja', x: 25, y: 75 },
          { id: 'JUG-1', dorsal: 2, label: '2', rol: 'LAT', team: 'A', color: 'vinotinto', x: 25, y: 50 },
          { id: 'JUG-2', dorsal: 3, label: '3', rol: 'LAT', team: 'A', color: 'vinotinto', x: 75, y: 50 },
          { id: 'JUG-3', dorsal: 4, label: '4', rol: 'EXT', team: 'A', color: 'vinotinto', x: 50, y: 25 },
          { id: 'JUG-4', dorsal: 5, label: '5', rol: 'EXT', team: 'A', color: 'vinotinto', x: 50, y: 75 },
          { id: 'COM-1', dorsal: 6, label: '6', rol: 'COM', team: 'A', color: 'oro', x: 52, y: 50 },
          { id: 'COM-2', dorsal: 8, label: '8', rol: 'COM', team: 'A', color: 'oro', x: 40, y: 32 },
          { id: 'COM-3', dorsal: 10, label: '10', rol: 'COM', team: 'A', color: 'oro', x: 62, y: 62 },
          { id: 'DEF-1', dorsal: 4, label: '4', rol: 'PRES', team: 'B', color: 'azul', x: 38, y: 48 },
          { id: 'DEF-2', dorsal: 5, label: '5', rol: 'PRES', team: 'B', color: 'azul', x: 55, y: 46 },
          { id: 'DEF-3', dorsal: 7, label: '7', rol: 'PRES', team: 'B', color: 'azul', x: 45, y: 54 },
          { id: 'DEF-4', dorsal: 9, label: '9', rol: 'PRES', team: 'B', color: 'azul', x: 62, y: 54 },
        ],
        balon: { x: 73, y: 50 },
      },
    ],
  },
  {
    key: 'basculacion_4_def',
    titulo: 'Basculación Defensiva Línea de 4 + Pivote',
    categoria_tarea: 'Fase Defensiva Zonal',
    objetivo: 'Coordinar desplazamientos en bloque según la posición del balón, manteniendo distancias de cobertura y permuta.',
    duracion: '3 series de 6 min',
    buildSteps: () => [
      {
        descripcion: 'Paso 1: Balón en banda izquierda rival, basculación defensiva hacia carril izquierdo propio',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 90 },
          { id: 'DEF-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 18, y: 72 },
          { id: 'DEF-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 34, y: 72 },
          { id: 'DEF-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 52, y: 72 },
          { id: 'DEF-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 70, y: 72 },
          { id: 'PIV-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 38, y: 60 },
          { id: 'RIV-7', dorsal: 7, label: '7', rol: 'ED', team: 'B', color: 'azul', x: 14, y: 64 },
          { id: 'RIV-8', dorsal: 8, label: '8', rol: 'MC', team: 'B', color: 'azul', x: 32, y: 52 },
          { id: 'RIV-10', dorsal: 10, label: '10', rol: 'MP', team: 'B', color: 'azul', x: 55, y: 50 },
        ],
        balon: { x: 16, y: 65 },
      },
      {
        descripcion: 'Paso 2: Cambio de orientación rival a banda derecha, basculación sincronizada al lado opuesto',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 90 },
          { id: 'DEF-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 30, y: 72 },
          { id: 'DEF-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 48, y: 72 },
          { id: 'DEF-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 66, y: 72 },
          { id: 'DEF-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 82, y: 72 },
          { id: 'PIV-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 62, y: 60 },
          { id: 'RIV-7', dorsal: 7, label: '7', rol: 'ED', team: 'B', color: 'azul', x: 26, y: 56 },
          { id: 'RIV-8', dorsal: 8, label: '8', rol: 'MC', team: 'B', color: 'azul', x: 48, y: 48 },
          { id: 'RIV-10', dorsal: 10, label: '10', rol: 'MP', team: 'B', color: 'azul', x: 84, y: 62 },
        ],
        balon: { x: 82, y: 64 },
      },
    ],
  },
  {
    key: 'finalizacion_3v2',
    titulo: 'Transición Ofensiva y Finalización 3 vs 2 + Arquero',
    categoria_tarea: 'Último Tercio & Remate',
    objetivo: 'Explotar la superioridad numérica 3v2 en velocidad, fijando central para filtrar o rematar a puerta.',
    duracion: '5 series de 4 repeticiones',
    buildSteps: () => [
      {
        descripcion: 'Paso 1: Conducción central con 2 extremos desdoblados y 2 defensores replegando',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 10 },
          { id: 'DEF-4', dorsal: 4, label: '4', rol: 'DFC', team: 'B', color: 'azul', x: 42, y: 28 },
          { id: 'DEF-5', dorsal: 5, label: '5', rol: 'DFC', team: 'B', color: 'azul', x: 58, y: 28 },
          { id: 'ATA-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 50, y: 46 },
          { id: 'ATA-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 74, y: 42 },
          { id: 'ATA-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 26, y: 42 },
        ],
        balon: { x: 50, y: 44 },
      },
      {
        descripcion: 'Paso 2: Fijación y pase al desmarque del #7 para remate cruzado al segundo palo',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 53, y: 12 },
          { id: 'DEF-4', dorsal: 4, label: '4', rol: 'DFC', team: 'B', color: 'azul', x: 46, y: 22 },
          { id: 'DEF-5', dorsal: 5, label: '5', rol: 'DFC', team: 'B', color: 'azul', x: 62, y: 20 },
          { id: 'ATA-10', dorsal: 10, label: '10', rol: 'MP', team: 'A', color: 'vinotinto', x: 48, y: 32 },
          { id: 'ATA-7', dorsal: 7, label: '7', rol: 'ED', team: 'A', color: 'vinotinto', x: 68, y: 18 },
          { id: 'ATA-11', dorsal: 11, label: '11', rol: 'EI', team: 'A', color: 'vinotinto', x: 30, y: 20 },
        ],
        balon: { x: 66, y: 19 },
      },
    ],
  },
  {
    key: 'salida_presion',
    titulo: 'Salida de Balón ante Bloque de Presión Alta',
    categoria_tarea: 'Iniciación del Juego',
    objetivo: 'Atraer al bloque rival para encontrar al hombre libre en el lado débil o conectar con el mediocentro.',
    duracion: '4 series de 5 min',
    buildSteps: () => [
      {
        descripcion: 'Centrales abiertos al borde del área grande, portero con balón y lateral alto',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 92 },
          { id: 'DEF-4', dorsal: 4, label: '4', rol: 'DFC', team: 'A', color: 'vinotinto', x: 28, y: 82 },
          { id: 'DEF-5', dorsal: 5, label: '5', rol: 'DFC', team: 'A', color: 'vinotinto', x: 72, y: 82 },
          { id: 'LAT-3', dorsal: 3, label: '3', rol: 'LI', team: 'A', color: 'vinotinto', x: 12, y: 62 },
          { id: 'LAT-2', dorsal: 2, label: '2', rol: 'LD', team: 'A', color: 'vinotinto', x: 88, y: 62 },
          { id: 'PIV-6', dorsal: 6, label: '6', rol: 'MCD', team: 'A', color: 'vinotinto', x: 50, y: 68 },
          { id: 'RIV-9', dorsal: 9, label: '9', rol: 'DC', team: 'B', color: 'azul', x: 44, y: 84 },
          { id: 'RIV-11', dorsal: 11, label: '11', rol: 'EI', team: 'B', color: 'azul', x: 70, y: 74 },
          { id: 'RIV-7', dorsal: 7, label: '7', rol: 'ED', team: 'B', color: 'azul', x: 30, y: 74 },
        ],
        balon: { x: 50, y: 90 },
      },
    ],
  },
  {
    key: 'circuito_tiro',
    titulo: 'Circuito Técnico-Coordinativo + Definición',
    categoria_tarea: 'Coordinación & Remate',
    objetivo: 'Coordinación en escalera de velocidad, salto de valla baja, cambio de ritmo entre conos y remate de primera.',
    duracion: '3 series de 8 repeticiones',
    buildSteps: () => [
      {
        descripcion: 'Materiales dispuestos en hilera: Escalera, vallas, conos y zona de disparo',
        jugadores: [
          { id: 'POR-1', dorsal: 1, label: '1', rol: 'POR', team: 'GK', color: 'oro', x: 50, y: 10 },
          { id: 'ESC-1', dorsal: 'ESC', label: 'ESC', rol: 'ESCALERA', team: 'MAT', color: 'dorado', x: 30, y: 65 },
          { id: 'VAL-1', dorsal: 'V1', label: 'V1', rol: 'VALLA', team: 'MAT', color: 'celeste', x: 30, y: 52 },
          { id: 'CON-1', dorsal: 'C1', label: 'C1', rol: 'CONO', team: 'CONO', color: 'naranja', x: 38, y: 42 },
          { id: 'CON-2', dorsal: 'C2', label: 'C2', rol: 'CONO', team: 'CONO', color: 'naranja', x: 44, y: 35 },
          { id: 'PAS-10', dorsal: 10, label: '10', rol: 'PASADOR', team: 'A', color: 'oro', x: 70, y: 34 },
          { id: 'EVAL-9', dorsal: 9, label: '9', rol: 'ATLETA', team: 'A', color: 'rojo', x: 30, y: 75 },
        ],
        balon: { x: 68, y: 34 },
      },
    ],
  },
];

const DEFAULT_PRESET_BY_MODALIDAD = {
  Campo: '11v11_propio',
  F7: '7v7_propio',
  Sala: '5v5_sala',
};

const QUADRANT_TO_DISCIPLINE = {
  'Cuadrante Norte - Campo': 'Campo',
  'Cuadrante Sur - F7': 'F7',
  'Cancha Techada - Sala': 'Sala',
};

function extractBaseTokens(activeTactica, fallbackMod = 'Campo') {
  const f = activeTactica?.formacion_json;
  if (Array.isArray(f) && f.length > 0) {
    return f.map((j, i) => ({
      ...j,
      id: getTokenId(j, i),
      dorsal: j.dorsal ?? j.label ?? i + 1,
      label: j.label ?? String(j.dorsal ?? i + 1),
      rol: j.rol || 'JUG',
      team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
      color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
      x: Number(j.x ?? 50),
      y: Number(j.y ?? 50),
    }));
  }
  if (f && Array.isArray(f.jugadores) && f.jugadores.length > 0) {
    return f.jugadores.map((j, i) => ({
      ...j,
      id: getTokenId(j, i),
      dorsal: j.dorsal ?? j.label ?? i + 1,
      label: j.label ?? String(j.dorsal ?? i + 1),
      team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
      color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
      x: Number(j.x ?? 50),
      y: Number(j.y ?? 50),
    }));
  }
  const presetKey = DEFAULT_PRESET_BY_MODALIDAD[fallbackMod] || '11v11_propio';
  return buildPresetSteps(presetKey, 'jugadores')[0].jugadores;
}

function normalizePasos(activeTactica, fallbackMod = 'Campo') {
  const baseTokens = extractBaseTokens(activeTactica, fallbackMod);
  const mov = activeTactica?.movimientos_json;
  const rawList = Array.isArray(mov) ? mov : mov && Array.isArray(mov.pasos) ? mov.pasos : null;

  if (rawList && rawList.length > 0) {
    return rawList.map((p, idx) => {
      const srcPlayers = Array.isArray(p.jugadores)
        ? p.jugadores
        : Array.isArray(p.actores)
        ? p.actores
        : Array.isArray(p.players)
        ? p.players
        : baseTokens;
      return {
        descripcion: p.descripcion || p.label || `Paso ${idx + 1}`,
        jugadores: srcPlayers.map((j, i) => ({
          ...j,
          id: getTokenId(j, i),
          dorsal: j.dorsal ?? j.label ?? i + 1,
          label: j.label ?? String(j.dorsal ?? i + 1),
          team: j.team || (j.rol === 'POR' ? 'GK' : 'A'),
          color: j.color || (j.rol === 'POR' ? 'oro' : 'vinotinto'),
          x: Number(j.x ?? 50),
          y: Number(j.y ?? 50),
        })),
        balon: p.balon ? { ...p.balon } : p.ball ? { ...p.ball } : { x: 50, y: 55 },
      };
    });
  }

  return [
    {
      descripcion: 'Paso 1: Inicio / Formación Base',
      jugadores: baseTokens.map((j) => ({ ...j })),
      balon: { x: 50, y: 58 },
    },
  ];
}

function AccordionSection({ title, icon: Icon, badge, isOpen, onToggle, children }) {
  return (
    <div className="bg-[#141418] border border-neutral-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#1a1a21] transition"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-white">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-vinotinto/50 border border-vinotinto text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[560px] opacity-100 border-t border-neutral-800' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3.5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export default function TacticalSimulatorModule({
  tacticas = [],
  trabajos = [],
  categories = [],
  players = [],
  selectedCategoryFilter = '',
  initialTrabajoId = null,
  onCreated,
}) {
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryFilter || '');
  const [selectedId, setSelectedId] = useState(tacticas[0]?.id_tactica || null);
  const [linkedTrabajoId, setLinkedTrabajoId] = useState(
    initialTrabajoId ? String(initialTrabajoId) : ''
  );

  // Acordeón deslizante de submenús: 'estilos' | 'ejercicios' | 'atletas' | 'opciones' | 'jugadores' | 'rivales' | 'materiales'
  const [openSection, setOpenSection] = useState('estilos');

  // Pasos 2D + Modos: Comienza en Cero (Cancha Limpia)
  const [pasos, setPasos] = useState(() => [
    {
      descripcion: 'Paso 1: Pizarra en Cero (Cancha Limpia)',
      jugadores: [],
      balon: { x: 50, y: 50 },
    },
  ]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [selectedTokenId, setSelectedTokenId] = useState('BALON');
  const [toolMode, setToolMode] = useState('move'); // move | pase_corto | pase_largo | recta | zigzag
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [boardModalidad, setBoardModalidad] = useState('Campo');
  const [customScenarioDirty, setCustomScenarioDirty] = useState(false);

  // Animación Play 2D
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(0.8);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);

  // Creación / Mensajes
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTactica, setNewTactica] = useState({
    id_categoria: selectedCategoryFilter || '',
    id_trabajo: initialTrabajoId ? String(initialTrabajoId) : '',
    nombre_sistema: '',
    modalidad: 'Campo',
    descripcion: '',
    pros: '',
    contras: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedCategoryFilter !== undefined) {
      setCategoryFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Cuando el entrenador salta desde "Trabajos y Cancha" con un trabajo específico
  useEffect(() => {
    if (!initialTrabajoId) return;
    const strId = String(initialTrabajoId);
    setLinkedTrabajoId(strId);
    const job = trabajos.find((t) => String(t.id_trabajo) === strId);
    if (job) {
      const mod = job.categoria_modalidad || QUADRANT_TO_DISCIPLINE[job.cuadrante] || 'Campo';
      setBoardModalidad(mod);
      setModalidadFilter(mod);
      if (job.id_categoria) setCategoryFilter(String(job.id_categoria));
      setNewTactica((prev) => ({
        ...prev,
        id_trabajo: strId,
        id_categoria: job.id_categoria ? String(job.id_categoria) : prev.id_categoria,
        modalidad: mod,
        nombre_sistema: prev.nombre_sistema || `Esquema: ${job.titulo}`.slice(0, 80),
        descripcion: prev.descripcion || job.descripcion_escrita || '',
      }));

      // Si ya existe una táctica ligada a ese trabajo, seleccionarla
      const linkedTac = tacticas.find((tc) => String(tc.id_trabajo) === strId);
      if (linkedTac) {
        setSelectedId(linkedTac.id_tactica);
        setCustomScenarioDirty(false);
      } else if (job.animacion_3d_json?.pasos?.length > 0) {
        setPasos(normalizePasos({ movimientos_json: job.animacion_3d_json }, mod));
        setCustomScenarioDirty(true);
      }
      setFeedback(`Trabajo vinculado: "${job.titulo}" (${job.espacio_cancha || 'Cancha'}). Diseña y guarda la pizarra 2D para esta tarea.`);
    }
  }, [initialTrabajoId, trabajos, tacticas]);

  const filteredTacticas = useMemo(() => {
    return tacticas.filter((t) => {
      if (modalidadFilter !== 'Todas' && t.modalidad !== modalidadFilter) return false;
      if (categoryFilter && String(t.id_categoria || '') !== String(categoryFilter)) return false;
      return true;
    });
  }, [tacticas, modalidadFilter, categoryFilter]);

  const activeTactica = useMemo(() => {
    if (filteredTacticas.length === 0) return null;
    return filteredTacticas.find((t) => t.id_tactica === selectedId) || filteredTacticas[0];
  }, [filteredTacticas, selectedId]);

  useEffect(() => {
    if (filteredTacticas.length > 0 && !filteredTacticas.some((t) => t.id_tactica === selectedId)) {
      setSelectedId(filteredTacticas[0].id_tactica);
    }
  }, [filteredTacticas, selectedId]);

  useEffect(() => {
    if (customScenarioDirty) return;
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);

    if (showNewForm) {
      const mod = newTactica.modalidad || 'Campo';
      setBoardModalidad(mod);
      setPasos(buildPresetSteps(DEFAULT_PRESET_BY_MODALIDAD[mod] || '11v11_propio', 'jugadores'));
      setSelectedTokenId('BALON');
      return;
    }

    if (activeTactica) {
      const mod = activeTactica.modalidad || 'Campo';
      setBoardModalidad(mod);
      if (activeTactica.id_trabajo) {
        setLinkedTrabajoId(String(activeTactica.id_trabajo));
      }
      const nextSteps = normalizePasos(activeTactica, mod);
      setPasos(nextSteps);
      const firstTok = nextSteps[0]?.jugadores?.[0];
      setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    } else {
      const catObj = categories.find((c) => String(c.id_categoria) === String(categoryFilter));
      const fallbackMod =
        modalidadFilter !== 'Todas' ? modalidadFilter : catObj?.modalidad || 'Campo';
      setBoardModalidad(fallbackMod);
      setPasos([
        {
          descripcion: 'Paso 1: Pizarra en Cero (Cancha Limpia)',
          jugadores: [],
          balon: { x: 50, y: 50 },
        },
      ]);
      setSelectedTokenId('BALON');
    }
  }, [activeTactica, modalidadFilter, categoryFilter, categories, showNewForm, newTactica.modalidad, customScenarioDirty]);

  // Motor Play 2D
  useEffect(() => {
    if (!isPlaying || pasos.length < 2) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      return;
    }
    const tick = (ts) => {
      if (!lastFrameRef.current) lastFrameRef.current = ts;
      const dt = (ts - lastFrameRef.current) / 1000;
      lastFrameRef.current = ts;
      setPlayProgress((prev) => {
        const next = prev + dt * playSpeed;
        return next >= pasos.length - 1 ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, pasos.length, playSpeed]);

  const displayedState = useMemo(() => {
    if (pasos.length === 0) return { jugadores: [], balon: { x: 50, y: 50 }, descripcion: '' };
    if (!isPlaying) {
      const cur = pasos[Math.min(activeStepIdx, pasos.length - 1)];
      return {
        jugadores: getStepTokens(cur, 'jugadores'),
        balon: cur.balon || { x: 50, y: 50 },
        descripcion: cur.descripcion || '',
      };
    }

    const idxA = Math.min(Math.floor(playProgress), pasos.length - 1);
    const idxB = Math.min(idxA + 1, pasos.length - 1);
    const t = playProgress - idxA;
    const stepA = pasos[idxA];
    const stepB = pasos[idxB];

    const listA = getStepTokens(stepA, 'jugadores');
    const listB = getStepTokens(stepB, 'jugadores');

    const jugadores = listA.map((j, i) => {
      const jid = getTokenId(j, i);
      const target = listB.find((b, k) => getTokenId(b, k) === jid) || listB[i] || j;
      return {
        ...j,
        id: jid,
        x: j.x + (target.x - j.x) * t,
        y: j.y + (target.y - j.y) * t,
      };
    });

    const bA = stepA.balon || { x: 50, y: 50 };
    const bB = stepB.balon || bA;
    return {
      jugadores,
      balon: { x: bA.x + (bB.x - bA.x) * t, y: bA.y + (bB.y - bA.y) * t },
      descripcion: stepA.descripcion || '',
    };
  }, [pasos, isPlaying, activeStepIdx, playProgress]);

  const trajectories = useMemo(() => extractTrajectoriesFromPasos(pasos, 'jugadores'), [pasos]);

  const categoryFormationCount = useMemo(() => {
    const targetCat = categoryFilter || newTactica.id_categoria;
    if (!targetCat) return null;
    return tacticas.filter((t) => String(t.id_categoria || '') === String(targetCat)).length;
  }, [tacticas, categoryFilter, newTactica.id_categoria]);

  const currentTokens = getStepTokens(
    pasos[Math.min(activeStepIdx, Math.max(0, pasos.length - 1))],
    'jugadores'
  );

  // Detectar qué dorsales 1..22 están activos en cancha (propios y rivales)
  const activeOwnByDorsal = useMemo(() => {
    const map = new Map();
    currentTokens.forEach((t, idx) => {
      if (t.team === 'A' || t.team === 'GK') {
        map.set(Number(t.dorsal), getTokenId(t, idx));
      }
    });
    return map;
  }, [currentTokens]);

  const activeRivalByDorsal = useMemo(() => {
    const map = new Map();
    currentTokens.forEach((t, idx) => {
      if (t.team === 'B' || t.team === 'GK_B') {
        map.set(Number(t.dorsal), getTokenId(t, idx));
      }
    });
    return map;
  }, [currentTokens]);

  const handleToggleNumberedPlayer = (team, dorsal) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const existingTid =
      team === 'A' ? activeOwnByDorsal.get(dorsal) : activeRivalByDorsal.get(dorsal);
    if (existingTid) {
      setSelectedTokenId(existingTid);
      return;
    }
    const curStep = pasos[activeStepIdx] || pasos[0];
    const newTok = createNumberedPlayerToken(team, dorsal, getStepTokens(curStep, 'jugadores'));
    setPasos((prev) =>
      prev.map((step) => {
        const list = getStepTokens(step, 'jugadores');
        return cloneStepWithTokens(step, 'jugadores', [...list, { ...newTok }]);
      })
    );
    setSelectedTokenId(newTok.id);
  };

  const handleAddMaterial = (materialKey) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const curStep = pasos[activeStepIdx] || pasos[0];
    const newTok = createMaterialToken(materialKey, getStepTokens(curStep, 'jugadores'));
    setPasos((prev) =>
      prev.map((step) => {
        const list = getStepTokens(step, 'jugadores');
        return cloneStepWithTokens(step, 'jugadores', [...list, { ...newTok }]);
      })
    );
    setSelectedTokenId(newTok.id);
  };

  const handleRemoveSelectedToken = () => {
    if (!selectedTokenId || selectedTokenId === 'BALON') return;
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step) => {
        const remaining = getStepTokens(step, 'jugadores').filter(
          (t, i) => getTokenId(t, i) !== selectedTokenId
        );
        return cloneStepWithTokens(step, 'jugadores', remaining);
      })
    );
    setSelectedTokenId('BALON');
  };

  const handleClearMaterialsOnly = () => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step) => {
        const onlyPlayers = getStepTokens(step, 'jugadores').filter(
          (t) => t.team !== 'CONO' && t.team !== 'MAT'
        );
        return cloneStepWithTokens(step, 'jugadores', onlyPlayers);
      })
    );
  };

  const handleMoveToken = (tokenId, x, y) => {
    setCustomScenarioDirty(true);
    setPasos((prev) =>
      prev.map((step, sIdx) => {
        if (sIdx !== activeStepIdx) return step;
        if (tokenId === 'BALON') {
          return { ...step, balon: { x, y, movKind: 'balon' } };
        }
        const updated = getStepTokens(step, 'jugadores').map((tok, idx) =>
          getTokenId(tok, idx) === tokenId ? { ...tok, x, y, movKind: 'recta' } : tok
        );
        return cloneStepWithTokens(step, 'jugadores', updated);
      })
    );
    setSelectedTokenId(tokenId);
  };

  const handlePitchClick = (x, y) => {
    setCustomScenarioDirty(true);
    if (toolMode === 'pase_corto' || toolMode === 'pase_largo') {
      const res = applyPassMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        destX: x,
        destY: y,
        kind: toolMode,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      setSelectedTokenId('BALON');
      return;
    }

    if (toolMode === 'zigzag') {
      const res = applyZigZagMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        targetId: selectedTokenId || 'BALON',
        destX: x,
        destY: y,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      return;
    }

    if (toolMode === 'recta') {
      const res = applyLinearMoveSteps({
        pasos,
        stepIdx: activeStepIdx,
        targetId: selectedTokenId || 'BALON',
        destX: x,
        destY: y,
        preferredKey: 'jugadores',
      });
      setPasos(res.pasos);
      setActiveStepIdx(res.nextStepIdx);
      return;
    }

    handleMoveToken(selectedTokenId || 'BALON', x, y);
  };

  const categoryAthletes = useMemo(() => {
    if (!categoryFilter) return players;
    return players.filter((p) => String(p.id_categoria) === String(categoryFilter));
  }, [players, categoryFilter]);

  const handleClearBoardToZero = () => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos([
      {
        descripcion: 'Paso 1: Pizarra en Cero (Cancha Limpia)',
        jugadores: [],
        balon: { x: 50, y: 50 },
      },
    ]);
    setSelectedTokenId('BALON');
    setActiveStepIdx(0);
    setFeedback('Pizarra táctica limpia en cero. Selecciona atletas, estilo de juego o una tarea profesional.');
  };

  const handleLoadBaseFormation = () => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);
    setCustomScenarioDirty(true);
    const presetKey = DEFAULT_PRESET_BY_MODALIDAD[boardModalidad] || '11v11_propio';
    const nextSteps = buildPresetSteps(presetKey, 'jugadores');
    setPasos(nextSteps);
    const firstTok = nextSteps[0]?.jugadores?.[0];
    setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    setFeedback(`Formación base cargada para Fútbol ${boardModalidad}.`);
  };

  const handleApplyStyle = (style) => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);
    setCustomScenarioDirty(true);
    const newSteps = style.buildSteps(boardModalidad);
    setPasos(newSteps);
    const firstTok = newSteps[0]?.jugadores?.[0];
    setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    setFeedback(`Estilo aplicado: "${style.nombre}". ${style.filosofia}`);
    setNewTactica((prev) => ({
      ...prev,
      nombre_sistema: prev.nombre_sistema || style.nombre,
      descripcion: style.filosofia,
      pros: style.foco,
    }));
  };

  const handleApplyExercise = (exercise) => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);
    setCustomScenarioDirty(true);
    const newSteps = exercise.buildSteps(boardModalidad);
    setPasos(newSteps);
    const firstTok = newSteps[0]?.jugadores?.[0];
    setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    setFeedback(`Tarea profesional cargada: "${exercise.titulo}" (${exercise.categoria_tarea}).`);
    setNewTactica((prev) => ({
      ...prev,
      nombre_sistema: prev.nombre_sistema || exercise.titulo,
      descripcion: exercise.objetivo,
      pros: `Duración: ${exercise.duracion}`,
    }));
  };

  const handleAddPlayerFromSquad = (player) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const curStep = pasos[activeStepIdx] || pasos[0];
    const curJugadores = getStepTokens(curStep, 'jugadores');

    const pTokId = `ATLETA-${player.id_jugador}`;
    const exists = curJugadores.some(
      (j) => String(j.id_jugador) === String(player.id_jugador) || j.id === pTokId
    );
    if (exists) {
      setSelectedTokenId(pTokId);
      setFeedback(`Atleta ${player.nombre} ya está en la pizarra.`);
      return;
    }

    const pos = (player.posicion_principal || 'MED').toUpperCase();
    let posX = 50;
    let posY = 55;
    let team = 'A';
    let color = 'vinotinto';
    let rol = pos.slice(0, 3);

    if (pos.includes('POR') || pos.includes('ARQ')) {
      posX = 50;
      posY = 88;
      team = 'GK';
      color = 'oro';
      rol = 'POR';
    } else if (pos.includes('DEF') || pos.includes('CEN') || pos.includes('LAT')) {
      posX = curJugadores.length % 2 === 0 ? 35 : 65;
      posY = 72;
      rol = 'DEF';
    } else if (pos.includes('DEL') || pos.includes('PUN') || pos.includes('EXT')) {
      posX = curJugadores.length % 2 === 0 ? 40 : 60;
      posY = 32;
      color = 'rojo';
      rol = 'DEL';
    } else {
      posX = 30 + ((curJugadores.length * 15) % 45);
      posY = 52;
      rol = 'MED';
    }

    const newTok = {
      id: pTokId,
      id_jugador: player.id_jugador,
      nombre: player.nombre,
      dorsal: player.numero_camiseta || curJugadores.length + 1,
      label: String(player.numero_camiseta || curJugadores.length + 1),
      rol,
      team,
      color,
      x: posX,
      y: posY,
    };

    setPasos((prev) =>
      prev.map((step) => {
        const list = getStepTokens(step, 'jugadores');
        return cloneStepWithTokens(step, 'jugadores', [...list, { ...newTok }]);
      })
    );
    setSelectedTokenId(newTok.id);
    setFeedback(`Atleta ${player.nombre} (#${newTok.dorsal} • ${rol}) posicionado en la pizarra.`);
  };

  const handleApplyPreset = (presetKey) => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveStepIdx(0);
    setCustomScenarioDirty(true);
    const nextPasos = buildPresetSteps(presetKey, 'jugadores');
    setPasos(nextPasos);

    if (presetKey === '5v5_sala') setBoardModalidad('Sala');
    else if (presetKey === '7v7_f7' || presetKey === '7v7_propio') setBoardModalidad('F7');
    else if (presetKey === '11v11_propio' || presetKey === '11v11_completo') setBoardModalidad('Campo');

    const firstTok = nextPasos[0]?.jugadores?.[0];
    setSelectedTokenId(firstTok ? getTokenId(firstTok, 0) : 'BALON');
    setFeedback(`Escenario cargado: ${SCENARIO_PRESETS.find((p) => p.key === presetKey)?.label}.`);
  };

  const handleQuickAttackAndDefend = (targetMode) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const targetId =
      targetMode === 'TEAM_A'
        ? 'TEAM_A'
        : selectedTokenId && selectedTokenId !== 'BALON'
        ? selectedTokenId
        : 'TEAM_A';
    const res = applyAttackAndDefendCycleSteps({
      pasos,
      stepIdx: activeStepIdx,
      targetId,
      preferredKey: 'jugadores',
    });
    setPasos(res.pasos);
    setActiveStepIdx(res.nextStepIdx);
    setFeedback('Ciclo agregado: Subir en ataque y bajar a defender.');
  };

  const handleQuickShoot = (corner) => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const shooterId =
      selectedTokenId && selectedTokenId !== 'BALON' ? selectedTokenId : null;
    const res = applyShootAtGoalSteps({
      pasos,
      stepIdx: activeStepIdx,
      shooterId,
      corner,
      preferredKey: 'jugadores',
    });
    setPasos(res.pasos);
    setActiveStepIdx(res.nextStepIdx);
    setFeedback('Remate al arco agregado en el paso siguiente.');
  };

  const handleAddStep = () => {
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    setPasos((prev) => {
      const last =
        prev[prev.length - 1] ||
        buildPresetSteps(DEFAULT_PRESET_BY_MODALIDAD[boardModalidad] || '11v11_propio', 'jugadores')[0];
      const nextStep = {
        descripcion: `Paso ${prev.length + 1}: Progresión Táctica`,
        jugadores: getStepTokens(last, 'jugadores').map((j) => ({ ...j })),
        balon: { ...(last.balon || { x: 50, y: 50 }) },
      };
      setActiveStepIdx(prev.length);
      return [...prev, nextStep];
    });
  };

  const handleRemoveCurrentStep = () => {
    if (pasos.length <= 1) return;
    setIsPlaying(false);
    setCustomScenarioDirty(true);
    const remaining = pasos.filter((_, idx) => idx !== activeStepIdx);
    setPasos(remaining);
    setActiveStepIdx((prev) => Math.max(0, Math.min(prev, remaining.length - 1)));
  };

  const handleSaveAnimationToExisting = async () => {
    setSaving(true);
    setFeedback('');
    setErrorMsg('');
    try {
      if (activeTactica) {
        await api.put(`/coach/tacticas/${activeTactica.id_tactica}`, {
          id_trabajo: linkedTrabajoId ? Number(linkedTrabajoId) : null,
          formacion_json: { jugadores: pasos[0]?.jugadores || [] },
          movimientos_json: { pasos },
        });
        setFeedback(
          `Pizarra "${activeTactica.nombre_sistema}" guardada${
            linkedTrabajoId ? ' y sincronizada con la tarea de Trabajos' : ''
          }.`
        );
      } else if (linkedTrabajoId) {
        await api.patch(`/coach/trabajos/${linkedTrabajoId}`, {
          animacion_3d_json: { pasos, modalidad: boardModalidad },
        });
        setFeedback('Movimientos 2D guardados directamente en el trabajo seleccionado de la agenda.');
      }
      setCustomScenarioDirty(false);
      if (onCreated) await onCreated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando movimientos 2D.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTactica = async (idTactica) => {
    setErrorMsg('');
    try {
      await api.delete(`/coach/tacticas/${idTactica}`);
      setCustomScenarioDirty(false);
      setFeedback('Formación eliminada de la categoría.');
      if (onCreated) await onCreated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error eliminando formación.');
    }
  };

  const handleSaveCustomTactica = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setFeedback('');

    const modTokens =
      pasos[0]?.jugadores?.length > 0
        ? pasos[0].jugadores
        : extractBaseTokens(null, newTactica.modalidad);

    try {
      const res = await api.post('/coach/tacticas', {
        ...newTactica,
        id_categoria: newTactica.id_categoria || categoryFilter || null,
        id_trabajo: newTactica.id_trabajo || linkedTrabajoId || null,
        formacion_json: { jugadores: modTokens },
        movimientos_json: { pasos },
      });
      setShowNewForm(false);
      setCustomScenarioDirty(false);
      setFeedback('Nueva formación guardada y vinculada al trabajo exitosamente.');
      if (onCreated) await onCreated(res.data.tactica);
      setSelectedId(res.data.tactica.id_tactica);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error guardando nueva formación.');
    } finally {
      setSaving(false);
    }
  };

  const groupedCategories = groupCategoriesByDiscipline(categories);
  const isLimitReached = categoryFormationCount !== null && categoryFormationCount >= 10;
  const linkedJobObj = trabajos.find((j) => String(j.id_trabajo) === String(linkedTrabajoId));

  return (
    <div className="space-y-5">
      {/* Barra superior: Modalidad + Categoría + Tarea de Trabajos vinculada + Nueva Formación */}
      <div className="card-fenix p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['Todas', 'Campo', 'F7', 'Sala'].map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => {
                setCustomScenarioDirty(false);
                setModalidadFilter(mod);
                if (mod !== 'Todas') {
                  setBoardModalidad(mod);
                  setNewTactica((prev) => ({ ...prev, modalidad: mod }));
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                modalidadFilter === mod
                  ? 'bg-vinotinto border-rojo-fuego text-white'
                  : 'bg-[#151515] border-neutral-800 text-texto-secundario hover:text-white'
              }`}
            >
              {mod === 'Todas' ? 'Todas las Canchas' : `Fútbol ${mod}`}
            </button>
          ))}

          <select
            className="input-fenix w-auto text-xs"
            value={categoryFilter}
            onChange={(e) => {
              const idCat = e.target.value;
              const catObj = categories.find((c) => String(c.id_categoria) === String(idCat));
              setCustomScenarioDirty(false);
              setCategoryFilter(idCat);
              setNewTactica((prev) => ({
                ...prev,
                id_categoria: idCat,
                modalidad: catObj?.modalidad || prev.modalidad,
              }));
              if (catObj?.modalidad) setBoardModalidad(catObj.modalidad);
            }}
          >
            <option value="">Todas las Categorías</option>
            {groupedCategories.map((g) => (
              <optgroup key={g.key} label={g.label}>
                {g.items.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre} ({g.short})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            className="input-fenix w-auto text-xs border-amber-500/50 max-w-[260px]"
            value={linkedTrabajoId}
            onChange={(e) => {
              const jid = e.target.value;
              setLinkedTrabajoId(jid);
              setNewTactica((prev) => ({ ...prev, id_trabajo: jid }));
            }}
            title="Vincular pizarra a una tarea guardada en Trabajos y Cancha"
          >
            <option value="">Sin vincular a tarea específica</option>
            {trabajos
              .filter((t) => t.rol_autor !== 'FISIO')
              .map((tr) => (
                <option key={tr.id_trabajo} value={tr.id_trabajo}>
                  Tarea: {tr.titulo} ({String(tr.fecha).slice(0, 10)})
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {categoryFormationCount !== null && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                isLimitReached
                  ? 'bg-rojo-fuego/20 border-rojo-fuego text-rojo-fuego'
                  : 'bg-[#151515] border-neutral-700 text-green-400'
              }`}
            >
              {categoryFormationCount} / 10 Formaciones
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setShowNewForm(!showNewForm);
            }}
            disabled={isLimitReached && !showNewForm}
            className="btn-vinotinto text-xs disabled:opacity-45"
          >
            <PlusCircle className="w-4 h-4" />
            {isLimitReached ? 'Límite 10/10' : showNewForm ? 'Cerrar' : 'Guardar Como Nueva Formación'}
          </button>
        </div>
      </div>

      {linkedJobObj && (
        <div className="bg-amber-950/35 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-100">
            <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Tarea vinculada de Trabajos:</strong> {linkedJobObj.titulo} •{' '}
              {linkedJobObj.categoria_nombre || 'Club'} • {linkedJobObj.espacio_cancha} (
              {String(linkedJobObj.hora_inicio).slice(0, 5)}–{String(linkedJobObj.hora_fin).slice(0, 5)})
            </span>
          </div>
          {!activeTactica && (
            <button
              type="button"
              onClick={handleSaveAnimationToExisting}
              disabled={saving}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px]"
            >
              <Save className="w-3 h-3 inline mr-1" /> Guardar 2D directo en esta Tarea
            </button>
          )}
        </div>
      )}

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selector de sistemas guardados */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {filteredTacticas.map((t) => (
            <div key={t.id_tactica} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => {
                  setCustomScenarioDirty(false);
                  setShowNewForm(false);
                  setSelectedId(t.id_tactica);
                }}
                className={`px-3 py-1.5 rounded-l-lg text-xs font-bold border transition ${
                  activeTactica?.id_tactica === t.id_tactica && !showNewForm
                    ? 'bg-vinotinto border-rojo-fuego text-white shadow-fenix'
                    : 'bg-[#161616] border-neutral-800 text-texto-secundario hover:text-white'
                }`}
              >
                {t.nombre_sistema}{' '}
                <span className="text-[10px] opacity-80">
                  ({t.modalidad}
                  {t.trabajo_titulo ? ` • 📌 ${t.trabajo_titulo.slice(0, 18)}` : ''})
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTactica(t.id_tactica)}
                className="px-2 py-1.5 rounded-r-lg bg-[#1c1c1c] hover:bg-rojo-fuego border border-l-0 border-neutral-800 text-neutral-400 hover:text-white transition"
                title="Eliminar formación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setPlayProgress(0);
            setActiveStepIdx(0);
            setCustomScenarioDirty(false);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {/* Formulario Nueva Formación (Máx 10 por categoría) */}
      {showNewForm && (
        <form
          onSubmit={handleSaveCustomTactica}
          className="card-fenix p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-rojo-fuego/60 text-xs"
        >
          <input
            type="text"
            className="input-fenix"
            placeholder="Nombre sistema (ej: 1-4-3-3 Presión Alta)"
            value={newTactica.nombre_sistema}
            onChange={(e) => setNewTactica({ ...newTactica, nombre_sistema: e.target.value })}
            required
          />
          <select
            className="input-fenix"
            value={newTactica.modalidad}
            onChange={(e) => {
              setCustomScenarioDirty(false);
              setNewTactica({ ...newTactica, modalidad: e.target.value });
            }}
          >
            <option value="Campo">Fútbol Campo (11v11)</option>
            <option value="F7">Fútbol 7 (7v7)</option>
            <option value="Sala">Fútbol Sala (5v5)</option>
          </select>
          <select
            className="input-fenix"
            value={newTactica.id_trabajo || linkedTrabajoId}
            onChange={(e) => setNewTactica({ ...newTactica, id_trabajo: e.target.value })}
          >
            <option value="">Opcional: Vincular a Trabajo de Agenda</option>
            {trabajos
              .filter((t) => t.rol_autor !== 'FISIO')
              .map((tr) => (
                <option key={tr.id_trabajo} value={tr.id_trabajo}>
                  {tr.titulo} ({String(tr.fecha).slice(0, 10)})
                </option>
              ))}
          </select>
          <input
            type="text"
            className="input-fenix md:col-span-3"
            placeholder="Descripción del ejercicio táctico..."
            value={newTactica.descripcion}
            onChange={(e) => setNewTactica({ ...newTactica, descripcion: e.target.value })}
          />
          <textarea
            rows={2}
            className="input-fenix"
            placeholder="Ventajas / Pros tácticos..."
            value={newTactica.pros}
            onChange={(e) => setNewTactica({ ...newTactica, pros: e.target.value })}
            required
          />
          <textarea
            rows={2}
            className="input-fenix md:col-span-2"
            placeholder="Riesgos / Contras..."
            value={newTactica.contras}
            onChange={(e) => setNewTactica({ ...newTactica, contras: e.target.value })}
            required
          />
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 bg-neutral-800 rounded-lg"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-cta text-xs py-1.5 px-4">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar Formación'}
            </button>
          </div>
        </form>
      )}

      {/* PIZARRA 2D + MÓDULOS DESLIZANTES AMIGABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Tablero 2D + Controles Play y Pasos */}
        <div className="lg:col-span-7 card-fenix p-4 space-y-3">
          {/* Barra de Acciones Rápidas: Pizarra en Cero, Formación Base, Estilos Pro, Tareas Pro, Atletas */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#121216] border border-neutral-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearBoardToZero}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 inline-flex items-center gap-1.5 border border-neutral-700 transition"
                title="Limpiar todas las fichas e iniciar la pizarra en cero"
              >
                <Eraser className="w-3.5 h-3.5 text-amber-400" />
                <span>Pizarra en Cero</span>
              </button>
              <button
                type="button"
                onClick={handleLoadBaseFormation}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 inline-flex items-center gap-1.5 border border-neutral-700 transition"
                title="Cargar formación base según la modalidad activa"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Formación Base</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOpenSection('estilos')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                  openSection === 'estilos'
                    ? 'bg-amber-500 text-black border-amber-400 shadow'
                    : 'bg-[#181820] text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Estilos Pro</span>
              </button>
              <button
                type="button"
                onClick={() => setOpenSection('ejercicios')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                  openSection === 'ejercicios'
                    ? 'bg-rojo-fuego text-white border-rojo-fuego shadow'
                    : 'bg-[#181820] text-red-300 border-red-500/40 hover:bg-red-500/20'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tareas Pro</span>
              </button>
              <button
                type="button"
                onClick={() => setOpenSection('atletas')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                  openSection === 'atletas'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-[#181820] text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Atletas ({categoryAthletes.length})</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141418] border border-neutral-800 rounded-xl p-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {pasos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepIdx(idx);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                    !isPlaying && activeStepIdx === idx
                      ? 'bg-vinotinto border-rojo-fuego text-white'
                      : 'bg-[#1b1b20] border-neutral-700 text-neutral-300'
                  }`}
                >
                  Paso {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddStep}
                className="px-2 py-1 rounded text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-white inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Paso
              </button>
              {pasos.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveCurrentStep}
                  className="px-2 py-1 rounded text-[11px] font-bold bg-neutral-800 hover:bg-rojo-fuego text-neutral-300 hover:text-white"
                >
                  - Paso
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTrajectories(!showTrajectories)}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 inline-flex items-center gap-1"
              >
                {showTrajectories ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Líneas
              </button>
              <select
                className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] font-bold text-white"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={0.8}>1x</option>
                <option value={1.4}>1.5x</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (pasos.length < 2) {
                    setErrorMsg('Usa cualquier movimiento en Opciones (Pase Corto, Pase Largo, Línea Recta, Zig-Zag o Subir/Bajar) para animar.');
                    return;
                  }
                  setErrorMsg('');
                  setIsPlaying(!isPlaying);
                }}
                className="btn-cta text-xs py-1 px-3"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pausar' : 'Play 2D'}
              </button>
              {(activeTactica || linkedTrabajoId) && !showNewForm && (
                <button
                  type="button"
                  onClick={handleSaveAnimationToExisting}
                  disabled={saving}
                  className="btn-vinotinto text-xs py-1 px-3"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar
                </button>
              )}
            </div>
          </div>

          {pasos[activeStepIdx] && !isPlaying && (
            <input
              type="text"
              className="input-fenix text-xs"
              value={pasos[activeStepIdx].descripcion || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCustomScenarioDirty(true);
                setPasos((prev) =>
                  prev.map((st, idx) =>
                    idx === activeStepIdx ? { ...st, descripcion: val } : st
                  )
                );
              }}
              placeholder="Nota del paso actual (selecciona ficha y haz clic en cancha según la opción activa)..."
            />
          )}

          {isPlaying && (
            <p className="text-xs font-bold text-amber-300 px-1">
              ▶ Reproduciendo: {displayedState.descripcion}
            </p>
          )}

          <Pitch2DBoard
            modalidad={boardModalidad}
            tokens={displayedState.jugadores}
            balon={displayedState.balon}
            trajectories={trajectories}
            showTrajectories={showTrajectories}
            highlightSpace={linkedJobObj?.espacio_cancha || ''}
            selectedTokenId={selectedTokenId}
            isPlaying={isPlaying}
            interactive={!isPlaying}
            cursorCrosshair={toolMode !== 'move'}
            onSelectToken={(tid) => setSelectedTokenId(tid)}
            onMoveToken={handleMoveToken}
            onPitchClick={handlePitchClick}
          />

          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-neutral-300 pt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-yellow-300 inline-block" /> Pase Corto
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-orange-500 inline-block" /> Pase Largo
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Línea Recta
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Zig-Zag
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-purple-400 inline-block" /> Subir/Bajar
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500 inline-block" /> Remate
            </span>
          </div>
        </div>

        {/* Columna Derecha: Módulos Deslizantes Ordenados */}
        <div className="lg:col-span-5 space-y-3">
          {/* Submenú: Estilos de Juego Profesionales */}
          <AccordionSection
            title="Estilos de Juego Profesionales"
            icon={Compass}
            badge={`${ESTILOS_JUEGO_PRO.length} Estilos`}
            isOpen={openSection === 'estilos'}
            onToggle={() => setOpenSection(openSection === 'estilos' ? '' : 'estilos')}
          >
            <p className="text-[11px] text-texto-secundario">
              Modelos tácticos de élite mundial para aplicar en cancha con un solo clic:
            </p>
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {ESTILOS_JUEGO_PRO.map((est) => (
                <div
                  key={est.key}
                  className="bg-[#0f0f13] border border-neutral-800 hover:border-amber-500/50 rounded-xl p-3 space-y-1.5 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rojo-fuego" /> {est.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-vinotinto/60 border border-rojo-fuego text-[9px] font-bold text-amber-300">
                      {est.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 leading-relaxed">{est.filosofia}</p>
                  <p className="text-[9px] text-texto-secundario italic">Foco: {est.foco}</p>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleApplyStyle(est)}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] inline-flex items-center gap-1 transition"
                    >
                      <Zap className="w-3 h-3" /> Aplicar en Pizarra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Submenú: Ejercicios y Tareas Profesionales */}
          <AccordionSection
            title="Tareas y Ejercicios Profesionales"
            icon={Trophy}
            badge={`${EJERCICIOS_TAREAS_PRO.length} Tareas`}
            isOpen={openSection === 'ejercicios'}
            onToggle={() => setOpenSection(openSection === 'ejercicios' ? '' : 'ejercicios')}
          >
            <p className="text-[11px] text-texto-secundario">
              Ejercicios de entrenamiento profesional con conos, defensores y animación preconfigurados:
            </p>
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {EJERCICIOS_TAREAS_PRO.map((ej) => (
                <div
                  key={ej.key}
                  className="bg-[#0f0f13] border border-neutral-800 hover:border-rojo-fuego/60 rounded-xl p-3 space-y-1.5 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-white">{ej.titulo}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-[9px] font-bold text-cyan-300">
                      {ej.categoria_tarea}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 leading-relaxed">{ej.objetivo}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-amber-300 font-semibold">⏱ {ej.duracion}</span>
                    <button
                      type="button"
                      onClick={() => handleApplyExercise(ej)}
                      className="px-3 py-1 rounded-lg bg-rojo-fuego hover:bg-red-600 text-white font-extrabold text-[10px] inline-flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3" /> Cargar Tarea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Submenú: Atletas de la Categoría */}
          <AccordionSection
            title={`Atletas de la Categoría (${categoryAthletes.length})`}
            icon={UserCheck}
            badge={`${categoryAthletes.length} Atletas`}
            isOpen={openSection === 'atletas'}
            onToggle={() => setOpenSection(openSection === 'atletas' ? '' : 'atletas')}
          >
            <p className="text-[11px] text-texto-secundario">
              Haz clic en cualquier atleta para incorporarlo directamente a la pizarra táctica:
            </p>
            {categoryAthletes.length === 0 ? (
              <div className="p-4 text-center text-xs text-texto-secundario bg-[#0f0f13] rounded-lg">
                No hay atletas registrados en esta categoría aún.
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
                {categoryAthletes.map((pl) => {
                  const pTokId = `ATLETA-${pl.id_jugador}`;
                  const isOnPitch = currentTokens.some(
                    (j) => String(j.id_jugador) === String(pl.id_jugador) || j.id === pTokId
                  );
                  return (
                    <div
                      key={pl.id_jugador}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition ${
                        isOnPitch
                          ? 'bg-vinotinto/30 border-rojo-fuego/60'
                          : 'bg-[#0f0f13] border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-600 flex items-center justify-center font-extrabold text-[10px] text-white shrink-0">
                          {pl.numero_camiseta || '•'}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-white truncate text-[11px]">{pl.nombre}</p>
                          <span className="text-[9px] text-texto-secundario uppercase">
                            {pl.posicion_principal || 'Jugador'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPlayerFromSquad(pl)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold shrink-0 transition ${
                          isOnPitch
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                            : 'bg-neutral-800 hover:bg-vinotinto text-white border border-neutral-700'
                        }`}
                      >
                        {isOnPitch ? 'En Cancha ✓' : '+ A Cancha'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </AccordionSection>

          {/* Submenú 1: Opciones de Movimiento y Pases */}
          <AccordionSection
            title="Opciones y Movimientos"
            icon={SlidersHorizontal}
            badge={toolMode.replace('_', ' ')}
            isOpen={openSection === 'opciones'}
            onToggle={() => setOpenSection(openSection === 'opciones' ? '' : 'opciones')}
          >
            <div className="flex items-center justify-between text-[11px] bg-[#0f0f13] border border-neutral-800 rounded-lg px-3 py-2">
              <span className="text-texto-secundario">
                Elemento seleccionado:{' '}
                <strong className="text-amber-300">
                  {selectedTokenId === 'BALON'
                    ? '⚽ Balón Principal'
                    : currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId)
                    ? `#${
                        currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId).dorsal
                      } (${currentTokens.find((t, i) => getTokenId(t, i) === selectedTokenId).rol})`
                    : 'Ninguno'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTokenId('BALON')}
                className="px-2 py-0.5 rounded bg-amber-400 text-black font-extrabold text-[10px]"
              >
                ⚽ Usar Balón
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setToolMode('move')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'move'
                    ? 'bg-white text-black border-white'
                    : 'bg-[#1b1b22] text-neutral-300 border-neutral-700 hover:text-white'
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" /> Arrastrar Libre
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('pase_corto');
                  setSelectedTokenId('BALON');
                }}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'pase_corto'
                    ? 'bg-yellow-300 text-black border-white'
                    : 'bg-[#1b1b22] text-yellow-200 border-neutral-700 hover:border-yellow-400'
                }`}
              >
                ⚽ Pase Corto
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('pase_largo');
                  setSelectedTokenId('BALON');
                }}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'pase_largo'
                    ? 'bg-orange-500 text-black border-white'
                    : 'bg-[#1b1b22] text-orange-300 border-neutral-700 hover:border-orange-400'
                }`}
              >
                ⚽ Pase Largo
              </button>
              <button
                type="button"
                onClick={() => setToolMode('recta')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'recta'
                    ? 'bg-emerald-500 text-black border-white'
                    : 'bg-[#1b1b22] text-emerald-300 border-neutral-700 hover:border-emerald-400'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" /> Línea Recta
              </button>
              <button
                type="button"
                onClick={() => setToolMode('zigzag')}
                className={`px-3 py-2 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                  toolMode === 'zigzag'
                    ? 'bg-cyan-400 text-black border-white'
                    : 'bg-[#1b1b22] text-cyan-300 border-neutral-700 hover:border-cyan-400'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Zig-Zag / Slalom
              </button>
              <button
                type="button"
                onClick={() => handleQuickAttackAndDefend('SELECTED')}
                className="px-3 py-2 rounded-lg font-bold border bg-purple-950/70 hover:bg-purple-800 text-purple-200 border-purple-500/60 inline-flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Subir y Bajar
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center rounded-lg border border-red-500/70 overflow-hidden text-[11px] flex-1">
                <span className="px-2 py-1.5 bg-red-950/80 text-red-200 font-bold inline-flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Remate:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('left')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold"
                >
                  ↖ Izq
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('center')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold border-x border-neutral-700"
                >
                  ↑ Centro
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShoot('right')}
                  className="flex-1 py-1.5 bg-[#1e1215] hover:bg-rojo-fuego text-white font-bold"
                >
                  ↗ Der
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-texto-secundario">
                Escenarios Rápidos (1v1 hasta 22 Jugadores):
              </p>
              <div className="flex flex-wrap gap-1">
                {SCENARIO_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleApplyPreset(p.key)}
                    className="px-2 py-1 rounded bg-[#1b1b22] hover:bg-vinotinto border border-neutral-700 text-[10px] font-bold text-neutral-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </AccordionSection>

          {/* Submenú 2: Jugadores Propios (1 al 22) */}
          <AccordionSection
            title="Jugadores Legión Fénix (1–22)"
            icon={Users}
            badge={`${activeOwnByDorsal.size} en cancha`}
            isOpen={openSection === 'jugadores'}
            onToggle={() => setOpenSection(openSection === 'jugadores' ? '' : 'jugadores')}
          >
            <p className="text-[11px] text-texto-secundario">
              Haz clic en cualquier dorsal del <strong className="text-white">#1 al #22</strong> para colocarlo en la cancha o seleccionarlo (#1 es Portero).
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((dorsal) => {
                const tid = activeOwnByDorsal.get(dorsal);
                const isSelected = tid && selectedTokenId === tid;
                return (
                  <button
                    key={`own-${dorsal}`}
                    type="button"
                    onClick={() => handleToggleNumberedPlayer('A', dorsal)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold border transition ${
                      isSelected
                        ? 'bg-amber-400 text-black border-white ring-2 ring-amber-300'
                        : tid
                        ? 'bg-vinotinto text-white border-rojo-fuego'
                        : 'bg-[#1b1b22] text-neutral-300 border-neutral-700 hover:border-vinotinto hover:text-white'
                    }`}
                  >
                    #{dorsal}
                  </button>
                );
              })}
            </div>
            {selectedTokenId && selectedTokenId !== 'BALON' && (
              <button
                type="button"
                onClick={handleRemoveSelectedToken}
                className="w-full py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-xs font-bold text-white"
              >
                Quitar Ficha Seleccionada de la Cancha
              </button>
            )}
          </AccordionSection>

          {/* Submenú 3: Rivales (1 al 22) */}
          <AccordionSection
            title="Rivales Numerados (1–22)"
            icon={Users}
            badge={`${activeRivalByDorsal.size} en cancha`}
            isOpen={openSection === 'rivales'}
            onToggle={() => setOpenSection(openSection === 'rivales' ? '' : 'rivales')}
          >
            <p className="text-[11px] text-texto-secundario">
              Selecciona cualquier dorsal rival del <strong className="text-cyan-300">#1 al #22</strong> para simular marcas, duelos o bloque rival.
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((dorsal) => {
                const tid = activeRivalByDorsal.get(dorsal);
                const isSelected = tid && selectedTokenId === tid;
                return (
                  <button
                    key={`riv-${dorsal}`}
                    type="button"
                    onClick={() => handleToggleNumberedPlayer('B', dorsal)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold border transition ${
                      isSelected
                        ? 'bg-amber-400 text-black border-white ring-2 ring-amber-300'
                        : tid
                        ? 'bg-cyan-700 text-white border-cyan-400'
                        : 'bg-[#1b1b22] text-cyan-200/80 border-neutral-700 hover:border-cyan-500'
                    }`}
                  >
                    R{dorsal}
                  </button>
                );
              })}
            </div>
            {selectedTokenId && selectedTokenId !== 'BALON' && (
              <button
                type="button"
                onClick={handleRemoveSelectedToken}
                className="w-full py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-xs font-bold text-white"
              >
                Quitar Ficha Seleccionada
              </button>
            )}
          </AccordionSection>

          {/* Submenú 4: Materiales (Conos, Tapas, Balones, Vallas, Aros, Escalera) */}
          <AccordionSection
            title="Materiales (Conos, Tapas, Vallas, Aros)"
            icon={Box}
            badge={
              currentTokens.filter((t) => t.team === 'CONO' || t.team === 'MAT').length
            }
            isOpen={openSection === 'materiales'}
            onToggle={() => setOpenSection(openSection === 'materiales' ? '' : 'materiales')}
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {MATERIAL_CATALOG.map((mat) => (
                <button
                  key={mat.key}
                  type="button"
                  onClick={() => handleAddMaterial(mat.key)}
                  className="px-3 py-2 rounded-lg bg-[#1b1b22] hover:bg-[#24242d] border border-neutral-700 text-left flex items-center justify-between transition"
                >
                  <span className="font-bold text-white">+ {mat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${mat.badge}`}>
                    {mat.short}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {selectedTokenId && selectedTokenId !== 'BALON' && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedToken}
                  className="flex-1 py-1.5 rounded-lg bg-rojo-fuego/20 hover:bg-rojo-fuego border border-rojo-fuego text-[11px] font-bold text-white"
                >
                  Quitar Material Elegido
                </button>
              )}
              <button
                type="button"
                onClick={handleClearMaterialsOnly}
                className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200"
              >
                Limpiar Materiales
              </button>
            </div>
          </AccordionSection>

          {/* Ficha Pros / Contras del Esquema Seleccionado */}
          {activeTactica && (
            <div className="card-fenix p-4 space-y-2 text-xs border-l-4 border-l-vinotinto">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-lg font-extrabold text-white">
                  {activeTactica.nombre_sistema}
                </h4>
                <span className="text-[10px] text-rojo-fuego font-bold uppercase">
                  {activeTactica.modalidad}
                </span>
              </div>
              {activeTactica.descripcion && (
                <p className="text-texto-secundario">{activeTactica.descripcion}</p>
              )}
              <p className="text-green-300">
                <Sparkles className="w-3 h-3 inline mr-1" />
                <strong>Pros:</strong> {activeTactica.pros}
              </p>
              <p className="text-red-300">
                <ShieldAlert className="w-3 h-3 inline mr-1" />
                <strong>Contras:</strong> {activeTactica.contras}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
