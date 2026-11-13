const representantesModel = require('./representantes.model');
const pagosModel = require('../pagos/pagos.model');
const { getUploadedFileUrl } = require('../../config/cloudinary');

exports.listPlayers = async (req, res) => {
  try {
    const isStaff = ['ADMINISTRADOR', 'ANALISTA_ADMIN', 'ENTRENADOR', 'FISIO'].includes(req.user.rol);
    const rawPlayers = await representantesModel.getPlayersList({
      idRepresentante: isStaff ? null : req.user.id_representante,
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
    const [transactions, nextFixture, stats, evalHistory, assignedDrills, bcv] = await Promise.all([
      pagosModel.getTransactions({ idJugador }),
      representantesModel.getNextFixtureAndLogisticsForPlayer(idJugador, player.id_categoria),
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
    const enrichedNextFixture = nextFixture
      ? {
          ...nextFixture,
          uniforme_img: notificationService.getUniformImgForMatch(
            nextFixture,
            player.posicion_habitual
          ),
        }
      : null;

    const bloqueoConvocatoria = player.estado_cuenta === 'Moroso';

    return res.json({
      player: safePlayer,
      transactions,
      nextFixture: enrichedNextFixture,
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

exports.respondConvocation = async (req, res) => {
  const idJugador = Number(req.params.id);
  const idPartido = Number(req.params.idPartido);
  const { estado_convocatoria, observacion } = req.body;

  if (!['Confirmado', 'Descartado'].includes(estado_convocatoria)) {
    return res.status(400).json({
      error: 'Estado de respuesta inválido. Usa Confirmado o Descartado.',
    });
  }

  try {
    const player = await representantesModel.getPlayerById(idJugador);
    if (!player) return res.status(404).json({ error: 'Atleta no encontrado.' });
    if (
      (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') &&
      player.id_representante !== req.user.id_representante
    ) {
      return res.status(403).json({ error: 'No autorizado para confirmar asistencia de este atleta.' });
    }
    if (estado_convocatoria === 'Confirmado' && player.estado_cuenta === 'Moroso') {
      return res.status(403).json({
        error: 'Atleta con bloqueo administrativo por morosidad. Regulariza tus pagos para confirmar asistencia al partido.',
      });
    }

    const convocatoria = await representantesModel.updatePlayerConvocatoria({
      idPartido,
      idJugador,
      estadoConvocatoria: estado_convocatoria,
      observacion,
    });
    return res.json({
      message:
        estado_convocatoria === 'Confirmado'
          ? 'Asistencia al juego confirmada exitosamente.'
          : 'Se notificó inasistencia / descarte para este partido.',
      convocatoria,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
