const representantesModel = require('./representantes.model');
const pagosModel = require('../pagos/pagos.model');
const { getUploadedFileUrl } = require('../../config/cloudinary');

exports.listPlayers = async (req, res) => {
  try {
    const isStaff = ['ADMINISTRADOR', 'ANALISTA_ADMIN', 'ENTRENADOR', 'FISIO'].includes(req.user.rol);
    let idRepresentante = null;

    if (!isStaff) {
      idRepresentante = req.user.id_representante || null;
      if (!idRepresentante) {
        const pool = require('../../config/db');
        const { rows } = await pool.query(
          'SELECT id_representante FROM representantes WHERE id_usuario = $1 LIMIT 1',
          [req.user.id]
        );
        if (rows.length > 0) {
          idRepresentante = rows[0].id_representante;
        }
      }

      // Si no es staff y no tiene id_representante asignado, no tiene acceso a ningún atleta
      if (!idRepresentante) {
        return res.json({ players: [] });
      }
    }

    const rawPlayers = await representantesModel.getPlayersList({
      idRepresentante,
    });
    const players =
      req.user.rol === 'ANALISTA_ADMIN'
        ? rawPlayers.map(({ observaciones_fisio, condiciones_cardiacas, alergias, evaluacion_podologica, ...safe }) => safe)
        : rawPlayers;
    return res.json({ players });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getPlayerDossier = async (req, res) => {
  const idJugador = Number(req.params.id);
  try {
    const player = await representantesModel.getPlayerById(idJugador);
    if (!player) {
      return res.status(404).json({ error: 'Atleta no encontrado.' });
    }

    if (
      (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') &&
      player.id_representante !== req.user.id_representante
    ) {
      return res.status(403).json({ error: 'No tiene acceso al expediente de este atleta.' });
    }

    const bcvService = require('../../services/bcvService');
    const [transactions, nextFixture, upcomingMatchesRaw, stats, evalHistory, assignedDrills, bcv] = await Promise.all([
      pagosModel.getTransactions({ idJugador }),
      representantesModel.getNextFixtureAndLogisticsForPlayer(idJugador, player.id_categoria),
      representantesModel.getUpcomingMatchesForPlayer(idJugador, player.id_categoria),
      representantesModel.getPlayerStats(idJugador),
      representantesModel.getEvalHistoryForPlayer(idJugador),
      representantesModel.getAssignedDrillsForPlayer(idJugador, player.id_categoria),
      bcvService.getBcvRate(),
    ]);

    const safePlayer =
      req.user.rol === 'ANALISTA_ADMIN'
        ? {
            ...player,
            observaciones_fisio: undefined,
            condiciones_cardiacas: undefined,
            alergias: undefined,
          }
        : player;

    const notificationService = require('../../services/notificationService');
    const enrichMatch = (m) =>
      m
        ? {
            ...m,
            uniforme_img: notificationService.getUniformImgForMatch(m, player.posicion_habitual),
          }
        : null;

    const enrichedNextFixture = enrichMatch(nextFixture);
    const upcomingMatches = (upcomingMatchesRaw || []).map(enrichMatch);

    const bloqueoConvocatoria = player.estado_cuenta === 'Moroso';

    return res.json({
      player: safePlayer,
      transactions,
      nextFixture: enrichedNextFixture,
      upcomingMatches,
      stats,
      evalHistory,
      assignedDrills,
      bloqueoConvocatoria,
      bcv,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.checkDorsal = async (req, res) => {
  const { id_categoria, dorsal } = req.query;
  if (!id_categoria || !dorsal) {
    return res.status(400).json({ error: 'Categoría y dorsal requeridos.' });
  }
  try {
    const result = await representantesModel.checkDorsalAvailability(Number(id_categoria), Number(dorsal));
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadPlayerPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de fotografía no recibido.' });
    }
    const url = getUploadedFileUrl(req, req.file);
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.registerCompleteAthlete = async (req, res) => {
  try {
    const {
      representanteData = {},
      jugadorData = {},
      fichaMedicaData = {},
      uniformeData = {},
      consentimientoData = {},
    } = req.body;

    if (!jugadorData.nombre || !jugadorData.apellido || !jugadorData.dni_cedula || !jugadorData.fecha_nacimiento) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del alumno.' });
    }
    if (!consentimientoData.uso_imagen || !consentimientoData.exoneracion_medica || !consentimientoData.firma_representante) {
      return res.status(400).json({
        error: 'Debe aceptar el uso de imagen, la exoneración médica y registrar la firma digital.',
      });
    }

    const created = await representantesModel.registerCompleteAthlete({
      idUsuario: req.user.id,
      idRepresentante: req.user.id_representante || null,
      representanteData,
      jugadorData,
      fichaMedicaData,
      uniformeData,
      consentimientoData,
    });

    return res.status(201).json({
      message: 'Atleta registrado exitosamente en las 5 etapas.',
      player: created,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe un atleta registrado con ese DNI/Cédula.',
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

exports.getInboxNotifications = async (req, res) => {
  try {
    const notificationService = require('../../services/notificationService');
    const idRep = req.user.id_representante || null;
    if (idRep) {
      await notificationService.syncAndDispatchUpcomingPaymentReminders({ idRepresentante: idRep }).catch(() => {});
    }
    const raw = await representantesModel.getNotificationsForRepresentante(idRep, req.user.id);
    const notifications = raw.map((item) => ({
      ...item,
      uniforme_img:
        item.referencia_tipo === 'partido'
          ? notificationService.getUniformImgForMatch(
              {
                es_local: item.partido_es_local ?? item.metadata_json?.es_local,
                kit_designado: item.partido_kit_designado || item.metadata_json?.kit_designado,
              },
              item.jugador_posicion
            )
          : null,
    }));
    const unreadCount = notifications.filter((n) => !n.leida).length;
    return res.json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.markInboxNotificationRead = async (req, res) => {
  const idNotificacion = Number(req.params.id);
  try {
    const updated = await representantesModel.markNotificationRead(
      idNotificacion,
      req.user.id_representante || null,
      req.user.id
    );
    if (!updated) return res.status(404).json({ error: 'Notificación no encontrada.' });
    return res.json({ notification: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

async function resolveUserRepresentanteId(req) {
  if (req.user.id_representante) return req.user.id_representante;
  const pool = require('../../config/db');
  const { rows } = await pool.query(
    'SELECT id_representante FROM representantes WHERE id_usuario = $1 LIMIT 1',
    [req.user.id]
  );
  return rows[0]?.id_representante || null;
}

exports.respondConvocation = async (req, res) => {
  const idJugador = Number(req.params.id);
  const idPartido = Number(req.params.idPartido);
  const rawEstado = req.body.estado_convocatoria || req.body.estado;
  const { observacion } = req.body;

  // Normalizar posibles valores desde la interfaz
  const normalizedEstado =
    rawEstado === 'No_Asiste' || rawEstado === 'No Puedo Asistir'
      ? 'Descartado'
      : rawEstado;

  if (!['Confirmado', 'Descartado'].includes(normalizedEstado)) {
    return res.status(400).json({
      error: 'Estado de respuesta inválido. Usa Confirmado o Descartado.',
    });
  }

  try {
    const player = await representantesModel.getPlayerById(idJugador);
    if (!player) return res.status(404).json({ error: 'Atleta no encontrado.' });
    if (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') {
      const userRepId = await resolveUserRepresentanteId(req);
      if (player.id_representante !== userRepId) {
        return res.status(403).json({ error: 'No autorizado para confirmar asistencia de este atleta.' });
      }
    }
    if (normalizedEstado === 'Confirmado' && player.estado_cuenta === 'Moroso') {
      return res.status(403).json({
        error: 'Atleta con bloqueo administrativo por morosidad. Regulariza tus pagos para confirmar asistencia al partido.',
      });
    }

    const convocatoria = await representantesModel.updatePlayerConvocatoria({
      idPartido,
      idJugador,
      estadoConvocatoria: normalizedEstado,
      observacion,
      idUsuario: req.user.id,
    });
    return res.json({
      message:
        normalizedEstado === 'Confirmado'
          ? 'Asistencia al juego confirmada exitosamente.'
          : 'Se registró que no podrás asistir a este partido.',
      convocatoria,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.respondTrainingAttendance = async (req, res) => {
  const idJugador = Number(req.params.id);
  const idTrabajo = Number(req.params.idTrabajo);
  const rawEstado = req.body.estado || req.body.estado_asistencia;
  const { observacion } = req.body;

  const normalizedEstado =
    rawEstado === 'Descartado' || rawEstado === 'No Puedo Asistir' || rawEstado === 'No_Asiste'
      ? 'No_Asiste'
      : rawEstado === 'Confirmado'
      ? 'Confirmado'
      : null;

  if (!normalizedEstado) {
    return res.status(400).json({
      error: 'Estado inválido para entrenamiento. Usa Confirmado o No_Asiste.',
    });
  }

  try {
    const player = await representantesModel.getPlayerById(idJugador);
    if (!player) return res.status(404).json({ error: 'Atleta no encontrado.' });
    if (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') {
      const userRepId = await resolveUserRepresentanteId(req);
      if (player.id_representante !== userRepId) {
        return res.status(403).json({ error: 'No autorizado para confirmar asistencia de este atleta.' });
      }
    }

    const confirmacion = await representantesModel.upsertTrainingConfirmation({
      idTrabajo,
      idJugador,
      estado: normalizedEstado,
      observacion: observacion || '',
      idUsuario: req.user.id,
    });

    return res.json({
      message:
        normalizedEstado === 'Confirmado'
          ? 'Asistencia al entrenamiento confirmada exitosamente.'
          : 'Se notificó al cuerpo técnico que no podrás asistir a este entrenamiento.',
      confirmacion,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updatePlayerSizes = async (req, res) => {
  const idJugador = Number(req.params.id);
  const { talla_camiseta, talla_short, talla_zapatos } = req.body;

  try {
    const player = await representantesModel.getPlayerById(idJugador);
    if (!player) return res.status(404).json({ error: 'Atleta no encontrado.' });

    if (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') {
      const userRepId = await resolveUserRepresentanteId(req);
      if (player.id_representante !== userRepId) {
        return res.status(403).json({ error: 'No autorizado para editar tallas de este atleta.' });
      }
    }

    const updated = await representantesModel.updatePlayerSizes(idJugador, {
      talla_camiseta,
      talla_short,
      talla_zapatos,
    });

    return res.json({
      message: 'Tallas de camisa, short y zapatos del jugador actualizadas correctamente.',
      uniforme: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
