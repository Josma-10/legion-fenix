const fisioModel = require('./fisio.model');
const representantesModel = require('../representantes/representantes.model');

exports.getDashboard = async (req, res) => {
  const { estado_recuperacion, id_jugador, modalidad } = req.query;
  try {
    const [injuries, players, stats] = await Promise.all([
      fisioModel.getClinicalInjuries({
        estadoRecuperacion: estado_recuperacion || null,
        idJugador: id_jugador || null,
        modalidad: modalidad || null,
      }),
      representantesModel.getPlayersList(),
      fisioModel.getClinicalStats(),
    ]);
    return res.json({ injuries, players, stats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createInjury = async (req, res) => {
  const { id_jugador, zona_anatomica, coord_x, coord_y, tipo_lesion, origen_reporte } = req.body;
  if (!id_jugador || !zona_anatomica || !tipo_lesion) {
    return res.status(400).json({
      error: 'Jugador, zona anatómica y tipo de lesión son obligatorios.',
    });
  }

  const isCoach = req.user?.rol === 'ENTRENADOR';
  const validOrigins = ['Partido', 'Entrenamiento', 'Clínica'];
  const resolvedOrigin = validOrigins.includes(origen_reporte)
    ? origen_reporte
    : isCoach
    ? 'Entrenamiento'
    : 'Clínica';

  try {
    const injury = await fisioModel.createClinicalInjury({
      ...req.body,
      coord_x: coord_x !== undefined ? coord_x : 50,
      coord_y: coord_y !== undefined ? coord_y : 50,
      origen_reporte: resolvedOrigin,
      reportado_por_id: req.user?.id || null,
      reportado_por_rol: req.user?.rol || 'FISIO',
      profesional_cargo:
        req.body.profesional_cargo ||
        (isCoach ? 'Pendiente evaluación Fisioterapeuta' : req.user?.nombre || 'Lic. Ricardo Vásquez'),
    });
    return res.status(201).json({
      message: isCoach
        ? 'Reporte de lesión enviado al departamento de Fisioterapia para su tratamiento.'
        : 'Lesión registrada en mapa anatómico.',
      injury,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateInjury = async (req, res) => {
  const idLesion = Number(req.params.id);
  const { estado_recuperacion, diagnostico, tratamiento, fecha_retorno_estimada } = req.body;
  try {
    const updated = await fisioModel.updateInjuryStatus(idLesion, {
      estado_recuperacion,
      diagnostico,
      tratamiento,
      fecha_retorno_estimada,
    });
    if (!updated) return res.status(404).json({ error: 'Registro clínico no encontrado.' });
    if (updated.discharged) {
      return res.json({
        message: `Alta Médica otorgada: historial clínico del atleta (#${updated.id_jugador}) depurado automáticamente para dejar solo pacientes en tratamiento.`,
        discharged: true,
        injury: updated,
      });
    }
    return res.json({ message: 'Evolución clínica actualizada.', injury: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  const idJugador = Number(req.params.idJugador);
  if (!Number.isInteger(idJugador) || idJugador <= 0) {
    return res.status(400).json({ error: 'ID de jugador inválido.' });
  }
  try {
    const updated = await fisioModel.updatePlayerMedicalRecord(idJugador, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Ficha médica no encontrada para este atleta.' });
    }
    return res.json({
      message: 'Evaluación médica y podológica actualizada.',
      ficha_medica: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
