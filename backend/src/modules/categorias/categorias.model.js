const pool = require('../../config/db');

const getCategories = async ({ modalidad = null, disciplina = null } = {}) => {
  const params = [];
  const conditions = [];

  if (modalidad && modalidad !== 'Todas') {
    params.push(modalidad);
    conditions.push(`c.modalidad = $${params.length}`);
  }
  if (disciplina) {
    params.push(disciplina);
    conditions.push(`c.disciplina = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      c.*,
      COUNT(DISTINCT j.id_jugador) FILTER (WHERE j.activo = TRUE)::int AS total_atletas,
      COUNT(DISTINCT p.id_partido) FILTER (WHERE p.estado = 'Programado')::int AS proximos_partidos
    FROM categorias c
    LEFT JOIN jugadores j ON j.id_categoria = c.id_categoria
    LEFT JOIN partidos_fixture p ON p.id_categoria = c.id_categoria
    ${whereClause}
    GROUP BY c.id_categoria
    ORDER BY
      CASE c.modalidad
        WHEN 'Campo' THEN 1
        WHEN 'F7' THEN 2
        WHEN 'Sala' THEN 3
        ELSE 4
      END,
      c.edad_min ASC,
      c.id_categoria ASC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const getCategoryById = async (idCategoria, { includePrivateStatus = false } = {}) => {
  const catQuery = `
    SELECT
      c.*,
      COUNT(DISTINCT j.id_jugador) FILTER (WHERE j.activo = TRUE)::int AS total_atletas
    FROM categorias c
    LEFT JOIN jugadores j ON j.id_categoria = c.id_categoria
    WHERE c.id_categoria = $1
    GROUP BY c.id_categoria
    LIMIT 1
  `;
  const { rows } = await pool.query(catQuery, [idCategoria]);
  if (rows.length === 0) return null;

  const statusSelect = includePrivateStatus ? ', j.estado_cuenta' : '';

  const [playersRes, fixturesRes] = await Promise.all([
    pool.query(
      `SELECT
        j.id_jugador,
        j.id_categoria,
        j.nombre,
        j.apellido,
        EXTRACT(YEAR FROM age(j.fecha_nacimiento))::int AS edad,
        j.dorsal,
        j.posicion_habitual,
        j.pierna_habil,
        j.genero,
        j.foto_url,
        fm.altura_m,
        fm.peso_kg,
        ev.puntaje_global,
        ev.porcentaje_global,
        ev.score_fisica,
        ev.score_tecnica,
        ev.score_coordinativa,
        ev.fisica_velocidad,
        ev.fisica_resistencia,
        ev.fisica_fuerza,
        ev.tecnica_control,
        ev.tecnica_pase,
        ev.tecnica_definicion,
        ev.coordinativa_agilidad,
        ev.coordinativa_equilibrio,
        ev.coordinativa_ritmo,
        ev.fortalezas,
        ev.debilidades,
        ev.fecha_evaluacion${statusSelect}
      FROM jugadores j
      LEFT JOIN fichas_medicas fm ON fm.id_jugador = j.id_jugador
      LEFT JOIN LATERAL (
        SELECT *
        FROM evaluaciones_jugador e
        WHERE e.id_jugador = j.id_jugador
        ORDER BY e.fecha_evaluacion DESC, e.id_evaluacion DESC
        LIMIT 1
      ) ev ON TRUE
      WHERE j.id_categoria = $1 AND j.activo = TRUE
      ORDER BY COALESCE(j.dorsal, 999) ASC, j.apellido ASC, j.nombre ASC`,
      [idCategoria]
    ),
    pool.query(
      `SELECT
        p.*,
        c.nombre AS categoria_nombre,
        c.disciplina AS categoria_disciplina
      FROM partidos_fixture p
      LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE p.id_categoria = $1
      ORDER BY p.fecha_hora ASC`,
      [idCategoria]
    ),
  ]);

  return {
    category: rows[0],
    players: playersRes.rows,
    fixtures: fixturesRes.rows,
  };
};

const createCategory = async ({
  nombre,
  disciplina,
  modalidad,
  edad_min,
  edad_max,
  cuadrante_asignado,
}) => {
  const defaultDiscMap = {
    Campo: { disciplina: 'Equipo de Fútbol Campo', cuadrante: 'Cuadrante Norte - Campo' },
    F7: { disciplina: 'Equipo de Fútbol 7', cuadrante: 'Cuadrante Sur - F7' },
    Sala: { disciplina: 'Equipo de Sala', cuadrante: 'Cancha Techada - Sala' },
  };
  const defaults = defaultDiscMap[modalidad] || defaultDiscMap.Campo;

  const { rows } = await pool.query(
    `INSERT INTO categorias (nombre, disciplina, modalidad, edad_min, edad_max, cuadrante_asignado)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      nombre.trim(),
      disciplina || defaults.disciplina,
      modalidad,
      Number(edad_min ?? 4),
      Number(edad_max ?? 99),
      cuadrante_asignado || defaults.cuadrante,
    ]
  );
  return rows[0];
};

const updateCategory = async (idCategoria, data) => {
  const { rows } = await pool.query(
    `UPDATE categorias
     SET nombre = COALESCE(NULLIF($1, ''), nombre),
         disciplina = COALESCE(NULLIF($2, ''), disciplina),
         modalidad = COALESCE(NULLIF($3, ''), modalidad),
         edad_min = COALESCE($4::int, edad_min),
         edad_max = COALESCE($5::int, edad_max),
         cuadrante_asignado = COALESCE(NULLIF($6, ''), cuadrante_asignado)
     WHERE id_categoria = $7
     RETURNING *`,
    [
      data.nombre ? String(data.nombre).trim() : '',
      data.disciplina ? String(data.disciplina).trim() : '',
      data.modalidad ? String(data.modalidad).trim() : '',
      data.edad_min !== undefined && data.edad_min !== '' ? Number(data.edad_min) : null,
      data.edad_max !== undefined && data.edad_max !== '' ? Number(data.edad_max) : null,
      data.cuadrante_asignado ? String(data.cuadrante_asignado).trim() : '',
      idCategoria,
    ]
  );
  return rows[0] || null;
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
};
