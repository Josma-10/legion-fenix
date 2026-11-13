const pool = require('../../config/db');

const getClinicalInjuries = async ({
  estadoRecuperacion = null,
  idJugador = null,
  modalidad = null,
} = {}) => {
  const params = [];
  const conditions = [];

  if (estadoRecuperacion && estadoRecuperacion !== 'Todos') {
    params.push(estadoRecuperacion);
    conditions.push(`l.estado_recuperacion = $${params.length}`);
  }
  if (idJugador) {
    params.push(Number(idJugador));
    conditions.push(`l.id_jugador = $${params.length}`);
  }
  if (modalidad && modalidad !== 'Todas') {
    params.push(modalidad);
    conditions.push(`c.modalidad = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      l.*,
      j.nombre AS jugador_nombre,
      j.apellido AS jugador_apellido,
      j.dorsal,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.modalidad AS categoria_modalidad,
      fm.grupo_sanguineo,
      fm.evaluacion_podologica,
      fm.observaciones_fisio,
      fm.peso_kg,
      fm.altura_m,
      fm.alergias,
      u_rep.nombre AS reportado_por_nombre
    FROM lesiones_clinicas l
    JOIN jugadores j ON j.id_jugador = l.id_jugador
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    LEFT JOIN fichas_medicas fm ON fm.id_jugador = j.id_jugador
    LEFT JOIN usuarios u_rep ON u_rep.id_usuario = l.reportado_por_id
    ${whereClause}
    ORDER BY
      CASE l.estado_recuperacion
        WHEN 'En Tratamiento' THEN 1
        WHEN 'Readaptación' THEN 2
        ELSE 3
      END,
      l.fecha_lesion DESC,
      l.id_lesion DESC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const createClinicalInjury = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO lesiones_clinicas (
      id_jugador, zona_anatomica, coord_x, coord_y, tipo_lesion, gravedad,
      fecha_lesion, fecha_retorno_estimada, estado_recuperacion, diagnostico, tratamiento, profesional_cargo,
      origen_reporte, reportado_por_id, reportado_por_rol
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      Number(data.id_jugador),
      data.zona_anatomica,
      Number(data.coord_x ?? 50),
      Number(data.coord_y ?? 50),
      data.tipo_lesion,
      data.gravedad || 'Leve',
      data.fecha_lesion || new Date().toISOString().slice(0, 10),
      data.fecha_retorno_estimada || null,
      data.estado_recuperacion || 'En Tratamiento',
      data.diagnostico || '',
      data.tratamiento || '',
      data.profesional_cargo || 'Lic. Ricardo Vásquez',
      data.origen_reporte || 'Clínica',
      data.reportado_por_id || null,
      data.reportado_por_rol || 'FISIO',
    ]
  );
  return rows[0];
};

const updateInjuryStatus = async (
  idLesion,
  { estado_recuperacion, diagnostico, tratamiento, fecha_retorno_estimada }
) => {
  if (estado_recuperacion === 'Alta Médica') {
    const { rows: existingRows } = await pool.query(
      'SELECT id_lesion, id_jugador, zona_anatomica FROM lesiones_clinicas WHERE id_lesion = $1 LIMIT 1',
      [idLesion]
    );
    const existing = existingRows[0];
    if (!existing) return null;

    const { rowCount } = await pool.query(
      'DELETE FROM lesiones_clinicas WHERE id_jugador = $1',
      [existing.id_jugador]
    );
    return {
      discharged: true,
      id_lesion: existing.id_lesion,
      id_jugador: existing.id_jugador,
      zona_anatomica: existing.zona_anatomica,
      estado_recuperacion: 'Alta Médica',
      deletedCount: rowCount,
    };
  }

  const { rows } = await pool.query(
    `UPDATE lesiones_clinicas
     SET estado_recuperacion = COALESCE(NULLIF($1, ''), estado_recuperacion),
         diagnostico = COALESCE(NULLIF($2, ''), diagnostico),
         tratamiento = COALESCE(NULLIF($3, ''), tratamiento),
         fecha_retorno_estimada = COALESCE($4, fecha_retorno_estimada)
     WHERE id_lesion = $5
     RETURNING *`,
    [
      estado_recuperacion || '',
      diagnostico || '',
      tratamiento || '',
      fecha_retorno_estimada || null,
      idLesion,
    ]
  );
  return rows[0] || null;
};

const updatePlayerMedicalRecord = async (idJugador, data) => {
  const { rows } = await pool.query(
    `UPDATE fichas_medicas
     SET grupo_sanguineo = COALESCE(NULLIF($1, ''), grupo_sanguineo),
         evaluacion_podologica = COALESCE(NULLIF($2, ''), evaluacion_podologica),
         observaciones_fisio = COALESCE($3, observaciones_fisio),
         peso_kg = COALESCE($4::numeric, peso_kg),
         altura_m = COALESCE($5::numeric, altura_m),
         alergias = COALESCE(NULLIF($6, ''), alergias),
         condiciones_cardiacas = COALESCE(NULLIF($7, ''), condiciones_cardiacas),
         seguro_medico_poliza = COALESCE(NULLIF($8, ''), seguro_medico_poliza),
         fecha_ultima_revision = COALESCE($9::date, CURRENT_DATE)
     WHERE id_jugador = $10
     RETURNING *`,
    [
      data.grupo_sanguineo ? String(data.grupo_sanguineo).trim() : '',
      data.evaluacion_podologica ? String(data.evaluacion_podologica).trim() : '',
      data.observaciones_fisio !== undefined ? String(data.observaciones_fisio) : null,
      data.peso_kg !== undefined && data.peso_kg !== '' ? Number(data.peso_kg) : null,
      data.altura_m !== undefined && data.altura_m !== '' ? Number(data.altura_m) : null,
      data.alergias ? String(data.alergias).trim() : '',
      data.condiciones_cardiacas ? String(data.condiciones_cardiacas).trim() : '',
      data.seguro_medico_poliza ? String(data.seguro_medico_poliza).trim() : '',
      data.fecha_ultima_revision || null,
      idJugador,
    ]
  );
  return rows[0] || null;
};

const getClinicalStats = async () => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int AS total_registros,
      COUNT(*) FILTER (WHERE estado_recuperacion = 'En Tratamiento')::int AS en_tratamiento,
      COUNT(*) FILTER (WHERE estado_recuperacion = 'Readaptación')::int AS readaptacion,
      COUNT(*) FILTER (WHERE estado_recuperacion = 'Alta Médica')::int AS alta_medica
    FROM lesiones_clinicas
  `);
  return rows[0] || {
    total_registros: 0,
    en_tratamiento: 0,
    readaptacion: 0,
    alta_medica: 0,
  };
};

module.exports = {
  getClinicalInjuries,
  createClinicalInjury,
  updateInjuryStatus,
  updatePlayerMedicalRecord,
  getClinicalStats,
};
