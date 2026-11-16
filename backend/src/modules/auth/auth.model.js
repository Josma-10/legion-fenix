const pool = require('../../config/db');

const findByUsernameOrEmail = async (identifier) => {
  const query = `
    SELECT
      u.id_usuario,
      u.nombre,
      u.email,
      u.password_hash,
      u.telefono,
      r.nombre AS rol,
      rep.id_representante,
      rep.documento_identidad,
      rep.parentesco,
      rep.direccion,
      rep.telefono_emergencia
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN representantes rep ON rep.id_usuario = u.id_usuario
    WHERE LOWER(u.nombre) = LOWER($1) OR LOWER(u.email) = LOWER($1)
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [identifier]);
  return rows[0] || null;
};

const findById = async (idUsuario) => {
  const query = `
    SELECT
      u.id_usuario,
      u.nombre,
      u.email,
      u.telefono,
      u.creado_en,
      r.nombre AS rol,
      rep.id_representante,
      rep.documento_identidad,
      rep.parentesco,
      rep.direccion,
      rep.telefono_emergencia
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN representantes rep ON rep.id_usuario = u.id_usuario
    WHERE u.id_usuario = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [idUsuario]);
  return rows[0] || null;
};

const createRepresentativeUser = async ({
  nombre,
  email,
  passwordHash,
  telefono,
  documento_identidad,
  parentesco,
  direccion,
  telefono_emergencia,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleRes = await client.query(
      "SELECT id_rol FROM roles WHERE nombre = 'REPRESENTANTE' LIMIT 1"
    );
    const idRol = roleRes.rows[0].id_rol;

    const userRes = await client.query(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre, email, telefono`,
      [idRol, nombre, email, passwordHash, telefono || null]
    );
    const user = userRes.rows[0];

    const repRes = await client.query(
      `INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_representante, documento_identidad, parentesco, direccion, telefono_emergencia`,
      [
        user.id_usuario,
        documento_identidad,
        parentesco || 'Representante',
        direccion || '',
        telefono_emergencia || telefono || '',
      ]
    );

    await client.query('COMMIT');
    return {
      ...user,
      rol: 'REPRESENTANTE',
      ...repRes.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createAdultAthleteUser = async ({
  nombre,
  apellido,
  nombreCompleto,
  email,
  passwordHash,
  telefono,
  dni_cedula,
  fecha_nacimiento,
  genero,
  estatura_m,
  peso_kg,
  foto_url,
  posicion_habitual,
  pierna_habil,
  id_categoria,
  categoriaNombre,
  disciplinaNombre,
  metodo_pago,
  referencia_bancaria,
  telefono_pago,
  comprobante_url,
  tasa_bcv = null,
  monto_bs = null,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleRes = await client.query(
      "SELECT id_rol FROM roles WHERE nombre = 'ATLETA' LIMIT 1"
    );
    if (roleRes.rows.length === 0) {
      throw new Error("El rol 'ATLETA' no está inicializado en la base de datos.");
    }
    const idRol = roleRes.rows[0].id_rol;

    const userRes = await client.query(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre, email, telefono`,
      [idRol, nombreCompleto, email, passwordHash, telefono]
    );
    const user = userRes.rows[0];

    const repRes = await client.query(
      `INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
       VALUES ($1, $2, 'Titular (Mayor de Edad)', 'Autoregistro Adulto', $3)
       RETURNING id_representante, documento_identidad, parentesco, direccion, telefono_emergencia`,
      [user.id_usuario, dni_cedula, telefono]
    );
    const rep = repRes.rows[0];

    const jugadorRes = await client.query(
      `INSERT INTO jugadores (
        id_representante, id_categoria, nombre, apellido, fecha_nacimiento,
        dni_cedula, genero, foto_url, posicion_habitual, pierna_habil, estado_cuenta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendiente')
      RETURNING *`,
      [
        rep.id_representante,
        id_categoria,
        nombre,
        apellido,
        fecha_nacimiento,
        dni_cedula,
        genero || 'Masculino',
        foto_url,
        posicion_habitual,
        pierna_habil,
      ]
    );
    const player = jugadorRes.rows[0];

    await client.query(
      `INSERT INTO fichas_medicas (
        id_jugador, grupo_sanguineo, alergias, condiciones_cardiacas,
        evaluacion_podologica, peso_kg, altura_m,
        contacto_emergencia_nombre, contacto_emergencia_telefono, seguro_medico_poliza, fecha_ultima_revision
      )
      VALUES ($1, 'O+', 'Por declarar', 'Sin alteraciones declaradas', 'Pendiente evaluación', $2, $3, $4, $5, 'Autoregistro Mayor de Edad', CURRENT_DATE)`,
      [player.id_jugador, peso_kg, estatura_m, nombreCompleto, telefono]
    );

    await client.query(
      `INSERT INTO uniformes_asignados (
        id_jugador, temporada, talla_camiseta, talla_short,
        kit_titular_color, kit_alternativo_color, entregado
      )
      VALUES ($1, '2026-2027', 'M', 'M', 'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto', 'Rojo y Blanco', FALSE)`,
      [player.id_jugador]
    );

    await client.query(
      `INSERT INTO consentimientos_legales (
        id_jugador, id_representante, uso_imagen, exoneracion_medica, firma_representante
      )
      VALUES ($1, $2, TRUE, TRUE, $3)`,
      [player.id_jugador, rep.id_representante, nombreCompleto]
    );

    const txRes = await client.query(
      `INSERT INTO transacciones_jugador (
        id_jugador, id_representante, concepto, descripcion_detalle, monto,
        fecha_emision, fecha_vencimiento, estado_pago, metodo_pago, referencia_pago,
        telefono_pago, comprobante_url, comprobante_estado, tasa_bcv, monto_bs, fecha_pago
      )
      VALUES (
        $1, $2, 'Inscripcion', $3, 35.00,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'Pendiente', $4, $5,
        $6, $7, 'En_Revision', $8, $9, CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        player.id_jugador,
        rep.id_representante,
        `Inscripción Adulto (${disciplinaNombre} - ${categoriaNombre})`,
        metodo_pago || 'Pago Móvil',
        referencia_bancaria,
        telefono_pago,
        comprobante_url,
        tasa_bcv,
        monto_bs,
      ]
    );

    await client.query('COMMIT');
    return {
      user: {
        ...user,
        rol: 'ATLETA',
        ...rep,
      },
      player,
      transaction: txRes.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createMinorWithRepresentativeUser = async ({
  repNombre,
  repEmail,
  passwordHash,
  repTelefono,
  repDni,
  repParentesco,
  repDireccion,
  atletaNombre,
  atletaApellido,
  atletaDni,
  atletaFechaNacimiento,
  atletaGenero,
  estatura_m,
  peso_kg,
  talla_camiseta = '10',
  talla_short = '10',
  foto_url,
  posicion_habitual,
  pierna_habil,
  id_categoria,
  categoriaNombre,
  disciplinaNombre,
  metodo_pago,
  referencia_bancaria,
  telefono_pago,
  comprobante_url,
  tasa_bcv = null,
  monto_bs = null,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleRes = await client.query(
      "SELECT id_rol FROM roles WHERE nombre = 'REPRESENTANTE' LIMIT 1"
    );
    if (roleRes.rows.length === 0) {
      throw new Error("El rol 'REPRESENTANTE' no está inicializado en la base de datos.");
    }
    const idRol = roleRes.rows[0].id_rol;

    const userRes = await client.query(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre, email, telefono`,
      [idRol, repNombre, repEmail, passwordHash, repTelefono]
    );
    const user = userRes.rows[0];

    const repRes = await client.query(
      `INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_representante, documento_identidad, parentesco, direccion, telefono_emergencia`,
      [user.id_usuario, repDni, repParentesco || 'Representante', repDireccion || '', repTelefono]
    );
    const rep = repRes.rows[0];

    const jugadorRes = await client.query(
      `INSERT INTO jugadores (
        id_representante, id_categoria, nombre, apellido, fecha_nacimiento,
        dni_cedula, genero, foto_url, posicion_habitual, pierna_habil, estado_cuenta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendiente')
      RETURNING *`,
      [
        rep.id_representante,
        id_categoria,
        atletaNombre,
        atletaApellido,
        atletaFechaNacimiento,
        atletaDni,
        atletaGenero || 'Masculino',
        foto_url,
        posicion_habitual || 'Delantero Centro',
        pierna_habil || 'Derecho',
      ]
    );
    const player = jugadorRes.rows[0];

    await client.query(
      `INSERT INTO fichas_medicas (
        id_jugador, grupo_sanguineo, alergias, condiciones_cardiacas,
        evaluacion_podologica, peso_kg, altura_m,
        contacto_emergencia_nombre, contacto_emergencia_telefono, seguro_medico_poliza, fecha_ultima_revision
      )
      VALUES ($1, 'O+', 'Por declarar', 'Sin alteraciones declaradas', 'Pendiente evaluación', $2, $3, $4, $5, 'Registro Representante (Menor)', CURRENT_DATE)`,
      [player.id_jugador, peso_kg || 40, estatura_m || 1.45, repNombre, repTelefono]
    );

    await client.query(
      `INSERT INTO uniformes_asignados (
        id_jugador, temporada, talla_camiseta, talla_short,
        kit_titular_color, kit_alternativo_color, entregado
      )
      VALUES ($1, '2026-2027', $2, $3, 'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto', 'Rojo y Blanco', FALSE)`,
      [player.id_jugador, talla_camiseta || '10', talla_short || '10']
    );

    await client.query(
      `INSERT INTO consentimientos_legales (
        id_jugador, id_representante, uso_imagen, exoneracion_medica, firma_representante
      )
      VALUES ($1, $2, TRUE, TRUE, $3)`,
      [player.id_jugador, rep.id_representante, repNombre]
    );

    const txRes = await client.query(
      `INSERT INTO transacciones_jugador (
        id_jugador, id_representante, concepto, descripcion_detalle, monto,
        fecha_emision, fecha_vencimiento, estado_pago, metodo_pago, referencia_pago,
        telefono_pago, comprobante_url, comprobante_estado, tasa_bcv, monto_bs, fecha_pago
      )
      VALUES (
        $1, $2, 'Inscripcion', $3, 15.00,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'Pendiente', $4, $5,
        $6, $7, 'En_Revision', $8, $9, CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        player.id_jugador,
        rep.id_representante,
        `Inscripción Menor (${disciplinaNombre} - ${categoriaNombre})`,
        metodo_pago || 'Pago Móvil',
        referencia_bancaria,
        telefono_pago,
        comprobante_url,
        tasa_bcv,
        monto_bs,
      ]
    );

    await client.query('COMMIT');
    return {
      user: {
        ...user,
        rol: 'REPRESENTANTE',
        ...rep,
      },
      player,
      transaction: txRes.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  findByUsernameOrEmail,
  findById,
  createRepresentativeUser,
  createAdultAthleteUser,
  createMinorWithRepresentativeUser,
};
