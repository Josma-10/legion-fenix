const pool = require('../../config/db');
const pagosModel = require('./pagos.model');

const recalculatePlayerAccountStatus = async (idJugador) => {
  const { rows } = await pool.query(
    `SELECT estado_pago FROM transacciones_jugador WHERE id_jugador = $1`,
    [idJugador]
  );

  let nuevoEstado = 'Solvente';
  const hasVencido = rows.some((r) => r.estado_pago === 'Vencido');
  const hasPendiente = rows.some((r) => r.estado_pago === 'Pendiente');

  if (hasVencido) {
    nuevoEstado = 'Moroso';
  } else if (hasPendiente) {
    nuevoEstado = 'Pendiente';
  }

  await pool.query(
    `UPDATE jugadores SET estado_cuenta = $1 WHERE id_jugador = $2`,
    [nuevoEstado, idJugador]
  );

  if (nuevoEstado === 'Moroso') {
    await pool.query(
      `UPDATE convocatorias
       SET estado_convocatoria = 'Bloqueado_Morosidad',
           observacion = 'Bloqueado automáticamente por saldo moroso vencido'
       WHERE id_jugador = $1 AND estado_convocatoria IN ('Convocado', 'Confirmado')`,
      [idJugador]
    );
  } else {
    await pool.query(
      `UPDATE convocatorias
       SET estado_convocatoria = 'Convocado',
           observacion = 'Desbloqueado tras regularización de estado de cuenta'
       WHERE id_jugador = $1 AND estado_convocatoria = 'Bloqueado_Morosidad'`,
      [idJugador]
    );
  }

  return nuevoEstado;
};

const approveTransactionPayment = async (idTransaccion, adminUserId) => {
  const tx = await pagosModel.getTransactionById(idTransaccion);
  if (!tx) return null;

  if (tx.estado_pago === 'Pagado') {
    const estadoActual = await recalculatePlayerAccountStatus(tx.id_jugador);
    return {
      transaction: tx,
      nuevoEstadoCuenta: estadoActual,
      alreadyPaid: true,
    };
  }

  const updated = await pagosModel.updatePaymentStatus(idTransaccion, {
    estado_pago: 'Pagado',
    comprobante_estado: 'Aprobado',
  });

  await pool.query(
    `INSERT INTO movimientos_contables (
      tipo, categoria_contable, concepto, monto, cuadrante, fecha_movimiento, referencia, registrado_por
    )
    VALUES ('Ingreso', $1, $2, $3, $4, CURRENT_DATE, $5, $6)`,
    [
      tx.concepto,
      `Pago ${tx.descripcion_detalle || tx.concepto} - ${tx.jugador_nombre} ${tx.jugador_apellido}`,
      Number(tx.monto),
      tx.cuadrante_asignado || 'Administración General',
      tx.referencia_pago || `TX-${tx.id_transaccion}`,
      adminUserId || null,
    ]
  );

  const nuevoEstadoCuenta = await recalculatePlayerAccountStatus(tx.id_jugador);

  return {
    transaction: updated,
    nuevoEstadoCuenta,
  };
};

const rejectTransactionReceipt = async (idTransaccion) => {
  const tx = await pagosModel.getTransactionById(idTransaccion);
  if (!tx) return null;

  const isOverdue = new Date(tx.fecha_vencimiento) < new Date();
  const updated = await pagosModel.updatePaymentStatus(idTransaccion, {
    estado_pago: isOverdue ? 'Vencido' : 'Pendiente',
    comprobante_estado: 'Rechazado',
  });

  const nuevoEstadoCuenta = await recalculatePlayerAccountStatus(tx.id_jugador);
  return { transaction: updated, nuevoEstadoCuenta };
};

module.exports = {
  recalculatePlayerAccountStatus,
  approveTransactionPayment,
  rejectTransactionReceipt,
};
