const adminModel = require('./admin.model');
const adminService = require('./admin.service');
const pagosModel = require('../pagos/pagos.model');
const categoriasModel = require('../categorias/categorias.model');

exports.getAttendance = async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD).' });
  }

  let idCategoria = null;
  if (req.query.id_categoria !== undefined && req.query.id_categoria !== null && req.query.id_categoria !== '') {
    idCategoria = Number(req.query.id_categoria);
    if (isNaN(idCategoria) || idCategoria <= 0) {
      return res.status(400).json({ error: 'Parámetro id_categoria debe ser un entero positivo válido.' });
    }
  }

  const tipoSesion = req.query.tipo_sesion === 'Juego' ? 'Juego' : 'Entrenamiento';

  try {
    const [records, alerts, categories] = await Promise.all([
      adminModel.getAttendanceByDate(fecha, idCategoria, tipoSesion),
      adminModel.getAbsenceAlerts(),
      categoriasModel.getCategories(),
    ]);

    return res.json({
      fecha,
      tipo_sesion: tipoSesion,
      records,
      alerts,
      categories,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.recordAttendance = async (req, res) => {
  const { id_jugador, id_categoria, fecha, tipo_sesion, cuadrante, action, observaciones } = req.body;
  const numJugador = Number(id_jugador);
  if (!numJugador || isNaN(numJugador) || !action) {
    return res.status(400).json({ error: 'Jugador y acción de asistencia válidos requeridos.' });
  }

  try {
    const attendance = await adminModel.upsertAttendance({
      id_jugador: Number(id_jugador),
      id_categoria: id_categoria ? Number(id_categoria) : null,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      tipo_sesion: tipo_sesion === 'Juego' ? 'Juego' : 'Entrenamiento',
      cuadrante: cuadrante || 'Cuadrante Norte - Campo',
      action,
      observaciones,
      registrado_por: req.user.id,
    });

    if (!attendance) {
      return res.status(400).json({ error: 'Debe realizar Check-In antes de registrar Check-Out.' });
    }

    const alerts = await adminModel.getAbsenceAlerts();
    return res.json({ message: 'Asistencia registrada.', attendance, alerts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getFinanceDashboard = async (_req, res) => {
  try {
    const bcvService = require('../../services/bcvService');
    const [finance, transactions, storeOrders, bcv] = await Promise.all([
      adminService.getFinancialSummaryAndBreakEven(),
      pagosModel.getTransactions(),
      adminModel.getStoreOrders(),
      bcvService.getBcvRate(),
    ]);
    return res.json({
      ...finance,
      transactions,
      storeOrders,
      bcv,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateStoreOrder = async (req, res) => {
  const idPedido = Number(req.params.id);
  const { estado_pago } = req.body;
  if (!['Verificado', 'En_Revision', 'Rechazado'].includes(estado_pago)) {
    return res.status(400).json({ error: 'Estado de pedido inválido.' });
  }
  try {
    const updated = await adminModel.updateStoreOrderStatus(idPedido, estado_pago);
    if (!updated) return res.status(404).json({ error: 'Pedido de tienda no encontrado.' });
    return res.json({ message: 'Estado del pedido actualizado.', pedido: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.addMovimiento = async (req, res) => {
  const { tipo, categoria_contable, concepto, monto, cuadrante, fecha_movimiento, referencia } = req.body;
  if (!tipo || !categoria_contable || !concepto || !monto) {
    return res.status(400).json({ error: 'Tipo, categoría, concepto y monto son obligatorios.' });
  }

  try {
    const movimiento = await adminModel.createMovimientoContable({
      tipo,
      categoria_contable,
      concepto,
      monto,
      cuadrante,
      fecha_movimiento,
      referencia,
      registrado_por: req.user.id,
    });
    const finance = await adminService.getFinancialSummaryAndBreakEven();
    return res.status(201).json({
      message: 'Movimiento contable registrado.',
      movimiento,
      ...finance,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateQuadrant = async (req, res) => {
  const idCuadrante = Number(req.params.id);
  try {
    const updated = await adminModel.updateQuadrantConfig(idCuadrante, req.body);
    if (!updated) return res.status(404).json({ error: 'Cuadrante no encontrado.' });
    const finance = await adminService.getFinancialSummaryAndBreakEven();
    return res.json({
      message: 'Parámetros de punto de equilibrio actualizados.',
      quadrant: updated,
      ...finance,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.listUsers = async (_req, res) => {
  try {
    const users = await adminModel.getUsersWithRoles();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { validatePasswordPolicy } = require('../auth/auth.controller');
  const {
    nombre,
    email,
    password,
    telefono,
    rol,
    documento_identidad,
    talla_camiseta,
    talla_short,
    talla_zapatos,
  } = req.body;
  const allowedRoles = ['ADMINISTRADOR', 'ANALISTA_ADMIN', 'ENTRENADOR', 'FISIO', 'REPRESENTANTE'];

  if (!nombre || !email || !password || !allowedRoles.includes(rol)) {
    return res.status(400).json({
      error: 'Nombre, correo electrónico, contraseña y rol institucional válido son obligatorios.',
    });
  }

  const pwdCheck = validatePasswordPolicy(password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ error: pwdCheck.error });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await adminModel.createUserWithRole({
      nombre,
      email,
      passwordHash,
      telefono,
      rol,
      documento_identidad,
      talla_camiseta,
      talla_short,
      talla_zapatos,
    });
    return res.status(201).json({
      message: `Usuario ${created.nombre} creado con rol ${created.rol}.`,
      user: created,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico o documento ya está registrado.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const idUsuario = Number(req.params.id);
  const { rol } = req.body;
  const allowedRoles = ['ADMINISTRADOR', 'ANALISTA_ADMIN', 'ENTRENADOR', 'FISIO', 'REPRESENTANTE', 'ATLETA'];
  if (!allowedRoles.includes(rol)) {
    return res.status(400).json({ error: 'Rol no válido.' });
  }
  if (idUsuario === req.user.id && rol !== 'ADMINISTRADOR') {
    return res.status(400).json({ error: 'No puedes degradar tu propio usuario Administrador activo.' });
  }
  try {
    const updated = await adminModel.updateUserRole(idUsuario, rol);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ message: `Rol actualizado a ${updated.rol}.`, user: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateUserSizes = async (req, res) => {
  const idUsuario = Number(req.params.id);
  const { talla_camiseta, talla_short, talla_zapatos } = req.body;
  try {
    const updated = await adminModel.updateUserSizes(idUsuario, {
      talla_camiseta,
      talla_short,
      talla_zapatos,
    });
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({
      message: `Tallas de ${updated.nombre} actualizadas correctamente.`,
      user: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getNotificationsStatus = async (_req, res) => {
  const notificationService = require('../../services/notificationService');
  const whatsappQrService = require('../../services/whatsappQrService');
  return res.json({
    whatsappQr: whatsappQrService.getWhatsAppQrStatus(),
    whatsappConfig: notificationService.isWhatsAppConfigured(),
    smtp: notificationService.getSmtpConfigSummary(),
  });
};

exports.connectWhatsAppQr = async (req, res) => {
  const whatsappQrService = require('../../services/whatsappQrService');
  const forceNew = Boolean(req.body?.forceNew);
  try {
    const status = await whatsappQrService.initWhatsAppQr({ forceNew });
    return res.json({ whatsappQr: status });
  } catch (error) {
    return res.status(500).json({ error: error.message, whatsappQr: whatsappQrService.getWhatsAppQrStatus() });
  }
};

exports.disconnectWhatsAppQr = async (_req, res) => {
  const whatsappQrService = require('../../services/whatsappQrService');
  try {
    const status = await whatsappQrService.disconnectWhatsAppQr({ clearSession: true });
    return res.json({ message: 'Sesión de WhatsApp desvinculada.', whatsappQr: status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.configureSmtp = async (req, res) => {
  const notificationService = require('../../services/notificationService');
  try {
    const result = await notificationService.saveAndVerifySmtpConfig(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({
      message: 'Correo SMTP verificado y guardado correctamente en backend/.env.',
      smtp: result.smtp,
    });
  } catch (error) {
    return res.status(400).json({
      error: `No se pudo autenticar con el servidor SMTP: ${error.message}. Verifica tu App Password de Google (16 caracteres).`,
    });
  }
};

exports.sendNotificationTest = async (req, res) => {
  const notificationService = require('../../services/notificationService');
  const { toEmail, toPhone, subject, message } = req.body || {};
  if (!message || (!toEmail && !toPhone)) {
    return res.status(400).json({
      error: 'Debes indicar al menos un destinatario (correo o teléfono) y el texto del mensaje.',
    });
  }
  try {
    const [emailResult, waResult] = await Promise.all([
      toEmail
        ? notificationService.sendEmail({
            to: toEmail.trim(),
            subject: subject || 'Legión Fénix FC — Prueba de Notificación',
            text: message,
          })
        : Promise.resolve({ skipped: true, status: 'No_Solicitado' }),
      toPhone
        ? notificationService.sendWhatsApp({
            to: toPhone.trim(),
            message,
          })
        : Promise.resolve({ skipped: true, status: 'No_Solicitado' }),
    ]);

    return res.json({
      message: 'Prueba ejecutada.',
      emailResult,
      waResult,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.dispatchPrueba2Reminder = async (_req, res) => {
  const notificationService = require('../../services/notificationService');
  try {
    const result = await notificationService.dispatchPrueba2Reminder();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

