const entrenadoresModel = require('./entrenadores.model');
const representantesModel = require('../representantes/representantes.model');
const categoriasModel = require('../categorias/categorias.model');
const adminModel = require('../admin/admin.model');
const notificationService = require('../../services/notificationService');
const { getUploadedFileUrl } = require('../../config/cloudinary');

function clampScore(val, fallback = 5) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Number(Math.max(0, Math.min(10, n)).toFixed(2));
}

function addMinutesToTimeStr(timeStr, minutesToAdd) {
  const [hStr = '16', mStr = '00'] = String(timeStr || '16:00').split(':');
  const totalMins = Number(hStr) * 60 + Number(mStr) + Number(minutesToAdd || 30);
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMins));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function timeToMinutes(timeStr) {
  const [h = 0, m = 0] = String(timeStr || '00:00').split(':').map(Number);
  return h * 60 + m;
}

exports.getCoachDashboard = async (req, res) => {
  const idCategoria = req.query.id_categoria ? Number(req.query.id_categoria) : null;
  try {
    const [tacticas, microciclos, videos, categories, players, upcomingMatches, trabajos, evaluaciones] =
      await Promise.all([
        entrenadoresModel.getTacticas(),
        entrenadoresModel.getMicrociclos(idCategoria),
        entrenadoresModel.getVideos(idCategoria),
        categoriasModel.getCategories(),
        representantesModel.getPlayersList(),
        entrenadoresModel.getUpcomingFixtures(),
        entrenadoresModel.getTrabajosCampo({ idCategoria }),
        entrenadoresModel.getEvaluaciones({ idCategoria }),
      ]);

    return res.json({
      tacticas,
      microciclos,
      videos,
      categories,
      players,
      upcomingMatches,
      trabajos,
      evaluaciones,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createMicrociclo = async (req, res) => {
  const {
    id_categoria,
    titulo,
    semana_inicio,
    semana_fin,
    objetivo_principal,
    bloque_arqueros,
    bloque_defensivo,
    bloque_ofensivo,
    carga_estimada,
  } = req.body;

  if (
    !titulo ||
    !semana_inicio ||
    !semana_fin ||
    !objetivo_principal ||
    !bloque_arqueros ||
    !bloque_defensivo ||
    !bloque_ofensivo
  ) {
    return res.status(400).json({
      error: 'Debe completar el objetivo y los 3 bloques (Arqueros, Defensivo y Ofensivo).',
    });
  }

  try {
    const created = await entrenadoresModel.createMicrociclo({
      id_entrenador: req.user.id,
      id_categoria,
      titulo,
      semana_inicio,
      semana_fin,
      objetivo_principal,
      bloque_arqueros,
      bloque_defensivo,
      bloque_ofensivo,
      carga_estimada,
    });
    return res.status(201).json({ message: 'Microciclo planificado exitosamente.', microciclo: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateMicrocicloEstado = async (req, res) => {
  const idMicrociclo = Number(req.params.id);
  const { estado } = req.body;
  try {
    const updated = await entrenadoresModel.updateMicrocicloEstado(idMicrociclo, estado);
    if (!updated) return res.status(404).json({ error: 'Microciclo no encontrado.' });
    return res.json({ message: 'Estado actualizado.', microciclo: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteMicrociclo = async (req, res) => {
  const idMicrociclo = Number(req.params.id);
  try {
    const deleted = await entrenadoresModel.deleteMicrociclo(idMicrociclo);
    if (!deleted) return res.status(404).json({ error: 'Microciclo no encontrado.' });
    return res.json({ message: 'Microciclo eliminado.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.addVideo = async (req, res) => {
  const { id_categoria, titulo, descripcion, tipo_fuente, video_url, etiqueta_tactica } = req.body;
  try {
    let resolvedUrl = video_url;
    let resolvedTipo = tipo_fuente || 'YouTube';

    if (req.file) {
      resolvedUrl = getUploadedFileUrl(req, req.file);
      resolvedTipo = 'Archivo';
    }

    if (!titulo || !resolvedUrl) {
      return res.status(400).json({ error: 'Título y URL de YouTube o archivo de video requeridos.' });
    }

    const created = await entrenadoresModel.createVideo({
      id_entrenador: req.user.id,
      id_categoria,
      titulo,
      descripcion,
      tipo_fuente: resolvedTipo,
      video_url: resolvedUrl,
      etiqueta_tactica,
    });

    return res.status(201).json({ message: 'Video de análisis agregado.', video: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  const idVideo = Number(req.params.id);
  try {
    const deleted = await entrenadoresModel.deleteVideo(idVideo);
    if (!deleted) return res.status(404).json({ error: 'Video no encontrado.' });
    return res.json({ message: 'Video eliminado.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==============================================================================
// TABLA DE JUEGO 2D (LÍMITE 10 FORMACIONES POR CATEGORÍA + ANIMACIÓN)
// ==============================================================================
exports.listTacticas = async (req, res) => {
  const idCategoria = req.query.id_categoria ? Number(req.query.id_categoria) : null;
  const modalidad = req.query.modalidad || null;
  try {
    const tacticas = await entrenadoresModel.getTacticas(idCategoria, modalidad);
    return res.json({ tacticas });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createTactica = async (req, res) => {
  const {
    id_categoria,
    id_trabajo,
    nombre_sistema,
    modalidad,
    pros,
    contras,
    descripcion,
    formacion_json,
    movimientos_json,
  } = req.body;

  if (!nombre_sistema || !modalidad || !pros || !contras) {
    return res.status(400).json({ error: 'Sistema, modalidad, pros y contras son obligatorios.' });
  }

  try {
    if (id_categoria) {
      const currentCount = await entrenadoresModel.countTacticasByCategory(Number(id_categoria));
      if (currentCount >= 10) {
        return res.status(400).json({
          error:
            'Límite alcanzado: cada categoría admite un máximo de 10 formaciones guardadas. Elimina o sobrescribe una existente.',
        });
      }
    }

    const created = await entrenadoresModel.createTactica({
      id_categoria,
      id_trabajo,
      nombre_sistema,
      modalidad,
      pros,
      contras,
      descripcion,
      formacion_json,
      movimientos_json,
    });
    return res.status(201).json({ message: 'Formación táctica guardada en la categoría.', tactica: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateTactica = async (req, res) => {
  const idTactica = Number(req.params.id);
  try {
    const updated = await entrenadoresModel.updateTactica(idTactica, req.body);
    if (!updated) return res.status(404).json({ error: 'Formación no encontrada.' });
    return res.json({ message: 'Movimientos y formación actualizados.', tactica: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteTactica = async (req, res) => {
  const idTactica = Number(req.params.id);
  try {
    const deleted = await entrenadoresModel.deleteTactica(idTactica);
    if (!deleted) return res.status(404).json({ error: 'Formación no encontrada.' });
    return res.json({ message: 'Formación eliminada de la categoría.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==============================================================================
// AGENDA COMPARTIDA DE TRABAJOS 3D EN CANCHA (ENTRENADORES Y FISIOTERAPEUTAS)
// ==============================================================================
exports.listTrabajos = async (req, res) => {
  const { fecha, cuadrante, id_categoria, rol_autor } = req.query;
  try {
    const [trabajos, categories, players] = await Promise.all([
      entrenadoresModel.getTrabajosCampo({
        fecha: fecha || null,
        cuadrante: cuadrante || null,
        idCategoria: id_categoria || null,
        rolAutor: rol_autor || null,
      }),
      categoriasModel.getCategories(),
      representantesModel.getPlayersList(),
    ]);
    return res.json({ trabajos, categories, players });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createTrabajo = async (req, res) => {
  const {
    id_categoria,
    id_jugador,
    titulo,
    bloque,
    descripcion_escrita,
    duracion_minutos,
    fecha,
    hora_inicio,
    hora_fin,
    cuadrante,
    espacio_cancha,
    animacion_3d_json,
  } = req.body;

  if (!titulo || !descripcion_escrita || !hora_inicio || !cuadrante || !espacio_cancha) {
    return res.status(400).json({
      error: 'Título, ejercicio escrito, hora de inicio, cuadrante y espacio de cancha son obligatorios.',
    });
  }

  const targetDate = fecha || new Date().toISOString().slice(0, 10);
  const durationNum = Math.max(5, Math.min(240, Number(duracion_minutos || 30)));
  const resolvedHoraFin = hora_fin || addMinutesToTimeStr(hora_inicio, durationNum);

  if (timeToMinutes(resolvedHoraFin) <= timeToMinutes(hora_inicio)) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio.' });
  }

  try {
    const conflict = await entrenadoresModel.findConflictingTrabajo({
      fecha: targetDate,
      cuadrante,
      hora_inicio,
      hora_fin: resolvedHoraFin,
      espacio_cancha,
    });

    if (conflict) {
      return res.status(409).json({
        error: `Espacio ocupado en ${cuadrante} (${String(conflict.hora_inicio).slice(0, 5)}–${String(
          conflict.hora_fin
        ).slice(0, 5)}) por ${conflict.rol_autor} (${conflict.categoria_nombre || conflict.autor_nombre || 'Club'}) en "${conflict.espacio_cancha}". Selecciona otro sector libre (ej. otra mitad) u otro horario.`,
        conflict,
      });
    }

    const created = await entrenadoresModel.createTrabajoCampo({
      id_autor: req.user.id,
      rol_autor: req.user.rol,
      id_categoria,
      id_jugador,
      titulo: titulo.trim(),
      bloque,
      descripcion_escrita: descripcion_escrita.trim(),
      duracion_minutos: durationNum,
      fecha: targetDate,
      hora_inicio,
      hora_fin: resolvedHoraFin,
      cuadrante,
      espacio_cancha,
      animacion_3d_json,
    });

    return res.status(201).json({
      message: `Trabajo 2D guardado y espacio "${espacio_cancha}" reservado (${hora_inicio}–${resolvedHoraFin}).`,
      trabajo: created,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateTrabajo = async (req, res) => {
  const idTrabajo = Number(req.params.id);
  try {
    const existing = await entrenadoresModel.getTrabajoById(idTrabajo);
    if (!existing) return res.status(404).json({ error: 'Trabajo de campo no encontrado.' });

    if (req.user.rol !== 'ADMINISTRADOR' && existing.rol_autor !== req.user.rol) {
      return res.status(403).json({
        error: 'Solo puedes modificar trabajos pertenecientes a tu departamento técnico o médico.',
      });
    }

    const nextFecha = req.body.fecha || existing.fecha;
    const nextCuadrante = req.body.cuadrante || existing.cuadrante;
    const nextHoraInicio = req.body.hora_inicio || String(existing.hora_inicio).slice(0, 5);
    const durationNum = Math.max(5, Math.min(240, Number(req.body.duracion_minutos || existing.duracion_minutos)));
    const nextHoraFin = req.body.hora_fin || addMinutesToTimeStr(nextHoraInicio, durationNum);
    const nextEspacio = req.body.espacio_cancha || existing.espacio_cancha;

    if (timeToMinutes(nextHoraFin) <= timeToMinutes(nextHoraInicio)) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio.' });
    }

    const conflict = await entrenadoresModel.findConflictingTrabajo({
      fecha: nextFecha,
      cuadrante: nextCuadrante,
      hora_inicio: nextHoraInicio,
      hora_fin: nextHoraFin,
      espacio_cancha: nextEspacio,
      excludeId: idTrabajo,
    });

    if (conflict) {
      return res.status(409).json({
        error: `Conflicto de horario en ${nextCuadrante} con "${conflict.titulo}" (${conflict.espacio_cancha}).`,
        conflict,
      });
    }

    const updated = await entrenadoresModel.updateTrabajoCampo(idTrabajo, {
      id_categoria: req.body.id_categoria !== undefined ? req.body.id_categoria : existing.id_categoria,
      id_jugador: req.body.id_jugador !== undefined ? req.body.id_jugador : existing.id_jugador,
      titulo: req.body.titulo || existing.titulo,
      bloque: req.body.bloque || existing.bloque,
      descripcion_escrita: req.body.descripcion_escrita || existing.descripcion_escrita,
      duracion_minutos: durationNum,
      fecha: nextFecha,
      hora_inicio: nextHoraInicio,
      hora_fin: nextHoraFin,
      cuadrante: nextCuadrante,
      espacio_cancha: nextEspacio,
      animacion_3d_json:
        req.body.animacion_3d_json !== undefined ? req.body.animacion_3d_json : existing.animacion_3d_json,
    });

    return res.json({ message: 'Trabajo de campo y horario actualizados.', trabajo: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteTrabajo = async (req, res) => {
  const idTrabajo = Number(req.params.id);
  try {
    const existing = await entrenadoresModel.getTrabajoById(idTrabajo);
    if (!existing) return res.status(404).json({ error: 'Trabajo de campo no encontrado.' });

    if (req.user.rol !== 'ADMINISTRADOR' && existing.rol_autor !== req.user.rol) {
      return res.status(403).json({
        error: 'Solo puedes eliminar trabajos creados por tu propio módulo.',
      });
    }

    await entrenadoresModel.deleteTrabajoCampo(idTrabajo);
    return res.json({ message: 'Trabajo eliminado y espacio liberado.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==============================================================================
// EVALUACIÓN MANUAL DEL JUGADOR (FÍSICA, TÉCNICA CON BALÓN Y COORDINATIVA)
// ==============================================================================
exports.listEvaluations = async (req, res) => {
  const idCategoria = req.query.id_categoria ? Number(req.query.id_categoria) : null;
  const idJugador = req.query.id_jugador ? Number(req.query.id_jugador) : null;
  try {
    const evaluaciones = await entrenadoresModel.getEvaluaciones({ idCategoria, idJugador });
    return res.json({ evaluaciones });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createEvaluation = async (req, res) => {
  const { id_jugador } = req.body;
  if (!id_jugador) {
    return res.status(400).json({ error: 'Debe seleccionar un jugador para evaluar.' });
  }

  const vel = clampScore(req.body.fisica_velocidad, 6);
  const resFis = clampScore(req.body.fisica_resistencia, 6);
  const fue = clampScore(req.body.fisica_fuerza, 6);

  const ctrl = clampScore(req.body.tecnica_control, 6);
  const pas = clampScore(req.body.tecnica_pase, 6);
  const def = clampScore(req.body.tecnica_definicion, 6);

  const agi = clampScore(req.body.coordinativa_agilidad, 6);
  const eq = clampScore(req.body.coordinativa_equilibrio, 6);
  const rit = clampScore(req.body.coordinativa_ritmo, 6);

  const scoreFisica = Number(((vel + resFis + fue) / 3).toFixed(2));
  const scoreTecnica = Number(((ctrl + pas + def) / 3).toFixed(2));
  const scoreCoordinativa = Number(((agi + eq + rit) / 3).toFixed(2));

  const rawGlobal = (scoreFisica + scoreTecnica + scoreCoordinativa) / 3;
  const puntajeGlobal = clampScore(rawGlobal);
  const porcentajeGlobal = Math.max(0, Math.min(100, Math.round(puntajeGlobal * 10)));

  const metricLabels = [
    { name: 'Velocidad y Arranque', val: vel },
    { name: 'Resistencia Aeróbica', val: resFis },
    { name: 'Fuerza en Duelos', val: fue },
    { name: 'Control y Regate', val: ctrl },
    { name: 'Precisión de Pase', val: pas },
    { name: 'Definición al Arco', val: def },
    { name: 'Agilidad y Cambios de Dirección', val: agi },
    { name: 'Equilibrio Postural', val: eq },
    { name: 'Ritmo y Reacción', val: rit },
  ];

  const sortedDesc = [...metricLabels].sort((a, b) => b.val - a.val);
  const sortedAsc = [...metricLabels].sort((a, b) => a.val - b.val);

  const autoFortalezas = sortedDesc
    .slice(0, 3)
    .map((m) => m.name)
    .join('|');
  const autoDebilidades = sortedAsc
    .filter((m) => m.val < 7.2)
    .slice(0, 2)
    .map((m) => m.name)
    .join('|');

  try {
    const created = await entrenadoresModel.createEvaluacion({
      id_jugador,
      id_evaluador: req.user.id,
      fecha_evaluacion: req.body.fecha_evaluacion,
      fisica_velocidad: vel,
      fisica_resistencia: resFis,
      fisica_fuerza: fue,
      tecnica_control: ctrl,
      tecnica_pase: pas,
      tecnica_definicion: def,
      coordinativa_agilidad: agi,
      coordinativa_equilibrio: eq,
      coordinativa_ritmo: rit,
      score_fisica: scoreFisica,
      score_tecnica: scoreTecnica,
      score_coordinativa: scoreCoordinativa,
      ejercicio_video: null,
      video_url: null,
      nota_video: null,
      analisis_video_json: null,
      puntaje_global: puntajeGlobal,
      porcentaje_global: porcentajeGlobal,
      fortalezas: req.body.fortalezas || autoFortalezas,
      debilidades: req.body.debilidades || autoDebilidades || 'Mantener consistencia bajo fatiga',
      observaciones: req.body.observaciones || '',
    });

    return res.status(201).json({
      message: `Evaluación manual guardada (${puntajeGlobal.toFixed(1)}/10 • ${porcentajeGlobal}%).`,
      evaluation: created,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==============================================================================
// ASISTENCIA DE ENTRENAMIENTOS / JUEGOS + ELEGIBILIDAD (ENTRENADOR)
// ==============================================================================
exports.getCoachAttendance = async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  const idCategoria = req.query.id_categoria ? Number(req.query.id_categoria) : null;
  const tipoSesion = req.query.tipo_sesion === 'Juego' ? 'Juego' : 'Entrenamiento';

  try {
    const [records, alerts, categories] = await Promise.all([
      adminModel.getAttendanceByDate(fecha, idCategoria, tipoSesion),
      adminModel.getAbsenceAlerts(),
      categoriasModel.getCategories(),
    ]);
    return res.json({ fecha, tipo_sesion: tipoSesion, records, alerts, categories });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.recordCoachAttendance = async (req, res) => {
  const { id_jugador, id_categoria, fecha, tipo_sesion, cuadrante, action, observaciones } = req.body;
  if (!id_jugador || !action) {
    return res.status(400).json({ error: 'Jugador y acción de asistencia requeridos.' });
  }

  try {
    const attendance = await adminModel.upsertAttendance({
      id_jugador: Number(id_jugador),
      id_categoria: id_categoria ? Number(id_categoria) : null,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      tipo_sesion: tipo_sesion === 'Juego' ? 'Juego' : 'Entrenamiento',
      cuadrante: cuadrante || 'Cuadrante Norte - Campo',
      action,
      observaciones,
      registrado_por: req.user.id,
    });

    if (!attendance) {
      return res.status(400).json({ error: 'Debe registrar asistencia primero antes del Check-Out.' });
    }

    const alerts = await adminModel.getAbsenceAlerts();
    return res.json({ message: 'Asistencia deportiva registrada.', attendance, alerts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==============================================================================
// CONVOCATORIAS OFICIALES (CON NOTIFICACIÓN AUTOMÁTICA BANDEJA + EMAIL + WHATSAPP)
// ==============================================================================
exports.listConvocatorias = async (req, res) => {
  const idPartido = req.query.id_partido ? Number(req.query.id_partido) : null;
  try {
    const convocatorias = await entrenadoresModel.getConvocatoriasByMatch(idPartido);
    return res.json({ convocatorias });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createConvocatoria = async (req, res) => {
  const { id_partido, id_jugador, estado_convocatoria, observacion } = req.body;
  if (!id_partido || !id_jugador) {
    return res.status(400).json({ error: 'Partido y jugador son obligatorios para convocar.' });
  }

  try {
    const convocatoria = await entrenadoresModel.upsertConvocatoria({
      id_partido,
      id_jugador,
      estado_convocatoria: estado_convocatoria || 'Convocado',
      observacion: observacion || '',
    });

    const notification = await notificationService
      .notifyMatchConvocation({
        idPartido: id_partido,
        idJugador: id_jugador,
        estadoConvocatoria: convocatoria.estado_convocatoria,
        observacion: convocatoria.observacion,
      })
      .catch(() => null);

    return res.status(201).json({
      message: 'Convocatoria registrada y notificación enviada al representante/atleta.',
      convocatoria,
      notification,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
