const pool = require('../../config/db');

// ==============================================================================
// ASISTENCIAS Y ALERTAS DE INASISTENCIA
// ==============================================================================
const getAttendanceByDate = async (fecha, idCategoria = null, tipoSesion = 'Entrenamiento') => {
  const validTipo = tipoSesion === 'Juego' ? 'Juego' : 'Entrenamiento';
  const params = [fecha, validTipo];
  let catFilter = '';
  if (idCategoria) {
    params.push(Number(idCategoria));
    catFilter = `AND j.id_categoria = $${params.length}`;
  }

  const query = `
    SELECT
      j.id_jugador,
      j.nombre,
      j.apellido,
      j.dorsal,
      j.estado_cuenta,
      j.estado_cuenta AS solvencia,
      c.id_categoria,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.cuadrante_asignado,
      u_rep.nombre AS representante_nombre,
      u_rep.telefono AS representante_telefono,
      a.id_asistencia,
      a.fecha,
      COALESCE(a.tipo_sesion, $2) AS tipo_sesion,
      a.hora_checkin,
      a.hora_checkout,
      COALESCE(a.estado, 'Sin Registrar') AS estado_asistencia,
      a.observaciones,
      (les.id_lesion IS NOT NULL) AS lesionado,
      les.zona_anatomica AS lesion_zona,
      les.estado_recuperacion AS lesion_estado,
      (j.estado_cuenta <> 'Moroso' AND les.id_lesion IS NULL) AS puede_jugar
    FROM jugadores j
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    JOIN representantes rep ON rep.id_representante = j.id_representante
    JOIN usuarios u_rep ON u_rep.id_usuario = rep.id_usuario
    LEFT JOIN asistencias a
      ON a.id_jugador = j.id_jugador AND a.fecha = $1 AND a.tipo_sesion = $2
    LEFT JOIN LATERAL (
      SELECT l.id_lesion, l.zona_anatomica, l.estado_recuperacion
      FROM lesiones_clinicas l
      WHERE l.id_jugador = j.id_jugador
        AND l.estado_recuperacion IN ('En Tratamiento', 'Readaptación')
      ORDER BY l.fecha_lesion DESC, l.id_lesion DESC
      LIMIT 1
    ) les ON TRUE
    WHERE j.activo = TRUE ${catFilter}
    ORDER BY c.nombre ASC, j.apellido ASC, j.nombre ASC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const upsertAttendance = async ({
  id_jugador,
  id_categoria,
  fecha,
  tipo_sesion = 'Entrenamiento',
  cuadrante,
  action, // 'checkin' | 'checkout' | 'ausente' | 'justificado' | 'retardo'
  observaciones,
  registrado_por,
}) => {
  const validTipo = tipo_sesion === 'Juego' ? 'Juego' : 'Entrenamiento';

  if (action === 'checkout') {
    const { rows } = await pool.query(
      `UPDATE asistencias
       SET hora_checkout = CURRENT_TIMESTAMP,
           observaciones = COALESCE(NULLIF($1, ''), observaciones)
       WHERE id_jugador = $2 AND fecha = $3 AND tipo_sesion = $4
       RETURNING *`,
      [observaciones || '', id_jugador, fecha, validTipo]
    );
    return rows[0] || null;
  }

  const estadoMap = {
    checkin: 'Presente',
    ausente: 'Ausente',
    justificado: 'Justificado',
    retardo: 'Retardo',
  };
  const estado = estadoMap[action] || 'Presente';
  const isCheckin = action === 'checkin' || action === 'retardo';

  const { rows } = await pool.query(
    `INSERT INTO asistencias (
      id_jugador, id_categoria, fecha, tipo_sesion, cuadrante, hora_checkin, estado, observaciones, registrado_por
    )
    VALUES (
      $1, $2, $3, $9, $4,
      CASE WHEN $5::boolean THEN CURRENT_TIMESTAMP ELSE NULL END,
      $6, $7, $8
    )
    ON CONFLICT (id_jugador, fecha, tipo_sesion) DO UPDATE
    SET estado = EXCLUDED.estado,
        cuadrante = EXCLUDED.cuadrante,
        hora_checkin = CASE WHEN $5::boolean THEN COALESCE(asistencias.hora_checkin, CURRENT_TIMESTAMP) ELSE NULL END,
        hora_checkout = CASE WHEN $5::boolean THEN asistencias.hora_checkout ELSE NULL END,
        observaciones = COALESCE(NULLIF(EXCLUDED.observaciones, ''), asistencias.observaciones),
        registrado_por = EXCLUDED.registrado_por
    RETURNING *`,
    [
      id_jugador,
      id_categoria,
      fecha,
      cuadrante || 'Cuadrante Norte - Campo',
      isCheckin,
      estado,
      observaciones || '',
      registrado_por,
      validTipo,
    ]
  );
  return rows[0];
};

const getAbsenceAlerts = async () => {
  const query = `
    SELECT
      j.id_jugador,
      j.nombre,
      j.apellido,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      u_rep.nombre AS representante_nombre,
      u_rep.telefono AS representante_telefono,
      u_rep.email AS representante_email,
      COUNT(a.id_asistencia) FILTER (WHERE a.estado = 'Ausente' AND a.fecha >= CURRENT_DATE - INTERVAL '14 days')::int AS ausencias_14d,
      COUNT(a.id_asistencia) FILTER (WHERE a.fecha >= CURRENT_DATE - INTERVAL '14 days')::int AS sesiones_14d,
      MAX(a.fecha) FILTER (WHERE a.estado = 'Ausente') AS ultima_ausencia
    FROM jugadores j
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    JOIN representantes rep ON rep.id_representante = j.id_representante
    JOIN usuarios u_rep ON u_rep.id_usuario = rep.id_usuario
    LEFT JOIN asistencias a ON a.id_jugador = j.id_jugador
    WHERE j.activo = TRUE
    GROUP BY j.id_jugador, c.nombre, c.disciplina, u_rep.nombre, u_rep.telefono, u_rep.email
    HAVING COUNT(a.id_asistencia) FILTER (WHERE a.estado = 'Ausente' AND a.fecha >= CURRENT_DATE - INTERVAL '14 days') >= 2
    ORDER BY ausencias_14d DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// ==============================================================================
// CONTABILIDAD, CUADRANTES (PUNTO DE EQUILIBRIO) Y PEDIDOS TIENDA
// ==============================================================================
const getMovimientosContables = async () => {
  const { rows } = await pool.query(`
    SELECT m.*, u.nombre AS registrado_por_nombre
    FROM movimientos_contables m
    LEFT JOIN usuarios u ON u.id_usuario = m.registrado_por
    ORDER BY m.fecha_movimiento DESC, m.id_movimiento DESC
  `);
  return rows;
};

const createMovimientoContable = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO movimientos_contables (
      tipo, categoria_contable, concepto, monto, cuadrante, fecha_movimiento, referencia, registrado_por
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.tipo,
      data.categoria_contable,
      data.concepto,
      Number(data.monto),
      data.cuadrante || 'Administración General',
      data.fecha_movimiento || new Date().toISOString().slice(0, 10),
      data.referencia || null,
      data.registrado_por || null,
    ]
  );
  return rows[0];
};

const getQuadrantMetricsRaw = async () => {
  const query = `
    SELECT
      qc.*,
      COALESCE(atletas.total_activos, 0)::int AS atletas_activos,
      COALESCE(fin.ingresos_reales, 0)::numeric(10,2) AS ingresos_reales,
      COALESCE(fin.egresos_reales, 0)::numeric(10,2) AS egresos_reales
    FROM configuracion_cuadrantes qc
    LEFT JOIN (
      SELECT c.cuadrante_asignado, COUNT(j.id_jugador) AS total_activos
      FROM categorias c
      JOIN jugadores j ON j.id_categoria = c.id_categoria AND j.activo = TRUE
      GROUP BY c.cuadrante_asignado
    ) atletas ON atletas.cuadrante_asignado = qc.nombre_cuadrante
    LEFT JOIN (
      SELECT
        cuadrante,
        SUM(monto) FILTER (WHERE tipo = 'Ingreso') AS ingresos_reales,
        SUM(monto) FILTER (WHERE tipo = 'Egreso') AS egresos_reales
      FROM movimientos_contables
      GROUP BY cuadrante
    ) fin ON fin.cuadrante = qc.nombre_cuadrante
    ORDER BY qc.id_cuadrante ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const updateQuadrantConfig = async (idCuadrante, data) => {
  const { rows } = await pool.query(
    `UPDATE configuracion_cuadrantes
     SET costo_fijo_mensual = $1,
         costo_variable_atleta = $2,
         cuota_mensual_promedio = $3,
         capacidad_atletas = $4
     WHERE id_cuadrante = $5
     RETURNING *`,
    [
      Number(data.costo_fijo_mensual),
      Number(data.costo_variable_atleta),
      Number(data.cuota_mensual_promedio),
      Number(data.capacidad_atletas),
      idCuadrante,
    ]
  );
  return rows[0] || null;
};

const getStoreOrders = async () => {
  const { rows } = await pool.query(`
    SELECT *
    FROM pedidos_tienda
    ORDER BY creado_en DESC, id_pedido DESC
  `);
  return rows;
};

const updateStoreOrderStatus = async (idPedido, estado_pago) => {
  const { rows } = await pool.query(
    `UPDATE pedidos_tienda
     SET estado_pago = $1
     WHERE id_pedido = $2
     RETURNING *`,
    [estado_pago, idPedido]
  );
  return rows[0] || null;
};

// ==============================================================================
// GESTIÓN DE USUARIOS Y PERMISOS (EXCLUSIVO ADMINISTRADOR)
// ==============================================================================
const getUsersWithRoles = async () => {
  const { rows } = await pool.query(`
    SELECT
      u.id_usuario,
      u.nombre,
      u.email,
      u.telefono,
      u.talla_camiseta,
      u.talla_short,
      u.talla_zapatos,
      u.creado_en,
      r.id_rol,
      r.nombre AS rol,
      rep.id_representante,
      rep.documento_identidad
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    LEFT JOIN representantes rep ON rep.id_usuario = u.id_usuario
    ORDER BY u.id_usuario ASC
  `);
  return rows;
};

const createUserWithRole = async ({
  nombre,
  email,
  passwordHash,
  telefono,
  rol,
  documento_identidad,
  talla_camiseta,
  talla_short,
  talla_zapatos,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const roleRes = await client.query(
      'SELECT id_rol, nombre FROM roles WHERE nombre = $1 LIMIT 1',
      [rol]
    );
    if (roleRes.rows.length === 0) {
      throw new Error(`Rol "${rol}" no válido en el sistema.`);
    }
    const idRol = roleRes.rows[0].id_rol;

    const userRes = await client.query(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono, talla_camiseta, talla_short, talla_zapatos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_usuario, nombre, email, telefono, talla_camiseta, talla_short, talla_zapatos, creado_en`,
      [
        idRol,
        nombre.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        telefono || null,
        talla_camiseta ? String(talla_camiseta).trim() : null,
        talla_short ? String(talla_short).trim() : null,
        talla_zapatos ? String(talla_zapatos).trim() : null,
      ]
    );
    const createdUser = userRes.rows[0];

    if (rol === 'REPRESENTANTE') {
      await client.query(
        `INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
         VALUES ($1, $2, 'Representante', '', $3)
         ON CONFLICT (id_usuario) DO NOTHING`,
        [
          createdUser.id_usuario,
          documento_identidad || `REP-${createdUser.id_usuario}-${Date.now().toString().slice(-4)}`,
          telefono || '',
        ]
      );
    }

    await client.query('COMMIT');
    return { ...createdUser, rol: roleRes.rows[0].nombre };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateUserRole = async (idUsuario, rol) => {
  const roleRes = await pool.query('SELECT id_rol, nombre FROM roles WHERE nombre = $1 LIMIT 1', [
    rol,
  ]);
  if (roleRes.rows.length === 0) {
    return null;
  }
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET id_rol = $1
     WHERE id_usuario = $2
     RETURNING id_usuario, nombre, email, telefono, talla_camiseta, talla_short, talla_zapatos`,
    [roleRes.rows[0].id_rol, idUsuario]
  );
  if (rows.length === 0) return null;
  return { ...rows[0], rol: roleRes.rows[0].nombre };
};

const updateUserSizes = async (idUsuario, { talla_camiseta, talla_short, talla_zapatos }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET talla_camiseta = NULLIF($1, ''),
         talla_short = NULLIF($2, ''),
         talla_zapatos = NULLIF($3, '')
     WHERE id_usuario = $4
     RETURNING id_usuario, nombre, email, telefono, talla_camiseta, talla_short, talla_zapatos`,
    [
      talla_camiseta ? String(talla_camiseta).trim() : '',
      talla_short ? String(talla_short).trim() : '',
      talla_zapatos ? String(talla_zapatos).trim() : '',
      Number(idUsuario),
    ]
  );
  return rows[0] || null;
};

module.exports = {
  getAttendanceByDate,
  upsertAttendance,
  getAbsenceAlerts,
  getMovimientosContables,
  createMovimientoContable,
  getQuadrantMetricsRaw,
  updateQuadrantConfig,
  getStoreOrders,
  updateStoreOrderStatus,
  getUsersWithRoles,
  createUserWithRole,
  updateUserRole,
  updateUserSizes,
};
