import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  Users,
  Save,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
  BookOpen,
  X,
  Target,
  Clock,
  Compass,
} from 'lucide-react';
import PlayerCardModule from '../jugadores/PlayerCardModule';
import api from '../../utils/api';
import { DISCIPLINES, groupCategoriesByDiscipline } from '../../utils/categories';

// Catálogo Profesional de Tests, Protocolos en Cancha y Criterios Oficiales Fénix
export const TEST_CATALOG = {
  FISICA: {
    label: 'Evaluación Física',
    icon: Zap,
    color: 'from-amber-600 to-rojo-fuego',
    desc: 'Velocidad, resistencia aeróbica y potencia muscular',
    tests: [
      {
        id: 'vel_30m',
        name: 'Velocidad y Arranque (Sprint 30m)',
        field: 'fisica_velocidad',
        unit: 'seg',
        placeholder: 'Ej: 4.30',
        min: 3.5,
        max: 8.0,
        step: 0.05,
        defaultVal: 4.6,
        drillName: 'Sprint Lineal de Aceleración 30 Metros',
        drillSetup: '2 conos delimitando la línea de partida (0m) y 2 conos en meta (30m). Terreno llano, cronómetro manual o fotocélulas.',
        drillProcedure: 'El atleta parte de posición erguida o salida alta (un pie adelante) sin balanceo previo. A la orden sonora o silbatazo, acelera al 100% de intensidad. El tiempo se detiene en el instante exacto en que el torso cruza la línea de los 30 metros. Se permiten 2 intentos con 3 minutos de descanso; se registra el mejor crono.',
        drillScoring: 'Élite: ≤ 4.10 seg | Excelente: 4.11–4.40 seg | Avanzado: 4.41–4.70 seg | Bueno: 4.71–5.00 seg | En Desarrollo: 5.01–5.40 seg | Inicial: > 5.40 seg.',
        calculate: (val) => {
          const v = Number(val);
          if (v <= 4.1) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v <= 4.4) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v <= 4.7) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v <= 5.0) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v <= 5.4) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'cooper',
        name: 'Resistencia Aeróbica (Test de Cooper 12 Min)',
        field: 'fisica_resistencia',
        unit: 'metros',
        placeholder: 'Ej: 2600',
        min: 1000,
        max: 4000,
        step: 50,
        defaultVal: 2500,
        drillName: 'Carrera Continua de 12 Minutos (Test de Cooper)',
        drillSetup: 'Circuito perimétrico de la cancha reglamentaria (aprox. 300m a 400m por vuelta), marcado con conos cada 50 metros.',
        drillProcedure: 'Los atletas corren a ritmo constante y sostenido durante exactamente 12 minutos. Al toque de silbato final, se detienen en su lugar y el entrenador o monitor calcula la distancia total recorrida contando las vueltas completas más los metros adicionales alcanzados.',
        drillScoring: 'Élite: ≥ 3000 m | Excelente: 2800–2999 m | Avanzado: 2600–2799 m | Bueno: 2350–2599 m | En Desarrollo: 2100–2349 m | Inicial: < 2100 m.',
        calculate: (val) => {
          const v = Number(val);
          if (v >= 3000) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 2800) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 2600) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 2350) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 2100) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'salto_abalakov',
        name: 'Potencia / Salto Vertical (Abalakov)',
        field: 'fisica_fuerza',
        unit: 'cm',
        placeholder: 'Ej: 42',
        min: 15,
        max: 75,
        step: 1,
        defaultVal: 38,
        drillName: 'Salto Vertical con Braceo Libre (Abalakov Jump)',
        drillSetup: 'Pared o poste con cinta métrica vertical milimetrada, o dispositivo Vertec. Tiza o talco en la punta de los dedos del atleta.',
        drillProcedure: '1) El atleta se para de lado a la pared y estira el brazo dominante para marcar la altura base de alcance de pie. 2) Desde posición estática, flexiona rodillas realizando un balanceo explosivo de brazos y salta verticalmente a máxima potencia para tocar la pared en el ápice del salto. La diferencia en centímetros entre ambas marcas determina la potencia.',
        drillScoring: 'Élite: ≥ 50 cm | Excelente: 44–49 cm | Avanzado: 38–43 cm | Bueno: 32–37 cm | En Desarrollo: 26–31 cm | Inicial: < 26 cm.',
        calculate: (val) => {
          const v = Number(val);
          if (v >= 50) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 44) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 38) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 32) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 26) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
    ],
  },
  TECNICA: {
    label: 'Evaluación Técnica con Balón',
    icon: Award,
    color: 'from-rojo-fuego to-vinotinto',
    desc: 'Control orientado, precisión de pase, regate y definición',
    tests: [
      {
        id: 'control_orientado',
        name: 'Control Orientado y Perfilamiento',
        field: 'tecnica_control',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.5',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        drillName: 'Control Orientado en Cuadrante con Presión Pasiva',
        drillSetup: 'Cuadrante de 4x4m con un obstáculo o maniquí central. Pasador situado a 15 metros de distancia con balones reglamentarios.',
        drillProcedure: 'El pasador envía 10 balones rasos firmes. El atleta debe controlar en un solo toque orientando el cuerpo para salir por el cuadrante derecho (5 veces) y cuadrante izquierdo (5 veces) en menos de 1 segundo. El entrenador evalúa: perfil del cuerpo, distancia del balón tras el toque y velocidad de salida.',
        drillScoring: 'Calificación de 1 a 10: 9.0–10.0 (Élite: dominio limpio y perfil perfecto) | 8.0–8.9 (Excelente) | 7.0–7.9 (Avanzado) | 6.0–6.9 (Bueno) | < 6.0 (En Desarrollo).',
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'precision_pase',
        name: 'Precisión de Pase Corto y Largo',
        field: 'tecnica_pase',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.0',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        drillName: 'Batería de Pase Corto (10m) y Trazo Largo (30m)',
        drillSetup: '2 mini-arcos de 1 metro a 10m de distancia + 1 círculo de conos de 5 metros de diámetro situado a 30m.',
        drillProcedure: 'El atleta ejecuta 10 envíos: 5 pases cortos a ras de piso con borde interno hacia el mini-arco (pierna hábil e inhábil) y 5 pases largos por elevación buscando que el balón caiga y bote dentro del círculo a 30m. Cada pase exitoso dentro del objetivo suma 1 punto.',
        drillScoring: 'Puntaje directo según cantidad de aciertos (1 al 10): 9–10 pts (Élite) | 8 pts (Excelente) | 7 pts (Avanzado) | 6 pts (Bueno) | ≤ 5 pts (En desarrollo).',
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'remate_definicion',
        name: 'Efectividad de Remate y Definición',
        field: 'tecnica_definicion',
        unit: 'aciertos/10',
        placeholder: 'Ej: 8',
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 7,
        drillName: 'Eficacia de Remate a Portería (Borde del Área)',
        drillSetup: 'Portería oficial con arquero o lona de precisión dividida en 4 cuadrantes angulares. Balones en la medialuna (16.5m).',
        drillProcedure: 'El atleta realiza 10 disparos a puerta: 5 estáticos desde el borde del área y 5 remates tras recibir un pase lateral en carrera. Se cuenta como acierto cada remate que entre a zonas de difícil respuesta (palos, ángulos o gol efectivo).',
        drillScoring: 'Aciertos de 0 a 10: 9–10 goles = Goleador Élite (10 pts) | 8 = Excelente (9 pts) | 7 = Avanzado (8 pts) | 6 = Bueno (7 pts) | 5 = En Desarrollo (6 pts) | ≤ 4 = Inicial (5 pts).',
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9) return { score: 10.0, pct: 100, tag: 'Goleador Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v >= 5) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
    ],
  },
  COORDINATIVA: {
    label: 'Evaluación Coordinativa y Agilidad',
    icon: Activity,
    color: 'from-cyan-600 to-blue-700',
    desc: 'Agilidad, cambio de dirección, equilibrio y ritmo motor',
    tests: [
      {
        id: 'illinois_test',
        name: 'Test de Agilidad Illinois (Cambio de Dirección)',
        field: 'coordinativa_agilidad',
        unit: 'seg',
        placeholder: 'Ej: 15.80',
        min: 13.0,
        max: 24.0,
        step: 0.1,
        defaultVal: 16.5,
        drillName: 'Circuito de Agilidad Illinois (Slalom y Giros)',
        drillSetup: 'Rectángulo de 10m de largo x 5m de ancho. 4 conos en las esquinas y 4 conos en la línea central separados por 3.3m cada uno.',
        drillProcedure: 'El atleta arranca acostado de cúbito prono con manos en la línea de salida. Al silbato: 1) Sprint 10m al cono superior, 2) Regreso en sprint al centro, 3) Slalom en zigzag entre los 4 conos centrales ida y vuelta, 4) Sprint al cono superior opuesto y 5) Sprint final de 10m cruzando la meta.',
        drillScoring: 'Élite: ≤ 15.0 seg | Excelente: 15.1–16.0 seg | Avanzado: 16.1–17.2 seg | Bueno: 17.3–18.5 seg | En Desarrollo: 18.6–20.0 seg | Inicial: > 20.0 seg.',
        calculate: (val) => {
          const v = Number(val);
          if (v <= 15.0) return { score: 10.0, pct: 100, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v <= 16.0) return { score: 9.0, pct: 90, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v <= 17.2) return { score: 8.0, pct: 80, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v <= 18.5) return { score: 7.0, pct: 70, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          if (v <= 20.0) return { score: 6.0, pct: 60, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
          return { score: 5.0, pct: 50, tag: 'Inicial', cls: 'text-rose-400 bg-rose-950/60 border-rose-600/50' };
        },
      },
      {
        id: 'escalera_coordinacion',
        name: 'Escalera de Coordinación y Frecuencia',
        field: 'coordinativa_ritmo',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 8.0',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        drillName: 'Frecuencia de Apoyos en Escalera Pliométrica (Icky Shuffle)',
        drillSetup: 'Escalera de coordinación de 10 peldaños (4 metros de longitud) apoyada en suelo firme sin deslizamiento.',
        drillProcedure: 'El atleta ejecuta 3 secuencias de ritmo motor: dos pies dentro / un pie fuera (Icky Shuffle), skipping lateral y saltos bipodales reactivos a máxima velocidad de apoyos. Se descuenta puntaje por pisar listones o perder el compás rítmico.',
        drillScoring: 'Puntaje técnico de 1 a 10: 9.0–10.0 (Élite: cero toques, cadencia ultrasónica) | 8.0–8.9 (Excelente) | 7.0–7.9 (Avanzado) | 6.0–6.9 (Bueno) | < 6.0 (En Desarrollo).',
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
      {
        id: 'equilibrio_monopodal',
        name: 'Equilibrio Dinámico y Estabilidad',
        field: 'coordinativa_equilibrio',
        unit: 'pts (1-10)',
        placeholder: 'Ej: 7.8',
        min: 1,
        max: 10,
        step: 0.5,
        defaultVal: 7.5,
        drillName: 'Estabilidad Articular y Alcance Dinámico Monopodal',
        drillSetup: 'Superficie de césped o colchoneta de propiocepción con 3 líneas de alcance en forma de Y.',
        drillProcedure: 'El atleta sostiene el equilibrio sobre la pierna dominante durante 30 segundos realizando alcances en 3 ejes con la pierna libre sin apoyar el talón ni perder el centro de gravedad. Luego se evalúa la pierna no dominante. Evaluar control postural de rodilla y tobillo.',
        drillScoring: 'Puntaje de 1 a 10 basado en balance propioceptivo y simetría bilateral entre ambas extremidades.',
        calculate: (val) => {
          const v = Number(val);
          const pct = Math.round(v * 10);
          if (v >= 9.0) return { score: v, pct, tag: 'Élite', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' };
          if (v >= 8.0) return { score: v, pct, tag: 'Excelente', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-600/40' };
          if (v >= 7.0) return { score: v, pct, tag: 'Avanzado', cls: 'text-cyan-300 bg-cyan-950/60 border-cyan-600/50' };
          if (v >= 6.0) return { score: v, pct, tag: 'Bueno', cls: 'text-amber-300 bg-amber-950/60 border-amber-600/50' };
          return { score: v, pct, tag: 'En Desarrollo', cls: 'text-orange-300 bg-orange-950/60 border-orange-600/50' };
        },
      },
    ],
  },
};

export default function EvaluacionJugadorModule({
  categories = [],
  players = [],
  evaluaciones = [],
  selectedCategoryFilter = '',
  onReload,
}) {
  const [activeTestCategory, setActiveTestCategory] = useState('FISICA'); // FISICA | TECNICA | COORDINATIVA
  const [selectedTestId, setSelectedTestId] = useState('vel_30m');
  const [viewMode, setViewMode] = useState('group'); // 'group' | 'individual'

  const [activeDiscipline, setActiveDiscipline] = useState('Campo');
  const [catFilter, setCatFilter] = useState('');
  const [testValues, setTestValues] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Control para mostrar u ocultar el instructivo del ejercicio en cancha
  const [showDrillGuide, setShowDrillGuide] = useState(true);

  // Modal para ver el Radar Poligonal SVG interactivo del atleta
  const [radarPlayer, setRadarPlayer] = useState(null);

  const groupedCategories = useMemo(() => groupCategoriesByDiscipline(categories), [categories]);

  // Sincronizar filtro inicial
  useEffect(() => {
    if (selectedCategoryFilter) {
      setCatFilter(String(selectedCategoryFilter));
      const match = categories.find((c) => String(c.id_categoria) === String(selectedCategoryFilter));
      if (match?.disciplina) setActiveDiscipline(match.disciplina);
    } else if (categories.length > 0 && !catFilter) {
      const firstInCampo = categories.find((c) => c.disciplina === 'Campo') || categories[0];
      setCatFilter(String(firstInCampo.id_categoria));
    }
  }, [categories, selectedCategoryFilter, catFilter]);

  // Actualizar test seleccionado al cambiar de categoría
  useEffect(() => {
    const tests = TEST_CATALOG[activeTestCategory]?.tests || [];
    if (tests.length > 0 && !tests.some((t) => t.id === selectedTestId)) {
      setSelectedTestId(tests[0].id);
    }
  }, [activeTestCategory, selectedTestId]);

  const currentTest = useMemo(() => {
    const list = TEST_CATALOG[activeTestCategory]?.tests || [];
    return list.find((t) => t.id === selectedTestId) || list[0];
  }, [activeTestCategory, selectedTestId]);

  // Atletas filtrados por categoría activa
  const categoryPlayers = useMemo(() => {
    if (!catFilter) return players;
    return players.filter((p) => String(p.id_categoria) === String(catFilter));
  }, [players, catFilter]);

  // Inicializar valores de prueba por defecto para los atletas de la categoría
  useEffect(() => {
    if (!currentTest) return;
    const initialMap = {};
    categoryPlayers.forEach((p) => {
      initialMap[p.id_jugador] = currentTest.defaultVal;
    });
    setTestValues((prev) => ({ ...initialMap, ...prev }));
  }, [categoryPlayers, currentTest]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => String(c.id_categoria) === String(catFilter)),
    [categories, catFilter]
  );

  const handleTestValueChange = (playerId, val) => {
    setTestValues((prev) => ({
      ...prev,
      [playerId]: val,
    }));
  };

  const handleSaveBatch = async () => {
    if (categoryPlayers.length === 0) return;
    setSavingBatch(true);
    setFeedback('');
    setErrorMsg('');

    try {
      const entries = categoryPlayers.map((p) => {
        const rawVal = testValues[p.id_jugador] ?? currentTest.defaultVal;
        const res = currentTest.calculate(rawVal);
        return {
          id_jugador: p.id_jugador,
          field: currentTest.field,
          valor_raw: Number(rawVal),
          score: res.score,
          porcentaje: res.pct,
          clasificacion: res.tag,
        };
      });

      const res = await api.post('/coach/evaluations/batch', {
        test_id: currentTest.id,
        area: activeTestCategory,
        entries,
      });

      setFeedback(
        res.data.message ||
          `Evaluación de ${currentTest.name} guardada exitosamente para ${entries.length} atletas.`
      );
      if (onReload) onReload();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar la evaluación grupal.');
    } finally {
      setSavingBatch(false);
    }
  };

  // Cálculo de ejes poligonales para el Radar SVG Chart (6 ejes normalizados 0-10)
  const radarAxes = useMemo(() => {
    if (!radarPlayer) return null;

    const parseVal = (v, defaultScore) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(1, n)) : defaultScore;
    };

    const axes = [
      { label: 'Velocidad', val: parseVal(radarPlayer.fisica_velocidad || radarPlayer.puntaje_global, 7.5), max: 10 },
      { label: 'Resistencia', val: parseVal(radarPlayer.fisica_resistencia, 7.2), max: 10 },
      { label: 'Potencia', val: parseVal(radarPlayer.fisica_fuerza, 7.8), max: 10 },
      { label: 'Control Balón', val: parseVal(radarPlayer.tecnica_control, 8.2), max: 10 },
      { label: 'Precisión Pase', val: parseVal(radarPlayer.tecnica_pase, 7.6), max: 10 },
      { label: 'Agilidad/Ritmo', val: parseVal(radarPlayer.coordinativa_agilidad, 8.0), max: 10 },
    ];

    const cx = 160;
    const cy = 160;
    const r = 110;
    const total = axes.length;

    const points = axes.map((a, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const ratio = a.val / a.max;
      const x = cx + r * ratio * Math.cos(angle);
      const y = cy + r * ratio * Math.sin(angle);
      const lx = cx + (r + 24) * Math.cos(angle);
      const ly = cy + (r + 24) * Math.sin(angle);
      return { ...a, x, y, lx, ly, angle };
    });

    const polygonPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    // Círculos concéntricos guía (20%, 40%, 60%, 80%, 100%)
    const concentricLevels = [0.2, 0.4, 0.6, 0.8, 1.0].map((lvl) => {
      const poly = axes
        .map((_, i) => {
          const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
          const x = cx + r * lvl * Math.cos(angle);
          const y = cy + r * lvl * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');
      return { lvl, poly };
    });

    return { cx, cy, r, points, polygonPointsStr, concentricLevels };
  }, [radarPlayer]);

  return (
    <div className="space-y-6">
      {/* 1. CABECERA Y SELECCIÓN DE ÁREAS */}
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Batería Oficial de Pruebas Fénix
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              EVALUACIÓN FÍSICA, TÉCNICA CON BALÓN Y COORDINATIVA
            </h2>
            <p className="text-xs text-texto-secundario mt-0.5">
              Protocolos de campo estandarizados con instructivo de ejercicios y cálculo automático de percentiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDrillGuide(!showDrillGuide)}
              className="btn-vinotinto text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {showDrillGuide ? 'Ocultar Instructivo' : 'Ver Instructivo de Cancha'}
            </button>
          </div>
        </div>

        {/* 3 BOTONES PRINCIPALES DE LAS 3 ÁREAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Object.entries(TEST_CATALOG).map(([key, cat]) => {
            const Icon = cat.icon;
            const isSelected = activeTestCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTestCategory(key)}
                className={`p-4 rounded-xl border text-left transition duration-200 flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-vinotinto to-[#8f0024] border-rojo-fuego text-white shadow-fuego scale-[1.01]'
                    : 'bg-[#15151a] border-neutral-800 text-neutral-300 hover:border-vinotinto hover:text-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-rojo-fuego'}`} />
                    <span className="font-display font-bold text-base sm:text-lg">{cat.label}</span>
                  </div>
                  <p className="text-[11px] text-texto-secundario leading-tight">{cat.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-600'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUBBOTONES DE LAS PRUEBAS DENTRO DEL ÁREA SELECCIONADA */}
      <div className="card-fenix p-4 space-y-3 bg-[#131317]">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="text-xs font-bold text-texto-secundario uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-rojo-fuego" /> Pruebas disponibles en {TEST_CATALOG[activeTestCategory].label}:
          </span>
          <span className="text-[10px] text-amber-400 font-bold">Selecciona una para evaluar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEST_CATALOG[activeTestCategory].tests.map((test) => {
            const isSelected = selectedTestId === test.id;
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTestId(test.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-rojo-fuego text-white border-white shadow-fenix font-bold'
                    : 'bg-[#18181f] border-neutral-800 text-neutral-300 hover:border-vinotinto hover:text-white'
                }`}
              >
                <p className="text-xs sm:text-sm truncate">{test.name}</p>
                <p className={`text-[10px] ${isSelected ? 'text-neutral-100' : 'text-texto-secundario'}`}>
                  Unidad: {test.unit}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. INSTRUCTIVO OFICIAL DEL EJERCICIO EN CANCHA (CÓMO MEDIRLO CON PRECISIÓN) */}
      {showDrillGuide && currentTest && (
        <div className="card-fenix p-5 sm:p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-[#17151a] to-[#121215] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h3 className="font-display text-lg font-bold text-white">
                Instructivo en Cancha: {currentTest.drillName}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
              Protocolo Oficial Fénix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-neutral-800">
              <span className="font-bold text-rojo-fuego uppercase tracking-wider block text-[10px]">
                1. Montaje y Materiales en Cancha
              </span>
              <p className="text-neutral-300 leading-relaxed">{currentTest.drillSetup}</p>
            </div>

            <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-neutral-800">
              <span className="font-bold text-cyan-400 uppercase tracking-wider block text-[10px]">
                2. Procedimiento de Ejecución
              </span>
              <p className="text-neutral-300 leading-relaxed">{currentTest.drillProcedure}</p>
            </div>

            <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-neutral-800">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block text-[10px]">
                3. Baremos de Puntuación
              </span>
              <p className="text-neutral-300 leading-relaxed font-mono text-[11px]">{currentTest.drillScoring}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. SELECTOR DE CATEGORÍA Y TABLA DE EVALUACIÓN GRUPAL MASIVA */}
      <div className="card-fenix p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-rojo-fuego" />
              Planilla de Calificación: {currentTest?.name}
            </h3>
            <p className="text-xs text-texto-secundario">
              Ingresa el valor obtenido en cancha por cada atleta. El sistema asignará el puntaje y percentil automáticamente.
            </p>
          </div>

          {/* Selector de categoría */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400">Categoría:</span>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="input-fenix w-auto text-xs py-1.5"
            >
              {categories.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre} ({c.disciplina || c.modalidad})
                </option>
              ))}
            </select>
          </div>
        </div>

        {feedback && (
          <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> {feedback}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Tabla de Jugadores */}
        {categoryPlayers.length === 0 ? (
          <div className="py-12 text-center text-xs text-texto-secundario">
            No hay atletas inscritos en esta categoría para evaluar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-phoenix min-w-[760px]">
              <thead>
                <tr>
                  <th>Dorsal</th>
                  <th>Atleta</th>
                  <th>Posición</th>
                  <th className="text-center">Resultado en Cancha ({currentTest?.unit})</th>
                  <th className="text-center">Clasificación Automática</th>
                  <th className="text-center">Puntaje</th>
                  <th className="text-right">Radar Fénix</th>
                </tr>
              </thead>
              <tbody>
                {categoryPlayers.map((player) => {
                  const val = testValues[player.id_jugador] ?? currentTest.defaultVal;
                  const res = currentTest.calculate(val);
                  return (
                    <tr key={player.id_jugador}>
                      <td className="py-3 font-display font-bold text-white text-base">
                        #{player.dorsal || '--'}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-white">
                          {player.nombre} {player.apellido}
                        </p>
                        <p className="text-[11px] text-texto-secundario">
                          Pie: {player.pierna_habil || 'Derecho'}
                        </p>
                      </td>
                      <td className="py-3 text-xs text-neutral-300">
                        {player.posicion_habitual}
                      </td>
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            step={currentTest.step}
                            min={currentTest.min}
                            max={currentTest.max}
                            value={val}
                            onChange={(e) => handleTestValueChange(player.id_jugador, e.target.value)}
                            className="input-fenix w-24 text-center text-sm font-bold text-white bg-[#101014] border-neutral-700 py-1.5"
                          />
                          <span className="text-[11px] text-neutral-400 font-semibold">{currentTest.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${res.cls}`}>
                          {res.tag} • {res.pct}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-display text-lg font-extrabold text-white">
                          {Number(res.score).toFixed(1)}
                          <span className="text-[10px] text-neutral-400 font-normal">/10</span>
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setRadarPlayer(player)}
                          className="px-3 py-1.5 rounded-lg bg-vinotinto/50 hover:bg-vinotinto border border-vinotinto text-xs font-bold text-white inline-flex items-center gap-1.5 transition hover-shadow"
                          title="Abrir gráfico poligonal de radar 6 ejes"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" /> Ver Radar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {categoryPlayers.length > 0 && (
          <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-texto-secundario">
              * Las calificaciones alimentan el expediente deportivo del atleta y se reflejan en su Radar Fénix.
            </span>
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={savingBatch}
              className="btn-cta text-xs py-2.5 px-6 shadow-fuego flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingBatch ? 'Guardando Calificaciones...' : `Guardar Evaluación Grupal (${categoryPlayers.length} Atletas)`}
            </button>
          </div>
        )}
      </div>

      {/* 5. MODAL DE RADAR POLIGONAL 6 EJES DEL ATLETA */}
      {radarPlayer && radarAxes && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRadarPlayer(null)}
        >
          <div
            className="card-fenix max-w-2xl w-full p-6 space-y-5 border-rojo-fuego animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-vinotinto/50 border border-vinotinto flex items-center justify-center font-display font-extrabold text-lg text-white">
                  #{radarPlayer.dorsal || '--'}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-rojo-fuego block">
                    Radar Deportivo Fénix • 6 Ejes de Rendimiento
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                    {radarPlayer.nombre} {radarPlayer.apellido}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRadarPlayer(null)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-rojo-fuego text-white flex items-center justify-center transition"
                title="Cerrar radar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtítulo de categoría y posición */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#111116] p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-300">
                Posición: <strong className="text-white">{radarPlayer.posicion_habitual}</strong>
              </span>
              <span className="text-neutral-300">
                Categoría: <strong className="text-amber-400">{radarPlayer.categoria_nombre || activeCategoryObj?.nombre}</strong>
              </span>
              <span className="text-neutral-300">
                Pie Hábil: <strong className="text-white">{radarPlayer.pierna_habil || 'Derecho'}</strong>
              </span>
            </div>

            {/* Gráfico SVG de Radar Poligonal Interactivo */}
            <div className="flex flex-col items-center justify-center py-2">
              <svg width="320" height="320" className="overflow-visible select-none max-w-full">
                {/* Círculos / Polígonos concéntricos de guía */}
                {radarAxes.concentricLevels.map((lvl, idx) => (
                  <polygon
                    key={idx}
                    points={lvl.poly}
                    fill={idx === 4 ? 'rgba(122, 0, 30, 0.08)' : 'none'}
                    stroke="#2a2a35"
                    strokeWidth="1"
                    strokeDasharray={idx < 4 ? '3 3' : 'none'}
                  />
                ))}

                {/* Ejes radiales (Spokes) */}
                {radarAxes.points.map((p, idx) => (
                  <line
                    key={idx}
                    x1={radarAxes.cx}
                    y1={radarAxes.cy}
                    x2={radarAxes.cx + radarAxes.r * Math.cos(p.angle)}
                    y2={radarAxes.cy + radarAxes.r * Math.sin(p.angle)}
                    stroke="#2e2e3a"
                    strokeWidth="1"
                  />
                ))}

                {/* Polígono de Rendimiento del Atleta */}
                <polygon
                  points={radarAxes.polygonPointsStr}
                  fill="rgba(225, 29, 46, 0.35)"
                  stroke="#E11D2E"
                  strokeWidth="2.5"
                  className="filter drop-shadow-[0_0_12px_rgba(225,29,46,0.6)]"
                />

                {/* Nodos de datos en cada vértice */}
                {radarAxes.points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#E11D2E"
                      strokeWidth="2"
                    />
                    {/* Etiqueta del Eje */}
                    <text
                      x={p.lx}
                      y={p.ly}
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-sans"
                    >
                      {p.label} ({Number(p.val).toFixed(1)})
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Desglose Métrico de los 6 Ejes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-800">
              {radarAxes.points.map((p, idx) => (
                <div key={idx} className="bg-[#121217] border border-neutral-800/80 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-texto-secundario uppercase block font-semibold">
                    {p.label}
                  </span>
                  <span className="font-display text-lg font-extrabold text-white">
                    {Number(p.val).toFixed(1)} <span className="text-[10px] text-neutral-400 font-normal">/10</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRadarPlayer(null)}
                className="btn-cta text-xs py-2 px-6"
              >
                Cerrar Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
