const pool = require('../../config/db');

// ==============================================================================
// TABLA DE JUEGO / SIMULADOR TÁCTICO 2D (MÁX 10 FORMACIONES POR CATEGORÍA)
// ==============================================================================
const getTacticas = async (idCategoria = null, modalidad = null) => {
  const params = [];
  const conditions = [];

  if (idCategoria) {
    params.push(Number(idCategoria));
    conditions.push(`t.id_categoria = $${params.length}`);
  }
  if (modalidad && modalidad !== 'Todas') {
    params.push(modalidad);
    conditions.push(`t.modalidad = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT
       t.*,
       c.nombre AS categoria_nombre,
       c.disciplina AS categoria_disciplina,
       tr.titulo AS trabajo_titulo,
       tr.fecha AS trabajo_fecha,
       tr.hora_inicio AS trabajo_hora_inicio,
       tr.cuadrante AS trabajo_cuadrante,
       tr.espacio_cancha AS trabajo_espacio
     FROM tacticas_simulador t
     LEFT JOIN categorias c ON c.id_categoria = t.id_categoria
     LEFT JOIN trabajos_campo tr ON tr.id_trabajo = t.id_trabajo
     ${where}
     ORDER BY t.id_tactica ASC`,
    params
  );
  return rows;
};

const countTacticasByCategory = async (idCategoria) => {
  if (!idCategoria) return 0;
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS total FROM tacticas_simulador WHERE id_categoria = $1',
    [Number(idCategoria)]
  );
  return rows[0]?.total || 0;
};

const syncTrabajoBoardAnimation = async (idTrabajo, formacionJson, movimientosJson) => {
  if (!idTrabajo) return;
  const payload = {
    pasos: Array.isArray(movimientosJson?.pasos) ? movimientosJson.pasos : [],
    formacion: formacionJson || null,
    actualizado: new Date().toISOString(),
  };
  await pool.query(
    'UPDATE trabajos_campo SET animacion_3d_json = $1::jsonb WHERE id_trabajo = $2',
    [JSON.stringify(payload), Number(idTrabajo)]
  );
};

const createTactica = async ({
  id_categoria,
  id_trabajo = null,
  nombre_sistema,
  modalidad,
  pros,
  contras,
  descripcion,
  formacion_json,
  movimientos_json,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO tacticas_simulador (
      id_categoria, id_trabajo, nombre_sistema, modalidad, pros, contras, descripcion, formacion_json, movimientos_json
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id_categoria ? Number(id_categoria) : null,
      id_trabajo ? Number(id_trabajo) : null,
      nombre_sistema,
      modalidad,
      pros,
      contras,
      descripcion || '',
      JSON.stringify(formacion_json || { jugadores: [] }),
      movimientos_json ? JSON.stringify(movimientos_json) : null,
    ]
  );
  const created = rows[0];
  if (created?.id_trabajo) {
    await syncTrabajoBoardAnimation(created.id_trabajo, formacion_json, movimientos_json).catch(() => {});
  }
  return created;
};

const updateTactica = async (idTactica, data) => {
  const { rows } = await pool.query(
    `UPDATE tacticas_simulador
     SET id_trabajo = CASE WHEN $8::boolean THEN $9::int ELSE id_trabajo END,
         nombre_sistema = COALESCE(NULLIF($1, ''), nombre_sistema),
         modalidad = COALESCE(NULLIF($2, ''), modalidad),
         pros = COALESCE(NULLIF($3, ''), pros),
         contras = COALESCE(NULLIF($4, ''), contras),
         descripcion = COALESCE($5, descripcion),
         formacion_json = COALESCE($6::jsonb, formacion_json),
         movimientos_json = COALESCE($7::jsonb, movimientos_json)
     WHERE id_tactica = $10
     RETURNING *`,
    [
      data.nombre_sistema || '',
      data.modalidad || '',
      data.pros || '',
      data.contras || '',
      data.descripcion !== undefined ? data.descripcion : null,
      data.formacion_json ? JSON.stringify(data.formacion_json) : null,
      data.movimientos_json ? JSON.stringify(data.movimientos_json) : null,
      data.id_trabajo !== undefined,
      data.id_trabajo ? Number(data.id_trabajo) : null,
      idTactica,
    ]
  );
  const updated = rows[0] || null;
  if (updated?.id_trabajo) {
    await syncTrabajoBoardAnimation(
      updated.id_trabajo,
      updated.formacion_json,
      updated.movimientos_json
    ).catch(() => {});
  }
  return updated;
};

const deleteTactica = async (idTactica) => {
  const { rowCount } = await pool.query('DELETE FROM tacticas_simulador WHERE id_tactica = $1', [
    idTactica,
  ]);
  return rowCount > 0;
};

// ==============================================================================
// MICROCICLOS DE ENTRENAMIENTO (3 BLOQUES)
// ==============================================================================
const getMicrociclos = async (idCategoria = null) => {
  const params = [];
  let where = '';
  if (idCategoria) {
    params.push(idCategoria);
    where = 'WHERE m.id_categoria = $1';
  }
  const query = `
    SELECT
      m.*,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.modalidad AS categoria_modalidad,
      u.nombre AS entrenador_nombre
    FROM microciclos_entrenamiento m
    LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
    LEFT JOIN usuarios u ON u.id_usuario = m.id_entrenador
    ${where}
    ORDER BY m.semana_inicio DESC, m.id_microciclo DESC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const createMicrociclo = async ({
  id_entrenador,
  id_categoria,
  titulo,
  semana_inicio,
  semana_fin,
  objetivo_principal,
  bloque_arqueros,
  bloque_defensivo,
  bloque_ofensivo,
  carga_estimada,
  estado = 'Planificado',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO microciclos_entrenamiento (
      id_entrenador, id_categoria, titulo, semana_inicio, semana_fin,
      objetivo_principal, bloque_arqueros, bloque_defensivo, bloque_ofensivo,
      carga_estimada, estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id_entrenador,
      id_categoria ? Number(id_categoria) : null,
      titulo,
      semana_inicio,
      semana_fin,
      objetivo_principal,
      bloque_arqueros,
      bloque_defensivo,
      bloque_ofensivo,
      carga_estimada || 'Media-Alta',
      estado,
    ]
  );
  return rows[0];
};

const updateMicrocicloEstado = async (idMicrociclo, estado) => {
  const { rows } = await pool.query(
    'UPDATE microciclos_entrenamiento SET estado = $1 WHERE id_microciclo = $2 RETURNING *',
    [estado, idMicrociclo]
  );
  return rows[0] || null;
};

const deleteMicrociclo = async (idMicrociclo) => {
  const { rowCount } = await pool.query(
    'DELETE FROM microciclos_entrenamiento WHERE id_microciclo = $1',
    [idMicrociclo]
  );
  return rowCount > 0;
};

// ==============================================================================
// TRABAJOS DE CAMPO 3D Y AGENDA COMPARTIDA DE CANCHAS (COACH & FISIO)
// ==============================================================================
const SPACE_CONFLICT_MAP = {
  'Cancha Completa': [
    'Cancha Completa',
    'Media Cancha Norte',
    'Media Cancha Sur',
    'Tercio Central',
    'Zona Readaptación',
  ],
  'Media Cancha Norte': ['Cancha Completa', 'Media Cancha Norte', 'Tercio Central'],
  'Media Cancha Sur': ['Cancha Completa', 'Media Cancha Sur', 'Tercio Central'],
  'Tercio Central': ['Cancha Completa', 'Media Cancha Norte', 'Media Cancha Sur', 'Tercio Central'],
  'Zona Readaptación': ['Cancha Completa', 'Zona Readaptación'],
};

const spacesConflict = (spaceA, spaceB) => {
  const conflictsA = SPACE_CONFLICT_MAP[spaceA] || [spaceA];
  return conflictsA.includes(spaceB);
};

const getTrabajosCampo = async ({ fecha = null, cuadrante = null, idCategoria = null, rolAutor = null } = {}) => {
  const params = [];
  const conditions = [];

  if (fecha) {
    params.push(fecha);
    conditions.push(`t.fecha = $${params.length}`);
  }
  if (cuadrante && cuadrante !== 'Todos') {
    params.push(cuadrante);
    conditions.push(`t.cuadrante = $${params.length}`);
  }
  if (idCategoria) {
    params.push(Number(idCategoria));
    conditions.push(`t.id_categoria = $${params.length}`);
  }
  if (rolAutor && rolAutor !== 'Todos') {
    params.push(rolAutor);
    conditions.push(`t.rol_autor = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT
       t.*,
       u.nombre AS autor_nombre,
       c.nombre AS categoria_nombre,
       c.modalidad AS categoria_modalidad,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       j.dorsal AS jugador_dorsal
     FROM trabajos_campo t
     LEFT JOIN usuarios u ON u.id_usuario = t.id_autor
     LEFT JOIN categorias c ON c.id_categoria = t.id_categoria
     LEFT JOIN jugadores j ON j.id_jugador = t.id_jugador
     ${where}
     ORDER BY t.fecha ASC, t.hora_inicio ASC, t.id_trabajo DESC`,
    params
  );
  return rows;
};

const getTrabajoById = async (idTrabajo) => {
  const { rows } = await pool.query('SELECT * FROM trabajos_campo WHERE id_trabajo = $1 LIMIT 1', [
    idTrabajo,
  ]);
  return rows[0] || null;
};

const findConflictingTrabajo = async ({
  fecha,
  cuadrante,
  hora_inicio,
  hora_fin,
  espacio_cancha,
  excludeId = null,
}) => {
  const params = [fecha, cuadrante, hora_fin, hora_inicio];
  let excludeClause = '';
  if (excludeId) {
    params.push(Number(excludeId));
    excludeClause = `AND t.id_trabajo <> $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       t.*,
       c.nombre AS categoria_nombre,
       u.nombre AS autor_nombre
     FROM trabajos_campo t
     LEFT JOIN categorias c ON c.id_categoria = t.id_categoria
     LEFT JOIN usuarios u ON u.id_usuario = t.id_autor
     WHERE t.fecha = $1
       AND t.cuadrante = $2
       AND t.hora_inicio < $3::time
       AND t.hora_fin > $4::time
       ${excludeClause}`,
    params
  );

  return rows.find((row) => spacesConflict(row.espacio_cancha, espacio_cancha)) || null;
};

const createTrabajoCampo = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO trabajos_campo (
      id_autor, rol_autor, id_categoria, id_jugador, titulo, bloque, descripcion_escrita,
      duracion_minutos, fecha, hora_inicio, hora_fin, cuadrante, espacio_cancha, animacion_3d_json
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      data.id_autor,
      data.rol_autor,
      data.id_categoria ? Number(data.id_categoria) : null,
      data.id_jugador ? Number(data.id_jugador) : null,
      data.titulo,
      data.bloque || 'Táctico / Técnico',
      data.descripcion_escrita,
      Number(data.duracion_minutos || 25),
      data.fecha,
      data.hora_inicio,
      data.hora_fin,
      data.cuadrante,
      data.espacio_cancha,
      JSON.stringify(data.animacion_3d_json || { actores: [], balon: [] }),
    ]
  );
  return rows[0];
};

const updateTrabajoCampo = async (idTrabajo, data) => {
  const { rows } = await pool.query(
    `UPDATE trabajos_campo
     SET id_categoria = $1,
         id_jugador = $2,
         titulo = $3,
         bloque = $4,
         descripcion_escrita = $5,
         duracion_minutos = $6,
         fecha = $7,
         hora_inicio = $8,
         hora_fin = $9,
         cuadrante = $10,
         espacio_cancha = $11,
         animacion_3d_json = $12::jsonb
     WHERE id_trabajo = $13
     RETURNING *`,
    [
      data.id_categoria ? Number(data.id_categoria) : null,
      data.id_jugador ? Number(data.id_jugador) : null,
      data.titulo,
      data.bloque || 'Táctico / Técnico',
      data.descripcion_escrita,
      Number(data.duracion_minutos || 25),
      data.fecha,
      data.hora_inicio,
      data.hora_fin,
      data.cuadrante,
      data.espacio_cancha,
      JSON.stringify(data.animacion_3d_json || { actores: [], balon: [] }),
      idTrabajo,
    ]
  );
  return rows[0] || null;
};

const deleteTrabajoCampo = async (idTrabajo) => {
  const { rowCount } = await pool.query('DELETE FROM trabajos_campo WHERE id_trabajo = $1', [
    idTrabajo,
  ]);
  return rowCount > 0;
};

// ==============================================================================
// EVALUACIONES DEL JUGADOR (FÍSICA, TÉCNICA CON BALÓN, COORDINATIVA Y VIDEO)
// ==============================================================================
const getEvaluaciones = async ({ idCategoria = null, idJugador = null } = {}) => {
  const params = [];
  const conditions = [];

  if (idCategoria) {
    params.push(Number(idCategoria));
    conditions.push(`j.id_categoria = $${params.length}`);
  }
  if (idJugador) {
    params.push(Number(idJugador));
    conditions.push(`ev.id_jugador = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT
       ev.*,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       j.dorsal,
       j.posicion_habitual,
       j.pierna_habil,
       j.foto_url,
       c.id_categoria,
       c.nombre AS categoria_nombre,
       c.modalidad AS categoria_modalidad,
       u.nombre AS evaluador_nombre
     FROM evaluaciones_jugador ev
     JOIN jugadores j ON j.id_jugador = ev.id_jugador
     LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
     LEFT JOIN usuarios u ON u.id_usuario = ev.id_evaluador
     ${where}
     ORDER BY ev.fecha_evaluacion DESC, ev.id_evaluacion DESC`,
    params
  );
  return rows;
};

const createEvaluacion = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO evaluaciones_jugador (
      id_jugador, id_evaluador, fecha_evaluacion,
      fisica_velocidad, fisica_resistencia, fisica_fuerza,
      tecnica_control, tecnica_pase, tecnica_definicion,
      coordinativa_agilidad, coordinativa_equilibrio, coordinativa_ritmo,
      score_fisica, score_tecnica, score_coordinativa,
      ejercicio_video, video_url, nota_video, analisis_video_json,
      puntaje_global, porcentaje_global, fortalezas, debilidades, observaciones
    )
    VALUES (
      $1, $2, COALESCE($3::date, CURRENT_DATE),
      $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19::jsonb,
      $20, $21, $22, $23, $24
    )
    RETURNING *`,
    [
      Number(data.id_jugador),
      data.id_evaluador,
      data.fecha_evaluacion || null,
      data.fisica_velocidad,
      data.fisica_resistencia,
      data.fisica_fuerza,
      data.tecnica_control,
      data.tecnica_pase,
      data.tecnica_definicion,
      data.coordinativa_agilidad,
      data.coordinativa_equilibrio,
      data.coordinativa_ritmo,
      data.score_fisica,
      data.score_tecnica,
      data.score_coordinativa,
      data.ejercicio_video || null,
      data.video_url || null,
      data.nota_video !== undefined && data.nota_video !== null ? Number(data.nota_video) : null,
      data.analisis_video_json ? JSON.stringify(data.analisis_video_json) : null,
      data.puntaje_global,
      data.porcentaje_global,
      data.fortalezas || '',
      data.debilidades || '',
      data.observaciones || '',
    ]
  );
  return rows[0];
};

// ==============================================================================
// VIDEOTECA Y FIXTURES
// ==============================================================================
const getVideos = async (idCategoria = null) => {
  const params = [];
  let where = '';
  if (idCategoria) {
    params.push(idCategoria);
    where = 'WHERE v.id_categoria = $1';
  }
  const { rows } = await pool.query(
    `SELECT v.*, c.nombre AS categoria_nombre, c.disciplina AS categoria_disciplina, u.nombre AS entrenador_nombre
     FROM videos_analisis v
     LEFT JOIN categorias c ON c.id_categoria = v.id_categoria
     LEFT JOIN usuarios u ON u.id_usuario = v.id_entrenador
     ${where}
     ORDER BY v.creado_en DESC`,
    params
  );
  return rows;
};

const createVideo = async ({
  id_entrenador,
  id_categoria,
  titulo,
  descripcion,
  tipo_fuente,
  video_url,
  etiqueta_tactica,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO videos_analisis (
      id_entrenador, id_categoria, titulo, descripcion, tipo_fuente, video_url, etiqueta_tactica
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id_entrenador,
      id_categoria ? Number(id_categoria) : null,
      titulo,
      descripcion || '',
      tipo_fuente,
      video_url,
      etiqueta_tactica || 'Ofensivo',
    ]
  );
  return rows[0];
};

const deleteVideo = async (idVideo) => {
  const { rowCount } = await pool.query(
    'DELETE FROM videos_analisis WHERE id_video = $1',
    [idVideo]
  );
  return rowCount > 0;
};

const getUpcomingFixtures = async () => {
  const { rows } = await pool.query(`
    SELECT p.*, c.nombre AS categoria_nombre, c.disciplina AS categoria_disciplina
    FROM partidos_fixture p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.estado = 'Programado'
    ORDER BY p.fecha_hora ASC
  `);
  return rows;
};

const getConvocatoriasByMatch = async (idPartido = null) => {
  const params = [];
  let where = '';
  if (idPartido) {
    params.push(Number(idPartido));
    where = 'WHERE conv.id_partido = $1';
  }
  const { rows } = await pool.query(
    `SELECT
       conv.*,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       j.dorsal,
       j.posicion_habitual,
       j.estado_cuenta,
       p.rival,
       p.fecha_hora,
       p.sede,
       p.es_local,
       p.kit_designado
     FROM convocatorias conv
     JOIN jugadores j ON j.id_jugador = conv.id_jugador
     JOIN partidos_fixture p ON p.id_partido = conv.id_partido
     ${where}
     ORDER BY p.fecha_hora ASC, j.dorsal ASC`,
    params
  );
  return rows;
};

const upsertConvocatoria = async ({
  id_partido,
  id_jugador,
  estado_convocatoria = 'Convocado',
  observacion = '',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO convocatorias (id_partido, id_jugador, estado_convocatoria, observacion)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_partido, id_jugador) DO UPDATE
     SET estado_convocatoria = EXCLUDED.estado_convocatoria,
         observacion = COALESCE(NULLIF(EXCLUDED.observacion, ''), convocatorias.observacion)
     RETURNING *`,
    [Number(id_partido), Number(id_jugador), estado_convocatoria, observacion || '']
  );
  return rows[0];
};

const assignPlayerDorsal = async (idJugador, dorsal, idCategoria = null) => {
  let catId = idCategoria;
  if (!catId) {
    const pRes = await pool.query('SELECT id_categoria FROM jugadores WHERE id_jugador = $1', [idJugador]);
    if (pRes.rows.length === 0) throw new Error('Jugador no encontrado.');
    catId = pRes.rows[0].id_categoria;
  }

  if (dorsal !== null && dorsal !== undefined && String(dorsal).trim() !== '') {
    const conflictRes = await pool.query(
      `SELECT id_jugador, nombre, apellido, dorsal 
       FROM jugadores 
       WHERE id_categoria = $1 AND dorsal = $2 AND id_jugador != $3 AND activo = TRUE 
       LIMIT 1`,
      [catId, Number(dorsal), idJugador]
    );
    if (conflictRes.rows.length > 0) {
      const c = conflictRes.rows[0];
      throw new Error(`El dorsal #${dorsal} ya está asignado a ${c.nombre} ${c.apellido} en esta categoría. Selecciona un dorsal disponible.`);
    }
  }

  const dorsalVal = dorsal !== null && dorsal !== undefined && String(dorsal).trim() !== '' ? Number(dorsal) : null;
  const { rows } = await pool.query(
    `UPDATE jugadores SET dorsal = $1 WHERE id_jugador = $2 RETURNING id_jugador, id_categoria, nombre, apellido, dorsal`,
    [dorsalVal, idJugador]
  );
  return rows[0];
};

const loanPlayerToCategory = async ({ idJugador, targetIdCategoria, newDorsal }) => {
  const [jRes, targetRes] = await Promise.all([
    pool.query(
      `SELECT j.id_jugador, j.nombre, j.apellido, j.dorsal, c.id_categoria, c.nombre AS categoria_nombre, c.edad_min
       FROM jugadores j
       JOIN categorias c ON c.id_categoria = j.id_categoria
       WHERE j.id_jugador = $1`,
      [idJugador]
    ),
    pool.query(`SELECT id_categoria, nombre, edad_min FROM categorias WHERE id_categoria = $1`, [targetIdCategoria]),
  ]);

  if (jRes.rows.length === 0) throw new Error('Jugador no encontrado.');
  if (targetRes.rows.length === 0) throw new Error('Categoría destino no encontrada.');

  const player = jRes.rows[0];
  const target = targetRes.rows[0];

  if (Number(target.edad_min) < Number(player.edad_min)) {
    throw new Error(
      `Infracción reglamentaria: El atleta de ${player.categoria_nombre} no puede descender a una categoría inferior (${target.nombre}). Solo se permite préstamo a categorías superiores.`
    );
  }

  if (newDorsal !== null && newDorsal !== undefined && String(newDorsal).trim() !== '') {
    const conflictRes = await pool.query(
      `SELECT id_jugador, nombre, apellido, dorsal 
       FROM jugadores 
       WHERE id_categoria = $1 AND dorsal = $2 AND id_jugador != $3 AND activo = TRUE 
       LIMIT 1`,
      [target.id_categoria, Number(newDorsal), idJugador]
    );
    if (conflictRes.rows.length > 0) {
      const c = conflictRes.rows[0];
      throw new Error(
        `El dorsal #${newDorsal} ya está ocupado por ${c.nombre} ${c.apellido} en la categoría ${target.nombre}. Elige un número disponible.`
      );
    }
  }

  const finalDorsal = newDorsal !== null && newDorsal !== undefined && String(newDorsal).trim() !== '' ? Number(newDorsal) : null;
  const { rows } = await pool.query(
    `UPDATE jugadores 
     SET id_categoria = $1, dorsal = $2 
     WHERE id_jugador = $3 
     RETURNING id_jugador, id_categoria, nombre, apellido, dorsal`,
    [target.id_categoria, finalDorsal, idJugador]
  );
  return {
    player: rows[0],
    origen: player.categoria_nombre,
    destino: target.nombre,
  };
};

module.exports = {
  getTacticas,
  countTacticasByCategory,
  createTactica,
  updateTactica,
  deleteTactica,
  getMicrociclos,
  createMicrociclo,
  updateMicrocicloEstado,
  deleteMicrociclo,
  getTrabajosCampo,
  getTrabajoById,
  findConflictingTrabajo,
  createTrabajoCampo,
  updateTrabajoCampo,
  deleteTrabajoCampo,
  getEvaluaciones,
  createEvaluacion,
  getVideos,
  createVideo,
  deleteVideo,
  getUpcomingFixtures,
  getConvocatoriasByMatch,
  upsertConvocatoria,
  assignPlayerDorsal,
  loanPlayerToCategory,
};
