const pagosModel = require('./pagos.model');
const pagosService = require('./pagos.service');
const representantesModel = require('../representantes/representantes.model');
const bcvService = require('../../services/bcvService');
const { getUploadedFileUrl } = require('../../config/cloudinary');

exports.getBcvRate = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const bcv = await bcvService.getBcvRate({ forceRefresh });
    return res.json(bcv);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const idJugador = req.query.id_jugador ? Number(req.query.id_jugador) : null;
    const isAdmin = ['ADMINISTRADOR', 'ANALISTA_ADMIN'].includes(req.user.rol);
    const [transactions, bcv] = await Promise.all([
      pagosModel.getTransactions({
        idJugador,
        idRepresentante: isAdmin ? null : req.user.id_representante,
      }),
      bcvService.getBcvRate(),
    ]);
    return res.json({ transactions, bcv });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createCharge = async (req, res) => {
  const { id_jugador, concepto, descripcion_detalle, monto, fecha_vencimiento, estado_pago } = req.body;
  if (!id_jugador || !concepto || !monto || !fecha_vencimiento) {
    return res.status(400).json({ error: 'Jugador, concepto, monto y fecha de vencimiento son obligatorios.' });
  }

  try {
    const player = await representantesModel.getPlayerById(Number(id_jugador));
    if (!player) {
      return res.status(404).json({ error: 'Atleta no encontrado.' });
    }

    const tx = await pagosModel.createTransaction({
      id_jugador: player.id_jugador,
      id_representante: player.id_representante,
      concepto,
      descripcion_detalle,
      monto: Number(monto),
      fecha_vencimiento,
      estado_pago: estado_pago || 'Pendiente',
    });

    const nuevoEstadoCuenta = await pagosService.recalculatePlayerAccountStatus(player.id_jugador);

    const notificationService = require('../../services/notificationService');
    notificationService
      .syncAndDispatchUpcomingPaymentReminders({ idRepresentante: player.id_representante })
      .catch(() => {});

    return res.status(201).json({
      message: 'Cargo generado exitosamente.',
      transaction: tx,
      nuevoEstadoCuenta,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadReceipt = async (req, res) => {
  const idTransaccion = Number(req.params.id);
  const { metodo_pago, referencia_pago, telefono_pago } = req.body;

  try {
    const existing = await pagosModel.getTransactionById(idTransaccion);
    if (!existing) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }

    if (
      (req.user.rol === 'REPRESENTANTE' || req.user.rol === 'ATLETA') &&
      existing.id_representante !== req.user.id_representante
    ) {
      return res.status(403).json({ error: 'No autorizado para subir comprobante a esta factura.' });
    }

    const comprobanteUrl = req.file
      ? getUploadedFileUrl(req, req.file)
      : req.body.comprobante_url || null;

    if (!comprobanteUrl) {
      return res.status(400).json({ error: 'Debe adjuntar un archivo de comprobante (PDF, PNG o JPG).' });
    }

    const bcv = await bcvService.getBcvRate();
    const converted = bcvService.convertUsdToBs(existing.monto, bcv);

    const updated = await pagosModel.attachReceipt(idTransaccion, {
      metodo_pago: metodo_pago || 'Transferencia Bancaria',
      referencia_pago,
      telefono_pago,
      comprobante_url: comprobanteUrl,
      tasa_bcv: converted.tasa_bcv,
      monto_bs: converted.monto_bs,
    });

    return res.json({
      message: 'Comprobante cargado con tasa BCV oficial y enviado a validación administrativa.',
      transaction: updated,
      bcv,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.approvePayment = async (req, res) => {
  const idTransaccion = Number(req.params.id);
  try {
    const result = await pagosService.approveTransactionPayment(idTransaccion, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }
    return res.json({
      message: 'Pago validado y aprobado. Semáforo e ingreso contable actualizados.',
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.rejectPayment = async (req, res) => {
  const idTransaccion = Number(req.params.id);
  try {
    const result = await pagosService.rejectTransactionReceipt(idTransaccion);
    if (!result) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }
    return res.json({
      message: 'Comprobante rechazado. Se solicitó nuevo soporte al representante.',
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
