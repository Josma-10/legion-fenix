const express = require('express');
const router = express.Router();
const pagosController = require('./pagos.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');
const { uploadCloud } = require('../../config/cloudinary');

router.get(
  '/bcv-rate',
  verifyToken,
  checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN', 'REPRESENTANTE', 'ATLETA', 'ENTRENADOR', 'FISIO']),
  pagosController.getBcvRate
);
router.get('/', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ANALISTA_ADMIN']), pagosController.listTransactions);
router.post('/', verifyToken, checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), pagosController.createCharge);
router.post(
  '/:id/receipt',
  verifyToken,
  checkRole(['REPRESENTANTE', 'ATLETA']),
  uploadCloud.single('comprobante'),
  pagosController.uploadReceipt
);
router.patch('/:id/approve', verifyToken, checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), pagosController.approvePayment);
router.patch('/:id/reject', verifyToken, checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']), pagosController.rejectPayment);

module.exports = router;
