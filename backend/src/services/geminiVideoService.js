const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');
const {
  GoogleGenAI,
  Type,
  FileState,
  createUserContent,
  createPartFromUri,
} = require('@google/genai');

const VALID_FILTERS = ['Físico', 'Técnico con Balón', 'Coordinativo'];
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v']);

const FILTER_RUBRICS = {
  Físico: `EVALUACIÓN EXCLUSIVA DEL ÁREA FÍSICA EN FÚTBOL:
- Aceleración inicial y velocidad de arranque en los primeros pasos.
- Frecuencia y amplitud de zancada al correr o esprintar.
- Potencia de apoyos, frenado brusco y re-aceleración explosiva.
- Intensidad y postura atlética sostenida durante el trabajo físico.
Comparación Élite Obligatoria:
- Cristiano Ronaldo en su mejor momento: potencia explosiva de arrancada, zancada larga y atlética, impulso vertical y fuerza física en cada apoyo.
- Lionel Messi en su mejor momento: aceleración explosiva en los primeros 5 metros, frecuencia altísima de zancada corta y bajo desgaste de giro.`,

  'Técnico con Balón': `EVALUACIÓN EXCLUSIVA DEL ÁREA TÉCNICA CON BALÓN EN FÚTBOL:
- Primer toque y control orientado hacia espacio libre.
- Superficies de contacto utilizadas (empeine, borde interno/externo, planta).
- Cercanía y control del balón en conducción bajo presión o slalom.
- Visión periférica (levantar la cabeza), precisión de pase o limpieza técnica en el remate.
Comparación Élite Obligatoria:
- Lionel Messi en su mejor momento: conducción con el balón pegado al pie, control orientado en un solo toque y precisión quirúrgica de pase/definición.
- Cristiano Ronaldo en su mejor momento: golpeo limpio y potente al balón, control dinámico en carrera rápida y perfilado agresivo para finalizar o asistir.`,

  Coordinativo: `EVALUACIÓN EXCLUSIVA DEL ÁREA COORDINATIVA EN FÚTBOL:
- Disociación armónica entre tren superior (brazos) y tren inferior (piernas).
- Trabajo reactivo de metatarso (puntas de los pies), frecuencia y ritmo de apoyos (escalera/conos/vallas).
- Descenso del centro de gravedad y inclinación corporal efectiva en cambios de dirección (cutting/fintas).
- Equilibrio dinámico y estabilidad del tronco al desacelerar o girar rápidamente.
Comparación Élite Obligatoria:
- Lionel Messi en su mejor momento: centro de gravedad ultrabajo, cambios de dirección instantáneos sin perder equilibrio y ritmo coordinativo constante.
- Cristiano Ronaldo en su mejor momento: coordinación neuromuscular a máxima velocidad, sincronización salto-carrera y estabilidad postural en gestos exigentes.`,
};

function normalizeFilterCategory(rawFilter = '') {
  const clean = String(rawFilter || '').trim().toLowerCase();
  if (!clean) return null;
  if (clean.includes('fisic') || clean.includes('físic')) return 'Físico';
  if (clean.includes('tecnic') || clean.includes('técnic') || clean.includes('balon') || clean.includes('balón')) {
    return 'Técnico con Balón';
  }
  if (clean.includes('coordin')) return 'Coordinativo';
  return null;
}

function inferVideoMimeType(file) {
  if (file?.mimetype && file.mimetype.startsWith('video/')) {
    return file.mimetype;
  }
  const ext = path.extname(file?.originalname || file?.path || '').toLowerCase();
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return 'video/mp4';
}

function isAllowedVideoFile(file) {
  if (!file) return false;
  const ext = path.extname(file.originalname || file.path || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  if (ALLOWED_VIDEO_EXTENSIONS.has(ext)) return true;
  return mime === 'video/mp4' || mime === 'video/quicktime' || mime === 'video/webm' || mime === 'video/x-m4v';
}

function resolveGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  const candidateEnvPaths = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(os.homedir(), '.env'),
  ];

  for (const envPath of candidateEnvPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        if (parsed.GEMINI_API_KEY && parsed.GEMINI_API_KEY.trim()) {
          process.env.GEMINI_API_KEY = parsed.GEMINI_API_KEY.trim();
          return process.env.GEMINI_API_KEY;
        }
      }
    } catch {
      // Ignorar archivo no legible
    }
  }

  const err = new Error(
    'Falta configurar GEMINI_API_KEY en el servidor (backend/.env) para ejecutar el análisis real de video con Google Gemini AI.'
  );
  err.statusCode = 503;
  err.code = 'GEMINI_KEY_MISSING';
  throw err;
}

function resolveGeminiModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
}

function clampValidVideoScore(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 0.1;
  return Number(Math.max(0.1, Math.min(10, num)).toFixed(1));
}

function clampPct(raw, fallback = 0) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeGeminiAnalysis(rawParsed = {}, context = {}) {
  const filterCategory = context.categoria_filtro || 'Técnico con Balón';
  const esFutbol = Boolean(rawParsed.es_video_futbol);
  const queSeObserva = String(rawParsed.que_se_observa || '').trim();

  if (!esFutbol) {
    return {
      es_video_futbol: false,
      estado: 'VIDEO_INVALIDO',
      categoria_filtro: filterCategory,
      que_se_observa:
        queSeObserva ||
        'El clip cargado no muestra una práctica, ejercicio físico/coordinativo o acción técnica de fútbol.',
      coherencia_con_filtro: false,
      cantidad_personas_detectadas: Number(rawParsed.cantidad_personas_detectadas || 0),
      jugador_localizado: false,
      jugador_identificado_detalle:
        context.identificacion_jugador || 'No aplica (video inválido)',
      nota_video: null,
      calidad_ejecucion_pct: 0,
      fluidezMotriz: 0,
      estabilidadPostural: 0,
      comparativa_messi: '',
      comparativa_cristiano: '',
      fortalezas_detectadas: [],
      errores_corregir: [],
      diagnosticoVideo:
        String(rawParsed.diagnostico_video || '').trim() ||
        `Video inválido: ${queSeObserva || 'no corresponde a un ejercicio de fútbol'}. Carga un video real de entrenamiento o partido.`,
      fisica_sugerida: null,
      tecnica_sugerida: null,
      coordinativa_sugerida: null,
      modelo_ia: context.modelName || resolveGeminiModel(),
    };
  }

  const notaVideo = clampValidVideoScore(rawParsed.nota_video);
  const calidadPct = clampPct(rawParsed.calidad_ejecucion_pct, Math.round(notaVideo * 10));
  const fluidezMotriz = clampPct(rawParsed.fluidez_motriz, calidadPct);
  const estabilidadPostural = clampPct(rawParsed.estabilidad_postural, calidadPct);

  const fortalezas = Array.isArray(rawParsed.fortalezas_detectadas)
    ? rawParsed.fortalezas_detectadas.map((x) => String(x).trim()).filter(Boolean).slice(0, 5)
    : [];
  const errores = Array.isArray(rawParsed.errores_corregir)
    ? rawParsed.errores_corregir.map((x) => String(x).trim()).filter(Boolean).slice(0, 5)
    : [];

  return {
    es_video_futbol: true,
    estado: 'VALIDO',
    categoria_filtro: filterCategory,
    ejercicio: context.ejercicio_video || 'Ejercicio evaluado',
    que_se_observa: queSeObserva,
    coherencia_con_filtro:
      rawParsed.coherencia_con_filtro !== undefined ? Boolean(rawParsed.coherencia_con_filtro) : true,
    cantidad_personas_detectadas: Math.max(1, Number(rawParsed.cantidad_personas_detectadas || 1)),
    jugador_localizado:
      rawParsed.jugador_localizado !== undefined ? Boolean(rawParsed.jugador_localizado) : true,
    jugador_identificado_detalle:
      String(rawParsed.jugador_identificado_detalle || '').trim() ||
      context.identificacion_jugador ||
      'Jugador principal observado en escena',
    nota_video: notaVideo,
    calidad_ejecucion_pct: Math.max(1, calidadPct),
    fluidezMotriz: Math.max(1, fluidezMotriz),
    estabilidadPostural: Math.max(1, estabilidadPostural),
    comparativa_messi:
      String(rawParsed.comparativa_messi || '').trim() ||
      'Evaluado frente al control en corto, centro de gravedad bajo y cambio de dirección de Lionel Messi en su mejor momento.',
    comparativa_cristiano:
      String(rawParsed.comparativa_cristiano || '').trim() ||
      'Evaluado frente a la potencia atlética, zancada explosiva y precisión de gesto de Cristiano Ronaldo en su mejor momento.',
    fortalezas_detectadas: fortalezas,
    errores_corregir: errores,
    diagnosticoVideo:
      String(rawParsed.diagnostico_video || '').trim() ||
      `Análisis de área ${filterCategory} completado con calificación ${notaVideo.toFixed(1)} / 10.`,
    fisica_sugerida: filterCategory === 'Físico' ? notaVideo : null,
    tecnica_sugerida: filterCategory === 'Técnico con Balón' ? notaVideo : null,
    coordinativa_sugerida: filterCategory === 'Coordinativo' ? notaVideo : null,
    modelo_ia: context.modelName || resolveGeminiModel(),
  };
}

function buildEvaluationPrompt({
  categoria_filtro,
  ejercicio_video,
  identificacion_jugador,
  playerSummary,
}) {
  const rubric = FILTER_RUBRICS[categoria_filtro] || FILTER_RUBRICS['Técnico con Balón'];
  const targetDescription = identificacion_jugador
    ? identificacion_jugador
    : playerSummary
    ? `Jugador único / principal: ${playerSummary}`
    : 'Jugador principal ejecutando el ejercicio';

  return `Eres un Analista Técnico-Deportivo Élite de Fútbol (licencia FIFA / UEFA Pro y especialista en biomecánica deportiva) del club "Legión Fénix".

Tu misión es analizar con MÁXIMA PRECISIÓN Y HONESTIDAD este video enviado por el entrenador. No inventes elogios ni suavices notas: califica estrictamente lo que ves cuadro por cuadro.

PARÁMETROS DE ESTA EVALUACIÓN:
1. Filtro seleccionado por el entrenador: "${categoria_filtro}"
2. Ejercicio declarado: "${ejercicio_video || 'No especificado'}"
3. Datos de ficha del atleta evaluado: "${playerSummary || 'Sin ficha detallada'}"
4. Identificación específica para aislar al jugador si aparecen varias personas en el video: "${targetDescription}"

REGLA #1 — VALIDACIÓN ESTRICTA DE VIDEO DE FÚTBOL (DETECTOR DE VIDEO INVÁLIDO):
- Inspecciona el contenido visual completo del video.
- Si el video NO muestra fútbol, futsal, fútbol 7, entrenamiento físico específico para fútbol, trabajo coordinativo deportivo de fútbol, portero entrenando o jugada real de fútbol (por ejemplo: cocina, animales, autos, pantalla en negro, paisaje vacío, baile, otro deporte ajeno, charla sin ejercicio, meme o clip no relacionado):
  - DEBES responder estrictamente "es_video_futbol": false
  - Describe exactamente en "que_se_observa" qué aparece en el video.
  - Pon "nota_video": 0, porcentajes en 0 y explica en "diagnostico_video" por qué es un Video Inválido.
- Si SÍ es un video de fútbol / entrenamiento de fútbol: responde "es_video_futbol": true.

REGLA #2 — AISLAMIENTO DEL JUGADOR CUANDO HAY VARIOS JUGADORES:
- Si en el video aparecen varios jugadores o compañeros, localiza ÚNICAMENTE al jugador que coincida con: "${targetDescription}".
- Indica en "cantidad_personas_detectadas" cuántas personas ves aproximadamente y en "jugador_localizado" (true/false) + "jugador_identificado_detalle" describe al jugador analizado (ej: dorsal, color de franela/camiseta, zona de la cancha).
- Si hay múltiples jugadores y el video no permite distinguir al jugador solicitado por falta de coincidencia visual o dorsal ilegible, indica "jugador_localizado": false y evalúa al jugador más cercano a la descripción aclarando la limitación en "jugador_identificado_detalle".

REGLA #3 — RÚBRICA DEL FILTRO "${categoria_filtro}":
${rubric}
- Verifica además en "coherencia_con_filtro" si lo que se ve en el video realmente corresponde al área "${categoria_filtro}". Si el ejercicio observado es claramente de otra área o casi inactivo, reflejarlo honestamente.

REGLA #4 — ESCALA DE PONDERACIÓN REALISTA DE 0.1 A 10.0 COMPARADA CON CRISTIANO RONALDO Y MESSI EN SU MEJOR MOMENTO:
- 0.1 a 2.5: Ejecución muy deficiente / mala técnica, postura incorrecta, pérdida constante de balón o desconexión motriz grave.
- 2.6 a 4.9: Nivel inicial / aprendiz, gestos rígidos, imprecisión evidente y baja intensidad.
- 5.0 a 6.9: Nivel formativo intermedio, cumple lo básico del ejercicio pero con errores claros de perfilado, ritmo o control.
- 7.0 a 8.4: Muy buena ejecución competitiva juvenil, alta eficacia, buen control postural y ritmo sólido.
- 8.5 a 9.4: Ejecución de élite competitiva, velocidad, precisión y biomecánica destacables.
- 9.5 a 10.0: Ejecución magistral prácticamente perfecta en el área "${categoria_filtro}", equiparable al nivel de referencia de Cristiano Ronaldo y Lionel Messi en su mejor momento.
IMPORTANTE: NO regales notas de 7 u 8 si el gesto es torpe, lento o mal ejecutado; si se realizó mal, asigna entre 0.1 y 3.5 con honestidad técnica. Si se realizó excelentemente, asigna entre 8.5 y 10.0.

Responde EXCLUSIVAMENTE en JSON válido cumpliendo el esquema solicitado, en español técnico claro.`;
}

const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    es_video_futbol: {
      type: Type.BOOLEAN,
      description: 'true solo si el video muestra entrenamiento o partido real de fútbol; false si es otra cosa o es ilegible.',
    },
    que_se_observa: {
      type: Type.STRING,
      description: 'Descripción objetiva y breve de lo que se ve realmente en las escenas del video.',
    },
    coherencia_con_filtro: {
      type: Type.BOOLEAN,
      description: 'true si el trabajo observado corresponde al filtro Físico, Técnico con Balón o Coordinativo elegido.',
    },
    cantidad_personas_detectadas: {
      type: Type.INTEGER,
      description: 'Número aproximado de personas/jugadores presentes en el video.',
    },
    jugador_localizado: {
      type: Type.BOOLEAN,
      description: 'true si se logró identificar con claridad al jugador indicado por dorsal o características.',
    },
    jugador_identificado_detalle: {
      type: Type.STRING,
      description: 'Indica a qué jugador específico del video se le realizó el análisis (dorsal, vestimenta, ubicación).',
    },
    nota_video: {
      type: Type.NUMBER,
      description: 'Calificación realista de 0.1 (muy mal realizado) a 10.0 (excelente, nivel prime Messi/Cristiano). Debe ser 0 si es_video_futbol es false.',
    },
    calidad_ejecucion_pct: {
      type: Type.INTEGER,
      description: 'Porcentaje global de calidad en la ejecución del ejercicio (0 si inválido, 1 a 100 si válido).',
    },
    fluidez_motriz: {
      type: Type.INTEGER,
      description: 'Porcentaje de fluidez del movimiento biomecánico (0 a 100).',
    },
    estabilidad_postural: {
      type: Type.INTEGER,
      description: 'Porcentaje de estabilidad del tronco, apoyos y centro de gravedad (0 a 100).',
    },
    comparativa_messi: {
      type: Type.STRING,
      description: 'Análisis comparativo directo frente a Lionel Messi en su mejor momento en este tipo de trabajo.',
    },
    comparativa_cristiano: {
      type: Type.STRING,
      description: 'Análisis comparativo directo frente a Cristiano Ronaldo en su mejor momento en este tipo de trabajo.',
    },
    fortalezas_detectadas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista de 2 a 4 aspectos positivos específicos observados en el video.',
    },
    errores_corregir: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista de 2 a 4 errores técnicos/físicos/coordinativos a corregir.',
    },
    diagnostico_video: {
      type: Type.STRING,
      description: 'Veredicto final del entrenador IA con recomendación concreta de mejora.',
    },
  },
  required: [
    'es_video_futbol',
    'que_se_observa',
    'coherencia_con_filtro',
    'cantidad_personas_detectadas',
    'jugador_localizado',
    'jugador_identificado_detalle',
    'nota_video',
    'calidad_ejecucion_pct',
    'fluidez_motriz',
    'estabilidad_postural',
    'comparativa_messi',
    'comparativa_cristiano',
    'fortalezas_detectadas',
    'errores_corregir',
    'diagnostico_video',
  ],
};

async function prepareLocalFileForUpload(file) {
  if (!file) {
    const err = new Error('No se recibió ningún archivo de video.');
    err.statusCode = 400;
    throw err;
  }

  // Archivo local guardado por diskStorage
  if (file.path && !/^https?:\/\//i.test(file.path) && fs.existsSync(file.path)) {
    return { localPath: file.path, cleanupTemp: false };
  }

  // URL remota (ej. Cloudinary en producción): descargar temporalmente para enviarlo a Gemini Files API
  if (file.path && /^https?:\/\//i.test(file.path)) {
    const response = await fetch(file.path);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el video remoto desde almacenamiento (${response.status}).`);
    }
    const arrayBuf = await response.arrayBuffer();
    const ext = path.extname(file.originalname || '') || '.mp4';
    const tmpPath = path.join(os.tmpdir(), `fenix-gemini-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    fs.writeFileSync(tmpPath, Buffer.from(arrayBuf));
    return { localPath: tmpPath, cleanupTemp: true };
  }

  throw new Error('No se encontró la ruta física del video cargado.');
}

async function waitForGeminiFileActive(ai, fileName, timeoutMs = 90000) {
  const startedAt = Date.now();
  let current = await ai.files.get({ name: fileName });

  while (current.state === FileState.PROCESSING || current.state === 'PROCESSING') {
    if (Date.now() - startedAt > timeoutMs) {
      const err = new Error(
        'Tiempo de espera agotado mientras Google Gemini procesaba el video. Intenta con un clip más corto (10–30 segundos).'
      );
      err.statusCode = 504;
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    current = await ai.files.get({ name: fileName });
  }

  if (current.state === FileState.FAILED || current.state === 'FAILED') {
    const err = new Error(
      'Google Gemini no pudo decodificar el formato de este video. Graba un MP4 estándar desde tu teléfono e inténtalo de nuevo.'
    );
    err.statusCode = 502;
    throw err;
  }

  return current;
}

async function analyzeFootballDrillVideo({
  file,
  categoria_filtro,
  ejercicio_video = '',
  identificacion_jugador = '',
  playerSummary = '',
}) {
  const normalizedFilter = normalizeFilterCategory(categoria_filtro);
  if (!normalizedFilter) {
    const err = new Error(
      'Debes seleccionar el filtro de trabajo antes de evaluar el video: "Físico", "Técnico con Balón" o "Coordinativo".'
    );
    err.statusCode = 400;
    throw err;
  }

  if (!isAllowedVideoFile(file)) {
    const err = new Error('Formato inválido: sube un archivo de video real (MP4, MOV, WEBM o M4V).');
    err.statusCode = 400;
    throw err;
  }

  const apiKey = resolveGeminiApiKey();
  const modelName = resolveGeminiModel();
  const mimeType = inferVideoMimeType(file);

  const { localPath, cleanupTemp } = await prepareLocalFileForUpload(file);
  const ai = new GoogleGenAI({ apiKey });

  let uploadedGeminiFile = null;

  try {
    uploadedGeminiFile = await ai.files.upload({
      file: localPath,
      config: {
        mimeType,
        displayName: `LegionFenix-${normalizedFilter}-${Date.now()}`,
      },
    });

    const activeFile = await waitForGeminiFileActive(ai, uploadedGeminiFile.name);
    const prompt = buildEvaluationPrompt({
      categoria_filtro: normalizedFilter,
      ejercicio_video,
      identificacion_jugador,
      playerSummary,
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: createUserContent([
        createPartFromUri(activeFile.uri, activeFile.mimeType || mimeType),
        prompt,
      ]),
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    });

    const rawText = typeof response.text === 'string' ? response.text : '';
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      parsedJson = JSON.parse(cleaned);
    }

    return normalizeGeminiAnalysis(parsedJson, {
      categoria_filtro: normalizedFilter,
      ejercicio_video,
      identificacion_jugador,
      modelName,
    });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    const msg = String(error?.message || '');
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || error?.status === 401 || error?.status === 403) {
      const authErr = new Error(
        'La clave GEMINI_API_KEY configurada fue rechazada por Google Gemini. Verifica tu clave en https://aistudio.google.com/apikey.'
      );
      authErr.statusCode = 502;
      authErr.code = 'GEMINI_KEY_INVALID';
      throw authErr;
    }
    if (error?.status === 429 || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      const quotaErr = new Error(
        'Se alcanzó temporalmente el límite de solicitudes de Google Gemini API. Espera unos segundos e intenta de nuevo.'
      );
      quotaErr.statusCode = 429;
      throw quotaErr;
    }
    const wrapped = new Error(`Error al analizar el video con Google Gemini AI: ${msg || 'Fallo de comunicación'}`);
    wrapped.statusCode = 502;
    throw wrapped;
  } finally {
    if (uploadedGeminiFile?.name) {
      await ai.files.delete({ name: uploadedGeminiFile.name }).catch(() => {});
    }
    if (cleanupTemp && localPath && fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch {
        // Ignorar limpieza temporal
      }
    }
  }
}

module.exports = {
  VALID_FILTERS,
  normalizeFilterCategory,
  normalizeGeminiAnalysis,
  analyzeFootballDrillVideo,
  resolveGeminiApiKey,
  clampValidVideoScore,
};
