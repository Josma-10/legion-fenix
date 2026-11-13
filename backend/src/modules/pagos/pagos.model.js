const pool = require('../../config/db');

const getTransactions = async ({ idJugador = null, idRepresentante = null } = {}) => {
  const params = [];
  const conditions = [];

  if (idJugador) {
    params.push(idJugador);
    conditions.push(`t.id_jugador = $${params.length}`);
  }
  if (idRepresentante) {
    params.push(idRepresentante);
    conditions.push(`t.id_representante = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      t.*,
      j.nombre AS jugador_nombre,
      j.apellido AS jugador_apellido,
      j.estado_cuenta AS jugador_estado_cuenta,
      c.nombre AS categoria_nombre,
      c.disciplina AS categoria_disciplina,
      c.cuadrante_asignado,
      u.nombre AS representante_nombre
    FROM transacciones_jugador t
    JOIN jugadores j ON j.id_jugador = t.id_jugador
    LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
    JOIN representantes rep ON rep.id_representante = t.id_representante
    JOIN usuarios u ON u.id_usuario = rep.id_usuario
    ${whereClause}
    ORDER BY
      CASE t.estado_pago WHEN 'Vencido' THEN 1 WHEN 'Pendiente' THEN 2 ELSE 3 END,
      t.fecha_vencimiento ASC,
      t.id_transaccion DESC
  `;

  const { rows } = await pool.query(query, params);
  return rows;
};

const getTransactionById = async (idTransaccion) => {
  const { rows } = await pool.query(
    `SELECT t.*, j.id_categoria, c.cuadrante_asignado, c.disciplina AS categoria_disciplina, j.nombre AS jugador_nombre, j.apellido AS jugador_apellido
     FROM transacciones_jugador t
     JOIN jugadores j ON j.id_jugador = t.id_jugador
     LEFT JOIN categorias c ON c.id_categoria = j.id_categoria
     WHERE t.id_transaccion = $1`,
    [idTransaccion]
  );
  return rows[0] || null;
};

const createTransaction = async ({
  id_jugador,
  id_representante,
  concepto,
  descripcion_detalle,
  monto,
  fecha_emision,
  fecha_vencimiento,
  estado_pago = 'Pendiente',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO transacciones_jugador (
      id_jugador, id_representante, concepto, descripcion_detalle, monto,
      fecha_emision, fecha_vencimiento, estado_pago
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id_jugador,
      id_representante,
      concepto,
      descripcion_detalle || concepto,
      monto,
      fecha_emision || new Date().toISOString().slice(0, 10),
      fecha_vencimiento,
      estado_pago,
    ]
  );
  return rows[0];
};

const attachReceipt = async (
  idTransaccion,
  { metodo_pago, referencia_pago, telefono_pago, comprobante_url, tasa_bcv = null, monto_bs = null }
) => {
  const { rows } = await pool.query(
    `UPDATE transacciones_jugador
     SET metodo_pago = $1,
         referencia_pago = $2,
         telefono_pago = $3,
         comprobante_url = $4,
         comprobante_estado = 'En_Revision',
         tasa_bcv = COALESCE($5, tasa_bcv),
         monto_bs = COALESCE($6, monto_bs),
         fecha_pago = CURRENT_TIMESTAMP
     WHERE id_transaccion = $7
     RETURNING *`,
    [
      metodo_pago,
      referencia_pago || null,
      telefono_pago || null,
      comprobante_url,
      tasa_bcv,
      monto_bs,
      idTransaccion,
    ]
  );
  return rows[0] || null;
};

const updatePaymentStatus = async (idTransaccion, { estado_pago, comprobante_estado }) => {
  const isPaid = estado_pago === 'Pagado';
  const { rows } = await pool.query(
    `UPDATE transacciones_jugador
     SET estado_pago = $1,
         comprobante_estado = $2,
         fecha_pago = CASE WHEN $4::boolean THEN COALESCE(fecha_pago, CURRENT_TIMESTAMP) ELSE fecha_pago END
     WHERE id_transaccion = $3
     RETURNING *`,
    [estado_pago, comprobante_estado, idTransaccion, isPaid]
  );
  return rows[0] || null;
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  attachReceipt,
  updatePaymentStatus,
};
