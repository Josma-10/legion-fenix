const pool = require('../../config/db');

const getPlayersList = async ({ idRepresentante = null } = {}) => {
  const params = [];
  let whereClause = 'WHERE j.activo = TRUE';

  if (idRepresentante) {
    params.push(idRepresentante);
    whereClause += ` AND j.id_representante = $${params.length}`;
  }

  const query = `
    SELECT
      j.*,
      EXTRACT(YEAR FROM age(j.fecha_nacimiento))::int AS edad,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.modalidad AS categoria_modalidad,
      c.cuadrante_asignado,
      u_rep.nombre AS representante_nombre,
      u_rep.email AS representante_email,
      u_rep.telefono AS representante_telefono,
      rep.documento_identidad AS representante_dni,
      rep.parentesco,
      rep.direccion AS representante_direccion,
      rep.telefono_emergencia,
      fm.grupo_sanguineo,
      fm.alergias,
      fm.condiciones_cardiacas,
      fm.evaluacion_podologica,
      fm.observaciones_fisio,
      fm.peso_kg,
      fm.altura_m,
      fm.contacto_emergencia_nombre,
      fm.contacto_emergencia_telefono,
      fm.seguro_medico_poliza,
      fm.fecha_ultima_revision,
      unif.temporada,
      unif.talla_camiseta,
      unif.talla_short,
      unif.talla_zapatos,
      unif.kit_titular_color,
      unif.kit_alternativo_color,
      unif.entregado AS uniforme_entregado,
      cl.uso_imagen,
      cl.exoneracion_medica,
      cl.firma_representante,
      cl.fecha_firma,
      ev.id_evaluacion,
      ev.fecha_evaluacion,
      ev.fisica_velocidad,
      ev.fisica_resistencia,
      ev.fisica_fuerza,
      ev.tecnica_control,
      ev.tecnica_pase,
      ev.tecnica_definicion,
      ev.coordinativa_agilidad,
      ev.coordinativa_equilibrio,
      ev.coordinativa_ritmo,
      ev.score_fisica,
      ev.score_tecnica,
      ev.score_coordinativa,
      ev.nota_video,
      ev.puntaje_global,
      ev.porcentaje_global,
      ev.fortalezas,
      ev.debilidades,
      ev.observaciones AS observaciones_evaluacion,
      (les.id_lesion IS NOT NULL) AS lesionado,
      les.zona_anatomica AS lesion_zona,
      les.estado_recuperacion AS lesion_estado,
      (j.estado_cuenta <> 'Moroso' AND les.id_lesion IS NULL) AS puede_jugar
    FROM jugadores j
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    JOIN representantes rep ON rep.id_representante = j.id_representante
    JOIN usuarios u_rep ON u_rep.id_usuario = rep.id_usuario
    LEFT JOIN fichas_medicas fm ON fm.id_jugador = j.id_jugador
    LEFT JOIN uniformes_asignados unif ON unif.id_jugador = j.id_jugador
    LEFT JOIN consentimientos_legales cl ON cl.id_jugador = j.id_jugador
    LEFT JOIN LATERAL (
      SELECT *
      FROM evaluaciones_jugador e
      WHERE e.id_jugador = j.id_jugador
      ORDER BY e.fecha_evaluacion DESC, e.id_evaluacion DESC
      LIMIT 1
    ) ev ON TRUE
    LEFT JOIN LATERAL (
      SELECT l.id_lesion, l.zona_anatomica, l.estado_recuperacion
      FROM lesiones_clinicas l
      WHERE l.id_jugador = j.id_jugador
        AND l.estado_recuperacion IN ('En Tratamiento', 'Readaptación')
      ORDER BY l.fecha_lesion DESC, l.id_lesion DESC
      LIMIT 1
    ) les ON TRUE
    ${whereClause}
    ORDER BY j.id_jugador ASC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const getPlayerById = async (idJugador) => {
  const query = `
    SELECT
      j.*,
      EXTRACT(YEAR FROM age(j.fecha_nacimiento))::int AS edad,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.modalidad AS categoria_modalidad,
      c.cuadrante_asignado,
      rep.id_usuario AS representante_id_usuario,
      u_rep.nombre AS representante_nombre,
      u_rep.email AS representante_email,
      u_rep.telefono AS representante_telefono,
      rep.documento_identidad AS representante_dni,
      rep.parentesco,
      rep.direccion AS representante_direccion,
      rep.telefono_emergencia,
      fm.grupo_sanguineo,
      fm.alergias,
      fm.condiciones_cardiacas,
      fm.evaluacion_podologica,
      fm.observaciones_fisio,
      fm.peso_kg,
      fm.altura_m,
      fm.contacto_emergencia_nombre,
      fm.contacto_emergencia_telefono,
      fm.seguro_medico_poliza,
      fm.fecha_ultima_revision,
      unif.temporada,
      unif.talla_camiseta,
      unif.talla_short,
      unif.talla_zapatos,
      unif.kit_titular_color,
      unif.kit_alternativo_color,
      unif.entregado AS uniforme_entregado,
      cl.uso_imagen,
      cl.exoneracion_medica,
      cl.firma_representante,
      cl.fecha_firma,
      ev.id_evaluacion,
      ev.fecha_evaluacion,
      ev.fisica_velocidad,
      ev.fisica_resistencia,
      ev.fisica_fuerza,
      ev.tecnica_control,
      ev.tecnica_pase,
      ev.tecnica_definicion,
      ev.coordinativa_agilidad,
      ev.coordinativa_equilibrio,
      ev.coordinativa_ritmo,
      ev.score_fisica,
      ev.score_tecnica,
      ev.score_coordinativa,
      ev.nota_video,
      ev.video_url AS ultima_evaluacion_video_url,
      ev.puntaje_global,
      ev.porcentaje_global,
      ev.fortalezas,
      ev.debilidades,
      ev.observaciones AS observaciones_evaluacion,
      (les.id_lesion IS NOT NULL) AS lesionado,
      les.zona_anatomica AS lesion_zona,
      les.estado_recuperacion AS lesion_estado,
      (j.estado_cuenta <> 'Moroso' AND les.id_lesion IS NULL) AS puede_jugar
    FROM jugadores j
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    JOIN representantes rep ON rep.id_representante = j.id_representante
    JOIN usuarios u_rep ON u_rep.id_usuario = rep.id_usuario
    LEFT JOIN fichas_medicas fm ON fm.id_jugador = j.id_jugador
    LEFT JOIN uniformes_asignados unif ON unif.id_jugador = j.id_jugador
    LEFT JOIN consentimientos_legales cl ON cl.id_jugador = j.id_jugador
    LEFT JOIN LATERAL (
      SELECT *
      FROM evaluaciones_jugador e
      WHERE e.id_jugador = j.id_jugador
      ORDER BY e.fecha_evaluacion DESC, e.id_evaluacion DESC
      LIMIT 1
    ) ev ON TRUE
    LEFT JOIN LATERAL (
      SELECT l.id_lesion, l.zona_anatomica, l.estado_recuperacion
      FROM lesiones_clinicas l
      WHERE l.id_jugador = j.id_jugador
        AND l.estado_recuperacion IN ('En Tratamiento', 'Readaptación')
      ORDER BY l.fecha_lesion DESC, l.id_lesion DESC
      LIMIT 1
    ) les ON TRUE
    WHERE j.id_jugador = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [idJugador]);
  return rows[0] || null;
};

const getNextFixtureAndLogisticsForPlayer = async (idJugador, idCategoria) => {
  const matchQuery = `
    SELECT
      p.*,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      conv.estado_convocatoria,
      conv.observacion AS convocatoria_observacion
    FROM partidos_fixture p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN convocatorias conv ON conv.id_partido = p.id_partido AND conv.id_jugador = $1
    WHERE p.estado = 'Programado'
      AND ($2::int IS NULL OR p.id_categoria = $2)
    ORDER BY p.fecha_hora ASC
    LIMIT 1
  `;
  const { rows } = await pool.query(matchQuery, [idJugador, idCategoria || null]);
  if (rows.length > 0) return rows[0];

  const fallback = await pool.query(
    `SELECT
       p.*,
       c.nombre AS categoria_nombre,
       c.disciplina AS categoria_disciplina,
       conv.estado_convocatoria,
       conv.observacion AS convocatoria_observacion
     FROM partidos_fixture p
     LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
     LEFT JOIN convocatorias conv ON conv.id_partido = p.id_partido AND conv.id_jugador = $1
     WHERE p.estado = 'Programado'
     ORDER BY p.fecha_hora ASC
     LIMIT 1`,
    [idJugador]
  );
  return fallback.rows[0] || null;
};

const getUpcomingMatchesForPlayer = async (idJugador, idCategoria) => {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       c.nombre AS categoria_nombre,
       c.disciplina AS categoria_disciplina,
       conv.estado_convocatoria,
       conv.observacion AS convocatoria_observacion
     FROM partidos_fixture p
     LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
     LEFT JOIN convocatorias conv ON conv.id_partido = p.id_partido AND conv.id_jugador = $1
     WHERE p.estado = 'Programado'
       AND ($2::int IS NULL OR p.id_categoria = $2 OR conv.id_convocatoria IS NOT NULL)
     ORDER BY p.fecha_hora ASC
     LIMIT 8`,
    [idJugador, idCategoria || null]
  );
  if (rows.length > 0) return rows;

  const fallback = await pool.query(
    `SELECT
       p.*,
       c.nombre AS categoria_nombre,
       c.disciplina AS categoria_disciplina,
       conv.estado_convocatoria,
       conv.observacion AS convocatoria_observacion
     FROM partidos_fixture p
     LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
     LEFT JOIN convocatorias conv ON conv.id_partido = p.id_partido AND conv.id_jugador = $1
     WHERE p.estado = 'Programado'
     ORDER BY p.fecha_hora ASC
     LIMIT 5`,
    [idJugador]
  );
  return fallback.rows;
};

const getPlayerStats = async (idJugador) => {
  const { rows } = await pool.query(
    `SELECT * FROM estadisticas_partidos WHERE id_jugador = $1 ORDER BY fecha_partido DESC`,
    [idJugador]
  );
  return rows;
};

const getEvalHistoryForPlayer = async (idJugador) => {
  const { rows } = await pool.query(
    `SELECT ev.*, u.nombre AS evaluador_nombre
     FROM evaluaciones_jugador ev
     LEFT JOIN usuarios u ON u.id_usuario = ev.id_evaluador
     WHERE ev.id_jugador = $1
     ORDER BY ev.fecha_evaluacion DESC, ev.id_evaluacion DESC
     LIMIT 10`,
    [idJugador]
  );
  return rows;
};

const getAssignedDrillsForPlayer = async (idJugador, idCategoria) => {
  const { rows } = await pool.query(
    `SELECT
       t.*,
       u.nombre AS autor_nombre,
       c.nombre AS categoria_nombre,
       ce.estado AS estado_asistencia_jugador,
       ce.observacion AS observacion_asistencia,
       ce.actualizado_en AS asistencia_actualizada_en
     FROM trabajos_campo t
     LEFT JOIN usuarios u ON u.id_usuario = t.id_autor
     LEFT JOIN categorias c ON c.id_categoria = t.id_categoria
     LEFT JOIN confirmaciones_entrenamiento ce
       ON ce.id_trabajo = t.id_trabajo AND ce.id_jugador = $1
     WHERE (t.id_jugador = $1 OR (t.id_jugador IS NULL AND t.id_categoria = $2))
       AND t.fecha >= CURRENT_DATE - INTERVAL '2 days'
     ORDER BY t.fecha ASC, t.hora_inicio ASC
     LIMIT 12`,
    [idJugador, idCategoria || null]
  );
  return rows;
};

const checkDorsalAvailability = async (idCategoria, dorsal) => {
  const { rows } = await pool.query(
    `SELECT id_jugador, nombre, apellido FROM jugadores
     WHERE id_categoria = $1 AND dorsal = $2 AND activo = TRUE`,
    [idCategoria, dorsal]
  );
  return {
    available: rows.length === 0,
    takenBy: rows[0] || null,
  };
};

const registerCompleteAthlete = async ({
  idUsuario,
  idRepresentante,
  representanteData,
  jugadorData,
  fichaMedicaData,
  uniformeData,
  consentimientoData,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalRepId = idRepresentante;

    if (finalRepId) {
      await client.query(
        `UPDATE representantes
         SET documento_identidad = COALESCE(NULLIF($1, ''), documento_identidad),
             parentesco = COALESCE(NULLIF($2, ''), parentesco),
             direccion = COALESCE(NULLIF($3, ''), direccion),
             telefono_emergencia = COALESCE(NULLIF($4, ''), telefono_emergencia)
         WHERE id_representante = $5`,
        [
          representanteData.documento_identidad,
          representanteData.parentesco,
          representanteData.direccion,
          representanteData.telefono_emergencia,
          finalRepId,
        ]
      );
      if (representanteData.telefono) {
        await client.query(
          `UPDATE usuarios SET telefono = $1 WHERE id_usuario = (SELECT id_usuario FROM representantes WHERE id_representante = $2)`,
          [representanteData.telefono, finalRepId]
        );
      }
    } else if (idUsuario) {
      const existingRep = await client.query(
        'SELECT id_representante FROM representantes WHERE id_usuario = $1',
        [idUsuario]
      );
      if (existingRep.rows.length > 0) {
        finalRepId = existingRep.rows[0].id_representante;
      } else {
        const repRes = await client.query(
          `INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id_representante`,
          [
            idUsuario,
            representanteData.documento_identidad || `REP-${Date.now()}`,
            representanteData.parentesco || 'Representante',
            representanteData.direccion || 'Por definir',
            representanteData.telefono_emergencia || representanteData.telefono || '',
          ]
        );
        finalRepId = repRes.rows[0].id_representante;
      }
    }

    if (!finalRepId) {
      throw new Error('No se pudo determinar el representante asociado al atleta.');
    }

    const jugadorRes = await client.query(
      `INSERT INTO jugadores (
        id_representante, id_categoria, nombre, apellido, fecha_nacimiento,
        dni_cedula, genero, foto_url, posicion_habitual, pierna_habil, dorsal, estado_cuenta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pendiente')
      RETURNING *`,
      [
        finalRepId,
        Number(jugadorData.id_categoria),
        jugadorData.nombre,
        jugadorData.apellido,
        jugadorData.fecha_nacimiento,
        jugadorData.dni_cedula,
        jugadorData.genero,
        jugadorData.foto_url || '/assets/avatar-player.svg',
        jugadorData.posicion_habitual || 'Polivalente',
        jugadorData.pierna_habil || 'Derecha',
        jugadorData.dorsal ? Number(jugadorData.dorsal) : null,
      ]
    );
    const jugador = jugadorRes.rows[0];

    await client.query(
      `INSERT INTO fichas_medicas (
        id_jugador, grupo_sanguineo, alergias, condiciones_cardiacas,
        evaluacion_podologica, peso_kg, altura_m,
        contacto_emergencia_nombre, contacto_emergencia_telefono, seguro_medico_poliza, fecha_ultima_revision
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        jugador.id_jugador,
        fichaMedicaData.grupo_sanguineo || 'O+',
        fichaMedicaData.alergias || 'Ninguna',
        fichaMedicaData.condiciones_cardiacas || 'Sin alteraciones',
        fichaMedicaData.evaluacion_podologica || 'Pisada Neutra',
        fichaMedicaData.peso_kg ? Number(fichaMedicaData.peso_kg) : null,
        fichaMedicaData.altura_m ? Number(fichaMedicaData.altura_m) : null,
        fichaMedicaData.contacto_emergencia_nombre,
        fichaMedicaData.contacto_emergencia_telefono,
        fichaMedicaData.seguro_medico_poliza || 'Póliza Estudiantil / Club',
        fichaMedicaData.fecha_ultima_revision || new Date().toISOString().slice(0, 10),
      ]
    );

    await client.query(
      `INSERT INTO uniformes_asignados (
        id_jugador, temporada, talla_camiseta, talla_short, talla_zapatos,
        kit_titular_color, kit_alternativo_color, entregado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
      [
        jugador.id_jugador,
        uniformeData.temporada || '2026-2027',
        uniformeData.talla_camiseta || 'M',
        uniformeData.talla_short || 'M',
        uniformeData.talla_zapatos ? String(uniformeData.talla_zapatos).trim() : null,
        'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto',
        'Rojo y Blanco',
      ]
    );

    await client.query(
      `INSERT INTO consentimientos_legales (
        id_jugador, id_representante, uso_imagen, exoneracion_medica, firma_representante
      )
      VALUES ($1, $2, $3, $4, $5)`,
      [
        jugador.id_jugador,
        finalRepId,
        Boolean(consentimientoData.uso_imagen),
        Boolean(consentimientoData.exoneracion_medica),
        consentimientoData.firma_representante,
      ]
    );

    await client.query(
      `INSERT INTO transacciones_jugador (
        id_jugador, id_representante, concepto, descripcion_detalle, monto,
        fecha_emision, fecha_vencimiento, estado_pago
      )
      VALUES ($1, $2, 'Inscripcion', 'Inscripción Oficial Temporada 2026-2027', 15.00,
              CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'Pendiente')`,
      [jugador.id_jugador, finalRepId]
    );

    await client.query('COMMIT');
    return jugador;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getNotificationsForRepresentante = async (idRepresentante, idUsuario = null) => {
  const { rows } = await pool.query(
    `SELECT
       n.*,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       j.dorsal AS jugador_dorsal,
       j.posicion_habitual AS jugador_posicion,
       p.rival AS partido_rival,
       p.fecha_hora AS partido_fecha_hora,
       p.sede AS partido_sede,
       p.gps_url AS partido_gps,
       p.es_local AS partido_es_local,
       p.kit_designado AS partido_kit_designado,
       conv.estado_convocatoria AS convocatoria_actual,
       t.concepto AS tx_concepto,
       t.monto AS tx_monto,
       t.fecha_vencimiento AS tx_fecha_vencimiento,
       t.estado_pago AS tx_estado_pago,
       t.comprobante_estado AS tx_comprobante_estado
     FROM notificaciones n
     LEFT JOIN jugadores j ON j.id_jugador = n.id_jugador
     LEFT JOIN partidos_fixture p
       ON n.referencia_tipo = 'partido' AND p.id_partido = n.referencia_id
     LEFT JOIN convocatorias conv
       ON conv.id_partido = p.id_partido AND conv.id_jugador = n.id_jugador
     LEFT JOIN transacciones_jugador t
       ON n.referencia_tipo = 'transaccion' AND t.id_transaccion = n.referencia_id
     WHERE (n.id_representante = $1 OR ($2::int IS NOT NULL AND n.id_usuario = $2))
     ORDER BY n.leida ASC, n.creado_en DESC, n.id_notificacion DESC`,
    [idRepresentante, idUsuario]
  );
  return rows;
};

const markNotificationRead = async (idNotificacion, idRepresentante, idUsuario = null) => {
  const { rows } = await pool.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE id_notificacion = $1
       AND (id_representante = $2 OR ($3::int IS NOT NULL AND id_usuario = $3))
     RETURNING *`,
    [Number(idNotificacion), idRepresentante, idUsuario]
  );
  return rows[0] || null;
};

const updatePlayerConvocatoria = async ({
  idPartido,
  idJugador,
  estadoConvocatoria,
  observacion = '',
  idUsuario = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO convocatorias (id_partido, id_jugador, estado_convocatoria, observacion)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_partido, id_jugador) DO UPDATE
     SET estado_convocatoria = EXCLUDED.estado_convocatoria,
         observacion = COALESCE(NULLIF(EXCLUDED.observacion, ''), convocatorias.observacion)
     RETURNING *`,
    [Number(idPartido), Number(idJugador), estadoConvocatoria, observacion || '']
  );

  // Sincronizar aviso con tabla asistencias (tipo_sesion = 'Juego') para visibilidad de entrenadores/admin
  try {
    const matchRes = await pool.query(
      `SELECT p.fecha_hora::date AS fecha, p.id_categoria, COALESCE(c.cuadrante_asignado, 'Cuadrante Norte - Campo') AS cuadrante
       FROM partidos_fixture p
       LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE p.id_partido = $1 LIMIT 1`,
      [Number(idPartido)]
    );
    if (matchRes.rows.length > 0) {
      const m = matchRes.rows[0];
      const estadoAsist = estadoConvocatoria === 'Confirmado' ? 'Presente' : 'Justificado';
      const nota =
        estadoConvocatoria === 'Confirmado'
          ? `Asistencia confirmada por atleta/representante${observacion ? `: ${observacion}` : ''}`
          : `No puede asistir al juego${observacion ? `: ${observacion}` : ''}`;
      await pool.query(
        `INSERT INTO asistencias (id_jugador, id_categoria, fecha, tipo_sesion, cuadrante, estado, observaciones, registrado_por)
         VALUES ($1, $2, $3, 'Juego', $4, $5, $6, $7)
         ON CONFLICT (id_jugador, fecha, tipo_sesion) DO UPDATE
         SET estado = EXCLUDED.estado,
             observaciones = EXCLUDED.observaciones`,
        [Number(idJugador), m.id_categoria, m.fecha, m.cuadrante, estadoAsist, nota, idUsuario]
      );
    }
  } catch {
    // No bloquear respuesta si falla la sincronización auxiliar
  }

  return rows[0] || null;
};

const upsertTrainingConfirmation = async ({
  idTrabajo,
  idJugador,
  estado, // 'Confirmado' | 'No_Asiste'
  observacion = '',
  idUsuario = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO confirmaciones_entrenamiento (id_trabajo, id_jugador, estado, observacion, actualizado_en)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (id_trabajo, id_jugador) DO UPDATE
     SET estado = EXCLUDED.estado,
         observacion = EXCLUDED.observacion,
         actualizado_en = CURRENT_TIMESTAMP
     RETURNING *`,
    [Number(idTrabajo), Number(idJugador), estado, observacion || '']
  );

  // Sincronizar con tabla asistencias (tipo_sesion = 'Entrenamiento')
  try {
    const drillRes = await pool.query(
      `SELECT fecha, id_categoria, cuadrante, titulo FROM trabajos_campo WHERE id_trabajo = $1 LIMIT 1`,
      [Number(idTrabajo)]
    );
    if (drillRes.rows.length > 0) {
      const d = drillRes.rows[0];
      const estadoAsist = estado === 'Confirmado' ? 'Presente' : 'Justificado';
      const nota =
        estado === 'Confirmado'
          ? `Confirmó asistencia a entrenamiento (${d.titulo})${observacion ? `: ${observacion}` : ''}`
          : `No puede asistir a entrenamiento (${d.titulo})${observacion ? `: ${observacion}` : ''}`;
      await pool.query(
        `INSERT INTO asistencias (id_jugador, id_categoria, fecha, tipo_sesion, cuadrante, estado, observaciones, registrado_por)
         VALUES ($1, $2, $3, 'Entrenamiento', $4, $5, $6, $7)
         ON CONFLICT (id_jugador, fecha, tipo_sesion) DO UPDATE
         SET estado = EXCLUDED.estado,
             observaciones = EXCLUDED.observaciones`,
        [Number(idJugador), d.id_categoria, d.fecha, d.cuadrante || 'Cuadrante Norte - Campo', estadoAsist, nota, idUsuario]
      );
    }
  } catch {
    // No bloquear confirmación si falla la sincronización auxiliar
  }

  return rows[0] || null;
};

const updatePlayerSizes = async (idJugador, { talla_camiseta, talla_short, talla_zapatos }) => {
  const existing = await pool.query(
    `SELECT id_asignacion FROM uniformes_asignados WHERE id_jugador = $1 ORDER BY id_asignacion DESC LIMIT 1`,
    [Number(idJugador)]
  );

  if (existing.rows.length > 0) {
    const { rows } = await pool.query(
      `UPDATE uniformes_asignados
       SET talla_camiseta = COALESCE(NULLIF($1, ''), talla_camiseta),
           talla_short = COALESCE(NULLIF($2, ''), talla_short),
           talla_zapatos = COALESCE(NULLIF($3, ''), talla_zapatos)
       WHERE id_asignacion = $4
       RETURNING *`,
      [
        talla_camiseta ? String(talla_camiseta).trim() : '',
        talla_short ? String(talla_short).trim() : '',
        talla_zapatos ? String(talla_zapatos).trim() : '',
        existing.rows[0].id_asignacion,
      ]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO uniformes_asignados (
       id_jugador, temporada, talla_camiseta, talla_short, talla_zapatos,
       kit_titular_color, kit_alternativo_color, entregado
     )
     VALUES ($1, '2026-2027', $2, $3, $4, 'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto', 'Rojo y Blanco', FALSE)
     RETURNING *`,
    [
      Number(idJugador),
      talla_camiseta ? String(talla_camiseta).trim() : 'M',
      talla_short ? String(talla_short).trim() : 'M',
      talla_zapatos ? String(talla_zapatos).trim() : null,
    ]
  );
  return rows[0];
};

const updatePlayerDocument = async (idJugador, dniCedula) => {
  const { rows } = await pool.query(
    `UPDATE jugadores SET dni_cedula = $1 WHERE id_jugador = $2 RETURNING *`,
    [String(dniCedula).trim(), Number(idJugador)]
  );
  return rows[0];
};

module.exports = {
  getPlayersList,
  getPlayerById,
  getNextFixtureAndLogisticsForPlayer,
  getUpcomingMatchesForPlayer,
  getPlayerStats,
  getEvalHistoryForPlayer,
  getAssignedDrillsForPlayer,
  checkDorsalAvailability,
  registerCompleteAthlete,
  getNotificationsForRepresentante,
  markNotificationRead,
  updatePlayerConvocatoria,
  upsertTrainingConfirmation,
  updatePlayerSizes,
  updatePlayerDocument,
};
