const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const fisioController = require('../fisio/fisio.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.use(verifyToken);

// Asistencias, finanzas operativas y pedidos tienda (ADMINISTRADOR y ANALISTA_ADMIN)
router.get('/attendance', checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), adminController.getAttendance);
router.post('/attendance', checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), adminController.recordAttendance);

router.get('/finance', checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), adminController.getFinanceDashboard);
router.post('/finance/movimientos', checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), adminController.addMovimiento);
router.patch('/store-orders/:id', checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), adminController.updateStoreOrder);

// Configuración estructural de cuadrantes, usuarios/roles y notificaciones QR/SMTP (EXCLUSIVO ADMINISTRADOR)
router.patch('/finance/cuadrantes/:id', checkRole(['ADMINISTRADOR']), adminController.updateQuadrant);
router.get('/users', checkRole(['ADMINISTRADOR']), adminController.listUsers);
router.post('/users', checkRole(['ADMINISTRADOR']), adminController.createUser);
router.patch('/users/:id/role', checkRole(['ADMINISTRADOR']), adminController.updateUserRole);
router.patch('/users/:id/sizes', checkRole(['ADMINISTRADOR']), adminController.updateUserSizes);

router.get('/notifications/status', checkRole(['ADMINISTRADOR']), adminController.getNotificationsStatus);
router.post('/notifications/whatsapp-qr/connect', checkRole(['ADMINISTRADOR']), adminController.connectWhatsAppQr);
router.post('/notifications/whatsapp-qr/disconnect', checkRole(['ADMINISTRADOR']), adminController.disconnectWhatsAppQr);
router.post('/notifications/smtp', checkRole(['ADMINISTRADOR']), adminController.configureSmtp);
router.post('/notifications/test', checkRole(['ADMINISTRADOR']), adminController.sendNotificationTest);
router.post('/notifications/dispatch-prueba2', checkRole(['ADMINISTRADOR']), adminController.dispatchPrueba2Reminder);

// Alias retrocompatible hacia el módulo independiente de Fisioterapia
router.get('/clinical', checkRole(['ADMINISTRADOR', 'FISIO', 'ENTRENADOR']), fisioController.getDashboard);
router.post('/clinical/injuries', checkRole(['ADMINISTRADOR', 'FISIO', 'ENTRENADOR']), fisioController.createInjury);
router.patch('/clinical/injuries/:id', checkRole(['ADMINISTRADOR', 'FISIO']), fisioController.updateInjury);

module.exports = router;
